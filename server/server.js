import "./env.js";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import passwordResetRoutes from "./routes/passwordResetRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);

const allowedOrigins = [
  process.env.FRONTEND_URL?.replace(/\/+$/, ""),
  "http://localhost:5173",
].filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/password-reset", passwordResetRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Vendora REST API is running!" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
