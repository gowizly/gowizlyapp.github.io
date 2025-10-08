import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Event } from '../../services/eventApi';
import EventTypeLegend from './EventTypeLegend';

interface LocalChild {
  id: number | null;
  name: string;
  gradeLevel: string;
  schoolName: string;
  birthDate?: string;
}

interface CalendarViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedChild: LocalChild | null;
  onChildChange: (child: LocalChild | null) => void;
  children: LocalChild[];
  events: Event[];
  eventsByDate?: { [date: string]: Event[] };
  isLoadingEvents?: boolean;
  onAddEvent: () => void;
  onEventClick?: (event: Event) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  selectedDate,
  onDateChange,
  selectedChild,
  onChildChange,
  children,
  events,
  eventsByDate = {},
  isLoadingEvents = false,
  onAddEvent,
  onEventClick
}) => {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [hoveredEventId, setHoveredEventId] = useState<number | null>(null);
  const [showAllEventsModal, setShowAllEventsModal] = useState<{ open: boolean; events: Event[] }>({ open: false, events: [] });

  const eventTypes = {
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
  };

  const getEventsForDate = (date: Date) => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const dayEvents = eventsByDate[dateStr] || [];

    const filteredEvents = events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.getUTCFullYear() === date.getUTCFullYear() &&
             eventDate.getUTCMonth() === date.getUTCMonth() &&
             eventDate.getUTCDate() === date.getUTCDate();
    });

    return [...dayEvents, ...filteredEvents].filter(
      (event, index, self) => index === self.findIndex(e => e.id === event.id)
    );
  };

  const navigate = (amount: number) => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'month') newDate.setUTCMonth(selectedDate.getUTCMonth() + amount);
    if (viewMode === 'week') newDate.setUTCDate(selectedDate.getUTCDate() + amount * 7);
    if (viewMode === 'day') newDate.setUTCDate(selectedDate.getUTCDate() + amount);
    onDateChange(newDate);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const firstDay = new Date(Date.UTC(year, month, 1));
    const lastDay = new Date(Date.UTC(year, month + 1, 0));
    const firstDayWeek = firstDay.getUTCDay();

    const days = [];
    for (let i = firstDayWeek - 1; i >= 0; i--) {
      const day = new Date(firstDay);
      day.setUTCDate(day.getUTCDate() - i - 1);
      days.push({ date: day, isCurrentMonth: false });
    }
    for (let i = 1; i <= lastDay.getUTCDate(); i++) {
      const day = new Date(Date.UTC(year, month, i));
      days.push({ date: day, isCurrentMonth: true });
    }
    return days;
  };

  const getWeekDates = (date: Date) => {
    const start = new Date(date);
    start.setUTCDate(date.getUTCDate() - date.getUTCDay());
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      return d;
    });
  };

  const currentDates =
    viewMode === 'month' ? getDaysInMonth(selectedDate) :
    viewMode === 'week' ? getWeekDates(selectedDate).map(d => ({ date: d, isCurrentMonth: true })) :
    [{ date: selectedDate, isCurrentMonth: true }];

  const renderGrid = () => (
    <div className={`grid ${viewMode === 'month' ? 'grid-cols-7' : viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'} gap-4`}>
      {(viewMode === 'month' || viewMode === 'week') && ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
        <div key={d} className="text-center font-semibold text-gray-600 py-2">{d}</div>
      ))}
      
      {viewMode === 'day' && (
        <div className="text-center font-semibold text-gray-600 py-2">
          {selectedDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })}
        </div>
      )}

      {currentDates.map((dayObj, index) => {
        const dayEvents = getEventsForDate(dayObj.date);
        return (
          <div
            key={index}
            className={`min-h-24 p-2 border rounded-lg ${dayObj.isCurrentMonth ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-50 transition-colors cursor-pointer`}
            onClick={() => console.log('📅 Quick add event for date:', dayObj.date.toISOString().split('T')[0])}
          >
            <div className={`text-sm font-medium ${dayObj.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
              {dayObj.date.getUTCDate()}
            </div>
            <div className="space-y-1 mt-2">
              {dayEvents.slice(0, 3).map(event => (
                <div
                  key={event.id}
                  className={`relative text-xs text-white px-2 py-1 rounded cursor-pointer ${eventTypes[event.type as keyof typeof eventTypes]?.color || 'bg-gray-500'}`}
                  onMouseEnter={() => setHoveredEventId(event.id)}
                  onMouseLeave={() => setHoveredEventId(null)}
                  onClick={(e) => { e.stopPropagation(); onEventClick?.(event); }}
                >
                  {event.children && event.children.length > 0
                    ? `${event.children.map(child => child.name).join(', ')} - `
                    : ''}
                  {event.title}
                  {hoveredEventId === event.id && (
                    <div className="absolute z-50 left-1/2 transform -translate-x-1/2 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-gray-800 text-sm">
                      <div className="font-semibold mb-1">{event.title}</div>
                      <div className="mb-1">
                        {event.description 
                          ? (event.description.length > 100 
                              ? event.description.substring(0, 100) + '...' 
                              : event.description)
                          : 'No description'}
                      </div>
                      <div className="text-gray-500 text-xs">
                        🕒 {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', })} UTC
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {dayEvents.length > 3 && (
                <div
                  className="text-xs text-gray-500 cursor-pointer"
                  onClick={() => setShowAllEventsModal({ open: true, events: dayEvents })}
                >
                  +{dayEvents.length - 3} click for more
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <select
            value={selectedChild?.id?.toString() || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') onChildChange(null);
              else {
                const childId = parseInt(value);
                const child = children.find(c => c.id === childId);
                onChildChange(child || null);
              }
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            title="Select child to filter events"
          >
            <option value="">All Children</option>
            {children.map(child => (
              <option key={child.id} value={child.id?.toString() || ''}>{child.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
          </h2>
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => navigate(1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="w-5 h-5" />
          </button>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
            className="px-3 py-2 border rounded"
            title="Select view mode"
          >
            <option value="month">Month</option>
            <option value="week">Week</option>
            <option value="day">Day</option>
          </select>
          <button
            onClick={onAddEvent}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            title="Add a new event"
          >
            <Plus className="w-5 h-5" /> Add Event
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      {renderGrid()}

      {/* Event Type Legend */}
      <EventTypeLegend />

      {/* Modal for all events */}
      {showAllEventsModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="bg-purple-600 text-white p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">All Events</h3>
              <button
                onClick={() => setShowAllEventsModal({ open: false, events: [] })}
                className="text-white hover:bg-purple-700 rounded-lg p-2 transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto space-y-2">
              {showAllEventsModal.events.map(event => (
                <div
                  key={event.id}
                  className={`text-xs text-white px-2 py-1 rounded cursor-pointer ${eventTypes[event.type as keyof typeof eventTypes]?.color || 'bg-gray-500'}`}
                  onClick={() => { onEventClick?.(event); setShowAllEventsModal({ open: false, events: [] }); }}
                >
                  {event.children && event.children.length > 0
                    ? `${event.children.map(child => child.name).join(', ')} - `
                    : ''}
                  {event.title.length > 20 ? event.title.substring(0, 20) + '...' : event.title}
                  <div className="text-gray-100 text-[10px] mt-1">
                    {event.description 
                      ? (event.description.length > 50 
                          ? event.description.substring(0, 50) + '...' 
                          : event.description)
                      : 'No description'}
                  </div>
                  <div className="text-gray-100 text-[10px] mt-1">
                    🕒 {event.startDate}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;