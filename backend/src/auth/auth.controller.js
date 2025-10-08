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

// Debug version of getCurrentUser with extensive logging
export const getCurrentUser = async (req, res) => {
  console.log('=== GET /api/auth/me DEBUG START ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // Log all request details
    console.log('Request headers:', {
      authorization: req.headers.authorization ? 'Bearer ' + req.headers.authorization.split(' ')[1]?.substring(0, 10) + '...' : 'none',
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']?.substring(0, 50),
    });
    
    console.log('Request user from middleware:', {
      hasReqUser: !!req.user,
      userId: req.user?.id,
      userEmail: req.user?.email,
      userVerified: req.user?.isVerified
    });
    
    // Log session info if using Passport
    console.log('Session info:', {
      hasSession: !!req.session,
      sessionId: req.sessionID,
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : 'not a function',
      sessionUser: req.session?.user?.id || 'none'
    });

    // Check if user exists in request (set by auth middleware)
    if (!req.user || !req.user.id) {
      console.log('❌ Authentication check failed');
      console.log('req.user exists:', !!req.user);
      console.log('req.user.id exists:', !!req.user?.id);
      
      return res.status(401).json({
        success: false,
        msg: "Authentication required",
        debug: {
          hasReqUser: !!req.user,
          userKeys: req.user ? Object.keys(req.user) : [],
          timestamp: new Date().toISOString()
        }
      });
    }

    console.log('✅ Authentication check passed, userId:', req.user.id);
    
    logInfo('Get current user request', { userId: req.user.id });

    // Test database connection first
    console.log('Testing database connection...');
    try {
      const dbTest = await prisma.$queryRaw`SELECT 1 as test`;
      console.log('✅ Database connection successful:', dbTest);
    } catch (dbError) {
      console.log('❌ Database connection failed:', {
        error: dbError.message,
        code: dbError.code,
        name: dbError.name
      });
      
      logError('Database connection failed in getCurrentUser', dbError);
      return res.status(503).json({
        success: false,
        msg: "Database service unavailable",
        debug: {
          dbError: dbError.message,
          code: dbError.code
        }
      });
    }

    console.log('Querying user from database, userId:', req.user.id);
    
    // Query the user
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        address: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    console.log('Database query result:', {
      userFound: !!user,
      userId: user?.id,
      userEmail: user?.email,
      isVerified: user?.isVerified
    });

    if (!user) {
      console.log('❌ User not found in database');
      logWarn('User not found in get current user', { userId: req.user.id });
      return res.status(404).json({
        success: false,
        msg: "User not found",
        debug: {
          searchedUserId: req.user.id,
          timestamp: new Date().toISOString()
        }
      });
    }

    console.log('✅ User found successfully');
    logInfo('Current user retrieved successfully', { userId: req.user.id });

    const responseData = {
      success: true,
      msg: "Current user retrieved successfully",
      data: {
        user: {
          ...user,
          childrenCount: 0
        }
      }
    };

    console.log('Sending response:', {
      success: responseData.success,
      userId: responseData.data.user.id,
      username: responseData.data.user.username
    });

    console.log('=== GET /api/auth/me DEBUG END SUCCESS ===');
    res.json(responseData);

  } catch (error) {
    console.log('❌ ERROR in getCurrentUser:', {
      errorName: error.name,
      errorMessage: error.message,
      errorCode: error.code,
      errorStack: error.stack?.split('\n').slice(0, 5).join('\n'),
      userId: req.user?.id
    });
    
    logError("Get current user error", error, { 
      userId: req.user?.id,
      errorName: error.name,
      errorMessage: error.message
    });
    
    // Handle specific database errors
    if (error.code === 'P1001' || error.code === 'P1002') {
      console.log('Database connection error detected');
      return res.status(503).json({
        success: false,
        msg: "Database connection error",
        debug: {
          errorCode: error.code,
          errorMessage: error.message
        }
      });
    }

    console.log('=== GET /api/auth/me DEBUG END ERROR ===');
    res.status(500).json({
      success: false,
      msg: "Internal server error",
      debug: {
        errorName: error.name,
        errorMessage: error.message,
        errorCode: error.code,
        timestamp: new Date().toISOString()
      }
    });
  }
};

// Also add this temporary debug route to test without authentication
export const debugAuthStatus = async (req, res) => {
  console.log('=== DEBUG AUTH STATUS ===');
  
  try {
    // Test database connection
    const dbTest = await prisma.$queryRaw`SELECT 1 as test, NOW() as timestamp`;
    console.log('Database test result:', dbTest);
    
    // Check environment variables
    const envCheck = {
      hasJwtSecret: !!process.env.JWT_SECRET,
      jwtSecretLength: process.env.JWT_SECRET?.length || 0,
      nodeEnv: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...' || 'none'
    };
    console.log('Environment check:', envCheck);
    
    // Get total user count
    const userCount = await prisma.user.count();
    
    res.json({
      success: true,
      debug: {
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
          testResult: dbTest,
          userCount: userCount
        },
        environment: envCheck,
        request: {
          hasAuthHeader: !!req.headers.authorization,
          hasSession: !!req.session,
          sessionId: req.sessionID,
          userAgent: req.headers['user-agent']?.substring(0, 100)
        }
      }
    });
    
  } catch (error) {
    console.log('Debug route error:', error);
    res.status(500).json({
      success: false,
      error: {
        name: error.name,
        message: error.message,
        code: error.code
      }
    });
  }
};

