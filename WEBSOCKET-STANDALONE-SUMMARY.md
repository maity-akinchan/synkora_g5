# 🚀 Standalone WebSocket Server - Quick Reference

## ✅ What's Been Created

I've extracted the WebSocket logic from your Next.js server into a **standalone, independent server** that you can run
separately.

### New Files

1. **`websocket-server.js`** - Standalone WebSocket server (375 lines)
2. **`docs/STANDALONE-WEBSOCKET-SERVER.md`** - Complete documentation
3. **Updated `.env.example`** - Configuration examples
4. **Updated `server.js`** - Now optional WebSocket integration
5. **Updated `lib/socket.ts`** - Client connects to configurable URL
6. **Updated `package.json`** - New npm scripts

---

## 🎯 Quick Start

### Option 1: Integrated (Current Setup - No Changes Needed)

Just keep running as you are:

```bash
npm run dev
```

WebSocket runs inside Next.js on port 3000. **This is the default.**

---

### Option 2: Standalone (Recommended for Production)

#### Step 1: Update `.env.local`

```env
# Point client to standalone WebSocket server
NEXT_PUBLIC_WEBSOCKET_URL="http://localhost:3001"

# Disable integrated WebSocket in Next.js
ENABLE_INTEGRATED_WEBSOCKET="false"

# Standalone server config
WS_PORT=3001
ALLOWED_ORIGINS="http://localhost:3000"
```

#### Step 2: Run Both Servers

**Option A: Two terminals**

```bash
# Terminal 1: Next.js
npm run dev

# Terminal 2: WebSocket
npm run ws:dev
```

**Option B: One command (runs both)**

```bash
npm run dev:split
```

You'll see:

```
============================================================
🚀 Synkora WebSocket Server
============================================================
✓ Server running on port: 3001
✓ Health check: http://localhost:3001/health
============================================================

> Ready on http://localhost:3000
⚠️  Integrated WebSocket server disabled
```

---

## 📊 Architecture

### Before (Integrated)

```
┌─────────────────────────────┐
│   Next.js Server (:3000)    │
│  ┌─────────┐  ┌──────────┐ │
│  │   API   │  │ WebSocket│ │  ← Everything in one process
│  └─────────┘  └──────────┘ │
└─────────────────────────────┘
```

### After (Standalone)

```
┌──────────────────┐     ┌──────────────────┐
│  Next.js (:3000) │     │  WebSocket(:3001)│  ← Separate processes
│  ┌───────────┐   │     │  ┌────────────┐  │
│  │    API    │   │     │  │  Socket.io │  │
│  └───────────┘   │     │  └────────────┘  │
└──────────────────┘     └──────────────────┘
```

---

## 🎁 Benefits

| Benefit | Explanation |
|---------|-------------|
| **Scalability** | Scale WebSocket server independently with load balancers |
| **Performance** | Next.js focuses on HTTP, WebSocket on persistent connections |
| **Development** | Restart Next.js without disconnecting WebSocket clients |
| **Deployment** | Deploy on different infrastructure (e.g., specialized WebSocket hosting) |
| **Monitoring** | Separate logs and metrics for easier debugging |

---

## 🧪 Testing

### Health Check

```bash
curl http://localhost:3001/health
```

Should return:

```json
{
  "status": "healthy",
  "service": "Synkora WebSocket Server",
  "uptime": 42.5,
  "connections": 3,
  "rooms": 2
}
```

### Browser Console

Open your app and check console:

```
[Socket] Connecting to WebSocket server: http://localhost:3001
✓ Socket connected: xyz123
✓ Connection confirmed
```

---

## 📝 NPM Scripts Added

```bash
npm run ws          # Run WebSocket server (production)
npm run ws:dev      # Run WebSocket server (development, port 3001)
npm run dev:split   # Run both Next.js AND WebSocket together
```

---

## 🔄 Switching Back and Forth

### Want to use integrated again?

**`.env.local`:**

```env
ENABLE_INTEGRATED_WEBSOCKET="true"
# Remove or comment out NEXT_PUBLIC_WEBSOCKET_URL
```

Run:

```bash
npm run dev  # Just Next.js, with integrated WebSocket
```

### Want to use standalone?

**`.env.local`:**

```env
ENABLE_INTEGRATED_WEBSOCKET="false"
NEXT_PUBLIC_WEBSOCKET_URL="http://localhost:3001"
```

Run:

```bash
npm run dev:split  # Both servers
```

---

## 🚢 Production Deployment

### Same Server (Simple)

```bash
# Start Next.js (port 3000)
PORT=3000 ENABLE_INTEGRATED_WEBSOCKET=false npm start

# Start WebSocket (port 3001)
WS_PORT=3001 node websocket-server.js
```

### Separate Servers (Recommended)

**Server A (Next.js):**

```bash
ENABLE_INTEGRATED_WEBSOCKET=false npm start
```

**Server B (WebSocket):**

```bash
node websocket-server.js
```

Update Next.js env:

```env
NEXT_PUBLIC_WEBSOCKET_URL="https://ws.yourdomain.com"
```

### With PM2 (Process Manager)

```bash
pm2 start ecosystem.config.js
```

See `docs/STANDALONE-WEBSOCKET-SERVER.md` for PM2 config example.

---

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXTAUTH_SECRET` | **Yes** | - | Same secret as Next.js |
| `WS_PORT` | No | 3001 | WebSocket server port |
| `ALLOWED_ORIGINS` | No | `http://localhost:3000` | CORS origins |
| `NEXT_PUBLIC_WEBSOCKET_URL` | No | Same origin | Client connection URL |
| `ENABLE_INTEGRATED_WEBSOCKET` | No | `true` | Enable/disable integrated |

---

## 🐛 Troubleshooting

### WebSocket not connecting

1. **Check server is running:**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Check client URL:**
   Browser console should show:
   ```
   [Socket] Connecting to WebSocket server: http://localhost:3001
   ```

3. **Check environment variables:**
   ```env
   NEXT_PUBLIC_WEBSOCKET_URL="http://localhost:3001"
   ENABLE_INTEGRATED_WEBSOCKET="false"
   ```

### Authentication errors

- Verify `NEXTAUTH_SECRET` is **identical** in both:
    - Next.js `.env.local`
    - WebSocket server environment

### CORS errors

Update `ALLOWED_ORIGINS`:

```env
ALLOWED_ORIGINS="http://localhost:3000,https://yourdomain.com"
```

---

## 📚 Documentation

- **`docs/STANDALONE-WEBSOCKET-SERVER.md`** - Complete guide (deployment, scaling, security)
- **`docs/WEBSOCKETS-USAGE.md`** - What WebSockets do in your app
- **`docs/SOCKET-GITHUB-FIXES.md`** - Authentication fixes we applied

---

## 🎯 Summary

**You now have 2 deployment options:**

### Option A: Integrated (Default)

- ✅ Simple setup
- ✅ One process to manage
- ✅ Good for small-scale apps
- ❌ Scaling limited to vertical
- ❌ No separation of concerns

### Option B: Standalone (Recommended)

- ✅ Independent scaling
- ✅ Better performance
- ✅ Flexible deployment
- ✅ Easier debugging
- ❌ Two processes to manage
- ❌ Slightly more complex setup

---

## 🚀 Try It Now!

```bash
# Test the standalone server
npm run dev:split
```

Then open your app and draw on the canvas - it should work exactly the same! 🎨

---

**Questions?** Read the full docs in `docs/STANDALONE-WEBSOCKET-SERVER.md`
