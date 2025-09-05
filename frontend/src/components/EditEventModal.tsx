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
  const formatDateForInput = useCallback((isoDate: string) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    return date.toISOString().split('T')[0];
  }, []);

  // Initialize form data when event changes
  useEffect(() => {
    if (event && isOpen) {
      setEventData({
        title: event.title || '',
        description: event.description || '',
        startDate: formatDateForInput(event.startDate),
        endDate: formatDateForInput(event.endDate),
        isAllDay: event.isAllDay || false,
        type: event.type,
        priority: event.priority,
        color: event.color || EVENT_TYPE_COLORS[event.type],
        childId: event.childId,
        hasReminder: event.hasReminder || false,
        reminderMinutes: event.reminderMinutes || 10
      });
      setValidationErrors([]);
      setShowDeleteConfirm(false);
    }
  }, [event, isOpen, formatDateForInput]);

  // Handle form submission for updating events
  const handleUpdateEventSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous validation errors
    setValidationErrors([]);
    
    // Validate event data
    const validation = validateEventForCreation({
      ...eventData,
      endDate: eventData.endDate || eventData.startDate,
      childId: eventData.childId!
    });
    
    if (!validation.isValid) {
      console.warn('⚠️ Update event validation failed:', validation.errors);
      setValidationErrors(validation.errors);
      
      // Show toast notification for validation errors
      const errorMessages = validation.errors.map(err => err.message).join(', ');
      showError('Validation Error', errorMessages);
      return;
    }

    console.log('✏️ Updating event with data:', eventData);
    const response = await eventApiService.updateEvent(event.id!, {
      ...eventData,
      endDate: eventData.endDate || eventData.startDate,
      childId: eventData.childId!
    });

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
  }, [eventData, event.id, onEventUpdated, onClose]);

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
  }, [event.id, onEventDeleted, onClose]);

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
              <label className="block text-sm font-medium text-gray-700 mb-2">Child *</label>
              <select
                value={eventData.childId || ''}
                onChange={(e) => setEventData({...eventData, childId: parseInt(e.target.value) || null})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">Select a child</option>
                {children.map(child => (
                  <option key={child.id} value={child.id?.toString() || ''}>{child.name}</option>
                ))}
              </select>
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

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={eventData.hasReminder}
                  onChange={(e) => setEventData({...eventData, hasReminder: e.target.checked})}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Set Reminder</span>
              </label>

              {eventData.hasReminder && (
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={eventData.reminderMinutes}
                    onChange={(e) => setEventData({...eventData, reminderMinutes: parseInt(e.target.value) || 10})}
                    className="w-20 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="1"
                    max="1440"
                  />
                  <span className="text-sm text-gray-700">minutes before</span>
                </div>
              )}
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
