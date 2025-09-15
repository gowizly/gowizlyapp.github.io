import express from "express";
import {
  getChildren,
  getChildById,
  addChild,
  updateChild,
  deleteChild,
  getEventsByChildId,
} from "./child.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { validateChild, validateChildUpdate } from "../middleware/validation.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Child CRUD Routes
router.get('/', getChildren); // GET /api/children
router.get('/:childId', getChildById); // GET /api/children/:childId
router.post('/', authLimiter, validateChild, addChild); // POST /api/children
router.put('/:childId', authLimiter, validateChildUpdate, updateChild); // PUT /api/children/:childId
router.patch('/:childId', authLimiter, validateChildUpdate, updateChild); // PATCH /api/children/:childId (partial update)
router.delete('/:childId', authLimiter, deleteChild); // DELETE /api/children/:childId

// Child Specific Event Routes
router.get('/:childId/events', getEventsByChildId); // GET /api/children/:childId/events?type=EXAM&startDate=2024-03-01&endDate=2024-03-31&limit=50&offset=0

export default router;
