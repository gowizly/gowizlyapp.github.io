import { body, validationResult } from "express-validator";

// Validation middleware
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      msg: "Validation failed",
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg
      }))
    });
  }
  next();
};

// Registration validation
export const validateRegistration = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
  
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
  
  validateRequest
];

// Validation for resend verification email
export const validateResendVerification = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail()
    .trim(),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Validation failed",
        errors: errors.array().reduce((acc, error) => {
          acc[error.path] = error.msg;
          return acc;
        }, {})
      });
    }
    next();
  }
];

// Login validation
export const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
  
  validateRequest
];

// Forgot password validation
export const validateForgotPassword = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  
  validateRequest
];

// Reset password validation
export const validateResetPassword = [
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
  
  validateRequest
];

// User profile update validation
export const validateUserProfileUpdate = [
  body("username")
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("Username must be between 3 and 50 characters")
    .matches(/^[a-zA-Z0-9_\-\.]+$/)
    .withMessage("Username can only contain letters, numbers, underscores, hyphens, and dots"),
  
  body("email")
    .custom((value) => {
      if (value !== undefined) {
        throw new Error("Email cannot be changed. Contact support if you need to update your email address.");
      }
      return true;
    }),
  
  body("address")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Address cannot exceed 500 characters"),
  
  validateRequest
];

