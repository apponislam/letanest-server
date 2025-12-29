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
exports.contactServices = void 0;
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const contact_model_1 = require("./contact.model");
const http_status_1 = __importDefault(require("http-status"));
const contactEmail_1 = require("./contactEmail");
const createContact = (contactData) => __awaiter(void 0, void 0, void 0, function* () {
    const contact = yield contact_model_1.Contact.create(contactData);
    return contact;
});
const getContacts = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (query = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;
    // Build search filter
    const filter = {};
    // Search functionality
    if (query.search) {
        filter.$or = [{ firstName: { $regex: query.search, $options: "i" } }, { lastName: { $regex: query.search, $options: "i" } }, { email: { $regex: query.search, $options: "i" } }, { phone: { $regex: query.search, $options: "i" } }, { message: { $regex: query.search, $options: "i" } }];
    }
    // Status filter
    if (query.status) {
        filter.status = query.status;
    }
    const [contacts, total] = yield Promise.all([contact_model_1.Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit), contact_model_1.Contact.countDocuments(filter)]);
    return {
        contacts,
        meta: {
            page,
            limit,
            total,
        },
    };
});
const getContactById = (contactId) => __awaiter(void 0, void 0, void 0, function* () {
    const contact = yield contact_model_1.Contact.findById(contactId);
    if (!contact) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Contact not found");
    }
    return contact;
});
const updateContactStatus = (contactId, status) => __awaiter(void 0, void 0, void 0, function* () {
    const contact = yield contact_model_1.Contact.findByIdAndUpdate(contactId, { status }, { new: true });
    if (!contact) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Contact not found");
    }
    return contact;
});
const replyToContact = (contactId, replyMessage) => __awaiter(void 0, void 0, void 0, function* () {
    const contact = yield contact_model_1.Contact.findById(contactId);
    if (!contact) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Contact not found");
    }
    yield (0, contactEmail_1.sendContactReply)({
        to: contact.email,
        name: `${contact.firstName} ${contact.lastName}`,
        originalMessage: contact.message,
        reply: replyMessage,
    });
    const updatedContact = yield contact_model_1.Contact.findByIdAndUpdate(contactId, {
        status: "replied",
        replyMessage: replyMessage,
        repliedAt: new Date(),
    }, { new: true });
    return updatedContact;
});
exports.contactServices = {
    createContact,
    getContacts,
    getContactById,
    updateContactStatus,
    replyToContact,
};
