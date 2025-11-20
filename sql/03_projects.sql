-- =====================================================
-- Project Queries
-- =====================================================
-- SQL equivalents of Prisma queries from:
-- - app/api/projects/route.ts
-- - app/api/projects/[id]/route.ts

-- =====================================================
-- List User's Projects (with default team filter)
-- =====================================================
-- Equivalent to: GET /api/projects
-- Prisma: prisma.user.findUnique + prisma.project.findMany
-- Used in: app/api/projects/route.ts

-- Get projects for user with default team
SELECT 
    p.id,
    p.name,
    p.description,
    p."teamId",
    p."createdById",
    p."createdAt",
    p."updatedAt",
    t.id as "team.id",
    t.name as "team.name",
    t."createdAt" as "team.createdAt",
    t."updatedAt" as "team.updatedAt",
    (
        SELECT COUNT(*)::INTEGER
        FROM "Task" task
        WHERE task."projectId" = p.id
    ) as "taskCount"
FROM "Project" p
LEFT JOIN "Team" t ON p."teamId" = t.id
LEFT JOIN "TeamMember" tm ON t.id = tm."teamId"
WHERE p."teamId" = (
    SELECT "defaultTeamId" 
    FROM "User" 
    WHERE id = $1
)
ORDER BY p."updatedAt" DESC;

-- Get projects for user without default team (all teams + personal)
SELECT 
    p.id,
    p.name,
    p.description,
    p."teamId",
    p."createdById",
    p."createdAt",
    p."updatedAt",
    t.id as "team.id",
    t.name as "team.name",
    t."createdAt" as "team.createdAt",
    t."updatedAt" as "team.updatedAt",
    (
        SELECT COUNT(*)::INTEGER
        FROM "Task" task
        WHERE task."projectId" = p.id
    ) as "taskCount"
FROM "Project" p
LEFT JOIN "Team" t ON p."teamId" = t.id
WHERE (
    p."teamId" IN (
        SELECT "teamId"
        FROM "TeamMember"
        WHERE "userId" = $1
    )
    OR (p."teamId" IS NULL AND p."createdById" = $1)
)
ORDER BY p."updatedAt" DESC;

-- =====================================================
-- Get Project Details
-- =====================================================
-- Equivalent to: GET /api/projects/[id]
-- Prisma: prisma.project.findUnique with includes
-- Used in: app/api/projects/[id]/route.ts

-- Get project with team and members
SELECT 
    p.id,
    p.name,
    p.description,
    p."teamId",
    p."createdById",
    p."createdAt",
    p."updatedAt",
    t.id as "team.id",
    t.name as "team.name",
    t."createdAt" as "team.createdAt",
    t."updatedAt" as "team.updatedAt",
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
    ) as "team.members",
    (
        SELECT COUNT(*)::INTEGER
        FROM "Task" task
        WHERE task."projectId" = p.id
    ) as "taskCount",
    (
        SELECT COUNT(*)::INTEGER
        FROM "MarkdownFile" mf
        WHERE mf."projectId" = p.id
    ) as "markdownFileCount"
FROM "Project" p
LEFT JOIN "Team" t ON p."teamId" = t.id
WHERE p.id = $1;

-- =====================================================
-- Check Project Access
-- =====================================================
-- Equivalent to: checkProjectAccess function
-- Used in: app/api/projects/[id]/route.ts

-- Check if user has access to project (personal or team)
SELECT 
    p.id,
    p."teamId",
    p."createdById",
    CASE 
        WHEN p."teamId" IS NULL THEN
            CASE WHEN p."createdById" = $2 THEN 'OWNER' ELSE NULL END
        ELSE
            COALESCE(tm.role, NULL)
    END as role
FROM "Project" p
LEFT JOIN "Team" t ON p."teamId" = t.id
LEFT JOIN "TeamMember" tm ON t.id = tm."teamId" AND tm."userId" = $2
WHERE p.id = $1;

-- =====================================================
-- Create Project
-- =====================================================
-- Equivalent to: POST /api/projects
-- Prisma: prisma.project.create
-- Used in: app/api/projects/route.ts

-- Check team membership before creating
SELECT id, "teamId", "userId", role
FROM "TeamMember"
WHERE "teamId" = $1 AND "userId" = $2;

-- Create project
INSERT INTO "Project" (
    id, name, description, "teamId", "createdById", 
    "createdAt", "updatedAt"
)
VALUES (
    gen_random_uuid()::TEXT,
    $1,  -- name
    $2,  -- description (can be NULL)
    $3,  -- teamId (can be NULL)
    $4,  -- createdById
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
RETURNING 
    id, name, description, "teamId", "createdById", 
    "createdAt", "updatedAt";

-- Create project with team info (using CTE)
WITH new_project AS (
    INSERT INTO "Project" (
        id, name, description, "teamId", "createdById", 
        "createdAt", "updatedAt"
    )
    VALUES (
        gen_random_uuid()::TEXT,
        $1,  -- name
        $2,  -- description
        $3,  -- teamId
        $4,  -- createdById
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    RETURNING *
)
SELECT 
    p.*,
    t.id as "team.id",
    t.name as "team.name",
    (
        SELECT json_agg(
            json_build_object('id', tm.id)
        )
        FROM "TeamMember" tm
        WHERE tm."teamId" = t.id
    ) as "team.members",
    (
        SELECT COUNT(*)::INTEGER
        FROM "Task" task
        WHERE task."projectId" = p.id
    ) as "taskCount"
FROM new_project p
LEFT JOIN "Team" t ON p."teamId" = t.id;

-- =====================================================
-- Update Project
-- =====================================================
-- Equivalent to: PATCH /api/projects/[id]
-- Prisma: prisma.project.update
-- Used in: app/api/projects/[id]/route.ts

-- Update project
UPDATE "Project"
SET 
    name = COALESCE($2, name),
    description = COALESCE($3, description),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING 
    id, name, description, "teamId", "createdById", 
    "createdAt", "updatedAt";

-- Update project with team info
WITH updated_project AS (
    UPDATE "Project"
    SET 
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
)
SELECT 
    p.*,
    t.id as "team.id",
    t.name as "team.name",
    (
        SELECT json_agg(
            json_build_object('id', tm.id)
        )
        FROM "TeamMember" tm
        WHERE tm."teamId" = t.id
    ) as "team.members",
    (
        SELECT COUNT(*)::INTEGER
        FROM "Task" task
        WHERE task."projectId" = p.id
    ) as "taskCount"
FROM updated_project p
LEFT JOIN "Team" t ON p."teamId" = t.id;

-- =====================================================
-- Delete Project
-- =====================================================
-- Equivalent to: DELETE /api/projects/[id]
-- Prisma: prisma.project.delete
-- Used in: app/api/projects/[id]/route.ts

-- Delete project (CASCADE will handle related records)
DELETE FROM "Project"
WHERE id = $1
RETURNING id;

