import prisma from "../config/db.js";
import { logInfo, logError, logWarn, logDebug } from "../utils/logger.js";
import calendarService from "../services/calendar.service.js";

// Get all children for the authenticated user
export const getChildren = async (req, res) => {
  try {
    logInfo('Fetching children list', { userId: req.user.id });
    
    const children = await prisma.child.findMany({
      where: { parentId: req.user.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        gradeLevel: true,
        schoolName: true,
        birthDate: true,
        profilePhoto: true,
        createdAt: true,
        updatedAt: true
      }
    });

    logInfo('Children list retrieved successfully', { userId: req.user.id, count: children.length });

    res.json({
      success: true,
      data: {
        children,
        count: children.length
      }
    });
  } catch (error) {
    logError("Get children error", error, { userId: req.user.id });
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// Get a specific child by ID
export const getChildById = async (req, res) => {
  try {
    const { childId } = req.params;

    const child = await prisma.child.findFirst({
      where: {
        id: parseInt(childId),
        parentId: req.user.id // Ensure user can only access their own children
      },
      select: {
        id: true,
        name: true,
        gradeLevel: true,
        schoolName: true,
        birthDate: true,
        profilePhoto: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        msg: "Child not found"
      });
    }

    res.json({
      success: true,
      data: { child }
    });
  } catch (error) {
    console.error("Get child by ID error:", error);
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// Add a new child
export const addChild = async (req, res) => {
  try {
    const { name, gradeLevel, schoolName, birthDate } = req.body;
    
    logInfo('Adding new child', { userId: req.user.id, name, gradeLevel, schoolName });

    // Check if user already has maximum number of children (optional limit)
    const childCount = await prisma.child.count({
      where: { parentId: req.user.id }
    });

    if (childCount >= 10) { // Set reasonable limit
      logWarn('Maximum children limit reached', { userId: req.user.id, currentCount: childCount });
      return res.status(400).json({
        success: false,
        msg: "Maximum number of children (10) reached"
      });
    }

    logDebug('Creating child in database', { userId: req.user.id, childData: { name, gradeLevel, schoolName } });

    const child = await prisma.child.create({
      data: {
        name,
        gradeLevel,
        schoolName,
        birthDate: birthDate ? new Date(birthDate) : null,
        parentId: req.user.id
      },
      select: {
        id: true,
        name: true,
        gradeLevel: true,
        schoolName: true,
        birthDate: true,
        profilePhoto: true,
        createdAt: true,
        updatedAt: true
      }
    });

    logInfo('Child added successfully', { userId: req.user.id, childId: child.id, childName: child.name });

    res.status(201).json({
      success: true,
      msg: "Child added successfully",
      data: { child }
    });
  } catch (error) {
    logError("Add child error", error, { userId: req.user.id, childData: { name, gradeLevel, schoolName } });
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// Update child information
export const updateChild = async (req, res) => {
  try {
    const { childId } = req.params;
    const updateData = {};

    // Only include fields that are provided
    const allowedFields = ['name', 'gradeLevel', 'schoolName', 'birthDate', 'googleClassroomEmail'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'birthDate' && req.body[field]) {
          updateData[field] = new Date(req.body[field]);
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

    updateData.updatedAt = new Date();

    // Verify child belongs to user and update
    const child = await prisma.child.updateMany({
      where: {
        id: parseInt(childId),
        parentId: req.user.id
      },
      data: updateData
    });

    if (child.count === 0) {
      return res.status(404).json({
        success: false,
        msg: "Child not found"
      });
    }

    // Fetch updated child data
    const updatedChild = await prisma.child.findUnique({
      where: { id: parseInt(childId) },
      select: {
        id: true,
        name: true,
        gradeLevel: true,
        schoolName: true,
        birthDate: true,
        profilePhoto: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      msg: "Child updated successfully",
      data: { child: updatedChild }
    });
  } catch (error) {
    console.error("Update child error:", error);
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// Delete a child
export const deleteChild = async (req, res) => {
  try {
    const { childId } = req.params;

    const deletedChild = await prisma.child.deleteMany({
      where: {
        id: parseInt(childId),
        parentId: req.user.id
      }
    });

    if (deletedChild.count === 0) {
      return res.status(404).json({
        success: false,
        msg: "Child not found"
      });
    }

    res.json({
      success: true,
      msg: "Child deleted successfully"
    });
  } catch (error) {
    console.error("Delete child error:", error);
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// Upload child profile photo
export const uploadChildPhoto = async (req, res) => {
  try {
    const { childId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        msg: "No photo file provided"
      });
    }

    // In a real app, you'd upload to cloud storage (AWS S3, Cloudinary, etc.)
    // For now, we'll just store the file path
    const photoUrl = `/uploads/children/${req.file.filename}`;

    const updatedChild = await prisma.child.updateMany({
      where: {
        id: parseInt(childId),
        parentId: req.user.id
      },
      data: {
        profilePhoto: photoUrl,
        updatedAt: new Date()
      }
    });

    if (updatedChild.count === 0) {
      return res.status(404).json({
        success: false,
        msg: "Child not found"
      });
    }

    res.json({
      success: true,
      msg: "Profile photo updated successfully",
      data: { photoUrl }
    });
  } catch (error) {
    console.error("Upload child photo error:", error);
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// Get all events for a specific child
export const getEventsByChildId = async (req, res) => {
  try {
    const { childId } = req.params;
    const { limit = 50, offset = 0, type, startDate, endDate } = req.query;
    
    logInfo('Get events by child ID request', { 
      userId: req.user.id, 
      childId,
      limit: parseInt(limit),
      offset: parseInt(offset),
      type,
      startDate,
      endDate
    });

    // Validate childId
    const childIdInt = parseInt(childId);
    if (isNaN(childIdInt)) {
      logWarn('Invalid childId in get events by child request', { userId: req.user.id, childId });
      return res.status(400).json({
        success: false,
        msg: "Invalid child ID"
      });
    }

    // Verify child belongs to user
    const child = await prisma.child.findFirst({
      where: {
        id: childIdInt,
        parentId: req.user.id
      }
    });

    if (!child) {
      logWarn('Child not found or unauthorized in get events by child', { userId: req.user.id, childId: childIdInt });
      return res.status(404).json({
        success: false,
        msg: "Child not found"
      });
    }

    // Build filter conditions
    const whereConditions = {
      parentId: req.user.id,
      eventChildren: {
        some: {
          childId: childIdInt
        }
      }
    };

    // Filter by event type if specified
    if (type) {
      whereConditions.type = type;
    }

    // Filter by date range if specified
    if (startDate && endDate) {
      whereConditions.OR = [
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
      ];
    } else if (startDate) {
      whereConditions.startDate = {
        gte: new Date(startDate)
      };
    } else if (endDate) {
      whereConditions.startDate = {
        lte: new Date(endDate)
      };
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

    logInfo('Retrieved events by child ID successfully', { 
      userId: req.user.id, 
      childId: childIdInt,
      childName: child.name,
      eventsCount: events.length, 
      totalEvents,
      type,
      dateRange: startDate && endDate ? `${startDate} to ${endDate}` : null
    });

    res.json({
      success: true,
      msg: `Events retrieved successfully for ${child.name}`,
      data: {
        child: {
          id: child.id,
          name: child.name
        },
        events: eventsWithTime,
        pagination: {
          total: totalEvents,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + events.length < totalEvents
        },
        filters: {
          type: type || null,
          startDate: startDate || null,
          endDate: endDate || null
        }
      }
    });
  } catch (error) {
    logError("Get events by child ID error", error, { userId: req.user?.id, childId: req.params?.childId });
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};

// Initiate Google Classroom OAuth flow
/*
export const initiateGoogleClassroomAuth = async (req, res) => {
  try {
    const { childId } = req.params;

    // Verify the child belongs to the user
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

    // Generate OAuth URL
    const authUrl = googleClassroomService.generateAuthUrl(childId, { userId: req.user.id });

    res.json({
      success: true,
      data: { authUrl }
    });
  } catch (error) {
    console.error("Initiate Google Classroom auth error:", error);
    res.status(500).json({
      success: false,
      msg: "Failed to initiate Google Classroom authentication"
    });
  }
};
*/

// Handle Google Classroom OAuth callback
/*
export const handleGoogleClassroomCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.redirect(`${process.env.CLIENT_URL}/children?error=oauth_failed`);
    }

    const stateData = JSON.parse(state);
    const { childId, userId } = stateData;

    // Verify the child belongs to the user
    const child = await prisma.child.findFirst({
      where: {
        id: parseInt(childId),
        parentId: userId
      }
    });

    if (!child) {
      return res.redirect(`${process.env.CLIENT_URL}/children?error=child_not_found`);
    }

    // Handle OAuth callback
    const { tokens, email } = await googleClassroomService.handleCallback(code, stateData);

    // Encrypt and store tokens
    const encryptedAccessToken = encryptToken(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token ? encryptToken(tokens.refresh_token) : null;

    await prisma.child.update({
      where: { id: parseInt(childId) },
      data: {
        googleClassroomEnabled: true,
        googleClassroomEmail: email,
        googleClassroomToken: JSON.stringify({
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          expiry_date: tokens.expiry_date
        }),
        updatedAt: new Date()
      }
    });

    res.redirect(`${process.env.CLIENT_URL}/children?success=classroom_connected`);
  } catch (error) {
    console.error("Google Classroom callback error:", error);
    res.redirect(`${process.env.CLIENT_URL}/children?error=oauth_callback_failed`);
  }
};
*/

// Get Google Classroom data for a child
/*
export const getGoogleClassroomData = async (req, res) => {
  try {
    const { childId } = req.params;

    const child = await prisma.child.findFirst({
      where: {
        id: parseInt(childId),
        parentId: req.user.id,
        googleClassroomEnabled: true
      }
    });

    if (!child || !child.googleClassroomToken) {
      return res.status(404).json({
        success: false,
        msg: "Child not found or Google Classroom not connected"
      });
    }

    // Decrypt tokens
    const tokenData = JSON.parse(child.googleClassroomToken);
    const accessToken = decryptToken(tokenData.access_token);

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        msg: "Invalid Google Classroom credentials"
      });
    }

    // Validate token and refresh if needed
    const isValid = await googleClassroomService.validateToken(accessToken);
    let currentAccessToken = accessToken;

    if (!isValid && tokenData.refresh_token) {
      try {
        const refreshToken = decryptToken(tokenData.refresh_token);
        const newTokens = await googleClassroomService.refreshToken(refreshToken);
        
        // Update stored tokens
        const updatedTokenData = {
          access_token: encryptToken(newTokens.access_token),
          refresh_token: tokenData.refresh_token,
          expiry_date: newTokens.expiry_date
        };

        await prisma.child.update({
          where: { id: parseInt(childId) },
          data: { googleClassroomToken: JSON.stringify(updatedTokenData) }
        });

        currentAccessToken = newTokens.access_token;
      } catch (refreshError) {
        return res.status(401).json({
          success: false,
          msg: "Google Classroom authentication expired. Please reconnect."
        });
      }
    }

    // Fetch classroom data
    const courses = await googleClassroomService.getCourses(currentAccessToken);
    
    res.json({
      success: true,
      data: {
        courses,
        email: child.googleClassroomEmail
      }
    });
  } catch (error) {
    console.error("Get Google Classroom data error:", error);
    res.status(500).json({
      success: false,
      msg: "Failed to fetch Google Classroom data"
    });
  }
};
*/

// Disconnect Google Classroom
/*
export const disconnectGoogleClassroom = async (req, res) => {
  try {
    const { childId } = req.params;

    const updatedChild = await prisma.child.updateMany({
      where: {
        id: parseInt(childId),
        parentId: req.user.id
      },
      data: {
        googleClassroomEnabled: false,
        googleClassroomEmail: null,
        googleClassroomToken: null,
        updatedAt: new Date()
      }
    });

    if (updatedChild.count === 0) {
      return res.status(404).json({
        success: false,
        msg: "Child not found"
      });
    }

    res.json({
      success: true,
      msg: "Google Classroom disconnected successfully"
    });
  } catch (error) {
    console.error("Disconnect Google Classroom error:", error);
    res.status(500).json({
      success: false,
      msg: "Internal server error"
    });
  }
};
*/

// Helper function to encrypt tokens
// function encryptToken(token) {
//   const algorithm = 'aes-256-gcm';
//   const secretKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
//   const key = crypto.scryptSync(secretKey, 'salt', 32);
//   const iv = crypto.randomBytes(16);
  
//   const cipher = crypto.createCipher(algorithm, key);
//   let encrypted = cipher.update(token, 'utf8', 'hex');
//   encrypted += cipher.final('hex');
  
//   return `${iv.toString('hex')}:${encrypted}`;
// }

// // Helper function to decrypt tokens
// function decryptToken(encryptedToken) {
//   try {
//     const algorithm = 'aes-256-gcm';
//     const secretKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
//     const key = crypto.scryptSync(secretKey, 'salt', 32);
    
//     const [ivHex, encrypted] = encryptedToken.split(':');
//     const iv = Buffer.from(ivHex, 'hex');
    
//     const decipher = crypto.createDecipher(algorithm, key);
//     let decrypted = decipher.update(encrypted, 'hex', 'utf8');
//     decrypted += decipher.final('utf8');
    
//     return decrypted;
//   } catch (error) {
//     console.error('Token decryption error:', error);
//     return null;
//   }
// }
