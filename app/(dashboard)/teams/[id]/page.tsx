"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Settings, Trash2, UserPlus } from "lucide-react";
import { TeamMemberList } from "@/components/teams/team-member-list";
import { TeamSettings } from "@/components/teams/team-settings";
import { TeamProjects } from "@/components/teams/team-projects";
import { InviteTeamMemberModal } from "@/components/teams/invite-team-member-modal";

interface TeamMember {
    id: string;
    role: string;
    user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
    };
}

interface Project {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
}

interface Team {
    id: string;
    name: string;
    createdAt: string;
    members: TeamMember[];
    projects: Project[];
}

export default function TeamDetailPage() {
    const router = useRouter();
    const params = useParams();
    const teamId = params.id as string;

    const [team, setTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"members" | "projects" | "settings">("members");
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [userDefaultTeamId, setUserDefaultTeamId] = useState<string | null>(null);

    const fetchTeam = async () => {
        try {
            const response = await fetch(`/api/teams/${teamId}`);
            if (response.ok) {
                const data = await response.json();
                setTeam(data);

                // Get current user's role
                const sessionResponse = await fetch("/api/auth/session");
                if (sessionResponse.ok) {
                    const session = await sessionResponse.json();
                    const member = data.members.find((m: TeamMember) => m.user.id === session.user?.id);
                    setCurrentUserRole(member?.role || null);
                        // fetch user's default team id to allow UI state (e.g., disabling Set As Default button)
                        try {
                            const userRes = await fetch(`/api/user`);
                            if (userRes.ok) {
                                const userData = await userRes.json();
                                setUserDefaultTeamId(userData.defaultTeamId || null);
                            }
                        } catch (err) {
                            console.error("Failed to fetch user data", err);
                        }
                }
            } else if (response.status === 404) {
                router.push("/teams");
            }
        } catch (error) {
            console.error("Error fetching team:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeam();
    }, [teamId]);

    const handleTeamUpdated = (updatedTeam: Team) => {
        setTeam(updatedTeam);
    };

    const handleTeamDeleted = () => {
        router.push("/teams");
    };


    const handleProjectDeleted = async (projectId: string) => {
        try {
            const response = await fetch(`/api/projects/${projectId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                fetchTeam(); // Refresh team data after deletion
            } else {
                console.error("Failed to delete project");
            }
        } catch (error) {
            console.error("Error deleting project:", error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-muted-foreground">Loading team...</div>
            </div>
        );
    }

    if (!team) {
        return null;
    }

    const isOwner = currentUserRole === "OWNER";

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="mb-6">
                <Button
                    variant="ghost"
                    onClick={() => router.push("/teams")}
                    className="mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Teams
                </Button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{team.name}</h1>
                        <p className="text-muted-foreground mt-1">
                            {team.members.length} member{team.members.length !== 1 ? "s" : ""} · {team.projects.length} project{team.projects.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                    {isOwner && (
                        <Button onClick={() => setShowInviteModal(true)}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Invite Member
                        </Button>
                    )}

                      {isOwner && (
                        <Button onClick={() => setShowInviteModal(true)}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Delete Project
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex gap-2 mb-6 border-b">
                <Button
                    variant={activeTab === "members" ? "default" : "ghost"}
                    onClick={() => setActiveTab("members")}
                    className="rounded-b-none"
                >
                    Members
                </Button>
                <Button
                    variant={activeTab === "projects" ? "default" : "ghost"}
                    onClick={() => setActiveTab("projects")}
                    className="rounded-b-none"
                >
                    Projects
                </Button>
                {isOwner && (
                    <Button
                        variant={activeTab === "settings" ? "default" : "ghost"}
                        onClick={() => setActiveTab("settings")}
                        className="rounded-b-none"
                    >
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                    </Button>
                )}
            </div>

            {activeTab === "members" && (
                <TeamMemberList
                    teamId={team.id}
                    members={team.members}
                    currentUserRole={currentUserRole}
                    onMembersUpdated={fetchTeam}
                />
            )}

            {activeTab === "projects" && (
                <TeamProjects
                    teamId={team.id}
                    projects={team.projects}
                    onProjectDeleted={handleProjectDeleted} 
                />
            )}

            {activeTab === "settings" && isOwner && (
                <TeamSettings
                    team={team}
                    onTeamUpdated={handleTeamUpdated}
                    onTeamDeleted={handleTeamDeleted}
                    userDefaultTeamId={userDefaultTeamId}
                />
            )}

            <InviteTeamMemberModal
                open={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                teamId={team.id}
                teamName={team.name}
                onInviteSent={() => {
                    setShowInviteModal(false);
                }}
            />
        </div>
    );
}
