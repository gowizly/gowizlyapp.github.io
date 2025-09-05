import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE_URL as BASE_URL } from '../config/environment';

const API_BASE_URL = `${BASE_URL}/api/auth`;

interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isEmailVerified: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  signup: (username: string, email: string, password: string, acceptTerms: boolean) => Promise<{ success: boolean; needsVerification?: boolean; message?: string }>;
  logout: () => void;
  verifyEmail: (token: string) => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  googleLogin: () => Promise<boolean>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setIsEmailVerified: (verified: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cookie utility functions
const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;secure;samesite=strict`;
};

const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const isAuthenticated = !!user && !!token && isEmailVerified;
  
  // Debug authentication state changes
  React.useEffect(() => {
    console.log('🔍 Auth state changed:', {
      hasUser: !!user,
      hasToken: !!token,
      isEmailVerified,
      isAuthenticated,
      userName: user?.name
    });
  }, [user, token, isEmailVerified, isAuthenticated]);

  // Fetch user profile from API
  const fetchUserProfile = async (token: string): Promise<User | null> => {
    try {
      console.log('👤 Fetching user profile with token:', token.substring(0, 20) + '...');
      
      const response = await fetch(`${API_BASE_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('👤 User profile response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to fetch user profile:', response.status, errorData);
        throw new Error(`Failed to fetch user profile: ${response.status}`);
      }

      const data = await response.json();
      console.log('👤 User profile data:', data);
      
      return {
        id: (data.id || data.userId || 'temp_id').toString(),
        name: data.username || data.name || data.email.split('@')[0],
        email: data.email,
        username: data.username
      };
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      return null;
    }
  };

  // Initialize auth state from cookies on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedToken = getCookie('auth_token');
        const savedUserData = getCookie('user_data');
        
        console.log('🔄 Initializing auth from cookies:', {
          hasToken: !!savedToken,
          hasUserData: !!savedUserData
        });
        
        if (savedToken && savedUserData) {
          try {
            // Try to restore from saved data first
            const userData = JSON.parse(savedUserData);
            setToken(savedToken);
            setUser(userData);
            setIsEmailVerified(true); // If backend issued token, email must be verified
            console.log('✅ Auth restored from cookies:', userData);
            
            // Optionally verify token in background
            fetchUserProfile(savedToken).catch(() => {
              console.log('⚠️ Background token verification failed, but keeping local session');
            });
          } catch (parseError) {
            console.error('❌ Failed to parse saved user data:', parseError);
            // If saved data is corrupted, try to fetch fresh data
            if (savedToken) {
              const userData = await fetchUserProfile(savedToken);
              if (userData) {
                setToken(savedToken);
                setUser(userData);
                setIsEmailVerified(true);
              } else {
                // Token is invalid, clear cookies
                deleteCookie('auth_token');
                deleteCookie('user_data');
              }
            }
          }
        } else if (savedToken) {
          // Only token exists, fetch user data
          console.log('🔄 Token exists but no user data, fetching from API...');
          const userData = await fetchUserProfile(savedToken);
          
          if (userData) {
            setToken(savedToken);
            setUser(userData);
            setIsEmailVerified(true);
          } else {
            // Token is invalid, clear cookies
            deleteCookie('auth_token');
            deleteCookie('user_data');
          }
        } else {
          console.log('ℹ️ No saved auth data found');
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        // Clear invalid cookies
        deleteCookie('auth_token');
        deleteCookie('user_data');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Save to cookies whenever user or token changes
  useEffect(() => {
    if (user && token) {
      setCookie('auth_token', token, 7);
      setCookie('user_data', JSON.stringify(user), 7);
      // No need to store email verification - if we have a token, email is verified
    } else {
      deleteCookie('auth_token');
      deleteCookie('user_data');
    }
  }, [user, token]);

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      console.log('🔐 Attempting login for:', email);
      
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('📡 Login response status:', response.status);
      
      const data = await response.json();
      console.log('📡 Login response data:', data);
      console.log('📡 Login response data keys:', Object.keys(data));
      console.log('📡 Looking for token in:', { 
        token: data.token, 
        accessToken: data.accessToken, 
        access_token: data.access_token,
        jwt: data.jwt,
        authToken: data.authToken
      });

      if (!response.ok) {
        console.error('❌ Login failed:', data.message || 'Unknown error');
        return false;
      }

      // Check if we have a token in the response (try multiple possible field names)
      const token = data.token || data.accessToken || data.access_token || data.jwt || data.authToken || data.bearer ||
                    data.data?.token || data.data?.accessToken || data.data?.access_token || data.data?.jwt;
      
      if (token) {
        console.log('🎯 Token received, attempting to get user data...');
        
        // First try to use user data from login response if available
        let userData = null;
        
        if (data.data?.user) {
          console.log('✅ Using user data from login response');
          userData = {
            id: data.data.user.id.toString(),
            name: data.data.user.username || data.data.user.email.split('@')[0],
            email: data.data.user.email,
            username: data.data.user.username
          };
        } else {
          console.log('🔄 Fetching user profile from /me endpoint...');
          userData = await fetchUserProfile(token);
        }
        
        // If still no user data, create from login response or email
        if (!userData) {
          console.log('⚠️ Creating user from basic login data...');
          userData = {
            id: data.userId?.toString() || data.id?.toString() || 'temp_id',
            name: data.username || email.split('@')[0],
            email: email,
            username: data.username || email.split('@')[0]
          };
        }
        
        console.log('✅ User data ready:', userData);
        setToken(token);
        setUser(userData);
        setIsEmailVerified(true); // Assume verified if login successful
        
        // Remember username if requested
        if (rememberMe) {
          setCookie('remembered_username', email, 30);
        } else {
          deleteCookie('remembered_username');
        }
        
        return true;
      } else {
        console.error('❌ No token in login response');
        console.log('🔧 Full response data for debugging:', JSON.stringify(data, null, 2));
        
        // Temporary fallback: if login is successful but no token, create a mock session
        if (response.ok) {
          console.log('⚠️ Login successful but no token, creating temporary session...');
          const mockToken = 'temp_session_' + Date.now();
          const userData = {
            id: 'temp_user',
            name: email.split('@')[0],
            email: email,
            username: email.split('@')[0]
          };
          
          setToken(mockToken);
          setUser(userData);
          setIsEmailVerified(true);
          
          if (rememberMe) {
            setCookie('remembered_username', email, 30);
          } else {
            deleteCookie('remembered_username');
          }
          
          return true;
        }
        
        return false;
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, email: string, password: string, acceptTerms: boolean): Promise<{ success: boolean; needsVerification?: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      
      if (!acceptTerms) {
        return { success: false, message: 'You must accept the terms and conditions' };
      }
      
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || 'Registration failed. Please try again.' };
      }

      return { 
        success: true, 
        needsVerification: true, 
        message: data.message || 'Account created! Please check your email for verification.' 
      };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: 'An error occurred during registration.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsEmailVerified(false);
    deleteCookie('auth_token');
    deleteCookie('user_data');
    console.log('✅ User logged out');
  };

  const verifyEmail = async (verificationToken: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/verify/${verificationToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Email verification failed:', data.message || 'Unknown error');
        return false;
      }

      setIsEmailVerified(true);
      return true;
    } catch (error) {
      console.error('Email verification error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const requestPasswordReset = async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Password reset request failed:', data.message || 'Unknown error');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Password reset request error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (resetToken: string, newPassword: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/reset-password/${resetToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Password reset failed:', data.message || 'Unknown error');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (): Promise<boolean> => {
    try {
      console.log('🔐 Initiating Google OAuth login...');
      
      // Redirect to Google OAuth endpoint
      const googleAuthUrl = `${API_BASE_URL}/google`;
      console.log('🔗 Redirecting to:', googleAuthUrl);
      
      window.location.href = googleAuthUrl;
      
      // Return true to indicate the redirect was initiated
      // The actual authentication will be handled by the callback
      return true;
    } catch (error) {
      console.error('❌ Google login error:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    isEmailVerified,
    login,
    signup,
    logout,
    verifyEmail,
    requestPasswordReset,
    resetPassword,
    googleLogin,
    setUser,
    setToken,
    setIsEmailVerified
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
