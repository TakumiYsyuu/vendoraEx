import express from "express";
import {
  createReport,
  listReports,
  claimReport,
  submitFinalReport,
  decideReport,
  updateReportStatus,
} from "../controller/reportController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

const allow =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.user?.role) ? next() : (
      res.status(403).json({ message: "Not allowed." })
    );

router.post("/", requireAuth, allow("shopper", "seller"), createReport);
router.get("/", requireAuth, allow("staff", "admin"), listReports);

router.post("/:id/claim", requireAuth, allow("staff"), claimReport);
router.post("/:id/final", requireAuth, allow("staff"), submitFinalReport);
router.post("/:id/decision", requireAuth, allow("admin"), decideReport);

router.patch("/:id", requireAuth, allow("admin"), updateReportStatus);

export default router;
