import React, { useState } from 'react';
import { Calendar, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import ConfirmationDialog from './ConfirmationDialog'; // Import the confirmation dialog

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { showSuccess } = useToast();
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  
  const handleLogoutClick = () => {
    setShowLogoutConfirmation(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutConfirmation(false);
    logout();
    showSuccess('Logged Out Successfully', 'You have been logged out of your account');
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirmation(false);
  };
  
  return (
    <>
      <div className="bg-purple-600 text-white p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Calendar className="w-8 h-8" />
          <h1 className="text-xl font-bold">Gowizly Family Calendar</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/user-management')}
            className="px-3 py-2 hover:bg-purple-700 rounded-lg transition-colors text-sm cursor-pointer"
          >
            Welcome, {user?.username}
          </button>
          <button
            onClick={handleLogoutClick}
            className="p-2 hover:bg-purple-700 rounded-lg transition-colors flex items-center space-x-2"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showLogoutConfirmation}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
        title="Confirm Logout"
        message="Are you sure you want to log out? You will need to log in again to access your account."
        confirmText="Yes, Logout"
        cancelText="Cancel"
      />
    </>
  );
};

export default Header;