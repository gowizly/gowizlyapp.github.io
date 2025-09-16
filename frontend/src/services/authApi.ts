import { API_BASE_URL } from '../config/environment';
import axios from 'axios';
class AuthApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/auth`;
    console.log('🔧 Auth API Service initialized with base URL:', this.baseUrl);
  }
  
  // API utility functions
  private apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${this.baseUrl}${endpoint}`;
    const defaultHeaders: Record<string, string> = { 'Content-Type': 'application/json' };

    const headers: Record<string, string> = {
      ...defaultHeaders,
      ...(options.headers as Record<string, string> | undefined),
    };

    const method = (options.method || 'GET').toUpperCase();
    const data = (options as unknown as { body?: unknown }).body;

    try {
      const response = await axios.request({
        url,
        method,
        headers,
        // Only attach data for non-GET methods
        ...(method !== 'GET' ? { data } : {}),
      });

      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        data: response.data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  };
  
  private apiRequestWithAuth = async (endpoint: string, token: string, options: RequestInit = {}) => {
    return this.apiRequest(endpoint, {
      ...options,
      headers: {
        ...(options.headers as Record<string, string> | undefined),
        'Authorization': `Bearer ${token}`,
      },
    });
  };
}


export const authApiService = new AuthApiService();
