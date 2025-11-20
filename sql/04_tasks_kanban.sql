-- =====================================================
-- Task and Kanban Queries
-- =====================================================
-- SQL equivalents of Prisma queries from:
-- - app/api/projects/[id]/tasks/route.ts
-- - app/api/tasks/[id]/route.ts

-- =====================================================
-- List Tasks for Project
-- =====================================================
-- Equivalent to: GET /api/projects/[id]/tasks
-- Prisma: prisma.task.findMany with includes
-- Used in: app/api/projects/[id]/tasks/route.ts

-- Get all tasks for a project with assignee and creator info
SELECT 
    t.id,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.position,
    t."projectId",
    t."assigneeId",
    t."createdById",
    t."dueDate",
    t."createdAt",
    t."updatedAt",
    json_build_object(
        'id', u_assignee.id,
        'name', u_assignee.name,
        'email', u_assignee.email,
        'image', u_assignee.image
    ) as assignee,
    json_build_object(
        'id', u_creator.id,
        'name', u_creator.name,
        'email', u_creator.email
    ) as "createdBy"
FROM "Task" t
LEFT JOIN "User" u_assignee ON t."assigneeId" = u_assignee.id
LEFT JOIN "User" u_creator ON t."createdById" = u_creator.id
WHERE t."projectId" = $1
ORDER BY 
    t.status ASC,
    t.position ASC,
    t."createdAt" DESC;

-- =====================================================
-- Create Task
-- =====================================================
-- Equivalent to: POST /api/projects/[id]/tasks
-- Prisma: prisma.task.findFirst + prisma.task.create
-- Used in: app/api/projects/[id]/tasks/route.ts

-- Get highest position for status
SELECT COALESCE(MAX(position), -1) + 1 as next_position
FROM "Task"
WHERE "projectId" = $1 AND status = $2;

