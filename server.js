const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const {verify} = require("jsonwebtoken");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Check if integrated WebSocket should be enabled
const ENABLE_INTEGRATED_WEBSOCKET = process.env.ENABLE_INTEGRATED_WEBSOCKET !== "false";

app.prepare().then(() => {
    const httpServer = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error("Error occurred handling", req.url, err);
            res.statusCode = 500;
            res.end("internal server error");
        }
    });

    // Conditionally setup WebSocket server
    let io = null;
    let projectRooms = null;

    if (ENABLE_INTEGRATED_WEBSOCKET) {
        console.log("✓ Integrated WebSocket server enabled");

        const {Server} = require("socket.io");

        io = new Server(httpServer, {
            cors: {
                origin: process.env.NEXTAUTH_URL || `http://${hostname}:${port}`,
                methods: ["GET", "POST"],
                credentials: true,
            },
            pingTimeout: 60000,
            pingInterval: 25000,
        });

        // Store active users per project with user information
        // Map<projectId, Map<socketId, { userId, userName, userImage }>>
        projectRooms = new Map();

        // Middleware for authentication
        io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;

                if (!token) {
                    return next(new Error("Authentication required"));
                }

                // Verify the JWT token directly using the NEXTAUTH_SECRET
                const decoded = verify(token, process.env.NEXTAUTH_SECRET);

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
                console.error("Socket authentication error:", error);
                next(new Error("Authentication failed"));
            }
        });

        io.on("connection", (socket) => {
            console.log(`Client connected: ${socket.id} (User: ${socket.userName})`);

            // Send connection confirmation
            socket.emit("connected", {
                socketId: socket.id,
                userId: socket.userId,
                timestamp: new Date().toISOString(),
            });

            // Join project room
            socket.on("join-project", (projectId) => {
                if (!projectId) {
                    socket.emit("error", {message: "Project ID is required"});
                    return;
                }

                socket.join(projectId);

                // Track user in room with user information
                if (!projectRooms.has(projectId)) {
                    projectRooms.set(projectId, new Map());
                }

                projectRooms.get(projectId).set(socket.id, {
                    userId: socket.userId,
                    userName: socket.userName,
                    userImage: socket.userImage,
                    joinedAt: new Date().toISOString(),
                });

                console.log(`Socket ${socket.id} (${socket.userName}) joined project ${projectId}`);

                // Get all active users in the room
                const activeUsers = Array.from(projectRooms.get(projectId).values());

                // Notify others in the room that a new user joined
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
                    count: activeUsers.length
                });

                // Broadcast updated count to all users in the room
                io.to(projectId).emit("users:count", { count: activeUsers.length });
            });

            // Leave project room
            socket.on("leave-project", (projectId) => {
                if (!projectId) {
                    return;
                }

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

                    // Update active users count
                    const activeUsers = Array.from(roomUsers.values());
                    io.to(projectId).emit("users:active", {
                        users: activeUsers,
                        count: activeUsers.length
                    });
                    io.to(projectId).emit("users:count", {count: activeUsers.length});

                    // Clean up empty rooms
                    if (roomUsers.size === 0) {
                        projectRooms.delete(projectId);
                    }
                }

                console.log(`Socket ${socket.id} (${socket.userName}) left project ${projectId}`);
            });

            // Task events
            socket.on("task:create", (data) => {
                socket.to(data.projectId).emit("task:create", data.task);
            });

            socket.on("task:update", (data) => {
                socket.to(data.projectId).emit("task:update", data.task);
            });

            socket.on("task:delete", (data) => {
                socket.to(data.projectId).emit("task:delete", {taskId: data.taskId});
            });

            socket.on("task:move", (data) => {
                socket.to(data.projectId).emit("task:move", {
                    taskId: data.taskId,
                    status: data.status,
                });
            });

            // Canvas events
            socket.on("canvas:update", (data) => {
                socket.to(data.projectId).emit("canvas:update", data.changes);
            });

            socket.on("canvas:cursor", (data) => {
                socket.to(data.projectId).emit("canvas:cursor", {
                    socketId: socket.id,
                    position: data.position,
                });
            });

            // Markdown events
            socket.on("markdown:update", (data) => {
                socket.to(data.projectId).emit("markdown:update", {
                    fileId: data.fileId,
                    content: data.content,
                });
            });

            socket.on("markdown:cursor", (data) => {
                socket.to(data.projectId).emit("markdown:cursor", {
                    socketId: socket.id,
                    fileId: data.fileId,
                    position: data.position,
                });
            });

            // Typing indicator events
            socket.on("typing:start", (data) => {
                socket.to(data.projectId).emit("typing:start", {
                    socketId: socket.id,
                    userId: socket.userId,
                    userName: socket.userName,
                    context: data.context,
                    timestamp: data.timestamp,
                });
            });

            socket.on("typing:stop", (data) => {
                socket.to(data.projectId).emit("typing:stop", {
                    socketId: socket.id,
                    userId: socket.userId,
                    context: data.context,
                });
            });

            // Heartbeat/ping-pong for connection health
            socket.on("ping", () => {
                socket.emit("pong", {timestamp: new Date().toISOString()});
            });

            // Handle disconnection
            socket.on("disconnect", (reason) => {
                console.log(`Client disconnected: ${socket.id} (${socket.userName}) - Reason: ${reason}`);

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
                            count: activeUsers.length
                        });
                        io.to(projectId).emit("users:count", {count: activeUsers.length});

                        // Clean up empty rooms
                        if (roomUsers.size === 0) {
                            projectRooms.delete(projectId);
                        }
                    }
                });
            });

            // Handle errors
            socket.on("error", (error) => {
                console.error(`Socket error for ${socket.id}:`, error);
            });
        });
    } else {
        console.log("⚠️  Integrated WebSocket server disabled");
        console.log("   Set NEXT_PUBLIC_WEBSOCKET_URL to point to standalone WebSocket server");
    }

    httpServer
        .once("error", (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
            if (ENABLE_INTEGRATED_WEBSOCKET) {
                console.log(`> Socket.io server running`);
            }

            // Start GitHub sync in production
            if (!dev) {
                try {
                    const { startPeriodicSync } = require("./lib/github-sync");
                    startPeriodicSync();
                    console.log(`> GitHub sync service started`);
                } catch (error) {
                    console.error("Failed to start GitHub sync:", error);
                }
            }
        });
});
