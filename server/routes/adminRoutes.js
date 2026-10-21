import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import {
  getUsers,
  createUser,
  updateUser,
  setUserRestriction,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  listVerifications,
  getVerificationImages,
  approveVerification,
  rejectVerification,
} from "../controller/adminController.js";

const router = express.Router();

router.use(requireAuth, requireAdmin);
router.get("/users", getUsers);
router.post("/users", createUser);
router.patch("/users/:id", updateUser);
router.patch("/users/:id/restriction", setUserRestriction);

router.get("/staff", getStaff);
router.post("/staff", createStaff);
router.patch("/staff/:id", updateStaff);
router.patch("/staff/:id/restriction", setUserRestriction);
router.delete("/staff/:id", deleteStaff);

router.get("/verifications", listVerifications);
router.get("/verifications/:id/images", getVerificationImages);
router.put("/verifications/:id/approve", approveVerification);
router.put("/verifications/:id/reject", rejectVerification);
export default router;
