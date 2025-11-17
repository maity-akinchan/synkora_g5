"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Loader2, SplitSquareVertical } from "lucide-react";
import { MarkdownEditor } from "@/components/markdown/markdown-editor";
import { MarkdownPreview } from "@/components/markdown/markdown-preview";
import { MarkdownToolbar } from "@/components/markdown/markdown-toolbar";
import { MarkdownFileList } from "@/components/markdown/markdown-file-list";
import { MarkdownTypingIndicator } from "@/components/markdown/markdown-typing-indicator";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/hooks/use-socket";

interface MarkdownFile {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export default function MarkdownPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const { socket } = useSocket({ projectId, autoConnect: false });

    const [files, setFiles] = useState<MarkdownFile[]>([]);
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
    const [content, setContent] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(true);

    const saveTimeoutRef = useRef<NodeJS.Timeout>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout>(null);

    useEffect(() => {
        fetchFiles();
    }, [projectId]);

    useEffect(() => {
        if (selectedFileId) {
            fetchFileContent(selectedFileId);
        }
    }, [selectedFileId]);

    // Join project room for real-time updates (optional - only if socket is available)
    useEffect(() => {
        if (socket?.connected && projectId) {
            socket.emit("join-project", projectId);

            // Listen for markdown updates from other users
            socket.on("markdown:update", handleRemoteUpdate);

            return () => {
                socket.off("markdown:update", handleRemoteUpdate);
                if (socket.connected) {
                    socket.emit("leave-project", projectId);
                }
            };
        }
    }, [socket, projectId, selectedFileId]);

    const handleRemoteUpdate = (data: { fileId: string; content: string; userId: string }) => {
        if (data.fileId === selectedFileId) {
            setContent(data.content);
        }
    };

    const fetchFiles = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/projects/${projectId}/markdown`);
            if (response.ok) {
                const data = await response.json();
                setFiles(data);
                if (data.length > 0 && !selectedFileId) {
                    setSelectedFileId(data[0].id);
                }
            }
        } catch (error) {
            console.error("Error fetching files:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchFileContent = async (fileId: string) => {
        try {
            const response = await fetch(`/api/markdown/${fileId}`);
            if (response.ok) {
                const data = await response.json();
                setContent(data.content);
            }
        } catch (error) {
            console.error("Error fetching file content:", error);
        }
    };

    const handleContentChange = (newContent: string) => {
        setContent(newContent);

        // Emit typing indicator (optional - only if socket is available)
        if (socket?.connected && selectedFileId) {
            socket.emit("typing:start", {
                projectId,
                context: `markdown:${selectedFileId}`,
                timestamp: new Date().toISOString(),
            });

            // Clear previous typing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Stop typing indicator after 2 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                if (socket?.connected) {
                    socket.emit("typing:stop", {
                        projectId,
                        context: `markdown:${selectedFileId}`,
                    });
                }
            }, 2000);
        }

        // Broadcast update to other users for real-time collaboration (debounced)
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            // Broadcast to socket if available (optional)
            if (socket?.connected && selectedFileId) {
                socket.emit("markdown:update", {
                    projectId,
                    fileId: selectedFileId,
                    content: newContent,
                });
            }
            // Always save to database
            saveContent(newContent);
        }, 1000);
    };

    const saveContent = async (contentToSave: string) => {
        if (!selectedFileId) return;

        try {
            setIsSaving(true);
            const response = await fetch(`/api/markdown/${selectedFileId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: contentToSave }),
            });

            if (response.ok) {
                const updatedFile = await response.json();
                setFiles(prevFiles =>
                    prevFiles.map(file =>
                        file.id === selectedFileId
                            ? {...file, updatedAt: updatedFile.updatedAt}
                            : file
                    )
                );
            }
        } catch (error) {
            console.error("Error saving content:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateFile = async (title: string) => {
        try {
            const response = await fetch(`/api/projects/${projectId}/markdown`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, content: "" }),
            });

            if (response.ok) {
                const newFile = await response.json();
                setFiles([newFile, ...files]);
                setSelectedFileId(newFile.id);
                setContent("");
            }
        } catch (error) {
            console.error("Error creating file:", error);
        }
    };

    const handleDeleteFile = async (fileId: string) => {
        try {
            const response = await fetch(`/api/markdown/${fileId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setFiles(files.filter((f) => f.id !== fileId));
                if (selectedFileId === fileId) {
                    const remainingFiles = files.filter((f) => f.id !== fileId);
                    setSelectedFileId(remainingFiles.length > 0 ? remainingFiles[0].id : null);
                    setContent("");
                }
            }
        } catch (error) {
            console.error("Error deleting file:", error);
        }
    };

    const handleToolbarInsert = (before: string, after: string = "") => {
        // Insert at the end of content for now
        const newContent = content + "\n" + before + after;
        setContent(newContent);
        handleContentChange(newContent);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-12rem)] flex bg-white dark:bg-gray-950 rounded-lg shadow-lg overflow-hidden">
            {/* File List Sidebar */}
            <MarkdownFileList
                files={files}
                selectedFileId={selectedFileId}
                onSelectFile={setSelectedFileId}
                onCreateFile={handleCreateFile}
                onDeleteFile={handleDeleteFile}
            />

            {/* Editor Area */}
            {selectedFileId ? (
                <div className="flex-1 flex flex-col">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between border-b dark:border-gray-800">
                        <MarkdownToolbar onInsert={handleToolbarInsert} />
                        <div className="flex items-center gap-2 px-4">
                            {isSaving && (
                                <span className="text-xs text-slate-500 dark:text-slate-400">Saving...</span>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowPreview(!showPreview)}
                            >
                                <SplitSquareVertical className="h-4 w-4 mr-2" />
                                {showPreview ? "Hide Preview" : "Show Preview"}
                            </Button>
                        </div>
                    </div>

                    {/* Editor and Preview */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 flex overflow-hidden">
                            <div
                                className={`${showPreview ? "w-1/2" : "w-full"
                                } border-r dark:border-gray-800 overflow-hidden`}
                            >
                                <MarkdownEditor
                                    value={content}
                                    onChange={handleContentChange}
                                />
                            </div>
                            {showPreview && (
                                <div className="w-1/2 overflow-hidden">
                                    <MarkdownPreview content={content} />
                                </div>
                            )}
                        </div>
                        {/* Typing Indicator */}
                        <MarkdownTypingIndicator projectId={projectId} fileId={selectedFileId} />
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400">
                    <div className="text-center">
                        <p className="text-lg mb-2">No document selected</p>
                        <p className="text-sm">Create a new document to get started</p>
                    </div>
                </div>
            )}
        </div>
    );
}
