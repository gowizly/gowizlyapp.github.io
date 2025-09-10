import multer from "multer";
import path from "path";
import fs from "fs";
import { logError } from "./logger.js";

// Ensure uploads directory exists
export const ensureUploadsDirectory = () => {
  const uploadsDir = './uploads/children';
  if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
  }
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
};

// Multer storage configuration
const createStorage = (directory) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, directory);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `child-${req.params.childId}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  });
};

// File filter for images only
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Create multer upload middleware for child photos
export const createChildPhotoUpload = () => {
  const uploadsDir = ensureUploadsDirectory();
  
  return multer({
    storage: createStorage(uploadsDir),
    fileFilter: imageFileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  });
};

// Create multer upload middleware for assistant photo analysis (memory storage)
export const createAssistantPhotoUpload = () => {
  return multer({
    storage: multer.memoryStorage(), // Store in memory instead of disk
    fileFilter: imageFileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit for analysis
    }
  });
};

// Multer error handler middleware
export const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      logError('File upload size limit exceeded', error, { userId: req.user?.id });
      return res.status(400).json({
        success: false,
        msg: 'File too large. Maximum size is 5MB.'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed') {
    logError('Invalid file type uploaded', error, { userId: req.user?.id });
    return res.status(400).json({
      success: false,
      msg: 'Only image files are allowed for profile photos.'
    });
  }
  
  next(error);
};
