import prisma from "../config/db.js";
import calendarService from "../services/calendar.service.js";
import { logInfo, logError, logWarn, logDebug } from "../utils/logger.js";

// Get all events for a user (with optional filtering)
export const getAllEvents = async (req, res) => {
  try {
    const { childId, type, limit = 50, offset = 0 } = req.query;
    
    logInfo('Get all events request', { 
      userId: req.user.id, 
      childId, 
      type, 
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Build filter conditions
    const whereConditions = {
      parentId: req.user.id
    };

    // Filter by child if specified
    if (childId) {
      const childIdInt = parseInt(childId);
      if (isNaN(childIdInt)) {
        logWarn('Invalid childId in get all events request', { userId: req.user.id, childId });
        return res.status(400).json({
          success: false,
          msg: "Invalid child ID"
        });
      }

      // Verify child belongs to user
      const child = await prisma.child.findFirst({
        where: { id: childIdInt, parentId: req.user.id }
      });

      if (!child) {
        logWarn('Child not found or unauthorized in get all events', { userId: req.user.id, childId: childIdInt });
        return res.status(404).json({
          success: false,
          msg: "Child not found"
        });
      }

      whereConditions.childId = childIdInt;
    }

    // Filter by event type if specified
    if (type) {
      whereConditions.type = type;
    }

    // Get events with pagination
    const events = await prisma.event.findMany({
      where: whereConditions,
      include: {
        child: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { startDate: 'asc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    // Get total count for pagination
    const totalEvents = await prisma.event.count({
      where: whereConditions
    });

    logInfo('Retrieved all events successfully', { 
      userId: req.user.id, 
      eventsCount: events.length, 
      totalEvents,
      childId, 
      type 
    });

    res.json({
      success: true,
      msg: "Events retrieved successfully",
      data: {
        events,
        pagination: {
          total: totalEvents,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + events.length < totalEvents
        }
      }
    });
  } catch (error) {
    logError("Get all events error", error, { userId: req.user?.id });
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// Get monthly calendar view with events
export const getMonthlyCalendar = async (req, res) => {
  try {
    const { year, month, childId } = req.query;
    
    logInfo('Monthly calendar request', { userId: req.user.id, year, month, childId });
    
    // Default to current month if not provided
    const currentDate = new Date();
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;

    // Validate year and month
    if (targetYear < 1900 || targetYear > 2100) {
      logWarn('Invalid year in calendar request', { userId: req.user.id, year: targetYear });
      return res.status(400).json({
        success: false,
        msg: "Year must be between 1900 and 2100"
      });
    }

    if (targetMonth < 1 || targetMonth > 12) {
      logWarn('Invalid month in calendar request', { userId: req.user.id, month: targetMonth });
      return res.status(400).json({
        success: false,
        msg: "Month must be between 1 and 12"
      });
    }

    // Verify child belongs to user if childId is provided
    if (childId) {
      logDebug('Verifying child ownership', { userId: req.user.id, childId });
      const child = await prisma.child.findFirst({
        where: {
          id: parseInt(childId),
          parentId: req.user.id
        }
      });

      if (!child) {
        logWarn('Child not found for calendar filter', { userId: req.user.id, childId });
        return res.status(404).json({
          success: false,
          msg: "Child not found"
        });
      }
    }

    // Get events for the month
    logDebug('Fetching monthly events', { userId: req.user.id, targetYear, targetMonth, childId });
    const events = await calendarService.getMonthlyEvents(
      req.user.id,
      targetYear,
      targetMonth,
      childId
    );

    // Generate calendar grid
    const calendarGrid = calendarService.generateCalendarGrid(targetYear, targetMonth);

    // Format events for calendar display
    const formattedEvents = events.map(event => 
      calendarService.formatEventForCalendar(event)
    );

    // Group events by date for easier frontend consumption
    const eventsByDate = {};
    formattedEvents.forEach(event => {
      const dateKey = new Date(event.startDate).toISOString().split('T')[0];
      if (!eventsByDate[dateKey]) {
        eventsByDate[dateKey] = [];
      }
      eventsByDate[dateKey].push(event);
    });

    logInfo('Monthly calendar data retrieved successfully', { 
      userId: req.user.id, 
      year: targetYear, 
      month: targetMonth, 
      eventCount: formattedEvents.length,
      childId 
    });

    res.json({
      success: true,
      data: {
        year: targetYear,
        month: targetMonth,
        calendarGrid,
        events: formattedEvents,
        eventsByDate,
        totalEvents: formattedEvents.length,
        filteredChild: childId ? parseInt(childId) : null
      }
    });
  } catch (error) {
    logError("Get monthly calendar error", error, { userId: req.user.id, year, month, childId });
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// Get events for a specific date range
export const getEventsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, childId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        msg: "Start date and end date are required"
      });
    }

    // Verify child belongs to user if childId is provided
    if (childId) {
      const child = await prisma.child.findFirst({
        where: {
          id: parseInt(childId),
          parentId: req.user.id
        }
      });

      if (!child) {
        return res.status(404).json({
          success: false,
          msg: "Child not found"
        });
      }
    }

    const events = await calendarService.getEventsByDateRange(
      req.user.id,
      startDate,
      endDate,
      childId
    );

    const formattedEvents = events.map(event => 
      calendarService.formatEventForCalendar(event)
    );

    res.json({
      success: true,
      data: {
        events: formattedEvents,
        dateRange: { startDate, endDate },
        filteredChild: childId ? parseInt(childId) : null
      }
    });
  } catch (error) {
    console.error("Get events by date range error:", error);
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// Get upcoming events
export const getUpcomingEvents = async (req, res) => {
  try {
    const { childId, days = 7 } = req.query;

    // Verify child belongs to user if childId is provided
    if (childId) {
      const child = await prisma.child.findFirst({
        where: {
          id: parseInt(childId),
          parentId: req.user.id
        }
      });

      if (!child) {
        return res.status(404).json({
          success: false,
          msg: "Child not found"
        });
      }
    }

    const events = await calendarService.getUpcomingEvents(
      req.user.id,
      childId,
      parseInt(days)
    );

    const formattedEvents = events.map(event => 
      calendarService.formatEventForCalendar(event)
    );

    res.json({
      success: true,
      data: {
        events: formattedEvents,
        days: parseInt(days),
        filteredChild: childId ? parseInt(childId) : null
      }
    });
  } catch (error) {
    console.error("Get upcoming events error:", error);
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// Create a new event
export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      isAllDay = false,
      type = 'OTHER',
      priority = 'MEDIUM',
      color,
      childId,
      hasReminder = false,
      reminderMinutes
    } = req.body;

    // Verify child belongs to user if childId is provided
    if (childId) {
      const child = await prisma.child.findFirst({
        where: {
          id: parseInt(childId),
          parentId: req.user.id
        }
      });

      if (!child) {
        return res.status(404).json({
          success: false,
          msg: "Child not found"
        });
      }
    }

    // Check for conflicting events if needed
    const conflicts = await calendarService.getConflictingEvents(
      req.user.id,
      startDate,
      endDate
    );

    const event = await prisma.event.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isAllDay,
        type,
        priority,
        color: color || calendarService.getEventTypeColors()[type],
        parentId: req.user.id,
        childId: childId ? parseInt(childId) : null,
        hasReminder,
        reminderMinutes: hasReminder ? reminderMinutes : null
      },
      include: {
        child: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const formattedEvent = calendarService.formatEventForCalendar(event);

    res.status(201).json({
      success: true,
      msg: "Event created successfully",
      data: {
        event: formattedEvent,
        conflicts: conflicts.length > 0 ? conflicts.map(c => calendarService.formatEventForCalendar(c)) : []
      }
    });
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// Get a specific event by ID
export const getEventById = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findFirst({
      where: {
        id: parseInt(eventId),
        parentId: req.user.id
      },
      include: {
        child: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        msg: "Event not found"
      });
    }

    const formattedEvent = calendarService.formatEventForCalendar(event);

    res.json({
      success: true,
      data: { event: formattedEvent }
    });
  } catch (error) {
    console.error("Get event by ID error:", error);
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// Update an event
export const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const updateData = {};

    // Only include fields that are provided
    const allowedFields = [
      'title', 'description', 'startDate', 'endDate', 'isAllDay',
      'type', 'priority', 'color', 'childId', 'hasReminder', 'reminderMinutes'
    ];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'startDate' || field === 'endDate') {
          updateData[field] = req.body[field] ? new Date(req.body[field]) : null;
        } else if (field === 'childId') {
          updateData[field] = req.body[field] ? parseInt(req.body[field]) : null;
        } else {
          updateData[field] = req.body[field];
        }
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        msg: "No valid fields provided for update"
      });
    }

    // Verify child belongs to user if childId is being updated
    if (updateData.childId) {
      const child = await prisma.child.findFirst({
        where: {
          id: updateData.childId,
          parentId: req.user.id
        }
      });

      if (!child) {
        return res.status(404).json({
          success: false,
          msg: "Child not found"
        });
      }
    }

    updateData.updatedAt = new Date();

    // Update event
    const updatedEvent = await prisma.event.updateMany({
      where: {
        id: parseInt(eventId),
        parentId: req.user.id
      },
      data: updateData
    });

    if (updatedEvent.count === 0) {
      return res.status(404).json({
        success: false,
        msg: "Event not found"
      });
    }

    // Fetch updated event data
    const event = await prisma.event.findUnique({
      where: { id: parseInt(eventId) },
      include: {
        child: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const formattedEvent = calendarService.formatEventForCalendar(event);

    res.json({
      success: true,
      msg: "Event updated successfully",
      data: { event: formattedEvent }
    });
  } catch (error) {
    console.error("Update event error:", error);
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// Delete an event
export const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const deletedEvent = await prisma.event.deleteMany({
      where: {
        id: parseInt(eventId),
        parentId: req.user.id
      }
    });

    if (deletedEvent.count === 0) {
      return res.status(404).json({
        success: false,
        msg: "Event not found"
      });
    }

    res.json({
      success: true,
      msg: "Event deleted successfully"
    });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// Get calendar statistics for dashboard
export const getCalendarStatistics = async (req, res) => {
  try {
    const { childId } = req.query;

    // Verify child belongs to user if childId is provided
    if (childId) {
      const child = await prisma.child.findFirst({
        where: {
          id: parseInt(childId),
          parentId: req.user.id
        }
      });

      if (!child) {
        return res.status(404).json({
          success: false,
          msg: "Child not found"
        });
      }
    }

    const statistics = await calendarService.getEventStatistics(req.user.id, childId);

    res.json({
      success: true,
      data: {
        statistics,
        filteredChild: childId ? parseInt(childId) : null
      }
    });
  } catch (error) {
    console.error("Get calendar statistics error:", error);
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// Get event type colors
export const getEventTypeColors = async (req, res) => {
  try {
    const colors = calendarService.getEventTypeColors();
    
    res.json({
      success: true,
      data: { colors }
    });
  } catch (error) {
    console.error("Get event type colors error:", error);
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};
