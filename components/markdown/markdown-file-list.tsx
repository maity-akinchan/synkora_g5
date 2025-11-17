"use client";

import { useState } from "react";
import { FileText, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";

interface MarkdownFile {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
}

interface MarkdownFileListProps {
    files: MarkdownFile[];
    selectedFileId: string | null;
    onSelectFile(fileId: string): void;
    onCreateFile(title: string): Promise<void>;
    onDeleteFile(fieldId: string): Promise<void>;
}

export function MarkdownFileList({
    files,
    selectedFileId,
    onSelectFile,
    onCreateFile,
    onDeleteFile,
}: MarkdownFileListProps) {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newFileTitle, setNewFileTitle] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateFile = async () => {
        if (!newFileTitle.trim()) return;

        setIsCreating(true);
        try {
            await onCreateFile(newFileTitle);
            setNewFileTitle("");
            setIsCreateDialogOpen(false);
        } catch (error) {
            console.error("Error creating file:", error);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="w-64 border-r dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col">
            <div className="p-4 border-b dark:border-gray-800">
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            New Document
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Document</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <Input
                                placeholder="Document title"
                                value={newFileTitle}
                                onChange={(e) => setNewFileTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleCreateFile();
                                    }
                                }}
                            />
                            <Button
                                onClick={handleCreateFile}
                                disabled={!newFileTitle.trim() || isCreating}
                                className="w-full"
                            >
                                {isCreating ? "Creating..." : "Create"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex-1 overflow-y-auto">
                {files.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                        No documents yet. Create one to get started.
                    </div>
                ) : (
                    <div className="space-y-1 p-2">
                        {files.map((file) => (
                            <div
                                key={file.id}
                                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedFileId === file.id
                                        ? "bg-primary/10 text-primary"
                                    : "hover:bg-slate-100 dark:hover:bg-gray-800"
                                    }`}
                                onClick={() => onSelectFile(file.id)}
                            >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <FileText className="h-4 w-4 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate text-sm">
                                            {file.title}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                            {formatDistanceToNow(new Date(file.updatedAt), {
                                                addSuffix: true,
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm("Delete this document?")) {
                                            onDeleteFile(file.id);
                                        }
                                    }}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
