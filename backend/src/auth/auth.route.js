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
  handleGoogleCallback,
  updateUserProfile
} from "./auth.controller.js";
import passport from "passport";
import { 
  validateRegistration, 
  validateLogin, 
  validateForgotPassword, 
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
router.post("/resend-verification", authLimiter, validateForgotPassword, resendVerification);
router.post("/login", authLimiter, validateLogin, login);
router.post("/logout", logout);

// Password Reset Routes
router.post("/forgot-password", resetPasswordLimiter, validateForgotPassword, forgotPassword);
router.get("/reset-password/:token", validateResetToken); // Validate reset token
router.post("/reset-password/:token", authLimiter, validateResetPassword, resetPassword);

// Protected Routes
router.get("/me", authenticateToken, getCurrentUser);
router.put("/me", authenticateToken, authLimiter, validateUserProfileUpdate, updateUserProfile);
router.patch("/me", authenticateToken, authLimiter, validateUserProfileUpdate, updateUserProfile);

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

// Google OAuth callback - handles the response from Google
router.get("/google/callback", 
  passport.authenticate("google", { failureRedirect: `${process.env.CLIENT_URL}/auth/error?error=oauth_failed` }),
  handleGoogleCallback
);

// OAuth success callback handler (receives the token or error from frontend)
router.get("/callback", handleOAuthCallback);

export default router;
