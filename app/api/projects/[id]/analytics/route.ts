import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper function to check user's access to project
async function getUserProjectRole(userId: string, projectId: string) {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
            id: true,
            name: true,
            createdById: true,
            teamId: true,
            team: {
                include: {
                    members: {
                        where: {
                            userId: userId,
                        },
                    },
                },
            },
        },
    });

    if (!project) {
        return null;
    }

    // Check if it's a personal project (no team)
    if (!project.team) {
        // For personal projects, check if the user is the creator
        if (project.createdById === userId) {
            return {
                project,
                role: 'OWNER',
            };
        }
        return null;
    }

    // For team projects, check if user is a member
    if (project.team.members.length === 0) {
        return null;
    }

    return {
        project,
        role: project.team.members[0].role,
    };
}

// GET /api/projects/[id]/analytics - Get project analytics and metrics
export async function GET(
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

        const result = await getUserProjectRole(session.user.id, params.id);

        if (!result) {
            return NextResponse.json(
                { error: "Project not found or access denied" },
                { status: 404 }
            );
        }

        const projectId = params.id;

        // Get task counts by status
        const tasksByStatus = await prisma.task.groupBy({
            by: ['status'],
            where: { projectId },
            _count: {
                id: true,
            },
        });

        // Get task counts by priority
        const tasksByPriority = await prisma.task.groupBy({
            by: ['priority'],
            where: { projectId },
            _count: {
                id: true,
            },
        });

        // Get task counts by assignee
        const tasksByAssignee = await prisma.task.groupBy({
            by: ['assigneeId'],
            where: {
                projectId,
                assigneeId: { not: null }
            },
            _count: {
                id: true,
            },
        });

        // Get assignee details
        const assigneeIds = tasksByAssignee
            .map((t: { assigneeId: string | null }) => t.assigneeId)
            .filter((id: string | null): id is string => id !== null);

        const assignees = await prisma.user.findMany({
            where: {
                id: { in: assigneeIds },
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
            },
        });

        // Map assignee data
        const tasksByAssigneeWithDetails = tasksByAssignee.map((item: { assigneeId: string | null; _count: { id: number } }) => {
            const assignee = assignees.find((a: { id: string }) => a.id === item.assigneeId);
            return {
                userId: item.assigneeId,
                userName: assignee?.name || assignee?.email || 'Unknown',
                userImage: assignee?.image,
                taskCount: item._count.id,
            };
        });

        // Get total task count
        const totalTasks = await prisma.task.count({
            where: { projectId },
        });

        // Get completed tasks count
        const completedTasks = await prisma.task.count({
            where: {
                projectId,
                status: 'DONE',
            },
        });

        // Get in progress tasks count
        const inProgressTasks = await prisma.task.count({
            where: {
                projectId,
                status: 'IN_PROGRESS',
            },
        });

        // Get overdue tasks count
        const overdueTasks = await prisma.task.count({
            where: {
                projectId,
                dueDate: {
                    lt: new Date(),
                },
                status: {
                    not: 'DONE',
                },
            },
        });

        // Calculate completion rate
        const completionRate = totalTasks > 0
            ? Math.round((completedTasks / totalTasks) * 100)
            : 0;

        // Get recent activities (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentActivities = await prisma.activity.findMany({
            where: {
                projectId,
                createdAt: {
                    gte: thirtyDaysAgo,
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 50,
        });

        // Calculate average completion time for completed tasks
        const completedTasksWithDates = await prisma.task.findMany({
            where: {
                projectId,
                status: 'DONE',
            },
            select: {
                createdAt: true,
                updatedAt: true,
            },
        });

        let averageCompletionTime = 0;
        if (completedTasksWithDates.length > 0) {
            const totalTime = completedTasksWithDates.reduce((sum: number, task: { createdAt: Date; updatedAt: Date }) => {
                const timeDiff = task.updatedAt.getTime() - task.createdAt.getTime();
                return sum + timeDiff;
            }, 0);
            averageCompletionTime = Math.round(totalTime / completedTasksWithDates.length / (1000 * 60 * 60 * 24)); // Convert to days
        }

        // Format task distribution data
        const statusDistribution: Record<string, number> = {
            TODO: 0,
            IN_PROGRESS: 0,
            UNDER_REVIEW: 0,
            DONE: 0,
        };

        tasksByStatus.forEach((item: { status: string; _count: { id: number } }) => {
            statusDistribution[item.status] = item._count.id;
        });

        const priorityDistribution: Record<string, number> = {
            LOW: 0,
            MEDIUM: 0,
            HIGH: 0,
        };

        tasksByPriority.forEach((item: { priority: string; _count: { id: number } }) => {
            priorityDistribution[item.priority] = item._count.id;
        });

        return NextResponse.json({
            totalTasks,
            completedTasks,
            inProgressTasks,
            overdueTasks,
            completionRate,
            averageCompletionTime,
            statusDistribution,
            priorityDistribution,
            tasksByAssignee: tasksByAssigneeWithDetails,
            recentActivities,
        });
    } catch (error) {
        console.error("Error fetching project analytics:", error);
        return NextResponse.json(
            { error: "Failed to fetch analytics" },
            { status: 500 }
        );
    }
}
