import React, { useCallback, useState, useEffect } from 'react';
import { X, Trash2, Check, AlertCircle } from 'lucide-react';
import { Event, EventType, EventPriority, eventApiService } from '../../services/eventApi';
import { 
  validateEventForCreation, 
  ValidationError, 
  validateTitle,
  validateDescription,
  validateStartDate,
  validateEndDate,
  validateEventType,
  validatePriority,
  validateChildId,
  validateStartTime,
  validateEndTime
} from '../../utils/eventValidation';
import { useToast } from '../../contexts/ToastContext';

// Define static objects outside component to prevent re-creation on every render
const EVENT_TYPE_OPTIONS = {
  ASSIGNMENT_DUE: { color: 'bg-purple-500', label: 'Assignment Due' },
  EXTRACURRICULAR: { color: 'bg-red-500', label: 'Extracurricular Event' },
  SCHOOL_EVENT: { color: 'bg-blue-500', label: 'School Event' },
  PARENT_MEETING: { color: 'bg-green-500', label: 'Parent Meeting' },
  HOLIDAY: { color: 'bg-yellow-500', label: 'Holiday' },
  BIRTHDAY: { color: 'bg-pink-500', label: 'Birthday' },
  APPOINTMENT: { color: 'bg-indigo-500', label: 'Appointment' },
  REMINDER: { color: 'bg-cyan-500', label: 'Reminder' },
  EXAM: { color: 'bg-orange-500', label: 'Exam' },
  OTHER: { color: 'bg-gray-500', label: 'Other' }
} as const;

const EVENT_PRIORITY_OPTIONS = {
  LOW: { label: 'Low', color: 'text-gray-500' },
  MEDIUM: { label: 'Medium', color: 'text-yellow-500' },
  HIGH: { label: 'High', color: 'text-red-500' },
  URGENT: { label: 'Urgent', color: 'text-red-700' }
} as const;

const EVENT_TYPE_COLORS: Record<EventType, string> = {
  ASSIGNMENT_DUE: '#8b5cf6', // purple-500
  EXTRACURRICULAR: '#ef4444', // red-500
  SCHOOL_EVENT: '#3b82f6', // blue-500
  PARENT_MEETING: '#10b981', // green-500
  HOLIDAY: '#eab308', // yellow-500
  BIRTHDAY: '#ec4899', // pink-500
  APPOINTMENT: '#6366f1', // indigo-500
  REMINDER: '#06b6d4', // cyan-500
  EXAM: '#f97316', // orange-500
  OTHER: '#6b7280' // gray-500
};

interface LocalChild {
  id: number | null;
  name: string;
  gradeLevel: string;
  schoolName: string;
  birthDate?: string;
}

