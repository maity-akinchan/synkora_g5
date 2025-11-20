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

CREATE TYPE role_enum AS ENUM ('OWNER', 'EDITOR', 'VIEWER');
CREATE TYPE invitation_status_enum AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');
CREATE TYPE task_status_enum AS ENUM ('TODO', 'IN_PROGRESS', 'UNDER_REVIEW', 'DONE');
CREATE TYPE task_priority_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE activity_type_enum AS ENUM (
    'TASK_CREATED',
    'TASK_UPDATED',
    'TASK_COMPLETED',
    'GIT_COMMIT',
    'MARKDOWN_CREATED',
    'MARKDOWN_UPDATED',
    'AI_SUGGESTION',
    'MEMBER_JOINED'
);

-- =====================================================
-- Tables
-- =====================================================

-- User and Authentication
CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password TEXT, -- Hashed, null for OAuth users
    image TEXT,
    "emailVerified" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "defaultTeamId" TEXT,
    FOREIGN KEY ("defaultTeamId") REFERENCES "Team"(id)
);

CREATE TABLE IF NOT EXISTS "Account" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    refresh_token TEXT,
    "refresh_token_expires_in" INTEGER,
    access_token TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    scope TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
    UNIQUE(provider, "providerAccountId")
);

CREATE TABLE IF NOT EXISTS "Session" (
    id TEXT PRIMARY KEY,
    "sessionToken" TEXT UNIQUE NOT NULL,
    "userId" TEXT NOT NULL,
    expires TIMESTAMP NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- Teams and Projects
CREATE TABLE IF NOT EXISTS "Team" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "TeamMember" (
    id TEXT PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    role role_enum DEFAULT 'EDITOR',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("teamId") REFERENCES "Team"(id) ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
    UNIQUE("teamId", "userId")
);

CREATE TABLE IF NOT EXISTS "TeamInvitation" (
    id TEXT PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    email TEXT NOT NULL,
    role role_enum DEFAULT 'EDITOR',
    status invitation_status_enum DEFAULT 'PENDING',
    "invitedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP NOT NULL,
    FOREIGN KEY ("teamId") REFERENCES "Team"(id) ON DELETE CASCADE,
    UNIQUE("teamId", email)
);

CREATE INDEX IF NOT EXISTS idx_team_invitation_email_status 
ON "TeamInvitation"(email, status);

CREATE TABLE IF NOT EXISTS "Project" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    "teamId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("teamId") REFERENCES "Team"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "ProjectInvitation" (
    id TEXT PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    email TEXT NOT NULL,
    role role_enum DEFAULT 'EDITOR',
    status invitation_status_enum DEFAULT 'PENDING',
    "invitedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP NOT NULL,
    FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE,
    UNIQUE("projectId", email)
);

CREATE INDEX IF NOT EXISTS idx_project_invitation_email_status 
ON "ProjectInvitation"(email, status);

-- Kanban and Tasks
CREATE TABLE IF NOT EXISTS "Task" (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status task_status_enum DEFAULT 'TODO',
    priority task_priority_enum DEFAULT 'MEDIUM',
    position INTEGER NOT NULL,
    "projectId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "createdById" TEXT NOT NULL,
    "dueDate" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE,
    FOREIGN KEY ("assigneeId") REFERENCES "User"(id),
    FOREIGN KEY ("createdById") REFERENCES "User"(id)
);

CREATE INDEX IF NOT EXISTS idx_task_project_status 
ON "Task"("projectId", status);

-- Canvas
CREATE TABLE IF NOT EXISTS "Canvas" (
    id TEXT PRIMARY KEY,
    "projectId" TEXT UNIQUE NOT NULL,
    state JSONB NOT NULL,
    version INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE
);

-- Markdown Files
CREATE TABLE IF NOT EXISTS "MarkdownFile" (
    id TEXT PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE
);

-- Spreadsheet
CREATE TABLE IF NOT EXISTS "Spreadsheet" (
    id TEXT PRIMARY KEY,
    "projectId" TEXT UNIQUE NOT NULL,
    data JSONB NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE
);

-- GitHub Integration
CREATE TABLE IF NOT EXISTS "GitRepository" (
    id TEXT PRIMARY KEY,
    "projectId" TEXT UNIQUE NOT NULL,
    "githubRepoId" TEXT NOT NULL,
    owner TEXT NOT NULL,
    name TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL, -- Encrypted
    "lastSyncedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "GitCommit" (
    id TEXT PRIMARY KEY,
    "repositoryId" TEXT NOT NULL,
    sha TEXT NOT NULL,
    message TEXT NOT NULL,
    author TEXT NOT NULL,
    "authorEmail" TEXT NOT NULL,
    "committedAt" TIMESTAMP NOT NULL,
    url TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("repositoryId") REFERENCES "GitRepository"(id) ON DELETE CASCADE,
    UNIQUE("repositoryId", sha)
);

-- AI Assistant
CREATE TABLE IF NOT EXISTS "AIMessage" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    role TEXT NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    context JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- Activity Feed
CREATE TABLE IF NOT EXISTS "Activity" (
    id TEXT PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    type activity_type_enum NOT NULL,
    data JSONB NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_activity_project_created 
ON "Activity"("projectId", "createdAt");

