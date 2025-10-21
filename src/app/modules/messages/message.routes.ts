import express from "express";
import auth from "../../middlewares/auth";
import { messageControllers } from "./message.controllers";

const router = express.Router();

router.get("/unread-count", auth, messageControllers.getTotalUnreadCount);

router.post("/conversations", auth, messageControllers.createConversation);
router.get("/conversations/my-conversations", auth, messageControllers.getUserConversations);
router.get("/conversations/:conversationId", auth, messageControllers.getConversationById);

// NEW: Mark all messages in a conversation as read
router.patch("/conversations/:conversationId/read", auth, messageControllers.markConversationAsRead);

router.post("/messages", auth, messageControllers.sendMessage);
router.get("/messages/conversation/:conversationId", auth, messageControllers.getConversationMessages);
router.get("/messages/:messageId", auth, messageControllers.getMessageById);
router.patch("/messages/:messageId/read", auth, messageControllers.markAsRead);

router.patch("/:messageId/reject", auth, messageControllers.rejectOffer);

export const messageRoutes = router;
