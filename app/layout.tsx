import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";

export const metadata: Metadata = {
    title: "Synkora - Collaborative Project Management",
    description: "AI-assisted project management platform with real-time collaboration",
    manifest: "/manifest.json",
    themeColor: "#22c55e",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Synkora",
    },
    viewport: {
        width: "device-width",
        initialScale: 1,
        maximumScale: 1,
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="apple-touch-icon" href="/icon-192x192.png" />
            </head>
            <body className="antialiased">
                <ThemeProvider defaultTheme="dark" storageKey="synkora-theme">
                    <SessionProvider>
                        {children}
                        <PWAInstallPrompt />
                    </SessionProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
