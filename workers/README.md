Cloudflare Workers websocket server
=================================

This folder contains a Cloudflare Worker and a Durable Object implementation
to host a simplified WebSocket server for Synkora.

Files
- `index.js` — Worker entry that forwards websocket upgrades to a Durable Object
  instance keyed by project id. The Durable Object (`ProjectRoom`) manages
  connected clients for that project and broadcasts messages.

Deployment
1. Install Wrangler 3+ and login: `npm install -g wrangler` then `wrangler login`.
2. Set your Cloudflare `account_id` in `wrangler.toml`.
3. Create Durable Object binding and publish secrets:

```bash
# set secrets
wrangler secret put NEXTAUTH_SECRET
wrangler secret put ALLOWED_ORIGINS

# publish (workers_dev) for testing
wrangler publish --name synkora-ws
```

Important notes
- This implementation is not a drop-in replacement for the Node `websocket-server.js`.
  It uses a much simpler JSON-based protocol. If you rely on socket.io features
  (ack callbacks, namespaces, long-polling), those will not work.
- For full parity, consider deploying the existing `websocket-server.js` to a
  platform that supports Node sockets (e.g., DigitalOcean App Platform, Fly,
  Render, or a VM) or switch the client to the simplified protocol used by
  this Worker.
