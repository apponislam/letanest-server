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
exports.subscriptionController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse."));
const subscription_services_1 = require("./subscription.services");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const stripe_services_1 = require("./stripe.services");
const createSubscription = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body);
    const subscription = yield subscription_services_1.subscriptionService.createSubscription(req.body);
    console.log("Created Subscription:", subscription);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Subscription created successfully",
        data: subscription,
    });
}));
const getAllSubscriptions = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield subscription_services_1.subscriptionService.getAllSubscriptions(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Subscriptions retrieved successfully",
        data: result.subscriptions,
        meta: result.meta,
    });
}));
const getAllSubscriptionsAdmin = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield subscription_services_1.subscriptionService.getAllSubscriptionsAdmin(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Subscriptions retrieved successfully",
        data: result.subscriptions,
        meta: result.meta,
    });
}));
const getSubscription = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const subscription = yield subscription_services_1.subscriptionService.getSubscriptionById(id);
    (0, sendResponse_1.default)(res, {
        statusCode: subscription ? http_status_1.default.OK : http_status_1.default.NOT_FOUND,
        success: !!subscription,
        message: subscription ? "Subscription retrieved successfully" : "Subscription not found",
        data: subscription || null,
    });
}));
const getSubscriptionsByType = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type } = req.params;
    if (type !== "GUEST" && type !== "HOST") {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: "Invalid subscription type",
            data: null,
        });
    }
    const subscriptions = yield subscription_services_1.subscriptionService.getSubscriptionsByType(type);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: `${type} subscriptions retrieved successfully`,
        data: subscriptions,
    });
}));
const getSubscriptionsByTypeForAdmin = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type } = req.params;
    if (type !== "GUEST" && type !== "HOST") {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: "Invalid subscription type",
            data: null,
        });
    }
    const subscriptions = yield subscription_services_1.subscriptionService.getSubscriptionsByTypeForAdmin(type);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: `${type} subscriptions retrieved successfully`,
        data: subscriptions,
    });
}));
const getSubscriptionByTypeAndLevel = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type, level } = req.params;
    if (type !== "GUEST" && type !== "HOST") {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: "Invalid subscription type",
            data: null,
        });
    }
    if (!["free", "premium", "gold"].includes(level)) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: "Invalid subscription level",
            data: null,
        });
    }
    const subscription = yield subscription_services_1.subscriptionService.getActiveSubscriptionsByTypeAndLevel(type, level);
    (0, sendResponse_1.default)(res, {
        statusCode: subscription ? http_status_1.default.OK : http_status_1.default.NOT_FOUND,
        success: !!subscription,
        message: subscription ? "Subscription retrieved successfully" : "Subscription not found",
        data: subscription,
    });
}));
const getDefaultSubscription = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type } = req.params;
    if (type !== "GUEST" && type !== "HOST") {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: "Invalid subscription type",
            data: null,
        });
    }
    const subscription = yield subscription_services_1.subscriptionService.getDefaultSubscription(type);
    (0, sendResponse_1.default)(res, {
        statusCode: subscription ? http_status_1.default.OK : http_status_1.default.NOT_FOUND,
        success: !!subscription,
        message: subscription ? "Default subscription retrieved successfully" : "Default subscription not found",
        data: subscription,
    });
}));
const updateSubscription = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const subscription = yield subscription_services_1.subscriptionService.updateSubscription(id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Subscription updated successfully",
        data: subscription,
    });
}));
const toggleSubscriptionStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const subscription = yield subscription_services_1.subscriptionService.toggleSubscriptionStatus(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: `Subscription ${(subscription === null || subscription === void 0 ? void 0 : subscription.isActive) ? "activated" : "deactivated"} successfully`,
        data: subscription,
    });
}));
const createCheckoutSession = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { subscriptionId } = req.body;
    // Get user from auth middleware
    const user = req.user;
    // Get subscription details
    const subscription = yield subscription_services_1.subscriptionService.getSubscriptionById(subscriptionId);
    if (!subscription) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Subscription plan not found");
    }
    if (!subscription.isActive) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "This subscription is not active");
    }
    // Create checkout session with user data
    const session = yield stripe_services_1.stripeService.createCheckoutSessionWithUser(subscription.stripePriceId, {
        userId: user._id.toString(),
        subscriptionPlanId: subscriptionId,
        type: subscription.type,
        level: subscription.level,
        userEmail: user.email,
        userName: user.name || user.email,
    }, user.stripeCustomerId // if you have this
    );
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Checkout session created successfully",
        data: { url: session.url },
    });
}));
const getCheckoutSession = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sessionId } = req.params;
    if (!sessionId) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Session ID is required");
    }
    const session = yield stripe_services_1.stripeService.getCheckoutSession(sessionId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Checkout session retrieved successfully",
        data: session,
    });
}));
exports.subscriptionController = {
    createSubscription,
    getAllSubscriptions,
    getAllSubscriptionsAdmin,
    getSubscription,
    getSubscriptionsByType,
    getSubscriptionsByTypeForAdmin,
    getSubscriptionByTypeAndLevel,
    getDefaultSubscription,
    updateSubscription,
    toggleSubscriptionStatus,
    createCheckoutSession,
    getCheckoutSession,
};
