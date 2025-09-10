import prisma from "../config/db.js";
import calendarService from "../services/calendar.service.js";
import { logInfo, logError, logWarn, logDebug } from "../utils/logger.js";

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

    // Format events for calendar display with time information
    const formattedEvents = events
      .map(event => {
        const calendarEvent = calendarService.formatEventForCalendar(event);
        return calendarService.formatEventWithTime(calendarEvent);
      })
      .filter(event => {
        // Double-check: only include events that actually start in the requested month
        if (event.startDateOnly) {
          const [eventYear, eventMonth] = event.startDateOnly.split('-').map(Number);
          const isCorrectMonth = eventYear === targetYear && eventMonth === targetMonth;
          
          if (!isCorrectMonth) {
            logWarn('Filtering out event from wrong month', {
              userId: req.user.id,
              eventId: event.id,
              eventTitle: event.title,
              eventDate: event.startDateOnly,
              requestedMonth: `${targetYear}-${String(targetMonth).padStart(2, '0')}`
            });
          }
          
          return isCorrectMonth;
        }
        return false;
      });

    // Group events by date for easier frontend consumption
    const eventsByDate = {};
    formattedEvents.forEach(event => {
      // Use the already calculated startDateOnly field to avoid timezone issues
      const dateKey = event.startDateOnly;
      if (dateKey) {
        if (!eventsByDate[dateKey]) {
          eventsByDate[dateKey] = [];
        }
        eventsByDate[dateKey].push(event);
      }
    });

    // Debug: Log some sample events to verify filtering
    logDebug('Event filtering results', {
      userId: req.user.id,
      targetYear,
      targetMonth,
      childId,
      rawEventCount: events.length,
      filteredEventCount: formattedEvents.length,
      requestedMonth: `${targetYear}-${String(targetMonth).padStart(2, '0')}`
    });

    if (formattedEvents.length > 0) {
      const sampleEvents = formattedEvents.slice(0, 3).map(e => ({
        id: e.id,
        title: e.title,
        startDate: e.startDate,
        startDateOnly: e.startDateOnly,
        children: e.children.map(c => ({ id: c.id, name: c.name }))
      }));
      logDebug('Sample filtered events', { 
        userId: req.user.id, 
        targetYear, 
        targetMonth, 
        childId,
        sampleEvents 
      });
    }

    logInfo('Monthly calendar data retrieved successfully', { 
      userId: req.user.id, 
      year: targetYear, 
      month: targetMonth, 
      eventCount: formattedEvents.length,
      childId,
      dateRangeUsed: `${targetYear}-${String(targetMonth).padStart(2, '0')}-01 to ${targetYear}-${String(targetMonth).padStart(2, '0')}-${new Date(targetYear, targetMonth, 0).getDate()}`
    });

    res.json({
      success: true,
      data: {
        year: targetYear,
        month: targetMonth,
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

// Get calendar range for scrolling (multiple months at once)
export const getCalendarRange = async (req, res) => {
  try {
    const { startYear, startMonth, endYear, endMonth, childId } = req.query;
    
    logInfo('Calendar range request', { 
      userId: req.user.id, 
      startYear, 
      startMonth, 
      endYear, 
      endMonth, 
      childId 
    });

    // Validate parameters
    if (!startYear || !startMonth || !endYear || !endMonth) {
      return res.status(400).json({
        success: false,
        msg: "Start year, start month, end year, and end month are required"
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

    // Calculate date range
    const startDate = new Date(parseInt(startYear), parseInt(startMonth) - 1, 1);
    const endDate = new Date(parseInt(endYear), parseInt(endMonth), 0, 23, 59, 59, 999);

    // Get events for the date range
    const events = await calendarService.getEventsByDateRange(
      req.user.id,
      startDate,
      endDate,
      childId
    );

    // Format events for calendar display with time information
    const formattedEvents = events.map(event => {
      const calendarEvent = calendarService.formatEventForCalendar(event);
      return calendarService.formatEventWithTime(calendarEvent);
    });

    // Group events by month for easier frontend consumption
    const eventsByMonth = {};
    const eventsByDate = {};
    
    formattedEvents.forEach(event => {
      // Use startDateOnly to avoid timezone issues
      const dateKey = event.startDateOnly;
      if (dateKey) {
        // Extract year-month from the date string (YYYY-MM-DD format)
        const monthKey = dateKey.substring(0, 7); // Gets YYYY-MM
        
        // Group by month
        if (!eventsByMonth[monthKey]) {
          eventsByMonth[monthKey] = [];
        }
        eventsByMonth[monthKey].push(event);
        
        // Group by date
        if (!eventsByDate[dateKey]) {
          eventsByDate[dateKey] = [];
        }
        eventsByDate[dateKey].push(event);
      }
    });

    logInfo('Calendar range data retrieved successfully', { 
      userId: req.user.id, 
      startYear: parseInt(startYear), 
      startMonth: parseInt(startMonth),
      endYear: parseInt(endYear), 
      endMonth: parseInt(endMonth),
      eventCount: formattedEvents.length,
      childId 
    });

    res.json({
      success: true,
      data: {
        startYear: parseInt(startYear),
        startMonth: parseInt(startMonth),
        endYear: parseInt(endYear),
        endMonth: parseInt(endMonth),
        events: formattedEvents,
        eventsByMonth,
        eventsByDate,
        totalEvents: formattedEvents.length,
        filteredChild: childId ? parseInt(childId) : null
      }
    });

  } catch (error) {
    logError("Get calendar range error", error, { 
      userId: req.user.id, 
      startYear, 
      startMonth, 
      endYear, 
      endMonth, 
      childId 
    });
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

    const formattedEvents = events.map(event => {
      const calendarEvent = calendarService.formatEventForCalendar(event);
      return calendarService.formatEventWithTime(calendarEvent);
    });

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

    const formattedEvents = events.map(event => {
      const calendarEvent = calendarService.formatEventForCalendar(event);
      return calendarService.formatEventWithTime(calendarEvent);
    });

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

      // Filter events that include this child
      whereConditions.eventChildren = {
        some: {
          childId: childIdInt
        }
      };
    }

    // Filter by event type if specified
    if (type) {
      whereConditions.type = type;
    }

    // Get events with pagination
    const events = await prisma.event.findMany({
      where: whereConditions,
      include: {
        eventChildren: {
          include: {
            child: {
              select: {
                id: true,
                name: true
              }
            }
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

    // Format events with time information
    const eventsWithTime = events.map(event => calendarService.formatEventWithTime(event));

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
        events: eventsWithTime,
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

// Updated createEvent function with better debugging and fixed child handling
export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      isAllDay = false,
      type = 'OTHER',
      priority = 'MEDIUM',
      color,
      childId,
      hasReminder = false,
      reminderMinutes
    } = req.body;

    logInfo('Create event request', { 
      userId: req.user.id, 
      title, 
      childId,
      isAllDay,
      type 
    });

    // Combine date and time if provided
    let finalStartDate = new Date(startDate);
    let finalEndDate = endDate ? new Date(endDate) : null;

    // If time is provided and it's not an all-day event, combine date and time
    if (!isAllDay && startTime) {
      const [hours, minutes, seconds = '00'] = startTime.split(':');
      finalStartDate.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || '0'));
    }

    if (!isAllDay && endTime && finalEndDate) {
      const [hours, minutes, seconds = '00'] = endTime.split(':');
      finalEndDate.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || '0'));
    }

    let targetChildren = [];

    // Handle child selection logic
    if (childId === null || childId === undefined || childId === '') {
      // Get all children for the user when childId is null/undefined/empty
      logDebug('Creating event for all children', { userId: req.user.id });
      
      const allChildren = await prisma.child.findMany({
        where: { parentId: req.user.id },
        select: { id: true, name: true }
      });

      if (allChildren.length === 0) {
        logWarn('No children found for user when creating event for all', { userId: req.user.id });
        return res.status(400).json({
          success: false,
          msg: "No children found. Please add children first."
        });
      }

      targetChildren = allChildren;
      logDebug('Event will be created for all children', { 
        userId: req.user.id, 
        childrenCount: allChildren.length,
        childrenIds: allChildren.map(c => c.id)
      });
    } else {
      // Verify specific child belongs to user
      logDebug('Creating event for specific child', { userId: req.user.id, childId });
      
      const child = await prisma.child.findFirst({
        where: {
          id: parseInt(childId),
          parentId: req.user.id
        },
        select: { id: true, name: true }
      });

      if (!child) {
        logWarn('Child not found for event creation', { userId: req.user.id, childId });
        return res.status(404).json({
          success: false,
          msg: "Child not found"
        });
      }

      targetChildren = [child];
      logDebug('Event will be created for specific child', { 
        userId: req.user.id, 
        child: child
      });
    }

    // Check for conflicting events
    // const conflicts = await calendarService.getConflictingEvents(
    //   req.user.id,
    //   finalStartDate,
    //   finalEndDate
    // );

    // Create event with children relationships
    const event = await prisma.event.create({
      data: {
        title,
        description,
        startDate: finalStartDate,
        endDate: finalEndDate,
        isAllDay,
        type,
        priority,
        color: color || calendarService.getEventTypeColors()[type],
        parentId: req.user.id,
        hasReminder,
        reminderMinutes: hasReminder ? reminderMinutes : null,
        eventChildren: {
          create: targetChildren.map(child => ({
            childId: child.id
          }))
        }
      },
      include: {
        eventChildren: {
          include: {
            child: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    logDebug('Event created in database', { 
      userId: req.user.id, 
      eventId: event.id,
      eventChildrenCount: event.eventChildren?.length || 0,
      eventChildren: event.eventChildren?.map(ec => ({ childId: ec.childId, childName: ec.child?.name }))
    });

    // Format the event directly (no need to use calendarService first since we have all the data)
    const formattedEvent = calendarService.formatEventWithTime(event);

    logInfo('Event created successfully', { 
      userId: req.user.id, 
      eventId: event.id,
      childrenCount: targetChildren.length,
      title,
      formattedEventChildrenCount: formattedEvent.children?.length || 0
    });

    res.status(201).json({
      success: true,
      msg: `Event created successfully for ${targetChildren.length} child${targetChildren.length > 1 ? 'ren' : ''}`,
      data: {
        event: formattedEvent,
        // conflicts: conflicts.length > 0 ? conflicts.map(c => formatEventWithTime(calendarService.formatEventForCalendar(c))) : [],
        childrenCount: targetChildren.length
      }
    });
  } catch (error) {
    logError("Create event error", error, { userId: req.user?.id });
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// Update an event (fixed to handle childId parameter correctly)
export const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const updateData = {};

    logInfo('Update event request', { 
      userId: req.user.id, 
      eventId,
      updateFields: Object.keys(req.body)
    });

    // Only include fields that are provided
    const allowedFields = [
      'title', 'description', 'startDate', 'endDate', 'startTime', 'endTime', 'isAllDay',
      'type', 'priority', 'color', 'childId', 'hasReminder', 'reminderMinutes'
    ];
    
    // Handle date and time combination
    let finalStartDate = null;
    let finalEndDate = null;

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'startDate') {
          finalStartDate = new Date(req.body[field]);
          // If startTime is also provided and it's not all day, combine them
          if (req.body.startTime && !req.body.isAllDay) {
            const [hours, minutes, seconds = '00'] = req.body.startTime.split(':');
            finalStartDate.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || '0'));
          }
          updateData[field] = finalStartDate;
        } else if (field === 'endDate') {
          finalEndDate = req.body[field] ? new Date(req.body[field]) : null;
          // If endTime is also provided and it's not all day, combine them
          if (req.body.endTime && finalEndDate && !req.body.isAllDay) {
            const [hours, minutes, seconds = '00'] = req.body.endTime.split(':');
            finalEndDate.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || '0'));
          }
          updateData[field] = finalEndDate;
        } else if (field === 'startTime' || field === 'endTime') {
          // These are handled above when processing dates
          // Skip adding them to updateData as separate fields
        } else if (field === 'childId') {
          // Handle childId specially - will be processed below
          // Don't add to updateData yet
        } else {
          updateData[field] = req.body[field];
        }
      }
    });

    if (Object.keys(updateData).length === 0 && req.body.childId === undefined) {
      logWarn('No valid fields provided for update', { userId: req.user.id, eventId });
      return res.status(400).json({
        success: false,
        msg: "No valid fields provided for update"
      });
    }

    // First, get the existing event to verify ownership
    const existingEvent = await prisma.event.findFirst({
      where: {
        id: parseInt(eventId),
        parentId: req.user.id
      },
      include: {
        eventChildren: {
          include: {
            child: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    if (!existingEvent) {
      logWarn('Event not found for update', { userId: req.user.id, eventId });
      return res.status(404).json({
        success: false,
        msg: "Event not found"
      });
    }

    updateData.updatedAt = new Date();

    // Handle child relationships update
    let childUpdateOperations = {};
    if (req.body.hasOwnProperty('childId')) {
      const childId = req.body.childId;
      
      if (childId === null || childId === undefined || childId === '') {
        // Apply to all children when childId is null/undefined/empty
        const allChildren = await prisma.child.findMany({
          where: { parentId: req.user.id },
          select: { id: true }
        });
        
        if (allChildren.length === 0) {
          return res.status(400).json({
            success: false,
            msg: "No children found. Please add children first."
          });
        }

        // Delete existing relationships and create new ones for all children
        childUpdateOperations = {
          deleteMany: {},
          create: allChildren.map(child => ({ childId: child.id }))
        };
      } else {
        // Verify child belongs to user
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

        // Delete existing relationships and create new one for specific child
        childUpdateOperations = {
          deleteMany: {},
          create: [{ childId: parseInt(childId) }]
        };
      }
    }

    // Update event
    const updatedEvent = await prisma.event.update({
      where: {
        id: parseInt(eventId),
        parentId: req.user.id
      },
      data: {
        ...updateData,
        ...(Object.keys(childUpdateOperations).length > 0 && {
          eventChildren: childUpdateOperations
        })
      },
      include: {
        eventChildren: {
          include: {
            child: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    const formattedEvent = calendarService.formatEventWithTime(updatedEvent);

    logInfo('Event updated successfully', { 
      userId: req.user.id, 
      eventId,
      childrenCount: updatedEvent.eventChildren.length 
    });

    res.json({
      success: true,
      msg: "Event updated successfully",
      data: { event: formattedEvent }
    });
  } catch (error) {
    logError("Update event error", error, { userId: req.user?.id, eventId: req.params?.eventId });
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
        eventChildren: {
          include: {
            child: {
              select: {
                id: true,
                name: true
              }
            }
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

    const formattedEvent = calendarService.formatEventWithTime(event);

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