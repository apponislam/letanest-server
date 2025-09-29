"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_routes_1 = require("../modules/auth/auth.routes");
const profile_route_1 = require("../modules/profile/profile.route");
const user_routes_1 = require("../modules/user/user.routes");
const realTimeLocation_routes_1 = require("../modules/realTimeLocation/realTimeLocation.routes");
const router = express_1.default.Router();
const moduleRoutes = [
    {
        path: "/auth",
        route: auth_routes_1.authRoutes,
    },
    {
        path: "/profile",
        route: profile_route_1.profileRoute,
    },
    {
        path: "/user",
        route: user_routes_1.userRoutes,
    },
    {
        path: "/location",
        route: realTimeLocation_routes_1.realTimeLocationRoutes,
    },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;
