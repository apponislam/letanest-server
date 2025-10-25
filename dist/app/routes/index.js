"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_routes_1 = require("../modules/auth/auth.routes");
const public_routes_1 = require("../modules/public/public.routes");
const users_routes_1 = require("../modules/users/users.routes");
const properties_routes_1 = require("../modules/property/properties.routes");
const verification_routes_1 = require("../modules/verification/verification.routes");
const subscription_routes_1 = require("../modules/subscription/subscription.routes");
const subscribed_routes_1 = require("../modules/subscribed/subscribed.routes");
const message_routes_1 = require("../modules/messages/message.routes");
const paymentMethod_routes_1 = require("../modules/paymentMethod/paymentMethod.routes");
const payment_routes_1 = require("../modules/payment/payment.routes");
const dashboard_routes_1 = require("../modules/dashboard/dashboard.routes");
const rating_routes_1 = require("../modules/rating/rating.routes");
const contact_route_1 = require("../modules/contact/contact.route");
const pages_routes_1 = require("../modules/pages/pages.routes");
const reports_routes_1 = require("../modules/reports/reports.routes");
const router = express_1.default.Router();
const moduleRoutes = [
    {
        path: "/auth",
        route: auth_routes_1.authRoutes,
    },
    {
        path: "/public",
        route: public_routes_1.publicRoute,
    },
    {
        path: "/users",
        route: users_routes_1.userRoutes,
    },
    {
        path: "/property",
        route: properties_routes_1.propertyRoutes,
    },
    {
        path: "/verifications",
        route: verification_routes_1.verificationRoutes,
    },
    {
        path: "/subscriptions",
        route: subscription_routes_1.subscriptionRoutes,
    },
    {
        path: "/subscribed",
        route: subscribed_routes_1.userSubscriptionRoutes,
    },
    {
        path: "/messages",
        route: message_routes_1.messageRoutes,
    },
    {
        path: "/payment-methods",
        route: paymentMethod_routes_1.paymentMethodRoutes,
    },
    {
        path: "/property-payment",
        route: payment_routes_1.paymentRoutes,
    },
    {
        path: "/dashboard",
        route: dashboard_routes_1.dashboardRoutes,
    },
    {
        path: "/rating",
        route: rating_routes_1.ratingRoutes,
    },
    {
        path: "/contact",
        route: contact_route_1.contactRoutes,
    },
    {
        path: "/page-config",
        route: pages_routes_1.pageConfigRoutes,
    },
    {
        path: "/reports",
        route: reports_routes_1.reportRoutes,
    },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;
