# 🔌 Standalone WebSocket Server

## Overview

The standalone WebSocket server (`websocket-server.js`) is a separate Node.js process that handles all real-time
collaboration features for Synkora. This architectural pattern provides several benefits over the integrated approach.

---

## 🎯 Why Use a Standalone WebSocket Server?

### Benefits

1. **Scalability** 📈
    - Scale WebSocket connections independently from your Next.js app
    - Run multiple WebSocket server instances behind a load balancer
    - Better resource allocation (WebSockets are memory-intensive)

2. **Performance** ⚡
    - Next.js server focuses on HTTP requests only
    - WebSocket server optimized for persistent connections
    - No interference between REST API and WebSocket traffic

3. **Deployment Flexibility** 🚀
    - Deploy WebSocket server on different infrastructure
    - Use specialized WebSocket hosting (e.g., AWS App Runner, Fly.io)
    - Easier to add Redis adapter for multi-server setups

4. **Development** 🛠️
    - Restart Next.js without disconnecting WebSocket clients
    - Separate logs for easier debugging
    - Independent monitoring and metrics

5. **Security** 🔒
    - Isolate WebSocket traffic
    - Different firewall rules and rate limiting
    - Dedicated security policies

---

## 🏗️ Architecture Comparison

### Integrated (Default)

```
┌─────────────────────────────┐
│   Next.js Server (:3000)    │
│  ┌─────────┐  ┌──────────┐ │
│  │   HTTP  │  │ WebSocket│ │
│  │   API   │  │  Server  │ │
│  └─────────┘  └──────────┘ │
└─────────────────────────────┘
```

### Standalone (Scalable)

```
┌──────────────────┐     ┌──────────────────┐
│  Next.js Server  │     │  WebSocket Server│
│     (:3000)      │     │      (:3001)     │
│  ┌───────────┐   │     │  ┌────────────┐  │
│  │ HTTP API  │   │     │  │  Socket.io │  │
│  └───────────┘   │     │  └────────────┘  │
└──────────────────┘     └──────────────────┘
         ▲                        ▲
         │                        │
    HTTP Requests          WebSocket Connections
         │                        │
         └────────┬───────────────┘
                  │
           ┌──────▼──────┐
           │   Browser   │
           └─────────────┘
```

---

## 🚀 Quick Start

### 1. Create Environment File

Copy the example and configure:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Required for JWT verification
NEXTAUTH_SECRET="your-nextauth-secret-here"

# WebSocket server port
WS_PORT=3001

# Allowed origins (comma-separated)
ALLOWED_ORIGINS="http://localhost:3000,https://your-domain.com"
```

### 2. Start the Standalone WebSocket Server

```bash
node websocket-server.js
```

You should see:

```
============================================================
🚀 Synkora WebSocket Server
============================================================
✓ Server running on port: 3001
✓ Health check: http://localhost:3001/health
✓ Allowed origins: http://localhost:3000
✓ Ready for connections!
============================================================
```

### 3. Configure Next.js to Use Standalone Server

Update `.env.local`:

```env
# Point client to standalone WebSocket server
NEXT_PUBLIC_WEBSOCKET_URL="http://localhost:3001"

# Disable integrated WebSocket in Next.js
ENABLE_INTEGRATED_WEBSOCKET="false"
```

### 4. Start Next.js

```bash
npm run dev
```

Next.js will start on `:3000` **without** the integrated WebSocket server.

---

## 🧪 Testing

### Health Check

```bash
curl http://localhost:3001/health
```

Response:

```json
{
  "status": "healthy",
  "service": "Synkora WebSocket Server",
  "uptime": 42.5,
  "connections": 3,
  "rooms": 2
}
```

### WebSocket Connection

Open browser console on `http://localhost:3000` and check for:

```
[Socket] Connecting to WebSocket server: http://localhost:3001
Socket connected: xyz123
Connection confirmed: { socketId: "xyz123", userId: "...", ... }
```

---

## 📊 Monitoring

### Logs

The standalone server provides structured logs:

```
✓ Client connected: abc123 (User: Alice)
✓ Alice joined project proj_456
→ Task created in proj_456 by Alice
✗ Client disconnected: abc123 (Alice) - transport close
```

### Metrics Available via `/health`

- **status** - "healthy" or error state
- **uptime** - Server uptime in seconds
- **connections** - Current WebSocket connections
- **rooms** - Number of active project rooms

---

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WS_PORT` | No | `3001` | Port for WebSocket server |
| `NEXTAUTH_SECRET` | **Yes** | - | JWT verification secret |
| `ALLOWED_ORIGINS` | No | `http://localhost:3000` | CORS allowed origins (comma-separated) |

### Example Configurations

#### Development

```env
WS_PORT=3001
NEXTAUTH_SECRET="dev-secret-123"
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"
```

#### Production

```env
WS_PORT=3001
NEXTAUTH_SECRET="<strong-secret-from-production>"
ALLOWED_ORIGINS="https://synkora.com,https://app.synkora.com"
```

---

## 🚢 Deployment

### Option 1: Same Server (Simple)

Run both on the same server with different ports:

```bash
# Terminal 1: Next.js
PORT=3000 npm start

# Terminal 2: WebSocket
WS_PORT=3001 node websocket-server.js
```

