import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { authLimiter } from "../middleware/rateLimiter.middleware.js";
import { sanitizeBody } from "../middleware/sanitize.middleware.js";
import { body } from "express-validator";
import passport from "../config/passport.js";
import { validationRules } from "../utils/validators.js";

const router = Router();
const authController = new AuthController();

//  /auth/register
router.post(
  "/register",
  authLimiter, // Rate limit registration attempts
  sanitizeBody, // Sanitize inputs
  validate([
    validationRules.username(),
    validationRules.email(),
    validationRules.password(),
  ]),
  authController.register
);

// /auth/login
router.post(
  "/login",
  authLimiter,
  sanitizeBody,
  validate([
    validationRules.requiredString("username"),
    validationRules.requiredString("password"),
  ]),
  authController.login
);

// /auth/refresh-token:
router.post("/refresh-token", authController.refreshToken);

// /auth/logout
router.post("/logout", authController.logout);

// /auth/forgot-password
router.post(
  "/forgot-password",
  authLimiter,
  sanitizeBody,
  validate([validationRules.email()]),
  authController.requestPasswordReset
);

// /auth/reset-password
router.post(
  "/reset-password",
  authLimiter,
  sanitizeBody,
  validate([validationRules.token(), validationRules.password()]),
  authController.resetPassword
);

// /auth/google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// /auth/google/callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  authController.googleCallback
);

export const authRoutes = router;
