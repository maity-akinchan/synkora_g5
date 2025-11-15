"use client";

import { Project, Team, TeamMember, User } from "@prisma/client";
import { Users, Crown, Edit, Eye, X, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { VideoMeetingModal } from "@/components/meeting/video-meeting-modal";

type ProjectWithRelations = Project & {
    team?: (Team & {
        members: (TeamMember & {
            user: User;
        })[];
    }) | null;
};

interface ProjectSidebarProps {
    project: ProjectWithRelations;
    isOpen?: boolean;
    onClose?: () => void;
}

function getRoleIcon(role: string) {
    switch (role) {
        case "OWNER":
            return <Crown className="h-3 w-3" />;
        case "EDITOR":
            return <Edit className="h-3 w-3" />;
        case "VIEWER":
            return <Eye className="h-3 w-3" />;
        default:
            return null;
    }
}

function getRoleBadgeVariant(role: string): "default" | "secondary" | "outline" {
    switch (role) {
        case "OWNER":
            return "default";
        case "EDITOR":
            return "secondary";
        case "VIEWER":
            return "outline";
        default:
            return "outline";
    }
}

function getInitials(name: string | null, email: string): string {
    if (name) {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
}

export function ProjectSidebar({ project, isOpen = false, onClose }: ProjectSidebarProps) {
    const teamMembers = project.team?.members || [];
    const isPersonalProject = !project.team;
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);

    // Close sidebar on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen && onClose) {
                onClose();
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    // Prevent body scroll when mobile sidebar is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-50
                    w-64 bg-white dark:bg-gray-950 border-r dark:border-gray-800 flex flex-col
                    transform transition-transform duration-300 ease-in-out
                    ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                `}
            >
                <div className="p-4 border-b dark:border-gray-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span className="truncate">
                                {isPersonalProject ? "Personal Project" : `Team: ${project.team?.name}`}
                            </span>
                        </div>
                        {/* Close button for mobile */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="lg:hidden h-8 w-8 p-0"
                            onClick={onClose}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Meeting Button */}
                    <div>
                        <Button
                            onClick={() => setIsMeetingModalOpen(true)}
                            className="w-full"
                            variant="default"
                        >
                            <Video className="h-4 w-4 mr-2" />
                            Start Meeting
                        </Button>
                    </div>

                    <div className="border-t dark:border-gray-800 pt-4">
                        <h3 className="text-sm font-semibold mb-3">
                            {isPersonalProject ? "Project Owner" : `Team Members (${teamMembers.length})`}
                        </h3>
                    </div>
                    {isPersonalProject ? (
                        <div className="text-sm text-muted-foreground p-2">
                            This is your personal project
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {teamMembers.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={member.user.image || undefined} />
                                        <AvatarFallback className="text-xs">
                                            {getInitials(member.user.name, member.user.email)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {member.user.name || member.user.email}
                                        </p>
                                        <Badge
                                            variant={getRoleBadgeVariant(member.role)}
                                            className="text-xs mt-1"
                                        >
                                            <span className="mr-1">{getRoleIcon(member.role)}</span>
                                            {member.role}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </aside>

            {/* Video Meeting Modal */}
            <VideoMeetingModal
                open={isMeetingModalOpen}
                onClose={() => setIsMeetingModalOpen(false)}
                projectId={project.id}
                projectName={project.name}
            />
        </>
    );
}
