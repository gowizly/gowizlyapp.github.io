// src/components/calendar/FamilyCalendar.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { childApiService } from '../../services/childApi';
import { Event } from '../../services/eventApi';
import { calendarApiService } from '../../services/calendarApi';
import Header from '../common/Header';
import Navigation from '../common/Navigation';
import CalendarView from './CalendarView';
import ChildManagement from '../child/ChildManagement';
import EventModal from './EventModal';
import AIAssistant from '../assistant/AIAssistant';
import { useToast } from '../../contexts/ToastContext';
import { handleAuthFailure } from '../../utils/authUtils';

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

  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  });

  const [selectedChild, setSelectedChild] = useState<LocalChild | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [children, setChildren] = useState<LocalChild[]>([]);
  const [showAddChild, setShowAddChild] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventsByDate, setEventsByDate] = useState<{ [date: string]: Event[] }>({});
  const isLoadingRef = useRef(false);

  // --- Week/Month helpers ---
  const startOfWeek = (date: Date) => {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() - d.getUTCDay());
    d.setUTCHours(0, 0, 0, 0);
    return d;
  };

  const endOfWeek = (date: Date) => {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + (6 - d.getUTCDay()));
    d.setUTCHours(23, 59, 59, 999);
    return d;
  };

  const monthStart = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const monthEnd = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59));

  // --- Load children ---
  const loadChildren = async () => {
    try {
      const response = await childApiService.getChildren();
      if (response.success && response.data) {
        const localChildren: LocalChild[] = response.data.map(child => ({
          id: child.id || null,
          name: child.name,
          gradeLevel: child.gradeLevel,
          schoolName: child.schoolName,
          birthDate: child.birthDate
        }));
        setChildren(localChildren);
      } else {
        handleAuthFailure(response.error || 'Unknown server error');
        setChildren([]);
      }
    } catch (error) {
      showError('Failed to Load Children', error instanceof Error ? error.message : 'Network error occurred');
      setChildren([]);
    }
  };

  // --- Load events ---
  const loadEventsForDateRange = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoadingEvents(true);

    const timeoutId = setTimeout(() => {
      isLoadingRef.current = false;
      setIsLoadingEvents(false);
    }, 10000);

    try {
      const year = selectedDate.getUTCFullYear();
      const month = selectedDate.getUTCMonth() + 1;
      const childId = selectedChild?.id || undefined;

      const response = await calendarApiService.getMonthlyEvents(year, month, childId);

      if (response.success && response.data) {
        setEvents(response.data.events);
        setEventsByDate(response.data.eventsByDate);
      } else {
        handleAuthFailure(response.error || 'Unknown server error');
        showError('Failed to Load Events', response.error || '');
        setEvents([]);
        setEventsByDate({});
      }
    } catch (error) {
      showError('Failed to Load Events', error instanceof Error ? error.message : 'Network error occurred');
      setEvents([]);
      setEventsByDate({});
    } finally {
      clearTimeout(timeoutId);
      isLoadingRef.current = false;
      setIsLoadingEvents(false);
    }
  }, [selectedChild, selectedDate, showError]);

  // --- Effects ---
  useEffect(() => { if (isAuthenticated) loadChildren(); }, [isAuthenticated]);
  useEffect(() => { if (isAuthenticated) loadEventsForDateRange(); }, [isAuthenticated, selectedChild, selectedDate, loadEventsForDateRange]);

  // --- Event handlers ---
  const handleEventClick = useCallback((event: Event) => { setSelectedEvent(event); setShowEditEvent(true); }, []);
  const handleEventCreated = useCallback(async () => { await loadEventsForDateRange(); }, [loadEventsForDateRange]);
  const handleEventUpdated = useCallback(async () => { await loadEventsForDateRange(); }, [loadEventsForDateRange]);
  const handleEventDeleted = useCallback(async () => { await loadEventsForDateRange(); }, [loadEventsForDateRange]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation currentView={currentView} onViewChange={setCurrentView} onAIAssistantOpen={() => setCurrentView('ai-assistant')} />

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
          onAddEvent={() => { if (!children.length) showError('Add Child first'); else setShowAddEvent(true); }}
          onEventClick={handleEventClick}
        />
      )}

      {currentView === 'children' && <ChildManagement onBack={() => setCurrentView('calendar')} />}
      {currentView === 'ai-assistant' && <AIAssistant children={children} onEventsCreated={handleEventCreated} onBack={() => setCurrentView('calendar')} />}

      {showAddEvent && <EventModal isOpen={showAddEvent} onClose={() => setShowAddEvent(false)} children={children} mode="create" onEventCreated={handleEventCreated} />}
      {showEditEvent && selectedEvent && (
        <EventModal
          isOpen={showEditEvent}
          onClose={() => { setShowEditEvent(false); setSelectedEvent(null); }}
          event={selectedEvent}
          children={children}
          mode="edit"
          onEventUpdated={handleEventUpdated}
          onEventDeleted={handleEventDeleted}
        />
      )}
    </div>
  );
};

export default FamilyCalendarApp;
