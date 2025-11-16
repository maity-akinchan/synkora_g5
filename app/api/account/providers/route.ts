import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/account/providers
 * Returns list of linked OAuth providers for the current user
 */
export async function GET() {
  try {
    const user = await requireAuth();

    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        provider: true,
        providerAccountId: true,
      },
    });

    return NextResponse.json({ providers: accounts });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching account providers:", err);
    return NextResponse.json({ error: "Failed to fetch providers" }, { status: 500 });
  }
}