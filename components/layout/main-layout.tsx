"use client";

import { ReactNode, useState } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";
import { Toaster } from "@/components/ui/toaster";
import { motion, AnimatePresence } from "framer-motion";

interface MainLayoutProps {
    children: ReactNode;
    user?: {
        name?: string | null;
        email?: string;
        image?: string | null;
    };
    showSearch?: boolean;
}

export function MainLayout({ children, user, showSearch = true }: MainLayoutProps) {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-950 dark:to-black">
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                            onClick={() => setIsMobileSidebarOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -256 }}
                            animate={{ x: 0 }}
                            exit={{ x: -256 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-950 border-r dark:border-gray-800 lg:hidden"
                        >
                            <Sidebar />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <TopBar
                    user={user}
                    onMenuClick={() => setIsMobileSidebarOpen(true)}
                    showSearch={showSearch}
                />
                <main className="flex-1">
                    {children}
                </main>
                <Toaster />
            </div>
        </div>
    );
}
