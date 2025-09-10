import prisma from "../config/db.js";
import { logInfo, logError, logWarn, logDebug } from "../utils/logger.js";
import assistantService from "../services/assistant.service.js";
import { createEvent } from "../calendar/calendar.controller.js";

// Analyze email content for events
export const analyzeEmail = async (req, res) => {
  try {
    const { emailContent, childId } = req.body;
    
    logInfo('Email analysis request', { 
      userId: req.user.id, 
      emailContentLength: emailContent?.length || 0,
      childId 
    });

    if (!emailContent || typeof emailContent !== 'string') {
      logWarn('Invalid email content provided', { userId: req.user.id });
      return res.status(400).json({
        success: false,
        msg: "Email content is required and must be a string"
      });
    }

    if (emailContent.trim().length === 0) {
      logWarn('Empty email content provided', { userId: req.user.id });
      return res.status(400).json({
        success: false,
        msg: "Email content cannot be empty"
      });
    }

    // Verify child exists if childId is provided
    if (childId) {
      const child = await prisma.child.findFirst({
        where: {
          id: parseInt(childId),
          parentId: req.user.id
        }
      });

      if (!child) {
        logWarn('Child not found for email analysis', { userId: req.user.id, childId });
        return res.status(404).json({
          success: false,
          msg: "Child not found"
        });
      }
    }

    // Analyze email content for events
    const analysisResult = await assistantService.analyzeEmailContent(emailContent);
    
    logDebug('Email analysis completed', { 
      userId: req.user.id, 
      eventsDetected: analysisResult.events.length,
      hasEvents: analysisResult.hasEvents 
    });

    if (!analysisResult.hasEvents) {
      logInfo('No events detected in email', { userId: req.user.id });
      return res.json({
        success: true,
        msg: "Email analyzed successfully - no events detected",
        data: {
          hasEvents: false,
          events: [],
          analysis: analysisResult.analysis
        }
      });
    }

    // Create events directly from analysis
    const createdEvents = [];
    const errors = [];

    for (const eventData of analysisResult.events) {
      try {
        // Prepare event data for creation
        const eventPayload = {
          title: eventData.title,
          description: eventData.description || 'Event created from email analysis',
          startDate: eventData.startDate,
          endDate: eventData.endDate,
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          isAllDay: eventData.isAllDay || false,
          type: eventData.type || 'OTHER',
          priority: eventData.priority || 'MEDIUM',
          color: eventData.color || assistantService.getEventTypeColor(eventData.type || 'OTHER'),
          childId: childId,
          hasReminder: eventData.hasReminder || false,
          reminderMinutes: eventData.reminderMinutes
        };

        // Create a mock request object for createEvent
        const mockReq = {
          user: req.user,
          body: eventPayload
        };

        // Create a mock response object to capture the result
        let eventCreated = false;
        let createdEventData = null;
        const mockRes = {
          status: (code) => mockRes,
          json: (data) => {
            if (data.success) {
              eventCreated = true;
              createdEventData = data.data;
            }
            return mockRes;
          }
        };

        // Call createEvent function
        await createEvent(mockReq, mockRes);

        if (eventCreated) {
          createdEvents.push(createdEventData);
          logDebug('Event created from email', { 
            userId: req.user.id, 
            eventId: createdEventData?.id,
            eventTitle: eventPayload.title 
          });
        } else {
          errors.push(`Failed to create event: ${eventPayload.title}`);
        }

      } catch (error) {
        logWarn('Error creating event from email', { 
          userId: req.user.id, 
          eventTitle: eventData.title,
          error: error.message 
        });
        errors.push(`Failed to create event: ${eventData.title} - ${error.message}`);
      }
    }

    logInfo('Email analysis and event creation completed', { 
      userId: req.user.id, 
      eventsDetected: analysisResult.events.length,
      eventsCreated: createdEvents.length,
      errors: errors.length,
      childId 
    });

    res.json({
      success: true,
      msg: `Email analyzed successfully - ${createdEvents.length} event${createdEvents.length !== 1 ? 's' : ''} created${errors.length > 0 ? ` (${errors.length} failed)` : ''}`,
      data: {
        hasEvents: true,
        eventsCreated: createdEvents.length,
        events: createdEvents,
        analysis: analysisResult.analysis,
        errors: errors
      }
    });

  } catch (error) {
    logError("Email analysis error", error, { userId: req.user?.id });
    res.status(500).json({
      success: false,
      msg: "Internal server error during email analysis"
    });
  }
};


