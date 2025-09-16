import express from "express";
import { 
  register, 
  verifyEmail, 
  login, 
  forgotPassword, 
  resetPassword,
  validateResetToken,
  getCurrentUser,
  resendVerification,
  handleOAuthCallback,
  handleGoogleCallback,
  updateUserProfile,
  deleteUserAccount
} from "./auth.controller.js";
import passport from "passport";
import { 
  validateRegistration, 
  validateLogin, 
  validateForgotPassword, 
  validateResendVerification,
  validateResetPassword,
  validateUserProfileUpdate
} from "../middleware/validation.js";
import { 
  authLimiter, 
  resetPasswordLimiter, 
  registrationLimiter 
} from "../middleware/rateLimiter.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Username/Password Authentication Routes
router.post("/register", registrationLimiter, validateRegistration, register);
router.get("/verify/:token", verifyEmail);
router.post("/resend-verification", authLimiter, validateResendVerification, resendVerification);
router.post("/login", authLimiter, validateLogin, login);

// Password Reset Routes
router.post("/forgot-password", resetPasswordLimiter, validateForgotPassword, forgotPassword);
router.get("/reset-password/:token", validateResetToken);
router.post("/reset-password/:token", authLimiter, validateResetPassword, resetPassword);

// Protected Routes - User Profile Management
router.get("/profile", authenticateToken, getCurrentUser);
router.patch("/profile", authenticateToken, authLimiter, validateUserProfileUpdate, updateUserProfile); 
router.delete("/account", authenticateToken, authLimiter, deleteUserAccount);

// Legacy routes (keep for backward compatibility)
router.get("/me", authenticateToken, getCurrentUser);

// Development/Debug Routes (remove in production)
if (process.env.NODE_ENV === 'development') {
  router.get("/test-email", async (req, res) => {
    try {
      const { testEmailConfiguration } = await import("../utils/sendEmail.js");
      const result = await testEmailConfiguration();
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });
}

// Google OAuth Routes
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Updated Google OAuth callback with consistent JSON responses
router.get("/google/callback", 
  (req, res, next) => {
    passport.authenticate("google", (err, user, info) => {
      if (err) {
        logError("Google OAuth authentication error", err);
        return res.status(500).json({
          success: false,
          msg: "Authentication error"
        });
      }
      if (!user) {
        logWarn("Google OAuth authentication failed", { info });
        return res.status(400).json({
          success: false,
          msg: "Authentication failed"
        });
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  handleGoogleCallback
);

// OAuth success callback handler (receives the token or error from frontend)
router.get("/callback", handleOAuthCallback);

export default router;
