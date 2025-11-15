"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProjectSummary } from "@/components/analytics/project-summary";
import { TaskMetrics } from "@/components/analytics/task-metrics";
import { ActivityChart } from "@/components/analytics/activity-chart";

interface AnalyticsData {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    completionRate: number;
    averageCompletionTime: number;
    statusDistribution: {
        TODO: number;
        IN_PROGRESS: number;
        UNDER_REVIEW: number;
        DONE: number;
    };
    priorityDistribution: {
        LOW: number;
        MEDIUM: number;
        HIGH: number;
    };
    tasksByAssignee: Array<{
        userId: string | null;
        userName: string;
        userImage?: string | null;
        taskCount: number;
    }>;
    recentActivities: Array<{
        id: string;
        type: string;
        data: any;
        createdAt: string;
    }>;
}

export default function AnalyticsPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                setLoading(true);
                const response = await fetch(`/api/projects/${projectId}/analytics`);

                if (!response.ok) {
                    throw new Error("Failed to fetch analytics");
                }

                const data = await response.json();
                setAnalytics(data);
            } catch (err) {
                console.error("Error fetching analytics:", err);
                setError(err instanceof Error ? err.message : "Failed to load analytics");
            } finally {
                setLoading(false);
            }
        }

        if (projectId) {
            fetchAnalytics();
        }
    }, [projectId]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-foreground">Project Analytics</h1>
                </div>
                <div className="bg-card rounded-lg border border-border p-8 text-center text-muted-foreground">
                    Loading analytics...
                </div>
            </div>
        );
    }

    if (error || !analytics) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-foreground">Project Analytics</h1>
                </div>
                <div className="bg-card rounded-lg border border-border p-8 text-center text-red-600 dark:text-red-400">
                    {error || "Failed to load analytics"}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground">Project Analytics</h1>
            </div>

            <ProjectSummary
                totalTasks={analytics.totalTasks}
                completedTasks={analytics.completedTasks}
                inProgressTasks={analytics.inProgressTasks}
                overdueTasks={analytics.overdueTasks}
                completionRate={analytics.completionRate}
                averageCompletionTime={analytics.averageCompletionTime}
            />

            <TaskMetrics
                statusDistribution={analytics.statusDistribution}
                priorityDistribution={analytics.priorityDistribution}
                tasksByAssignee={analytics.tasksByAssignee}
            />

            <ActivityChart activities={analytics.recentActivities} />
        </div>
    );
}
