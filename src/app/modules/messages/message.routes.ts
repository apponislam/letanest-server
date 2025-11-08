import express from "express";
import auth from "../../middlewares/auth";
import { messageControllers } from "./message.controllers";
import { botController } from "./bot.controller";

const router = express.Router();

// welcome message
router.post("/welcome", auth, botController.sendWelcomeMessage);

router.get("/unread-count", auth, messageControllers.getTotalUnreadCount);

router.post("/conversations", auth, messageControllers.createConversation);
router.get("/conversations/my-conversations", auth, messageControllers.getUserConversations);
router.get("/conversations/:conversationId", auth, messageControllers.getConversationById);

// NEW: Mark all messages in a conversation as read
router.patch("/conversations/:conversationId/read", auth, messageControllers.markConversationAsRead);

router.post("/messages", auth, messageControllers.sendMessage);
router.post("/messages/auto", messageControllers.sendMessageAuto);
router.get("/messages/conversation/:conversationId", auth, messageControllers.getConversationMessages);
router.get("/messages/:messageId", auth, messageControllers.getMessageById);
router.patch("/messages/:messageId/read", auth, messageControllers.markAsRead);

router.patch("/:messageId/reject", auth, messageControllers.rejectOffer);
router.patch("/:messageId/convert-to-offer", auth, messageControllers.convertRequestToOfferController);

router.get("/admin/conversations/user/:userId", auth, messageControllers.getConversationsByUserId);
router.get("/admin/conversations/:conversationId/messages", auth, messageControllers.getAllConversationMessages);
router.get("/admin/conversations/search/users", auth, messageControllers.searchUserConversations);

export const messageRoutes = router;
