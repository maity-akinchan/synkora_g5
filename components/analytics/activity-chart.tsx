"use client";

import { Card } from "@/components/ui/card";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { format, startOfDay, subDays } from "date-fns";

interface Activity {
    id: string;
    type: string;
    data: any;
    createdAt: string | Date;
}

interface ActivityChartProps {
    activities: Activity[];
}

export function ActivityChart({ activities }: ActivityChartProps) {
    // Group activities by day for the last 30 days
    const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = subDays(new Date(), 29 - i);
        return startOfDay(date);
    });

    const activityByDay = last30Days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const count = activities.filter(activity => {
            const activityDate = new Date(activity.createdAt);
            return format(startOfDay(activityDate), 'yyyy-MM-dd') === dayStr;
        }).length;

        return {
            date: format(day, 'MMM dd'),
            activities: count,
        };
    });

    // Group activities by type
    const activityByType = activities.reduce((acc, activity) => {
        const type = activity.type;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const activityTypeData = Object.entries(activityByType)
        .map(([type, count]) => ({
            type: type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
            count,
        }))
        .sort((a, b) => b.count - a.count);

    return (
        <div className="space-y-6">
            {/* Activity Timeline */}
            <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Activity Timeline (Last 30 Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={activityByDay}>
                        <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700" />
                        <XAxis
                            dataKey="date"
                            angle={-45}
                            textAnchor="end"
                            height={80}
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
                        <Line
                            type="monotone"
                            dataKey="activities"
                            stroke="#22c55e"
                            strokeWidth={2}
                            name="Activities"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </Card>

            {/* Activity by Type */}
            <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Activity by Type</h3>
                {activityTypeData.length > 0 ? (
                    <div className="space-y-3">
                        {activityTypeData.map((item) => (
                            <div key={item.type} className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                    <span className="text-sm font-medium min-w-[150px] text-foreground">
                                        {item.type}
                                    </span>
                                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-[#22c55e] h-2 rounded-full transition-all"
                                            style={{
                                                width: `${(item.count / activities.length) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                                <span className="text-sm font-semibold ml-4 text-foreground">
                                    {item.count}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        No activities recorded yet
                    </p>
                )}
            </Card>

            {/* Recent Activities List */}
            <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Recent Activities</h3>
                {activities.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {activities.slice(0, 20).map((activity) => (
                            <div
                                key={activity.id}
                                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground">
                                        {activity.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                                    </p>
                                    {activity.data?.taskTitle && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {activity.data.taskTitle}
                                        </p>
                                    )}
                                    {activity.data?.userName && (
                                        <p className="text-xs text-muted-foreground">
                                            by {activity.data.userName}
                                        </p>
                                    )}
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {format(new Date(activity.createdAt), 'MMM dd, HH:mm')}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        No activities recorded yet
                    </p>
                )}
            </Card>
        </div>
    );
}
