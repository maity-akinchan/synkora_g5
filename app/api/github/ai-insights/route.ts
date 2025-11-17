import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GitHubClient } from "@/lib/github-client";

type Body = {
    repoFullName?: string; // owner/repo
    prompt: string;
    history?: { role: string; content: string }[];
};

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!session.githubAccessToken) {
            return NextResponse.json(
                { error: "GitHub account not connected. Please sign in with GitHub." },
                { status: 403 }
            );
        }

        const body = (await request.json()) as Body;

        if (!body || !body.prompt) {
            return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
        }

        const githubClient = new GitHubClient(session.githubAccessToken as string);

        // Build context from repository if provided
        let repoContext = "";
        if (body.repoFullName) {
            const [owner, repo] = body.repoFullName.split("/");
            try {
                const repoInfo = await githubClient.getRepository(owner, repo);
                repoContext += `Repository: ${repoInfo.fullName}\nDescription: ${repoInfo.description || "(no description)"}\nURL: ${repoInfo.url}\n\n`;

                const commitsRes = await githubClient.getCommits(owner, repo, { perPage: 5 });
                if (commitsRes.commits.length) {
                    repoContext += "Recent commits:\n";
                    commitsRes.commits.forEach((c) => {
                        repoContext += `- ${c.message.split('\n')[0]} (by ${c.author})\n`;
                    });
                    repoContext += "\n";
                }

                // Try to fetch recent pull requests (best-effort)
                try {
                    const prsRes = await githubClient.getPullRequests(owner, repo, { perPage: 5, state: "open" });
                    if (prsRes.pullRequests.length) {
                        repoContext += "Open PRs:\n";
                        prsRes.pullRequests.forEach((pr) => {
                            repoContext += `- #${pr.number} ${pr.title} (by ${pr.author})\n`;
                        });
                        repoContext += "\n";
                    }
                } catch (e) {
                    // ignore PR errors
                }
            } catch (e) {
                // ignore repository fetch errors and proceed without repo context
            }
        }

        // Compose messages for OpenAI
        const systemPrompt = `You are an AI assistant that helps analyze GitHub repositories and answer developer questions. Use the repository context when available and be concise.`;

        const messages: any[] = [
            { role: "system", content: systemPrompt },
        ];

        if (repoContext) {
            messages.push({ role: "system", content: `Repository context:\n${repoContext}` });
        }

        if (body.history && Array.isArray(body.history)) {
            body.history.forEach((m) => messages.push(m));
        }

        messages.push({ role: "user", content: body.prompt });

        const openaiKey = process.env.OPENAI_API_KEY;
        if (!openaiKey) {
            return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
        }

        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${openaiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages,
                max_tokens: 700,
                temperature: 0.2,
            }),
        });

        if (!resp.ok) {
            const text = await resp.text();
            console.error("OpenAI error:", text);
            return NextResponse.json({ error: "OpenAI request failed" }, { status: 502 });
        }

        const data = await resp.json();
        const assistant = data?.choices?.[0]?.message;

        return NextResponse.json({ assistant });
    } catch (error) {
        console.error("Error in ai-insights route:", error);
        return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
    }
}
