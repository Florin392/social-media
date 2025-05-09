import rateLimit from "express-rate-limit";
import { environment } from "../config/environment.js";
import { getClientIp } from "../utils/validators.js";

//generic rate limiter
export const createRateLimiter = (
  windowMs: number = 15 * 60 * 1000, // 15 minutes by default
  max: number = 100,
  message: string = "Too many requests, please try again later"
) => {
  const limiter = rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: "error", message },
    skip: (req) => environment.nodeEnv === "development", // skip rate limiting in dev mode
    keyGenerator: (req) => {
      const ip = getClientIp(req);
      return `ratelimit:${ip}`;
    },
  });
  return limiter;
};

// rate limiter for authentication endpoints
export const authLimiter = createRateLimiter(
  15 * 60 * 1000,
  5, // 5 attempts
  "Too many login attempts, please try again later."
);

// rate limiter for API endpoints
export const apiLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  60, // 60 attempts
  "Too many requests, please try again later"
);
