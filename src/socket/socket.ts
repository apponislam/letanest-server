// import { Server } from "socket.io";
// import http from "http";
// import config from "../app/config";

// let io: Server;

// export const initSocket = (server: http.Server) => {
//     io = new Server(server, {
//         cors: {
//             origin: config.client_url || "http://localhost:3000",
//             methods: ["GET", "POST"],
//         },
//     });

//     io.on("connection", (socket) => {
//         console.log("⚡ Client connected:", socket.id);

//         socket.on("ping", () => {
//             socket.emit("pong");
//         });

//         // socket.on("joinRoom", (userId: string) => {
//         //     console.log(`User ${userId} joined room`);
//         //     socket.join(userId);
//         // });
//         socket.on("joinRoom", (userId) => {
//             socket.join(`user::${userId}`);
//             console.log("📥 Joining room for user:", `user::${userId}`);
//         });

//         socket.on("disconnect", () => {
//             console.log("❌ Client disconnected:", socket.id);
//         });
//     });

//     return io;
// };

// export const getIO = (): Server => {
//     if (!io) {
//         throw new Error("❌ Socket.io not initialized. Call initSocket(server) in server.ts");
//     }
//     return io;
// };

// import { Server } from "socket.io";

// let io: Server;

// export const initSocket = (server: any) => {
//     io = new Server(server, {
//         cors: { origin: "*", methods: ["GET", "POST"] },
//     });

//     io.on("connection", (socket) => {
//         console.log("⚡ Client connected:", socket.id);
//     });

//     return io;
// };

// export const getIO = (): Server => {
//     if (!io) throw new Error("Socket.io not initialized! Call initSocket(server) first.");
//     return io;
// };

import { Server } from "socket.io";
import { setupSocketHandlers } from "./socketHandlers";
import config from "../app/config";

let io: Server;

export const initSocket = (server: any) => {
    io = new Server(server, {
        cors: {
            origin: config.client_url || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true,
        },
        transports: ["websocket", "polling"],
    });

    io.on("connection", setupSocketHandlers);

    console.log("✅ Socket.io server initialized with CORS:", config.client_url || "http://localhost:3000");
    return io;
};

export const getIO = (): Server => {
    if (!io) {
        throw new Error("Socket.io not initialized! Call initSocket(server) first.");
    }
    return io;
};
