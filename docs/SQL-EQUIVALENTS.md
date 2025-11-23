# SQL Equivalents Documentation

This document provides SQL equivalents for all Prisma queries used in the Synkora application. These SQL files are for reference and educational purposes, demonstrating how Prisma ORM queries translate to raw SQL.

## 📁 File Structure

All SQL files are located in the `sql/` directory:

```
sql/
├── 01_schema.sql              # Database schema definition
├── 02_user_authentication.sql # User and authentication queries
├── 03_projects.sql            # Project CRUD operations
├── 04_tasks_kanban.sql        # Task and Kanban board queries
├── 05_teams_invitations.sql  # Team and invitation management
├── 06_activities_markdown.sql # Activity feed and markdown files
└── 07_dbms_concepts.sql      # Advanced DBMS concepts (triggers, procedures, views, transactions)
```

## 📋 Overview

### Database System
- **DBMS**: PostgreSQL
- **Schema**: Based on Prisma schema (`prisma/schema.prisma`)
- **Note**: These SQL files are for reference only. The actual database is managed by Prisma migrations.

## 📚 File Descriptions

### 01_schema.sql
Contains the complete database schema definition including:
- Enum types (Role, InvitationStatus, TaskStatus, TaskPriority, ActivityType)
- All table definitions with foreign keys
- Indexes for performance optimization

**Key Tables:**
- `User` - User accounts and authentication
- `Account` - OAuth account connections
- `Session` - User sessions
- `Team` - Team/organization entities
- `TeamMember` - Team membership with roles
- `Project` - Project entities
- `Task` - Kanban board tasks
- `Activity` - Activity feed logs
- `MarkdownFile` - Markdown document storage
- And more...

### 02_user_authentication.sql
SQL equivalents for user authentication and account management.

**Key Queries:**
- User registration (`app/api/auth/register/route.ts`)
- User lookup by email/ID
- OAuth account management
- Session management
- User profile updates

**Example Prisma → SQL:**
```typescript
// Prisma
prisma.user.findUnique({ where: { email } })
```
```sql
-- SQL
SELECT * FROM "User" WHERE email = $1;
```

### 03_projects.sql
SQL equivalents for project management operations.

**Key Queries:**
- List user's projects (with default team filtering)
- Get project details with team and member info
- Create project with validation
- Update project
- Delete project
- Check project access permissions

**Example Prisma → SQL:**
```typescript
// Prisma
prisma.project.findMany({
    where: { teamId: user.defaultTeamId },
    include: { team: { include: { members: true } } }
})
```
```sql
-- SQL
SELECT p.*, t.*, tm.*
FROM "Project" p
LEFT JOIN "Team" t ON p."teamId" = t.id
LEFT JOIN "TeamMember" tm ON t.id = tm."teamId"
WHERE p."teamId" = (SELECT "defaultTeamId" FROM "User" WHERE id = $1);
```

### 04_tasks_kanban.sql
SQL equivalents for Kanban board and task management.

**Key Queries:**
- List tasks for a project (with assignee/creator info)
- Create task with auto-positioning
- Update task (with status change handling)
- Delete task
- Task statistics (by status, priority)
- Overdue tasks query

**Example Prisma → SQL:**
```typescript
// Prisma
prisma.task.findMany({
    where: { projectId },
    include: { assignee: true, createdBy: true },
    orderBy: [{ status: "asc" }, { position: "asc" }]
})
```
```sql
-- SQL
SELECT t.*, 
    json_build_object('id', u_assignee.id, 'name', u_assignee.name) as assignee,
    json_build_object('id', u_creator.id, 'name', u_creator.name) as "createdBy"
FROM "Task" t
LEFT JOIN "User" u_assignee ON t."assigneeId" = u_assignee.id
LEFT JOIN "User" u_creator ON t."createdById" = u_creator.id
WHERE t."projectId" = $1
ORDER BY t.status ASC, t.position ASC;
```

### 05_teams_invitations.sql
SQL equivalents for team and invitation management.

**Key Queries:**
- List user's teams with member details
- Create team with owner assignment
- Team member management (add, remove, update role)
- Team invitation management (create, accept, reject)
- Project invitation management
- Auto-expire invitations

**Example Prisma → SQL:**
```typescript
// Prisma
prisma.team.create({
    data: {
        name,
        members: { create: { userId, role: "OWNER" } }
    }
})
```
```sql
-- SQL (using CTE)
WITH new_team AS (
    INSERT INTO "Team" (id, name, "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::TEXT, $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING *
)
INSERT INTO "TeamMember" (id, "teamId", "userId", role, "createdAt")
SELECT gen_random_uuid()::TEXT, t.id, $2, 'OWNER', CURRENT_TIMESTAMP
FROM new_team t;
```

### 06_activities_markdown.sql
SQL equivalents for activity feed and markdown file management.

**Key Queries:**
- Get activity feed with pagination
- Create activity logs
- List markdown files for project
- Create/update/delete markdown files
- Activity statistics

