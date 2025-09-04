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

// All routes require authentication
router.use(authenticateToken);

// Calendar view routes
router.get('/monthly', getMonthlyCalendar); // GET /api/calendar/monthly?year=2024&month=3&childId=1
router.get('/date-range', getEventsByDateRange); // GET /api/calendar/date-range?startDate=2024-03-01&endDate=2024-03-31&childId=1
router.get('/upcoming', getUpcomingEvents); // GET /api/calendar/upcoming?days=7&childId=1
router.get('/statistics', getCalendarStatistics); // GET /api/calendar/statistics?childId=1

// Event CRUD routes
router.get('/events', getAllEvents); // GET /api/calendar/events?childId=1&type=homework&limit=50&offset=0
router.get('/events/:eventId', getEventById); // GET /api/calendar/events/:eventId
router.post('/events', authLimiter, validateEvent, createEvent); // POST /api/calendar/events
router.put('/events/:eventId', authLimiter, validateEventUpdate, updateEvent); // PUT /api/calendar/events/:eventId
router.patch('/events/:eventId', authLimiter, validateEventUpdate, updateEvent); // PATCH /api/calendar/events/:eventId (partial update)
router.delete('/events/:eventId', authLimiter, deleteEvent); // DELETE /api/calendar/events/:eventId

// Utility routes
router.get('/event-colors', getEventTypeColors); // GET /api/calendar/event-colors

export default router;
