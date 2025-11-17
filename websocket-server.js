/**
 * Standalone WebSocket Server for Synkora
 *
 * This server handles all real-time collaboration features:
 * - Canvas collaboration
 * - Kanban board updates
 * - Markdown editing
 * - Typing indicators
 * - User presence
 *
 * Run: node websocket-server.js
 * Port: 3001 (configurable via WS_PORT env variable)
 */

const {createServer} = require("http");
const {Server} = require("socket.io");
const {verify} = require("jsonwebtoken");

// Configuration
const WS_PORT = parseInt(process.env.WS_PORT || "3001", 10);
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : ["http://localhost:3000", "http://localhost:3001"];

// Validate required environment variables
if (!NEXTAUTH_SECRET) {
    console.error("❌ NEXTAUTH_SECRET environment variable is required!");
    process.exit(1);
}

// Create HTTP server
const httpServer = createServer((req, res) => {
    // Health check endpoint
    if (req.url === "/health" || req.url === "/") {
        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify({
            status: "healthy",
            service: "Synkora WebSocket Server",
            uptime: process.uptime(),
            connections: io.engine.clientsCount,
            rooms: projectRooms.size,
        }));
    } else {
        res.writeHead(404);
        res.end("Not Found");
    }
});

// Create Socket.io server
const io = new Server(httpServer, {
    cors: {
        origin: ALLOWED_ORIGINS,
        methods: ["GET", "POST"],
        credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],
});

// Store active users per project
// Map<projectId, Map<socketId, { userId, userName, userImage, joinedAt }>>
const projectRooms = new Map();

// Middleware for authentication
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error("Authentication required"));
        }

        // Verify the JWT token
        const decoded = verify(token, NEXTAUTH_SECRET);

        if (!decoded || !decoded.id) {
            return next(new Error("Invalid token"));
        }

        // Attach user info to socket
        socket.userId = decoded.id;
        socket.userName = decoded.name || "Anonymous";
        socket.userEmail = decoded.email;
        socket.userImage = decoded.picture || decoded.image;

        next();
    } catch (error) {
        console.error("Socket authentication error:", error.message);
        next(new Error("Authentication failed"));
    }
});

