"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Invitation {
    id: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
    expiresAt: string;
    team: {
        name: string;
    };
}

export default function DebugInvitationsPage() {
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [userEmail, setUserEmail] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                // Get current user's email
                const sessionRes = await fetch("/api/auth/session");
                if (sessionRes.ok) {
                    const session = await sessionRes.json();
                    setUserEmail(session?.user?.email || "Not logged in");
                }

                // Get all invitations for this user
                const invitationsRes = await fetch("/api/team-invitations");
                if (invitationsRes.ok) {
                    const data = await invitationsRes.json();
                    setInvitations(data);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">Debug: Team Invitations</h1>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold mb-2">Debug: Team Invitations</h1>
                <p className="text-muted-foreground">
                    This page shows all team invitations for the current user
                </p>
            </div>

            <Card className="p-6">
                <h2 className="font-semibold mb-2">Current User</h2>
                <p className="text-sm">
                    <span className="text-muted-foreground">Email: </span>
                    <span className="font-mono">{userEmail}</span>
                </p>
            </Card>

            <Card className="p-6">
                <h2 className="font-semibold mb-4">
                    Invitations ({invitations.length})
                </h2>

                {invitations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No invitations found for {userEmail}
                    </p>
                ) : (
                    <div className="space-y-4">
                        {invitations.map((inv) => (
                            <div
                                key={inv.id}
                                className="border rounded-lg p-4 space-y-2"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">{inv.team.name}</h3>
                                    <Badge
                                        variant={
                                            inv.status === "PENDING"
                                                ? "default"
                                                : "secondary"
                                        }
                                    >
                                        {inv.status}
                                    </Badge>
                                </div>
                                <div className="text-sm space-y-1">
                                    <p>
                                        <span className="text-muted-foreground">
                                            Email:{" "}
                                        </span>
                                        <span className="font-mono">{inv.email}</span>
                                    </p>
                                    <p>
                                        <span className="text-muted-foreground">
                                            Role:{" "}
                                        </span>
                                        {inv.role}
                                    </p>
                                    <p>
                                        <span className="text-muted-foreground">
                                            Created:{" "}
                                        </span>
                                        {new Date(inv.createdAt).toLocaleString()}
                                    </p>
                                    <p>
                                        <span className="text-muted-foreground">
                                            Expires:{" "}
                                        </span>
                                        {new Date(inv.expiresAt).toLocaleString()}
                                    </p>
                                    <p>
                                        <span className="text-muted-foreground">
                                            ID:{" "}
                                        </span>
                                        <span className="font-mono text-xs">
                                            {inv.id}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <Card className="p-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <h2 className="font-semibold mb-2">How to Test</h2>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                    <li>
                        Create a team and invite someone using their email address
                    </li>
                    <li>
                        The invited person must have an account with that exact email
                    </li>
                    <li>
                        They should log in and visit this page to see their invitations
                    </li>
                    <li>
                        Check the bell icon in the navigation bar for notifications
                    </li>
                    <li>
                        Visit the Teams page to accept or decline invitations
                    </li>
                </ol>
            </Card>

            <Card className="p-6 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
                <h2 className="font-semibold mb-2">Common Issues</h2>
                <ul className="text-sm space-y-2 list-disc list-inside">
                    <li>
                        <strong>Email mismatch:</strong> The invitation email must
                        exactly match the user's registered email
                    </li>
                    <li>
                        <strong>No account:</strong> The invited person needs to
                        register first
                    </li>
                    <li>
                        <strong>Expired:</strong> Invitations expire after 7 days
                    </li>
                    <li>
                        <strong>Already a member:</strong> Can't invite existing team
                        members
                    </li>
                </ul>
            </Card>
        </div>
    );
}