interface EventFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  type: EventType;
  priority: EventPriority;
  color: string;
  childId: number | null;
  hasReminder: boolean;
  reminderMinutes: number;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: LocalChild[];
  mode: 'create' | 'edit';
  event?: Event; // Only required for edit mode
  onEventCreated?: () => void;
  onEventUpdated?: () => void;
  onEventDeleted?: () => void;
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  children,
  mode,
  event,
  onEventCreated,
  onEventUpdated,
  onEventDeleted
}) => {
  const { showError, showSuccess } = useToast();
  
  const [eventData, setEventData] = useState<EventFormData>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '10:00',
    isAllDay: false,
    type: 'OTHER' as EventType,
    priority: 'MEDIUM' as EventPriority,
    color: EVENT_TYPE_COLORS.OTHER,
    childId: null as number | null,
    hasReminder: false,
    reminderMinutes: 10
  });
  
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Real-time validation states
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({
    title: false,
    description: false,
    startDate: false,
    endDate: false,
    startTime: false,
    endTime: false,
    type: false,
    priority: false,
    childId: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = useCallback((isoDate?: string | null) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    return date.toISOString().split('T')[0];
  }, []);

  // Extract time from datetime string (HH:MM format)
  const extractTimeFromDateTime = useCallback((dateTimeString?: string | null) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return '';
    return date.toTimeString().slice(0, 5); // Returns HH:MM format
  }, []);

  // Initialize form data when modal opens or event changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && event) {
        // Edit mode - populate with existing event data
        const startDateForInput = event.startDateOnly || formatDateForInput(event.startDate);
        const endDateForInput = event.endDateOnly || formatDateForInput(event.endDate ?? null);
        const eventChildId = event.childId || null;
        
        setEventData({
          title: event.title || '',
          description: event.description || '',
          startDate: startDateForInput,
          endDate: endDateForInput,
          startTime: event.startTime || extractTimeFromDateTime(event.startDate) || '09:00',
          endTime: event.endTime || extractTimeFromDateTime(event.endDate ?? null) || '10:00',
          isAllDay: event.isAllDay || false,
          type: event.type,
          priority: event.priority,
          color: event.color || EVENT_TYPE_COLORS[event.type],
          childId: eventChildId,
          hasReminder: event.hasReminder || false,
          reminderMinutes: event.reminderMinutes || 10
        });
      } else {
        // Create mode - reset to default values
        setEventData({
          title: '',
          description: '',
          startDate: '',
          endDate: '',
          startTime: '09:00',
          endTime: '10:00',
          isAllDay: false,
          type: 'OTHER' as EventType,
          priority: 'MEDIUM' as EventPriority,
          color: EVENT_TYPE_COLORS.OTHER,
          childId: null as number | null,
          hasReminder: false,
          reminderMinutes: 10
        });
      }
      
      // Reset validation states
      setValidationErrors([]);
      setShowDeleteConfirm(false);
      setFieldTouched({
        title: false,
        description: false,
        startDate: false,
        endDate: false,
        startTime: false,
        endTime: false,
        type: false,
        priority: false,
        childId: false,
      });
      setFieldErrors({});
    }
  }, [isOpen, mode, event, formatDateForInput, extractTimeFromDateTime]);

  // Real-time field validation
  const validateField = (fieldName: string, value: string | number | null, crossValidationData?: Partial<EventFormData>) => {
    let error: ValidationError | null = null;
    const dataToUse = crossValidationData || eventData;
    
    switch (fieldName) {
      case 'title':
        error = validateTitle(value as string);
        break;
      case 'description':
        error = validateDescription(value as string);
        break;
      case 'startDate':
        error = validateStartDate(value as string);
        break;
      case 'endDate':
        error = validateEndDate(value as string, dataToUse.startDate);
        break;
      case 'type':
        error = validateEventType(value as string);
        break;
      case 'priority':
        error = validatePriority(value as string);
        break;
      case 'childId':
        error = validateChildId(value as number | null);
        break;
      case 'startTime':
        if (!dataToUse.isAllDay) {
          error = validateStartTime(value as string);
        }
        break;
      case 'endTime':
        if (!dataToUse.isAllDay) {
          error = validateEndTime(value as string);
        }
        break;
    }
    
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: error ? error.message : ''
    }));
    
    return error === null;
  };

  const handleFieldChange = (fieldName: string, value: string | number | boolean | null) => {
    // Special handling for type changes
    if (fieldName === 'type' && typeof value === 'string') {
      setEventData(prev => ({ 
        ...prev, 
        type: value as EventType,
        color: EVENT_TYPE_COLORS[value as EventType]
      }));
      // Validate if field has been touched
      if (fieldTouched[fieldName]) {
        validateField(fieldName, value);
      }
      return;
    }
    
    // Special handling for all-day toggle
    if (fieldName === 'isAllDay' && typeof value === 'boolean') {
      setEventData(prev => ({ ...prev, isAllDay: value }));
      // Clear time validation errors when switching to all-day
      if (value) {
        setFieldErrors(prev => ({
          ...prev,
          startTime: '',
          endTime: ''
        }));
      }
      return;
    }
    
    // Special handling for childId
    if (fieldName === 'childId') {
      setEventData(prev => ({ ...prev, childId: value as number | null }));
      // Validate if field has been touched
      if (fieldTouched[fieldName]) {
        validateField(fieldName, value as number | null);
      }
      return;
    }
    
    // General string field handling
    if (typeof value === 'string') {
      setEventData(prev => {
        const newData = { ...prev, [fieldName]: value } as EventFormData;
        
        // Immediate cross-field validation after state update
        setTimeout(() => {
          if (fieldName === 'startDate') {
            // When start date changes, immediately validate end date if it exists
            if (newData.endDate) {
              setFieldTouched(prevTouched => ({ ...prevTouched, endDate: true }));
              validateField('endDate', newData.endDate, newData);
            }
          }
          if (fieldName === 'endDate') {
            // When end date changes, immediately validate start date if it exists  
            if (newData.startDate) {
              setFieldTouched(prevTouched => ({ ...prevTouched, startDate: true }));
              validateField('startDate', newData.startDate, newData);
            }
          }
          if (fieldName === 'startTime' && !newData.isAllDay) {
            // When start time changes, immediately validate end time if it exists
            if (newData.endTime) {
              setFieldTouched(prevTouched => ({ ...prevTouched, endTime: true }));
              validateField('endTime', newData.endTime, newData);
            }
          }
          if (fieldName === 'endTime' && !newData.isAllDay) {
            // When end time changes, immediately validate start time if it exists
            if (newData.startTime) {
              setFieldTouched(prevTouched => ({ ...prevTouched, startTime: true }));
              validateField('startTime', newData.startTime, newData);
            }
          }
        }, 0);
        
        return newData;
      });
      
      // Validate current field if it has been touched
      if (fieldTouched[fieldName]) {
        validateField(fieldName, value);
      }
    }
  };

  const handleFieldBlur = (fieldName: string, value: string | number | null) => {
    setFieldTouched(prev => ({ ...prev, [fieldName]: true }));
    validateField(fieldName, value);
  };

  const getFieldClassName = (fieldName: string) => {
    const baseClasses = "w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors";
    
    if (!fieldTouched[fieldName]) {
      return `${baseClasses} border-gray-300`;
    }
    
    if (fieldErrors[fieldName]) {
      return `${baseClasses} border-red-500 focus:ring-red-500`;
    }
    
    return `${baseClasses} border-green-500 focus:ring-green-500`;
  };

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent double submission
    
    setIsSubmitting(true);
    setValidationErrors([]);
    
    // Run real-time validation on all fields
    const titleValid = validateField('title', eventData.title);
    const descriptionValid = validateField('description', eventData.description);
    const startDateValid = validateField('startDate', eventData.startDate);
    const endDateValid = validateField('endDate', eventData.endDate);
    const typeValid = validateField('type', eventData.type);
    const priorityValid = validateField('priority', eventData.priority);
    const childIdValid = validateField('childId', eventData.childId);
    const startTimeValid = eventData.isAllDay || validateField('startTime', eventData.startTime);
    const endTimeValid = eventData.isAllDay || validateField('endTime', eventData.endTime);

    // Mark all fields as touched
    setFieldTouched({
      title: true,
      description: true,
      startDate: true,
      endDate: true,
      startTime: true,
      endTime: true,
      type: true,
      priority: true,
      childId: true,
    });

    // Check if all fields are valid
    if (!titleValid || !descriptionValid || !startDateValid || !endDateValid || 
        !typeValid || !priorityValid || !childIdValid || !startTimeValid || !endTimeValid) {
      console.warn('⚠️ Event validation failed: Real-time validation errors found');
      setIsSubmitting(false);
      return;
    }

    // Validate event data with comprehensive validation
    const finalEndDate = eventData.endDate || eventData.startDate;
    
    const validationData = {
      ...eventData,
      endDate: finalEndDate,
      startTime: eventData.isAllDay ? '' : eventData.startTime,
      endTime: eventData.isAllDay ? '' : eventData.endTime,
      hasReminder: eventData.hasReminder,
      reminderMinutes: eventData.hasReminder ? eventData.reminderMinutes : undefined
    };

    const validation = validateEventForCreation(validationData);
    
    if (!validation.isValid) {
      console.warn('⚠️ Event validation failed:', validation.errors);
      setValidationErrors(validation.errors);
      
      // Show toast notification for validation errors
      const errorMessages = validation.errors.map(err => err.message).join(', ');
      showError('Validation Error', errorMessages);
      setIsSubmitting(false);
      return;
    }

    // Prepare the payload for the API
    const apiPayload = {
      title: eventData.title,
      description: eventData.description,
      startDate: eventData.startDate,
      endDate: finalEndDate,
      startTime: eventData.isAllDay ? '' : eventData.startTime,
      endTime: eventData.isAllDay ? '' : eventData.endTime,
      isAllDay: eventData.isAllDay,
      type: eventData.type,
      priority: eventData.priority,
      color: eventData.color,
      childId: eventData.childId,
      hasReminder: eventData.hasReminder,
      reminderMinutes: eventData.hasReminder ? eventData.reminderMinutes : undefined
    };

    if (mode === 'create') {
      // Create new event
      console.log('🆕 Creating new event with data:', apiPayload);
      const response = await eventApiService.createEvent(apiPayload);

      if (response.success) {
        console.log('✅ Event created successfully:', response.data);
        
        const childrenCount = response.data?.childrenCount;
        const successMessage = childrenCount 
          ? `Event created successfully for ${childrenCount} children!`
          : 'Your event has been added to the calendar.';
        
        showSuccess('Event Created!', successMessage);
        onEventCreated?.();
        onClose();
      } else {
        console.error('❌ Failed to create event:', response.error);
        const errorMessage = response.error || 'Unknown error';
        showError('Failed to Create Event', errorMessage);
      }
    } else {
      // Update existing event
      if (!event?.id) {
        showError('Error', 'Event ID is missing');
        setIsSubmitting(false);
        return;
      }
      
      console.log('✏️ Updating event with data:', apiPayload);
      const response = await eventApiService.updateEvent(event.id, apiPayload);

      if (response.success) {
        console.log('✅ Event updated successfully:', response.data);
        showSuccess('Event Updated!', 'Your event has been successfully updated.');
        onEventUpdated?.();
        onClose();
      } else {
        console.error('❌ Failed to update event:', response.error);
        const errorMessage = response.error || 'Unknown error';
        showError('Failed to Update Event', errorMessage);
      }
    }
    
    setIsSubmitting(false);
  }, [eventData, mode, event?.id, isSubmitting, showError, showSuccess, onEventCreated, onEventUpdated, onClose]);

  // Handle event deletion (only for edit mode)
  const handleDeleteEvent = useCallback(async () => {
    if (!event?.id) return;

    console.log('🗑️ Deleting event:', event.id);
    const response = await eventApiService.deleteEvent(event.id);

    if (response.success) {
      console.log('✅ Event deleted successfully');
      showSuccess('Event Deleted!', 'Your event has been permanently removed.');
      onEventDeleted?.();
      onClose();
    } else {
      console.error('❌ Failed to delete event:', response.error);
      const errorMessage = response.error || 'Unknown error';
      showError('Failed to Delete Event', errorMessage);
    }
  }, [event?.id, onEventDeleted, onClose, showError, showSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-purple-600 text-white p-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            {mode === 'create' ? 'Add New Event' : 'Edit Event'}
          </h3>
          <div className="flex space-x-2">
            {mode === 'edit' && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-white hover:bg-red-600 rounded-lg p-2 transition-colors"
                title="Delete Event"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-white hover:bg-purple-700 rounded-lg p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {validationErrors.length > 0 && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <h4 className="font-medium mb-2">Please fix the following errors:</h4>
              <ul className="list-disc list-inside text-sm">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Delete Confirmation Dialog */}
          {showDeleteConfirm && mode === 'edit' && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Delete Event</h4>
              <p className="text-red-700 mb-4">
                Are you sure you want to delete "{event?.title}"? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteEvent}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Event
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Event Title */}
            <div>
              <label className="block text-sm text-left font-semibold text-gray-700 mb-2">Event Title *</label>
              <div className="relative">
                <input
                  type="text"
                  value={eventData.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  onBlur={(e) => handleFieldBlur('title', e.target.value)}
                  className={getFieldClassName('title')}
                  placeholder="Event title"
                  maxLength={200}
                  required
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                <div className="text-xs text-gray-500">
                  {eventData.title.length}/200 characters
                </div>
                {fieldTouched.title && fieldErrors.title && (
                  <div className="text-xs text-red-500">
                    {fieldErrors.title}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm text-left font-semibold text-gray-700 mb-2">Description</label>
              <div className="relative">
                <textarea
                  value={eventData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  onBlur={(e) => handleFieldBlur('description', e.target.value)}
                  className={getFieldClassName('description')}
                  rows={3}
                  maxLength={1000}
                  placeholder="Event description (optional)"
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                <div className="text-xs text-gray-500">
                  {eventData.description.length}/1000 characters
                </div>
                {fieldTouched.description && fieldErrors.description && (
                  <div className="text-xs text-red-500">
                    {fieldErrors.description}
                  </div>
                )}
              </div>
            </div>

            {/* Event Type and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-left font-semibold text-gray-700 mb-2">Event Type *</label>
                <div className="relative">
                  <select
                    value={eventData.type}
                    onChange={(e) => handleFieldChange('type', e.target.value)}
                    onBlur={(e) => handleFieldBlur('type', e.target.value)}
                    className={getFieldClassName('type')}
                    required
                  >
                    {Object.entries(EVENT_TYPE_OPTIONS).map(([type, config]) => (
                      <option key={type} value={type}>{config.label}</option>
                    ))}
                  </select>
                </div>
                {fieldTouched.type && fieldErrors.type && (
                  <div className="text-xs text-red-500 mt-1">
                    {fieldErrors.type}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm text-left font-semibold text-gray-700 mb-2">Priority</label>
                <div className="relative">
                  <select
                    value={eventData.priority}
                    onChange={(e) => handleFieldChange('priority', e.target.value)}
                    onBlur={(e) => handleFieldBlur('priority', e.target.value)}
                    className={getFieldClassName('priority')}
                  >
                    {Object.entries(EVENT_PRIORITY_OPTIONS).map(([priority, config]) => (
                      <option key={priority} value={priority}>{config.label}</option>
                    ))}
                  </select>
                </div>
                {fieldTouched.priority && fieldErrors.priority && (
                  <div className="text-xs text-red-500 mt-1">
                    {fieldErrors.priority}
                  </div>
                )}
              </div>
            </div>

            {/* Assign To */}
            <div>
              <label className="block text-sm text-left font-semibold text-gray-700 mb-2">Assign To *</label>
              <div className="relative">
                <select
                  value={eventData.childId?.toString() || 'all'}
                  onChange={(e) => {
                    const value = e.target.value;
                    const childId = value === 'all' ? null : parseInt(value);
                    handleFieldChange('childId', childId);
                  }}
                  onBlur={(e) => {
                    const value = e.target.value;
                    const childId = value === 'all' ? null : parseInt(value);
                    handleFieldBlur('childId', childId);
                  }}
                  className={getFieldClassName('childId')}
                  required
                >
                  <option value="all">All Children</option>
                  {children.filter(child => child.id !== null).map(child => (
                    <option key={child.id} value={child.id!.toString()}>{child.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-between items-center mt-1">
                <div className="text-xs text-gray-500">
                  {eventData.childId === null 
                    ? `Event will be created for all ${children.filter(child => child.id !== null).length} children`
                    : `Event will be created for ${children.find(child => child.id === eventData.childId)?.name || 'selected child'} only`
                  }
                </div>
                {fieldTouched.childId && fieldErrors.childId && (
                  <div className="text-xs text-red-500">
                    {fieldErrors.childId}
                  </div>
                )}
              </div>
            </div>

            {/* Start and End Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-left font-semibold text-gray-700 mb-2">Start Date *</label>
                <div className="relative">
                  <input
                    type="date"
                    value={eventData.startDate}
                    onChange={(e) => {
                      handleFieldChange('startDate', e.target.value);
                      // Auto-set end date if not already set
                      if (!eventData.endDate) {
                        handleFieldChange('endDate', e.target.value);
                      }
                    }}
                    onBlur={(e) => handleFieldBlur('startDate', e.target.value)}
                    className={getFieldClassName('startDate')}
                    required
                  />
                </div>
                {fieldTouched.startDate && fieldErrors.startDate && (
                  <div className="text-xs text-red-500 mt-1">
                    {fieldErrors.startDate}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm text-left font-semibold text-gray-700 mb-2">End Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={eventData.endDate}
                    onChange={(e) => handleFieldChange('endDate', e.target.value)}
                    onBlur={(e) => handleFieldBlur('endDate', e.target.value)}
                    className={getFieldClassName('endDate')}
                    min={eventData.startDate}
                  />
                </div>
                {fieldTouched.endDate && fieldErrors.endDate && (
                  <div className="text-xs text-red-500 mt-1">
                    {fieldErrors.endDate}
                  </div>
                )}
              </div>
            </div>

            {/* Time Fields - Only show when not all day */}
            {!eventData.isAllDay && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-left font-semibold text-gray-700 mb-2">Start Time</label>
                  <div className="relative">
                    <input
                      type="time"
                      value={eventData.startTime}
                      onChange={(e) => handleFieldChange('startTime', e.target.value)}
                      onBlur={(e) => handleFieldBlur('startTime', e.target.value)}
                      className={getFieldClassName('startTime')}
                      step="60"
                      required
                    />
                  </div>
                  {/* {fieldTouched.startTime && fieldErrors.startTime && (
                    <div className="text-xs text-red-500 mt-1">
                      {fieldErrors.startTime}
                    </div>
                  )} */}
                </div>
                <div>
                  <label className="block text-sm text-left font-semibold text-gray-700 mb-2">End Time</label>
                  <div className="relative">
                    <input
                      type="time"
                      value={eventData.endTime}
                      onChange={(e) => handleFieldChange('endTime', e.target.value)}
                      onBlur={(e) => handleFieldBlur('endTime', e.target.value)}
                      className={getFieldClassName('endTime')}
                      step="60"
                      required
                    />
                  </div>
                  {/* {fieldTouched.endTime && fieldErrors.endTime && (
                    <div className="text-xs text-red-500 mt-1">
                      {fieldErrors.endTime}
                    </div>
                  )} */}
                </div>
              </div>
            )}

            {/* All Day Checkbox */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={eventData.isAllDay}
                  onChange={(e) => handleFieldChange('isAllDay', e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-left font-semibold text-gray-700">All Day Event</span>
              </label>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <span>{isSubmitting ? (mode === 'create' ? 'Creating...' : 'Updating...') : (mode === 'create' ? 'Add Event' : 'Update Event')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
