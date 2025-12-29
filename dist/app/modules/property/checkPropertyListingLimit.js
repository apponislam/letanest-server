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
exports.checkPropertyListingLimit = void 0;
const auth_model_1 = require("../auth/auth.model");
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const properties_model_1 = require("./properties.model");
const subscribed_model_1 = require("../subscribed/subscribed.model");
exports.checkPropertyListingLimit = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "User not authenticated");
    }
    const user = yield auth_model_1.UserModel.findById(userId).populate("freeTireSub").populate("currentSubscription");
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    const currentPropertyCount = yield properties_model_1.PropertyModel.countDocuments({
        createdBy: userId,
        isDeleted: false,
        status: { $in: ["pending", "published"] },
    });
    if (user.role === "ADMIN") {
        return next();
    }
    // Check if user has free trial with listing limit
    if (user.freeTireData && (user.freeTireData.listingLimit || 0) > 0) {
        const listingLimit = user.freeTireData.listingLimit || 0;
        if (currentPropertyCount >= listingLimit) {
            throw new ApiError_1.default(http_status_1.default.FORBIDDEN, `You have reached your free trial listing limit of ${listingLimit} properties. Please upgrade your subscription to list more properties.`);
        }
        console.log("Free trial active - allowing property creation");
        return next();
    }
    // Check current subscription
    if (user.currentSubscription) {
        const userSubscription = yield subscribed_model_1.UserSubscription.findById(user.currentSubscription).populate("subscription");
        if (userSubscription && userSubscription.status === "active") {
            const subscription = userSubscription.subscription;
            const listingLimit = subscription.listingLimit || 0;
            if (listingLimit > 0 && currentPropertyCount >= listingLimit) {
                throw new ApiError_1.default(http_status_1.default.FORBIDDEN, `You have reached your subscription listing limit of ${listingLimit} properties. Please upgrade your plan to list more properties.`);
            }
            console.log("Active subscription - allowing property creation");
            return next();
        }
        else {
            throw new ApiError_1.default(http_status_1.default.FORBIDDEN, "Your subscription is not active. Please subscribe to a plan to list properties.");
        }
    }
    throw new ApiError_1.default(http_status_1.default.FORBIDDEN, "You are not subscribed to any plan. Please choose a subscription plan to list properties.");
}));
