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
function createSuperAdmin() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const existingAdmin = yield auth_model_1.UserModel.findOne({ role: auth_interface_1.roles.ADMIN });
            if (existingAdmin) {
                console.log("✅ Admin already exists:", existingAdmin.email);
                return;
            }
            const passwordHash = yield bcrypt_1.default.hash(config_1.default.superAdminPassword, Number(config_1.default.bcrypt_salt_rounds));
            const userData = {
                name: "Super Admin",
                email: config_1.default.superAdminEmail,
                password: passwordHash,
                role: auth_interface_1.roles.ADMIN,
                isActive: true,
                phone: undefined,
                profileImg: undefined,
                isEmailVerified: true,
                isVerifiedByAdmin: true,
            };
            const superAdmin = yield auth_model_1.UserModel.create(userData);
            console.log("✅ Super admin created:", superAdmin.email, "with ID:", superAdmin._id);
        }
        catch (error) {
            console.error("❌ Error creating super admin:", error);
        }
    });
}
exports.default = createSuperAdmin;
