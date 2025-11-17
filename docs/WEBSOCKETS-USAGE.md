# 🔌 WebSocket Usage in Synkora

## Overview

Yes, your project **extensively uses WebSockets** via **Socket.io** for **real-time collaboration features**. This
enables multiple users to work together on the same project simultaneously with instant updates.

---

## 🎯 What WebSockets Do

WebSockets provide a **bidirectional, persistent connection** between the browser and server, allowing:

- **Instant updates** without polling or page refresh
- **Live collaboration** across multiple users
- **Low latency** for real-time features

---

## 🚀 Features Powered by WebSockets

### 1. **Collaborative Canvas** 🎨

**File:** `components/canvas/collaborative-canvas.tsx`

**What it does:**

- **Live drawing sync** - When one user draws, all other users see it instantly
- **Cursor tracking** - See where other users are pointing/drawing
- **Shape updates** - Add, move, delete, or modify shapes in real-time
- **Conflict resolution** - Merges changes from multiple users

**Events:**

- `canvas:update` - Broadcasts shape changes (add, update, delete)
- `canvas:cursor` - Shares cursor position with debouncing (every 100ms)

**User Experience:**

```
User A draws a circle → Socket emits change → User B's canvas updates instantly
User B moves the circle → Socket emits change → User A sees the movement
```

---

### 2. **Kanban Board / Task Management** 📋

**File:** `hooks/use-realtime-kanban.ts`

**What it does:**

- **Live task updates** - Create, update, delete tasks across all users
- **Drag & drop sync** - Move tasks between columns (To Do → In Progress → Done)
- **Real-time notifications** - See when teammates create or complete tasks

**Events:**

- `task:create` - New task added
- `task:update` - Task edited (title, description, assignee, etc.)
- `task:delete` - Task removed
- `task:move` - Task moved to different status column

**User Experience:**

```
User A creates task → All users see new task appear
User B drags task to "Done" → User A sees task move instantly
```

---

### 3. **Markdown Collaborative Editor** 📝

**Events defined in `server.js`:**

**What it does:**

- **Live document editing** - Multiple users editing the same markdown file
- **Cursor positions** - See where others are typing
- **Content sync** - Changes appear instantly for all users

**Events:**

- `markdown:update` - Document content changes
- `markdown:cursor` - Cursor position sharing

**User Experience:**

```
User A types "# Heading" → User B sees it appear as they type
User B edits paragraph → User A's view updates in real-time
```

---

### 4. **Typing Indicators** ⌨️

**File:** `hooks/use-typing-indicator.ts`

**What it does:**

- **"User is typing..."** indicators
- **Context-aware** - Shows typing status per feature (canvas, markdown, etc.)
- **Auto-timeout** - Stops showing after 3 seconds of inactivity

**Events:**

- `typing:start` - User starts typing
- `typing:stop` - User stops typing or times out

**User Experience:**

```
User A starts typing → "User A is typing..." appears for others
User A stops → Indicator disappears after 3 seconds
```

---

### 5. **Active Users / Presence** 👥

**Built into Socket.io server (`server.js`)**

**What it does:**

- **Who's online** - See which users are currently in the project
- **Join/leave notifications** - Know when teammates enter or leave
- **User count** - Display "3 users active" badge

**Events:**

- `join-project` - User enters project
- `leave-project` - User exits project
- `user:joined` - Broadcast to others when someone joins
- `user:left` - Broadcast to others when someone leaves
- `users:active` - Current list of active users
- `users:count` - Number of active users

**User Experience:**

```
User A opens project → "User A joined" notification to others
Sidebar shows: "3 users active: Alice, Bob, Charlie"
User B closes tab → "User B left" notification
```

---

### 6. **Connection Health Monitoring** 💓

**Built into hooks and server**

**What it does:**

- **Ping/pong heartbeat** - Ensures connection is alive
- **Auto-reconnection** - Reconnects if connection drops
- **Connection status** - Shows "Connected" or "Reconnecting..." in UI

**Events:**

- `ping` - Client sends heartbeat every 30 seconds
- `pong` - Server responds with timestamp

---

## 🏗️ Architecture

```
┌─────────────────┐         WebSocket         ┌──────────────┐
│   Browser A     │◄──────────────────────────►│              │
│  (User Alice)   │                            │              │
└─────────────────┘                            │              │
                                               │  Socket.io   │
┌─────────────────┐         WebSocket         │    Server    │
│   Browser B     │◄──────────────────────────►│              │
│   (User Bob)    │                            │  (server.js) │
└─────────────────┘                            │              │
                                               │              │
┌─────────────────┐         WebSocket         │              │
│   Browser C     │◄──────────────────────────►│              │
│ (User Charlie)  │                            │              │
└─────────────────┘                            └──────────────┘

When Alice draws on canvas:
1. Alice's browser emits: canvas:update → Server
2. Server broadcasts: canvas:update → Bob & Charlie
3. Bob & Charlie's canvas updates instantly
```

---

## 📁 Key Files

### Server-Side

- **`server.js`** - Socket.io server setup, event handlers, room management
- **`lib/socket.ts`** - Socket client connection utilities

