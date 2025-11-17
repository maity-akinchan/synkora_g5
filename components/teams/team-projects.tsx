"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { FolderKanban, Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Project {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
}

interface TeamProjectsProps {
    teamId: string;
    projects: Project[];
    onProjectDeleted: (projectId: string) => void;
}

export function TeamProjects({ teamId, projects, onProjectDeleted }: TeamProjectsProps) {
    const router = useRouter();

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    if (projects.length === 0) {
        return (
            <Card className="p-12 text-center">
                <FolderKanban className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground">
                    Projects created for this team will appear here
                </p>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
                <Card
                    key={project.id}
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer relative"
                    onClick={() => router.push(`/dashboard?project=${project.id}`)}
                >
                    <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FolderKanban className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate">{project.name}</h3>
                            {project.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                    {project.description}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
                        <Calendar className="w-3 h-3" />
                        <span>Updated {formatDate(project.updatedAt)}</span>
                    </div>
                     <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-4 right-4"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent card click
                            if (confirm(`Are you sure you want to delete project "${project.name}"?`)) {
                                onProjectDeleted(project.id);
                            }
                        }}
                    >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                    </Button>
                </Card>
            ))}
        </div>
    );
}
