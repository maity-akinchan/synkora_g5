import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: return current user's default team
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { defaultTeam: { select: { id: true, name: true } } as any },
        } as any);

        return NextResponse.json({ defaultTeamId: user?.defaultTeamId || null, defaultTeam: (user as any)?.defaultTeam || null });
    } catch (err) {
        console.error("Error fetching default team:", err);
        return NextResponse.json({ error: "Failed to fetch default team" }, { status: 500 });
    }
}

// POST: set default team (body: { teamId })
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const teamId = body?.teamId;
        if (!teamId) {
            return NextResponse.json({ error: "Missing teamId" }, { status: 400 });
        }

        // verify membership
        const member = await prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId, userId: session.user.id } },
        });

        if (!member) {
            return NextResponse.json({ error: "You are not a member of this team" }, { status: 403 });
        }

        const user = await prisma.user.update({ where: { id: session.user.id }, data: { defaultTeamId: teamId } });
        return NextResponse.json({ success: true, defaultTeamId: user.defaultTeamId });
    } catch (err) {
        console.error("Error setting default team:", err);
        return NextResponse.json({ error: "Failed to set default team" }, { status: 500 });
    }
}

// DELETE: clear default team
export async function DELETE() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.update({ where: { id: session.user.id }, data: { defaultTeamId: null } });
        return NextResponse.json({ success: true, defaultTeamId: user.defaultTeamId });
    } catch (err) {
        console.error("Error clearing default team:", err);
        return NextResponse.json({ error: "Failed to clear default team" }, { status: 500 });
    }
}
