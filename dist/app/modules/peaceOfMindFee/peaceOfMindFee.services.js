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
exports.peaceOfMindFeeServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const peaceOfMindFee_model_1 = require("./peaceOfMindFee.model");
const createOrUpdateFee = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    yield peaceOfMindFee_model_1.PeaceOfMindFee.deleteMany();
    const fee = yield peaceOfMindFee_model_1.PeaceOfMindFee.create(payload);
    return fee;
});
const getFee = () => __awaiter(void 0, void 0, void 0, function* () {
    const fee = yield peaceOfMindFee_model_1.PeaceOfMindFee.findOne();
    if (!fee) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Peace of mind fee not found");
    }
    return fee;
});
exports.peaceOfMindFeeServices = {
    createOrUpdateFee,
    getFee,
};
