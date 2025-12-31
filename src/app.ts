import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./app/routes";
import path from "path";
import notFound from "./errors/notFound";
import globalErrorHandler from "./errors/globalErrorhandler";
import { webhookController } from "./app/modules/subscription/webhook.controller";

const app: Application = express();

app.post("/api/v1/subscription/webhook", express.raw({ type: "application/json" }), webhookController.handleWebhook);

const corsOptions = {
    origin: ["http://localhost:3000", "http://10.10.7.50:3000", "http://206.162.244.155:3050", "http://72.167.224.54:3050", "http://87.106.67.163:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};

app.use(cors(corsOptions));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.use("/api/v1", router);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
