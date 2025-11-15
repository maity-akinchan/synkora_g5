"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Project, Team, TeamMember, User } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { ProjectHeader } from "@/components/project/project-header";
import { ProjectTabs } from "@/components/project/project-tabs";
import { ProjectSidebar } from "@/components/project/project-sidebar";

type ProjectWithRelations = Project & {
    team?: (Team & {
        members: (TeamMember & {
            user: User;
        })[];
    }) | null;
};

export default function ProjectLayout({
                                          children,
                                      }: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const router = useRouter();
    const projectId = params.projectId as string;
    const [project, setProject] = useState<ProjectWithRelations | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (projectId) {
            fetchProject();
        }
    }, [projectId]);

    const fetchProject = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/projects/${projectId}`);

            if (!response.ok) {
                if (response.status === 404) {
                    setError("Project not found");
                } else if (response.status === 403) {
                    setError("You don't have access to this project");
                } else {
                    setError("Failed to load project");
                }
                return;
            }

            const data = await response.json();
            setProject(data);
        } catch (err) {
            console.error("Error fetching project:", err);
            setError("Failed to load project");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center px-4">
                    <h2 className="text-xl md:text-2xl font-bold mb-2">
                        {error || "Project not found"}
                    </h2>
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="text-primary hover:underline"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-950 dark:to-black">
            {/* Project Sidebar with Team Members - Desktop */}
            <ProjectSidebar
                project={project}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                {/* Project Header - Fixed height */}
                <div className="flex-shrink-0">
                    <ProjectHeader
                        project={project}
                        onProjectUpdate={fetchProject}
                        onMenuClick={() => setIsSidebarOpen(true)}
                    />
                </div>

                {/* Project Tabs Navigation - Fixed height */}
                <div className="flex-shrink-0">
                    <ProjectTabs projectId={projectId} />
                </div>

                {/* Page Content - Takes remaining space with scroll */}
                <main className="flex-1 overflow-hidden">
                    <div className="h-full p-4 md:p-6 overflow-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
