import React, { useEffect, useState } from 'react';
import { Calendar, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/environment';
import Cookies from 'js-cookie';
import axios from 'axios';
import ConfirmationDialog from './ConfirmationDialog'; // Import the confirmation dialog

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  
  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${Cookies.get('auth_token')}`
        }
      });
      console.log("Full response:", response.data);
      
      // Access the nested user data correctly
      if (response.data.success && response.data.data && response.data.data.user) {
        setUser(response.data.data.user);
        console.log("User set to:", response.data.data.user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  }
  
  const handleLogoutClick = () => {
    setShowLogoutConfirmation(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutConfirmation(false);
    logout();
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirmation(false);
  };
  
  useEffect(() => {
    fetchUser();
  }, []);
  
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