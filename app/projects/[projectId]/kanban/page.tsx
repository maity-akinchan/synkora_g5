"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { CreateTaskModal } from "@/components/kanban/create-task-modal";
import { EditTaskModal } from "@/components/kanban/edit-task-modal";
import { TaskDetailModal } from "@/components/kanban/task-detail-modal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Task, TaskStatus, User, TaskPriority } from "@/types";
import { Plus, Filter, Wifi, WifiOff } from "lucide-react";
import { useRealtimeKanban } from "@/hooks/use-realtime-kanban";
import { Toaster } from "@/components/ui/toaster"; // This import is now used
import { toast } from "sonner"; // --- FIX 1: Import the toast function from sonner ---
import { ProjectAIAssistant } from "@/components/chatbot/project-ai-assistant";

export default function KanbanPage() {
    const params = useParams();
    const projectId = params.projectId as string;

    const [tasks, setTasks] = useState<(Task & { assignee?: User | null })[]>([]);
    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    // Filters
    const [filterAssignee, setFilterAssignee] = useState<string>("all");
    const [filterPriority, setFilterPriority] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("position");
    const [projectName, setProjectName] = useState<string>("");

    // Real-time handlers
    const handleRealtimeTaskCreate = useCallback((task: Task) => {
        setTasks((prev) => [...prev, task]);
    }, []);

    const handleRealtimeTaskUpdate = useCallback((task: Task) => {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    }, []);

    const handleRealtimeTaskDelete = useCallback((taskId: string) => {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
    }, []);

    const handleRealtimeTaskMove = useCallback((taskId: string, status: string) => {
        setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, status: status as TaskStatus } : t))
        );
    }, []);

    // Set up real-time connection
    const {
        isConnected,
        broadcastTaskCreate,
        broadcastTaskUpdate,
        broadcastTaskDelete,
        broadcastTaskMove,
    } = useRealtimeKanban({
        projectId,
        onTaskCreate: handleRealtimeTaskCreate,
        onTaskUpdate: handleRealtimeTaskUpdate,
        onTaskDelete: handleRealtimeTaskDelete,
        onTaskMove: handleRealtimeTaskMove,
    });

    useEffect(() => {
        fetchTasks();
        fetchTeamMembers();
    }, [projectId]);

    const fetchTasks = async () => {
        try {
            const response = await fetch(`/api/projects/${projectId}/tasks`);
            if (response.ok) {
                const data = await response.json();
                setTasks(data);
            }
        } catch (error) {
            console.error("Failed to fetch tasks:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTeamMembers = async () => {
        try {
            const response = await fetch(`/api/projects/${projectId}`);
            if (response.ok) {
                const project = await response.json();
                const members = project.team?.members?.map((m: any) => m.user) || [];
                setTeamMembers(members);
                setProjectName(project.name || "Project");
            }
        } catch (error) {
            console.error("Failed to fetch team members:", error);
        }
    };

    const handleCreateTask = async (data: {
        title: string;
        description?: string;
        priority: TaskPriority;
        status: TaskStatus;
        assigneeId?: string;
        dueDate?: string;
    }) => {
        try {
            const response = await fetch(`/api/projects/${projectId}/tasks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const newTask = await response.json();
                setTasks((prev) => [...prev, newTask]);
                // Broadcast to other users
                broadcastTaskCreate(newTask);
                // You might want to add a success toast here too
                toast.success("Task created successfully");
            } else {
                toast.error("Failed to create task");
            }
        } catch (error) {
            console.error("Failed to create task:", error);
            toast.error("Failed to create task", {
                description: "An error occurred. Please try again.",
            });
            throw error;
        }
    };

    const handleUpdateTask = async (
        taskId: string,
        data: {
            title?: string;
            description?: string;
            priority?: TaskPriority;
            status?: TaskStatus;
            assigneeId?: string | null;
            dueDate?: string | null;
        }
    ) => {
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const updatedTask = await response.json();
                setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
                // Broadcast to other users
                broadcastTaskUpdate(updatedTask);
                toast.success("Task updated successfully", {
                    description: "Your changes have been saved.",
                });
            } else {
                toast.error("Failed to update task", {
                    description: "Please try again.",
                });
            }
        } catch (error) {
            console.error("Failed to update task:", error);
            toast.error("Failed to update task", {
                description: "An error occurred. Please try again.",
            });
            throw error;
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setTasks((prev) => prev.filter((t) => t.id !== taskId));
                // Broadcast to other users
                broadcastTaskDelete(taskId);
                toast.success("Task deleted successfully", {
                    description: "The task has been removed from the board.",
                });
            } else {
                toast.error("Failed to delete task", {
                    description: "Please try again.",
                });
            }
        } catch (error) {
            console.error("Failed to delete task:", error);
            toast.error("Failed to delete task", {
                description: "An error occurred. Please try again.",
            });
            throw error;
        }
    };

    const handleTaskMove = async (taskId: string, newStatus: TaskStatus) => {
        // Optimistic update
        const originalTasks = [...tasks];
        setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
        );

        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                const updatedTask = await response.json();
                setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
                // Broadcast to other users
                broadcastTaskMove(taskId, newStatus);
            } else {
                const error = await response.json().catch(() => ({ error: "Unknown error" }));
                console.error("Failed to update task:", response.status, error);
                // Rollback on error
                setTasks(originalTasks);
                toast.error("Failed to move task");
            }
        } catch (error) {
            console.error("Failed to move task:", error);
            // Rollback on error
            setTasks(originalTasks);
            toast.error("Failed to move task", {
                description: "An error occurred. Please try again.",
            });
        }
    };

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
        setDetailModalOpen(true);
    };

    const handleEditClick = () => {
        setDetailModalOpen(false);
        setEditModalOpen(true);
    };

    // Apply filters and sorting
    const filteredTasks = tasks.filter((task) => {
        if (filterAssignee !== "all" && task.assigneeId !== filterAssignee) return false;
        if (filterPriority !== "all" && task.priority !== filterPriority) return false;
        return true;
    });

    const sortedTasks = [...filteredTasks].sort((a, b) => {
        if (sortBy === "priority") {
            const priorityOrder: Record<TaskPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        if (sortBy === "dueDate") {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return a.position - b.position;
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading tasks...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* --- FIX 2: Render the Toaster component --- */}
            <Toaster />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-lime-400 to-green-500 bg-clip-text text-transparent dark:neon-text">
                        Kanban Board
                    </h1>
                    <Badge variant={isConnected ? "default" : "secondary"} className="gap-1">
                        {isConnected ? (
                            <>
                                <Wifi className="h-3 w-3" />
                                Live
                            </>
                        ) : (
                            <>
                                <WifiOff className="h-3 w-3" />
                                Offline
                            </>
                        )}
                    </Badge>
                </div>
                <Button onClick={() => setCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Task
                </Button>
            </div>

            {/* Filters and Sorting */}
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filters:</span>
                </div>

                <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All assignees" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All assignees</SelectItem>
                        {teamMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                                {member.name || member.email}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All priorities" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All priorities</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="position">Default order</SelectItem>
                        <SelectItem value="priority">Priority</SelectItem>
                        <SelectItem value="dueDate">Due date</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Kanban Board */}
            <KanbanBoard
                projectId={projectId}
                initialTasks={sortedTasks}
                onTaskMove={handleTaskMove}
                onTaskClick={handleTaskClick}
            />

            {/* Modals */}
            <CreateTaskModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
                onSubmit={handleCreateTask}
                teamMembers={teamMembers}
            />

            <EditTaskModal
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
                task={selectedTask}
                onSubmit={handleUpdateTask}
                onDelete={handleDeleteTask}
                teamMembers={teamMembers}
            />

            <TaskDetailModal
                open={detailModalOpen}
                onOpenChange={setDetailModalOpen}
                task={selectedTask}
                onEdit={handleEditClick}
            />

            {/* AI Assistant */}
            <ProjectAIAssistant projectId={projectId} projectName={projectName} />
        </div>
    );
}