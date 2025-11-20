-- =====================================================
-- DBMS Concepts: Triggers, Procedures, Views, Transactions
-- =====================================================
-- This file demonstrates advanced database concepts using SQL
-- These are SQL equivalents that could replace some Prisma logic

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger 1: Auto-update updatedAt timestamp
-- Equivalent to: Prisma @updatedAt directive
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to User table
CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply to Project table
CREATE TRIGGER update_project_updated_at
    BEFORE UPDATE ON "Project"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply to Task table
CREATE TRIGGER update_task_updated_at
    BEFORE UPDATE ON "Task"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply to Team table
CREATE TRIGGER update_team_updated_at
    BEFORE UPDATE ON "Team"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger 2: Auto-expire invitations
-- Equivalent to: Manual update in app/api/team-invitations/route.ts
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-expire invitations when checking
    UPDATE "TeamInvitation"
    SET status = 'EXPIRED'
    WHERE status = 'PENDING' 
        AND "expiresAt" < CURRENT_TIMESTAMP;
    
    UPDATE "ProjectInvitation"
    SET status = 'EXPIRED'
    WHERE status = 'PENDING' 
        AND "expiresAt" < CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger 3: Auto-log activity when task is created
-- Equivalent to: Manual activity.create in app/api/projects/[id]/tasks/route.ts
CREATE OR REPLACE FUNCTION log_task_activity()
RETURNS TRIGGER AS $$
DECLARE
    task_creator_name TEXT;