// Child validation
export const validateChild = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Child name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage("Child name can only contain letters, spaces, hyphens, and apostrophes"),
  
  body("gradeLevel")
    .trim()
    .isIn([
      "Pre-K", "Kindergarten", "1st Grade", "2nd Grade", "3rd Grade", 
      "4th Grade", "5th Grade", "6th Grade", "7th Grade", "8th Grade",
      "9th Grade", "10th Grade", "11th Grade", "12th Grade"
    ])
    .withMessage("Please select a valid grade level"),
  
  body("schoolName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("School name must be between 2 and 100 characters"),
  
  body("birthDate")
    .notEmpty()
    .withMessage("Birth date is required")
    .isISO8601()
    .withMessage("Birth date must be a valid date")
    .custom((value) => {
      const birthDate = new Date(value);
      
      if (isNaN(birthDate.getTime())) {
        throw new Error("Birth date must be a valid date");
      }
      
      // Compare dates only (strip time component)
      const today = new Date();
      const birthDateOnly = new Date(birthDate.getFullYear(), birthDate.getMonth(), birthDate.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Birth date must be before today (not today or future)
      if (birthDateOnly >= todayOnly) {
        throw new Error("Birth date must be in the past");
      }
      
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();
      
      // Adjust age if birthday hasn't occurred this year
      const actualAge = (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) ? age - 1 : age;
      
      // Validate exclusive age range: must be > 0 and < 21
      if (actualAge >= 21) {
        throw new Error("Child must be under 21 years old");
      }
      
      return true;
    }),
  
  validateRequest
];

// Update child validation (allows partial updates)
export const validateChildUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Child name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage("Child name can only contain letters, spaces, hyphens, and apostrophes"),
  
  body("gradeLevel")
    .optional()
    .trim()
    .isIn([
      "Pre-K", "Kindergarten", "1st Grade", "2nd Grade", "3rd Grade", 
      "4th Grade", "5th Grade", "6th Grade", "7th Grade", "8th Grade",
      "9th Grade", "10th Grade", "11th Grade", "12th Grade"
    ])
    .withMessage("Please select a valid grade level"),
  
  body("schoolName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("School name must be between 2 and 100 characters"),
  
  body("birthDate")
    .optional()
    .isISO8601()
    .withMessage("Birth date must be a valid date")
    .custom((value) => {
      if (value) {
        const birthDate = new Date(value);
        
        if (isNaN(birthDate.getTime())) {
          throw new Error("Birth date must be a valid date");
        }
        
        // Compare dates only (strip time component)
        const today = new Date();
        const birthDateOnly = new Date(birthDate.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        // Birth date must be before today (not today or future)
        if (birthDateOnly >= todayOnly) {
          throw new Error("Birth date must be in the past");
        }
        
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayDiff = today.getDate() - birthDate.getDate();
        
        // Adjust age if birthday hasn't occurred this year
        const actualAge = (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) ? age - 1 : age;
        
        // Validate exclusive age range: must be > 0 and < 21
        if (actualAge >= 21) {
          throw new Error("Child must be under 21 years old");
        }
      }
      return true;
    }),
  
  validateRequest
];

// Event validation
export const validateEvent = [
  body("title")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Event title must be between 1 and 200 characters"),
  
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Event description cannot exceed 1000 characters"),
  
  body("startDate")
    .isISO8601()
    .withMessage("Start date must be a valid date")
    .custom((value) => {
      const startDate = new Date(value);
      const now = new Date();
      // Allow events from yesterday to accommodate timezone differences
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      if (startDate < yesterday) {
        throw new Error("Start date cannot be in the past");
      }
      return true;
    }),
  
  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid date"),
    // .custom((value, { req }) => {
    //   if (value && req.body.startDate) {
    //     const startDate = new Date(req.body.startDate);
    //     const endDate = new Date(value);
    //     if (endDate <= startDate) {
    //       throw new Error("End date must be after start date");
    //     }
    //   }
    //   return true;
    // }),
  
  body("isAllDay")
    .optional()
    .isBoolean()
    .withMessage("isAllDay must be a boolean value"),
  
  body("type")
    .optional()
    .isIn([
      "SCHOOL_EVENT", "ASSIGNMENT_DUE", "EXAM", "PARENT_MEETING", 
      "EXTRACURRICULAR", "APPOINTMENT", "BIRTHDAY", "HOLIDAY", 
      "REMINDER", "OTHER"
    ])
    .withMessage("Please select a valid event type"),
  
  body("priority")
    .optional()
    .isIn(["LOW", "MEDIUM", "HIGH", "URGENT"])
    .withMessage("Please select a valid priority level"),
  
  body("color")
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage("Color must be a valid hex color code"),
  
  body("childId")
    .optional(),
    // .isInt({ min: 1 })
    // .withMessage("Child ID must be a positive integer"),
  
  body("reminderMinutes")
    .optional()
    .isInt({ min: 0, max: 43200 }) // Max 30 days
    .withMessage("Reminder must be between 0 and 43200 minutes"),
  
  validateRequest
];

// Update event validation (allows partial updates)
export const validateEventUpdate = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Event title must be between 1 and 200 characters"),
  
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Event description cannot exceed 1000 characters"),
  
  body("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid date"),
  
  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid date"),
    // .custom((value, { req }) => {
    //   if (value && req.body.startDate) {
    //     const startDate = new Date(req.body.startDate);
    //     const endDate = new Date(value);
    //     if (endDate <= startDate) {
    //       throw new Error("End date must be after start date");
    //     }
    //   }
    //   return true;
    // }),
  
  body("isAllDay")
    .optional()
    .isBoolean()
    .withMessage("isAllDay must be a boolean value"),
  
  body("type")
    .optional()
    .isIn([
      "SCHOOL_EVENT", "ASSIGNMENT_DUE", "EXAM", "PARENT_MEETING", 
      "EXTRACURRICULAR", "APPOINTMENT", "BIRTHDAY", "HOLIDAY", 
      "REMINDER", "OTHER"
    ])
    .withMessage("Please select a valid event type"),
  
  body("priority")
    .optional()
    .isIn(["LOW", "MEDIUM", "HIGH", "URGENT"])
    .withMessage("Please select a valid priority level"),
  
  body("color")
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage("Color must be a valid hex color code"),
  
  body("childId")
    .optional(),
    // .isInt({ min: 1 })
    // .withMessage("Child ID must be a positive integer"),
  
  body("reminderMinutes")
    .optional()
    .isInt({ min: 0, max: 43200 }) // Max 30 days
    .withMessage("Reminder must be between 0 and 43200 minutes"),
  
  validateRequest
];

// Assistant email analysis validation
export const validateEmailAnalysis = [
  body("emailContent")
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage("Email content must be between 10 and 10000 characters"),
  
  body("childId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Child ID must be a positive integer"),
  
  validateRequest
];

// Assistant event creation validation
export const validateAssistantEventCreation = [
  body("eventData")
    .isObject()
    .withMessage("Event data must be an object"),
  
  body("eventData.title")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Event title must be between 1 and 200 characters"),
  
  body("eventData.startDate")
    .isISO8601()
    .withMessage("Start date must be a valid date"),
  
  body("eventData.endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid date"),
  
  body("eventData.type")
    .optional()
    .isIn([
      "SCHOOL_EVENT", "ASSIGNMENT_DUE", "EXAM", "PARENT_MEETING", 
      "EXTRACURRICULAR", "APPOINTMENT", "BIRTHDAY", "HOLIDAY", 
      "REMINDER", "OTHER"
    ])
    .withMessage("Please select a valid event type"),
  
  body("eventData.priority")
    .optional()
    .isIn(["LOW", "MEDIUM", "HIGH", "URGENT"])
    .withMessage("Please select a valid priority level"),
  
  body("eventData.childId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Child ID must be a positive integer"),
  
  validateRequest
];
