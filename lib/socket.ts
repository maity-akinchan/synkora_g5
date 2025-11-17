import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

/**
 * Calculate exponential backoff delay
 */
const getReconnectionDelay = (attempt: number): number => {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    return delay;
};

/**
 * Get or create Socket.io client instance with authentication
 */
export const getSocket = (token?: string): Socket => {
    if (!socket) {
        // Use standalone WebSocket server URL if provided, otherwise default to same origin
        const url = process.env.NEXT_PUBLIC_WEBSOCKET_URL || window.location.origin;

        console.log(`[Socket] Connecting to WebSocket server: ${url}`);

        socket = io(url, {
            autoConnect: false, // We'll connect manually after setting auth
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 30000,
            reconnectionAttempts: Infinity,
            auth: {
                token: token || "",
            },
        });

        socket.on("connect", () => {
            console.log("Socket connected:", socket?.id);
            reconnectAttempts = 0; // Reset on successful connection
        });

        socket.on("disconnect", (reason) => {
            console.log("Socket disconnected:", reason);

            // Handle different disconnect reasons
            if (reason === "io server disconnect") {
                // Server disconnected the socket, try to reconnect manually
                socket?.connect();
            }
        });

        socket.on("connect_error", (error) => {
            console.error("Socket connection error:", error.message);
            reconnectAttempts++;

            if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
                console.error("Max reconnection attempts reached");
                socket?.disconnect();
            } else {
                // Implement exponential backoff
                const delay = getReconnectionDelay(reconnectAttempts);
                console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);
            }
        });

        socket.on("reconnect", (attemptNumber) => {
            console.log(`Reconnected after ${attemptNumber} attempts`);
            reconnectAttempts = 0;
        });

        socket.on("reconnect_attempt", (attemptNumber) => {
            console.log(`Reconnection attempt ${attemptNumber}`);
        });

        socket.on("reconnect_error", (error) => {
            console.error("Reconnection error:", error.message);
        });

        socket.on("reconnect_failed", () => {
            console.error("Reconnection failed after all attempts");
        });

        socket.on("error", (error) => {
            console.error("Socket error:", error);
        });

        socket.on("connected", (data) => {
            console.log("Connection confirmed:", data);
        });

        // Handle server shutdown gracefully
        socket.on("server:shutdown", (data) => {
            console.warn("Server shutting down:", data.message);
        });
    }

    return socket;
};

/**
 * Connect the socket with authentication token
 */
export const connectSocket = (token: string): Socket => {
    const socketInstance = getSocket(token);

    if (!socketInstance.connected) {
        socketInstance.auth = { token };
        socketInstance.connect();
    }

    return socketInstance;
};

/**
 * Disconnect and cleanup socket
 */
export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket.removeAllListeners();
        socket = null;
        reconnectAttempts = 0;
    }
};

/**
 * Join a project room
 */
export const joinProject = (projectId: string) => {
    if (socket?.connected) {
        socket.emit("join-project", projectId);
    }
};

/**
 * Leave a project room
 */
export const leaveProject = (projectId: string) => {
    if (socket?.connected) {
        socket.emit("leave-project", projectId);
    }
};

/**
 * Send a ping to check connection health
 */
export const ping = () => {
    if (socket?.connected) {
        socket.emit("ping");
    }
};

/**
 * Get current connection status
 */
export const isConnected = (): boolean => {
    return socket?.connected || false;
};

/**
 * Get socket ID
 */
export const getSocketId = (): string | undefined => {
    return socket?.id;
};
