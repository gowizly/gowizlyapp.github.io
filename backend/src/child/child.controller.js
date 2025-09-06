import prisma from "../config/db.js";
import { logInfo, logError, logWarn, logDebug } from "../utils/logger.js";

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
    const allowedFields = ['name', 'gradeLevel', 'schoolName', 'birthDate'];
    
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

