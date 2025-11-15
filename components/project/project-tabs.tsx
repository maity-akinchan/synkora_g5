"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    BarChart3,
    Palette,
    FileText,
    GitBranch,
    FileSpreadsheet
} from "lucide-react";

interface ProjectTabsProps {
    projectId: string;
}

const tabs = [
    {
        name: "Kanban",
        href: "kanban",
        icon: LayoutDashboard,
        shortcut: "1",
    },
    {
        name: "Analytics",
        href: "analytics",
        icon: BarChart3,
        shortcut: "2",
    },
    {
        name: "Canvas",
        href: "canvas",
        icon: Palette,
        shortcut: "3",
    },
    {
        name: "Markdown",
        href: "markdown",
        icon: FileText,
        shortcut: "4",
    },
    {
        name: "Git",
        href: "git",
        icon: GitBranch,
        shortcut: "5",
    },
    {
        name: "Sheets",
        href: "sheet",
        icon: FileSpreadsheet,
        shortcut: "6"
    }
];

export function ProjectTabs({ projectId }: ProjectTabsProps) {
    const pathname = usePathname();
    const router = useRouter();

    const handleTabClick = (href: string) => {
        router.push(`/projects/${projectId}/${href}`);
    };

    const isActive = (href: string) => {
        return pathname?.includes(`/${href}`);
    };

    // Keyboard shortcuts for tab switching (Cmd/Ctrl + number)
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Check if Cmd (Mac) or Ctrl (Windows/Linux) is pressed
            if (event.metaKey || event.ctrlKey) {
                const pressedKey = event.key;
                const tab = tabs.find((t) => t.shortcut === pressedKey);

                if (tab) {
                    event.preventDefault();
                    handleTabClick(tab.href);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [projectId]);

    return (
        <nav className="bg-white dark:bg-gray-950 border-b dark:border-gray-800">
            <div className="flex items-center px-4 md:px-6 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = isActive(tab.href);

                    return (
                        <button
                            key={tab.href}
                            onClick={() => handleTabClick(tab.href)}
                            className={cn(
                                "flex items-center gap-2 px-3 md:px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0",
                                active
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                            )}
                            title={`${tab.name} (⌘${tab.shortcut})`}
                        >
                            <Icon className="h-4 w-4" />
                            <span className="hidden sm:inline">{tab.name}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
