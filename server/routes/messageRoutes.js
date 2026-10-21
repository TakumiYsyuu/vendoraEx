import express from "express";
import multer from "multer";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  searchUsers,
  listConversations,
  startConversation,
  getMessages,
  sendMessage,
  deleteConversation,
} from "../controller/messageController.js";

import {
  messageBurstLimiter,
  messageSustainedLimiter,
} from "../middleware/rateLimiters.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

const router = express.Router();

router.use(requireAuth);

router.get("/users", searchUsers);
router.get("/conversations", listConversations);
router.post("/conversations", startConversation);
router.get("/conversations/:id/messages", getMessages);
router.post(
  "/conversations/:id/messages",
  messageBurstLimiter,
  messageSustainedLimiter,
  upload.single("image"),
  sendMessage,
);
router.delete("/conversations/:id", deleteConversation);

export default router;
