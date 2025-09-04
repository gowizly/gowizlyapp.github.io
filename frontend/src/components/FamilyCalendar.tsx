/// <reference types="react" />
/// <reference types="react-dom" />
import React, { useState, useEffect } from 'react';
import { Plus, Camera, Mail, Bot, Settings, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { childApiService } from '../services/childApi';
import { Event, EventType, EventPriority, eventApiService } from '../services/eventApi';
import { validateEventForCreation, ValidationError } from '../utils/eventValidation';
import { validateChildForCreation, ValidationError as ChildValidationError, VALID_GRADE_LEVELS } from '../utils/childValidation';
import Header from './Header';
import Navigation from './Navigation';
import CalendarView from './CalendarView';
import ChildManagement from './ChildManagement';


// Update the local Child interface to match the API
interface LocalChild {
      id: number | null;
      name: string;
      gradeLevel: string;
      schoolName: string;
      birthDate?: string;
    }

// Update the local Child interface to match the API

const FamilyCalendarApp = () => {
  const { isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState('calendar');
  //const [calendarView, setCalendarView] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  //const [selectedChild, setSelectedChild] = useState(null);
  // Updated state to allow for a full Child object or null
  const [selectedChild, setSelectedChild] = useState<LocalChild | null>(null);
  //const [events, setEvents] = useState([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [children, setChildren] = useState<LocalChild[]>([]);
  const [showAddChild, setShowAddChild] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiMode, setAiMode] = useState('email');
  const [emailText, setEmailText] = useState('');
  const [newChild, setNewChild] = useState({ name: '', gradeLevel: '', schoolName: '', birthDate: '' });
  // Event type to color mapping
  const eventTypeColors = {
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

  // Updated newEvent state to match API requirements
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    isAllDay: false,
    type: 'OTHER' as EventType,
    priority: 'MEDIUM' as EventPriority,
    color: eventTypeColors.OTHER,
    childId: null as number | null,
    hasReminder: false,
    reminderMinutes: 10
  });
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [childValidationErrors, setChildValidationErrors] = useState<ChildValidationError[]>([]);


  // Load children and events data from API
  useEffect(() => {
    if (isAuthenticated) {
      loadChildren();
      loadEvents();
    }
  }, [isAuthenticated]);

  const loadChildren = async () => {
    try {
      const response = await childApiService.getChildren();
      if (response.success && response.data) {
        // Convert API Child to LocalChild format
        const localChildren: LocalChild[] = response.data.map(child => ({
          id: child.id || null,
          name: child.name,
          gradeLevel: child.gradeLevel,
          schoolName: child.schoolName,
          birthDate: child.birthDate
        }));
        setChildren(localChildren);
      } else {
        // Fallback to sample data if API fails
        setChildren([
          { id: 1, name: 'Emma', gradeLevel: '5th Grade', schoolName: 'Lincoln Elementary', birthDate: '2014-08-15' },
          { id: 2, name: 'Jake', gradeLevel: '8th Grade', schoolName: 'Roosevelt Middle School', birthDate: '2011-03-22' }
        ]);
      }
    } catch (error) {
      console.error('Error loading children:', error);
      // Fallback to sample data
      setChildren([
        { id: 1, name: 'Emma', gradeLevel: '5th Grade', schoolName: 'Lincoln Elementary', birthDate: '2014-08-15' },
        { id: 2, name: 'Jake', gradeLevel: '8th Grade', schoolName: 'Roosevelt Middle School', birthDate: '2011-03-22' }
      ]);
    }
  };

  const loadEvents = async () => {
    try {
      console.log('📅 Loading events from API...');
      const response = await eventApiService.getEvents();
      if (response.success && response.data) {
        console.log('✅ Events loaded successfully:', response.data.events);
        setEvents(response.data.events);
      } else {
        console.error('❌ Failed to load events:', response.error);
        // Fallback to empty array
        setEvents([]);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
    }
  };








  const AIAssistant = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="bg-purple-600 text-white p-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">AI Calendar Assistant</h3>
          <button
            onClick={() => setShowAIAssistant(false)}
            className="text-white hover:bg-purple-700 rounded-lg p-2 transition-colors"
          >
            ×
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setAiMode('email')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                aiMode === 'email' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Mail className="w-5 h-5" />
              <span>Parse Email</span>
            </button>
            <button
              onClick={() => setAiMode('photo')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                aiMode === 'photo' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Camera className="w-5 h-5" />
              <span>Upload Photo</span>
            </button>
          </div>

          {aiMode === 'email' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste email content or forward emails here:
                </label>
                <textarea
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                  className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="Paste your email content here. The AI will extract dates, events, assignments, and other calendar items..."
                />
              </div>
              <button
                onClick={() => {
                  // Simulate AI processing
                  alert('AI is processing your email and will add relevant events to the calendar!');
                  setEmailText('');
                }}
                disabled={!emailText.trim()}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                <Bot className="w-5 h-5 mr-2" />
                Process Email
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Upload photos of school flyers, assignment sheets, or calendars
                </p>
                <button className="bg-purple-100 text-purple-700 px-6 py-2 rounded-lg hover:bg-purple-200 transition-colors flex items-center mx-auto">
                  <Upload className="w-5 h-5 mr-2" />
                  Choose File
                </button>
              </div>
              <p className="text-sm text-gray-500 text-center">
                The AI will analyze the image and extract events, dates, and assignments automatically.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const AddChildModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        <div className="bg-purple-600 text-white p-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Add Child</h3>
          <button
            onClick={() => setShowAddChild(false)}
            className="text-white hover:bg-purple-700 rounded-lg p-2 transition-colors"
          >
            ×
          </button>
        </div>
        
        <div className="p-6">
          {/* Child Validation Errors Display */}
          {childValidationErrors.length > 0 && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <h4 className="font-medium mb-2">Please fix the following errors:</h4>
              <ul className="list-disc list-inside text-sm">
                {childValidationErrors.map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                value={newChild.name}
                onChange={(e) => setNewChild({...newChild, name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Enter child's name"
                maxLength={50}
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                {newChild.name.length}/50 characters
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level *</label>
              <select
                value={newChild.gradeLevel}
                onChange={(e) => setNewChild({...newChild, gradeLevel: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Select grade level</option>
                {VALID_GRADE_LEVELS.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">School Name *</label>
              <input
                type="text"
                value={newChild.schoolName}
                onChange={(e) => setNewChild({...newChild, schoolName: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Enter school name"
                maxLength={100}
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                {newChild.schoolName.length}/100 characters
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Birth Date *</label>
              <input
                type="date"
                value={newChild.birthDate}
                onChange={(e) => setNewChild({...newChild, birthDate: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              />
              {newChild.birthDate && (
                <div className="text-xs text-gray-500 mt-1">
                  {(() => {
                    const birthDate = new Date(newChild.birthDate);
                    const today = new Date();
                    const age = today.getFullYear() - birthDate.getFullYear();
                    const monthDiff = today.getMonth() - birthDate.getMonth();
                    const dayDiff = today.getDate() - birthDate.getDate();
                    const actualAge = (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) ? age - 1 : age;
                    return `Age: ${actualAge} years (valid range: 3-19 years)`;
                  })()}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => {
                setShowAddChild(false);
                setNewChild({ name: '', gradeLevel: '', schoolName: '', birthDate: '' });
                setChildValidationErrors([]);
              }}
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                // Clear previous validation errors
                setChildValidationErrors([]);
                
                // Validate child data
                const validation = validateChildForCreation(newChild);
                
                if (!validation.isValid) {
                  console.warn('⚠️ Create child validation failed:', validation.errors);
                  setChildValidationErrors(validation.errors);
                  return;
                }
                
                try {
                  console.log('🆕 Creating new child with data:', newChild);
                  const response = await childApiService.createChild({
                    name: newChild.name,
                    gradeLevel: newChild.gradeLevel,
                    schoolName: newChild.schoolName,
                    birthDate: newChild.birthDate
                  });
                  
                  if (response.success) {
                    console.log('✅ Child created successfully:', response.data);
                    await loadChildren(); // Reload children from API
                    setNewChild({ name: '', gradeLevel: '', schoolName: '', birthDate: '' });
                    setChildValidationErrors([]);
                    setShowAddChild(false);
                  } else {
                    console.error('❌ Failed to create child:', response.error);
                    alert('Failed to add child: ' + (response.error || 'Unknown error'));
                  }
                } catch (error) {
                  console.error('❌ Error creating child:', error);
                  alert('Error adding child: ' + (error instanceof Error ? error.message : 'Unknown error'));
                }
              }}
              disabled={!newChild.name || !newChild.gradeLevel || !newChild.schoolName || !newChild.birthDate}
              className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Child
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const AddEventModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="bg-purple-600 text-white p-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Add Event</h3>
          <button
            onClick={() => {
              setShowAddEvent(false);
              setNewEvent({
                title: '',
                description: '',
                startDate: '',
                endDate: '',
                isAllDay: false,
                type: 'OTHER' as EventType,
                priority: 'MEDIUM' as EventPriority,
                color: '#6366f1',
                childId: null,
                hasReminder: false,
                reminderMinutes: 10
              });
            }}
            className="text-white hover:bg-purple-700 rounded-lg p-2 transition-colors"
          >
            ×
          </button>
        </div>
        
        <div className="p-6">
          {/* Validation Errors Display */}
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
          
          <form onSubmit={async (e) => {
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
              setShowAddEvent(false);
              setNewEvent({
                title: '',
                description: '',
                startDate: '',
                endDate: '',
                isAllDay: false,
                type: 'OTHER' as EventType,
                priority: 'MEDIUM' as EventPriority,
                color: '#6366f1',
                childId: null,
                hasReminder: false,
                reminderMinutes: 10
              });
              loadEvents(); // Reload events from API
            } else {
              console.error('❌ Failed to create event:', response.error);
              alert('Failed to create event: ' + (response.error || 'Unknown error'));
            }
          }} className="space-y-4">
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
                      color: eventTypeColors[newType]
                    });
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  {Object.entries({
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
                  }).map(([type, config]) => (
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
                  {Object.entries({
                    LOW: { label: 'Low', color: 'text-gray-500' },
                    MEDIUM: { label: 'Medium', color: 'text-yellow-500' },
                    HIGH: { label: 'High', color: 'text-red-500' },
                    URGENT: { label: 'Urgent', color: 'text-red-700' }
                  }).map(([priority, config]) => (
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
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">All Day Event</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newEvent.hasReminder}
                  onChange={(e) => setNewEvent({...newEvent, hasReminder: e.target.checked})}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Set Reminder</span>
              </label>
            </div>

            {newEvent.hasReminder && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reminder (minutes before)</label>
                <input
                  type="number"
                  value={newEvent.reminderMinutes}
                  onChange={(e) => setNewEvent({...newEvent, reminderMinutes: parseInt(e.target.value) || 10})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="1"
                  placeholder="10"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <input
                type="color"
                value={newEvent.color}
                onChange={(e) => setNewEvent({...newEvent, color: e.target.value})}
                className="w-20 h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowAddEvent(false);
                  setNewEvent({
                    title: '',
                    description: '',
                    startDate: '',
                    endDate: '',
                    isAllDay: false,
                    type: 'OTHER' as EventType,
                    priority: 'MEDIUM' as EventPriority,
                    color: '#6366f1',
                    childId: null,
                    hasReminder: false,
                    reminderMinutes: 10
                  });
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newEvent.title || !newEvent.startDate || !newEvent.childId}
                className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Event</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation
        currentView={currentView}
        onViewChange={setCurrentView}
        onAIAssistantOpen={() => setShowAIAssistant(true)}
      />
      
      {currentView === 'calendar' && (
        <CalendarView
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          selectedChild={selectedChild}
          onChildChange={setSelectedChild}
          children={children}
          events={events}
          onAddEvent={() => setShowAddEvent(true)}
        />
      )}
      {currentView === 'children' && (
        <ChildManagement 
          onBack={() => setCurrentView('calendar')}
        />
      )}
      
      {showAddChild && <AddChildModal />}
      {showAddEvent && <AddEventModal />}
      {showAIAssistant && <AIAssistant />}
      
      {/* Integration Status Indicator */}
      <div className="fixed bottom-4 right-4">
        <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200 max-w-sm">
          <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-purple-600" />
            Google Classroom Integration
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">API Connected</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Auto-sync enabled</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Last sync: 2 hours ago
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyCalendarApp;
