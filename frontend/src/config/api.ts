import { API_BASE_URL } from './environment';

// API Configuration
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  AUTH_ENDPOINTS: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    VERIFY_EMAIL: '/api/auth/verify',
    RESET_PASSWORD: '/api/auth/reset-password',
    ME: '/api/auth/me'
  }
};

// API utility functions
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, mergedOptions);
    const data = await response.json();
    
    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

export const apiRequestWithAuth = async (endpoint: string, token: string, options: RequestInit = {}) => {
  return apiRequest(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
};
