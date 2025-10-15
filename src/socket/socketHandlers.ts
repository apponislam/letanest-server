import { Socket } from "socket.io";

// Store online users and their socket connections
const userSockets = new Map<string, Set<string>>(); // userId -> socketIds
const socketUsers = new Map<string, string>(); // socketId -> userId

export const setupSocketHandlers = (socket: Socket) => {
    // console.log("⚡ Client connected:", socket.id);

    // Join user to their personal room and mark as online
    socket.on("user:join", (userId: string) => {
        if (!userId) {
            console.warn("⚠️ No userId provided for user:join");
            return;
        }

        console.log(`👤 User ${userId} joining with socket ${socket.id}`);

        // Store user connection
        if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
        }
        userSockets.get(userId)!.add(socket.id);
        socketUsers.set(socket.id, userId);

        // Join user room
        socket.join(userId);

        // Join user to online users room for broadcasting
        socket.join("online-users");

        // Notify ALL clients that this user is online
        socket.broadcast.emit("user:online", userId);
        console.log(`✅ User ${userId} is now online`);

        // Send current online users to the newly connected user
        const onlineUserIds = Array.from(userSockets.keys());
        socket.emit("users:online", onlineUserIds);
        // console.log(`📢 Sent online users to ${userId}:`, onlineUserIds);
    });

    // Join conversation room
    socket.on("conversation:join", (conversationId: string) => {
        const io = require("./socket").getIO();
        if (!conversationId) {
            console.warn("⚠️ No conversationId provided for conversation:join");
            return;
        }

        socket.join(conversationId);
        const room = io.sockets.adapter.rooms.get(conversationId);
        console.log(`💬 Room ${conversationId} now has ${room ? room.size : 0} sockets`);
        console.log(`💬 User ${socketUsers.get(socket.id)} joined conversation ${conversationId}`);
    });

    // Leave conversation room
    socket.on("conversation:leave", (conversationId: string) => {
        socket.leave(conversationId);
        console.log(`🚪 User ${socketUsers.get(socket.id)} left conversation ${conversationId}`);
    });

    // Handle typing events
    socket.on("message:typing", (data: { conversationId: string; userId: string; isTyping: boolean }) => {
        if (!data.conversationId || !data.userId) {
            console.warn("⚠️ Invalid data for message:typing", data);
            return;
        }

        // console.log(`⌨️ User ${data.userId} ${data.isTyping ? "started" : "stopped"} typing in conversation ${data.conversationId}`);

        // Broadcast typing event to all OTHER users in the conversation
        socket.to(data.conversationId).emit("message:typing", {
            conversationId: data.conversationId,
            userId: data.userId,
            isTyping: data.isTyping,
        });
    });

    // Handle disconnect
    socket.on("disconnect", (reason) => {
        console.log(`❌ Client disconnected: ${socket.id} (reason: ${reason})`);

        const userId = socketUsers.get(socket.id);

        if (userId) {
            // Remove socket from user sockets tracking
            const userSocketSet = userSockets.get(userId);
            if (userSocketSet) {
                userSocketSet.delete(socket.id);

                // If user has no more connected sockets, mark as offline
                if (userSocketSet.size === 0) {
                    userSockets.delete(userId);
                    // Notify ALL clients that this user went offline
                    socket.broadcast.emit("user:offline", userId);
                    console.log(`🔴 User ${userId} is now offline (no more connections)`);
                }
            }

            socketUsers.delete(socket.id);
        }
    });

    // Handle connection errors
    socket.on("connect_error", (error) => {
        console.error("🔥 Socket connection error:", error);
    });
};

// Helper function to get online users
export const getOnlineUsers = (): string[] => {
    return Array.from(userSockets.keys());
};

// Helper function to check if user is online
export const isUserOnline = (userId: string): boolean => {
    return userSockets.has(userId);
};

// Helper function to emit to user
export const emitToUser = (userId: string, event: string, data: any) => {
    const io = require("./socket").getIO();
    if (userSockets.has(userId)) {
        io.to(userId).emit(event, data);
        console.log(`📢 Emitted ${event} to user ${userId}`);
    }
};

// Helper function to emit to conversation
export const emitToConversation = (conversationId: string, event: string, data: any) => {
    const io = require("./socket").getIO();
    io.to(conversationId).emit(event, data);
    console.log(`📢 Emitted ${event} to conversation ${conversationId}`);
};

// export const emitToConversation = (conversationId: string, event: string, data: any) => {
//     try {
//         const io = require("./socket").getIO();
//         if (!io) {
//             console.warn("⚠️ [EMIT DEBUG] Socket.IO instance not initialized!");
//             return;
//         }

//         const room = io.sockets.adapter.rooms.get(conversationId);
//         console.log(`🔊 [EMIT DEBUG] Emitting ${event} to conversation: ${conversationId}`);
//         console.log(`🔊 [EMIT DEBUG] Room exists: ${!!room}`);

//         if (room) {
//             const socketIds = Array.from(room) as string[];
//             console.log(`🔊 [EMIT DEBUG] ${socketIds.length} sockets in room:`, socketIds);

//             const userIdsInRoom = socketIds.map((socketId) => socketUsers.get(socketId)).filter(Boolean);

//             console.log(`🔊 [EMIT DEBUG] User IDs in room:`, userIdsInRoom);
//         } else {
//             console.warn(`⚠️ [EMIT DEBUG] Room ${conversationId} does not exist!`);
//         }

//         io.to(conversationId).emit(event, data);
//         console.log(`✅ [EMIT DEBUG] Emission completed for ${event}`);
//     } catch (err) {
//         console.error("❌ [EMIT DEBUG] Failed to emit:", err);
//     }
// };
