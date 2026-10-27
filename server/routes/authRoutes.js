import express from "express";
import {
  register,
  login,
  staffLogin,
  verifyLoginOtp,
  fetchProfile,
  saveProfile,
} from "../controller/authController.js";

import { requireAuth } from "../middleware/authMiddleware.js";
import { loginLimiter, registerLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/staff-login", loginLimiter, staffLogin);
router.post("/login/verify-otp", loginLimiter, verifyLoginOtp);

router.get("/profile", requireAuth, fetchProfile);
router.put("/profile", requireAuth, saveProfile);

export default router;
