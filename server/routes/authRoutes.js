import express from "express";
import { register, login, staffLogin } from "../controller/authController.js";
import { loginLimiter, registerLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/staff-login", loginLimiter, staffLogin);

export default router;
