import axios from 'axios';
import { getCookie } from '../utils/cookies';
import { isValidToken, handleAuthFailure } from '../utils/authUtils';
import { Event } from './eventApi';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const CALENDAR_BASE_URL = `${API_BASE_URL}/calendar`;

// Types for the monthly calendar API response
export interface MonthlyCalendarResponse {
  year: number;
  month: number;
  events: Event[];
  eventsByDate: { [date: string]: Event[] };
  totalEvents: number;
  filteredChild: number | null;
}

type ApiResponse<T> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: string }

const getAuthHeaders = () => {
  const token = getCookie('auth_token');
  
  if (!token) {
    console.warn('⚠️ No auth token found for calendar API request');
    return {};
  }
  
  if (!isValidToken(token)) {
    console.warn('⚠️ Invalid auth token format for calendar API request');
    return {};
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

const handleResponse = async <T>(response: any): Promise<ApiResponse<T>> => {
  try {
    if (response.status === 401) {
      const errorMessage = 'Request failed with status code 401';
      handleAuthFailure(errorMessage);
      return {
        success: false,
        error: 'Authentication failed. Please login again.'
      };
    }
    
    if (response.data && response.data.success) {
      return {
        success: true,
        data: response.data.data
      };
    } else {
      return {
        success: false,
        error: response.data?.message || 'Unknown error occurred'
      };
    }
  } catch (error) {
    console.error('Error handling response:', error);
    return {
      success: false,
      error: 'Failed to process response'
    };
  }
};

class CalendarApiService {
  /**
   * Get monthly calendar events
   * @param year - Year (e.g., 2025)
   * @param month - Month (1-12)
   * @param childId - Optional child ID for filtering
   */
  async getMonthlyEvents(year: number, month: number, childId?: number): Promise<ApiResponse<MonthlyCalendarResponse>> {
    try {
      console.log(`📅 Fetching monthly events for ${year}-${month}${childId ? ` (child: ${childId})` : ' (all children)'}`);
      
      const headers = getAuthHeaders();
      let url = `${CALENDAR_BASE_URL}/monthly?year=${year}&month=${month}`;
      
      if (childId) {
        url += `&childId=${childId}`;
      }
      
      const response = await axios.get(url, { headers });
      
      console.log(`✅ Monthly events API response:`, response.status);
      return await handleResponse<MonthlyCalendarResponse>(response);
      
    } catch (error: any) {
      console.error('❌ Error fetching monthly events:', error);
      
      if (error.response?.status === 401) {
        handleAuthFailure(error.message || 'Authentication failed');
        return {
          success: false,
          error: 'Authentication failed. Please login again.'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to fetch monthly events'
      };
    }
  }
}

export const calendarApiService = new CalendarApiService();
