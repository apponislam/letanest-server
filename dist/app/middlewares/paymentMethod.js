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
exports.checkPaymentMethodOwnership = void 0;
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const paymentMethod_services_1 = require("../modules/paymentMethod/paymentMethod.services");
const http_status_1 = __importDefault(require("http-status"));
exports.checkPaymentMethodOwnership = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { paymentMethodId } = req.params;
    const isOwner = yield paymentMethod_services_1.paymentMethodServices.validatePaymentMethodOwnership(req.user._id, paymentMethodId);
    if (!isOwner) {
        throw new ApiError_1.default(http_status_1.default.FORBIDDEN, "You do not have permission to access this payment method");
    }
    next();
}));
