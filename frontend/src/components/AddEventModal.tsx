import React, { useCallback } from 'react';
import { X } from 'lucide-react';
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

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: LocalChild[];
  onEventCreated: () => void;
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

const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  children,
  onEventCreated
}) => {
  const { showError, showSuccess } = useToast();
  const [newEvent, setNewEvent] = React.useState<EventFormData>({
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
  
  const [validationErrors, setValidationErrors] = React.useState<ValidationError[]>([]);

  // Handle form submission for creating events
  const handleCreateEventSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous validation errors
    setValidationErrors([]);
    
    // Validate event data
    const validation = validateEventForCreation({
      ...newEvent,
      endDate: newEvent.endDate || newEvent.startDate,
      childId: newEvent.childId!
    });
    
    if (!validation.isValid) {
      console.warn('⚠️ Create event validation failed:', validation.errors);
      setValidationErrors(validation.errors);
      
      // Show toast notification for validation errors
      const errorMessages = validation.errors.map(err => err.message).join(', ');
      showError('Validation Error', errorMessages);
      return;
    }

    console.log('🆕 Creating new event with data:', newEvent);
    const response = await eventApiService.createEvent({
      ...newEvent,
      endDate: newEvent.endDate || newEvent.startDate, // Use start date as end date if not specified
      childId: newEvent.childId! // We already validated that childId is not null above
    });

    if (response.success) {
      console.log('✅ Event created successfully:', response.data);
      
      // Reset form
      setNewEvent({
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
      
      // Notify parent component
      showSuccess('Event Created!', 'Your event has been added to the calendar.');
      onEventCreated();
      onClose();
    } else {
      console.error('❌ Failed to create event:', response.error);
      const errorMessage = response.error || 'Unknown error';
      showError('Failed to Create Event', errorMessage);
    }
  }, [newEvent, onEventCreated, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-purple-600 text-white p-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Add New Event</h3>
          <button
            onClick={onClose}
            className="text-white hover:bg-purple-700 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
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
          
          <form onSubmit={handleCreateEventSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Event title"
                maxLength={200}
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                {newEvent.title.length}/200 characters
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={3}
                maxLength={1000}
                placeholder="Event description (optional)"
              />
              <div className="text-xs text-gray-500 mt-1">
                {newEvent.description.length}/1000 characters
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Type *</label>
                <select
                  value={newEvent.type}
                  onChange={(e) => {
                    const newType = e.target.value as EventType;
                    setNewEvent({
                      ...newEvent, 
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
                  value={newEvent.priority}
                  onChange={(e) => setNewEvent({...newEvent, priority: e.target.value as EventPriority})}
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
                value={newEvent.childId || ''}
                onChange={(e) => setNewEvent({...newEvent, childId: parseInt(e.target.value) || null})}
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
                  value={newEvent.startDate}
                  onChange={(e) => setNewEvent({...newEvent, startDate: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={newEvent.endDate}
                  onChange={(e) => setNewEvent({...newEvent, endDate: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min={newEvent.startDate}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newEvent.isAllDay}
                  onChange={(e) => setNewEvent({...newEvent, isAllDay: e.target.checked})}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">All Day Event</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newEvent.hasReminder}
                  onChange={(e) => setNewEvent({...newEvent, hasReminder: e.target.checked})}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Set Reminder</span>
              </label>

              {newEvent.hasReminder && (
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={newEvent.reminderMinutes}
                    onChange={(e) => setNewEvent({...newEvent, reminderMinutes: parseInt(e.target.value) || 10})}
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
                <span>Add Event</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEventModal;
