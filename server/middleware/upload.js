import multer from "multer";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "uploads"),
  filename: (req, file, cb) =>
    cb(
      null,
      crypto.randomBytes(16).toString("hex") +
        path.extname(file.originalname).toLowerCase(),
    ),
});

export default multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }, // PNG/JPG up to 5MB
  fileFilter: (req, file, cb) => {
    if (["image/png", "image/jpeg", "image/webp"].includes(file.mimetype))
      cb(null, true);
    else cb(new Error("Only PNG or JPG images are allowed."));
  },
});
