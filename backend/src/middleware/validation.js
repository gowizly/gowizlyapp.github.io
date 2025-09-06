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
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Username can only contain letters, numbers, underscores, and hyphens"),
  
  body("email")
    .optional()
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  
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
    .optional()
    .isISO8601()
    .withMessage("Birth date must be a valid date")
    .custom((value) => {
      if (value) {
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 3 || age > 19) {
          throw new Error("Child must be between 3 and 19 years old");
        }
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
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 3 || age > 19) {
          throw new Error("Child must be between 3 and 19 years old");
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
    .withMessage("End date must be a valid date")
    .custom((value, { req }) => {
      if (value && req.body.startDate) {
        const startDate = new Date(req.body.startDate);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          throw new Error("End date must be after start date");
        }
      }
      return true;
    }),
  
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
    .optional()
    .isInt({ min: 1 })
    .withMessage("Child ID must be a positive integer"),
  
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
    .withMessage("End date must be a valid date")
    .custom((value, { req }) => {
      if (value && req.body.startDate) {
        const startDate = new Date(req.body.startDate);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          throw new Error("End date must be after start date");
        }
      }
      return true;
    }),
  
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
    .optional()
    .isInt({ min: 1 })
    .withMessage("Child ID must be a positive integer"),
  
  body("reminderMinutes")
    .optional()
    .isInt({ min: 0, max: 43200 }) // Max 30 days
    .withMessage("Reminder must be between 0 and 43200 minutes"),
  
  validateRequest
];
