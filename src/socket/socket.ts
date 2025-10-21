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
