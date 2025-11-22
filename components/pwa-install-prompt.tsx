"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, X } from "lucide-react";

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            setDeferredPrompt(null);
            setShowPrompt(false);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem("pwa-prompt-dismissed", "true");
    };

    if (!showPrompt || localStorage.getItem("pwa-prompt-dismissed")) {
        return null;
    }

    return (
        <Card className="fixed bottom-20 left-6 right-6 md:left-auto md:right-6 md:w-96 p-4 shadow-lg z-40 dark:bg-gray-900 dark:border-gray-800">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-[#22c55e] rounded-lg flex items-center justify-center">
                    <Download className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1">Install Synkora</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                        Install our app for a better experience with offline access and quick launch.
                    </p>
                    <div className="flex gap-2">
                        <Button
                            onClick={handleInstall}
                            size="sm"
                            className="bg-[#22c55e] hover:bg-[#16a34a]"
                        >
                            Install
                        </Button>
                        <Button
                            onClick={handleDismiss}
                            size="sm"
                            variant="ghost"
                        >
                            Not now
                        </Button>
                    </div>
                </div>
                <Button
                    onClick={handleDismiss}
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 flex-shrink-0"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </Card>
    );
}
