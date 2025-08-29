import express from "express";
import {
  getChildren,
  getChildById,
  addChild,
  updateChild,
  deleteChild,
  uploadChildPhoto,
} from "./child.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { validateChild, validateChildUpdate } from "../middleware/validation.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { createChildPhotoUpload, handleMulterError } from "../utils/uploadConfig.js";

const router = express.Router();

const upload = createChildPhotoUpload();

router.use(authenticateToken);

router.get('/', getChildren);
router.get('/:childId', getChildById);
router.post('/', authLimiter, validateChild, addChild);
router.put('/:childId', authLimiter, validateChildUpdate, updateChild);
router.delete('/:childId', authLimiter, deleteChild);

router.post('/:childId/photo', authLimiter, upload.single('photo'), uploadChildPhoto);

router.use(handleMulterError);

export default router;
