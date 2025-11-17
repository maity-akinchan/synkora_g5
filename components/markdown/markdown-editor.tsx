"use client";

interface MarkdownEditorProps {
    value: string;
    onChange(value: string): void;
    placeholder?: string;
}

export function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
    return (
        <div className="h-full flex flex-col">
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder || "Start writing in markdown..."}
                className="flex-1 w-full p-4 font-mono text-sm bg-white dark:bg-gray-900 dark:text-gray-100 border-0 focus:outline-none resize-none dark:placeholder-gray-500"
                style={{ minHeight: "100%" }}
            />
        </div>
    );
}
