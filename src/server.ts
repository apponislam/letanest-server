import { Server } from "http";
import app from "./app";
import config from "./app/config";
import mongoose from "mongoose";
import http from "http";
import createSuperAdmin from "./scripts/createSuperAdmin";
import { initSocket } from "./socket/socket";
import { geocodeAddress } from "./app/modules/property/geocodingService";
import axios from "axios";
import createBotAdmin from "./scripts/createBotAdmin";

let server: Server;

async function main() {
    try {
        await mongoose.connect(config.mongodb_url as string);
        server = http.createServer(app);

        initSocket(server);

        createSuperAdmin();
        createBotAdmin();

        // const ipResponse = await axios.get("https://api.ipify.org?format=json");
        // console.log("🌐 Backend public IP:", ipResponse.data.ip);

        // const location = "London";
        // const postCode = "SW1A 1AA";

        // const result = await geocodeAddress(location, postCode);
        // console.log(result);

        // server.listen(Number(config.port), config.ip || "0.0.0.0", () => {
        //     console.log(`✅ App listening on port ${config.port}`);
        // });
        server.listen(Number(config.port), () => {
            console.log(`✅ App listening on port ${config.port}`);
        });
    } catch (err) {
        console.log("❌ DB Connection Failed:", err);
    }
}

main();

process.on("unhandledRejection", (error) => {
    console.log("❌ Unhandled Rejection detected:", error);

    if (server) {
        server.close(() => {
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});

process.on("uncaughtException", (error) => {
    console.log("❌ Uncaught Exception detected:", error);

    if (server) {
        server.close(() => {
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});
