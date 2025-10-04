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
Object.defineProperty(exports, "__esModule", { value: true });
exports.userServices = void 0;
const auth_model_1 = require("../auth/auth.model");
const getAllUsersService = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10, search, role, isActive } = query;
    const filter = {};
    if (search) {
        filter.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }, { phone: { $regex: search, $options: "i" } }];
    }
    if (role)
        filter.role = role;
    if (isActive)
        filter.isActive = isActive === "true";
    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = yield Promise.all([auth_model_1.UserModel.find(filter).select("-password").skip(skip).limit(Number(limit)).sort({ createdAt: -1 }), auth_model_1.UserModel.countDocuments(filter)]);
    return {
        users,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
        },
    };
});
const getSingleUserService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield auth_model_1.UserModel.findById(id).select("-password");
});
exports.userServices = {
    getAllUsersService,
    getSingleUserService,
};
