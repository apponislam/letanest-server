import express from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import { publicRoute } from "../modules/public/public.routes";
import { userRoutes } from "../modules/users/users.routes";

const router = express.Router();

const moduleRoutes = [
    {
        path: "/auth",
        route: authRoutes,
    },
    {
        path: "/public",
        route: publicRoute,
    },
    {
        path: "/users",
        route: userRoutes,
    },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
