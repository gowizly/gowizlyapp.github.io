import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import prisma from "../config/db.js";
import { generateToken } from "../utils/generateToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import { getVerificationEmailTemplate, getPasswordResetEmailTemplate, getWelcomeEmailTemplate } from "../utils/emailTemplates.js";
import { logInfo, logError, logWarn, logDebug } from "../utils/logger.js";

// Register
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    logInfo('User registration attempt', { username, email });

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      // Check if EMAIL already exists
      if (existingUser.email === email.trim()) {
        logWarn('Registration failed - email already exists', { 
          email, 
          isVerified: existingUser.isVerified 
        });
        
        if (!existingUser.isVerified) {
          // Email exists but not verified
          return res.status(400).json({
            success: false,
            msg: "This email is already registered but not verified",
            errorMsg: "Email already registered", 
            isVerified: false,
            needsVerification: true
          });
        } else {
          // Email exists and is verified
          return res.status(400).json({
            success: false,
            msg: "This email is already registered and verified. Please login instead.",
            errorMsg: "Email already registered",
            isVerified: true
          });
        }
      }
      
      // Check if USERNAME already exists (separate check)
      if (existingUser.username === username.trim()) {
        logWarn('Registration failed - username already taken', { username });
        return res.status(400).json({
          success: false,
          msg: "Username already taken",
          errors: {
            username: "Username already taken"
          }
        });
      }
    }

    // Hash password
    const saltRounds = 12;
    logDebug('Hashing password', { saltRounds });
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    logDebug('Creating new user in database', { username, email });
    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        email: email.trim(),
        password: hashedPassword
      },
      select: {
        id: true,
        username: true,
        email: true,
        isVerified: true,
        createdAt: true
      }
    });

    logInfo('User created successfully', { userId: user.id, username: user.username, email: user.email });

    // Generate verification token (expires in 24 hours)
    const verifyToken = jwt.sign(
      { id: user.id, type: 'verification' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const verifyLink = `${process.env.CLIENT_URL}/verify/${verifyToken}`;
    
    // Send verification email with template
    logDebug('Sending verification email', { email: user.email, userId: user.id });
    const emailTemplate = getVerificationEmailTemplate(user.username, verifyLink);
    await sendEmail(user.email, "Verify Your GoWizly Account", emailTemplate);
    
    logInfo('Verification email sent successfully', { userId: user.id, email: user.email });

    res.status(201).json({
      success: true,
      msg: "Registration successful! Please check your email to verify your account.",
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isVerified: user.isVerified
        }
      }
    });
  } catch (error) {
    logError("Registration error", error, { username: req.body?.username, email: req.body?.email });
    res.status(500).json({
      success: false,
      msg: "Internal server error. Please try again later."
    });
  }
};


