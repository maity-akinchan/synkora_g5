-- =====================================================
-- Database Schema Definition
-- =====================================================
-- This file contains the SQL schema equivalent to the Prisma schema
-- Based on PostgreSQL (as specified in prisma/schema.prisma)

-- Note: This is for reference only. The actual database schema
-- is managed by Prisma migrations.

-- =====================================================
-- Enums
-- =====================================================



-- =====================================================
-- Tables
-- =====================================================

-- User and Authentication
-- CREATE TABLE IF NOT EXISTS "User" (
--     id INT PRIMARY KEY,
--     email TEXT UNIQUE NOT NULL,
--     name TEXT,
--     password TEXT, -- Hashed, null for OAuth users
--     image TEXT,
--     "emailVerified" TIMESTAMP,
--     "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     "defaultTeamId" TEXT,
--     FOREIGN KEY ("defaultTeamId") REFERENCES "Team"(id)
-- );

-- CREATE TABLE IF NOT EXISTS "Account" (
--     id TEXT PRIMARY KEY,
--     "userId" TEXT NOT NULL,
--     type TEXT NOT NULL,
--     provider TEXT NOT NULL,
--     "providerAccountId" TEXT NOT NULL,
--     refresh_token TEXT,
--     "refresh_token_expires_in" INTEGER,
--     access_token TEXT,
--     "expires_at" INTEGER,
--     "token_type" TEXT,
--     scope TEXT,
--     "id_token" TEXT,
--     "session_state" TEXT,
--     FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
--     UNIQUE(provider, "providerAccountId")
-- );

-- CREATE TABLE IF NOT EXISTS "Session" (
--     id TEXT PRIMARY KEY,
--     "sessionToken" TEXT UNIQUE NOT NULL,
--     "userId" TEXT NOT NULL,
--     expires TIMESTAMP NOT NULL,
--     FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
-- );

-- -- Teams and Projects
-- CREATE TABLE IF NOT EXISTS "Team" (
--     id TEXT PRIMARY KEY,
--     name TEXT NOT NULL,
--     "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- CREATE TABLE IF NOT EXISTS "TeamMember" (
--     id TEXT PRIMARY KEY,
--     "teamId" TEXT NOT NULL,
--     "userId" TEXT NOT NULL,
--     role role_enum DEFAULT 'EDITOR',
--     "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY ("teamId") REFERENCES "Team"(id) ON DELETE CASCADE,
--     FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
--     UNIQUE("teamId", "userId")
-- );

-- CREATE TABLE IF NOT EXISTS "TeamInvitation" (
--     id TEXT PRIMARY KEY,
--     "teamId" TEXT NOT NULL,
--     email TEXT NOT NULL,
--     role role_enum DEFAULT 'EDITOR',
--     status invitation_status_enum DEFAULT 'PENDING',
--     "invitedBy" TEXT NOT NULL,
--     "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     "expiresAt" TIMESTAMP NOT NULL,
--     FOREIGN KEY ("teamId") REFERENCES "Team"(id) ON DELETE CASCADE,
--     UNIQUE("teamId", email)
-- );

-- CREATE INDEX IF NOT EXISTS idx_team_invitation_email_status 
-- ON "TeamInvitation"(email, status);

-- CREATE TABLE IF NOT EXISTS "Project" (
--     id TEXT PRIMARY KEY,
--     name TEXT NOT NULL,
--     description TEXT,
--     "teamId" TEXT,
--     "createdById" TEXT NOT NULL,
--     "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY ("teamId") REFERENCES "Team"(id) ON DELETE CASCADE
-- );

-- CREATE TABLE IF NOT EXISTS "ProjectInvitation" (
--     id TEXT PRIMARY KEY,
--     "projectId" TEXT NOT NULL,
--     email TEXT NOT NULL,
--     role role_enum DEFAULT 'EDITOR',
--     status invitation_status_enum DEFAULT 'PENDING',
--     "invitedBy" TEXT NOT NULL,
--     "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     "expiresAt" TIMESTAMP NOT NULL,
--     FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE,
--     UNIQUE("projectId", email)
-- );

-- CREATE INDEX IF NOT EXISTS idx_project_invitation_email_status 
-- ON "ProjectInvitation"(email, status);