BEGIN
    -- Get creator name
    SELECT COALESCE(name, email) INTO task_creator_name
    FROM "User"
    WHERE id = NEW."createdById";
    
    -- Log activity
    INSERT INTO "Activity" (id, "projectId", type, data, "createdAt")
    VALUES (
        gen_random_uuid()::TEXT,
        NEW."projectId",
        'TASK_CREATED',
        jsonb_build_object(
            'taskId', NEW.id,
            'taskTitle', NEW.title,
            'userId', NEW."createdById",
            'userName', task_creator_name
        ),
        CURRENT_TIMESTAMP
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_created_activity
    AFTER INSERT ON "Task"
    FOR EACH ROW
    EXECUTE FUNCTION log_task_activity();

-- Trigger 4: Auto-log activity when task status changes to DONE
-- Equivalent to: Manual check in app/api/tasks/[id]/route.ts
CREATE OR REPLACE FUNCTION log_task_completed()
RETURNS TRIGGER AS $$
DECLARE
    task_creator_name TEXT;
BEGIN
    -- Check if status changed to DONE
    IF NEW.status = 'DONE' AND (OLD.status IS NULL OR OLD.status != 'DONE') THEN
        -- Get creator name
        SELECT COALESCE(name, email) INTO task_creator_name
        FROM "User"
        WHERE id = NEW."createdById";
        
        -- Log activity
        INSERT INTO "Activity" (id, "projectId", type, data, "createdAt")
        VALUES (
            gen_random_uuid()::TEXT,
            NEW."projectId",
            'TASK_COMPLETED',
            jsonb_build_object(
                'taskId', NEW.id,
                'taskTitle', NEW.title
            ),
            CURRENT_TIMESTAMP
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_completed_activity
    AFTER UPDATE ON "Task"
    FOR EACH ROW
    EXECUTE FUNCTION log_task_completed();

-- Trigger 5: Auto-log activity when markdown file is created
CREATE OR REPLACE FUNCTION log_markdown_created()
RETURNS TRIGGER AS $$
DECLARE
    project_creator_id TEXT;
    creator_name TEXT;
BEGIN
    -- Get project creator
    SELECT "createdById" INTO project_creator_id
    FROM "Project"
    WHERE id = NEW."projectId";
    
    -- Get creator name
    SELECT COALESCE(name, email) INTO creator_name
    FROM "User"
    WHERE id = project_creator_id;
    
    -- Log activity
    INSERT INTO "Activity" (id, "projectId", type, data, "createdAt")
    VALUES (
        gen_random_uuid()::TEXT,
        NEW."projectId",
        'MARKDOWN_CREATED',
        jsonb_build_object(
            'fileId', NEW.id,
            'fileTitle', NEW.title,
            'userId', project_creator_id,
            'userName', creator_name
        ),
        CURRENT_TIMESTAMP
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER markdown_created_activity
    AFTER INSERT ON "MarkdownFile"
    FOR EACH ROW
    EXECUTE FUNCTION log_markdown_created();

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

-- Procedure 1: Create project with team validation
-- Equivalent to: Logic in app/api/projects/route.ts POST
CREATE OR REPLACE FUNCTION create_project_with_validation(
    p_name TEXT,
    p_description TEXT,
    p_team_id TEXT,
    p_created_by_id TEXT
)
RETURNS TABLE (
    id TEXT,
    name TEXT,
    description TEXT,
    "teamId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP,
    "updatedAt" TIMESTAMP
) AS $$
DECLARE
    v_team_member_role role_enum;
    v_default_team_id TEXT;
    v_final_team_id TEXT;
BEGIN
    -- Check if teamId is provided, if not use default team
    IF p_team_id IS NULL OR p_team_id = '' THEN
        SELECT "defaultTeamId" INTO v_default_team_id
        FROM "User"
        WHERE id = p_created_by_id;
        
        v_final_team_id := v_default_team_id;
    ELSE
        v_final_team_id := p_team_id;
    END IF;
    
    -- If team is provided, validate membership and permissions
    IF v_final_team_id IS NOT NULL THEN
        SELECT role INTO v_team_member_role
        FROM "TeamMember"
        WHERE "teamId" = v_final_team_id AND "userId" = p_created_by_id;
        
        IF v_team_member_role IS NULL THEN
            RAISE EXCEPTION 'User is not a member of this team';
        END IF;
        
        IF v_team_member_role = 'VIEWER' THEN
            RAISE EXCEPTION 'Viewers cannot create projects';
        END IF;
    END IF;
    
    -- Create project
    RETURN QUERY
    INSERT INTO "Project" (
        id, name, description, "teamId", "createdById", 
        "createdAt", "updatedAt"
    )
    VALUES (
        gen_random_uuid()::TEXT,
        p_name,
        p_description,
        v_final_team_id,
        p_created_by_id,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    RETURNING 
        "Project".id,
        "Project".name,
        "Project".description,
        "Project"."teamId",
        "Project"."createdById",
        "Project"."createdAt",
        "Project"."updatedAt";
END;
$$ LANGUAGE plpgsql;

-- Procedure 2: Create task with auto-positioning
-- Equivalent to: Logic in app/api/projects/[id]/tasks/route.ts POST
CREATE OR REPLACE FUNCTION create_task_with_position(
    p_title TEXT,
    p_description TEXT,
    p_priority task_priority_enum,
    p_status task_status_enum,
    p_project_id TEXT,
    p_assignee_id TEXT,
    p_created_by_id TEXT,
    p_due_date TIMESTAMP
)
RETURNS TABLE (
    id TEXT,
    title TEXT,
    description TEXT,
    status task_status_enum,
    priority task_priority_enum,
    position INTEGER,
    "projectId" TEXT,
    "assigneeId" TEXT,
    "createdById" TEXT,
    "dueDate" TIMESTAMP,
    "createdAt" TIMESTAMP,
    "updatedAt" TIMESTAMP
) AS $$
DECLARE
    v_position INTEGER;
BEGIN
    -- Get highest position for status
    SELECT COALESCE(MAX(position), -1) + 1 INTO v_position
    FROM "Task"
    WHERE "projectId" = p_project_id AND status = p_status;
    
    -- Create task
    RETURN QUERY
    INSERT INTO "Task" (
        id, title, description, priority, status, position,
        "projectId", "assigneeId", "createdById", "dueDate",
        "createdAt", "updatedAt"
    )
    VALUES (
        gen_random_uuid()::TEXT,
        p_title,
        p_description,
        p_priority,
        p_status,
        v_position,
        p_project_id,
        p_assignee_id,
        p_created_by_id,
        p_due_date,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    RETURNING 
        "Task".id,
        "Task".title,
        "Task".description,
        "Task".status,
        "Task".priority,
        "Task".position,
        "Task"."projectId",
        "Task"."assigneeId",
        "Task"."createdById",
        "Task"."dueDate",
        "Task"."createdAt",
        "Task"."updatedAt";
END;
$$ LANGUAGE plpgsql;

-- Procedure 3: Accept team invitation
-- Equivalent to: Logic in app/api/team-invitations/[id]/accept/route.ts
CREATE OR REPLACE FUNCTION accept_team_invitation(
    p_invitation_id TEXT,
    p_user_email TEXT
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_invitation "TeamInvitation"%ROWTYPE;
    v_user_id TEXT;
    v_existing_member_id TEXT;
BEGIN
    -- Get invitation
    SELECT * INTO v_invitation
    FROM "TeamInvitation"
    WHERE id = p_invitation_id AND status = 'PENDING'
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Invitation not found or already processed'::TEXT;
        RETURN;
    END IF;
    
    -- Check expiration
    IF v_invitation."expiresAt" < CURRENT_TIMESTAMP THEN
        UPDATE "TeamInvitation"
        SET status = 'EXPIRED'
        WHERE id = p_invitation_id;
        
        RETURN QUERY SELECT FALSE, 'Invitation has expired'::TEXT;
        RETURN;
    END IF;
    
    -- Get user by email
    SELECT id INTO v_user_id
    FROM "User"
    WHERE email = p_user_email;
    
    IF v_user_id IS NULL THEN
        RETURN QUERY SELECT FALSE, 'User not found'::TEXT;
        RETURN;
    END IF;
    
    -- Check if already a member
    SELECT id INTO v_existing_member_id
    FROM "TeamMember"
    WHERE "teamId" = v_invitation."teamId" AND "userId" = v_user_id;
    
    IF v_existing_member_id IS NOT NULL THEN
        -- Update invitation status anyway
        UPDATE "TeamInvitation"
        SET status = 'ACCEPTED'
        WHERE id = p_invitation_id;
        
        RETURN QUERY SELECT TRUE, 'Already a member, invitation marked as accepted'::TEXT;
        RETURN;
    END IF;
    
    -- Add user to team
    INSERT INTO "TeamMember" (id, "teamId", "userId", role, "createdAt")
    VALUES (
        gen_random_uuid()::TEXT,
        v_invitation."teamId",
        v_user_id,
        v_invitation.role,
        CURRENT_TIMESTAMP
    );
    
    -- Update invitation status
    UPDATE "TeamInvitation"
    SET status = 'ACCEPTED'
    WHERE id = p_invitation_id;
    
    RETURN QUERY SELECT TRUE, 'Invitation accepted successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS
-- =====================================================

-- View 1: Project summary with statistics
-- Equivalent to: Multiple queries with _count in Prisma
CREATE OR REPLACE VIEW project_summary AS
SELECT 
    p.id,
    p.name,
    p.description,
    p."teamId",
    p."createdById",
    p."createdAt",
    p."updatedAt",
    t.name as "teamName",
    (
        SELECT COUNT(*)::INTEGER
        FROM "Task" task
        WHERE task."projectId" = p.id
    ) as "taskCount",
    (
        SELECT COUNT(*)::INTEGER
        FROM "Task" task
        WHERE task."projectId" = p.id AND task.status = 'DONE'
    ) as "completedTaskCount",
    (
        SELECT COUNT(*)::INTEGER
        FROM "MarkdownFile" mf
        WHERE mf."projectId" = p.id
    ) as "markdownFileCount",
    (
        SELECT COUNT(*)::INTEGER
        FROM "Activity" a
        WHERE a."projectId" = p.id
    ) as "activityCount"
FROM "Project" p
LEFT JOIN "Team" t ON p."teamId" = t.id;

-- View 2: User's accessible projects
-- Equivalent to: Complex query in app/api/projects/route.ts
CREATE OR REPLACE VIEW user_accessible_projects AS
SELECT DISTINCT
    p.id,
    p.name,
    p.description,
    p."teamId",
    p."createdById",
    p."createdAt",
    p."updatedAt",
    u.id as "userId",
    CASE 
        WHEN p."teamId" IS NULL AND p."createdById" = u.id THEN 'OWNER'
        WHEN tm.role IS NOT NULL THEN tm.role
        ELSE NULL
    END as "userRole"
FROM "Project" p
CROSS JOIN "User" u
LEFT JOIN "TeamMember" tm ON p."teamId" = tm."teamId" AND tm."userId" = u.id
WHERE 
    (p."teamId" IS NULL AND p."createdById" = u.id)
    OR (p."teamId" IS NOT NULL AND tm."userId" IS NOT NULL);

-- View 3: Task board view (Kanban)
-- Equivalent to: Query in app/api/projects/[id]/tasks/route.ts
CREATE OR REPLACE VIEW task_board_view AS
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
    u_assignee.name as "assigneeName",
    u_assignee.email as "assigneeEmail",
    u_assignee.image as "assigneeImage",
    u_creator.name as "creatorName",
    u_creator.email as "creatorEmail",
    p.name as "projectName"
FROM "Task" t
LEFT JOIN "User" u_assignee ON t."assigneeId" = u_assignee.id
LEFT JOIN "User" u_creator ON t."createdById" = u_creator.id
INNER JOIN "Project" p ON t."projectId" = p.id;

-- View 4: Team member details
CREATE OR REPLACE VIEW team_member_details AS
SELECT 
    tm.id,
    tm."teamId",
    tm."userId",
    tm.role,
    tm."createdAt",
    t.name as "teamName",
    u.name as "userName",
    u.email as "userEmail",
    u.image as "userImage",
    (
        SELECT COUNT(*)::INTEGER
        FROM "Project" p
        WHERE p."teamId" = tm."teamId"
    ) as "teamProjectCount"
FROM "TeamMember" tm
INNER JOIN "Team" t ON tm."teamId" = t.id
INNER JOIN "User" u ON tm."userId" = u.id;

-- =====================================================
-- TRANSACTIONS
-- =====================================================

-- Transaction Example 1: Create team with owner
-- Equivalent to: app/api/teams/route.ts POST
-- This is already shown in the procedure, but here's explicit transaction:

BEGIN;

-- Create team
INSERT INTO "Team" (id, name, "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::TEXT,
    'New Team',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Add creator as owner (using lastval or returning)
-- Note: In practice, you'd use the returned ID from above
INSERT INTO "TeamMember" (id, "teamId", "userId", role, "createdAt")
VALUES (
    gen_random_uuid()::TEXT,
    (SELECT id FROM "Team" ORDER BY "createdAt" DESC LIMIT 1),
    'user-id-here',
    'OWNER',
    CURRENT_TIMESTAMP
);

COMMIT;

-- Transaction Example 2: Update task with activity logging
-- Equivalent to: app/api/tasks/[id]/route.ts PATCH
BEGIN;

-- Update task
UPDATE "Task"
SET 
    status = 'DONE',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE id = 'task-id-here';

-- Log activity (though trigger would handle this)
INSERT INTO "Activity" (id, "projectId", type, data, "createdAt")
SELECT 
    gen_random_uuid()::TEXT,
    "projectId",
    'TASK_COMPLETED',
    jsonb_build_object('taskId', id, 'taskTitle', title),
    CURRENT_TIMESTAMP
FROM "Task"
WHERE id = 'task-id-here';

COMMIT;

-- Transaction Example 3: Delete project with cascade
-- Equivalent to: app/api/projects/[id]/route.ts DELETE
-- Note: CASCADE handles related records, but explicit transaction ensures atomicity
BEGIN;

-- Delete project (CASCADE will handle tasks, markdown, etc.)
DELETE FROM "Project"
WHERE id = 'project-id-here';

-- If you need to log this activity before deletion:
-- (This would need to happen before the DELETE)
-- INSERT INTO "Activity" ...

COMMIT;

