"use strict";
// import bcrypt from "bcrypt";
// import { UserModel } from "../app/modules/auth/auth.model";
// import config from "../app/config";
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
// async function createSuperAdmin() {
//     try {
//         const existingAdmin = await UserModel.findOne({ role: "super_admin" });
//         if (existingAdmin) {
//             console.log("Super admin already exists:", existingAdmin.email);
//             return;
//         }
//         const passwordHash = await bcrypt.hash(config.superAdminPassword!, Number(config.bcrypt_salt_rounds));
//         const superAdmin = await UserModel.create({
//             serialId: "BDU-000000-000000",
//             name: "Super Admin",
//             email: config.superAdminEmail,
//             password: passwordHash,
//             role: "super_admin",
//             isActive: true,
//             accountType: "email",
//             isEmailVerified: true,
//         });
//         console.log("Super admin created:", superAdmin.email, "with ID: BDU-000000-000000");
//     } catch (error) {
//         console.error("Error creating super admin:", error);
//     }
// }
// export default createSuperAdmin;
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_model_1 = require("../app/modules/auth/auth.model");
const profile_model_1 = require("../app/modules/profile/profile.model");
const config_1 = __importDefault(require("../app/config"));
const realTimeLocation_model_1 = require("../app/modules/realTimeLocation/realTimeLocation.model");
function createSuperAdmin() {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield mongoose_1.default.startSession();
        try {
            session.startTransaction();
            // Check if super admin already exists
            const existingAdmin = yield auth_model_1.UserModel.findOne({ role: "super_admin" }).session(session);
            if (existingAdmin) {
                console.log("✅ Super admin already exists:", existingAdmin.email);
                yield session.abortTransaction();
                session.endSession();
                return;
            }
            // Hash password
            const passwordHash = yield bcrypt_1.default.hash(config_1.default.superAdminPassword, Number(config_1.default.bcrypt_salt_rounds));
            // Prepare user data
            const userData = {
                serialId: "BDU-000000-000000",
                name: "Super Admin",
                email: config_1.default.superAdminEmail,
                password: passwordHash,
                role: "super_admin",
                isActive: true,
                accountType: "email",
                isEmailVerified: true,
            };
            // Temporary ObjectIds for profile & location
            const tempProfileId = new mongoose_1.default.Types.ObjectId();
            const tempLocationId = new mongoose_1.default.Types.ObjectId();
            userData.profile = tempProfileId;
            userData.realtimeLocation = tempLocationId;
            // Create user
            const users = yield auth_model_1.UserModel.create([userData], { session });
            const superAdmin = users[0];
            // Create profile and realtimeLocation
            yield Promise.all([
                profile_model_1.ProfileModel.create([
                    {
                        _id: tempProfileId,
                        user: superAdmin._id,
                        serialId: superAdmin.serialId,
                        profileImg: undefined,
                    },
                ], { session }),
                realTimeLocation_model_1.RealtimeLocationModel.create([
                    {
                        _id: tempLocationId,
                        user: superAdmin._id,
                        serialId: superAdmin.serialId,
                        latitude: 0,
                        longitude: 0,
                        hideLocation: true,
                    },
                ], { session }),
            ]);
            // Commit transaction
            yield session.commitTransaction();
            session.endSession();
            // Populate user
            const populatedSuperAdmin = yield auth_model_1.UserModel.findById(superAdmin._id).populate("profile").populate("realtimeLocation").exec();
            console.log("✅ Super admin created:", populatedSuperAdmin === null || populatedSuperAdmin === void 0 ? void 0 : populatedSuperAdmin.email, "with ID:", populatedSuperAdmin === null || populatedSuperAdmin === void 0 ? void 0 : populatedSuperAdmin.serialId);
        }
        catch (error) {
            yield session.abortTransaction();
            session.endSession();
            console.error("❌ Error creating super admin:", error);
        }
    });
}
exports.default = createSuperAdmin;
