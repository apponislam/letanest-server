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
import { dashboardRoutes } from "../modules/dashboard/dashboard.routes";
import { ratingRoutes } from "../modules/rating/rating.routes";
import { contactRoutes } from "../modules/contact/contact.route";
import { pageConfigRoutes } from "../modules/pages/pages.routes";
import { reportRoutes } from "../modules/reports/reports.routes";
import { bankDetailsRoutes } from "../modules/bankDetails/bankDetails.routes";
import { privacyPolicyRoutes } from "../modules/privacy-policy/privacyPolicy.routes";
import { messageTypesRoutes } from "../modules/automessages/messageTypes.routes";

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
    {
        path: "/dashboard",
        route: dashboardRoutes,
    },
    {
        path: "/rating",
        route: ratingRoutes,
    },
    {
        path: "/contact",
        route: contactRoutes,
    },
    {
        path: "/page-config",
        route: pageConfigRoutes,
    },
    {
        path: "/reports",
        route: reportRoutes,
    },
    {
        path: "/bank-details",
        route: bankDetailsRoutes,
    },
    {
        path: "/privacy-policy",
        route: privacyPolicyRoutes,
    },
    {
        path: "/message-types",
        route: messageTypesRoutes,
    },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
