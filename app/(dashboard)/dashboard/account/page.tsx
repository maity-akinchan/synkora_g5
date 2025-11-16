"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Github, Trash2 } from "lucide-react";

interface ProviderInfo {
  id: string;
  provider: string;
  providerAccountId: string;
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [providers, setProviders] = useState<ProviderInfo[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [unlinking, setUnlinking] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProviders();
    }
  }, [status]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/account/providers");
      if (!res.ok) throw new Error("Failed to fetch providers");
      const data = await res.json();
      setProviders(data.providers || []);
    } catch (err) {
      console.error("Failed to load providers:", err);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkGitHub = async () => {
    const callbackUrl = window.location.href;
    await signIn("github", { callbackUrl });
    // After redirect back NextAuth should have linked the provider — user can refresh.
  };

  const handleUnlink = async (provider: string) => {
    if (!confirm(`Unlink ${provider}? This will remove the OAuth connection.`)) return;
    try {
      setUnlinking(provider);
      const res = await fetch("/api/account/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to unlink");
      }
      // Refresh list
      await fetchProviders();
    } catch (err) {
      console.error("Unlink failed:", err);
      alert("Failed to unlink provider. Check server logs.");
    } finally {
      setUnlinking(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage connected accounts and OAuth providers.
          </p>
        </div>
        <div>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
            Back to dashboard
          </Link>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Connected Accounts</h2>

        <div className="space-y-4">
          {providers && providers.length === 0 && (
            <div className="text-sm text-muted-foreground">No linked providers yet.</div>
          )}

          {providers && providers.length > 0 && (
            <div className="space-y-2">
              {providers.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    {p.provider === "github" && <Github className="w-5 h-5" />}
                    <div>
                      <div className="font-medium">{p.provider}</div>
                      <div className="text-xs text-muted-foreground">
                        id: {p.providerAccountId}
                      </div>
                    </div>
                  </div>
                  <div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleUnlink(p.provider)}
                      disabled={unlinking !== null}
                    >
                      {unlinking === p.provider ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Unlink
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2">
            <div className="text-sm text-muted-foreground mb-2">Link a new provider</div>
            <div className="flex gap-2">
              <Button onClick={handleLinkGitHub} disabled={unlinking !== null}>
                <Github className="w-4 h-4 mr-2" />
                Link GitHub
              </Button>
              {/* Add other provider buttons here if desired */}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}