// Verify Email
export const verifyEmail = async (req, res) => {
  try {
    const token = req.params.token;
    
    logInfo('Email verification attempt', { tokenLength: token.length });
    
    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    logDebug('Token decoded successfully', { userId: decoded.id, tokenType: decoded.type });
    
    // Check if token is for verification
    if (decoded.type !== 'verification') {
      logWarn('Invalid token type for verification', { tokenType: decoded.type, userId: decoded.id });
      return res.status(400).json({
        success: false,
        msg: "Invalid verification token"
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        email: true,
        isVerified: true
      }
    });

    if (!user) {
      logWarn('Verification failed - user not found', { userId: decoded.id });
      return res.status(400).json({
        success: false,
        msg: "User not found"
      });
    }

    if (user.isVerified) {
      logWarn('Verification attempt on already verified user', { userId: user.id, email: user.email });
      return res.status(400).json({
        success: false,
        msg: "Email already verified"
      });
    }

    // Update user verification status
    logDebug('Updating user verification status', { userId: user.id });
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
      select: {
        id: true,
        username: true,
        email: true,
        isVerified: true,
        createdAt: true
      }
    });

    logInfo('User email verified successfully', { userId: user.id, email: user.email });

    // Send welcome email
    logDebug('Sending welcome email', { userId: user.id, email: user.email });
    const welcomeTemplate = getWelcomeEmailTemplate(user.username);
    await sendEmail(user.email, "Welcome to GoWizly!", welcomeTemplate);
    
    logInfo('Welcome email sent', { userId: user.id, email: user.email });

    res.json({
      success: true,
      msg: "Email verified successfully! You can now log in.",
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    logError("Email verification error", error, { token: req.params.token });
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        msg: "Invalid or expired verification token"
      });
    }
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    logInfo('Login attempt', { email });

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        email: true,
        password: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      logWarn('Login failed - user not found', { email });
      return res.status(401).json({
        success: false,
        msg: "Invalid email or password"
      });
    }

    if (!user.isVerified) {
      logWarn('Login failed - email not verified', { userId: user.id, email });
      return res.status(401).json({
        success: false,
        msg: "Please verify your email address before logging in"
      });
    }

    // Check password
    logDebug('Validating password', { userId: user.id });
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logWarn('Login failed - invalid password', { userId: user.id, email });
      return res.status(401).json({
        success: false,
        msg: "Invalid email or password"
      });
    }

    // Generate token
    logDebug('Generating JWT token', { userId: user.id });
    const token = generateToken(user);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    logInfo('Login successful', { userId: user.id, email, username: user.username });

    res.json({
      success: true,
      msg: "Login successful",
      data: {
        token,
        user: userWithoutPassword
      }
    });
  } catch (error) {
    logError("Login error", error, { email: req.body?.email });
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        email: true,
        isVerified: true
      }
    });

    // Always return success message for security (don't reveal if email exists)
    const successResponse = {
      success: true,
      msg: "If an account with this email exists, you will receive a password reset link."
    };

    if (!user) {
      return res.json(successResponse);
    }

    if (!user.isVerified) {
      return res.json(successResponse);
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpire = new Date(Date.now() + 3600000); // 1 hour

    // Save reset token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpire
      }
    });

    // Send password reset email
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const emailTemplate = getPasswordResetEmailTemplate(user.username, resetLink);
    await sendEmail(email, "Reset Your GoWizly Password", emailTemplate);

    res.json(successResponse);
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// Validate Reset Token (GET request to check if token is valid)
export const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    logInfo('Password reset token validation', { tokenLength: token.length });

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpire: { gt: new Date() }
      },
      select: {
        id: true,
        username: true,
        email: true
      }
    });

    if (!user) {
      logWarn('Invalid or expired reset token', { token });
      return res.status(400).json({
        success: false,
        msg: "Invalid or expired reset token"
      });
    }

    logInfo('Reset token validated successfully', { userId: user.id, email: user.email });

    res.json({
      success: true,
      msg: "Reset token is valid. You can now set a new password.",
      data: {
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    logError("Validate reset token error", error, { token: req.params.token });
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpire: { gt: new Date() }
      },
      select: {
        id: true,
        username: true,
        email: true,
        isVerified: true
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        msg: "Invalid or expired reset token"
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpire: null
      }
    });

    res.json({
      success: true,
      msg: "Password reset successful. You can now log in with your new password."
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// Logout (for token invalidation - client-side mainly)
export const logout = async (req, res) => {
  try {
    // In a JWT setup, logout is mainly handled client-side by removing the token
    // But we can log the action for security purposes
    res.json({
      success: true,
      msg: "Logged out successfully"
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// Get current user profile
export const getCurrentUser = async (req, res) => {
  try {
    logInfo('Get current user request', { userId: req.user.id });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        address: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      logWarn('User not found in get current user', { userId: req.user.id });
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    logInfo('Current user retrieved successfully', { userId: req.user.id });

    res.json({
      success: true,
      msg: "Current user retrieved successfully",
      data: {
        user: {
          ...user,
          childrenCount: user.children?.length || 0
        }
      }
    });

  } catch (error) {
    logError("Get current user error", error, { userId: req.user?.id });
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// OAuth Callback Handler
export const handleOAuthCallback = async (req, res) => {
  const { token, error } = req.query;
  
  if (error) {
    logWarn('OAuth callback error received', { error });
    return res.status(400).json({
      success: false,
      msg: "Authentication failed",
      error: error
    });
  }
  
  if (!token) {
    logWarn('OAuth callback missing token');
    return res.status(400).json({
      success: false,
      msg: "No authentication token provided"
    });
  }

  logInfo('OAuth callback successful', { tokenLength: token.length });

  res.json({
    success: true,
    msg: "Authentication successful",
    data: {
      token: token,
      expiresIn: "7d"
    }
  });
};

// Google OAuth Callback Handler
export const handleGoogleCallback = async (req, res) => {
  try {
    logInfo('Google OAuth callback received', { userId: req.user?.id });
    
    if (!req.user) {
      logError('OAuth callback - No user data received');
      return res.redirect(`${process.env.CLIENT_URL}/auth/error?error=no_user_data`);
    }

    // Generate JWT token for the OAuth user
    const token = jwt.sign(
      { id: req.user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    logInfo('OAuth callback - JWT generated, redirecting', { userId: req.user.id });
    
    // Redirect to frontend auth success page with token
    res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
  } catch (error) {
    logError("OAuth callback error", error, { userId: req.user?.id });
    res.redirect(`${process.env.CLIENT_URL}/auth/error?error=oauth_callback_failed`);
  }
};

// Fixed Resend verification email function
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    logInfo('Resend verification email request', { email });

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
      select: {
        id: true,
        username: true,
        email: true,
        isVerified: true
      }
    });

    if (!user) {
      logWarn('Resend verification - user not found', { email });
      return res.status(404).json({
        success: false,
        msg: "User not found with this email address"
      });
    }

    if (user.isVerified) {
      logWarn('Resend verification - email already verified', { userId: user.id, email });
      return res.status(400).json({
        success: false,
        msg: "Email is already verified"
      });
    }

    // Generate new verification token (expires in 24 hours)
    const verifyToken = jwt.sign(
      { id: user.id, type: 'verification' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Fix: Correct verification link - should match your verify route
    const verifyLink = `${process.env.CLIENT_URL}/verify/${verifyToken}`;
    
    logDebug('Resending verification email', { 
      userId: user.id, 
      email: user.email,
      verifyLink 
    });

    // Send verification email with template
    const emailTemplate = getVerificationEmailTemplate(user.username, verifyLink);
    await sendEmail(user.email, "Verify Your GoWizly Account", emailTemplate);
    
    logInfo('Verification email resent successfully', { userId: user.id, email: user.email });

    res.json({
      success: true,
      msg: "Verification email sent successfully. Please check your email to verify your account.",
      data: {
        email: user.email,
        username: user.username
      }
    });

  } catch (error) {
    logError("Resend verification error", error, { email: req.body?.email });
    res.status(500).json({
      success: false,
      msg: "Internal server error. Please try again later."
    });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = {};

    // Only include fields that are provided
    const allowedFields = ['username', 'email'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        msg: "No valid fields provided for update"
      });
    }

    // Check if username already exists (if updating username)
    if (updateData.username) {
      const existingUser = await prisma.user.findUnique({
        where: { 
          username: updateData.username,
          NOT: { id: userId }
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          msg: "Username already exists"
        });
      }
    }

    // Check if email already exists (if updating email)
    if (updateData.email) {
      const existingUser = await prisma.user.findUnique({
        where: { 
          email: updateData.email,
          NOT: { id: userId }
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          msg: "Email already exists"
        });
      }

      // If email is being updated, mark as unverified
      updateData.isVerified = false;
    }

    updateData.updatedAt = new Date();

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    logInfo("User profile updated successfully", { 
      userId,
      updatedFields: Object.keys(updateData)
    });

    res.json({
      success: true,
      msg: "Profile updated successfully",
      data: { user: updatedUser }
    });

  } catch (error) {
    logError("Update user profile error", error, { userId: req.user?.id });
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// Get current user profile (authenticated user)
export const getUserProfile = async (req, res) => {
  try {
    logInfo('Get user profile request', { userId: req.user.id });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        address: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      logWarn('User not found in get profile', { userId: req.user.id });
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    logInfo('User profile retrieved successfully', { userId: req.user.id });

    res.json({
      success: true,
      msg: "Profile retrieved successfully",
      data: { user }
    });

  } catch (error) {
    logError("Get user profile error", error, { userId: req.user?.id });
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// Update user profile (PATCH - partial update)
export const patchUserProfile = async (req, res) => {
  try {
    const { username, email, address } = req.body;
    
    // Reject email update attempts
    if (email !== undefined) {
      logWarn('Email update attempt blocked', { userId: req.user.id });
      return res.status(400).json({
        success: false,
        msg: "Email cannot be changed. Contact support if you need to update your email address."
      });
    }
    
    logInfo('Update user profile request', { 
      userId: req.user.id, 
      hasUsername: !!username,
      hasAddress: !!address
    });

    // Build update data object with only provided fields (excluding email)
    const updateData = {};
    
    if (username !== undefined) {
      updateData.username = username;
    }
    
    if (address !== undefined) {
      updateData.address = address;
    }

    // If no fields provided, return error
    if (Object.keys(updateData).length === 0) {
      logWarn('No fields provided for update', { userId: req.user.id });
      return res.status(400).json({
        success: false,
        msg: "No valid fields provided for update"
      });
    }

    updateData.updatedAt = new Date();

    // Check if username already exists (if being updated)
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: req.user.id } }, // Exclude current user
            { username }
          ]
        }
      });

      if (existingUser) {
        logWarn('Duplicate username in update', { 
          userId: req.user.id, 
          username
        });
        return res.status(400).json({
          success: false,
          msg: "Username already exists"
        });
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        address: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    logInfo('User profile updated successfully', { 
      userId: req.user.id,
      updatedFields: Object.keys(updateData)
    });

    res.json({
      success: true,
      msg: "Profile updated successfully",
      data: { user: updatedUser }
    });

  } catch (error) {
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      logWarn('Unique constraint violation in update', { 
        userId: req.user.id, 
        field,
        error: error.message 
      });
      return res.status(400).json({
        success: false,
        msg: field === 'username' ? 'Username already exists' : 'Field already exists'
      });
    }

    logError("Update user profile error", error, { userId: req.user?.id });
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// Delete user account (authenticated user) - Token-based deletion
export const deleteUserAccount = async (req, res) => {
  try {
    logInfo('Delete user account request', { userId: req.user.id });

    // Get user for logging purposes
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, email: true }
    });

    if (!user) {
      logWarn('User not found for deletion', { userId: req.user.id });
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    // Delete user (cascading deletes will handle children and events)
    await prisma.user.delete({
      where: { id: req.user.id }
    });

    logInfo('User account deleted successfully', { 
      userId: req.user.id,
      username: user.username,
      email: user.email
    });

    res.json({
      success: true,
      msg: "Account deleted successfully",
      data: {
        deletedUser: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      }
    });

  } catch (error) {
    logError("Delete user account error", error, { userId: req.user?.id });
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};