// Analyze photo for events
export const analyzePhoto = async (req, res) => {
  try {
    const { childId } = req.body;
    
    logInfo('Photo analysis request', { 
      userId: req.user.id, 
      hasFile: !!req.file,
      childId 
    });

    if (!req.file) {
      logWarn('No photo file provided for analysis', { userId: req.user.id });
      return res.status(400).json({
        success: false,
        msg: "Photo file is required"
      });
    }

    // Verify child exists if childId is provided
    if (childId) {
      const child = await prisma.child.findFirst({
        where: {
          id: parseInt(childId),
          parentId: req.user.id
        }
      });

      if (!child) {
        logWarn('Child not found for photo analysis', { userId: req.user.id, childId });
        return res.status(404).json({
          success: false,
          msg: "Child not found"
        });
      }
    }

    // Analyze photo for events using buffer (no file saving)
    const analysisResult = await assistantService.analyzePhotoForEvents(req.file.buffer, req.file.mimetype);
    
    logDebug('Photo analysis completed', { 
      userId: req.user.id, 
      eventsDetected: analysisResult.events.length,
      hasEvents: analysisResult.hasEvents,
      bufferSize: req.file.buffer.length 
    });

    if (!analysisResult.hasEvents) {
      logInfo('No events detected in photo', { userId: req.user.id });
      return res.json({
        success: true,
        msg: "Photo analyzed successfully - no events detected",
        data: {
          hasEvents: false,
          events: [],
          analysis: analysisResult.analysis
        }
      });
    }

    // Create events directly from analysis
    const createdEvents = [];
    const errors = [];

    for (const eventData of analysisResult.events) {
      try {
        // Prepare event data for creation
        const eventPayload = {
          title: eventData.title,
          description: eventData.description || 'Event created from photo analysis',
          startDate: eventData.startDate,
          endDate: eventData.endDate,
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          isAllDay: eventData.isAllDay || false,
          type: eventData.type || 'OTHER',
          priority: eventData.priority || 'MEDIUM',
          color: eventData.color || assistantService.getEventTypeColor(eventData.type || 'OTHER'),
          childId: childId,
          hasReminder: eventData.hasReminder || false,
          reminderMinutes: eventData.reminderMinutes
        };

        // Create a mock request object for createEvent
        const mockReq = {
          user: req.user,
          body: eventPayload
        };

        // Create a mock response object to capture the result
        let eventCreated = false;
        let createdEventData = null;
        const mockRes = {
          status: (code) => mockRes,
          json: (data) => {
            if (data.success) {
              eventCreated = true;
              createdEventData = data.data;
            }
            return mockRes;
          }
        };

        // Call createEvent function
        await createEvent(mockReq, mockRes);

        if (eventCreated) {
          createdEvents.push(createdEventData);
          logDebug('Event created from photo', { 
            userId: req.user.id, 
            eventId: createdEventData?.id,
            eventTitle: eventPayload.title 
          });
        } else {
          errors.push(`Failed to create event: ${eventPayload.title}`);
        }

      } catch (error) {
        logWarn('Error creating event from photo', { 
          userId: req.user.id, 
          eventTitle: eventData.title,
          error: error.message 
        });
        errors.push(`Failed to create event: ${eventData.title} - ${error.message}`);
      }
    }

    logInfo('Photo analysis and event creation completed', { 
      userId: req.user.id, 
      eventsDetected: analysisResult.events.length,
      eventsCreated: createdEvents.length,
      errors: errors.length,
      childId 
    });

    res.json({
      success: true,
      msg: `Photo analyzed successfully - ${createdEvents.length} event${createdEvents.length !== 1 ? 's' : ''} created${errors.length > 0 ? ` (${errors.length} failed)` : ''}`,
      data: {
        hasEvents: true,
        eventsCreated: createdEvents.length,
        events: createdEvents,
        analysis: analysisResult.analysis,
        errors: errors
      }
    });

  } catch (error) {
    logError("Photo analysis error", error, { userId: req.user?.id });
    res.status(500).json({
      success: false,
      msg: "Internal server error during photo analysis"
    });
  }
};


// Get assistant analysis history
export const getAnalysisHistory = async (req, res) => {
  try {
    const { limit = 20, offset = 0, type } = req.query;
    
    logInfo('Get analysis history request', { 
      userId: req.user.id, 
      limit: parseInt(limit), 
      offset: parseInt(offset),
      type 
    });

    // This would require a separate model for storing analysis history
    // For now, return empty array since we don't persist analysis results
    const history = [];

    res.json({
      success: true,
      msg: "Analysis history retrieved successfully",
      data: {
        history,
        pagination: {
          total: 0,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: false
        }
      }
    });

  } catch (error) {
    logError("Get analysis history error", error, { userId: req.user?.id });
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};
