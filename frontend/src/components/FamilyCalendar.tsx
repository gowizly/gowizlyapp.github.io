/// <reference types="react" />
/// <reference types="react-dom" />
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { childApiService } from '../services/childApi';
import { Event, EventType, EventPriority, eventApiService } from '../services/eventApi';
import { calendarApiService, MonthlyCalendarResponse } from '../services/calendarApi';
import { validateChildForCreation, ValidationError as ChildValidationError, VALID_GRADE_LEVELS } from '../utils/childValidation';
import Header from './Header';
import Navigation from './Navigation';
import CalendarView from './CalendarView';
import ChildManagement from './ChildManagement';
import AddEventModal from './AddEventModal';
import EditEventModal from './EditEventModal';
import AIAssistant from './AIAssistant';
import { useToast } from '../contexts/ToastContext';
import { handleAuthFailure } from '../utils/authUtils';

// Update the local Child interface to match the API
interface LocalChild {
  id: number | null;
  name: string;
  gradeLevel: string;
  schoolName: string;
  birthDate?: string;
}

const FamilyCalendarApp = () => {
  const { isAuthenticated } = useAuth();
  const { showError } = useToast();
  const [currentView, setCurrentView] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedChild, setSelectedChild] = useState<LocalChild | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [children, setChildren] = useState<LocalChild[]>([]);
  const [showAddChild, setShowAddChild] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [newChild, setNewChild] = useState({ name: '', gradeLevel: '', schoolName: '', birthDate: '' });
  const [childValidationErrors, setChildValidationErrors] = useState<ChildValidationError[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventsByDate, setEventsByDate] = useState<{ [date: string]: Event[] }>({});
  const isLoadingRef = useRef(false);
  // Handle child creation completion - refresh children data
  const handleChildCreated = useCallback(async () => {
    console.log('👶 Refreshing children list after child creation...');
    await loadChildren();
  }, []);

  // Handle event click for editing
  const handleEventClick = useCallback((event: Event) => {
    console.log('✏️ Opening event for editing:', event.id);
    setSelectedEvent(event);
    setShowEditEvent(true);
  }, []);

  // Load children and events data from API
  useEffect(() => {
    if (isAuthenticated) {
      loadChildren();
      loadEventsForDateRange();
    }
  }, [isAuthenticated]);

  // Load events when selected child or month changes
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔄 useEffect triggered - Child or month changed:', {
        child: selectedChild?.name || 'All Children',
        date: selectedDate.toLocaleDateString(),
        authenticated: isAuthenticated
      });
      loadEventsForDateRange();
    }
  }, [selectedChild, selectedDate, isAuthenticated]);

  // Cleanup loading state on unmount
  useEffect(() => {
    return () => {
      isLoadingRef.current = false;
      setIsLoadingEvents(false);
    };
  }, []);

  // Optimized function to load events for current date range and child selection
  const loadEventsForDateRange = useCallback(async () => {
    console.log('📅 Loading monthly events...');
    
    if (isLoadingRef.current) {
      console.log('⏳ Event loading already in progress, skipping...');
      return;
    }
    
    isLoadingRef.current = true;
    setIsLoadingEvents(true);
    
    // Safety timeout to prevent stuck loading state
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Event loading timeout, resetting loading state');
      isLoadingRef.current = false;
      setIsLoadingEvents(false);
    }, 10000); // 10 second timeout
    
    try {
      const currentChild = selectedChild;
      const currentDate = selectedDate;
      
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // API expects 1-12
      const childId = currentChild?.id || undefined;
      
      console.log(`📅 Loading events for ${year}-${month}${childId ? ` (child: ${currentChild?.name})` : ' (all children)'}`);
      console.log(`🔄 API Call: GET /api/calendar/monthly?year=${year}&month=${month}${childId ? `&childId=${childId}` : ''}`);
      
      const response = await calendarApiService.getMonthlyEvents(year, month, childId);
      
      if (response.success && response.data) {
        console.log('✅ Monthly events loaded successfully');
        console.log(`📊 Setting ${response.data.totalEvents} events for ${year}-${month}`);
        console.log(`📅 Events by date:`, Object.keys(response.data.eventsByDate).length, 'dates with events');
        
        setEvents(response.data.events);
        setEventsByDate(response.data.eventsByDate);
      } else {
        console.error('❌ Failed to load monthly events:', response.error);
        const errorMessage = response.error || 'Unknown server error';
        
        // Handle authentication failures
        handleAuthFailure(errorMessage);
        
        showError('Failed to Load Events', `Unable to load calendar events: ${errorMessage}`);
        setEvents([]);
        setEventsByDate({});
      }
    } catch (error) {
      console.error('Error loading monthly events:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      const childContext = selectedChild ? ` for ${selectedChild.name}` : '';
      showError('Failed to Load Events', `Unable to connect to the server${childContext}: ${errorMessage}`);
      setEvents([]);
      setEventsByDate({});
    } finally {
      clearTimeout(timeoutId);
      isLoadingRef.current = false;
      setIsLoadingEvents(false);
    }
  }, [selectedChild, selectedDate, showError]);

  // Handle event creation completion
  const handleEventCreated = useCallback(async () => {
    // Reload events from API (respecting current child selection and date range)
    await loadEventsForDateRange();
  }, [loadEventsForDateRange]);

  // Handle event update completion
  const handleEventUpdated = useCallback(async () => {
    // Reload events from API
    await loadEventsForDateRange();
  }, [loadEventsForDateRange]);

  // Handle event deletion completion
  const handleEventDeleted = useCallback(async () => {
    // Reload events from API
    await loadEventsForDateRange();
  }, [loadEventsForDateRange]);

  const loadChildren = async () => {
    try {
      console.log('👶 Loading children from API...');
      const response = await childApiService.getChildren();
      if (response.success && response.data) {
        console.log('✅ Children loaded successfully:', response.data);
        // Map Child[] to LocalChild[]
        const localChildren: LocalChild[] = response.data.map(child => ({
          id: child.id || null,
          name: child.name,
          gradeLevel: child.gradeLevel,
          schoolName: child.schoolName,
          birthDate: child.birthDate
        }));
        setChildren(localChildren);
      } else {
        console.error('❌ Failed to load children:', response.error);
        const errorMessage = response.error || 'Unknown server error';
        
        // Handle authentication failures
        handleAuthFailure(errorMessage);
        
        // Only show error if it's not a "no children found" case
        if (!response.error?.includes('No children found')) {
          showError('Failed to Load Children', `Unable to load children data: ${errorMessage}`);
        }
        setChildren([]);
      }
    } catch (error) {
      console.error('Error loading children:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      showError('Failed to Load Children', `Unable to connect to the server: ${errorMessage}`);
      setChildren([]);
    }
  };

  // Legacy function for backward compatibility
  const loadEvents = async () => {
    await loadEventsForDateRange();
  };


  const AddChildModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
          {/* Validation Errors Display */}
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
                placeholder="Child's name"
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
                placeholder="School name"
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
            </div>
          </div>
          
          <div className="flex space-x-4 mt-6">
            <button
              onClick={() => setShowAddChild(false)}
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
                  const response = await childApiService.createChild(newChild);
                  
                  if (response.success) {
                    console.log('✅ Child created successfully:', response.data);
                    setShowAddChild(false);
                    setNewChild({ name: '', gradeLevel: '', schoolName: '', birthDate: '' });
                    // Reload children from API to ensure fresh data
                    await handleChildCreated();
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
          eventsByDate={eventsByDate}
          isLoadingEvents={isLoadingEvents}
          onAddEvent={() => {
            if (children.length === 0) {
              console.log('No children available');
              showError('No children available - Add Child first');
            } else {
              setShowAddEvent(true);
            }
          }}
          onEventClick={handleEventClick}
        />
      )}
      {currentView === 'children' && (
        <ChildManagement 
          onBack={() => setCurrentView('calendar')}
          onChildCreated={handleChildCreated}
        />
      )}
      
      {showAddChild && <AddChildModal />}
      {showAddEvent && (
        <AddEventModal
          isOpen={showAddEvent}
          onClose={() => setShowAddEvent(false)}
          children={children}
          onEventCreated={handleEventCreated}
        />
      )}
      {showEditEvent && selectedEvent && (
        <EditEventModal
          isOpen={showEditEvent}
          onClose={() => {
            setShowEditEvent(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
          children={children}
          onEventUpdated={handleEventUpdated}
          onEventDeleted={handleEventDeleted}
        />
      )}
      <AIAssistant 
        isOpen={showAIAssistant} 
        onClose={() => setShowAIAssistant(false)}
        children={children}
        onEventsCreated={handleEventCreated}
      />
      
    </div>
  );
};

export default FamilyCalendarApp;