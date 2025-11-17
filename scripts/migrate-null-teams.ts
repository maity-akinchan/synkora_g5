#!/usr/bin/env tsx
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting migration: assign teams for projects with null teamId...");

  // Find distinct creators of projects with null teamId
  const projects = await prisma.project.findMany({
    where: { teamId: null },
    select: { createdById: true },
  });

  const creatorIds = Array.from(new Set(projects.map(p => p.createdById)));

  console.log(`Found ${creatorIds.length} users with projects missing teamId`);

  for (const userId of creatorIds) {
    try {
      // Create a personal team for the user
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const teamName = user?.name ? `${user.name}'s Team` : `${user?.email || userId}'s Team`;

      console.log(`Creating team for user ${userId} -> ${teamName}`);

      const team = await prisma.team.create({
        data: {
          name: teamName,
          members: {
            create: {
              userId,
              role: "OWNER",
            },
          },
        },
      });

      // Update all projects for this user with null teamId
      const update = await prisma.project.updateMany({
        where: { createdById: userId, teamId: null },
        data: { teamId: team.id },
      });

      console.log(`Assigned ${update.count} projects to team ${team.id}`);
    } catch (err) {
      console.error(`Failed to create team or update projects for user ${userId}:`, err);
    }
  }

  console.log("Migration complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
