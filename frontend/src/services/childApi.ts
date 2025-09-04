import { getCookie } from '../utils/cookies';
import { API_BASE_URL } from '../config/environment';

// API Configuration
const POSSIBLE_ENDPOINTS = [
  '/api/children/',     // Most common API format
  '/api/children',      // Without trailing slash
  '/children/',         // Original format from user spec
  '/children',          // Without trailing slash
];

console.log('🔧 Child API Service initialized with base URL:', API_BASE_URL);

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

class ChildApiService {
  private correctEndpoint: string | null = null;

  private getAuthHeaders(): Record<string, string> {
    const token = getCookie('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  // Auto-detect the correct API endpoint
  private async findCorrectEndpoint(): Promise<string> {
    if (this.correctEndpoint) {
      return this.correctEndpoint;
    }

    for (const endpoint of POSSIBLE_ENDPOINTS) {
      try {
        console.log(`🔍 Testing endpoint: ${API_BASE_URL}${endpoint}`);
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'GET',
          headers: this.getAuthHeaders(),
        });
        
        // If we get any response other than 404, this endpoint exists
        if (response.status !== 404) {
          console.log(`✅ Found working endpoint: ${endpoint}`);
          this.correctEndpoint = endpoint;
          return endpoint;
        }
      } catch (error) {
        console.log(`❌ Endpoint ${endpoint} failed:`, error);
        continue;
      }
    }
    
    // Default to first endpoint if none work
    console.log(`⚠️ No working endpoint found, using default: ${POSSIBLE_ENDPOINTS[0]}`);
    this.correctEndpoint = POSSIBLE_ENDPOINTS[0];
    return this.correctEndpoint;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      // Handle different response types
      let data;
      const contentType = response.headers.get('content-type');
      
      console.log(`📡 API Response [${response.status}] Content-Type: ${contentType}`);
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      // Check if we got HTML instead of API data (common when endpoint doesn't exist)
      if (typeof data === 'string' && data.includes('<!doctype html>')) {
        console.error('🚨 Received HTML instead of API data - endpoint likely not implemented');
        return {
          success: false,
          error: 'API endpoint not found - received HTML page instead of JSON data. Please check if your backend server has the children endpoints implemented.',
        };
      }
      
      console.log(`📡 API Response [${response.status}]:`, data);
      
      if (!response.ok) {
        let errorMessage = `HTTP Error: ${response.status}`;
        
        if (typeof data === 'object') {
          // Handle validation errors specifically
          if (data.msg && data.errors) {
            console.error('🚨 Validation Error Details:', data.errors);
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
      console.error('📡 API Response parsing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse response',
      };
    }
  }

  async createChild(childData: Omit<Child, 'id'>): Promise<ApiResponse<Child>> {
    try {
      console.log('🆕 Creating child:', childData);
      console.log('📤 Request payload:', JSON.stringify(childData, null, 2));
      console.log('📤 Request headers:', this.getAuthHeaders());
      
      const endpoint = await this.findCorrectEndpoint();
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(childData),
      });

      const result = await this.handleResponse<any>(response);
      
      if (result.success && result.data) {
        // Your API returns { success: true, msg: "...", data: { child: {...} } }
        if (result.data.data && result.data.data.child) {
          console.log('✅ Extracting child from create response');
          return {
            success: true,
            data: result.data.data.child
          };
        }
        // Fallback
        return {
          success: true,
          data: result.data
        };
      }
      
      return result;
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
      const endpoint = await this.findCorrectEndpoint();
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await this.handleResponse<any>(response);
      
      if (result.success && result.data) {
        // Your API returns { success: true, data: { children: [...] } }
        if (result.data.data && result.data.data.children) {
          console.log('✅ Extracting children array from API response');
          return {
            success: true,
            data: result.data.data.children
          };
        }
        // Fallback if structure is different
        return {
          success: true,
          data: Array.isArray(result.data) ? result.data : []
        };
      }
      
      return result;
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
      const endpoint = await this.findCorrectEndpoint();
      // Remove trailing slash for individual resource
      const baseEndpoint = endpoint.replace(/\/$/, '');
      
      const response = await fetch(`${API_BASE_URL}${baseEndpoint}/${childId}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(childData),
      });

      const result = await this.handleResponse<any>(response);
      
      if (result.success && result.data) {
        // Your API returns { success: true, msg: "...", data: { child: {...} } }
        if (result.data.data && result.data.data.child) {
          console.log('✅ Extracting child from update response');
          return {
            success: true,
            data: result.data.data.child
          };
        }
        // Fallback
        return {
          success: true,
          data: result.data
        };
      }
      
      return result;
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
      const endpoint = await this.findCorrectEndpoint();
      // Remove trailing slash for individual resource
      const baseEndpoint = endpoint.replace(/\/$/, '');
      
      const response = await fetch(`${API_BASE_URL}${baseEndpoint}/${childId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const result = await this.handleResponse<any>(response);
      
      if (result.success) {
        // Your API returns { success: true, msg: "Child deleted successfully" }
        console.log('✅ Child delete confirmed by API');
        return {
          success: true,
          data: undefined
        };
      }
      
      return result;
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
      const endpoint = await this.findCorrectEndpoint();
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (response.status === 404) {
        return {
          success: false,
          error: `Children API endpoint not found. Tried: ${POSSIBLE_ENDPOINTS.join(', ')}. Please check if your backend server is running and has the children endpoints implemented.`
        };
      }

      return {
        success: true,
        data: `API connection successful. Using endpoint: ${endpoint}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Cannot connect to API server at ${API_BASE_URL}. Please ensure your backend server is running.`
      };
    }
  }
}

export const childApiService = new ChildApiService();
