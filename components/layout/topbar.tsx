"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Bell,
    User,
    Settings,
    LogOut,
    Menu,
} from "lucide-react";
import { InvitationNotificationBadge } from "@/components/notifications/invitation-notification-badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface TopBarProps {
    user?: {
        name?: string | null;
        email?: string;
        image?: string | null;
    };
    onMenuClick?: () => void;
    showSearch?: boolean;
}

function getInitials(name: string | null | undefined, email: string | undefined): string {
    if (name) {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    }
    if (email) {
        return email.slice(0, 2).toUpperCase();
    }
    return "U";
}

export function TopBar({ user, onMenuClick, showSearch = true }: TopBarProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [defaultTeamName, setDefaultTeamName] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await fetch("/api/account/default-team");
                if (!mounted) return;
                if (res.ok) {
                    const data = await res.json();
                    if (data?.defaultTeam?.name) setDefaultTeamName(data.defaultTeam.name);
                }
            } catch (err) {
                // fail silently
            }
        })();

        return () => { mounted = false; };
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // TODO: Implement search functionality
            console.log("Searching for:", searchQuery);
        }
    };

    return (
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-950 border-b dark:border-gray-800">
            <div className="flex items-center justify-between px-4 md:px-6 py-3 gap-4">
                {/* Left Section - Mobile Menu & Search */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {onMenuClick && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onMenuClick}
                            className="lg:hidden h-9 w-9 p-0"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                    )}

                    {showSearch && (
                        <form onSubmit={handleSearch} className="flex-1 max-w-md">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search projects, tasks..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 h-9"
                                />
                            </div>
                        </form>
                    )}
                </div>

                {/* Right Section - Notifications & User Menu */}
                <div className="flex items-center gap-2">
                    {/* Theme Toggle */}
                    <ThemeToggle />

                    {/* Notifications */}
                    <InvitationNotificationBadge />

                    {/* User Menu */}
                    {defaultTeamName && (
                        <div className="hidden md:block mr-2">
                            <Badge className="capitalize">{defaultTeamName}</Badge>
                        </div>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user?.image || undefined} />
                                    <AvatarFallback className="text-xs">
                                        {getInitials(user?.name, user?.email)}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {user?.name || "User"}
                                    </p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user?.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push("/profile")}>
                                <User className="mr-2 h-4 w-4" />
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push("/settings")}>
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push("/account")}>
                                <User className="mr-2 h-4 w-4" />
                                Manage Default Team
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="text-red-600"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
