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
exports.messageTypesServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const mongoose_1 = require("mongoose");
const messageTypes_model_1 = require("./messageTypes.model");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const createMessageType = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const existingType = yield messageTypes_model_1.MessageType.findOne({ type: data.type.toUpperCase() });
    if (existingType) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `Message type '${data.type}' already exists`);
    }
    const messageType = yield messageTypes_model_1.MessageType.create(Object.assign(Object.assign({}, data), { type: data.type.toUpperCase() }));
    return messageType;
});
const getAllMessageTypes = () => __awaiter(void 0, void 0, void 0, function* () {
    const messageTypes = yield messageTypes_model_1.MessageType.find().sort({ createdAt: -1 });
    return messageTypes;
});
const getMessageTypeById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Invalid message type ID");
    }
    const messageType = yield messageTypes_model_1.MessageType.findById(id);
    if (!messageType) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Message type not found");
    }
    return messageType;
});
const getMessageTypeByType = (type) => __awaiter(void 0, void 0, void 0, function* () {
    const messageType = yield messageTypes_model_1.MessageType.findOne({ type: type.toUpperCase() });
    if (!messageType) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, `Message type '${type}' not found`);
    }
    return messageType;
});
const updateMessageType = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Invalid message type ID");
    }
    // Create a copy of data to modify
    const updateData = Object.assign({}, data);
    if (updateData.type) {
        const existingType = yield messageTypes_model_1.MessageType.findOne({
            type: updateData.type.toUpperCase(),
            _id: { $ne: id },
        });
        if (existingType) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `Message type '${updateData.type}' already exists`);
        }
        // Type is already validated by the schema enum, so we can safely assign
        updateData.type = updateData.type.toUpperCase();
    }
    const messageType = yield messageTypes_model_1.MessageType.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!messageType) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Message type not found");
    }
    return messageType;
});
const deleteMessageType = (id) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Invalid message type ID");
    }
    const messageType = yield messageTypes_model_1.MessageType.findByIdAndDelete(id);
    if (!messageType) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Message type not found");
    }
});
exports.messageTypesServices = {
    createMessageType,
    getAllMessageTypes,
    getMessageTypeById,
    getMessageTypeByType,
    updateMessageType,
    deleteMessageType,
};
