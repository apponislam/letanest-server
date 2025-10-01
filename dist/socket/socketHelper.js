"use strict";
// import { Server } from "socket.io";
// import http from "http";
// import config from "../app/config";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSocket = void 0;
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
const socket_io_1 = require("socket.io");
let io;
const initSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: { origin: "*", methods: ["GET", "POST"] },
    });
    io.on("connection", (socket) => {
        console.log("⚡ Client connected:", socket.id);
    });
    return io;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io)
        throw new Error("Socket.io not initialized! Call initSocket(server) first.");
    return io;
};
exports.getIO = getIO;
