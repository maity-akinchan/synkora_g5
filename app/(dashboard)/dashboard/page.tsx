"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/dashboard/project-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { CreateProjectModal } from "@/components/dashboard/create-project-modal";
import { ProjectInvitationsList } from "@/components/projects/project-invitations-list";
import { useEffect, useState } from "react";
import { Project, Team, Activity } from "@prisma/client";
import { Loader2 } from "lucide-react";

type ProjectWithRelations = Project & {
    team?: {
        name: string;
        members: { id: string }[];
    } | null;
    _count?: {
        tasks: number;
    };
};

type ActivityWithProject = Activity & {
    project: {
        name: string;
    };
};

type TeamOption = {
    id: string;
    name: string;
};

export default function DashboardPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [projects, setProjects] = useState<ProjectWithRelations[]>([]);
    const [activities, setActivities] = useState<ActivityWithProject[]>([]);
    const [teams, setTeams] = useState<TeamOption[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!authLoading && user) {
            fetchData();
        }
    }, [authLoading, user]);

    const fetchData = async () => {
        try {
            setIsLoadingData(true);
            const [projectsRes, activitiesRes, teamsRes] = await Promise.all([
                fetch("/api/projects"),
                fetch("/api/activities?limit=20"),
                fetch("/api/teams"),
            ]);

            if (projectsRes.ok) {
                const projectsData = await projectsRes.json();
                setProjects(projectsData);
            }

            if (activitiesRes.ok) {
                const activitiesData = await activitiesRes.json();
                setActivities(activitiesData.activities || []);
            }

            if (teamsRes.ok) {
                const teamsData = await teamsRes.json();
                setTeams(teamsData.map((t: Team) => ({ id: t.id, name: t.name })));
            }
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load dashboard data");
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleCreateProject = async (data: { name: string; description: string; teamId: string }) => {
        const response = await fetch("/api/projects", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to create project");
        }

        const newProject = await response.json();
        setProjects([newProject, ...projects]);
    };

    if (authLoading || isLoadingData) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 md:mb-8 flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
                        <p className="text-muted-foreground mt-1 text-sm md:text-base">
                            Welcome back, {user?.name || user?.email}
                        </p>
                    </div>
                    <div className="pt-1">
                        <a
                            href="/dashboard/account"
                            className="text-sm text-muted-foreground hover:underline"
                        >
                            Account Settings
                        </a>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                        {error}
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-3 mb-6">
                    <div className="lg:col-span-2 space-y-6">
                        <ProjectInvitationsList />

                        <div>
                            <h2 className="text-lg md:text-xl font-semibold mb-4">Your Projects</h2>
                            {projects.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-lg border border-dashed">
                                    <p className="text-muted-foreground mb-4">No projects yet</p>
                                    <Button onClick={() => setIsCreateModalOpen(true)}>
                                        Create Your First Project
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {projects.map((project) => (
                                        <ProjectCard key={project.id} project={project} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <QuickActions onCreateProject={() => setIsCreateModalOpen(true)} />
                        <ActivityFeed activities={activities} />
                    </div>
                </div>

                <CreateProjectModal
                    open={isCreateModalOpen}
                    onOpenChange={setIsCreateModalOpen}
                    onSubmit={handleCreateProject}
                    teams={teams}
                />
            </div>
        </div>
    );
}
