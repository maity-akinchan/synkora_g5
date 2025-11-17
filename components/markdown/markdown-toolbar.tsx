"use client";

import {
    Bold,
    Italic,
    Heading1,
    Heading2,
    List,
    ListOrdered,
    Link,
    Code,
    Quote
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MarkdownToolbarProps {
    onInsert(before: string, after?: string): void;
}

export function MarkdownToolbar({ onInsert }: MarkdownToolbarProps) {
    const tools = [
        { icon: Bold, label: "Bold", before: "**", after: "**" },
        { icon: Italic, label: "Italic", before: "*", after: "*" },
        { icon: Heading1, label: "Heading 1", before: "# ", after: "" },
        { icon: Heading2, label: "Heading 2", before: "## ", after: "" },
        { icon: List, label: "Bullet List", before: "- ", after: "" },
        { icon: ListOrdered, label: "Numbered List", before: "1. ", after: "" },
        { icon: Link, label: "Link", before: "[", after: "](url)" },
        { icon: Code, label: "Code", before: "`", after: "`" },
        { icon: Quote, label: "Quote", before: "> ", after: "" },
    ];

    return (
        <div className="flex items-center gap-1 p-2 border-b dark:border-gray-800 bg-slate-50 dark:bg-gray-900">
            {tools.map((tool) => (
                <Button
                    key={tool.label}
                    variant="ghost"
                    size="sm"
                    onClick={() => onInsert(tool.before, tool.after)}
                    title={tool.label}
                    className="h-8 w-8 p-0"
                >
                    <tool.icon className="h-4 w-4" />
                </Button>
            ))}
        </div>
    );
}
