import { Router } from "express";
// Adjust this path/name to wherever your requireAuth lives.
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  placeOrder,
  getMyOrders,
  markReceived,
  getSellerOrders,
  acceptOrder,
  rejectOrder,
  sendToTransit,
  getStaffOrders,
  readyToDeliver,
  getAllOrders,
  getOrder,
} from "../controller/orderController.js";

const requireRole =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.user.role) ? next() : (
      res
        .status(403)
        .json({ success: false, message: "You are not allowed to do that." })
    );

const router = Router();
router.use(requireAuth);

// buyer (a seller can also shop in buyer mode)
router.post("/", requireRole("shopper", "seller"), placeOrder);
router.get("/mine", requireRole("shopper", "seller"), getMyOrders);
router.patch("/:id/received", requireRole("shopper", "seller"), markReceived);

// seller
router.get("/seller", requireRole("seller"), getSellerOrders);
router.patch("/:id/accept", requireRole("seller"), acceptOrder);
router.patch("/:id/reject", requireRole("seller"), rejectOrder);
router.patch("/:id/transit", requireRole("seller"), sendToTransit);

// staff
router.get("/staff", requireRole("staff"), getStaffOrders);
router.patch("/:id/ready", requireRole("staff"), readyToDeliver);

// admin (view only)
router.get("/admin", requireRole("admin"), getAllOrders);

// details (access is checked inside the controller)
router.get("/:id", getOrder);

export default router;