-- -- Kanban and Tasks
-- CREATE TABLE IF NOT EXISTS "Task" (
--     id TEXT PRIMARY KEY,
--     title TEXT NOT NULL,
--     description TEXT,
--     status task_status_enum DEFAULT 'TODO',
--     priority task_priority_enum DEFAULT 'MEDIUM',
--     position INTEGER NOT NULL,
--     "projectId" TEXT NOT NULL,
--     "assigneeId" TEXT,
--     "createdById" TEXT NOT NULL,
--     "dueDate" TIMESTAMP,
--     "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE,
--     FOREIGN KEY ("assigneeId") REFERENCES "User"(id),
--     FOREIGN KEY ("createdById") REFERENCES "User"(id)
-- );

-- CREATE INDEX IF NOT EXISTS idx_task_project_status 
-- ON "Task"("projectId", status);

-- -- Canvas
-- CREATE TABLE IF NOT EXISTS "Canvas" (
--     id TEXT PRIMARY KEY,
--     "projectId" TEXT UNIQUE NOT NULL,
--     state JSONB NOT NULL,
--     version INTEGER DEFAULT 0,
--     "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE
-- );

-- -- Markdown Files
-- CREATE TABLE IF NOT EXISTS "MarkdownFile" (
--     id TEXT PRIMARY KEY,
--     "projectId" TEXT NOT NULL,
--     title TEXT NOT NULL,
--     content TEXT NOT NULL,
--     "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE
-- );

-- -- Spreadsheet
-- CREATE TABLE IF NOT EXISTS "Spreadsheet" (
--     id TEXT PRIMARY KEY,
--     "projectId" TEXT UNIQUE NOT NULL,
--     data JSONB NOT NULL,
--     "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE
-- );

-- -- GitHub Integration
-- CREATE TABLE IF NOT EXISTS "GitRepository" (
--     id TEXT PRIMARY KEY,
--     "projectId" TEXT UNIQUE NOT NULL,
--     "githubRepoId" TEXT NOT NULL,
--     owner TEXT NOT NULL,
--     name TEXT NOT NULL,
--     "fullName" TEXT NOT NULL,
--     "accessToken" TEXT NOT NULL, -- Encrypted
--     "lastSyncedAt" TIMESTAMP,
--     "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE
-- );

-- CREATE TABLE IF NOT EXISTS "GitCommit" (
--     id TEXT PRIMARY KEY,
--     "repositoryId" TEXT NOT NULL,
--     sha TEXT NOT NULL,
--     message TEXT NOT NULL,
--     author TEXT NOT NULL,
--     "authorEmail" TEXT NOT NULL,
--     "committedAt" TIMESTAMP NOT NULL,
--     url TEXT NOT NULL,
--     "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY ("repositoryId") REFERENCES "GitRepository"(id) ON DELETE CASCADE,
--     UNIQUE("repositoryId", sha)
-- );

-- -- AI Assistant
-- CREATE TABLE IF NOT EXISTS "AIMessage" (
--     id TEXT PRIMARY KEY,
--     "userId" TEXT NOT NULL,
--     "projectId" TEXT,
--     role TEXT NOT NULL, -- 'user' or 'assistant'
--     content TEXT NOT NULL,
--     context JSONB,
--     "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
-- );

-- -- Activity Feed
-- CREATE TABLE IF NOT EXISTS "Activity" (
--     id TEXT PRIMARY KEY,
--     "projectId" TEXT NOT NULL,
--     type activity_type_enum NOT NULL,
--     data JSONB NOT NULL,
--     "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE
-- );

-- CREATE INDEX IF NOT EXISTS idx_activity_project_created 
-- ON "Activity"("projectId", "createdAt");


-- CREATE TYPE role_enum AS ENUM ('OWNER', 'EDITOR', 'VIEWER');
-- CREATE TYPE invitation_status_enum AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');
-- CREATE TYPE task_status_enum AS ENUM ('TODO', 'IN_PROGRESS', 'UNDER_REVIEW', 'DONE');
-- CREATE TYPE task_priority_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH');
-- CREATE TYPE activity_type_enum AS ENUM (
--     'TASK_CREATED',
--     'TASK_UPDATED',
--     'TASK_COMPLETED',
--     'GIT_COMMIT',
--     'MARKDOWN_CREATED',
--     'MARKDOWN_UPDATED',
--     'AI_SUGGESTION',
--     'MEMBER_JOINED'
-- );


