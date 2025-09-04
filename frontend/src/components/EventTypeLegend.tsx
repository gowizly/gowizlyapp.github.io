import React from 'react';

const EventTypeLegend: React.FC = () => {
  const eventTypes = {
    ASSIGNMENT_DUE: { color: 'bg-purple-500', label: 'Assignment Due' },
    EXTRACURRICULAR: { color: 'bg-red-500', label: 'Extracurricular Event' },
    SCHOOL_EVENT: { color: 'bg-blue-500', label: 'School Event' },
    PARENT_MEETING: { color: 'bg-green-500', label: 'Parent Meeting' },
    HOLIDAY: { color: 'bg-yellow-500', label: 'Holiday' },
    BIRTHDAY: { color: 'bg-yellow-500', label: 'Birthday' },
    APPOINTMENT: { color: 'bg-yellow-500', label: 'Appointment' },
    REMINDER: { color: 'bg-yellow-500', label: 'Reminder' },
    EXAM: { color: 'bg-orange-500', label: 'Exam' },
    OTHER: { color: 'bg-gray-500', label: 'Other' }
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4">Event Types</h3>
      <div className="flex flex-wrap gap-4">
        {Object.entries(eventTypes).map(([type, config]) => (
          <div key={type} className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded ${config.color}`}></div>
            <span className="text-sm text-gray-600">{config.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventTypeLegend;
