import React from 'react';
import { Calendar, Users, Bot } from 'lucide-react';

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onAIAssistantOpen: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ 
  currentView, 
  onViewChange, 
  onAIAssistantOpen 
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex space-x-6">
        <button
          onClick={() => onViewChange('calendar')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            currentView === 'calendar' 
              ? 'bg-purple-100 text-purple-700' 
              : 'text-gray-600 hover:text-purple-600'
          }`}
        >
          <Calendar className="w-5 h-5 inline mr-2" />
          Calendar
        </button>
        
        <button
          onClick={() => onViewChange('children')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            currentView === 'children' 
              ? 'bg-purple-100 text-purple-700' 
              : 'text-gray-600 hover:text-purple-600'
          }`}
        >
          <Users className="w-5 h-5 inline mr-2" />
          Children
        </button>
        
        <button
          onClick={onAIAssistantOpen}
          className="px-4 py-2 rounded-lg transition-colors text-gray-600 hover:text-purple-600"
        >
          <Bot className="w-5 h-5 inline mr-2" />
          AI Assistant
        </button>
      </div>
    </div>
  );
};

export default Navigation;