// Connection handler
io.on("connection", (socket) => {
    console.log(`✓ Client connected: ${socket.id} (User: ${socket.userName})`);

    // Send connection confirmation
    socket.emit("connected", {
        socketId: socket.id,
        userId: socket.userId,
        timestamp: new Date().toISOString(),
    });

    // ============================================================
    // PROJECT ROOM MANAGEMENT
    // ============================================================

    socket.on("join-project", (projectId) => {
        if (!projectId) {
            socket.emit("error", {message: "Project ID is required"});
            return;
        }

        socket.join(projectId);

        // Track user in room
        if (!projectRooms.has(projectId)) {
            projectRooms.set(projectId, new Map());
        }

        projectRooms.get(projectId).set(socket.id, {
            userId: socket.userId,
            userName: socket.userName,
            userImage: socket.userImage,
            joinedAt: new Date().toISOString(),
        });

        console.log(`✓ ${socket.userName} joined project ${projectId}`);

        // Get all active users in the room
        const activeUsers = Array.from(projectRooms.get(projectId).values());

        // Notify others that a new user joined
        socket.to(projectId).emit("user:joined", {
            socketId: socket.id,
            userId: socket.userId,
            userName: socket.userName,
            userImage: socket.userImage,
            timestamp: new Date().toISOString(),
        });

        // Send current active users list to the joining user
        socket.emit("users:active", {
            users: activeUsers,
            count: activeUsers.length,
        });

        // Broadcast updated count to all users
        io.to(projectId).emit("users:count", {count: activeUsers.length});
    });

    socket.on("leave-project", (projectId) => {
        if (!projectId) return;

        socket.leave(projectId);

        if (projectRooms.has(projectId)) {
            const roomUsers = projectRooms.get(projectId);
            roomUsers.delete(socket.id);

            // Notify others
            socket.to(projectId).emit("user:left", {
                socketId: socket.id,
                userId: socket.userId,
                userName: socket.userName,
                timestamp: new Date().toISOString(),
            });

            // Update active users
            const activeUsers = Array.from(roomUsers.values());
            io.to(projectId).emit("users:active", {
                users: activeUsers,
                count: activeUsers.length,
            });
            io.to(projectId).emit("users:count", {count: activeUsers.length});

            // Clean up empty rooms
            if (roomUsers.size === 0) {
                projectRooms.delete(projectId);
                console.log(`✓ Cleaned up empty project room: ${projectId}`);
            }
        }

        console.log(`✓ ${socket.userName} left project ${projectId}`);
    });

    // ============================================================
    // TASK / KANBAN EVENTS
    // ============================================================

    socket.on("task:create", (data) => {
        if (!data.projectId) return;
        socket.to(data.projectId).emit("task:create", data.task);
        console.log(`→ Task created in ${data.projectId} by ${socket.userName}`);
    });

    socket.on("task:update", (data) => {
        if (!data.projectId) return;
        socket.to(data.projectId).emit("task:update", data.task);
        console.log(`→ Task updated in ${data.projectId} by ${socket.userName}`);
    });

    socket.on("task:delete", (data) => {
        if (!data.projectId) return;
        socket.to(data.projectId).emit("task:delete", {taskId: data.taskId});
        console.log(`→ Task deleted in ${data.projectId} by ${socket.userName}`);
    });

    socket.on("task:move", (data) => {
        if (!data.projectId) return;
        socket.to(data.projectId).emit("task:move", {
            taskId: data.taskId,
            status: data.status,
        });
        console.log(`→ Task moved in ${data.projectId} by ${socket.userName}`);
    });

    // ============================================================
    // CANVAS EVENTS
    // ============================================================

    socket.on("canvas:update", (data) => {
        if (!data.projectId) return;
        socket.to(data.projectId).emit("canvas:update", data.changes);
        // Verbose logging disabled for performance (too many events)
        // console.log(`→ Canvas update in ${data.projectId}`);
    });

    socket.on("canvas:cursor", (data) => {
        if (!data.projectId) return;
        socket.to(data.projectId).emit("canvas:cursor", {
            socketId: socket.id,
            position: data.position,
        });
    });

    // ============================================================
    // MARKDOWN EVENTS
    // ============================================================

    socket.on("markdown:update", (data) => {
        if (!data.projectId) return;
        socket.to(data.projectId).emit("markdown:update", {
            fileId: data.fileId,
            content: data.content,
        });
        console.log(`→ Markdown updated in ${data.projectId} by ${socket.userName}`);
    });

    socket.on("markdown:cursor", (data) => {
        if (!data.projectId) return;
        socket.to(data.projectId).emit("markdown:cursor", {
            socketId: socket.id,
            fileId: data.fileId,
            position: data.position,
        });
    });

    // ============================================================
    // TYPING INDICATORS
    // ============================================================

    socket.on("typing:start", (data) => {
        if (!data.projectId) return;
        socket.to(data.projectId).emit("typing:start", {
            socketId: socket.id,
            userId: socket.userId,
            userName: socket.userName,
            context: data.context,
            timestamp: data.timestamp,
        });
    });

    socket.on("typing:stop", (data) => {
        if (!data.projectId) return;
        socket.to(data.projectId).emit("typing:stop", {
            socketId: socket.id,
            userId: socket.userId,
            context: data.context,
        });
    });

    // ============================================================
    // CONNECTION HEALTH
    // ============================================================

    socket.on("ping", () => {
        socket.emit("pong", {timestamp: new Date().toISOString()});
    });

    // ============================================================
    // DISCONNECTION HANDLER
    // ============================================================

    socket.on("disconnect", (reason) => {
        console.log(`✗ Client disconnected: ${socket.id} (${socket.userName}) - ${reason}`);

        // Remove from all project rooms
        projectRooms.forEach((roomUsers, projectId) => {
            if (roomUsers.has(socket.id)) {
                roomUsers.delete(socket.id);

                // Notify others
                io.to(projectId).emit("user:left", {
                    socketId: socket.id,
                    userId: socket.userId,
                    userName: socket.userName,
                    timestamp: new Date().toISOString(),
                });

                // Update active users
                const activeUsers = Array.from(roomUsers.values());
                io.to(projectId).emit("users:active", {
                    users: activeUsers,
                    count: activeUsers.length,
                });
                io.to(projectId).emit("users:count", {count: activeUsers.length});

                // Clean up empty rooms
                if (roomUsers.size === 0) {
                    projectRooms.delete(projectId);
                }
            }
        });
    });

    socket.on("error", (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
    });
});

// Start server
httpServer.listen(WS_PORT, () => {
    console.log("\n" + "=".repeat(60));
    console.log("🚀 Synkora WebSocket Server");
    console.log("=".repeat(60));
    console.log(`✓ Server running on port: ${WS_PORT}`);
    console.log(`✓ Health check: http://localhost:${WS_PORT}/health`);
    console.log(`✓ Allowed origins: ${ALLOWED_ORIGINS.join(", ")}`);
    console.log(`✓ Ready for connections!`);
    console.log("=".repeat(60) + "\n");
});

// Graceful shutdown
process.on("SIGINT", () => {
    console.log("\n⚠️  Shutting down gracefully...");

    // Notify all connected clients
    io.emit("server:shutdown", {
        message: "Server is shutting down. You will be reconnected automatically.",
    });

    // Close all connections
    io.close(() => {
        console.log("✓ All connections closed");
        httpServer.close(() => {
            console.log("✓ Server shut down");
            process.exit(0);
        });
    });

    // Force exit after 5 seconds
    setTimeout(() => {
        console.error("⚠️  Forced shutdown after timeout");
        process.exit(1);
    }, 5000);
});

process.on("SIGTERM", () => {
    console.log("\n⚠️  SIGTERM received, shutting down...");
    process.emit("SIGINT");
});
