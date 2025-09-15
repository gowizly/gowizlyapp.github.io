export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isValid: boolean;
}

export const validateUsername = (username: string): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!username || username.trim().length === 0) {
    errors.push({ field: 'username', message: 'Username is required' });
    return errors;
  }

  const trimmedUsername = username.trim();

  if (trimmedUsername.length < 2) {
    errors.push({ field: 'username', message: 'Username must be at least 2 characters long' });
  }

  if (trimmedUsername.length > 50) {
    errors.push({ field: 'username', message: 'Username cannot exceed 50 characters' });
  }

  // Check for valid characters (letters, numbers, underscore, hyphen)
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
    errors.push({ field: 'username', message: 'Username can only contain letters, numbers, underscores, and hyphens' });
  }

  // Cannot start with number
  if (/^[0-9]/.test(trimmedUsername)) {
    errors.push({ field: 'username', message: 'Username cannot start with a number' });
  }

  // Cannot be only numbers
  if (/^[0-9]+$/.test(trimmedUsername)) {
    errors.push({ field: 'username', message: 'Username cannot be only numbers' });
  }

  return errors;
};

export const validateEmail = (email: string): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!email || email.trim().length === 0) {
    errors.push({ field: 'email', message: 'Email address is required' });
    return errors;
  }

  const trimmedEmail = email.trim();

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
    return errors;
  }

  // Additional email validations
  if (trimmedEmail.length > 254) {
    errors.push({ field: 'email', message: 'Email address is too long' });
  }

  // Check for common typos in domains
  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
  const domain = trimmedEmail.split('@')[1]?.toLowerCase();
  const suggestions: Record<string, string> = {
    'gmial.com': 'gmail.com',
    'gmail.co': 'gmail.com',
    'gmai.com': 'gmail.com',
    'yahooo.com': 'yahoo.com',
    'yaho.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
    'hotmai.com': 'hotmail.com'
  };

  if (domain && suggestions[domain]) {
    errors.push({ field: 'email', message: `Did you mean ${trimmedEmail.replace(domain, suggestions[domain])}?` });
  }

  return errors;
};

export const analyzePasswordStrength = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;

  if (!password) {
    return { score: 0, feedback: ['Password is required'], isValid: false };
  }

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('At least 8 characters');
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('At least one uppercase letter');
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('At least one lowercase letter');
  }

  // Number check
  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('At least one number');
  }

  // Special character check
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  } else {
    feedback.push('At least one special character');
  }

  // Bonus checks
  if (password.length >= 12) {
    score += 0.5;
  }

  // Penalty for common patterns
  if (/123456|password|qwerty|abc123/i.test(password)) {
    score -= 2;
    feedback.push('Avoid common patterns like "123456" or "password"');
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(4, score));

  return {
    score: Math.floor(score),
    feedback,
    isValid: score >= 4 && feedback.length === 0
  };
};

export const validatePassword = (password: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  const strength = analyzePasswordStrength(password);

  if (!strength.isValid) {
    strength.feedback.forEach(message => {
      errors.push({ field: 'password', message });
    });
  }

  return errors;
};

export const validatePasswordConfirmation = (password: string, confirmPassword: string): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!confirmPassword || confirmPassword.trim().length === 0) {
    errors.push({ field: 'confirmPassword', message: 'Please confirm your password' });
    return errors;
  }

  if (password !== confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
  }

  return errors;
};

export const validateSignupForm = (formData: {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}): ValidationResult => {
  const allErrors: ValidationError[] = [];

  // Validate each field
  allErrors.push(...validateUsername(formData.username));
  allErrors.push(...validateEmail(formData.email));
  allErrors.push(...validatePassword(formData.password));
  allErrors.push(...validatePasswordConfirmation(formData.password, formData.confirmPassword));

  // Terms validation
  if (!formData.acceptTerms) {
    allErrors.push({ field: 'acceptTerms', message: 'You must accept the terms and conditions' });
  }

  // Convert to object format
  const errors: Record<string, string> = {};
  allErrors.forEach(error => {
    if (!errors[error.field]) {
      errors[error.field] = error.message;
    }
  });

  return {
    isValid: allErrors.length === 0,
    errors
  };
};

export const getPasswordStrengthColor = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return 'text-red-600';
    case 2:
      return 'text-orange-500';
    case 3:
      return 'text-yellow-500';
    case 4:
      return 'text-green-600';
    default:
      return 'text-gray-500';
  }
};

export const getPasswordStrengthText = (score: number): string => {
  switch (score) {
    case 0:
      return 'Very Weak';
    case 1:
      return 'Weak';
    case 2:
      return 'Fair';
    case 3:
      return 'Good';
    case 4:
      return 'Strong';
    default:
      return '';
  }
};

export const getPasswordStrengthWidth = (score: number): string => {
  switch (score) {
    case 0:
      return 'w-1/5';
    case 1:
      return 'w-2/5';
    case 2:
      return 'w-3/5';
    case 3:
      return 'w-4/5';
    case 4:
      return 'w-full';
    default:
      return 'w-0';
  }
};
