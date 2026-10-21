import express from "express";
import { chatWithAssistant } from "../controller/aiController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/chat", requireAuth, chatWithAssistant);
export default router;
