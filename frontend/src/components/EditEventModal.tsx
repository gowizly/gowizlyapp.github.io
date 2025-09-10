import React, { useCallback, useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Event, EventType, EventPriority, eventApiService } from '../services/eventApi';
import { validateEventForCreation, ValidationError } from '../utils/eventValidation';
import { useToast } from '../contexts/ToastContext';

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

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  children: LocalChild[];
  onEventUpdated: () => void;
  onEventDeleted: () => void;
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

const EditEventModal: React.FC<EditEventModalProps> = ({
  isOpen,
  onClose,
  event,
  children,
  onEventUpdated,
  onEventDeleted
}) => {
  const { showError, showSuccess } = useToast();
  const [eventData, setEventData] = useState<EventFormData>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    isAllDay: false,
    type: 'OTHER' as EventType,
    priority: 'MEDIUM' as EventPriority,
    color: EVENT_TYPE_COLORS.OTHER,
    childId: null as number | null,
    hasReminder: false,
    reminderMinutes: 10
  });
  
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  // Initialize form data when event changes
  useEffect(() => {
    if (event && isOpen) {
      // Use startDateOnly/endDateOnly if available, otherwise extract from full datetime
      const startDateForInput = event.startDateOnly || formatDateForInput(event.startDate);
      const endDateForInput = event.endDateOnly || formatDateForInput(event.endDate ?? null);
      
      // Determine childId - if event has children array and childId is null, it's for all children
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
      setValidationErrors([]);
      setShowDeleteConfirm(false);
    }
  }, [event, isOpen, formatDateForInput, extractTimeFromDateTime]);

  // Handle form submission for updating events
  const handleUpdateEventSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous validation errors
    setValidationErrors([]);
    
    // Validate event data
    const validation = validateEventForCreation({
      ...eventData,
      startTime: eventData.startTime || '',
      endTime: eventData.endTime || '',
      endDate: eventData.endDate || eventData.startDate,
      childId: eventData.childId
    });
    
    if (!validation.isValid) {
      console.warn('⚠️ Update event validation failed:', validation.errors);
      setValidationErrors(validation.errors);
      
      // Show toast notification for validation errors
      const errorMessages = validation.errors.map(err => err.message).join(', ');
      showError('Validation Error', errorMessages);
      return;
    }

    // Prepare the update payload
    const updatePayload = {
      title: eventData.title,
      description: eventData.description,
      startDate: eventData.startDate,
      endDate: eventData.endDate || eventData.startDate,
      startTime: eventData.isAllDay ? '' : eventData.startTime,
      endTime: eventData.isAllDay ? '' : eventData.endTime,
      isAllDay: eventData.isAllDay,
      type: eventData.type,
      priority: eventData.priority,
      color: eventData.color,
      childId: eventData.childId, // null for all children, specific ID for individual child
      hasReminder: eventData.hasReminder,
      reminderMinutes: eventData.hasReminder ? eventData.reminderMinutes : undefined
    };

    console.log('✏️ Updating event with data:', updatePayload);
    const response = await eventApiService.updateEvent(event.id!, updatePayload);

    if (response.success) {
      console.log('✅ Event updated successfully:', response.data);
      showSuccess('Event Updated!', 'Your event has been successfully updated.');
      onEventUpdated();
      onClose();
    } else {
      console.error('❌ Failed to update event:', response.error);
      const errorMessage = response.error || 'Unknown error';
      showError('Failed to Update Event', errorMessage);
    }
  }, [eventData, event.id, onEventUpdated, onClose, showError, showSuccess]);

  // Handle event deletion
  const handleDeleteEvent = useCallback(async () => {
    if (!event.id) return;

    console.log('🗑️ Deleting event:', event.id);
    const response = await eventApiService.deleteEvent(event.id);

    if (response.success) {
      console.log('✅ Event deleted successfully');
      showSuccess('Event Deleted!', 'Your event has been permanently removed.');
      onEventDeleted();
      onClose();
    } else {
      console.error('❌ Failed to delete event:', response.error);
      const errorMessage = response.error || 'Unknown error';
      showError('Failed to Delete Event', errorMessage);
    }
  }, [event.id, onEventDeleted, onClose, showError, showSuccess]);

  if (!isOpen || !event) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-purple-600 text-white p-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Edit Event</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-white hover:bg-red-600 rounded-lg p-2 transition-colors"
              title="Delete Event"
            >
              <Trash2 className="w-5 h-5" />
            </button>
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
          {showDeleteConfirm && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Delete Event</h4>
              <p className="text-red-700 mb-4">
                Are you sure you want to delete "{event.title}"? This action cannot be undone.
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
          
          <form onSubmit={handleUpdateEventSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                value={eventData.title}
                onChange={(e) => setEventData({...eventData, title: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Event title"
                maxLength={200}
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                {eventData.title.length}/200 characters
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={eventData.description}
                onChange={(e) => setEventData({...eventData, description: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={3}
                maxLength={1000}
                placeholder="Event description (optional)"
              />
              <div className="text-xs text-gray-500 mt-1">
                {eventData.description.length}/1000 characters
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Type *</label>
                <select
                  value={eventData.type}
                  onChange={(e) => {
                    const newType = e.target.value as EventType;
                    setEventData({
                      ...eventData, 
                      type: newType,
                      color: EVENT_TYPE_COLORS[newType]
                    });
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  {Object.entries(EVENT_TYPE_OPTIONS).map(([type, config]) => (
                    <option key={type} value={type}>{config.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={eventData.priority}
                  onChange={(e) => setEventData({...eventData, priority: e.target.value as EventPriority})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {Object.entries(EVENT_PRIORITY_OPTIONS).map(([priority, config]) => (
                    <option key={priority} value={priority}>{config.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assign To *</label>
              <select
                value={eventData.childId?.toString() || 'all'}
                onChange={(e) => {
                  const value = e.target.value;
                  setEventData({
                    ...eventData, 
                    childId: value === 'all' ? null : parseInt(value)
                  });
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="all">All Children</option>
                {children.filter(child => child.id !== null).map(child => (
                  <option key={child.id} value={child.id!.toString()}>{child.name}</option>
                ))}
              </select>
              <div className="text-xs text-gray-500 mt-1">
                {event.children && event.children.length > 0 
                  ? `Currently assigned to: ${event.children.map(c => c.name).join(', ')}`
                  : `Currently assigned to: ${children.find(child => child.id === event.childId)?.name || 'Unknown'}`
                }
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                <input
                  type="date"
                  value={eventData.startDate}
                  onChange={(e) => setEventData({...eventData, startDate: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={eventData.endDate}
                  onChange={(e) => setEventData({...eventData, endDate: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min={eventData.startDate}
                />
              </div>
            </div>

            {/* Time Fields - Only show when not all day */}
            {!eventData.isAllDay && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={eventData.startTime}
                    onChange={(e) => setEventData({...eventData, startTime: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                  <input
                    type="time"
                    value={eventData.endTime}
                    onChange={(e) => setEventData({...eventData, endTime: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            )}

            {/* All Day Checkbox */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={eventData.isAllDay}
                  onChange={(e) => setEventData({...eventData, isAllDay: e.target.checked})}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">All Day Event</span>
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
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <span>Update Event</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditEventModal;