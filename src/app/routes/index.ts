import express from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import { publicRoute } from "../modules/public/public.routes";
import { userRoutes } from "../modules/users/users.routes";
import { propertyRoutes } from "../modules/property/properties.routes";
import { verificationRoutes } from "../modules/verification/verification.routes";
import { subscriptionRoutes } from "../modules/subscription/subscription.routes";
import { userSubscriptionRoutes } from "../modules/subscribed/subscribed.routes";
import { messageRoutes } from "../modules/messages/message.routes";
import { paymentMethodRoutes } from "../modules/paymentMethod/paymentMethod.routes";
import { paymentRoutes } from "../modules/payment/payment.routes";

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
    {
        path: "/property",
        route: propertyRoutes,
    },
    {
        path: "/verifications",
        route: verificationRoutes,
    },
    {
        path: "/subscriptions",
        route: subscriptionRoutes,
    },
    {
        path: "/subscribed",
        route: userSubscriptionRoutes,
    },
    {
        path: "/messages",
        route: messageRoutes,
    },
    {
        path: "/payment-methods",
        route: paymentMethodRoutes,
    },
    {
        path: "/property-payment",
        route: paymentRoutes,
    },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
