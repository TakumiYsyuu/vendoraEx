import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DIR = path.join(__dirname, "..", "uploads", "verification");
const EXT = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
const MAX_BYTES = 5 * 1024 * 1024;

const bad = (msg) => Object.assign(new Error(msg), { status: 400 });

export function saveDataUrl(dataUrl) {
  if (typeof dataUrl !== "string") throw bad("Invalid image.");
  const [head, body] = dataUrl.split(";base64,");
  const mime = head?.replace("data:", "");
  if (!EXT[mime] || !body) throw bad("Images must be PNG, JPG or WebP.");

  const buffer = Buffer.from(body, "base64");
  if (!buffer.length || buffer.length > MAX_BYTES)
    throw bad("Each image must be 5MB or smaller.");

  fs.mkdirSync(DIR, { recursive: true });
  const name = `${crypto.randomUUID()}.${EXT[mime]}`;
  fs.writeFileSync(path.join(DIR, name), buffer);
  return `verification/${name}`;
}

export function readAsDataUrl(relPath) {
  if (!relPath) return "";
  try {
    const file = path.join(DIR, path.basename(relPath));
    const ext = path.extname(file).slice(1);
    const mime = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
    return `data:${mime};base64,${fs.readFileSync(file).toString("base64")}`;
  } catch {
    return "";
  }
}

export function removeFiles(relPaths) {
  for (const p of relPaths) {
    if (!p) continue;
    try {
      fs.unlinkSync(path.join(DIR, path.basename(p)));
    } catch {
      /* already gone */
    }
  }
}
