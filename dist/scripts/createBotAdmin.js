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
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_model_1 = require("../app/modules/auth/auth.model");
const config_1 = __importDefault(require("../app/config"));
const auth_interface_1 = require("../app/modules/auth/auth.interface");
function createBotAdmin() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const existingBot = yield auth_model_1.UserModel.findOne({
                isBot: true,
                role: auth_interface_1.roles.ADMIN,
            });
            if (existingBot) {
                console.log("✅ Bot admin already exists:", existingBot.email);
                return;
            }
            const passwordHash = yield bcrypt_1.default.hash(config_1.default.botPassword, Number(config_1.default.bcrypt_salt_rounds));
            const botData = {
                name: "Letanest",
                email: config_1.default.botEmail,
                password: passwordHash,
                role: auth_interface_1.roles.ADMIN,
                isActive: true,
                phone: undefined,
                profileImg: undefined,
                isEmailVerified: true,
                isBot: true,
                isVerifiedByAdmin: true,
            };
            const botAdmin = yield auth_model_1.UserModel.create(botData);
            console.log("✅ Bot admin created:", botAdmin.email, "with ID:", botAdmin._id, "Role:", botAdmin.role);
        }
        catch (error) {
            console.error("❌ Error creating bot admin:", error);
        }
    });
}
exports.default = createBotAdmin;
