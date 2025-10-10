import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import "./config/passport.js";
import authRoutes from "./auth/auth.route.js";
import childRoutes from "./child/child.route.js";
import calendarRoutes from "./calendar/calendar.route.js";
import assistantRoutes from "./assisstant/assistant.route.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { requestLogger, logInfo } from "./utils/logger.js";
import emailRoutes from "./emailFetch/email.routes.js"

dotenv.config();

const app = express();
app.set("trust proxy", 1);
// Request logging middleware 
app.use(requestLogger);

// Security middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());

// Session configuration for Passport
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    msg: "GoWizly API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/children", childRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/assistant", assistantRoutes);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

app.use('/emailfetch',emailRoutes);

// ========================================
// REACT FRONTEND SERVING CONFIGURATION
// ========================================

// Serve React build files (static assets)
app.use(express.static(path.join(__dirname, '../build')));

// Handle React routing - serve index.html for all non-API routes
app.use((req, res, next) => {
  // Skip API routes and uploads - let them fall through to 404 handler
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return next();
  }
  
  // Only handle GET requests for React routing
  if (req.method === 'GET') {
    return res.sendFile(path.join(__dirname, '../build/index.html'));
  }
  
  next();
});

// ========================================
// ERROR HANDLING
// ========================================

// 404 handler for unmatched API routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  logInfo('GoWizly Server started', {
    port: PORT,
    environment: process.env.NODE_ENV,
    clientUrl: process.env.CLIENT_URL,
    logLevel: process.env.LOG_LEVEL
  });
  
  console.log(`🚀 GoWizly Server running on port ${PORT}`);
  console.log(`📧 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL}`);
});
