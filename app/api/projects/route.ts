import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDefaultTeam } from "@/lib/auth-utils";
import { z } from "zod";

const createProjectSchema = z.object({
    name: z.string().min(1, "Project name is required").max(100),
    description: z.string().max(500).optional(),
    teamId: z.string().optional(),
});

// GET /api/projects - List user's projects
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
        // If user has a default team set, show only projects under that team
        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { defaultTeamId: true } });

        if (user?.defaultTeamId) {
            const projects = await prisma.project.findMany({
                where: { teamId: user.defaultTeamId },
                include: {
                    team: {
                        include: {
                            members: {
                                select: { id: true },
                            },
                        },
                    },
                    _count: { select: { tasks: true } },
                },
                orderBy: { updatedAt: "desc" },
            });
            return NextResponse.json(projects);
        }

        // No default team — show projects from all teams the user is a member of and personal projects
        const teamMemberships = await prisma.teamMember.findMany({ where: { userId: session.user.id }, select: { teamId: true } });
        const teamIds = teamMemberships.map((tm: { teamId: string }) => tm.teamId);

        const projects = await prisma.project.findMany({
            where: {
                OR: [
                    { teamId: { in: teamIds } },
                    { teamId: null, createdById: session.user.id },
                ],
            },
            include: {
                team: { include: { members: { select: { id: true } } } },
                _count: { select: { tasks: true } },
            },
            orderBy: { updatedAt: "desc" },
        });

        return NextResponse.json(projects);
    } catch (error) {
        console.error("Error fetching projects:", error);
        return NextResponse.json(
            { error: "Failed to fetch projects" },
            { status: 500 }
        );
    }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validatedData = createProjectSchema.parse(body);

        // Normalize empty string to undefined
        let teamId = validatedData.teamId && validatedData.teamId.trim() !== "" ? validatedData.teamId : undefined;

        // If no teamId provided, ensure the user has a default team and use it
        if (!teamId) {
            try {
                teamId = await ensureDefaultTeam(session.user.id);
            } catch (err) {
                console.error("Failed to ensure default team:", err);
            }
        }

        // If teamId is provided, check if user is a member of the team
        if (teamId) {
            const teamMember = await prisma.teamMember.findUnique({
                where: {
                    teamId_userId: {
                        teamId: teamId,
                        userId: session.user.id,
                    },
                },
            });

            if (!teamMember) {
                return NextResponse.json(
                    { error: "You are not a member of this team" },
                    { status: 403 }
                );
            }

            // Check if user has permission to create projects (OWNER or EDITOR)
            if (teamMember.role === "VIEWER") {
                return NextResponse.json(
                    { error: "You don't have permission to create projects" },
                    { status: 403 }
                );
            }
        }

        // Create the project
        const project = await prisma.project.create({
            data: {
                name: validatedData.name,
                description: validatedData.description || null,
                teamId: teamId || null,
                createdById: session.user.id,
            },
            include: {
                team: teamId ? {
                    include: {
                        members: {
                            select: {
                                id: true,
                            },
                        },
                    },
                } : false,
                _count: {
                    select: {
                        tasks: true,
                    },
                },
            },
        });

        return NextResponse.json(project, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid input", details: error.issues },
                { status: 400 }
            );
        }

        console.error("Error creating project:", error);
        return NextResponse.json(
            { error: "Failed to create project" },
            { status: 500 }
        );
    }
}
