import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const projectId = params.id;
        const body = await request.json();
        const { githubRepoId, owner, name, fullName, accessToken } = body;

        // Validate required fields (accessToken may be omitted; we'll try to fallback to stored Account)
        if (!githubRepoId || !owner || !name || !fullName) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Load project and membership info separately so we can return clearer errors
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                team: {
                    include: {
                        members: true,
                    },
                },
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // Determine user's role on the project (if any)
        const team = project.team;
        const member = team?.members?.find((m: any) => m.userId === session.user.id) || null;
        const userRole = member ? member.role : null;

        // Only OWNER or EDITOR can connect a GitHub repo
        if (!member || !userRole || !["OWNER", "EDITOR"].includes(userRole)) {
            console.warn(`GitHub connect permission denied: user=${session.user.id} role=${userRole} project=${projectId}`);
            return NextResponse.json(
                { error: "Insufficient permissions to connect repository", role: userRole || "none" },
                { status: 403 }
            );
        }

        // If accessToken not provided in body, try to find a linked GitHub account for the user
        let tokenToStore = accessToken as string | undefined;
        if (!tokenToStore) {
            try {
                const account = await prisma.account.findFirst({
                    where: { userId: session.user.id, provider: "github" },
                });
                if (account?.access_token) {
                    tokenToStore = account.access_token;
                }
            } catch (err) {
                console.error("Error reading Account for fallback token:", err);
            }
        }

        if (!tokenToStore) {
            return NextResponse.json(
                { error: "Missing GitHub access token; please link your GitHub account and try again." },
                { status: 400 }
            );
        }

        // Encrypt the access token before storing
        const encryptedToken = encrypt(tokenToStore);

        // Create or update GitHub repository connection
        const gitRepo = await prisma.gitRepository.upsert({
            where: {
                projectId: projectId,
            },
            update: {
                githubRepoId,
                owner,
                name,
                fullName,
                accessToken: encryptedToken,
                lastSyncedAt: null, // Reset sync time
            },
            create: {
                projectId,
                githubRepoId,
                owner,
                name,
                fullName,
                accessToken: encryptedToken,
            },
        });

        return NextResponse.json({
            id: gitRepo.id,
            githubRepoId: gitRepo.githubRepoId,
            owner: gitRepo.owner,
            name: gitRepo.name,
            fullName: gitRepo.fullName,
            lastSyncedAt: gitRepo.lastSyncedAt,
        });
    } catch (error) {
        console.error("Error connecting GitHub repository:", error);
        return NextResponse.json(
            { error: "Failed to connect repository" },
            { status: 500 }
        );
    }
}
