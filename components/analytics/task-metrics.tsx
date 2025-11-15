"use client";

import { Card } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";

interface TaskMetricsProps {
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
}

const STATUS_COLORS = {
    TODO: "#3b82f6",
    IN_PROGRESS: "#f59e0b",
    UNDER_REVIEW: "#8b5cf6",
    DONE: "#10b981",
};

const PRIORITY_COLORS = {
    LOW: "#6b7280",
    MEDIUM: "#f59e0b",
    HIGH: "#ef4444",
};

export function TaskMetrics({
    statusDistribution,
    priorityDistribution,
    tasksByAssignee,
}: TaskMetricsProps) {
    // Format data for status chart
    const statusData = [
        { name: "To Do", value: statusDistribution.TODO, fill: STATUS_COLORS.TODO },
        { name: "In Progress", value: statusDistribution.IN_PROGRESS, fill: STATUS_COLORS.IN_PROGRESS },
        { name: "Under Review", value: statusDistribution.UNDER_REVIEW, fill: STATUS_COLORS.UNDER_REVIEW },
        { name: "Done", value: statusDistribution.DONE, fill: STATUS_COLORS.DONE },
    ];

    // Format data for priority chart
    const priorityData = [
        { name: "Low", value: priorityDistribution.LOW, fill: PRIORITY_COLORS.LOW },
        { name: "Medium", value: priorityDistribution.MEDIUM, fill: PRIORITY_COLORS.MEDIUM },
        { name: "High", value: priorityDistribution.HIGH, fill: PRIORITY_COLORS.HIGH },
    ];

    // Format data for assignee chart
    const assigneeData = tasksByAssignee
        .sort((a, b) => b.taskCount - a.taskCount)
        .slice(0, 10)
        .map(item => ({
            name: item.userName.length > 20
                ? item.userName.substring(0, 20) + '...'
                : item.userName,
            tasks: item.taskCount,
        }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tasks by Status */}
            <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Tasks by Status</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={100}
                            dataKey="value"
                        >
                            {statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </Card>

            {/* Tasks by Priority */}
            <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Tasks by Priority</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={priorityData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={100}
                            dataKey="value"
                        >
                            {priorityData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </Card>

            {/* Tasks by Assignee */}
            {assigneeData.length > 0 && (
                <Card className="p-6 lg:col-span-2 dark:bg-gray-900 dark:border-gray-800">
                    <h3 className="text-lg font-semibold mb-4 text-foreground">Tasks by Assignee</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={assigneeData}>
                            <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700" />
                            <XAxis
                                dataKey="name"
                                angle={-45}
                                textAnchor="end"
                                height={100}
                                className="dark:fill-gray-400"
                            />
                            <YAxis className="dark:fill-gray-400" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '0.5rem',
                                }}
                            />
                            <Legend />
                            <Bar dataKey="tasks" fill="#22c55e" name="Tasks" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            )}
        </div>
    );
}
