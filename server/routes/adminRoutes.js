import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import {
  getUsers,
  createUser,
  updateUser,
  setUserRestriction,
} from "../controller/adminController.js";

const router = express.Router();

router.use(requireAuth, requireAdmin);
router.get("/users", getUsers);
router.post("/users", createUser);
router.patch("/users/:id", updateUser);
router.patch("/users/:id/restriction", setUserRestriction);

export default router;
