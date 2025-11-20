-- =====================================================
-- Teams and Invitations Queries
-- =====================================================
-- SQL equivalents of Prisma queries from:
-- - app/api/teams/route.ts
-- - app/api/team-invitations/route.ts
-- - app/api/team-invitations/[id]/accept/route.ts
-- - app/api/team-invitations/[id]/reject/route.ts

-- =====================================================
-- List User's Teams
-- =====================================================
-- Equivalent to: GET /api/teams
-- Prisma: prisma.team.findMany with includes
-- Used in: app/api/teams/route.ts

-- Get all teams where user is a member
SELECT 
    t.id,
    t.name,
    t."createdAt",
    t."updatedAt",
    (
        SELECT json_agg(
            json_build_object(
                'id', tm.id,
                'teamId', tm."teamId",
                'userId', tm."userId",
                'role', tm.role,
                'createdAt', tm."createdAt",
                'user', json_build_object(
                    'id', u.id,
                    'name', u.name,
                    'email', u.email,
                    'image', u.image
                )
            )
        )
        FROM "TeamMember" tm
        INNER JOIN "User" u ON tm."userId" = u.id
        WHERE tm."teamId" = t.id
    ) as members,
    (
        SELECT COUNT(*)::INTEGER
        FROM "Project" p
        WHERE p."teamId" = t.id
    ) as "projectCount"
FROM "Team" t
INNER JOIN "TeamMember" tm ON t.id = tm."teamId"
WHERE tm."userId" = $1
ORDER BY t."createdAt" DESC;

-- =====================================================
-- Create Team
-- =====================================================
-- Equivalent to: POST /api/teams
-- Prisma: prisma.team.create with nested create
-- Used in: app/api/teams/route.ts

-- Create team with creator as OWNER (using transaction)
BEGIN;

