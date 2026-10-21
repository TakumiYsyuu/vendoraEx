import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  getWishlist,
  addWishlist,
  removeWishlist,
} from "../controller/wishlistController.js";

const router = express.Router();

router.use(requireAuth);
router.get("/", getWishlist);
router.post("/:productId", addWishlist);
router.delete("/:productId", removeWishlist);

export default router;