--------------------------------------------------------------------------------------
-----------------------------------------------------------------------------------
--Arshia

-- 1. Teams (create before User because User references default_team_id)
CREATE TABLE IF NOT EXISTS Team (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users
CREATE TABLE IF NOT EXISTS "User" (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(320) NOT NULL UNIQUE,
    name VARCHAR(255),
    password VARCHAR(1024), -- hashed password; NULL for OAuth users
    image VARCHAR(1024),
    email_verified DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    default_team_id VARCHAR(36),
    CONSTRAINT fk_user_default_team FOREIGN KEY (default_team_id)
        REFERENCES Team(id)
        ON DELETE SET NULL
);

-- 3. Account (OAuth / providers)
CREATE TABLE IF NOT EXISTS Account (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type VARCHAR(50) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    refresh_token TEXT,
    refresh_token_expires_in INTEGER,
    access_token TEXT,
    expires_at INTEGER,
    token_type VARCHAR(50),
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    CONSTRAINT fk_account_user FOREIGN KEY (user_id)
        REFERENCES "User"(id)
        ON DELETE CASCADE,
    CONSTRAINT uq_provider_provideraccount UNIQUE (provider, provider_account_id)
);

-- 4. Session
CREATE TABLE IF NOT EXISTS Session (
    id VARCHAR(255) PRIMARY KEY,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    expires DATETIME NOT NULL,
    CONSTRAINT fk_session_user FOREIGN KEY (user_id)
        REFERENCES "User"(id)
        ON DELETE CASCADE
);

-- 5. TeamMember
CREATE TABLE IF NOT EXISTS TeamMember (
    id VARCHAR(36) PRIMARY KEY,
    team_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'EDITOR',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_teammember_team FOREIGN KEY (team_id)
        REFERENCES Team(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_teammember_user FOREIGN KEY (user_id)
        REFERENCES "User"(id)
        ON DELETE CASCADE,
    CONSTRAINT uq_team_member UNIQUE (team_id, user_id),
    -- role enum constraint (portable CHECK)
    CONSTRAINT chk_teammember_role CHECK (role IN ('OWNER', 'EDITOR', 'VIEWER'))
);

-- 6. TeamInvitation
CREATE TABLE IF NOT EXISTS TeamInvitation (
    id VARCHAR(36) PRIMARY KEY,
    team_id VARCHAR(36) NOT NULL,
    email VARCHAR(320) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'EDITOR',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    invited_by VARCHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    CONSTRAINT fk_teaminv_team FOREIGN KEY (team_id)
        REFERENCES Team(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_teaminv_invitedby FOREIGN KEY (invited_by)
        REFERENCES "User"(id),
    CONSTRAINT uq_teaminv_team_email UNIQUE (team_id, email),
    CONSTRAINT chk_teaminv_role CHECK (role IN ('OWNER', 'EDITOR', 'VIEWER')),
    CONSTRAINT chk_teaminv_status CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'))
);

CREATE INDEX IF NOT EXISTS idx_team_invitation_email_status 
    ON TeamInvitation(email, status);

-- 7. Project
CREATE TABLE IF NOT EXISTS Project (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    team_id VARCHAR(36),
    created_by_id VARCHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_project_team FOREIGN KEY (team_id)
        REFERENCES Team(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_project_createdby FOREIGN KEY (created_by_id)
        REFERENCES "User"(id)
);

-- 8. ProjectInvitation
CREATE TABLE IF NOT EXISTS ProjectInvitation (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    email VARCHAR(320) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'EDITOR',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    invited_by VARCHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    CONSTRAINT fk_projinv_project FOREIGN KEY (project_id)
        REFERENCES Project(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_projinv_invitedby FOREIGN KEY (invited_by)
        REFERENCES "User"(id),
    CONSTRAINT uq_projectinv_project_email UNIQUE (project_id, email),
    CONSTRAINT chk_projinv_role CHECK (role IN ('OWNER', 'EDITOR', 'VIEWER')),
    CONSTRAINT chk_projinv_status CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'))
);

CREATE INDEX IF NOT EXISTS idx_project_invitation_email_status 
    ON ProjectInvitation(email, status);

-- 9. Task
CREATE TABLE IF NOT EXISTS Task (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(1024) NOT NULL,
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'TODO',
    priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM',
    position INTEGER NOT NULL,
    project_id VARCHAR(36) NOT NULL,
    assignee_id VARCHAR(36),
    created_by_id VARCHAR(36) NOT NULL,
    due_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_task_project FOREIGN KEY (project_id)
        REFERENCES Project(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_task_assignee FOREIGN KEY (assignee_id)
        REFERENCES "User"(id),
    CONSTRAINT fk_task_createdby FOREIGN KEY (created_by_id)
        REFERENCES "User"(id),
    CONSTRAINT chk_task_status CHECK (status IN ('TODO', 'IN_PROGRESS', 'UNDER_REVIEW', 'DONE')),
    CONSTRAINT chk_task_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH'))
);

CREATE INDEX IF NOT EXISTS idx_task_project_status 
    ON Task(project_id, status);

-- 10. Canvas (project-specific single canvas)
CREATE TABLE IF NOT EXISTS Canvas (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL UNIQUE,
    state TEXT NOT NULL, -- JSON stored as text for portability
    version INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_canvas_project FOREIGN KEY (project_id)
        REFERENCES Project(id)
        ON DELETE CASCADE
);

-- 11. MarkdownFile
CREATE TABLE IF NOT EXISTS MarkdownFile (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_markdown_project FOREIGN KEY (project_id)
        REFERENCES Project(id)
        ON DELETE CASCADE
);

-- 12. Spreadsheet (project-specific single spreadsheet)
CREATE TABLE IF NOT EXISTS Spreadsheet (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL UNIQUE,
    data TEXT NOT NULL, -- JSON stored as text
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_spreadsheet_project FOREIGN KEY (project_id)
        REFERENCES Project(id)
        ON DELETE CASCADE
);

-- 13. GitRepository
CREATE TABLE IF NOT EXISTS GitRepository (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL UNIQUE,
    github_repo_id VARCHAR(255) NOT NULL,
    owner VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(512) NOT NULL,
    access_token TEXT NOT NULL, -- must be encrypted at app level
    last_synced_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_gitrepo_project FOREIGN KEY (project_id)
        REFERENCES Project(id)
        ON DELETE CASCADE
);

-- 14. GitCommit
CREATE TABLE IF NOT EXISTS GitCommit (
    id VARCHAR(36) PRIMARY KEY,
    repository_id VARCHAR(36) NOT NULL,
    sha VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    author_email VARCHAR(320) NOT NULL,
    committed_at DATETIME NOT NULL,
    url VARCHAR(1024) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_gitcommit_repo FOREIGN KEY (repository_id)
        REFERENCES GitRepository(id)
        ON DELETE CASCADE,
    CONSTRAINT uq_gitcommit_repo_sha UNIQUE (repository_id, sha)
);

-- 15. AIMessage
CREATE TABLE IF NOT EXISTS AIMessage (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    project_id VARCHAR(36),
    role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    context TEXT, -- JSON as text
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_aimsg_user FOREIGN KEY (user_id)
        REFERENCES "User"(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_aimsg_project FOREIGN KEY (project_id)
        REFERENCES Project(id)
        ON DELETE SET NULL
);

-- 16. Activity
CREATE TABLE IF NOT EXISTS Activity (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    type VARCHAR(50) NOT NULL,
    data TEXT NOT NULL, -- JSON as text
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activity_project FOREIGN KEY (project_id)
        REFERENCES Project(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_activity_type CHECK (
        type IN (
            'TASK_CREATED',
            'TASK_UPDATED',
            'TASK_COMPLETED',
            'GIT_COMMIT',
            'MARKDOWN_CREATED',
            'MARKDOWN_UPDATED',
            'AI_SUGGESTION',
            'MEMBER_JOINED'
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_activity_project_created 
    ON Activity(project_id, created_at);