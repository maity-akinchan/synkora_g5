"use client";

import { useState, useEffect } from "react";
import { CommitCard } from "./commit-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, GitBranch, GitPullRequest, Loader2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GitCommit {
    sha: string;
    message: string;
    author: string;
    authorEmail: string;
    committedAt: Date | string;
    url: string;
}

interface GitBranch {
    name: string;
    sha: string;
    protected: boolean;
}

interface GitPullRequest {
    number: number;
    title: string;
    state: string;
    author: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    url: string;
    merged: boolean;
}

interface GitActivityFeedProps {
    projectId: string;
    onExplainCommit?: (sha: string) => void;
}

export function GitActivityFeed({ projectId, onExplainCommit }: GitActivityFeedProps) {
    const [commits, setCommits] = useState<GitCommit[]>([]);
    const [branches, setBranches] = useState<GitBranch[]>([]);
    const [pullRequests, setPullRequests] = useState<GitPullRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [needsReconnect, setNeedsReconnect] = useState(false);
    const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"commits" | "branches" | "pulls">("commits");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    const fetchCommits = async (searchTerm = "", pageNum = 1) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pageNum.toString(),
                perPage: "30",
                ...(searchTerm && { search: searchTerm }),
            });

            const response = await fetch(
                `/api/projects/${projectId}/github/stored-commits?${params}`
            );

            const data = await response.json();
            if (!response.ok) {
                // If API indicates GitHub auth is invalid, surface reconnect
                if (data?.needsReconnect) {
                    setNeedsReconnect(true);
                    setApiErrorMessage(data?.error || "GitHub authentication required");
                    setCommits([]);
                    setHasMore(false);
                    return;
                }

                throw new Error(data?.error || "Failed to fetch commits");
            }

            setCommits(data.commits);
            setHasMore(data.pagination.hasMore);
        } catch (error) {
            console.error("Error fetching commits:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `/api/projects/${projectId}/github/branches?page=1&perPage=30`
            );

            if (!response.ok) {
                throw new Error("Failed to fetch branches");
            }

            const data = await response.json();
            setBranches(data.branches);
        } catch (error) {
            console.error("Error fetching branches:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPullRequests = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `/api/projects/${projectId}/github/pulls?page=1&perPage=30&state=all`
            );

            if (!response.ok) {
                throw new Error("Failed to fetch pull requests");
            }

            const data = await response.json();
            setPullRequests(data.pullRequests);
        } catch (error) {
            console.error("Error fetching pull requests:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        try {
            setSyncing(true);
            const response = await fetch(`/api/projects/${projectId}/github/sync`, {
                method: "POST",
            });

            const data = await response.json();
            if (!response.ok) {
                if (data?.needsReconnect) {
                    setNeedsReconnect(true);
                    setApiErrorMessage(data?.error || "GitHub authentication required");
                    return;
                }

                throw new Error(data?.error || "Failed to sync repository");
            }

            console.log(`Synced ${data.newCommitsCount} new commits`);

            // Refresh commits after sync
            if (activeTab === "commits") {
                await fetchCommits(searchQuery, page);
            }
        } catch (error) {
            console.error("Error syncing repository:", error);
        } finally {
            setSyncing(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchCommits(searchQuery, 1);
    };

    useEffect(() => {
        if (activeTab === "commits") {
            fetchCommits(searchQuery, page);
        } else if (activeTab === "branches") {
            fetchBranches();
        } else if (activeTab === "pulls") {
            fetchPullRequests();
        }
    }, [activeTab, projectId]);

    return (
        <div className="space-y-4">
            {needsReconnect && (
                <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 flex items-center justify-between">
                    <div>
                        <div className="font-medium">GitHub connection required</div>
                        <div className="text-sm">{apiErrorMessage || "Please reconnect your GitHub account."}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => (window.location.href = "/api/auth/signin/github")}
                        >
                            Reconnect GitHub
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => (window.location.href = "/account")}
                        >
                            Manage Connections
                        </Button>
                    </div>
                </div>
            )}
            {/* Header with tabs and actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant={activeTab === "commits" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveTab("commits")}
                    >
                        <GitBranch className="w-4 h-4 mr-2" />
                        Commits
                    </Button>
                    <Button
                        variant={activeTab === "branches" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveTab("branches")}
                    >
                        <GitBranch className="w-4 h-4 mr-2" />
                        Branches
                    </Button>
                    <Button
                        variant={activeTab === "pulls" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveTab("pulls")}
                    >
                        <GitPullRequest className="w-4 h-4 mr-2" />
                        Pull Requests
                    </Button>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSync}
                    disabled={syncing}
                >
                    {syncing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Sync Now
                </Button>
            </div>

            {/* Search bar for commits */}
            {activeTab === "commits" && (
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search commits by message, author, or SHA..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button type="submit" variant="secondary">
                        Search
                    </Button>
                </form>
            )}

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <>
                    {activeTab === "commits" && (
                        <div className="space-y-3">
                            {commits.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    No commits found. Click "Sync Now" to fetch commits.
                                </div>
                            ) : (
                                <>
                                    {commits.map((commit) => (
                                        <CommitCard
                                            key={commit.sha}
                                            commit={commit}
                                            onExplainCommit={onExplainCommit}
                                        />
                                    ))}

                                    {hasMore && (
                                        <div className="flex justify-center pt-4">
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    const nextPage = page + 1;
                                                    setPage(nextPage);
                                                    fetchCommits(searchQuery, nextPage);
                                                }}
                                            >
                                                Load More
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === "branches" && (
                        <div className="space-y-2">
                            {branches.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    No branches found.
                                </div>
                            ) : (
                                branches.map((branch) => (
                                    <div
                                        key={branch.name}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <GitBranch className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-medium">{branch.name}</span>
                                            {branch.protected && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Protected
                                                </Badge>
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground font-mono">
                                            {branch.sha.substring(0, 7)}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === "pulls" && (
                        <div className="space-y-2">
                            {pullRequests.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    No pull requests found.
                                </div>
                            ) : (
                                pullRequests.map((pr) => (
                                    <div
                                        key={pr.number}
                                        className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <GitPullRequest className="w-4 h-4 text-muted-foreground" />
                                                    <span className="font-medium">#{pr.number}</span>
                                                    <span>{pr.title}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    <span>by {pr.author}</span>
                                                    <span>
                                                        {new Date(pr.updatedAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant={
                                                        pr.merged
                                                            ? "default"
                                                            : pr.state === "open"
                                                                ? "secondary"
                                                                : "outline"
                                                    }
                                                >
                                                    {pr.merged ? "Merged" : pr.state}
                                                </Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => window.open(pr.url, "_blank")}
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
