import { Socket } from "socket.io";

export const setupSocketHandlers = (socket: Socket) => {
    console.log("⚡ Client connected:", socket.id);

    // Join user to their personal room
    socket.on("user:join", (userId: string) => {
        socket.join(userId);
        console.log(`User ${userId} joined room`);
    });

    // Join conversation room
    socket.on("conversation:join", (conversationId: string) => {
        socket.join(conversationId);
        console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    // Leave conversation room
    socket.on("conversation:leave", (conversationId: string) => {
        socket.leave(conversationId);
        console.log(`Socket ${socket.id} left conversation ${conversationId}`);
    });

    // Handle typing events
    socket.on("message:typing", (data: { conversationId: string; userId: string; isTyping: boolean }) => {
        socket.to(data.conversationId).emit("message:typing", data);
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
};
