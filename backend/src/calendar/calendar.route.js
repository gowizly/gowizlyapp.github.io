import express from "express";
import {
  getAllEvents,
  getMonthlyCalendar,
  getEventsByDateRange,
  getUpcomingEvents,
  createEvent,
  getEventById,
  updateEvent,
  deleteEvent,
  getCalendarStatistics,
  getEventTypeColors
} from "./calendar.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { validateEvent, validateEventUpdate } from "../middleware/validation.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.use(authenticateToken);

router.get('/monthly', getMonthlyCalendar);
router.get('/date-range', getEventsByDateRange);
router.get('/upcoming', getUpcomingEvents);
router.get('/statistics', getCalendarStatistics);

router.get('/events', getAllEvents);
router.get('/events/:eventId', getEventById);
router.post('/events', authLimiter, validateEvent, createEvent);
router.put('/events/:eventId', authLimiter, validateEventUpdate, updateEvent);
router.delete('/events/:eventId', authLimiter, deleteEvent);

router.get('/event-colors', getEventTypeColors);

export default router;