-- Create task
INSERT INTO "Task" (
    id, title, description, priority, status, position,
    "projectId", "assigneeId", "createdById", "dueDate",
    "createdAt", "updatedAt"
)
VALUES (
    gen_random_uuid()::TEXT,
    $1,  -- title
    $2,  -- description
    $3,  -- priority
    $4,  -- status
    $5,  -- position
    $6,  -- projectId
    $7,  -- assigneeId (can be NULL)
    $8,  -- createdById
    CASE WHEN $9 IS NOT NULL THEN $9::TIMESTAMP ELSE NULL END,  -- dueDate
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
RETURNING *;

-- Create task with assignee and creator info
WITH new_task AS (
    INSERT INTO "Task" (
        id, title, description, priority, status, position,
        "projectId", "assigneeId", "createdById", "dueDate",
        "createdAt", "updatedAt"
    )
    VALUES (
        gen_random_uuid()::TEXT,
        $1,  -- title
        $2,  -- description
        $3,  -- priority
        $4,  -- status
        $5,  -- position
        $6,  -- projectId
        $7,  -- assigneeId
        $8,  -- createdById
        CASE WHEN $9 IS NOT NULL THEN $9::TIMESTAMP ELSE NULL END,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    RETURNING *
)
SELECT 
    t.*,
    json_build_object(
        'id', u_assignee.id,
        'name', u_assignee.name,
        'email', u_assignee.email,
        'image', u_assignee.image
    ) as assignee,
    json_build_object(
        'id', u_creator.id,
        'name', u_creator.name,
        'email', u_creator.email
    ) as "createdBy"
FROM new_task t
LEFT JOIN "User" u_assignee ON t."assigneeId" = u_assignee.id
LEFT JOIN "User" u_creator ON t."createdById" = u_creator.id;

-- =====================================================
-- Update Task
-- =====================================================
-- Equivalent to: PATCH /api/tasks/[id]
-- Prisma: prisma.task.findUnique + prisma.task.findFirst + prisma.task.update
-- Used in: app/api/tasks/[id]/route.ts

-- Get task with project and team info for permission check
SELECT 
    t.*,
    p.id as "project.id",
    p."teamId" as "project.teamId",
    p."createdById" as "project.createdById",
    tm.id as "project.team.members.id",
    tm.role as "project.team.members.role"
FROM "Task" t
INNER JOIN "Project" p ON t."projectId" = p.id
LEFT JOIN "Team" team ON p."teamId" = team.id
LEFT JOIN "TeamMember" tm ON team.id = tm."teamId" 
    AND tm."userId" = (SELECT id FROM "User" WHERE email = $2)
WHERE t.id = $1;

-- Get last task position for status change
SELECT COALESCE(MAX(position), -1) + 1 as next_position
FROM "Task"
WHERE "projectId" = $1 AND status = $2;

-- Update task
UPDATE "Task"
SET 
    title = COALESCE($2, title),
    description = COALESCE($3, description),
    priority = COALESCE($4, priority),
    status = COALESCE($5, status),
    position = COALESCE($6, position),
    "assigneeId" = CASE 
        WHEN $7 IS NULL THEN NULL 
        WHEN $7 = 'null' THEN NULL 
        ELSE $7 
    END,
    "dueDate" = CASE 
        WHEN $8 IS NULL THEN NULL 
        WHEN $8 = 'null' THEN NULL 
        ELSE $8::TIMESTAMP 
    END,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- Update task with assignee and creator info
WITH updated_task AS (
    UPDATE "Task"
    SET 
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        priority = COALESCE($4, priority),
        status = COALESCE($5, status),
        position = COALESCE($6, position),
        "assigneeId" = CASE 
            WHEN $7 IS NULL THEN "assigneeId"
            WHEN $7 = 'null' THEN NULL 
            ELSE $7 
        END,
        "dueDate" = CASE 
            WHEN $8 IS NULL THEN "dueDate"
            WHEN $8 = 'null' THEN NULL 
            ELSE $8::TIMESTAMP 
        END,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
)
SELECT 
    t.*,
    json_build_object(
        'id', u_assignee.id,
        'name', u_assignee.name,
        'email', u_assignee.email,
        'image', u_assignee.image
    ) as assignee,
    json_build_object(
        'id', u_creator.id,
        'name', u_creator.name,
        'email', u_creator.email
    ) as "createdBy"
FROM updated_task t
LEFT JOIN "User" u_assignee ON t."assigneeId" = u_assignee.id
LEFT JOIN "User" u_creator ON t."createdById" = u_creator.id;

-- =====================================================
-- Delete Task
-- =====================================================
-- Equivalent to: DELETE /api/tasks/[id]
-- Prisma: prisma.task.delete
-- Used in: app/api/tasks/[id]/route.ts

-- Delete task
DELETE FROM "Task"
WHERE id = $1
RETURNING id;

-- =====================================================
-- Task Statistics
-- =====================================================

-- Count tasks by status for a project
SELECT 
    status,
    COUNT(*) as count
FROM "Task"
WHERE "projectId" = $1
GROUP BY status
ORDER BY status;

-- Count tasks by priority for a project
SELECT 
    priority,
    COUNT(*) as count
FROM "Task"
WHERE "projectId" = $1
GROUP BY priority
ORDER BY priority;

-- Get tasks assigned to a user
SELECT 
    t.*,
    p.name as "project.name"
FROM "Task" t
INNER JOIN "Project" p ON t."projectId" = p.id
WHERE t."assigneeId" = $1
ORDER BY t."dueDate" ASC NULLS LAST, t."createdAt" DESC;

-- Get overdue tasks
SELECT 
    t.*,
    p.name as "project.name"
FROM "Task" t
INNER JOIN "Project" p ON t."projectId" = p.id
WHERE t."dueDate" < CURRENT_TIMESTAMP 
    AND t.status != 'DONE'
ORDER BY t."dueDate" ASC;

