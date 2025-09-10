import { deleteCookie } from './cookies';

/**
 * Check if an error is an authentication failure
 */
export const isAuthError = (error: string): boolean => {
  return error.includes('Authentication failed') || 
         error.includes('401') || 
         error.includes('Unauthorized') ||
         error.includes('Please log in again');
};

/**
 * Handle authentication failures by clearing tokens and potentially redirecting
 */
export const handleAuthFailure = (error: string): void => {
  if (isAuthError(error)) {
    console.warn('🚨 Authentication failure detected, clearing tokens');
    deleteCookie('auth_token');
    deleteCookie('user_data');
    
    // Optional: trigger a page reload to force re-authentication
    // This will be handled by AuthContext which will detect missing token
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }
};

/**
 * Validate that a token exists and has a valid format
 */
export const isValidToken = (token: string | null): boolean => {
  if (!token) return false;
  
  // Basic token validation - should not be temporary/mock tokens
  if (token.startsWith('temp_')) return false;
  
  // Should have some reasonable length
  if (token.length < 10) return false;
  
  return true;
};