-- Create team
INSERT INTO "Team" (id, name, "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::TEXT,
    $1,  -- name
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
RETURNING id INTO team_id_var;

-- Add creator as OWNER
INSERT INTO "TeamMember" (id, "teamId", "userId", role, "createdAt")
VALUES (
    gen_random_uuid()::TEXT,
    team_id_var,
    $2,  -- userId
    'OWNER',
    CURRENT_TIMESTAMP
);

COMMIT;

-- Create team with members info (using CTE)
WITH new_team AS (
    INSERT INTO "Team" (id, name, "createdAt", "updatedAt")
    VALUES (
        gen_random_uuid()::TEXT,
        $1,  -- name
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    RETURNING *
),
new_member AS (
    INSERT INTO "TeamMember" (id, "teamId", "userId", role, "createdAt")
    SELECT 
        gen_random_uuid()::TEXT,
        t.id,
        $2,  -- userId
        'OWNER',
        CURRENT_TIMESTAMP
    FROM new_team t
    RETURNING *
)
SELECT 
    t.*,
    (
        SELECT json_agg(
            json_build_object(
                'id', tm.id,
                'teamId', tm."teamId",
                'userId', tm."userId",
                'role', tm.role,
                'createdAt', tm."createdAt",
                'user', json_build_object(
                    'id', u.id,
                    'name', u.name,
                    'email', u.email,
                    'image', u.image
                )
            )
        )
        FROM "TeamMember" tm
        INNER JOIN "User" u ON tm."userId" = u.id
        WHERE tm."teamId" = t.id
    ) as members,
    (
        SELECT COUNT(*)::INTEGER
        FROM "Project" p
        WHERE p."teamId" = t.id
    ) as "projectCount"
FROM new_team t;

-- =====================================================
-- Team Members
-- =====================================================

-- Get team members
SELECT 
    tm.id,
    tm."teamId",
    tm."userId",
    tm.role,
    tm."createdAt",
    u.id as "user.id",
    u.name as "user.name",
    u.email as "user.email",
    u.image as "user.image"
FROM "TeamMember" tm
INNER JOIN "User" u ON tm."userId" = u.id
WHERE tm."teamId" = $1
ORDER BY tm."createdAt" ASC;

-- Add team member
INSERT INTO "TeamMember" (id, "teamId", "userId", role, "createdAt")
VALUES (
    gen_random_uuid()::TEXT,
    $1,  -- teamId
    $2,  -- userId
    $3,  -- role
    CURRENT_TIMESTAMP
)
RETURNING *;

-- Remove team member
DELETE FROM "TeamMember"
WHERE "teamId" = $1 AND "userId" = $2
RETURNING id;

-- Update team member role
UPDATE "TeamMember"
SET role = $3
WHERE "teamId" = $1 AND "userId" = $2
RETURNING *;

-- =====================================================
-- Team Invitations
-- =====================================================

-- Get pending invitations for user
-- Equivalent to: GET /api/team-invitations
-- Prisma: prisma.teamInvitation.updateMany + prisma.teamInvitation.findMany
-- Used in: app/api/team-invitations/route.ts

-- Update expired invitations
UPDATE "TeamInvitation"
SET status = 'EXPIRED'
WHERE email = $1 
    AND status = 'PENDING'
    AND "expiresAt" < CURRENT_TIMESTAMP;

-- Get pending invitations with team info
SELECT 
    ti.id,
    ti."teamId",
    ti.email,
    ti.role,
    ti.status,
    ti."invitedBy",
    ti."createdAt",
    ti."expiresAt",
    json_build_object(
        'id', t.id,
        'name', t.name,
        'projectCount', (
            SELECT COUNT(*)::INTEGER
            FROM "Project" p
            WHERE p."teamId" = t.id
        ),
        'memberCount', (
            SELECT COUNT(*)::INTEGER
            FROM "TeamMember" tm
            WHERE tm."teamId" = t.id
        )
    ) as team
FROM "TeamInvitation" ti
INNER JOIN "Team" t ON ti."teamId" = t.id
WHERE ti.email = $1 AND ti.status = 'PENDING'
ORDER BY ti."createdAt" DESC;

-- Create team invitation
INSERT INTO "TeamInvitation" (
    id, "teamId", email, role, status, "invitedBy", 
    "createdAt", "expiresAt"
)
VALUES (
    gen_random_uuid()::TEXT,
    $1,  -- teamId
    $2,  -- email
    $3,  -- role
    'PENDING',
    $4,  -- invitedBy
    CURRENT_TIMESTAMP,
    $5   -- expiresAt
)
RETURNING *;

-- Accept team invitation
-- Equivalent to: POST /api/team-invitations/[id]/accept
-- Used in: app/api/team-invitations/[id]/accept/route.ts

BEGIN;

-- Get invitation
SELECT id, "teamId", email, role, status, "expiresAt"
FROM "TeamInvitation"
WHERE id = $1 AND status = 'PENDING'
FOR UPDATE;

-- Check if expired
-- (Application should check expiresAt before proceeding)

-- Get user by email
SELECT id FROM "User" WHERE email = $2;

-- Add user to team
INSERT INTO "TeamMember" (id, "teamId", "userId", role, "createdAt")
VALUES (
    gen_random_uuid()::TEXT,
    $3,  -- teamId
    $4,  -- userId
    $5,  -- role
    CURRENT_TIMESTAMP
)
ON CONFLICT ("teamId", "userId") DO NOTHING;

-- Update invitation status
UPDATE "TeamInvitation"
SET status = 'ACCEPTED'
WHERE id = $1;

COMMIT;

-- Reject team invitation
-- Equivalent to: POST /api/team-invitations/[id]/reject
-- Used in: app/api/team-invitations/[id]/reject/route.ts

UPDATE "TeamInvitation"
SET status = 'REJECTED'
WHERE id = $1 AND status = 'PENDING'
RETURNING *;

-- =====================================================
-- Project Invitations
-- =====================================================

-- Get pending project invitations for user
SELECT 
    pi.id,
    pi."projectId",
    pi.email,
    pi.role,
    pi.status,
    pi."invitedBy",
    pi."createdAt",
    pi."expiresAt",
    json_build_object(
        'id', p.id,
        'name', p.name,
        'description', p.description
    ) as project
FROM "ProjectInvitation" pi
INNER JOIN "Project" p ON pi."projectId" = p.id
WHERE pi.email = $1 AND pi.status = 'PENDING'
ORDER BY pi."createdAt" DESC;

-- Create project invitation
INSERT INTO "ProjectInvitation" (
    id, "projectId", email, role, status, "invitedBy", 
    "createdAt", "expiresAt"
)
VALUES (
    gen_random_uuid()::TEXT,
    $1,  -- projectId
    $2,  -- email
    $3,  -- role
    'PENDING',
    $4,  -- invitedBy
    CURRENT_TIMESTAMP,
    $5   -- expiresAt
)
RETURNING *;

-- Accept project invitation (similar to team invitation)
-- Note: Project invitations may work differently based on your business logic

