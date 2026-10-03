import rateLimit from "express-rate-limit";

const makeMessage = (minutes) => ({
  success: false,
  message: `Too many attempts. Please try again in ${minutes} minutes.`,
});

export const loginLimiter = rateLimit({
  windowMs: 3 * 60 * 1000, // 3 minutes
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: makeMessage(3),
});

export const registerLimiter = rateLimit({
  windowMs: 3 * 60 * 1000, // 3minutes
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: makeMessage(3),
});

export const passwordResetLimiter = rateLimit({
  windowMs: 3 * 60 * 1000, // 3 minutes
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: makeMessage(3),
});
