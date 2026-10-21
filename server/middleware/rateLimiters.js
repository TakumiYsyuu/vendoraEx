import rateLimit from "express-rate-limit";

const makeMessage = (minutes) => ({
  success: false,
  message: `Too many attempts. Please try again in ${minutes} minutes.`,
});

const tooFast = {
  success: false,
  message: "You're sending messages too fast. Please wait a moment.",
};

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

const perUser = (req) => String(req.user.userId);

export const messageBurstLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  limit: 10,
  keyGenerator: perUser,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: tooFast,
});

export const messageSustainedLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 30,
  keyGenerator: perUser,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: tooFast,
});
