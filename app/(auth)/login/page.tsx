"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import DarkVeil from "@/components/home/DarkVeil";
import { useTheme } from "@/components/providers/theme-provider";

export default function LoginPage() {
    const router = useRouter();
    const { theme } = useTheme();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);

    useEffect(() => {
        const checkTheme = () => {
            const root = document.documentElement;
            const isDark = root.classList.contains("dark");
            setIsDarkMode(isDark);
        };
        
        checkTheme();
        
        // Watch for theme changes
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });
        
        return () => observer.disconnect();
    }, [theme]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid email or password");
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch (error) {
            setError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            await signIn("google", { callbackUrl: "/dashboard" });
        } catch (error) {
            setError("Failed to sign in with Google");
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-950 dark:to-black p-4 relative overflow-hidden">
            <div 
                className="fixed inset-0 w-full h-full z-0"
                style={{ 
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                }}
            >
                <div 
                    className="absolute inset-0 w-full h-full transition-opacity duration-300"
                    style={{ 
                        opacity: isDarkMode ? 1 : 0.25 
                    }}
                >
                    <DarkVeil />
                </div>
                {!isDarkMode && (
                    <div 
                        className="absolute inset-0 bg-gradient-to-br from-white/70 via-slate-50/50 to-white/70 pointer-events-none"
                        style={{ zIndex: 1 }}
                    />
                )}
            </div>
            <Card className="w-full max-w-md glass dark:glass relative z-10">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-lime-400 to-green-500 bg-clip-text text-transparent dark:neon-text">
                        Welcome back
                    </CardTitle>
                    <CardDescription>
                        Sign in to your account to continue
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        {error && (
                            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                                {error}
                            </div>
                        )}
                        <Button
                            type="submit"
                            variant="neon"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? "Signing in..." : "Sign in"}
                        </Button>
                    </form>

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                    >
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Sign in with Google
                    </Button>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                    <div className="text-sm text-muted-foreground text-center">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="text-primary hover:underline font-medium">
                            Sign up
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
