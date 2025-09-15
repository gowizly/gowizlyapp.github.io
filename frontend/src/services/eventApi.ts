import { getCookie } from '../utils/cookies';
import { isValidToken } from '../utils/authUtils';
import { API_BASE_URL } from '../config/environment';
import axios, { AxiosResponse } from 'axios';

export interface EventChildRef { id: number; name: string }

export interface Event {
  id?: number;
  title: string;
  description?: string;
  startDate: string; // ISO string
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
  isAllDay: boolean;
  type: EventType;
  priority: EventPriority;
  color?: string;
  childId?: number | null; // legacy support
  hasReminder: boolean;
  reminderMinutes?: number | null;
  children?: EventChildRef[]; // new format from backend
  isRecurring?: boolean;
  recurrenceRule?: string | null;
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

// Backend envelopes
interface BackendEnvelope<T> {
  success: boolean;
  msg?: string;
  data: T;
}

interface BackendEventsData {
  events: Event[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface BackendCreateEventData {
  event: Event;
  childrenCount?: number;
}

class EventApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/calendar/events`;
    console.log('🔧 Event API Service initialized with base URL:', this.baseUrl);
  }

  private getAuthHeaders(): Record<string, string> {
    const token = getCookie('auth_token');
    if (!token) {
      console.warn('⚠️ No auth token found in cookies');
    } else if (!isValidToken(token)) {
      console.warn('⚠️ Invalid auth token format detected');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  private async handleResponse<T>(response: AxiosResponse<unknown>): Promise<ApiResponse<T>> {
    try {
      const data = response.data as unknown;
      const contentType = response.headers['content-type'] as string | undefined;
      console.log(`📡 Event API Response [${response.status}] Content-Type: ${contentType}`);
      
      // Check if we got HTML instead of API data
      if (typeof data === 'string' && data.includes('<!doctype html>')) {
        console.error('🚨 Received HTML instead of API data - endpoint likely not implemented');
        return {
          success: false,
          error: 'Event API endpoint not found - received HTML page instead of JSON data.',
        };
      }
      
      console.log(`📡 Event API Response [${response.status}]:`, data);
      
      if (response.status < 200 || response.status >= 300) {
        let errorMessage = `HTTP Error: ${response.status}`;
        
        // Handle 401 Unauthorized specifically
        if (response.status === 401) {
          console.error('🚨 Authentication failed - invalid or expired token');
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (typeof data === 'object' && data !== null) {
          // Handle validation errors specifically
          const obj = data as Record<string, unknown>;
          const msg = (obj.msg as string) || (obj.message as string) || (obj.error as string) || undefined;
          const errors = obj.errors as unknown;
          if (msg && errors) {
            console.error('🚨 Event Validation Error Details:', errors);
            errorMessage = `${msg}: ${JSON.stringify(errors)}`;
          } else {
            errorMessage = msg || errorMessage;
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
        data: data as T,
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
      
      const response = await axios.post<BackendEnvelope<BackendCreateEventData>>(
        `${this.baseUrl}`,
        eventData,
        { headers: this.getAuthHeaders() }
      );

      const result = await this.handleResponse<BackendEnvelope<BackendCreateEventData>>(response);
      
      if (result.success && result.data) {
        // API returns { success: true, msg: "...", data: { event: {...}, childrenCount: ... } }
        console.log('✅ Event created successfully, extracting data');
        const envelope = result.data as BackendEnvelope<BackendCreateEventData>;
        
        // Check if the envelope has the expected structure
        if (envelope.success && envelope.data) {
          const payload: CreateEventResponse = { 
            event: envelope.data.event, 
            conflicts: undefined, 
            childrenCount: envelope.data.childrenCount 
          };
          return { success: true, data: payload };
        } else {
          return { success: false, error: envelope.msg || 'Backend returned unsuccessful response' };
        }
      }
      return { success: false, error: result.error || 'Failed to create event' };
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
      
      const url = new URL(`${this.baseUrl}`);
      url.searchParams.append('limit', limit.toString());
      url.searchParams.append('offset', offset.toString());
      
      const response = await axios.get<BackendEnvelope<BackendEventsData>>(url.toString(), {
        headers: this.getAuthHeaders(),
      });
  
      const result = await this.handleResponse<BackendEnvelope<BackendEventsData>>(response);
      
      if (result.success && result.data) {
        // Backend returns: { success: true, msg: "...", data: { events: [...], pagination: {...} } }
        const envelope = result.data as BackendEnvelope<BackendEventsData>;
        
        // Check if the envelope has the expected structure
        if (envelope.success && envelope.data) {
          const normalized: EventsResponse = {
            events: envelope.data.events,
            pagination: envelope.data.pagination,
          };
          return { success: true, data: normalized };
        } else {
          return { success: false, error: envelope.msg || 'Backend returned unsuccessful response' };
        }
      }
      return { success: false, error: result.error || 'Failed to fetch events' };
    } catch (error) {
      console.error('❌ Get events error:', error);
      
      // Provide more specific error messages based on error type
      let errorMessage = 'Network error occurred';
      if (error instanceof Error) {
        if (error.message.includes('500')) {
          errorMessage = 'Internal server error - please try again later or contact support';
        } else if (error.message.includes('Network Error')) {
          errorMessage = 'Unable to connect to the server - please check your internet connection';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out - please try again';
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async updateEvent(eventId: number, eventData: Partial<Event>): Promise<ApiResponse<Event>> {
    try {
      console.log('✏️ Updating event:', eventId, eventData);
      console.log('📤 Event update payload:', JSON.stringify(eventData, null, 2));
      
      const response = await axios.patch<BackendEnvelope<{ event: Event }>>(
        `${this.baseUrl}/${eventId}`,
        eventData,
        { headers: this.getAuthHeaders() }
      );

      const result = await this.handleResponse<BackendEnvelope<{ event: Event }>>(response);
      
      if (result.success && result.data) {
        // API returns { success: true, msg: "...", data: { event: {...} } }
        console.log('✅ Event updated successfully, extracting event data');
        const envelope = result.data as BackendEnvelope<{ event: Event }>;
        
        // Check if the envelope has the expected structure
        if (envelope.success && envelope.data) {
          return { success: true, data: envelope.data.event };
        } else {
          return { success: false, error: envelope.msg || 'Backend returned unsuccessful response' };
        }
      }
      return { success: false, error: result.error || 'Failed to update event' };
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
      
      const response = await axios.delete<BackendEnvelope<unknown>>(`${this.baseUrl}/${eventId}`, {
        headers: this.getAuthHeaders(),
      });

      const result = await this.handleResponse<BackendEnvelope<unknown>>(response);
      
      if (result.success && result.data) {
        // API returns { success: true, msg: "Event deleted successfully" }
        console.log('✅ Event delete confirmed by API');
        const envelope = result.data as BackendEnvelope<unknown>;
        
        // Check if the envelope has the expected structure
        if (envelope.success) {
          return { success: true };
        } else {
          return { success: false, error: envelope.msg || 'Backend returned unsuccessful response' };
        }
      }
      return { success: false, error: result.error || 'Failed to delete event' };
    } catch (error) {
      console.error('❌ Delete event error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  // Get events filtered by child (client-side filter of /events)
  async getEventsByChild(childId: number): Promise<ApiResponse<Event[]>> {
    try {
      console.log('📋 Fetching events for child:', childId);
      
      const response = await this.getEvents();
      
      if (response.success && response.data) {
        const filteredEvents = response.data.events.filter((event: Event) => {
          if (typeof event.childId === 'number' && event.childId === childId) return true;
          if (Array.isArray(event.children)) {
            return event.children.some((c) => c.id === childId);
          }
          return false;
        });
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

  // Get events for a specific date range (client-side filter of /events)
  async getEventsByDateRange(startDate: string, endDate: string): Promise<ApiResponse<Event[]>> {
    try {
      console.log('📋 Fetching events for date range:', startDate, 'to', endDate);
      
      const response = await this.getEvents();
      
      if (response.success && response.data) {
        const filteredEvents = response.data.events.filter((event: Event) => {
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