-- =====================================================
-- Activities and Markdown Queries
-- =====================================================
-- SQL equivalents of Prisma queries from:
-- - app/api/activities/route.ts
-- - app/api/projects/[id]/markdown/route.ts
-- - app/api/markdown/[id]/route.ts

-- =====================================================
-- Activity Feed
-- =====================================================
-- Equivalent to: GET /api/activities
-- Prisma: prisma.teamMember.findMany + prisma.project.findMany + prisma.activity.findMany
-- Used in: app/api/activities/route.ts

-- Get team memberships for user
SELECT "teamId"
FROM "TeamMember"
WHERE "userId" = $1;

-- Get project IDs from user's teams
SELECT id
FROM "Project"
WHERE "teamId" = ANY($1::TEXT[]);  -- $1 is array of team IDs

-- Get activities with pagination
SELECT 
    a.id,
    a."projectId",
    a.type,
    a.data,
    a."createdAt",
    json_build_object(
        'name', p.name
    ) as project
FROM "Activity" a
INNER JOIN "Project" p ON a."projectId" = p.id
WHERE a."projectId" = ANY($1::TEXT[])  -- $1 is array of project IDs
ORDER BY a."createdAt" DESC
LIMIT $2 OFFSET $3;  -- limit, offset

-- Get total count for pagination
SELECT COUNT(*)::INTEGER as total
FROM "Activity"
WHERE "projectId" = ANY($1::TEXT[]);

-- Combined query for activities with pagination
WITH user_projects AS (
    SELECT DISTINCT p.id
    FROM "Project" p
    INNER JOIN "TeamMember" tm ON p."teamId" = tm."teamId"
    WHERE tm."userId" = $1
)
SELECT 
    a.id,
    a."projectId",
    a.type,
    a.data,
    a."createdAt",
    json_build_object('name', p.name) as project,
    (SELECT COUNT(*) FROM "Activity" a2 
     WHERE a2."projectId" IN (SELECT id FROM user_projects)) as total_count
FROM "Activity" a
INNER JOIN "Project" p ON a."projectId" = p.id
WHERE a."projectId" IN (SELECT id FROM user_projects)
ORDER BY a."createdAt" DESC
LIMIT $2 OFFSET $3;

-- =====================================================
-- Create Activity
-- =====================================================
-- Equivalent to: prisma.activity.create
-- Used in: Multiple API routes for logging

-- Create activity log
INSERT INTO "Activity" (id, "projectId", type, data, "createdAt")
VALUES (
    gen_random_uuid()::TEXT,
    $1,  -- projectId
    $2,  -- type (activity_type_enum)
    $3::JSONB,  -- data (JSON object)
    CURRENT_TIMESTAMP
)
RETURNING *;

-- =====================================================
-- Markdown Files
-- =====================================================
-- Equivalent to: GET /api/projects/[id]/markdown
-- Prisma: prisma.markdownFile.findMany
-- Used in: app/api/projects/[id]/markdown/route.ts

-- List markdown files for project
SELECT 
    id,
    "projectId",
    title,
    "createdAt",
    "updatedAt"
FROM "MarkdownFile"
WHERE "projectId" = $1
ORDER BY "updatedAt" DESC;

-- Get markdown file by ID
SELECT 
    id,
    "projectId",
    title,
    content,
    "createdAt",
    "updatedAt"
FROM "MarkdownFile"
WHERE id = $1;

-- =====================================================
-- Create Markdown File
-- =====================================================
-- Equivalent to: POST /api/projects/[id]/markdown
-- Prisma: prisma.markdownFile.create
-- Used in: app/api/projects/[id]/markdown/route.ts

-- Create markdown file
INSERT INTO "MarkdownFile" (
    id, "projectId", title, content, "createdAt", "updatedAt"
)
VALUES (
    gen_random_uuid()::TEXT,
    $1,  -- projectId
    $2,  -- title
    $3,  -- content
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
RETURNING *;

-- =====================================================
-- Update Markdown File
-- =====================================================
-- Equivalent to: PATCH /api/markdown/[id]
-- Prisma: prisma.markdownFile.update
-- Used in: app/api/markdown/[id]/route.ts

-- Update markdown file
UPDATE "MarkdownFile"
SET 
    title = COALESCE($2, title),
    content = COALESCE($3, content),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- =====================================================
-- Delete Markdown File
-- =====================================================

-- Delete markdown file
DELETE FROM "MarkdownFile"
WHERE id = $1
RETURNING id;

-- =====================================================
-- Activity Statistics
-- =====================================================

-- Count activities by type for a project
SELECT 
    type,
    COUNT(*) as count
FROM "Activity"
WHERE "projectId" = $1
GROUP BY type
ORDER BY count DESC;

-- Get recent activities for a project
SELECT 
    a.id,
    a.type,
    a.data,
    a."createdAt"
FROM "Activity" a
WHERE a."projectId" = $1
ORDER BY a."createdAt" DESC
LIMIT $2;

-- Get activity timeline for user's projects
WITH user_projects AS (
    SELECT DISTINCT p.id, p.name
    FROM "Project" p
    INNER JOIN "TeamMember" tm ON p."teamId" = tm."teamId"
    WHERE tm."userId" = $1
    UNION
    SELECT p.id, p.name
    FROM "Project" p
    WHERE p."teamId" IS NULL AND p."createdById" = $1
)
SELECT 
    a.id,
    a."projectId",
    a.type,
    a.data,
    a."createdAt",
    p.name as "projectName"
FROM "Activity" a
INNER JOIN user_projects p ON a."projectId" = p.id
ORDER BY a."createdAt" DESC
LIMIT $2;

