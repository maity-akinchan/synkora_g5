import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncGitHubRepository } from "@/lib/github-sync";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const projectId = params.id;

        // Check if user has access to the project
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                team: {
                    members: {
                        some: {
                            userId: session.user.id,
                            role: {
                                in: ["OWNER", "EDITOR"],
                            },
                        },
                    },
                },
            },
            include: {
                gitRepo: true,
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found or insufficient permissions" },
                { status: 404 }
            );
        }

        if (!project.gitRepo) {
            return NextResponse.json(
                { error: "No GitHub repository connected to this project" },
                { status: 404 }
            );
        }

        // Trigger sync
        const result = await syncGitHubRepository(project.gitRepo.id);
        if (!result) {
            console.log("ERROR: /api/projects/[id]/github/sync/route.ts POST: No result!")
        }
        else if (result.success) {
            return NextResponse.json({
                success: true,
                newCommitsCount: result.newCommitsCount,
                message: `Synced ${result.newCommitsCount} new commits`,
            });
        } else {
            // If the underlying error is an Octokit auth error, surface a clear 401
            const err = result.error as any;
            const status = err?.status || err?.response?.status;
            if (status === 401 || status === 403) {
                return NextResponse.json(
                    { error: "GitHub authentication failed", needsReconnect: true },
                    { status: 401 }
                );
            }

            return NextResponse.json(
                { error: "Sync failed", details: result.error },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Error triggering GitHub sync:", error);
        return NextResponse.json(
            { error: "Failed to sync repository" },
            { status: 500 }
        );
    }
}
