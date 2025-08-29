import express from "express";
import { 
  register, 
  verifyEmail, 
  login, 
  forgotPassword, 
  resetPassword,
  validateResetToken,
  logout,
  getCurrentUser,
  resendVerification,
  handleOAuthCallback,
  handleGoogleCallback
} from "./auth.controller.js";
import passport from "passport";
import { 
  validateRegistration, 
  validateLogin, 
  validateForgotPassword, 
  validateResetPassword 
} from "../middleware/validation.js";
import { 
  authLimiter, 
  resetPasswordLimiter, 
  registrationLimiter 
} from "../middleware/rateLimiter.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registrationLimiter, validateRegistration, register);
router.get("/verify/:token", verifyEmail);
router.post("/resend-verification", authLimiter, validateForgotPassword, resendVerification);
router.post("/login", authLimiter, validateLogin, login);
router.post("/logout", logout);

router.post("/forgot-password", resetPasswordLimiter, validateForgotPassword, forgotPassword);
router.get("/reset-password/:token", validateResetToken);
router.post("/reset-password/:token", authLimiter, validateResetPassword, resetPassword);

router.get("/me", authenticateToken, getCurrentUser);

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/callback", handleOAuthCallback);

router.get("/google/callback", 
  passport.authenticate("google", { failureRedirect: `${process.env.SERVER_URL}/api/auth/callback?error=oauth_failed` }),
  handleGoogleCallback
);

export default router;
