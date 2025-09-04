import { Child } from '../services/childApi';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Valid grade levels that match backend validation
export const VALID_GRADE_LEVELS = [
  "Pre-K", "Kindergarten", "1st Grade", "2nd Grade", "3rd Grade", 
  "4th Grade", "5th Grade", "6th Grade", "7th Grade", "8th Grade",
  "9th Grade", "10th Grade", "11th Grade", "12th Grade"
];

export const validateChild = (childData: Partial<Child>): ValidationResult => {
  const errors: ValidationError[] = [];

  // Name validation
  if (childData.name !== undefined) {
    if (!childData.name || childData.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Child name is required' });
    } else {
      const trimmedName = childData.name.trim();
      
      if (trimmedName.length < 2 || trimmedName.length > 50) {
        errors.push({ field: 'name', message: 'Child name must be between 2 and 50 characters' });
      }
      
      // Check if name contains only letters, spaces, hyphens, and apostrophes
      if (!/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
        errors.push({ field: 'name', message: 'Child name can only contain letters, spaces, hyphens, and apostrophes' });
      }
    }
  }

  // Grade level validation
  if (childData.gradeLevel !== undefined) {
    if (!childData.gradeLevel || childData.gradeLevel.trim().length === 0) {
      errors.push({ field: 'gradeLevel', message: 'Grade level is required' });
    } else if (!VALID_GRADE_LEVELS.includes(childData.gradeLevel.trim())) {
      errors.push({ field: 'gradeLevel', message: 'Please select a valid grade level' });
    }
  }

  // School name validation
  if (childData.schoolName !== undefined) {
    if (!childData.schoolName || childData.schoolName.trim().length === 0) {
      errors.push({ field: 'schoolName', message: 'School name is required' });
    } else {
      const trimmedSchoolName = childData.schoolName.trim();
      
      if (trimmedSchoolName.length < 2 || trimmedSchoolName.length > 100) {
        errors.push({ field: 'schoolName', message: 'School name must be between 2 and 100 characters' });
      }
    }
  }

  // Birth date validation
  if (childData.birthDate !== undefined && childData.birthDate !== null && childData.birthDate !== '') {
    const birthDate = new Date(childData.birthDate);
    
    if (isNaN(birthDate.getTime())) {
      errors.push({ field: 'birthDate', message: 'Birth date must be a valid date' });
    } else {
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();
      
      // Adjust age if birthday hasn't occurred this year
      const actualAge = (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) ? age - 1 : age;
      
      if (actualAge < 3 || actualAge > 19) {
        errors.push({ field: 'birthDate', message: 'Child must be between 3 and 19 years old' });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateChildForCreation = (childData: Omit<Child, 'id'>): ValidationResult => {
  const errors: ValidationError[] = [];

  // Required field validations for creation
  if (!childData.name || childData.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Child name is required' });
  }

  if (!childData.gradeLevel || childData.gradeLevel.trim().length === 0) {
    errors.push({ field: 'gradeLevel', message: 'Grade level is required' });
  }

  if (!childData.schoolName || childData.schoolName.trim().length === 0) {
    errors.push({ field: 'schoolName', message: 'School name is required' });
  }

  if (!childData.birthDate || childData.birthDate.trim().length === 0) {
    errors.push({ field: 'birthDate', message: 'Birth date is required' });
  }

  // Run standard validation
  const standardValidation = validateChild(childData);
  
  return {
    isValid: errors.length === 0 && standardValidation.isValid,
    errors: [...errors, ...standardValidation.errors]
  };
};

export const validateChildForUpdate = (childData: Partial<Child>): ValidationResult => {
  // For updates, all fields are optional but must be valid if provided
  return validateChild(childData);
};
