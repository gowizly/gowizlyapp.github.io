import express from "express";
import {
  getChildren,
  getChildById,
  addChild,
  updateChild,
  deleteChild,
  uploadChildPhoto,
  // COMMENTED OUT - Google Classroom Integration
  // initiateGoogleClassroomAuth,
  // handleGoogleClassroomCallback,
  // getGoogleClassroomData,
  // disconnectGoogleClassroom
} from "./child.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { validateChild, validateChildUpdate } from "../middleware/validation.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { createChildPhotoUpload, handleMulterError } from "../utils/uploadConfig.js";

const router = express.Router();

// Configure multer upload for child photos
const upload = createChildPhotoUpload();

// All routes require authentication
router.use(authenticateToken);

// Child CRUD Routes
router.get('/', getChildren); // GET /api/children
router.get('/:childId', getChildById); // GET /api/children/:childId
router.post('/', authLimiter, validateChild, addChild); // POST /api/children
router.put('/:childId', authLimiter, validateChildUpdate, updateChild); // PUT /api/children/:childId
router.patch('/:childId', authLimiter, validateChildUpdate, updateChild); // PATCH /api/children/:childId (partial update)
router.delete('/:childId', authLimiter, deleteChild); // DELETE /api/children/:childId

// Photo upload route
router.post('/:childId/photo', authLimiter, upload.single('photo'), uploadChildPhoto);

// Google Classroom integration routes
// COMMENTED OUT - Google Classroom Integration
/*
router.get('/:childId/google-classroom/auth', authLimiter, initiateGoogleClassroomAuth);
router.get('/google-classroom/callback', handleGoogleClassroomCallback); // No auth required for callback
router.get('/:childId/google-classroom/data', getGoogleClassroomData);
router.post('/:childId/google-classroom/disconnect', authLimiter, disconnectGoogleClassroom);
*/

// Error handling middleware for multer
router.use(handleMulterError);

export default router;
