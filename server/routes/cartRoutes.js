import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  getCart,
  addToCart,
  setQuantity,
  removeItem,
  clearCart,
} from "../controller/cartController.js";

const router = Router();
router.use(requireAuth);
router.use((req, res, next) =>
  ["shopper", "seller"].includes(req.user.role) ? next() : (
    res
      .status(403)
      .json({ success: false, message: "You are not allowed to do that." })
  ),
);

router.get("/", getCart);
router.post("/", addToCart);
router.put("/:productId", setQuantity);
router.delete("/:productId", removeItem);
router.delete("/", clearCart);

export default router;
