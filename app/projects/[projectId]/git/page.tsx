"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { GitActivityFeed } from "@/components/git/git-activity-feed";
import { ConnectGitHubModal } from "@/components/git/connect-github-modal";
import { Button } from "@/components/ui/button";
import { Github, Loader2, Unplug, MessageCircle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import RepoAIChat from "@/components/analytics/repo-ai-chat";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface GitRepository {
    id: string;
    githubRepoId: string;
    owner: string;
    name: string;
    fullName: string;
    lastSyncedAt: string | null;
}

export default function GitPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const [gitRepo, setGitRepo] = useState<GitRepository | null>(null);
    const [loading, setLoading] = useState(true);
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [showChat, setShowChat] = useState(false);

    const fetchGitRepo = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/projects/${projectId}/github`);

            if (!response.ok) {
                throw new Error("Failed to fetch GitHub repository");
            }

            const data = await response.json();
            setGitRepo(data.gitRepo);
        } catch (error) {
            console.error("Error fetching GitHub repository:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm("Are you sure you want to disconnect this GitHub repository?")) {
            return;
        }

        try {
            setDisconnecting(true);
            const response = await fetch(`/api/projects/${projectId}/github`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to disconnect repository");
            }

            setGitRepo(null);
        } catch (error) {
            console.error("Error disconnecting repository:", error);
            alert("Failed to disconnect repository. Please try again.");
        } finally {
            setDisconnecting(false);
        }
    };

    const handleExplainCommit = (sha: string) => {
        // TODO: Integrate with AI assistant to explain commit
        console.log("Explain commit:", sha);
        alert("AI commit explanation will be implemented in the AI assistant task.");
    };

    useEffect(() => {
        fetchGitRepo();
    }, [projectId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Git Activity</h1>
                    {gitRepo && (
                        <p className="text-sm text-muted-foreground mt-1">
                            Connected to{" "}
                            <a
                                href={`https://github.com/${gitRepo.fullName}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                {gitRepo.fullName}
                            </a>
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {gitRepo ? (
                        <>
                            {gitRepo.lastSyncedAt && (
                                <Badge variant="secondary" className="text-xs">
                                    Last synced:{" "}
                                    {new Date(gitRepo.lastSyncedAt).toLocaleString()}
                                </Badge>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDisconnect}
                                disabled={disconnecting}
                            >
                                {disconnecting ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Unplug className="w-4 h-4 mr-2" />
                                )}
                                Disconnect
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => setShowConnectModal(true)}>
                            <Github className="w-4 h-4 mr-2" />
                            Connect GitHub Repository
                        </Button>
                    )}
                </div>
            </div>

            {gitRepo ? (
                <GitActivityFeed
                    projectId={projectId}
                    onExplainCommit={handleExplainCommit}
                />
            ) : (
                <div className="bg-white rounded-lg border p-12 text-center">
                    <Github className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                        No GitHub Repository Connected
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Connect a GitHub repository to track commits, branches, and pull
                        requests directly in your project.
                    </p>
                    <Button onClick={() => setShowConnectModal(true)}>
                        <Github className="w-4 h-4 mr-2" />
                        Connect GitHub Repository
                    </Button>
                </div>
            )}

            <ConnectGitHubModal
                open={showConnectModal}
                onClose={() => setShowConnectModal(false)}
                projectId={projectId}
                onConnected={() => {
                    fetchGitRepo();
                    setShowConnectModal(false);
                }}
            />

            {/* Floating AI Chat */}
            <div className="fixed right-6 bottom-6 z-50">
                {showChat ? (
                    <Card className="w-96 h-96 shadow-lg overflow-hidden flex flex-col">
                        <CardHeader className="flex items-center justify-between px-3 py-2 border-b">
                            <div className="flex items-center gap-2">
                                <MessageCircle className="w-5 h-5" />
                                <span className="font-medium">AI Assistant</span>
                            </div>
                            <button
                                aria-label="Close AI chat"
                                className="p-1 rounded hover:bg-accent/50"
                                onClick={() => setShowChat(false)}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-auto">
                            <div className="h-full">
                                <RepoAIChat />
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <button
                        aria-label="Open AI assistant"
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-lime-400 to-green-500 text-gray-900 flex items-center justify-center shadow-lg dark:neon-glow"
                        onClick={() => setShowChat(true)}
                    >
                        <MessageCircle className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
}
