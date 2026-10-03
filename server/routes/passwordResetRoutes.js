import express from "express";
import {
  requestReset,
  verifyResetCode,
  resetPassword,
} from "../controller/passwordResetController.js";
import { passwordResetLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.post("/request", passwordResetLimiter, requestReset);
router.post("/verify", passwordResetLimiter, verifyResetCode);
router.post("/reset", passwordResetLimiter, resetPassword);

export default router;
