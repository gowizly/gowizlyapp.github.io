import express from "express";
import {
  analyzeEmail,
  analyzePhoto,
} from "./assistant.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { validateEmailAnalysis } from "../middleware/validation.js";
import { createAssistantPhotoUpload, handleMulterError } from "../utils/uploadConfig.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Configure multer for photo uploads
const upload = createAssistantPhotoUpload();

// Email analysis routes
router.post('/analyze-email', authLimiter, validateEmailAnalysis, analyzeEmail); 

// Photo analysis routes
router.post('/analyze-photo', authLimiter, upload.single('photo'), handleMulterError, analyzePhoto); 

export default router;
