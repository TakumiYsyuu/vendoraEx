import "./env.js";
import express from "express";
import cors from "cors";

import path from "path";
import { fileURLToPath } from "url";
import productRoutes from "./routes/productRoutes.js";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import passwordResetRoutes from "./routes/passwordResetRoutes.js";
import notificationsRouter from "./notifications.js";
import shopRoutes from "./routes/shopRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

import aiRoutes from "./routes/aiRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);

const allowedOrigins = [
  process.env.FRONTEND_URL?.replace(/\/+$/, ""),
  "http://localhost:5173",
].filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json({ limit: "15mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/password-reset", passwordResetRoutes);
app.use("/api/notifications", notificationsRouter);

app.use("/api/products", productRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/wishlist", wishlistRoutes);

app.use("/api/messages", messageRoutes);

app.use("/api/ai", aiRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Vendora REST API is running!" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use((err, req, res, next) => {
  res
    .status(400)
    .json({ success: false, message: err.message || "Upload failed." });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