**Example Prisma → SQL:**
```typescript
// Prisma
prisma.activity.findMany({
    where: { projectId: { in: projectIds } },
    include: { project: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset
})
```
```sql
-- SQL
SELECT a.*, json_build_object('name', p.name) as project
FROM "Activity" a
INNER JOIN "Project" p ON a."projectId" = p.id
WHERE a."projectId" = ANY($1::TEXT[])
ORDER BY a."createdAt" DESC
LIMIT $2 OFFSET $3;
```

### 07_dbms_concepts.sql
Demonstrates advanced database concepts with SQL implementations.

#### **TRIGGERS**
1. **Auto-update timestamps** - Automatically updates `updatedAt` on record changes
2. **Auto-expire invitations** - Automatically marks expired invitations
3. **Auto-log task activities** - Logs activity when tasks are created/updated
4. **Auto-log markdown activities** - Logs activity when markdown files are created

**Example Trigger:**
```sql
CREATE TRIGGER update_project_updated_at
    BEFORE UPDATE ON "Project"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

#### **STORED PROCEDURES**
1. **create_project_with_validation** - Creates project with team validation and permission checks
2. **create_task_with_position** - Creates task with automatic position calculation
3. **accept_team_invitation** - Handles team invitation acceptance with validation

**Example Procedure:**
```sql
CREATE OR REPLACE FUNCTION create_project_with_validation(
    p_name TEXT,
    p_description TEXT,
    p_team_id TEXT,
    p_created_by_id TEXT
)
RETURNS TABLE (...) AS $$
BEGIN
    -- Validation logic
    -- Create project
    RETURN QUERY INSERT INTO "Project" ... RETURNING *;
END;
$$ LANGUAGE plpgsql;
```

#### **VIEWS**
1. **project_summary** - Project with aggregated statistics (task counts, activity counts)
2. **user_accessible_projects** - All projects accessible to a user with role information
3. **task_board_view** - Kanban board view with assignee and creator information
4. **team_member_details** - Team members with user and team details

**Example View:**
```sql
CREATE OR REPLACE VIEW project_summary AS
SELECT 
    p.*,
    (SELECT COUNT(*) FROM "Task" WHERE "projectId" = p.id) as "taskCount",
    (SELECT COUNT(*) FROM "Task" WHERE "projectId" = p.id AND status = 'DONE') as "completedTaskCount"
FROM "Project" p;
```

#### **TRANSACTIONS**
Examples of transaction usage for:
- Creating team with owner (atomic operation)
- Updating task with activity logging (atomic operation)
- Deleting project with cascade (atomic operation)

**Example Transaction:**
```sql
BEGIN;
    INSERT INTO "Team" ...;
    INSERT INTO "TeamMember" ...;
COMMIT;
```

## 🔄 Prisma to SQL Mapping Guide

### Common Patterns

#### 1. Find Unique
```typescript
// Prisma
prisma.user.findUnique({ where: { email: "user@example.com" } })
```
```sql
-- SQL
SELECT * FROM "User" WHERE email = $1;
```

#### 2. Find Many with Where
```typescript
// Prisma
prisma.task.findMany({ where: { projectId: "project-123" } })
```
```sql
-- SQL
SELECT * FROM "Task" WHERE "projectId" = $1;
```

#### 3. Include Relations
```typescript
// Prisma
prisma.project.findUnique({
    where: { id: "project-123" },
    include: { team: { include: { members: true } } }
})
```
```sql
-- SQL
SELECT 
    p.*,
    t.*,
    json_agg(json_build_object('id', tm.id, 'role', tm.role)) as "team.members"
