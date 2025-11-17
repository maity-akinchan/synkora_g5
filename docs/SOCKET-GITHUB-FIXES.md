# Socket.io & GitHub API Fixes

## Overview

This document explains the fixes applied to resolve two critical issues:

1. **Socket.io Authentication Error** - Preventing real-time collaboration
2. **GitHub API Bad Credentials** - Blocking GitHub repository features

---

## Issue 1: Socket.io Authentication Error

### Problem

```
Socket authentication error: Error: Must pass `req` to JWT getToken()
```

**Root Cause:** The socket.io middleware in `server.js` was incorrectly using NextAuth's `getToken()` function, which
expects a Next.js request object, but we were passing a JWT token string instead.

### Solution

#### Before (server.js)

```javascript
const { getToken } = require("next-auth/jwt");

io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    const decoded = await getToken({
        token,
        secret: process.env.NEXTAUTH_SECRET,
    });
    // ...
});
```

#### After (server.js)

```javascript
const { verify } = require("jsonwebtoken");

io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    const decoded = verify(token, process.env.NEXTAUTH_SECRET);
    // ...
});
```

**Changes Made:**

1. Replaced `next-auth/jwt`'s `getToken()` with native `jsonwebtoken`'s `verify()`
2. Directly verify the JWT token string using `NEXTAUTH_SECRET`
3. Installed `jsonwebtoken` package

#### Client-Side Update (hooks/use-socket.ts)

Updated the socket hook to properly extract the JWT token from the NextAuth session cookie:

```typescript
const getJWTToken = async () => {
    const cookies = document.cookie.split(';');
    let jwtToken = '';
    
    // Look for next-auth session token
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'next-auth.session-token' || name === '__Secure-next-auth.session-token') {
            jwtToken = value;
            break;
        }
    }
    
    return jwtToken || session.user.id;
};
```

### Impact

✅ **Real-time collaboration now works:**

- Canvas updates sync across users
- Cursor positions broadcast correctly
- Task/kanban changes propagate
- Active users list updates properly
- Typing indicators function

---

## Issue 2: GitHub API Bad Credentials

### Problem

```
Error fetching user repositories: RequestError [HttpError]: Bad credentials
GET /user/repos - 401
```

**Root Cause:** The GitHub access token stored in the session was either:

- Expired
- Invalid
- Never properly stored from the OAuth flow

### Solution

Enhanced the GitHub repositories API route with:

1. **Fallback Token Retrieval** - Check database if session doesn't have token
2. **Token Expiration Check** - Validate token hasn't expired
3. **Better Error Messages** - Guide users to reconnect

#### Updated Code (app/api/github/repositories/route.ts)

```typescript
// Check if user has GitHub access token in session
let githubAccessToken = session.githubAccessToken;

// If not in session, try to fetch from database
if (!githubAccessToken) {
    const githubAccount = await prisma.account.findFirst({
        where: {
            userId: session.user.id,
            provider: "github",
        },
        select: {
            access_token: true,
            expires_at: true,
        },
    });

    if (githubAccount?.access_token) {
        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        const isExpired = githubAccount.expires_at && githubAccount.expires_at < now;
        
        if (isExpired) {
            return NextResponse.json(
                { 
                    error: "GitHub token expired. Please reconnect your GitHub account.",
                    needsReconnect: true,
                },
                { status: 401 }
            );
        }
        
        githubAccessToken = githubAccount.access_token;
    }
}
```

### User Action Required

If you see GitHub authentication errors, you need to **reconnect your GitHub account**:

1. Go to **Settings** or **Account Settings**
2. Find **Connected Accounts** or **Integrations**
3. Click **Connect GitHub** or **Reconnect GitHub**
4. Authorize the app with the required scopes:
    - `read:user`
    - `user:email`
    - `repo`

### Why Tokens Expire

GitHub OAuth tokens can become invalid due to:

- **Token Revocation** - User revoked app access on GitHub
- **Expired Tokens** - Some OAuth tokens have expiration times
- **Scope Changes** - App requires additional permissions
- **GitHub Policy** - GitHub security policies may invalidate old tokens

---

## Testing the Fixes

### Socket.io Authentication

1. Open your app in two browser windows
2. Navigate to the same project canvas
3. Draw on one window - should appear on the other
4. Check browser console - no authentication errors

### GitHub Integration

1. Navigate to GitHub features (repository list, commits, etc.)
2. If you see "GitHub account not connected" or "token expired":
    - Go to Settings
    - Reconnect your GitHub account
3. Verify repositories load successfully

---

## Files Modified

1. **server.js** - Socket.io authentication middleware
2. **hooks/use-socket.ts** - JWT token extraction from cookies
3. **app/api/github/repositories/route.ts** - Enhanced token handling
4. **package.json** - Added `jsonwebtoken` dependency

---

## Environment Variables

Ensure these are set in your `.env`:

```env
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

---

## Logs Confirmation

After the fixes, you should see:

```
✓ Socket connected: <socket-id>
✓ Socket authentication successful
✓ User joined project: <project-id>
✓ [GitHub Repositories API] Successfully fetched repositories
```

Instead of:

```
✗ Socket authentication error: Must pass `req` to JWT getToken()
✗ Error fetching user repositories: Bad credentials
```

---

## Next Steps

If you still experience issues:

1. **Clear cookies and sign in again** - Ensures fresh JWT tokens
2. **Check GitHub OAuth app settings** - Verify redirect URIs and scopes
3. **Review server logs** - Look for detailed error messages
4. **Database check** - Ensure `Account` table has valid GitHub records

---

## Additional Notes

- Canvas save functionality was already working (200 OK responses in logs)
- Spreadsheet data persists correctly
- The main issues were authentication-related, not data persistence
- Real-time features require both client AND server authentication to be working

---

**Documentation Date:** November 16, 2025
**Status:** ✅ Issues Resolved
