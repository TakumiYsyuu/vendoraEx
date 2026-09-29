import express from "express";
import { register, login, staffLogin } from "../controller/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/staff-login", staffLogin);

export default router;
