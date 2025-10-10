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
  deleteUserAccount,
  debugAuthStatus,
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

router.get("/debug/status", debugAuthStatus);

// Also add a debug version of the /me endpoint
router.get("/debug/me", authenticateToken, getCurrentUser);
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

// Improved Google OAuth Routes
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
// router.get("/google", passport.authenticate("google", { 
//   scope: [
//     "profile",
//     "email",
//     "https://www.googleapis.com/auth/user.phonenumbers.read",
//     "https://www.googleapis.com/auth/user.addresses.read"
//   ] 
// }));

// Updated Google OAuth callback with consistent JSON responses
router.get("/google/callback", 
  passport.authenticate("google", { failureRedirect: `${process.env.CLIENT_URL}/auth/error?error=oauth_failed` }),
  handleGoogleCallback
);

// OAuth success callback handler (receives the token or error from frontend)
router.get("/callback", handleOAuthCallback);





export default router;
