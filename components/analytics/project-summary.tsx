"use client";

import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertCircle, ListTodo } from "lucide-react";

interface ProjectSummaryProps {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    completionRate: number;
    averageCompletionTime: number;
}

export function ProjectSummary({
    totalTasks,
    completedTasks,
    inProgressTasks,
    overdueTasks,
    completionRate,
    averageCompletionTime,
}: ProjectSummaryProps) {
    const metrics = [
        {
            label: "Total Tasks",
            value: totalTasks,
            icon: ListTodo,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
        },
        {
            label: "Completed",
            value: completedTasks,
            icon: CheckCircle2,
            color: "text-green-600",
            bgColor: "bg-green-50",
        },
        {
            label: "In Progress",
            value: inProgressTasks,
            icon: Clock,
            color: "text-yellow-600",
            bgColor: "bg-yellow-50",
        },
        {
            label: "Overdue",
            value: overdueTasks,
            icon: AlertCircle,
            color: "text-red-600",
            bgColor: "bg-red-50",
        },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((metric) => {
                    const Icon = metric.icon;
                    return (
                        <Card key={metric.label} className="p-6 dark:bg-gray-900 dark:border-gray-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        {metric.label}
                                    </p>
                                    <p className="text-3xl font-bold mt-2 text-foreground">
                                        {metric.value}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-lg ${metric.bgColor} dark:bg-opacity-20`}>
                                    <Icon className={`h-6 w-6 ${metric.color}`} />
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        Completion Rate
                    </h3>
                    <div className="flex items-end gap-2">
                        <p className="text-3xl font-bold text-foreground">{completionRate}%</p>
                        <p className="text-sm text-muted-foreground mb-1">
                            of all tasks
                        </p>
                    </div>
                    <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                            className="bg-[#22c55e] h-2 rounded-full transition-all"
                            style={{ width: `${completionRate}%` }}
                        />
                    </div>
                </Card>

                <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        Average Completion Time
                    </h3>
                    <div className="flex items-end gap-2">
                        <p className="text-3xl font-bold text-foreground">
                            {averageCompletionTime}
                        </p>
                        <p className="text-sm text-muted-foreground mb-1">
                            days
                        </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Average time from creation to completion
                    </p>
                </Card>
            </div>
        </div>
    );
}
