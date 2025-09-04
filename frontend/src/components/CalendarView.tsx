import React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Event } from '../services/eventApi';
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
  onAddEvent: () => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  selectedDate,
  onDateChange,
  selectedChild,
  onChildChange,
  children,
  events,
  onAddEvent
}) => {
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

  const eventPriorities = {
    LOW: { label: 'Low', color: 'text-gray-500' },
    MEDIUM: { label: 'Medium', color: 'text-yellow-500' },
    HIGH: { label: 'High', color: 'text-red-500' },
    URGENT: { label: 'Urgent', color: 'text-red-700' }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayWeek = firstDay.getDay();
    
    const days = [];
    
    // Previous month's days
    for (let i = firstDayWeek - 1; i >= 0; i--) {
      const day = new Date(firstDay);
      day.setDate(day.getDate() - i - 1);
      days.push({ date: day, isCurrentMonth: false });
    }
    
    // Current month's days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const day = new Date(year, month, i);
      days.push({ date: day, isCurrentMonth: true });
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.startDate).toISOString().split('T')[0];
      return eventDate === dateStr && 
             (selectedChild ? event.childId === selectedChild.id : true);
    });
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(selectedDate.getMonth() + direction);
    onDateChange(newDate);
  };

  const days = getDaysInMonth(selectedDate);

  return (
    <div className="p-6">
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center space-x-4">
          <select
            value={selectedChild?.id || ''}
            onChange={(e) => {
              const childId = parseInt(e.target.value);
              const child = children.find(c => c.id === childId);
              onChildChange(child || null);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">All Children</option>
            {children.map(child => (
              <option key={child.id} value={child.id?.toString() || ''}>{child.name}</option>
            ))}
          </select>
          
          <button
            onClick={onAddEvent}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-4 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-4">
        {days.map((day, index) => {
          const dayEvents = getEventsForDate(day.date);
          return (
            <div
              key={index}
              className={`min-h-24 p-2 border rounded-lg ${
                day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              } hover:bg-gray-50 transition-colors cursor-pointer`}
              onClick={() => {
                // TODO: Implement quick event creation for clicked date
                console.log('📅 Quick add event for date:', day.date.toISOString().split('T')[0]);
              }}
              title={`Click to add event for ${day.date.toLocaleDateString()}`}
            >
              <div className={`text-sm font-medium ${
                day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {day.date.getDate()}
              </div>
              <div className="space-y-1 mt-2">
                {dayEvents.slice(0, 2).map(event => (
                  <div
                    key={event.id}
                    className={`text-xs text-white px-2 py-1 rounded cursor-pointer ${
                      eventTypes[event.type as keyof typeof eventTypes]?.color || 'bg-gray-500'
                    }`}
                    title={`${event.title} - ${eventPriorities[event.priority]?.label || 'Medium'} Priority\nClick to edit`}
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implement event editing
                      console.log('✏️ Edit event:', event.id);
                    }}
                  >
                    {event.title.length > 12 ? event.title.substring(0, 12) + '...' : event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Event Type Legend */}
      <EventTypeLegend />
    </div>
  );
};

export default CalendarView;
