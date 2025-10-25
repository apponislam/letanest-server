"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const socketHandlers_1 = require("./socketHandlers");
const config_1 = __importDefault(require("../app/config"));
let io;
const initSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: config_1.default.client_url || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true,
        },
        transports: ["websocket", "polling"],
    });
    io.on("connection", socketHandlers_1.setupSocketHandlers);
    console.log("✅ Socket.io server initialized with CORS:", config_1.default.client_url || "http://localhost:3000");
    return io;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized! Call initSocket(server) first.");
    }
    return io;
};
exports.getIO = getIO;
