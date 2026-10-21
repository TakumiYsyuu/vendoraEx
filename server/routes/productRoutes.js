import express from "express";
import upload from "../middleware/upload.js";
import { requireSeller } from "../middleware/sellerAuth.js";
import {
  getCategories,
  createProduct,
  getMyProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  listStorefrontProducts,
} from "../controller/productController.js";

const router = express.Router();

router.get("/", listStorefrontProducts);
router.get("/categories", getCategories);
router.get("/mine", requireSeller, getMyProducts);
router.post("/", requireSeller, upload.array("images", 5), createProduct);
router.get("/:id", getProduct);
router.put("/:id", requireSeller, updateProduct);
router.delete("/:id", requireSeller, deleteProduct);

export default router;
