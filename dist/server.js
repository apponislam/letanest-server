"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./app/config"));
const mongoose_1 = __importDefault(require("mongoose"));
const http_1 = __importDefault(require("http"));
const createSuperAdmin_1 = __importDefault(require("./scripts/createSuperAdmin"));
const socketHelper_1 = require("./socket/socketHelper");
let server;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mongoose_1.default.connect(config_1.default.mongodb_url);
            server = http_1.default.createServer(app_1.default);
            (0, socketHelper_1.initSocket)(server);
            (0, createSuperAdmin_1.default)();
            // server.listen(Number(config.port), config.ip || "0.0.0.0", () => {
            //     console.log(`✅ App listening on port ${config.port}`);
            // });
            server.listen(Number(config_1.default.port), () => {
                console.log(`✅ App listening on port ${config_1.default.port}`);
            });
        }
        catch (err) {
            console.log("❌ DB Connection Failed:", err);
        }
    });
}
main();
process.on("unhandledRejection", (error) => {
    console.log("❌ Unhandled Rejection detected:", error);
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    else {
        process.exit(1);
    }
});
process.on("uncaughtException", (error) => {
    console.log("❌ Uncaught Exception detected:", error);
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    else {
        process.exit(1);
    }
});
