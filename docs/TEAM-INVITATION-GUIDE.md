# Team Invitation System Guide

## How Team Invitations Work

### For Team Owners (Sending Invitations)

1. **Navigate to Your Team**
   - Go to the Teams page from the sidebar
   - Click on the team you want to invite someone to

2. **Send an Invitation**
   - Click the "Invite Member" button
   - Enter the person's **email address** (must match their registered account)
   - Select their role (Viewer, Editor, or Owner)
   - Click "Send Invitation"

3. **Important Notes**
   - Only team OWNERS can send invitations
   - The invited person MUST have an account with that exact email address
   - Invitations expire after 7 days
   - You cannot invite someone who is already a team member

### For Invited Users (Receiving Invitations)

1. **Prerequisites**
   - You MUST have an account registered with the email address that received the invitation
   - If you don't have an account, register first at `/register`

2. **Finding Your Invitations**
   - **Bell Icon**: Check the notification bell icon in the top navigation bar
     - A red badge will show the number of pending invitations
     - Click the bell to see all invitations
   
   - **Teams Page**: Go to the Teams page (`/teams`)
     - Pending invitations will appear at the top of the page

3. **Accepting an Invitation**
   - Click the "Accept" button on the invitation
   - You will immediately become a member of the team
   - You can now access all team projects

4. **Declining an Invitation**
   - Click the "Decline" button on the invitation
   - The invitation will be removed from your list

## Troubleshooting

### "I sent an invitation but the person doesn't see it"

**Common causes:**

1. **Email Mismatch**
   - The invited person must log in with the EXACT email address you sent the invitation to
   - Example: If you invited `john@example.com`, they must log in with `john@example.com` (not `john.doe@example.com`)

2. **No Account**
   - The person needs to create an account first
   - They should register at `/register` using the email address you invited

3. **Already Expired**
   - Invitations expire after 7 days
   - Send a new invitation if the old one expired

4. **Cache Issue**
   - Ask them to refresh the page
   - The notification badge updates every 30 seconds automatically

### "I can't send an invitation"

**Common causes:**

1. **Not a Team Owner**
   - Only users with the OWNER role can send invitations
   - Ask a team owner to invite the person or promote you to owner

2. **User Already a Member**
   - The person is already a member of the team
   - Check the team members list

3. **Pending Invitation Exists**
   - There's already a pending invitation for that email
   - Wait for them to accept/decline, or ask a team owner to cancel it

## Testing the Invitation System

### Quick Test Steps:

1. **Create a test account**
   - Register a new account with a different email (e.g., `test@example.com`)

2. **Send an invitation**
   - From your main account, invite `test@example.com` to your team

3. **Check the invitation**
   - Log out and log in as `test@example.com`
   - Check the bell icon or Teams page
   - You should see the invitation

4. **Accept the invitation**
   - Click "Accept"
   - Verify you can now see the team and its projects

## Technical Details

### Database Structure

- Invitations are stored in the `TeamInvitation` table
- Status can be: PENDING, ACCEPTED, REJECTED, or EXPIRED
- Invitations are matched by email address
- When accepted, a `TeamMember` record is created

### API Endpoints

- `POST /api/teams/[id]/invite` - Send invitation (Owner only)
- `GET /api/team-invitations` - Get user's pending invitations
- `POST /api/team-invitations/[id]/accept` - Accept invitation
- `POST /api/team-invitations/[id]/reject` - Reject invitation

### Security

- Only team owners can send invitations
- Users can only accept invitations sent to their email
- Expired invitations are automatically marked as EXPIRED
- Email verification ensures invitations go to the right person
