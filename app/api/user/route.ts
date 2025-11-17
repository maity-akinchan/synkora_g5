import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

/**
 * Get current user profile
 */
export async function GET() {
    try {
        const user = await requireAuth();

        const userProfile = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                email: true,
                name: true,
                image: true,
                createdAt: true,
                defaultTeamId: true,
            },
        });

        if (!userProfile) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(userProfile);
    } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
