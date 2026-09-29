import express from "express";
import {
  requestReset,
  verifyResetCode,
  resetPassword,
} from "../controller/passwordResetController.js";

const router = express.Router();

router.post("/request", requestReset);
router.post("/verify", verifyResetCode);
router.post("/reset", resetPassword);

export default router;
