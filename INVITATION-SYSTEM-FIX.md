# Team Invitation System - Troubleshooting Guide

## The Issue

Users are sending team invitations, but the invited person is not receiving them.

## Root Cause

The invitation system is working correctly, but there are specific requirements that must be met:

### Critical Requirements:

1. **Email Match**: The invited person MUST have an account registered with the EXACT email address that received the invitation
2. **Account Exists**: The person must already be registered in the system
3. **Correct Login**: They must log in with that specific email address

## How It Works

### Sending an Invitation:
1. Team owner goes to their team page
2. Clicks "Invite Member"
3. Enters the person's email (e.g., `john@example.com`)
4. Selects a role and sends

### Receiving an Invitation:
1. The invited person must have an account with `john@example.com`
2. They log in with that email
3. They check:
   - Bell icon (notification badge) in the top navigation
   - Teams page (`/teams`)
4. They see the invitation and can accept/decline

## Testing Steps

### Step 1: Create Test Accounts
```
Account 1: owner@example.com (Team Owner)
Account 2: member@example.com (To be invited)
```

### Step 2: Send Invitation
1. Log in as `owner@example.com`
2. Create a team or go to existing team
3. Click "Invite Member"
4. Enter `member@example.com`
5. Select role and send

### Step 3: Check Invitation
1. Log out
2. Log in as `member@example.com`
3. Check bell icon (should show badge with "1")
4. Or go to `/teams` page
5. Should see the invitation

### Step 4: Accept Invitation
1. Click "Accept" button
2. Should now be a team member
3. Can access team projects

## Debug Tools Added

### 1. Debug Page
Visit `/debug-invitations` to see:
- Your current email address
- All pending invitations for your account
- Invitation details (email, status, dates)

### 2. Console Logging
Added server-side logging:
- When invitations are created
- When invitations are fetched
- Shows email addresses for debugging

### 3. Documentation
Created `docs/TEAM-INVITATION-GUIDE.md` with:
- Complete user guide
- Troubleshooting steps
- Technical details

## Common Issues & Solutions

### Issue: "I don't see any invitations"

**Solutions:**
1. Verify you're logged in with the correct email
2. Check `/debug-invitations` to see your current email
3. Ask the sender what email they used
4. Refresh the page (notifications update every 30 seconds)

### Issue: "I sent an invitation but they don't see it"

**Solutions:**
1. Verify they have an account with that email
2. Ask them to check `/debug-invitations`
3. Check server logs for the invitation creation
4. Verify the invitation wasn't expired (7 days)

### Issue: "Email doesn't match"

**Solutions:**
1. The email must match EXACTLY (case-sensitive)
2. `john@example.com` ≠ `John@example.com`
3. `john@example.com` ≠ `john.doe@example.com`
4. Ask them to register with the invited email

## Files Modified

1. `app/api/team-invitations/route.ts` - Added logging
2. `app/api/teams/[id]/invite/route.ts` - Added logging
3. `app/(dashboard)/debug-invitations/page.tsx` - New debug page
4. `docs/TEAM-INVITATION-GUIDE.md` - New user guide
5. `INVITATION-SYSTEM-FIX.md` - This file

## Next Steps

1. Test the invitation flow with two different accounts
2. Check the debug page to verify invitations are being created
3. Check server logs to see the console output
4. If still not working, check the database directly:
   ```sql
   SELECT * FROM "TeamInvitation" WHERE email = 'user@example.com';
   ```

## Technical Details

### Database Query
```typescript
// Invitations are fetched by exact email match
const invitations = await prisma.teamInvitation.findMany({
    where: {
        email: session.user.email, // Must match exactly
        status: "PENDING",
    },
});
```

### Email Matching
- Uses `session.user.email` from NextAuth
- Case-sensitive comparison
- No wildcards or partial matches
- Must be exact string match

## Support

If the issue persists after following these steps:
1. Check `/debug-invitations` for both sender and receiver
2. Check server console logs
3. Verify database has the invitation record
4. Ensure both users are using the correct email addresses
