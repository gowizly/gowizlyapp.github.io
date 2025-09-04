import rateLimit from "express-rate-limit";

// General auth rate limiter
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    msg: "Too many authentication attempts, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for password reset
export const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    msg: "Too many password reset attempts, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Registration rate limiter
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 3 registrations per hour
  message: {
    success: false,
    msg: "Too many registration attempts, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});
