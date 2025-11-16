import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const spreadsheetSchema = z.object({
    data: z.any(),
});

// GET /api/projects/[id]/spreadsheet - Load spreadsheet data
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const project = await prisma.project.findUnique({
            where: { id: params.id },
            include: {
                spreadsheet: true,
                team: {
                    include: {
                        members: {
                            where: { userId: session.user.id },
                        },
                    },
                },
            },
        });

        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

        const hasAccess = !project.teamId
            ? project.createdById === session.user.id
            : project.team?.members && project.team.members.length > 0;

        if (!hasAccess) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

        if (project.spreadsheet) {
            return NextResponse.json({ id: project.spreadsheet.id, data: project.spreadsheet.data });
        }

        return NextResponse.json({ data: null });
    } catch (err) {
        console.error('Error loading spreadsheet:', err);
        return NextResponse.json({ error: 'Failed to load spreadsheet' }, { status: 500 });
    }
}

// POST /api/projects/[id]/spreadsheet - Save spreadsheet data
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const project = await prisma.project.findUnique({
            where: { id: params.id },
            include: {
                team: {
                    include: {
                        members: {
                            where: { userId: session.user.id },
                        },
                    },
                },
            },
        });

        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

        // Check write permissions
        let hasWriteAccess = false;
        if (!project.teamId) {
            hasWriteAccess = project.createdById === session.user.id;
        } else {
            const member = project.team?.members[0];
            hasWriteAccess = !!member && (member.role === 'OWNER' || member.role === 'EDITOR');
        }

        if (!hasWriteAccess) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });

        const body = await request.json();
        const parsed = spreadsheetSchema.parse(body);

        const spreadsheet = await prisma.spreadsheet.upsert({
            where: { projectId: params.id },
            update: { data: parsed.data },
            create: { projectId: params.id, data: parsed.data },
        });

        return NextResponse.json({ id: spreadsheet.id, message: 'Spreadsheet saved' });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid data', details: err.issues }, { status: 400 });
        }
        console.error('Error saving spreadsheet:', err);
        return NextResponse.json({ error: 'Failed to save spreadsheet' }, { status: 500 });
    }
}
