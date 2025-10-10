import React, { useState } from 'react';
import { Calendar, Users, Bot, Mail, Download, Loader2 } from 'lucide-react';
import axios from "axios";
import { useToast } from "../../contexts/ToastContext";
import { API_BASE_URL } from "../../config/environment";

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
  const [isFetchingEmails, setIsFetchingEmails] = useState(false);

  const { showSuccess, showError } = useToast();

  const handleFetchEmails = async () => {
    setIsFetchingEmails(true);
    
    try {
      // 2-second timer for testing loading state
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const token = getAuthTokenFromCookies(); // ✅ use cookie token
      if (!token) {
        showError("No authentication token found. Please log in again.");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/emailfetch/fetch`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true, // ✅ include cookies if needed
      });

      console.log("📬 Emails fetched:", response.data);
      showSuccess("Emails fetched successfully!");
    } catch (error: any) {
      console.error("❌ Error fetching emails:", error);
      showError(error.response?.data?.message || "Failed to fetch emails.");
    } finally {
      setIsFetchingEmails(false);
    }
  };

   // ✅ Fetch token from cookies (since it's not in localStorage)
   const getAuthTokenFromCookies = () => {
    const match = document.cookie.match(/(^|;\s*)auth_token=([^;]+)/);
    return match ? decodeURIComponent(match[2]) : null;
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex space-x-6 items-center justify-between">
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
          className={`px-4 py-2 rounded-lg transition-colors ${
            currentView === 'ai-assistant' 
              ? 'bg-purple-100 text-purple-700' 
              : 'text-gray-600 hover:text-purple-600'
          }`}
        >
          <Bot className="w-5 h-5 inline mr-2" />
          AI Assistant
        </button>
        
        <button
          onClick={() => onViewChange('email-filter')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            currentView === 'email-filter' 
              ? 'bg-purple-100 text-purple-700' 
              : 'text-gray-600 hover:text-purple-600'
          }`}
        >
          <Mail className="w-5 h-5 inline mr-2" />
          Email Filter Settings
        </button>
        </div>
        
        <button
          onClick={handleFetchEmails}
          disabled={isFetchingEmails}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
            isFetchingEmails 
              ? 'bg-purple-400 text-white cursor-not-allowed' 
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {isFetchingEmails ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Fetching...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>Fetch Emails</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Navigation;