### Client-Side Hooks

- **`hooks/use-socket.ts`** - Main socket hook, handles authentication & connection
- **`hooks/use-realtime-kanban.ts`** - Kanban board real-time sync
- **`hooks/use-typing-indicator.ts`** - Typing status broadcasting

### Components Using Sockets

- **`components/canvas/collaborative-canvas.tsx`** - Canvas collaboration
- Any component using `useRealtimeKanban` - Task management
- Any component using `useTypingIndicator` - Typing status

---

## 🔒 Authentication

**How it works:**

1. User signs in with NextAuth → Gets JWT token
2. Client extracts JWT from session cookie
3. JWT sent to Socket.io server in `socket.handshake.auth.token`
4. Server verifies JWT using `jsonwebtoken.verify()`
5. User info attached to socket (userId, userName, userImage)
6. All events now associated with authenticated user

**Security:**

- ✅ Only authenticated users can connect
- ✅ User identity verified on every connection
- ✅ Project rooms isolate data between projects
- ✅ User can only join projects they have access to

---

## 🔄 Data Flow Example: Canvas Drawing

```typescript
// User A draws a circle on canvas

1. LOCAL UPDATE (User A's browser)
   - Tldraw detects shape change
   - Updates local editor state

2. BROADCAST (User A → Server)
   socket.emit('canvas:update', {
       projectId: 'abc123',
       changes: {
           added: { circle123: {...} }
       }
   })

3. SERVER (Receives & forwards)
   - Server receives event from User A
   - Broadcasts to all OTHER users in project room
   - Does NOT send back to User A (prevents echo)

4. REMOTE UPDATE (User B & C's browsers)
   socket.on('canvas:update', (data) => {
       // Mark as remote update (don't re-broadcast)
       editor.store.mergeRemoteChanges(() => {
           editor.store.put([data.added.circle123])
       })
   })

5. DATABASE SAVE (Debounced, 3 seconds)
   - User A's browser waits 3 seconds
   - If no more changes, saves to database via REST API
   - POST /api/projects/abc123/canvas
```

---

## 🎛️ Configuration

### Socket.io Server Config (`server.js`)

```javascript
const io = new Server(httpServer, {
    cors: {
        origin: process.env.NEXTAUTH_URL,
        methods: ["GET", "POST"],
        credentials: true,
    },
    pingTimeout: 60000,    // 60 seconds - disconnect if no pong
    pingInterval: 25000,   // 25 seconds - send ping every 25s
});
```

### Client Config (`lib/socket.ts`)

```typescript
io(url, {
    autoConnect: false,              // Manual connection control
    reconnection: true,              // Auto-reconnect on disconnect
    reconnectionDelay: 1000,         // Wait 1s before first retry
    reconnectionDelayMax: 30000,     // Max 30s between retries
    reconnectionAttempts: Infinity,  // Never give up
})
```

---

## 📊 Performance Considerations

### Optimizations

1. **Debouncing** - Cursor positions sent max every 100ms (not every pixel move)
2. **Throttling** - Typing events debounced to 300ms
3. **Room isolation** - Only users in same project receive updates
4. **Smart broadcasts** - Don't echo back to sender
5. **Lazy persistence** - Save to DB after 3 seconds of inactivity

### Bandwidth Usage

- Canvas cursor: ~10 events/second per active user
- Canvas updates: Only on actual changes
- Task updates: Only on create/edit/delete
- Typing indicators: Every 300ms while typing

---

## 🐛 Troubleshooting

### Issue: Real-time features not working

**Check:**

1. ✅ Socket server running? → Look for "Socket.io server running" in logs
2. ✅ Client connected? → Check browser console for "Socket connected"
3. ✅ Authentication working? → No "Socket authentication error" in logs
4. ✅ In correct room? → Verify `join-project` event emitted

### Issue: Changes not syncing

**Possible causes:**

- User not in same project room
- Socket disconnected (check connection status)
- Authentication failed (check JWT token)
- Browser tab in background (some browsers throttle WebSockets)

### Issue: Multiple cursors flickering

**Cause:** Echo - user's own cursor being broadcast back
**Solution:** Already handled with `isRemoteUpdateRef` flag

---

## 🎯 Summary

**WebSockets are CRITICAL to your app.** They enable:

| Feature | Without WebSockets | With WebSockets |
|---------|-------------------|-----------------|
| Canvas collaboration | Manual refresh required | Live updates (Google Docs style) |
| Task boards | Reload to see changes | Instant sync across users |
| Markdown editing | Conflicts & overwrites | Real-time collaboration |
| User presence | Can't see who's online | Live "3 users active" indicator |
| Typing indicators | N/A | "Alice is typing..." |

**Without working WebSockets, your app becomes single-player instead of multiplayer.**

---

## 🔗 Related Documentation

- **FIXES-SUMMARY.md** - Socket authentication fix
- **docs/SOCKET-GITHUB-FIXES.md** - Technical implementation details
- **docs/SOCKET-IO-IMPLEMENTATION.md** - Original setup guide

---

**Your app is designed for real-time collaboration - WebSockets make that magic happen!** ✨