FROM "Project" p
LEFT JOIN "Team" t ON p."teamId" = t.id
LEFT JOIN "TeamMember" tm ON t.id = tm."teamId"
WHERE p.id = $1
GROUP BY p.id, t.id;
```

#### 4. Create with Nested Relations
```typescript
// Prisma
prisma.team.create({
    data: {
        name: "New Team",
        members: { create: { userId: "user-123", role: "OWNER" } }
    }
})
```
```sql
-- SQL (using CTE)
WITH new_team AS (
    INSERT INTO "Team" (id, name, "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::TEXT, $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING *
)
INSERT INTO "TeamMember" (id, "teamId", "userId", role, "createdAt")
SELECT gen_random_uuid()::TEXT, t.id, $2, 'OWNER', CURRENT_TIMESTAMP
FROM new_team t;
```

#### 5. Update
```typescript
// Prisma
prisma.project.update({
    where: { id: "project-123" },
    data: { name: "Updated Name" }
})
```
```sql
-- SQL
UPDATE "Project"
SET name = $2, "updatedAt" = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;
```

#### 6. Delete
```typescript
// Prisma
prisma.project.delete({ where: { id: "project-123" } })
```
```sql
-- SQL
DELETE FROM "Project" WHERE id = $1;
```

#### 7. Count
```typescript
// Prisma
prisma.task.count({ where: { projectId: "project-123" } })
```
```sql
-- SQL
SELECT COUNT(*)::INTEGER FROM "Task" WHERE "projectId" = $1;
```

#### 8. Aggregations with _count
```typescript
// Prisma
prisma.project.findMany({
    include: { _count: { select: { tasks: true } } }
})
```
```sql
-- SQL
SELECT 
    p.*,
    (SELECT COUNT(*) FROM "Task" WHERE "projectId" = p.id) as "taskCount"
FROM "Project" p;
```

#### 9. Order By
```typescript
// Prisma
prisma.task.findMany({
    orderBy: [{ status: "asc" }, { position: "asc" }, { createdAt: "desc" }]
})
```
```sql
-- SQL
SELECT * FROM "Task"
ORDER BY status ASC, position ASC, "createdAt" DESC;
```

#### 10. Pagination
```typescript
// Prisma
prisma.activity.findMany({
    take: 20,
    skip: 0
})
```
```sql
-- SQL
SELECT * FROM "Activity"
ORDER BY "createdAt" DESC
LIMIT 20 OFFSET 0;
```

## 🎯 DBMS Concepts Demonstrated

### 1. **Triggers**
- Automatic timestamp updates
- Automatic activity logging
- Automatic invitation expiration

### 2. **Stored Procedures**
- Business logic encapsulation
- Validation and error handling
- Complex multi-step operations

### 3. **Views**
- Simplified query interfaces
- Aggregated data presentation
- Reusable query patterns

### 4. **Transactions**
- Atomic operations
- Data consistency guarantees
- Rollback on errors

## 📝 Usage Notes

1. **Parameter Placeholders**: All queries use `$1`, `$2`, etc. as parameter placeholders (PostgreSQL style). Adjust for your database system if needed.

2. **ID Generation**: Queries use `gen_random_uuid()::TEXT` for ID generation. In production with Prisma, IDs are generated using `cuid()`.

3. **JSON Handling**: PostgreSQL's `JSONB` type is used for JSON columns. The `json_build_object()` function is used to construct JSON responses.

4. **CASCADE Deletes**: Foreign key constraints with `ON DELETE CASCADE` are defined in the schema, so related records are automatically deleted.

5. **Indexes**: Indexes are defined for frequently queried columns (e.g., `email`, `projectId`, `status`) to optimize query performance.

## 🔍 Query Examples by Feature

### Authentication
- User registration: `sql/02_user_authentication.sql` (lines 12-25)
- User lookup: `sql/02_user_authentication.sql` (lines 30-40)
- Session management: `sql/02_user_authentication.sql` (lines 60-80)

### Projects
- List projects: `sql/03_projects.sql` (lines 8-50)
- Create project: `sql/03_projects.sql` (lines 60-100)
- Update project: `sql/03_projects.sql` (lines 120-160)

### Tasks
- List tasks: `sql/04_tasks_kanban.sql` (lines 8-30)
- Create task: `sql/04_tasks_kanban.sql` (lines 40-80)
- Update task: `sql/04_tasks_kanban.sql` (lines 90-150)

### Teams
- List teams: `sql/05_teams_invitations.sql` (lines 8-30)
- Create team: `sql/05_teams_invitations.sql` (lines 40-80)
- Accept invitation: `sql/05_teams_invitations.sql` (lines 120-180)

### Activities
- Activity feed: `sql/06_activities_markdown.sql` (lines 8-50)
- Create activity: `sql/06_activities_markdown.sql` (lines 60-70)

### Advanced Concepts
- Triggers: `sql/07_dbms_concepts.sql` (lines 10-150)
- Procedures: `sql/07_dbms_concepts.sql` (lines 160-300)
- Views: `sql/07_dbms_concepts.sql` (lines 310-400)
- Transactions: `sql/07_dbms_concepts.sql` (lines 410-480)

## 🚀 Performance Considerations

1. **Indexes**: Ensure indexes are created on frequently queried columns
2. **JOINs**: Use appropriate JOIN types (INNER, LEFT, RIGHT) based on data requirements
3. **Subqueries vs JOINs**: Use JOINs for better performance when possible
4. **Pagination**: Always use LIMIT/OFFSET for large result sets
5. **JSON Queries**: Use JSONB indexes for JSON column queries if needed

## 📖 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [SQL Tutorial](https://www.w3schools.com/sql/)

## ⚠️ Important Notes

1. **These SQL files are for reference only** - The actual database is managed by Prisma migrations
2. **Do not run these files directly** on the production database without understanding the implications
3. **Parameter validation** should be handled in the application layer (as done in the Prisma/TypeScript code)
4. **Security**: Always use parameterized queries (as shown) to prevent SQL injection
5. **Testing**: Test all queries in a development environment before production use

## 📄 License

These SQL equivalents are provided as documentation for the Synkora project.

