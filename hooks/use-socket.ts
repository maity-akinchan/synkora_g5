"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Socket } from "socket.io-client";
import { connectSocket, disconnectSocket, joinProject, leaveProject } from "@/lib/socket";
import { useSession } from "next-auth/react";

interface UseSocketOptions {
    projectId?: string;
    autoConnect?: boolean;
}

interface ActiveUser {
    userId: string;
    userName: string;
    userImage?: string;
    joinedAt: string;
}

export function useSocket(options: UseSocketOptions = {}) {
    const { projectId, autoConnect = true } = options;
    const { data: session } = useSession();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
    const [userCount, setUserCount] = useState(0);
    const [lastPing, setLastPing] = useState<Date | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const pingIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

    // Connect to socket with authentication
    useEffect(() => {
        if (!session?.user || !autoConnect) {
            return;
        }

        // Get the JWT token from cookies for socket authentication
        const getJWTToken = async () => {
            try {
                // Fetch the session to get the JWT token
                const response = await fetch('/api/auth/session');
                const sessionData = await response.json();

                // The actual JWT token is in the cookie, but we can use the user ID as fallback
                // For proper authentication, we need to extract the JWT from the cookie
                const cookies = document.cookie.split(';');
                let jwtToken = '';

                // Look for next-auth session token
                for (const cookie of cookies) {
                    const [name, value] = cookie.trim().split('=');
                    if (name === 'next-auth.session-token' || name === '__Secure-next-auth.session-token') {
                        jwtToken = value;
                        break;
                    }
                }

                return jwtToken || session.user.id;
            } catch (error) {
                console.error('Failed to get JWT token:', error);
                return session.user.id;
            }
        };

        const initSocket = async () => {
            const token = await getJWTToken();
            const socketInstance = connectSocket(token);
            setSocket(socketInstance);

            const onConnect = () => {
                console.log("Socket connected");
                setIsConnected(true);
                setIsReconnecting(false);

                // Join project room if projectId is provided
                if (projectId) {
                    joinProject(projectId);
                }

                // Start ping interval for connection health check
                if (pingIntervalRef.current) {
                    clearInterval(pingIntervalRef.current);
                }
                pingIntervalRef.current = setInterval(() => {
                    if (socketInstance.connected) {
                        socketInstance.emit("ping");
                    }
                }, 30000); // Ping every 30 seconds
            };

            const onDisconnect = (reason: string) => {
                console.log("Socket disconnected:", reason);
                setIsConnected(false);
                setIsReconnecting(true);

                // Clear ping interval
                if (pingIntervalRef.current) {
                    clearInterval(pingIntervalRef.current);
                }
            };

            const onReconnect = () => {
                console.log("Socket reconnected");
                setIsReconnecting(false);

                // Rejoin project room after reconnection
                if (projectId) {
                    joinProject(projectId);
                }
            };

            const onReconnectAttempt = () => {
                setIsReconnecting(true);
            };

            const onPong = (data: { timestamp: string }) => {
                setLastPing(new Date(data.timestamp));
            };

            const onUsersActive = (data: { users: ActiveUser[]; count: number }) => {
                setActiveUsers(data.users);
                setUserCount(data.count);
            };

            const onUsersCount = (data: { count: number }) => {
                setUserCount(data.count);
            };

            const onUserJoined = (data: ActiveUser) => {
                setActiveUsers((prev) => {
                    // Avoid duplicates
                    if (prev.some((u) => u.userId === data.userId)) {
                        return prev;
                    }
                    return [...prev, data];
                });
            };

            const onUserLeft = (data: { userId: string }) => {
                setActiveUsers((prev) => prev.filter((u) => u.userId !== data.userId));
            };

            // Register event listeners
            socketInstance.on("connect", onConnect);
            socketInstance.on("disconnect", onDisconnect);
            socketInstance.on("reconnect", onReconnect);
            socketInstance.on("reconnect_attempt", onReconnectAttempt);
            socketInstance.on("pong", onPong);
            socketInstance.on("users:active", onUsersActive);
            socketInstance.on("users:count", onUsersCount);
            socketInstance.on("user:joined", onUserJoined);
            socketInstance.on("user:left", onUserLeft);

            // Set initial state
            setIsConnected(socketInstance.connected);

            return () => {
                // Leave project room before cleanup
                if (projectId && socketInstance.connected) {
                    leaveProject(projectId);
                }

                // Clear intervals
                if (pingIntervalRef.current) {
                    clearInterval(pingIntervalRef.current);
                }
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                }

                // Remove event listeners
                socketInstance.off("connect", onConnect);
                socketInstance.off("disconnect", onDisconnect);
                socketInstance.off("reconnect", onReconnect);
                socketInstance.off("reconnect_attempt", onReconnectAttempt);
                socketInstance.off("pong", onPong);
                socketInstance.off("users:active", onUsersActive);
                socketInstance.off("users:count", onUsersCount);
                socketInstance.off("user:joined", onUserJoined);
                socketInstance.off("user:left", onUserLeft);
            };
        };

        initSocket();
    }, [session, autoConnect, projectId]);

    // Handle project room changes
    useEffect(() => {
        if (!socket?.connected || !projectId) {
            return;
        }

        joinProject(projectId);

        return () => {
            if (socket.connected) {
                leaveProject(projectId);
            }
        };
    }, [socket, projectId]);

    const reconnect = useCallback(() => {
        if (socket && !socket.connected) {
            socket.connect();
        }
    }, [socket]);

    const disconnect = useCallback(() => {
        disconnectSocket();
        setSocket(null);
        setIsConnected(false);
        setActiveUsers([]);
        setUserCount(0);
    }, []);

    return {
        socket,
        isConnected,
        isReconnecting,
        activeUsers,
        userCount,
        lastPing,
        reconnect,
        disconnect,
    };
}