// OAuth Callback Handler
export const handleOAuthCallback = async (req, res) => {
  try {
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
  } catch (error) {
    logError("OAuth callback error", error);
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// Google OAuth Callback Handler
// export const handleGoogleCallback = async (req, res) => {
//   try {
//     logInfo('Google OAuth callback received', { userId: req.user?.id });
    
//     if (!req.user) {
//       logError('OAuth callback - No user data received');
//       return res.redirect(`${process.env.CLIENT_URL}/auth/error?error=no_user_data`);
//     }

//     // Generate JWT token for the OAuth user
//     const token = jwt.sign(
//       { id: req.user.id },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );
    
//     logInfo('OAuth callback - JWT generated, redirecting', { userId: req.user.id });
    
//     // Redirect to frontend auth success page with token
//     const welcomeTemplate = getWelcomeEmailTemplate(user.username);
//     await sendEmail(user.email, "Welcome to GoWizly!", welcomeTemplate);
    
//     logInfo('Welcome email sent', { userId: user.id, email: user.email });
//     res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
//   } catch (error) {
//     logError("OAuth callback error", error, { userId: req.user?.id });
//     res.redirect(`${process.env.CLIENT_URL}/auth/error?error=oauth_callback_failed`);
//   }
// };

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

    // Send welcome email only if user is logging in first time
    if (!req.user.welcomeEmailSent) {
      // Mark user as verified (OAuth is trusted) and welcome email as sent
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          isVerified: true,
          welcomeEmailSent: true
        }
      });

      logInfo('Sending welcome email for first-time OAuth user', { userId: req.user.id, email: req.user.email });

      // Send the welcome email
      const welcomeTemplate = getWelcomeEmailTemplate(req.user.username);
      await sendEmail(req.user.email, "Welcome to GoWizly!", welcomeTemplate);

      logInfo('Welcome email sent successfully', { userId: req.user.id, email: req.user.email });
    }

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
    // Check authentication
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        msg: "Authentication required"
      });
    }

    const { 
      username,
      email,
      address 
    } = req.body;
    
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
      hasUsername: username !== undefined,
      hasAddress: address !== undefined
    });

    // Verify database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (dbError) {
      logError('Database connection failed in updateUserProfile', dbError);
      return res.status(503).json({
        success: false,
        msg: "Database service unavailable"
      });
    }

    // Build update data object with only provided fields (excluding email)
    const updateData = {};
    
    if (username !== undefined) {
      if (typeof username !== 'string' || username.trim().length === 0) {
        return res.status(400).json({
          success: false,
          msg: "Username must be a non-empty string"
        });
      }
      updateData.username = username.trim();
    }
    
    if (address !== undefined) {
      if (typeof address !== 'string') {
        return res.status(400).json({
          success: false,
          msg: "Address must be a string"
        });
      }
      updateData.address = address.trim();
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
    if (updateData.username) {
      try {
        const existingUser = await prisma.user.findFirst({
          where: {
            AND: [
              { id: { not: req.user.id } }, // Exclude current user
              { username: updateData.username }
            ]
          }
        });

        if (existingUser) {
          logWarn('Duplicate username in update', { 
            userId: req.user.id, 
            username: updateData.username
          });
          return res.status(400).json({
            success: false,
            msg: "Username already exists"
          });
        }
      } catch (checkError) {
        logError('Error checking username availability', checkError);
        return res.status(500).json({
          success: false,
          msg: "Error validating username"
        });
      }
    }

    // CRITICAL FIX: Check if user exists before attempting update
    const userExists = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!userExists) {
      logError('User not found during profile update', null, { userId: req.user.id });
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    // Update user with proper error handling
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
      updatedFields: Object.keys(updateData).filter(key => key !== 'updatedAt')
    });

    res.json({
      success: true,
      msg: "Profile updated successfully",
      data: { user: updatedUser }
    });

  } catch (error) {
    logError("Update user profile error", error, { 
      userId: req.user?.id,
      errorName: error.name,
      errorCode: error.code,
      errorMessage: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    // Handle Prisma specific errors
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      return res.status(400).json({
        success: false,
        msg: field === 'username' ? 'Username already exists' : 'Field already exists'
      });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }
    
    // Handle database connection errors
    if (error.code === 'P1001' || error.code === 'P1002' || error.code === 'P1008') {
      return res.status(503).json({
        success: false,
        msg: "Database connection error"
      });
    }

    // Handle database timeout errors
    if (error.code === 'P1017') {
      return res.status(503).json({
        success: false,
        msg: "Database timeout error"
      });
    }
    
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
