import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GitHubClient } from "@/lib/github-client";
import {prisma} from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        console.log("[GitHub Repositories API] Session check:", {
            hasSession: !!session,
            hasUser: !!session?.user,
            userId: session?.user?.id,
            hasGitHubToken: !!session?.githubAccessToken,
        });

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check if user has GitHub access token in session
        let githubAccessToken = session.githubAccessToken;

        // If not in session, try to fetch from database
        if (!githubAccessToken) {
            console.log("[GitHub Repositories API] No GitHub token in session, checking database...");

            const githubAccount = await prisma.account.findFirst({
                where: {
                    userId: session.user.id,
                    provider: "github",
                },
                select: {
                    access_token: true,
                    expires_at: true,
                },
            });

            if (githubAccount?.access_token) {
                // Check if token is expired
                const now = Math.floor(Date.now() / 1000);
                const isExpired = githubAccount.expires_at && githubAccount.expires_at < now;

                if (isExpired) {
                    console.log("[GitHub Repositories API] GitHub token has expired");
                    return NextResponse.json(
                        {
                            error: "GitHub token expired. Please reconnect your GitHub account.",
                            needsReconnect: true,
                        },
                        {status: 401}
                    );
                }

                githubAccessToken = githubAccount.access_token;
            }
        }

        if (!githubAccessToken) {
            console.log("[GitHub Repositories API] No GitHub access token found for user:", session.user.id);
            // Provide more diagnostic info to help debug missing tokens
            const accountRecord = await prisma.account.findFirst({
                where: { userId: session.user.id, provider: "github" },
                select: { id: true, access_token: true, expires_at: true },
            });

            console.log("[GitHub Repositories API] DB account lookup:", { accountFound: !!accountRecord, account: accountRecord ? { hasAccessToken: !!accountRecord.access_token, expires_at: accountRecord.expires_at } : null });

            return NextResponse.json(
                {
                    error: "GitHub account not connected. Please sign in with GitHub to access repositories.",
                    needsReconnect: true,
                    accountExists: !!accountRecord,
                },
                { status: 403 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const perPage = parseInt(searchParams.get("perPage") || "30");

        console.log("[GitHub Repositories API] Fetching repositories for user:", session.user.id, {
            page,
            perPage,
        });

        // Create GitHub client and fetch user's repositories
        const githubClient = new GitHubClient(githubAccessToken);
        const result = await githubClient.listUserRepositories({
            page,
            perPage,
        });

        console.log("[GitHub Repositories API] Successfully fetched repositories:", {
            count: result.repositories.length,
            hasMore: result.hasMore,
        });

        return NextResponse.json({
            repositories: result.repositories,
            hasMore: result.hasMore,
            page,
            perPage,
        });
    } catch (error: any) {
        console.error("[GitHub Repositories API] Error fetching user repositories:", {
            error: error.message,
            stack: error.stack,
            response: error.response?.data,
            status: error.status,
        });

        // Check if it's an authentication error
        if (error.status === 401 || error.message?.includes("Bad credentials")) {
            return NextResponse.json(
                {
                    error: "GitHub authentication failed. Your token may be invalid or expired. Please reconnect your GitHub account in Settings.",
                    needsReconnect: true,
                },
                {status: 401}
            );
        }

        return NextResponse.json(
            {
                error: "Failed to fetch repositories",
                details: error.message
            },
            { status: 500 }
        );
    }
}
