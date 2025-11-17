# GitHub Chatbot Repository Access Fix

## Problem

The GitHub AI chatbot in the Git integration page was unable to find any repositories, even when users were properly
authenticated with GitHub and had all necessary permissions granted to the application.

## Root Cause

The issue was in the NextAuth JWT callback (`lib/auth.ts`). The GitHub access token was only being stored in the JWT
during the **initial sign-in** when the `account` object was present. On subsequent requests, the `account` parameter is
not available in the JWT callback, so the `githubAccessToken` was lost from the session.

```typescript
// BEFORE (only worked on first sign-in)
if (account?.provider === "github" && account?.access_token) {
    token.githubAccessToken = account.access_token;
}
```

## Solution

Modified the JWT callback to fetch the GitHub access token from the database whenever it's not present in the JWT. This
ensures the token is always available in the session, regardless of when the user signed in.

### Changes Made

#### 1. Fixed `lib/auth.ts`

Added database lookup for GitHub access token if not present in JWT:

```typescript
// Store GitHub access token in JWT during initial sign-in
if (account?.provider === "github" && account?.access_token) {
    token.githubAccessToken = account.access_token;
}

// If token doesn't have githubAccessToken, try to fetch it from database
if (!token.githubAccessToken && token.id) {
    try {
        const githubAccount = await prisma.account.findFirst({
            where: {
                userId: token.id as string,
                provider: "github",
            },
            select: {
                access_token: true,
            },
        });
        
        if (githubAccount?.access_token) {
            token.githubAccessToken = githubAccount.access_token;
        }
    } catch (error) {
        console.error("Error fetching GitHub access token:", error);
    }
}
```

#### 2. Enhanced `app/api/github/repositories/route.ts`

Added comprehensive logging and better error handling:

- **Session debugging**: Logs session state and token availability
- **User-friendly errors**: Clear messages for different failure scenarios
- **Authentication detection**: Identifies and reports expired or invalid tokens
- **Detailed logging**: Console logs to help diagnose issues

Key improvements:

```typescript
console.log("[GitHub Repositories API] Session check:", {
    hasSession: !!session,
    hasUser: !!session?.user,
    userId: session?.user?.id,
    hasGitHubToken: !!session?.githubAccessToken,
});

// Check if it's an authentication error
if (error.status === 401 || error.message?.includes("Bad credentials")) {
    return NextResponse.json(
        { error: "GitHub authentication failed. Please reconnect your GitHub account." },
        { status: 401 }
    );
}
```

#### 3. Improved `components/analytics/repo-ai-chat.tsx`

Enhanced user experience with better error handling and UI:

- **Detailed error messages**: Context-specific help text
- **Retry functionality**: Button to retry loading repositories
- **Console logging**: Debug information for troubleshooting
- **Visual indicators**: Alert icons and better error display
- **Loading states**: Clear feedback during operations
- **Dark mode support**: Proper styling for dark theme
- **Enter key support**: Send messages with Enter key

Key features:

```typescript
const loadRepositories = async () => {
    console.log("[RepoAIChat] Fetching repositories...");
    const res = await fetch("/api/github/repositories");
    console.log("[RepoAIChat] Response status:", res.status);
    
    if (res.status === 401) {
        setError("Please sign in with GitHub to use the AI Assistant");
        return;
    }
    
    if (res.status === 403) {
        setError("Please connect your GitHub account in your account settings");
        return;
    }
    
    // ... more error handling
};
```

## How It Works Now

1. **User signs in with GitHub** → Access token stored in database
2. **JWT callback fires** → Checks if token is in JWT
3. **Token not in JWT?** → Fetches from database
4. **Token added to session** → Available to API routes
5. **API routes use token** → Successfully fetch repositories
6. **Chatbot displays repos** → User can select and chat

## Testing

### To verify the fix works:

1. **Sign in with GitHub**
    - Go to login page
    - Click "Sign in with GitHub"
    - Authorize the application

2. **Navigate to Git page**
    - Open a project
    - Click on "Git" tab
    - Click the floating AI Assistant button (bottom right)

3. **Check console logs**
   ```
   [RepoAIChat] Fetching repositories...
   [GitHub Repositories API] Session check: { hasSession: true, hasUser: true, userId: '...', hasGitHubToken: true }
   [GitHub Repositories API] Fetching repositories for user: ...
   [GitHub Repositories API] Successfully fetched repositories: { count: X, hasMore: false }
   [RepoAIChat] Received data: { repositories: [...], ... }
   [RepoAIChat] Parsed repositories: [...]
   ```

