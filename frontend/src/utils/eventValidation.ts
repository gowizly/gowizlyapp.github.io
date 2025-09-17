import { Event, EventType, EventPriority } from '../services/eventApi';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export const validateEvent = (eventData: Partial<Event>): ValidationResult => {
  const errors: ValidationError[] = [];

  // Title validation
  if (eventData.title !== undefined) {
    if (!eventData.title || eventData.title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Event title is required' });
    } else if (eventData.title.trim().length > 200) {
      errors.push({ field: 'title', message: 'Event title must be between 1 and 200 characters' });
    }
  }

  // Description validation
  if (eventData.description !== undefined && eventData.description !== null) {
    if (eventData.description.trim().length > 1000) {
      errors.push({ field: 'description', message: 'Event description cannot exceed 1000 characters' });
    }
  }

  // Start date validation
  if (eventData.startDate !== undefined) {
    if (!eventData.startDate) {
      errors.push({ field: 'startDate', message: 'Start date is required' });
    } else {
      const startDate = new Date(eventData.startDate);
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      if (isNaN(startDate.getTime())) {
        errors.push({ field: 'startDate', message: 'Start date must be a valid date' });
      } else if (startDate < yesterday) {
        errors.push({ field: 'startDate', message: 'Start date cannot be in the past' });
      }
    }
  }

  // End date validation
  if (eventData.endDate !== undefined) {
    if (eventData.endDate !== null) {
      const endDate = new Date(eventData.endDate);
      
      if (isNaN(endDate.getTime())) {
        errors.push({ field: 'endDate', message: 'End date must be a valid date' });
      }
    } else {
      errors.push({ field: 'endDate', message: 'End date is required' });
    }
  }

  // Event type validation
  if (eventData.type !== undefined) {
    const validTypes: EventType[] = [
      'SCHOOL_EVENT', 'ASSIGNMENT_DUE', 'EXAM', 'PARENT_MEETING',
      'EXTRACURRICULAR', 'APPOINTMENT', 'BIRTHDAY', 'HOLIDAY',
      'REMINDER', 'OTHER'
    ];
    
    if (!validTypes.includes(eventData.type)) {
      errors.push({ field: 'type', message: 'Please select a valid event type' });
    }
  }

  // Priority validation
  if (eventData.priority !== undefined) {
    const validPriorities: EventPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    
    if (!validPriorities.includes(eventData.priority)) {
      errors.push({ field: 'priority', message: 'Please select a valid priority level' });
    }
  }

  // Color validation
  if (eventData.color !== undefined && eventData.color !== null) {
    if (eventData.color && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(eventData.color)) {
      errors.push({ field: 'color', message: 'Color must be a valid hex color code' });
    }
  }
  if (eventData.childId !== undefined) {
    if (eventData.childId !== null && (!Number.isInteger(eventData.childId) || eventData.childId < -1)) {
      errors.push({ field: 'childId', message: 'Child ID must be -1, 0, or a positive integer' });
    }
  }

  // Reminder minutes validation
  if (eventData.reminderMinutes !== undefined && eventData.reminderMinutes !== null) {
    if (!Number.isInteger(eventData.reminderMinutes) || eventData.reminderMinutes < 0 || eventData.reminderMinutes > 43200) {
      errors.push({ field: 'reminderMinutes', message: 'Reminder must be between 0 and 43200 minutes' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateEventForCreation = (eventData: Omit<Event, 'id'>): ValidationResult => {
  const errors: ValidationError[] = [];

  // Required field validations
  if (!eventData.title || eventData.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Event title is required' });
  }

  if (!eventData.startDate) {
    errors.push({ field: 'startDate', message: 'Start date is required' });
  }

  if (!eventData.type) {
    errors.push({ field: 'type', message: 'Event type is required' });
  }
  if (eventData.startTime && eventData.endTime) {
    if (eventData.startTime >= eventData.endTime) {
      errors.push({ field: 'startTime', message: 'Start time must be before end time' });
    }
    if (eventData.startTime == eventData.endTime) {
      errors.push({ field: 'startTime', message: 'Start time and end time cannot be the same' });
    }
  }
  if (eventData.childId === undefined || 
      (typeof eventData.childId === 'number' && eventData.childId < -1)) {
    errors.push({ field: 'childId', message: 'Please select an assignment option' });
  }

  // Run standard validation
  const standardValidation = validateEvent(eventData);
  
  return {
    isValid: errors.length === 0 && standardValidation.isValid,
    errors: [...errors, ...standardValidation.errors]
  };
};

// Individual field validation functions for real-time validation
export const validateTitle = (title: string): ValidationError | null => {
  if (!title || title.trim().length === 0) {
    return { field: 'title', message: 'Event title is required' };
  }
  
  if (title.trim().length > 200) {
    return { field: 'title', message: 'Event title must be between 1 and 200 characters' };
  }
  
  return null;
};

export const validateDescription = (description: string): ValidationError | null => {
  if (description && description.trim().length > 1000) {
    return { field: 'description', message: 'Event description cannot exceed 1000 characters' };
  }
  
  return null;
};

export const validateStartDate = (startDate: string): ValidationError | null => {
  if (!startDate) {
    return { field: 'startDate', message: 'Start date is required' };
  }
  
  const date = new Date(startDate);
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  if (isNaN(date.getTime())) {
    return { field: 'startDate', message: 'Start date must be a valid date' };
  }
  
  if (date < yesterday) {
    return { field: 'startDate', message: 'Start date cannot be in the past' };
  }
  
  return null;
};

export const validateEndDate = (endDate: string, startDate?: string): ValidationError | null => {
  if (!endDate) {
    return null; // End date is optional
  }
  
  const endDateObj = new Date(endDate);
  
  if (isNaN(endDateObj.getTime())) {
    return { field: 'endDate', message: 'End date must be a valid date' };
  }
  
  if (startDate) {
    const startDateObj = new Date(startDate);
    if (!isNaN(startDateObj.getTime()) && endDateObj < startDateObj) {
      return { field: 'endDate', message: 'End date must be on or after start date' };
    }
  }
  
  return null;
};

export const validateEventType = (type: string): ValidationError | null => {
  if (!type) {
    return { field: 'type', message: 'Event type is required' };
  }
  
  const validTypes: EventType[] = [
    'SCHOOL_EVENT', 'ASSIGNMENT_DUE', 'EXAM', 'PARENT_MEETING',
    'EXTRACURRICULAR', 'APPOINTMENT', 'BIRTHDAY', 'HOLIDAY',
    'REMINDER', 'OTHER'
  ];
  
  if (!validTypes.includes(type as EventType)) {
    return { field: 'type', message: 'Please select a valid event type' };
  }
  
  return null;
};

export const validatePriority = (priority: string): ValidationError | null => {
  const validPriorities: EventPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  
  if (!validPriorities.includes(priority as EventPriority)) {
    return { field: 'priority', message: 'Please select a valid priority level' };
  }
  
  return null;
};

export const validateChildId = (childId: number | null): ValidationError | null => {
  if (childId !== null && (!Number.isInteger(childId) || childId < -1)) {
    return { field: 'childId', message: 'Please select a valid assignment option' };
  }
  
  return null;
};

export const validateStartTime = (startTime: string): ValidationError | null => {
  if (!startTime) {
    return null; // Start time is optional for all-day events
  }
  
  return null;
};

export const validateEndTime = (endTime: string): ValidationError | null => {
  if (!endTime) {
    return null; // End time is optional for all-day events
  }
  
  return null;
};
