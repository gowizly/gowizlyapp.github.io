/// <reference types="react" />
/// <reference types="react-dom" />
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Plus, Camera, Mail, Bot, Settings, ChevronLeft, ChevronRight, Upload, User, Lock, LogOut } from 'lucide-react';


interface Child {
      id: number | null;
      name: string;
      grade: string;
      school: string;
    }

interface Event {
      id: number | null;
      childId: number;
      title:  string;
      type: string;
      date: string;
      time: string;
      description: string;
}

const FamilyCalendarApp = () => {
  //const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  //const [currentUser, setCurrentUser] = useState(null);
  const [currentUser, setCurrentUser] = useState({ name: 'Sarah Johnson', email: 'sarah@email.com' });
  const [currentView, setCurrentView] = useState('calendar');
  //const [calendarView, setCalendarView] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  //const [selectedChild, setSelectedChild] = useState(null);
  // Updated state to allow for a full Child object or null
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  //const [events, setEvents] = useState([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [showAddChild, setShowAddChild] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiMode, setAiMode] = useState('email');
  const [emailText, setEmailText] = useState('');
  const [newChild, setNewChild] = useState({ name: '', grade: '', school: '' });
  // Added childId to newEvent state
  const [newEvent, setNewEvent] = useState({ title: '', type: 'assignment', date: '', time: '', description: '', childId: null as number | null });

  const eventTypes = {
    assignment: { color: 'bg-purple-500', label: 'Assignment' },
    dueDate: { color: 'bg-red-500', label: 'Due Date' },
    schoolEvent: { color: 'bg-blue-500', label: 'School Event' },
    parentEvent: { color: 'bg-green-500', label: 'Parent Event' },
    holiday: { color: 'bg-yellow-500', label: 'Holiday' },
    exam: { color: 'bg-orange-500', label: 'Exam' }
  };

  // Sample data
  useEffect(() => {
    if (isAuthenticated) {
      setChildren([
        { id: 1, name: 'Emma', grade: '5th Grade', school: 'Lincoln Elementary' },
        { id: 2, name: 'Jake', grade: '8th Grade', school: 'Roosevelt Middle School' }
      ]);
      
      setEvents([
        {
          id: 1,
          childId: 1,
          title: 'Math Homework',
          type: 'assignment',
          date: '2025-08-15',
          time: '09:00',
          description: 'Chapter 5 exercises'
        },
        {
          id: 2,
          childId: 1,
          title: 'Science Project Due',
          type: 'dueDate',
          date: '2025-08-18',
          time: '14:00',
          description: 'Solar system model'
        },
        {
          id: 3,
          childId: 2,
          title: 'Parent-Teacher Conference',
          type: 'parentEvent',
          date: '2025-08-20',
          time: '15:30',
          description: 'Meeting with Mrs. Johnson'
        }
      ]);
    }
  }, [isAuthenticated]);

  const LoginForm = () => {
    const [loginData, setLoginData] = useState({ username: '', password: '' });

    const handleLogin = (e: { preventDefault: () => void; }) => {
      e.preventDefault();
      setCurrentUser({ name: 'Sarah Johnson', email: 'sarah@email.com' });
      setIsAuthenticated(true);
    };

    const handleGoogleLogin = () => {
      setCurrentUser({ name: 'Sarah Johnson', email: 'sarah@email.com' });
      setIsAuthenticated(true);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-purple-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <Calendar className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Family Calendar</h1>
            <p className="text-gray-600">Organize your family's schedule with AI assistance</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <div className="relative">
                <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Sign In
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </form>
        </div>
      </div>
    );
  };

  const Header = () => (
    <div className="bg-purple-600 text-white p-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <Calendar className="w-8 h-8" />
        <h1 className="text-xl font-bold">Family Calendar</h1>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-sm">Welcome, {currentUser?.name}</span>
        <button
          onClick={() => setIsAuthenticated(false)}
          className="p-2 hover:bg-purple-700 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const Navigation = () => (
    <div className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex space-x-6">
        <button
          onClick={() => setCurrentView('calendar')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            currentView === 'calendar' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:text-purple-600'
          }`}
        >
          <Calendar className="w-5 h-5 inline mr-2" />
          Calendar
        </button>
        <button
          onClick={() => setCurrentView('children')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            currentView === 'children' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:text-purple-600'
          }`}
        >
          <Users className="w-5 h-5 inline mr-2" />
          Children
        </button>
        <button
          onClick={() => setShowAIAssistant(true)}
          className="px-4 py-2 rounded-lg transition-colors text-gray-600 hover:text-purple-600"
        >
          <Bot className="w-5 h-5 inline mr-2" />
          AI Assistant
        </button>
      </div>
    </div>
  );

  const CalendarView = () => {
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
      return events.filter(event => 
      event.date === dateStr && 
        (selectedChild ? event.childId === selectedChild.id : true)
      );
    };

    const navigateMonth = (direction: number) => {
      const newDate = new Date(selectedDate);
      newDate.setMonth(selectedDate.getMonth() + direction);
      setSelectedDate(newDate);
    };

    const days = getDaysInMonth(selectedDate);

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-800">
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedChild?.id || ''}
              //onChange={(e) => setSelectedChild(children.find(c => c.id === parseInt(e.target.value)) || null)}
              onChange={(e) => {
                const childId = parseInt(e.target.value);
                const child = children.find(c => c.id === childId);
                // We set the state to either the found child or null
                setSelectedChild(child || null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Children</option>
              {children.map(child => (
                <option key={child.id} value={child.id?.toString() || ''}>{child.name}</option>
              ))}
            </select>
            <button
              onClick={() => setShowAddEvent(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Event
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-4 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-4">
          {days.map((day, index) => {
            const dayEvents = getEventsForDate(day.date);
            return (
              <div
                key={index}
                className={`min-h-24 p-2 border rounded-lg ${
                  day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                } hover:bg-gray-50 transition-colors`}
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
                      // Correctly access the event type color
                      className={`text-xs text-white px-2 py-1 rounded ${eventTypes[event.type as keyof typeof eventTypes].color}`}
                      title={event.title}
                      //className={`text-xs text-white px-2 py-1 rounded ${eventTypes[event.type].color}`}
                      //title={event.title}
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
      </div>
    );
  };

  const ChildrenView = () => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Children</h2>
        <button
          onClick={() => setShowAddChild(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Child
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children.map(child => {
          const childEvents = events.filter(e => e.childId === child.id);
          return (
            <div key={child.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{child.name}</h3>
                  <p className="text-sm text-gray-600">{child.grade}</p>
                  <p className="text-sm text-gray-500">{child.school}</p>
                </div>
              </div> 
              <div className="mt-4">
                <h4 className="font-semibold text-gray-700 mb-2">Upcoming Events:</h4>
                <div className="space-y-2">
                  {childEvents.length > 0 ? (
                    childEvents.map(event => (
                      <div key={event.id} className="bg-gray-50 p-3 rounded-lg flex items-center space-x-3">
                        <Clock className="w-4 h-4 text-purple-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{event.title}</p>
                          <p className="text-xs text-gray-500">{event.date} at {event.time}</p>
                        </div>
                        <div
                          className={`w-3 h-3 rounded-full ${eventTypes[event.type as keyof typeof eventTypes].color}`}
                          title={eventTypes[event.type as keyof typeof eventTypes].label}
                        ></div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">No upcoming events.</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

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
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={newChild.name}
                onChange={(e) => setNewChild({...newChild, name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Enter child's name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
              <input
                type="text"
                value={newChild.grade}
                onChange={(e) => setNewChild({...newChild, grade: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., 5th Grade"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">School</label>
              <input
                type="text"
                value={newChild.school}
                onChange={(e) => setNewChild({...newChild, school: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Enter school name"
              />
            </div>
          </div>
          
          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => setShowAddChild(false)}
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const newId = children.length + 1;
                setChildren([...children, { ...newChild, id: newId }]);
                setNewChild({ name: '', grade: '', school: '' });
                setShowAddChild(false);
              }}
              disabled={!newChild.name || !newChild.grade || !newChild.school}
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        <div className="bg-purple-600 text-white p-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Add Event</h3>
          <button
            onClick={() => setShowAddEvent(false)}
            className="text-white hover:bg-purple-700 rounded-lg p-2 transition-colors"
          >
            ×
          </button>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Event title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={newEvent.type}
                onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                {Object.entries(eventTypes).map(([type, config]) => (
                  <option key={type} value={type}>{config.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Child</label>
              <select
                value={selectedChild?.id || ''}
                //onChange={(e) => setSelectedChild(Children.find(c => c.id === parseInt(e.target.value)))}
                onChange={(e) => {
                const childId = parseInt(e.target.value);
                const child = children.find(c => c.id === childId);
                // We set the state to either the found child or null
                setSelectedChild(child || null);
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
                rows = {3}
                placeholder="Event description (optional)"
              />
            </div>
          </div>
          
          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => setShowAddEvent(false)}
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const newId = events.length > 0 ? Math.max(...events.map(e => e.id || 0)) + 1 : 1;
                if (newEvent.childId === null) return;
                const createdEvent: Event = { ...newEvent, id: newId, childId: newEvent.childId };
                setEvents([...events, createdEvent]);
                setNewEvent({ title: '', type: 'assignment', date: '', time: '', description: '', childId: null });
                setShowAddEvent(false);                
                alert('Event added! You can now send calendar invites from the event details.');
              }}
              disabled={!newEvent.title || !newEvent.date || !selectedChild}
              className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation />
      
      {currentView === 'calendar' && <CalendarView />}
      {currentView === 'children' && <ChildrenView />}
      
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