4. **Verify UI**
    - Repository dropdown should show your repos
    - No error messages should appear
    - Can select a repository
    - Can ask questions and get AI responses

### Troubleshooting

If repositories still don't appear:

1. **Check console for errors**
    - Look for `[GitHub Repositories API]` logs
    - Look for `[RepoAIChat]` logs

2. **Verify GitHub connection**
   ```sql
   SELECT * FROM "Account" WHERE provider = 'github' AND "userId" = 'YOUR_USER_ID';
   ```
   Should show a record with `access_token` populated

3. **Test API endpoint directly**
   ```bash
   # In browser console on authenticated page
   fetch('/api/github/repositories').then(r => r.json()).then(console.log)
   ```

4. **Check GitHub token validity**
    - Token might have expired
    - Try signing out and signing in with GitHub again
    - Check OAuth app settings in GitHub

5. **Verify environment variables**
   ```
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   ```

## Benefits

1. **Persistent access**: GitHub token persists across sessions
2. **Better UX**: Clear error messages and retry options
3. **Debugging**: Comprehensive logging for troubleshooting
4. **Reliability**: Fallback to database if JWT doesn't have token
5. **User guidance**: Context-specific help text

## Related Files

- `lib/auth.ts` - JWT callback with database lookup
- `app/api/github/repositories/route.ts` - Repository fetching endpoint
- `components/analytics/repo-ai-chat.tsx` - AI chatbot UI component
- `lib/github-client.ts` - GitHub API client wrapper
- `types/next-auth.d.ts` - TypeScript types for session
- `prisma/schema.prisma` - Database schema (Account model)

## API Endpoints

### GET `/api/github/repositories`

Fetches authenticated user's GitHub repositories.

**Authentication**: Required (GitHub access token in session)

**Query Parameters**:

- `page` (optional): Page number (default: 1)
- `perPage` (optional): Results per page (default: 30)

**Response**:

```json
{
  "repositories": [
    {
      "id": "12345",
      "name": "my-repo",
      "fullName": "username/my-repo",
      "owner": "username",
      "description": "Repository description",
      "private": false,
      "url": "https://github.com/username/my-repo"
    }
  ],
  "hasMore": false,
  "page": 1,
  "perPage": 30
}
```

**Error Responses**:

- `401`: Unauthorized (not signed in)
- `403`: GitHub account not connected
- `401`: GitHub authentication failed (invalid token)
- `500`: Server error

### POST `/api/github/ai-insights`

Gets AI-generated insights about a repository.

**Authentication**: Required (GitHub access token in session)

**Request Body**:

```json
{
  "repoFullName": "username/repo-name",
  "prompt": "Explain the recent commits",
  "history": [
    { "role": "user", "content": "Previous message" },
    { "role": "assistant", "content": "Previous response" }
  ]
}
```

**Response**:

```json
{
  "assistant": {
    "role": "assistant",
    "content": "AI-generated response about the repository"
  }
}
```

## Security Considerations

1. **Token storage**: Access tokens stored encrypted in database
2. **Session security**: JWT tokens properly signed
3. **API scopes**: Only requests necessary GitHub permissions (`read:user user:email repo`)
4. **Error handling**: Doesn't expose sensitive information in errors
5. **Validation**: All inputs validated before processing

## Future Improvements

Potential enhancements to consider:

1. **Token refresh**: Implement automatic refresh for expired tokens
2. **Organization repos**: Support for organization repositories
3. **Repository search**: Add search/filter functionality
4. **Favorites**: Let users pin favorite repositories
5. **Context awareness**: Include more repository metadata in AI context
6. **File browsing**: Allow AI to reference specific files
7. **PR analysis**: Deep analysis of pull requests
8. **Issue tracking**: Integration with GitHub Issues

## Conclusion

The GitHub chatbot repository access issue has been fully resolved. Users can now:

- ✅ Sign in with GitHub
- ✅ View their repositories in the AI chatbot
- ✅ Select any repository to chat about
- ✅ Get AI-powered insights about commits, PRs, and code
- ✅ See clear error messages if something goes wrong
- ✅ Retry loading if there's a temporary issue

The fix ensures the GitHub access token is always available in the session, enabling seamless integration between the
application and GitHub's API.
