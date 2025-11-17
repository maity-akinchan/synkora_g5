"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {AlertCircle, RefreshCcw} from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

export default function RepoAIChat() {
    const [repos, setRepos] = useState<{ id: string; fullName: string }[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<string | undefined>(undefined);
    const [prompt, setPrompt] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingRepos, setLoadingRepos] = useState(true);

    const loadRepositories = async () => {
        setLoadingRepos(true);
        setError(null);
        try {
            console.log("[RepoAIChat] Fetching repositories...");
            const res = await fetch("/api/github/repositories");

            console.log("[RepoAIChat] Response status:", res.status);

            if (res.status === 401) {
                setError("Please sign in with GitHub to use the AI Assistant");
                setLoadingRepos(false);
                return;
            }

            if (res.status === 403) {
                setError("Please connect your GitHub account in your account settings");
                setLoadingRepos(false);
                return;
            }

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                console.error("[RepoAIChat] Error response:", errData);
                throw new Error(errData.error || errData.details || "Failed to fetch repositories");
            }

            const data = await res.json();
            console.log("[RepoAIChat] Received data:", data);

            const items = (data.repositories || []).map((r: any) => ({
                id: r.id,
                fullName: r.fullName
            }));

            console.log("[RepoAIChat] Parsed repositories:", items);

            if (items.length === 0) {
                setError("No repositories found. Make sure you have repositories in your GitHub account.");
            } else {
                setRepos(items);
                if (!selectedRepo) setSelectedRepo(items[0].fullName);
            }
        } catch (e: any) {
            console.error("[RepoAIChat] Error loading repositories:", e);
            setError(e.message || "Could not load repositories. Please check your GitHub connection.");
        } finally {
            setLoadingRepos(false);
        }
    };

    useEffect(() => {
        loadRepositories();
    }, []);

    async function handleSend() {
        if (!prompt.trim()) return;
        setError(null);
        const userMessage: Message = { role: "user", content: prompt.trim() };
        setMessages((m) => [...m, userMessage]);
        setPrompt("");
        setLoading(true);

        try {
            const res = await fetch("/api/github/ai-insights", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    repoFullName: selectedRepo,
                    prompt: userMessage.content,
                    history: messages.map((mm) => ({role: mm.role, content: mm.content}))
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || errData.details || "AI request failed");
            }

            const data = await res.json();
            const assistant = data.assistant?.content || "(no response)";
            setMessages((m) => [...m, { role: "assistant", content: assistant }]);
        } catch (e: any) {
            console.error("[RepoAIChat] AI request error:", e);
            setError(e.message || "Failed to get AI response");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 p-3 border-b dark:border-gray-800">
                <label className="text-sm text-muted-foreground">Repository</label>
                {loadingRepos ? (
                    <div className="text-xs text-muted-foreground">Loading repositories...</div>
                ) : repos.length > 0 ? (
                    <select
                        className="px-3 py-2 border rounded bg-background text-sm dark:bg-gray-800 dark:border-gray-700"
                        value={selectedRepo}
                        onChange={(e) => setSelectedRepo(e.target.value)}
                    >
                        {repos.map((r) => (
                            <option key={r.id} value={r.fullName}>
                                {r.fullName}
                            </option>
                        ))}
                    </select>
                ) : (
                    <div className="flex items-center gap-2">
                        <div className="text-xs text-destructive">No repositories found</div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={loadRepositories}
                            className="h-6 px-2"
                        >
                            <RefreshCcw className="h-3 w-3 mr-1"/>
                            Retry
                        </Button>
                    </div>
                )}
            </div>

            {error ? (
                <div className="p-4 flex-1 flex items-center justify-center">
                    <div className="text-center max-w-xs">
                        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-destructive"/>
                        <p className="text-sm font-medium mb-2">{error}</p>
                        <p className="text-xs text-muted-foreground mb-3">
                            {error.includes("sign in")
                                ? "Please sign in using the GitHub option on the login page."
                                : error.includes("connect")
                                    ? "Go to your account settings to connect GitHub."
                                    : "Check the console for more details or try refreshing the page."}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadRepositories}
                        >
                            <RefreshCcw className="h-4 w-4 mr-2"/>
                            Retry
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="p-3 flex-1 overflow-auto">
                    {messages.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            {loadingRepos
                                ? "Loading repositories..."
                                : "Ask something about the repository—commits, PRs, or code structure."}
                        </p>
                    )}
                    {messages.map((m, i) => (
                        <div key={i} className={`mb-3 ${m.role === "user" ? "text-right" : "text-left"}`}>
                            <div className={`inline-block p-2 rounded max-w-[85%] ${
                                m.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-card text-card-foreground border dark:border-gray-700"
                            }`}>
                                <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="p-3 border-t dark:border-gray-800">
                <div className="flex gap-2">
                    <Input
                        className="flex-1"
                        value={prompt}
                        onChange={(e: any) => setPrompt(e.target.value)}
                        onKeyDown={(e: any) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Ask the AI about this repository..."
                        disabled={!selectedRepo || loading || !!error}
                    />
                    <Button
                        variant="default"
                        size="sm"
                        disabled={loading || !selectedRepo || !!error || !prompt.trim()}
                        onClick={handleSend}
                    >
                        {loading ? "Thinking..." : "Ask"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
