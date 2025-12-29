"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const message_controllers_1 = require("./message.controllers");
const bot_controller_1 = require("./bot.controller");
const router = express_1.default.Router();
// welcome message
router.post("/welcome", auth_1.default, bot_controller_1.botController.sendWelcomeMessage);
router.get("/unread-count", auth_1.default, message_controllers_1.messageControllers.getTotalUnreadCount);
router.post("/conversations", auth_1.default, message_controllers_1.messageControllers.createConversation);
router.get("/conversations/my-conversations", auth_1.default, message_controllers_1.messageControllers.getUserConversations);
router.get("/conversations/:conversationId", auth_1.default, message_controllers_1.messageControllers.getConversationById);
// NEW: Mark all messages in a conversation as read
router.patch("/conversations/:conversationId/read", auth_1.default, message_controllers_1.messageControllers.markConversationAsRead);
router.post("/messages", auth_1.default, message_controllers_1.messageControllers.sendMessage);
router.post("/messages/auto", message_controllers_1.messageControllers.sendMessageAuto);
router.get("/messages/conversation/:conversationId", auth_1.default, message_controllers_1.messageControllers.getConversationMessages);
router.get("/messages/:messageId", auth_1.default, message_controllers_1.messageControllers.getMessageById);
router.patch("/messages/:messageId/read", auth_1.default, message_controllers_1.messageControllers.markAsRead);
router.patch("/:messageId/reject", auth_1.default, message_controllers_1.messageControllers.rejectOffer);
router.patch("/:messageId/convert-to-offer", auth_1.default, message_controllers_1.messageControllers.convertRequestToOfferController);
router.patch("/:messageId/convert-makeoffer-to-request", auth_1.default, message_controllers_1.messageControllers.convertMakeOfferToRequest);
//edit offer
router.patch("/:messageId/edit-offer", auth_1.default, message_controllers_1.messageControllers.editOffer);
router.get("/admin/conversations/filter/by-updated", auth_1.default, message_controllers_1.messageControllers.filterConversationsByUpdatedAt);
router.get("/admin/conversations/user/:userId", auth_1.default, message_controllers_1.messageControllers.getConversationsByUserId);
router.get("/admin/conversations/:conversationId/messages", auth_1.default, message_controllers_1.messageControllers.getAllConversationMessages);
router.get("/admin/conversations/search/users", auth_1.default, message_controllers_1.messageControllers.searchUserConversations);
exports.messageRoutes = router;