### Option 2: Separate Servers (Recommended)

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
NEXT_PUBLIC_WEBSOCKET_URL="https://ws.synkora.com"
```

### Option 3: Process Manager (PM2)

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "synkora-web",
      script: "npm",
      args: "start",
      env: {
        PORT: 3000,
        ENABLE_INTEGRATED_WEBSOCKET: "false",
        NEXT_PUBLIC_WEBSOCKET_URL: "http://localhost:3001"
      }
    },
    {
      name: "synkora-websocket",
      script: "websocket-server.js",
      env: {
        WS_PORT: 3001
      }
    }
  ]
};
```

Start both:

```bash
pm2 start ecosystem.config.js
```

### Option 4: Docker

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - ENABLE_INTEGRATED_WEBSOCKET=false
      - NEXT_PUBLIC_WEBSOCKET_URL=http://websocket:3001
    depends_on:
      - websocket

  websocket:
    build: .
    command: node websocket-server.js
    ports:
      - "3001:3001"
    environment:
      - WS_PORT=3001
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
```

---

## 🔄 Switching Between Integrated and Standalone

### Use Integrated (Default)

```env
# .env.local
ENABLE_INTEGRATED_WEBSOCKET="true"
# NEXT_PUBLIC_WEBSOCKET_URL not set (uses same origin)
```

Start only Next.js:

```bash
npm run dev
```

### Use Standalone

```env
# .env.local
ENABLE_INTEGRATED_WEBSOCKET="false"
NEXT_PUBLIC_WEBSOCKET_URL="http://localhost:3001"
```

Start both:

```bash
# Terminal 1
npm run dev

# Terminal 2
node websocket-server.js
```

---

## 🌐 Load Balancing (Advanced)

For high-traffic scenarios, run multiple WebSocket server instances:

### Prerequisites

- Redis server for Socket.io adapter
- Load balancer (e.g., Nginx, HAProxy)

### 1. Install Redis Adapter

```bash
npm install @socket.io/redis-adapter redis
```

### 2. Update `websocket-server.js`

```javascript
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
  httpServer.listen(WS_PORT);
});
```

### 3. Run Multiple Instances

```bash
WS_PORT=3001 node websocket-server.js
WS_PORT=3002 node websocket-server.js
WS_PORT=3003 node websocket-server.js
```

### 4. Configure Load Balancer

**Nginx example:**

```nginx
upstream websocket_backend {
    ip_hash; # Sticky sessions
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
}

server {
    listen 80;
    server_name ws.synkora.com;

    location / {
        proxy_pass http://websocket_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

---

## 🐛 Troubleshooting

### Issue: "Authentication required" error

**Cause:** JWT token not being sent or invalid

**Solution:**

1. Check `NEXTAUTH_SECRET` matches between Next.js and WebSocket server
2. Verify client is passing token: Check `socket.handshake.auth.token`
3. Check browser console for "Socket authentication error"

### Issue: CORS errors

**Cause:** Origin not in `ALLOWED_ORIGINS`

**Solution:**

```env
ALLOWED_ORIGINS="http://localhost:3000,https://your-domain.com"
```

### Issue: Connections not working

**Check:**

1. WebSocket server is running: `curl http://localhost:3001/health`
2. Client pointing to correct URL: Check browser console
3. Firewall allowing connections on port 3001
4. No proxy blocking WebSocket upgrade

### Issue: High memory usage

**Cause:** Too many connections on single instance

**Solution:**

1. Scale horizontally with Redis adapter (see Load Balancing)
2. Increase Node.js memory: `node --max-old-space-size=4096 websocket-server.js`
3. Monitor with: `curl http://localhost:3001/health`

---

## 📈 Performance Tips

1. **Enable Compression**
   ```javascript
   io.use(compression());
   ```

2. **Adjust Ping Interval**
   ```javascript
   pingTimeout: 60000,   // Increase for slower networks
   pingInterval: 25000,  // Decrease for faster detection
   ```

3. **Use WebSocket Only**
   ```javascript
   transports: ["websocket"], // Disable polling
   ```

4. **Limit Payload Size**
   ```javascript
   maxHttpBufferSize: 1e6, // 1MB
   ```

---

## 🔒 Security Checklist

- [ ] Use HTTPS/WSS in production
- [ ] Validate `NEXTAUTH_SECRET` is strong and secret
- [ ] Set `ALLOWED_ORIGINS` to specific domains (not `*`)
- [ ] Implement rate limiting (e.g., Redis-based)
- [ ] Monitor for abnormal connection patterns
- [ ] Use firewall to restrict access to WebSocket port
- [ ] Keep Socket.io and dependencies updated

---

## 📚 Related Documentation

- **docs/WEBSOCKETS-USAGE.md** - What WebSockets are used for
- **docs/SOCKET-GITHUB-FIXES.md** - Authentication fixes
- **server.js** - Integrated WebSocket server (for comparison)

---

## 🎉 Summary

**You now have:**

- ✅ Standalone WebSocket server (`websocket-server.js`)
- ✅ Configurable integration (integrated vs standalone)
- ✅ Health check endpoint
- ✅ Graceful shutdown handling
- ✅ Production-ready architecture
- ✅ Scalability options with Redis

**Start exploring:**

```bash
node websocket-server.js
```

---

**Questions?** Check the troubleshooting section or create an issue!
