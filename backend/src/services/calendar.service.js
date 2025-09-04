import prisma from "../config/db.js";

class CalendarService {
  // Get events for a specific month
  async getMonthlyEvents(userId, year, month, childId = null) {
    const startDate = new Date(year, month - 1, 1); // month is 1-based
    const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month

    const whereClause = {
      parentId: userId,
      OR: [
        {
          // Events that start in this month
          startDate: {
            gte: startDate,
            lte: endDate
          }
        },
        {
          // Multi-day events that span into this month
          AND: [
            { startDate: { lte: endDate } },
            { 
              OR: [
                { endDate: { gte: startDate } },
                { endDate: null } // All-day events without end date
              ]
            }
          ]
        }
      ]
    };

    // Add child filter if specified
    if (childId) {
      whereClause.OR = whereClause.OR.map(condition => ({
        ...condition,
        childId: parseInt(childId)
      }));
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        child: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { startDate: 'asc' },
        { title: 'asc' }
      ]
    });

    return events;
  }

  // Get events for a specific date range
  async getEventsByDateRange(userId, startDate, endDate, childId = null) {
    const whereClause = {
      parentId: userId,
      OR: [
        {
          startDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        {
          AND: [
            { startDate: { lte: new Date(endDate) } },
            { 
              OR: [
                { endDate: { gte: new Date(startDate) } },
                { endDate: null }
              ]
            }
          ]
        }
      ]
    };

    if (childId) {
      whereClause.childId = parseInt(childId);
    }

    return await prisma.event.findMany({
      where: whereClause,
      include: {
        child: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { startDate: 'asc' },
        { title: 'asc' }
      ]
    });
  }

  // Get upcoming events (next 7 days)
  async getUpcomingEvents(userId, childId = null, days = 7) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    const whereClause = {
      parentId: userId,
      startDate: {
        gte: now,
        lte: futureDate
      }
    };

    if (childId) {
      whereClause.childId = parseInt(childId);
    }

    return await prisma.event.findMany({
      where: whereClause,
      include: {
        child: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { startDate: 'asc' },
        { title: 'asc' }
      ],
      take: 10 // Limit to 10 upcoming events
    });
  }

  // Get event statistics for dashboard
  async getEventStatistics(userId, childId = null) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const whereClause = {
      parentId: userId
    };

    if (childId) {
      whereClause.childId = parseInt(childId);
    }

    // Get counts for different time periods
    const [
      totalEvents,
      thisMonthEvents,
      upcomingEvents,
      overdueEvents,
      eventsByType
    ] = await Promise.all([
      // Total events
      prisma.event.count({ where: whereClause }),

      // This month's events
      prisma.event.count({
        where: {
          ...whereClause,
          startDate: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      }),

      // Upcoming events (next 7 days)
      prisma.event.count({
        where: {
          ...whereClause,
          startDate: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Overdue events (past events that might need attention)
      prisma.event.count({
        where: {
          ...whereClause,
          startDate: {
            lt: now
          },
          type: {
            in: ['ASSIGNMENT_DUE', 'EXAM', 'APPOINTMENT']
          }
        }
      }),

      // Events by type
      prisma.event.groupBy({
        by: ['type'],
        where: whereClause,
        _count: {
          id: true
        }
      })
    ]);

    return {
      totalEvents,
      thisMonthEvents,
      upcomingEvents,
      overdueEvents,
      eventsByType: eventsByType.reduce((acc, item) => {
        acc[item.type] = item._count.id;
        return acc;
      }, {})
    };
  }

  // Generate calendar grid for a month (including previous/next month dates)
  generateCalendarGrid(year, month) {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysInMonth = lastDay.getDate();

    const calendar = [];
    let currentDate = new Date(firstDay);

    // Add days from previous month if needed
    if (firstDayOfWeek > 0) {
      const prevMonth = new Date(year, month - 2, 0);
      const daysFromPrevMonth = prevMonth.getDate() - firstDayOfWeek + 1;
      
      for (let i = daysFromPrevMonth; i <= prevMonth.getDate(); i++) {
        calendar.push({
          date: new Date(year, month - 2, i),
          isCurrentMonth: false,
          isPreviousMonth: true,
          isNextMonth: false
        });
      }
    }

    // Add days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      calendar.push({
        date: new Date(year, month - 1, day),
        isCurrentMonth: true,
        isPreviousMonth: false,
        isNextMonth: false
      });
    }

    // Add days from next month to complete the grid (42 days = 6 weeks)
    const remainingDays = 42 - calendar.length;
    for (let day = 1; day <= remainingDays; day++) {
      calendar.push({
        date: new Date(year, month, day),
        isCurrentMonth: false,
        isPreviousMonth: false,
        isNextMonth: true
      });
    }

    return calendar;
  }

  // Get default event colors by type
  getEventTypeColors() {
    return {
      SCHOOL_EVENT: '#3B82F6',      // Blue
      ASSIGNMENT_DUE: '#EF4444',    // Red
      EXAM: '#DC2626',              // Dark Red
      PARENT_MEETING: '#8B5CF6',    // Purple
      EXTRACURRICULAR: '#10B981',   // Green
      APPOINTMENT: '#F59E0B',       // Amber
      BIRTHDAY: '#EC4899',          // Pink
      HOLIDAY: '#6B7280',           // Gray
      REMINDER: '#06B6D4',          // Cyan
      OTHER: '#6366F1'              // Indigo
    };
  }

  // Format event for calendar display
  formatEventForCalendar(event) {
    const colors = this.getEventTypeColors();
    
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      isAllDay: event.isAllDay,
      type: event.type,
      priority: event.priority,
      color: event.color || colors[event.type] || colors.OTHER,
      child: event.child ? {
        id: event.child.id,
        name: event.child.name
      } : null,
      hasReminder: event.hasReminder,
      reminderMinutes: event.reminderMinutes
    };
  }

  // Check if events overlap
  doEventsOverlap(event1, event2) {
    const start1 = new Date(event1.startDate);
    const end1 = event1.endDate ? new Date(event1.endDate) : new Date(start1.getTime() + 60 * 60 * 1000); // 1 hour default
    const start2 = new Date(event2.startDate);
    const end2 = event2.endDate ? new Date(event2.endDate) : new Date(start2.getTime() + 60 * 60 * 1000);

    return start1 < end2 && start2 < end1;
  }

  // Get conflicting events for a new event
  async getConflictingEvents(userId, startDate, endDate, excludeEventId = null) {
    const whereClause = {
      parentId: userId,
      OR: [
        {
          AND: [
            { startDate: { lte: new Date(endDate || startDate) } },
            { 
              OR: [
                { endDate: { gte: new Date(startDate) } },
                { endDate: null }
              ]
            }
          ]
        }
      ]
    };

    if (excludeEventId) {
      whereClause.id = { not: parseInt(excludeEventId) };
    }

    return await prisma.event.findMany({
      where: whereClause,
      include: {
        child: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  }
}

export default new CalendarService();
