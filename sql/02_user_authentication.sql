-- =====================================================
-- User and Authentication Queries
-- =====================================================
-- SQL equivalents of Prisma queries from:
-- - app/api/auth/register/route.ts
-- - app/api/user/route.ts
-- - lib/auth.ts

-- =====================================================
-- User Registration
-- =====================================================
-- Equivalent to: prisma.user.findUnique({ where: { email } })
-- Used in: app/api/auth/register/route.ts

-- Check if user already exists
SELECT id, email, name, password, "emailVerified", "createdAt", "updatedAt"
FROM "User"
WHERE email = $1;

-- Equivalent to: prisma.user.create({ data: { email, password, name } })
-- Used in: app/api/auth/register/route.ts

-- Create new user
INSERT INTO "User" (id, email, password, name, "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::TEXT,  -- or use cuid() equivalent
    $1,  -- email
    $2,  -- hashedPassword
    $3,  -- name
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
RETURNING id, email, name, "createdAt";

-- =====================================================
-- User Lookup
-- =====================================================
-- Equivalent to: prisma.user.findUnique({ where: { email: session.user.email } })
-- Used in: Multiple API routes

-- Find user by email
SELECT id, email, name, image, "emailVerified", "createdAt", "updatedAt", "defaultTeamId"
FROM "User"
WHERE email = $1;

-- Find user by ID
SELECT id, email, name, image, "emailVerified", "createdAt", "updatedAt", "defaultTeamId"
FROM "User"
WHERE id = $1;

-- =====================================================
-- User with Default Team
-- =====================================================
-- Equivalent to: prisma.user.findUnique({ where: { id }, select: { defaultTeamId: true } })
-- Used in: app/api/projects/route.ts

-- Get user's default team ID
SELECT id, "defaultTeamId"
FROM "User"
WHERE id = $1;

-- =====================================================
-- Account Management (OAuth)
-- =====================================================
-- Equivalent to: prisma.account.findUnique({ where: { provider_providerAccountId } })
-- Used in: lib/auth.ts (NextAuth)

-- Find account by provider
SELECT id, "userId", type, provider, "providerAccountId", 
       refresh_token, "refresh_token_expires_in", access_token, 
       "expires_at", "token_type", scope, "id_token", "session_state"
FROM "Account"
WHERE provider = $1 AND "providerAccountId" = $2;

-- Create OAuth account
INSERT INTO "Account" (
    id, "userId", type, provider, "providerAccountId",
    refresh_token, access_token, "expires_at", "token_type", scope
)
VALUES (
    gen_random_uuid()::TEXT,
    $1,  -- userId
    $2,  -- type
    $3,  -- provider
    $4,  -- providerAccountId
    $5,  -- refresh_token
    $6,  -- access_token
    $7,  -- expires_at
    $8,  -- token_type
    $9   -- scope
)
RETURNING *;

-- =====================================================
-- Session Management
-- =====================================================
-- Equivalent to: prisma.session.findUnique({ where: { sessionToken } })
-- Used in: lib/auth.ts (NextAuth)

-- Find session by token
SELECT s.id, s."sessionToken", s."userId", s.expires,
       u.id as "user.id", u.email as "user.email", u.name as "user.name", 
       u.image as "user.image"
FROM "Session" s
INNER JOIN "User" u ON s."userId" = u.id
WHERE s."sessionToken" = $1;

-- Create session
INSERT INTO "Session" (id, "sessionToken", "userId", expires)
VALUES (
    gen_random_uuid()::TEXT,
    $1,  -- sessionToken
    $2,  -- userId
    $3   -- expires
)
RETURNING *;

-- Delete session
DELETE FROM "Session"
WHERE "sessionToken" = $1;

-- =====================================================
-- User Update
-- =====================================================
-- Update user profile
UPDATE "User"
SET 
    name = COALESCE($2, name),
    image = COALESCE($3, image),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING id, email, name, image, "updatedAt";

-- Update user's default team
UPDATE "User"
SET 
    "defaultTeamId" = $2,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING id, "defaultTeamId";

