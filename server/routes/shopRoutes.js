import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  getShop,
  updateShop,
  getVerification,
  submitVerification,
} from "../controller/shopController.js";

const router = express.Router();

const sellerOnly = (req, res, next) => {
  if (req.user.role !== "seller")
    return res
      .status(403)
      .json({ success: false, message: "Seller access only." });
  req.user.id = req.user.userId;
  next();
};

router.use(requireAuth, sellerOnly);

router.get("/", getShop);
router.put("/", updateShop);
router.get("/verification", getVerification);
router.post("/verification", submitVerification);

export default router;
