"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, Github } from "lucide-react";
import { useSession } from "next-auth/react";

interface Repository {
    id: string;
    name: string;
    fullName: string;
    owner: string;
    description: string | null;
    private: boolean;
    url: string;
}

interface ConnectGitHubModalProps {
    open: boolean;
    onClose(): void;
    projectId: string;
    onConnected(): void;
}

export function ConnectGitHubModal({
    open,
    onClose,
    projectId,
    onConnected,
}: ConnectGitHubModalProps) {
    const { data: session } = useSession();
    const [repositories, setRepositories] = useState<Repository[]>([]);
    const [loading, setLoading] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);

    const fetchRepositories = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/github/repositories?page=1&perPage=50");

            if (!response.ok) {
                if (response.status === 403) {
                    alert("Please connect your GitHub account or sign in with GitHub to access repositories.");
                    return;
                }
                if (response.status === 401) {
                    // Not signed in
                    alert("Not signed in. Please sign in with GitHub to continue.");
                    window.location.href = "/api/auth/signin/github";
                    return;
                }
                throw new Error("Failed to fetch repositories");
            }

            const data = await response.json();
            setRepositories(data.repositories);
        } catch (error) {
            console.error("Error fetching repositories:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        if (!selectedRepo || !session?.githubAccessToken) {
            return;
        }

        try {
            setConnecting(true);
            const response = await fetch(`/api/projects/${projectId}/github/connect`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    githubRepoId: selectedRepo.id,
                    owner: selectedRepo.owner,
                    name: selectedRepo.name,
                    fullName: selectedRepo.fullName,
                    accessToken: session.githubAccessToken,
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                const msg = data?.error || data?.message || "Failed to connect repository";
                console.error("Connect repo failed:", data);
                alert(`Failed to connect repository: ${msg}`);
                return;
            }

            // Success
            onConnected();
            onClose();
        } catch (error) {
            console.error("Error connecting repository:", error);
            alert("Failed to connect repository. Please try again. See console for details.");
        } finally {
            setConnecting(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchRepositories();
        }
    }, [open]);

    const filteredRepos = repositories.filter(
        (repo) =>
            repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            repo.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Connect GitHub Repository</DialogTitle>
                </DialogHeader>

                {!session?.githubAccessToken ? (
                    <div className="py-8 text-center">
                        <Github className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground mb-4">
                            You need to sign in with GitHub to connect a repository.
                        </p>
                        <div className="flex items-center justify-center gap-2">
                            <Button onClick={() => window.location.href = "/api/auth/signin/github"}>
                                Sign in with GitHub
                            </Button>
                            <Button variant="outline" onClick={() => window.location.href = "/account"}>
                                Manage Connections
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">If you've already connected GitHub, try refreshing the modal or reconnecting from Account Settings.</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="search">Search Repositories</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="search"
                                        type="text"
                                        placeholder="Search by name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : filteredRepos.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        No repositories found
                                    </div>
                                ) : (
                                    <div className="max-h-96 overflow-y-auto">
                                        {filteredRepos.map((repo) => (
                                            <div
                                                key={repo.id}
                                                className={`p-4 border-b last:border-b-0 cursor-pointer hover:bg-accent/50 transition-colors ${selectedRepo?.id === repo.id
                                                        ? "bg-accent"
                                                        : ""
                                                    }`}
                                                onClick={() => setSelectedRepo(repo)}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="font-medium">
                                                            {repo.fullName}
                                                        </div>
                                                        {repo.description && (
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                {repo.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {repo.private && (
                                                        <span className="text-xs bg-secondary px-2 py-1 rounded">
                                                            Private
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleConnect}
                                disabled={!selectedRepo || connecting}
                            >
                                {connecting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Connecting...
                                    </>
                                ) : (
                                    "Connect Repository"
                                )}
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
