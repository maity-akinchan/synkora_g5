/*
  Cloudflare Worker entry for Synkora WebSocket server.

  This worker forwards incoming WebSocket upgrade requests to a Durable Object
  instance per project (bound to the name of the project id). The Durable
  Object maintains active WebSocket connections for that project and broadcasts
  messages between connected clients.

  Limitations & notes:
  - This implementation is a simplified replacement for the Node/socket.io
    server and uses a small JSON protocol. It doesn't implement the full
    socket.io protocol (long-polling, namespaces, ack callbacks, etc.).
  - Durable Objects are used to keep state per project; make sure your
    account has Durable Objects enabled.
  - Set `NEXTAUTH_SECRET` and `ALLOWED_ORIGINS` as secrets or environment
    variables with `wrangler secret put NEXTAUTH_SECRET` and so on.
*/

export default {
  async fetch(request, env) {
    // Expect websocket upgrade
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected websocket", { status: 400 });
    }

    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");

    if (!projectId) {
      return new Response("Missing projectId query param", { status: 400 });
    }

    // Map projectId -> Durable Object id
    const id = env.PROJECT_ROOMS.idFromName(projectId);
    const obj = env.PROJECT_ROOMS.get(id);

    // Create a pair of WebSockets and forward one side to the Durable Object
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Forward the server side of the connection to the Durable Object
    // The Durable Object's fetch handler will accept the socket.
    await obj.fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: server,
    });

    // Return the client side to the user (perform the upgrade)
    return new Response(null, { status: 101, webSocket: client });
  },
};

// Durable Object implementation lives in the same file for convenience.
export class ProjectRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    // Map of clientId -> WebSocket
    this.clients = new Map();
  }

  async fetch(request) {
    // The incoming request's body is the WebSocket endpoint from the caller
    const ws = request.body;
    if (!(ws instanceof WebSocket)) {
      return new Response("Expected WebSocket in request body", { status: 400 });
    }

    ws.accept();

    const clientId = crypto.randomUUID();
    this.clients.set(clientId, ws);

    // Notify existing clients about the new connection
    this.broadcast({ type: "user:joined", clientId, timestamp: new Date().toISOString() });

    ws.addEventListener("message", (evt) => {
      try {
        const msg = typeof evt.data === "string" ? JSON.parse(evt.data) : null;
        if (!msg || !msg.type) return;

        // Simple protocol: messages contain { type, projectId, event, payload }
        switch (msg.type) {
          case "broadcast":
            // Broadcast payload to everyone in the room
            this.broadcast({ type: "broadcast", from: clientId, payload: msg.payload });
            break;
          case "signaling":
            // Peer-to-peer signaling (optional): contains target client id
            if (msg.target && this.clients.has(msg.target)) {
              this.sendTo(msg.target, { type: "signaling", from: clientId, payload: msg.payload });
            }
            break;
          default:
            // Unknown message type: ignore
            break;
        }
      } catch (err) {
        // ignore malformed messages
        console.error("Malformed message in Durable Object:", err);
      }
    });

    ws.addEventListener("close", () => {
      this.clients.delete(clientId);
      this.broadcast({ type: "user:left", clientId, timestamp: new Date().toISOString() });
    });

    ws.addEventListener("error", (err) => {
      console.error("WebSocket error in ProjectRoom:", err);
    });

    return new Response(null);
  }

  broadcast(message) {
    const text = JSON.stringify(message);
    for (const [id, ws] of this.clients.entries()) {
      try {
        ws.send(text);
      } catch (err) {
        console.warn("Failed to send to client", id, err);
      }
    }
  }

  sendTo(clientId, message) {
    const ws = this.clients.get(clientId);
    if (!ws) return;
    try {
      ws.send(JSON.stringify(message));
    } catch (err) {
      console.warn("Failed to send to client", clientId, err);
    }
  }
}
