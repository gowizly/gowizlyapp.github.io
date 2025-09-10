import { getCookie } from '../utils/cookies';
import { isValidToken } from '../utils/authUtils';
import { API_BASE_URL } from '../config/environment';
import { Event } from './eventApi';
import axios, { AxiosResponse } from 'axios';

export interface Child {
  id?: number;
  name: string;
  gradeLevel: string;
  schoolName: string;
  birthDate: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Backend envelope
interface BackendEnvelope<T> {
  success: boolean;
  msg?: string;
  data: T;
}

class ChildApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/children`;
    console.log('🤖 Child API Service initialized with base URL:', this.baseUrl);
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
      console.log(`📡 API Response [${response.status}] Content-Type: ${contentType}`);

      if (typeof data === 'string' && data.includes('<!doctype html>')) {
        console.error('🚨 Received HTML instead of API data - endpoint likely not implemented');
        return {
          success: false,
          error: 'API endpoint not found - received HTML page instead of JSON data. Please check if your backend server has the children endpoints implemented.',
        };
      }

      if (response.status < 200 || response.status >= 300) {
        let errorMessage = `HTTP Error: ${response.status}`;
        
        // Handle 401 Unauthorized specifically
        if (response.status === 401) {
          console.error('🚨 Authentication failed - invalid or expired token');
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (typeof data === 'object' && data !== null) {
          const obj = data as Record<string, unknown>;
          const msg = (obj.msg as string) || (obj.message as string) || (obj.error as string) || undefined;
          const errors = obj.errors as unknown;
          if (msg && errors) {
            console.error('🚨 Validation Error Details:', errors);
            errorMessage = `${msg}: ${JSON.stringify(errors)}`;
          } else {
            errorMessage = msg || errorMessage;
          }
        } else if (typeof data === 'string') {
          errorMessage = data || errorMessage;
        }
        return { success: false, error: errorMessage };
      }

      return { success: true, data: data as T };
    } catch (error) {
      console.error('📡 API Response parsing error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to parse response' };
    }
  }

  async createChild(childData: Omit<Child, 'id'>): Promise<ApiResponse<Child>> {
    try {
      console.log('🆕 Creating child:', childData);
      console.log('📤 Request payload:', JSON.stringify(childData, null, 2));
      console.log('📤 Request headers:', this.getAuthHeaders());
      
      const response = await axios.post<BackendEnvelope<{ child: Child }>>(
        `${this.baseUrl}`,
        childData,
        { headers: this.getAuthHeaders() }
      );

      const result = await this.handleResponse<BackendEnvelope<{ child: Child }>>(response);
      
      if (result.success && result.data) {
        // Your API returns { success: true, msg: "...", data: { child: {...} } }
        if ((result.data as BackendEnvelope<{ child: Child }>).data?.child) {
          console.log('✅ Extracting child from create response');
          return { success: true, data: (result.data as BackendEnvelope<{ child: Child }>).data.child };
        }
        // Unexpected success shape
        return { success: false, error: 'Unexpected API response structure for create child' };
      }
      return { success: false, error: result.error || 'Failed to create child' };
    } catch (error) {
      console.error('❌ Create child error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  async getChildren(): Promise<ApiResponse<Child[]>> {
    try {
      console.log('📋 Fetching children...');
      
      const response = await axios.get<BackendEnvelope<{ children: Child[]; count?: number }>>(
        `${this.baseUrl}`,
        { headers: this.getAuthHeaders() }
      );

      const result = await this.handleResponse<BackendEnvelope<{ children: Child[]; count?: number }>>(response);
      
      if (result.success && result.data) {
        // Your API returns { success: true, data: { children: [...] } }
        const envelope = result.data as BackendEnvelope<{ children: Child[]; count?: number }>;
        
        // Check if the envelope has the expected structure
        if (envelope.success && envelope.data?.children) {
          console.log('✅ Extracting children array from API response');
          return { success: true, data: envelope.data.children };
        } else {
          return { success: false, error: envelope.msg || 'Backend returned unsuccessful response' };
        }
      }
      return { success: false, error: result.error || 'Failed to fetch children' };
    } catch (error) {
      console.error('❌ Get children error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  async updateChild(childId: number, childData: Partial<Child>): Promise<ApiResponse<Child>> {
    try {
      console.log('✏️ Updating child:', childId, childData);
      
      const response = await axios.patch<BackendEnvelope<{ child: Child }>>(
        `${this.baseUrl}/${childId}`,
        childData,
        { headers: this.getAuthHeaders() }
      );

      const result = await this.handleResponse<BackendEnvelope<{ child: Child }>>(response);
      
      if (result.success && result.data) {
        // Your API returns { success: true, msg: "...", data: { child: {...} } }
        if ((result.data as BackendEnvelope<{ child: Child }>).data?.child) {
          console.log('✅ Extracting child from update response');
          return { success: true, data: (result.data as BackendEnvelope<{ child: Child }>).data.child };
        }
        return { success: false, error: 'Unexpected API response structure for updateChild' };
      }
      return { success: false, error: result.error || 'Failed to update child' };
    } catch (error) {
      console.error('❌ Update child error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  async deleteChild(childId: number): Promise<ApiResponse<void>> {
    try {
      console.log('🗑️ Deleting child:', childId);
      
      const response = await axios.delete<BackendEnvelope<unknown>>(
        `${this.baseUrl}/${childId}`,
        { headers: this.getAuthHeaders() }
      );

      const result = await this.handleResponse<BackendEnvelope<unknown>>(response);
      
      if (result.success) {
        // Your API returns { success: true, msg: "Child deleted successfully" }
        console.log('✅ Child delete confirmed by API');
        return { success: true };
      }
      return { success: false, error: result.error || 'Failed to delete child' };
    } catch (error) {
      console.error('❌ Delete child error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  // Test API connection
  async testConnection(): Promise<ApiResponse<string>> {
    try {
      console.log('🔗 Testing API connection...');
      
      const response = await axios.get(`${this.baseUrl}`, { headers: this.getAuthHeaders() });

      if (response.status === 404) {
        return {
          success: false,
          error: `Children API endpoint not found. Tried: ${this.baseUrl}. Please check if your backend server is running and has the children endpoints implemented.`
        };
      }
      return {
        success: true,
        data: `API connection successful. Using endpoint: ${this.baseUrl}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Cannot connect to API server at ${this.baseUrl}. Please ensure your backend server is running.`
      };
    }
  }

  async eventByChildID(childId: number): Promise<ApiResponse<Event[]>> {
    try {
      console.log('📋 Fetching events for child:', childId);
      
      const response = await axios.get<BackendEnvelope<{ child: { id: number; name: string }; events: Event[]; pagination?: unknown; filters?: unknown }>>(
        `${this.baseUrl}/${childId}/events`,
        { headers: this.getAuthHeaders() }
      );
  
      const result = await this.handleResponse<BackendEnvelope<{ child: { id: number; name: string }; events: Event[] }>>(response);
      
      if (result.success && result.data) {
        // Your API returns { success: true, msg: "...", data: { child: {...}, events: [...], pagination: {...}, filters: {...} } }
        if ((result.data as BackendEnvelope<{ events: Event[] }>).data?.events) {
          console.log('✅ Extracting events array from API response');
          return { success: true, data: (result.data as BackendEnvelope<{ events: Event[] }>).data.events };
        }
        return { success: true, data: [] };
      }
      return { success: false, error: result.error || 'Failed to fetch events for child' };
    } catch (error) {
      console.error('❌ Get events by child error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }
}

export const childApiService = new ChildApiService();
