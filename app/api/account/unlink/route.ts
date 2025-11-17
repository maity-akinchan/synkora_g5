import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/account/unlink
 * Body: { provider: string }
 * Deletes the Account record for the provider for the current user.
 * Note: This only removes the OAuth link in the DB; it does not revoke tokens on the provider side.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const provider = body?.provider;

    if (!provider) {
      return NextResponse.json({ error: "Missing provider" }, { status: 400 });
    }

    // Delete the account record
    await prisma.account.deleteMany({
      where: {
        userId: user.id,
        provider,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error unlinking provider:", err);
    return NextResponse.json({ error: "Failed to unlink provider" }, { status: 500 });
  }
}