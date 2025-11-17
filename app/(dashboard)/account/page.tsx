"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AccountPage() {
    const [defaultTeam, setDefaultTeam] = useState<{ id: string; name: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchDefault = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/account/default-team");
            if (res.ok) {
                const body = await res.json();
                setDefaultTeam(body?.defaultTeam || null);
            }
        } catch (err) {
            console.error("Failed to load default team", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDefault(); }, []);

    const clearDefault = async () => {
        try {
            const res = await fetch("/api/account/default-team", { method: "DELETE" });
            if (res.ok) {
                toast.success("Default team cleared");
                setDefaultTeam(null);
            } else {
                const body = await res.json().catch(() => null);
                toast.error(body?.error || "Failed to clear default team");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to clear default team");
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Account Settings</h1>

            <Card className="p-6 mb-4">
                <h2 className="text-lg font-semibold">Default Team</h2>
                {loading ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                ) : (
                    <div className="mt-3 flex items-center justify-between">
                        <div>
                            {defaultTeam ? (
                                <div>
                                    <p className="font-medium">{defaultTeam.name}</p>
                                    <p className="text-sm text-muted-foreground">Team ID: {defaultTeam.id}</p>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No default team set.</p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {defaultTeam && (
                                <Button variant="outline" onClick={clearDefault}>Clear</Button>
                            )}
                            <Button onClick={() => router.push('/teams')}>Manage Teams</Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
