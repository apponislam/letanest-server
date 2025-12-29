"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const routes_1 = __importDefault(require("./app/routes"));
const path_1 = __importDefault(require("path"));
const notFound_1 = __importDefault(require("./errors/notFound"));
const globalErrorhandler_1 = __importDefault(require("./errors/globalErrorhandler"));
const webhook_controller_1 = require("./app/modules/subscription/webhook.controller");
const app = (0, express_1.default)();
app.post("/api/v1/subscription/webhook", express_1.default.raw({ type: "application/json" }), webhook_controller_1.webhookController.handleWebhook);
const corsOptions = {
    origin: ["http://localhost:3000", "http://10.10.7.50:3000", "http://206.162.244.155:3050", "http://72.167.224.54:3050"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};
app.use((0, cors_1.default)(corsOptions));
app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), "uploads")));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.get("/", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "../public/index.html"));
});
app.use("/api/v1", routes_1.default);
app.use(notFound_1.default);
app.use(globalErrorhandler_1.default);
exports.default = app;
