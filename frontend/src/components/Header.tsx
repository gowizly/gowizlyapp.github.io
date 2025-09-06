import React from 'react';
import { Calendar, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="bg-purple-600 text-white p-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <Calendar className="w-8 h-8" />
        <h1 className="text-xl font-bold">GoWizly Family Calendar</h1>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-sm hidden sm:inline">Welcome, {user?.name}</span>
        <button
          onClick={logout}
          className="p-2 hover:bg-purple-700 rounded-lg transition-colors flex items-center space-x-2"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Header;
