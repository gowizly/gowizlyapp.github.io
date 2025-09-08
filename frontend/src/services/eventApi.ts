import { getCookie } from '../utils/cookies';
import { API_BASE_URL } from '../config/environment';

// API Configuration
const EVENT_ENDPOINT = '/api/calendar/events';

console.log('🔧 Event API Service initialized with base URL:', API_BASE_URL);

export interface Event {
  id?: number;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  type: EventType;
  priority: EventPriority;
  color?: string;
  childId: number | null;
  hasReminder: boolean;
  reminderMinutes?: number;
  children?: Array<{
    id: number;
    name: string;
  }>;
  isRecurring?: boolean;
  recurrenceRule?: string;
  parentId?: number;
  createdAt?: string;
  updatedAt?: string;
  // Additional fields from API response
  startDateOnly?: string;
  endDateOnly?: string;
}

export type EventType = 'SCHOOL_EVENT' | 'ASSIGNMENT_DUE' | 'EXAM' | 'PARENT_MEETING' | 'EXTRACURRICULAR' | 'APPOINTMENT' | 'BIRTHDAY' | 'HOLIDAY' | 'REMINDER' | 'OTHER';
export type EventPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface EventsResponse {
  events: Event[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface CreateEventResponse {
  event: Event;
  conflicts?: any[];
  childrenCount?: number;
}

class EventApiService {
  private getAuthHeaders(): Record<string, string> {
    const token = getCookie('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      let data;
      const contentType = response.headers.get('content-type');
      
      console.log(`📡 Event API Response [${response.status}] Content-Type: ${contentType}`);
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      // Check if we got HTML instead of API data
      if (typeof data === 'string' && data.includes('<!doctype html>')) {
        console.error('🚨 Received HTML instead of API data - endpoint likely not implemented');
        return {
          success: false,
          error: 'Event API endpoint not found - received HTML page instead of JSON data.',
        };
      }
      
      console.log(`📡 Event API Response [${response.status}]:`, data);
      
      if (!response.ok) {
        let errorMessage = `HTTP Error: ${response.status}`;
        
        if (typeof data === 'object') {
          // Handle validation errors specifically
          if (data.msg && data.errors) {
            console.error('🚨 Event Validation Error Details:', data.errors);
            errorMessage = `${data.msg}: ${JSON.stringify(data.errors)}`;
          } else {
            errorMessage = data.message || data.msg || data.error || errorMessage;
          }
        } else if (typeof data === 'string') {
          errorMessage = data || errorMessage;
        }
        
        return {
          success: false,
          error: errorMessage,
        };
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error('📡 Event API Response parsing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse response',
      };
    }
  }

  async createEvent(eventData: Omit<Event, 'id'>): Promise<ApiResponse<CreateEventResponse>> {
    try {
      console.log('🆕 Creating event:', eventData);
      console.log('📤 Event request payload:', JSON.stringify(eventData, null, 2));
      
      const response = await fetch(`${API_BASE_URL}${EVENT_ENDPOINT}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(eventData),
      });

      const result = await this.handleResponse<any>(response);
      
      if (result.success && result.data) {
        // API returns { success: true, msg: "...", data: { event: {...}, childrenCount: ... } }
        console.log('✅ Event created successfully, extracting data');
        return {
          success: true,
          data: result.data.data // Extract the nested data object
        };
      }
      
      return result;
    } catch (error) {
      console.error('❌ Create event error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  async getEvents(limit: number = 50, offset: number = 0): Promise<ApiResponse<EventsResponse>> {
    try {
      console.log('📋 Fetching events...');
      
      const url = new URL(`${API_BASE_URL}${EVENT_ENDPOINT}`);
      url.searchParams.append('limit', limit.toString());
      url.searchParams.append('offset', offset.toString());
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await this.handleResponse<any>(response);
      
      if (result.success && result.data) {
        // Handle different API response structures
        if (result.data.data && result.data.data.events) {
          console.log('✅ Extracting events array from nested API response');
          return {
            success: true,
            data: result.data.data
          };
        }
        // If API returns events directly in data
        else if (Array.isArray(result.data)) {
          console.log('✅ Processing events array from direct API response');
          return {
            success: true,
            data: { 
              events: result.data, 
              pagination: { 
                total: result.data.length, 
                limit, 
                offset, 
                hasMore: false 
              } 
            }
          };
        }
        // Fallback for other structures
        else {
          return {
            success: true,
            data: result.data
          };
        }
      }
      
      return result;
    } catch (error) {
      console.error('❌ Get events error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  async updateEvent(eventId: number, eventData: Partial<Event>): Promise<ApiResponse<Event>> {
    try {
      console.log('✏️ Updating event:', eventId, eventData);
      console.log('📤 Event update payload:', JSON.stringify(eventData, null, 2));
      
      const response = await fetch(`${API_BASE_URL}${EVENT_ENDPOINT}/${eventId}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(eventData),
      });

      const result = await this.handleResponse<any>(response);
      
      if (result.success && result.data) {
        // API returns { success: true, msg: "...", data: { event: {...} } }
        console.log('✅ Event updated successfully, extracting event data');
        return {
          success: true,
          data: result.data.data.event // Extract the nested event object
        };
      }
      
      return result;
    } catch (error) {
      console.error('❌ Update event error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  async deleteEvent(eventId: number): Promise<ApiResponse<void>> {
    try {
      console.log('🗑️ Deleting event:', eventId);
      
      const response = await fetch(`${API_BASE_URL}${EVENT_ENDPOINT}/${eventId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const result = await this.handleResponse<any>(response);
      
      if (result.success) {
        // API returns { success: true, msg: "Event deleted successfully" }
        console.log('✅ Event delete confirmed by API');
        return {
          success: true,
          data: undefined
        };
      }
      
      return result;
    } catch (error) {
      console.error('❌ Delete event error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  // Get events filtered by child
  async getEventsByChild(childId: number): Promise<ApiResponse<Event[]>> {
    try {
      console.log('📋 Fetching events for child:', childId);
      
      const response = await this.getEvents();
      
      if (response.success && response.data) {
        const filteredEvents = response.data.events.filter(event => 
          event.childId === childId || 
          (event.childId === null && event.children && event.children.some(child => child.id === childId))
        );
        console.log(`✅ Filtered ${filteredEvents.length} events for child ${childId}`);
        return {
          success: true,
          data: filteredEvents
        };
      }
      
      return {
        success: false,
        error: response.error || 'Failed to fetch events for child'
      };
    } catch (error) {
      console.error('❌ Get events by child error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  // Get events for a specific date range
  async getEventsByDateRange(startDate: string, endDate: string): Promise<ApiResponse<Event[]>> {
    try {
      console.log('📋 Fetching events for date range:', startDate, 'to', endDate);
      
      const response = await this.getEvents();
      
      if (response.success && response.data) {
        const filteredEvents = response.data.events.filter(event => {
          const eventStart = new Date(event.startDateOnly || event.startDate);
          const rangeStart = new Date(startDate);
          const rangeEnd = new Date(endDate);
          return eventStart >= rangeStart && eventStart <= rangeEnd;
        });
        
        console.log(`✅ Found ${filteredEvents.length} events in date range`);
        return {
          success: true,
          data: filteredEvents
        };
      }
      
      return {
        success: false,
        error: response.error || 'Failed to fetch events for date range'
      };
    } catch (error) {
      console.error('❌ Get events by date range error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }
}

export const eventApiService = new EventApiService();