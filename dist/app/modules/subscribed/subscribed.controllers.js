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
exports.userSubscriptionController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse."));
const subscribed_services_1 = require("./subscribed.services");
const createUserSubscription = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userSubscription = yield subscribed_services_1.userSubscriptionService.createUserSubscription(Object.assign(Object.assign({}, req.body), { userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId }));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Subscription activated successfully",
        data: userSubscription,
    });
}));
const getMySubscriptions = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const subscriptions = yield subscribed_services_1.userSubscriptionService.getUserSubscriptions((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Subscriptions retrieved successfully",
        data: subscriptions,
    });
}));
const getMyActiveSubscription = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const subscription = yield subscribed_services_1.userSubscriptionService.getActiveUserSubscription((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId);
    (0, sendResponse_1.default)(res, {
        statusCode: subscription ? http_status_1.default.OK : http_status_1.default.NOT_FOUND,
        success: !!subscription,
        message: subscription ? "Active subscription retrieved successfully" : "No active subscription found",
        data: subscription || null,
    });
}));
const getUserSubscription = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const subscription = yield subscribed_services_1.userSubscriptionService.getUserSubscriptionById(id);
    (0, sendResponse_1.default)(res, {
        statusCode: subscription ? http_status_1.default.OK : http_status_1.default.NOT_FOUND,
        success: !!subscription,
        message: subscription ? "Subscription retrieved successfully" : "Subscription not found",
        data: subscription || null,
    });
}));
const cancelSubscription = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const subscription = yield subscribed_services_1.userSubscriptionService.cancelUserSubscription(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Subscription cancelled successfully",
        data: subscription,
    });
}));
const updateSubscriptionStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { status } = req.body;
    const subscription = yield subscribed_services_1.userSubscriptionService.updateUserSubscriptionStatus(id, status);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Subscription status updated successfully",
        data: subscription,
    });
}));
const handleStripeWebhook = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { event } = req.body;
    let updatedSubscription;
    switch (event.type) {
        case "customer.subscription.updated":
        case "customer.subscription.created":
            updatedSubscription = yield subscribed_services_1.userSubscriptionService.updateUserSubscriptionByStripeId(event.data.object.id, {
                status: event.data.object.status,
                currentPeriodStart: new Date(event.data.object.current_period_start * 1000),
                currentPeriodEnd: new Date(event.data.object.current_period_end * 1000),
                cancelAtPeriodEnd: event.data.object.cancel_at_period_end,
            });
            break;
        case "customer.subscription.deleted":
            updatedSubscription = yield subscribed_services_1.userSubscriptionService.updateUserSubscriptionByStripeId(event.data.object.id, { status: "canceled" });
            break;
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Webhook processed successfully",
        data: updatedSubscription,
    });
}));
exports.userSubscriptionController = {
    createUserSubscription,
    getMySubscriptions,
    getMyActiveSubscription,
    getUserSubscription,
    cancelSubscription,
    updateSubscriptionStatus,
    handleStripeWebhook,
};
