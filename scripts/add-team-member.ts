#!/usr/bin/env tsx
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const teamId = process.argv[2];
  const userId = process.argv[3];
  const role = (process.argv[4] || "EDITOR") as "OWNER" | "EDITOR" | "VIEWER";

  if (!teamId || !userId) {
    console.error("Usage: tsx scripts/add-team-member.ts <teamId> <userId> [OWNER|EDITOR|VIEWER]");
    process.exit(1);
  }

  try {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      console.error("Team not found:", teamId);
      process.exit(1);
    }

    // Check if member already exists
    const existing = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });

    if (existing) {
      console.log("User is already a member of the team:", existing);
      process.exit(0);
    }

    const member = await prisma.teamMember.create({
      data: {
        teamId,
        userId,
        role,
      },
    });

    console.log("Created team member:", member);
  } catch (err) {
    console.error("Error creating team member:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
