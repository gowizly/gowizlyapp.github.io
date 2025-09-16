import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '../config/environment';
import axios from 'axios';
import { getCookie, setCookie, deleteCookie } from '../utils/cookies';

const AUTH_BASE_URL = `${API_BASE_URL}/api/auth`;

interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  address?: string;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  childrenCount?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isEmailVerified: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  signup: (username: string, email: string, password: string, acceptTerms: boolean) => Promise<{ success: boolean; needsVerification?: boolean; emailExists?: boolean; emailVerified?: boolean; message?: string; errors?: Record<string, string> }>;
  logout: () => void;
  verifyEmail: (token: string) => Promise<boolean>;
  resendVerification: (email: string) => Promise<{ success: boolean; message?: string }>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  validateResetToken: (token: string) => Promise<{ isValid: boolean; userEmail?: string; userName?: string; message?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  googleLogin: () => Promise<boolean>;
  handleOAuthCallback: (token: string) => Promise<boolean>;
  updateProfile: (username: string, address: string) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setIsEmailVerified: (verified: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

 // Fixed fetchUserProfile function in AuthContext
const fetchUserProfile = async (token: string): Promise<User | null> => {
  try {
    console.log('👤 Fetching user profile with token:', token.substring(0, 20) + '...');
    console.log("API_BASE_URL is:", AUTH_BASE_URL);
    
    const response = await axios.get(`${AUTH_BASE_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('👤 User profile response status:', response.status);
    console.log("Full response data:", response.data);

    if (!response.data || !response.data.success) {
      console.error('❌ Failed to fetch user profile:', response.status, response.data);
      throw new Error(`Failed to fetch user profile: ${response.status}`);
    }

    // Backend returns: { success: true, msg: "...", data: { user: {...} } }
    const userData = response.data.data.user;
    console.log('👤 User profile data:', userData);
    
    return {
      id: userData.id.toString(),
      name: userData.username || userData.name || userData.email.split('@')[0],
      email: userData.email,
      username: userData.username,
      address: userData.address || '',
      isVerified: userData.isVerified,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
      childrenCount: userData.childrenCount || 0
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

  // Save to cookies whenever user or token changes (but only after initialization)
  useEffect(() => {
    // Don't delete cookies during initialization loading
    if (isLoading) return;
    
    if (user && token) {
      setCookie('auth_token', token, 7);
      setCookie('user_data', JSON.stringify(user), 7);
      console.log('✅ Auth cookies saved successfully');
    } else {
      // Only delete cookies if we're explicitly logging out or auth failed
      // Don't delete during normal initialization
      const shouldDeleteCookies = !isLoading && (user === null || token === null);
      if (shouldDeleteCookies) {
        console.log('🗑️ Clearing auth cookies due to logout/auth failure');
        deleteCookie('auth_token');
        deleteCookie('user_data');
      }
    }
  }, [user, token, isLoading]);

  // Fixed login function in AuthContext
const login = async (email: string, password: string, rememberMe: boolean = false): Promise<boolean> => {
  try {
    setIsLoading(true);
    
    console.log('🔐 Attempting login for:', email);
    
    const response = await axios.post(`${AUTH_BASE_URL}/login`, 
      { email, password },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('📡 Login response status:', response.status);
    
    const data = response.data;
    console.log('📡 Login response data:', data);

    if (!data || !data.success) {
      console.error('❌ Login failed:', data?.msg || 'Unknown error');
      return false;
    }

    // Extract token from response (backend sends token in data.data.token)
    const token = data.data?.token;
    
    if (token) {
      console.log('🎯 Token received, setting up user data...');
      
      // Extract user data from login response
      let userData = null;
      
      if (data.data?.user) {
        console.log('✅ Using user data from login response');
        userData = {
          id: data.data.user.id.toString(),
          name: data.data.user.username || data.data.user.email.split('@')[0],
          email: data.data.user.email,
          username: data.data.user.username,
          address: data.data.user.address,
          isVerified: data.data.user.isVerified,
          createdAt: data.data.user.createdAt,
          updatedAt: data.data.user.updatedAt,
          childrenCount: data.data.user.childrenCount || 0
        };
      } else {
        console.log('🔄 Fetching user profile from /me endpoint...');
        userData = await fetchUserProfile(token);
      }
      
      // If still no user data, create minimal user from email
      if (!userData) {
        console.log('⚠️ Creating minimal user data from email...');
        userData = {
          id: 'temp_id',
          name: email.split('@')[0],
          email: email,
          username: email.split('@')[0],
          isVerified: true // Assume verified if login successful
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
      return false;
    }
  } catch (error: any) {
    console.error('❌ Login error:', error);
    
    // Handle specific error responses
    if (error.response?.status === 401) {
      console.error('❌ Invalid credentials');
    } else if (error.response?.data?.msg) {
      console.error('❌ Login failed:', error.response.data.msg);
    }
    
    return false;
  } finally {
    setIsLoading(false);
  }
};

  const signup = async (username: string, email: string, password: string, acceptTerms: boolean): Promise<{ success: boolean; needsVerification?: boolean; emailExists?: boolean; emailVerified?: boolean; message?: string; errors?: Record<string, string> }> => {
    try {
      setIsLoading(true);
      
      if (!acceptTerms) {
        return { success: false, message: 'You must accept the terms and conditions' };
      }
      
      const response = await axios.post(`${AUTH_BASE_URL}/register`, 
        { username, email, password },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data;

      if (!data || !data.success) {
        return { success: false, message: data?.msg || data?.message || 'Registration failed. Please try again.' };
      }

      return { 
        success: true, 
        needsVerification: true, 
        message: data.msg || data.message || 'Account created! Please check your email for verification.' 
      };
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        const errorMsg = errorData?.errorMsg || errorData?.message || errorData?.msg;
        
        // Check for validation errors
        if (errorData?.errors && typeof errorData.errors === 'object') {
          return { 
            success: false, 
            message: errorMsg || 'Please fix the validation errors below.',
            errors: errorData.errors 
          };
        }
        
        // Check if it's an email already exists error
        if (errorMsg && (
          errorMsg.toLowerCase().includes('email already') || 
          errorMsg.toLowerCase().includes('already registered') ||
          errorMsg.toLowerCase().includes('email exists')
        )) {
          // Backend now explicitly sends isVerified and needsVerification flags
          if (errorData?.isVerified === false && errorData?.needsVerification === true) {
            return { 
              success: false, 
              emailExists: true, 
              emailVerified: false,
              message: errorData.msg || 'This email is already registered but not verified. Would you like us to resend the verification email?' 
            };
          } else if (errorData?.isVerified === true) {
            return { 
              success: false, 
              emailExists: true,
              emailVerified: true,
              message: errorData.msg || 'This email is already registered and verified. Please login instead.' 
            };
          }
          // Fallback for older backend responses
          return { 
            success: false, 
            emailExists: true,
            emailVerified: true,
            message: errorData.msg || 'This email is already registered. Please login instead.' 
          };
        }
        
        // Check for username already exists
        if (errorMsg && (
          errorMsg.toLowerCase().includes('username already') || 
          errorMsg.toLowerCase().includes('username exists')
        )) {
          return { 
            success: false, 
            message: errorMsg,
            errors: { username: errorMsg }
          };
        }
        
        return { success: false, message: errorMsg || 'Registration failed. Please try again.' };
      }
      
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

  // Fixed updateProfile function in AuthContext
const updateProfile = async (username: string, address: string): Promise<boolean> => {
  try {
    setIsLoading(true);
    console.log('🔄 Updating user profile...');

    if (!token) {
      console.error('❌ No authentication token available');
      return false;
    }

    const response = await axios.patch(`${AUTH_BASE_URL}/profile`, {
      username,
      address
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    console.log('📡 Profile update response status:', response.status);
    
    if (!response.data || !response.data.success) {
      console.error('❌ Profile update failed:', response.data?.msg || 'Unknown error');
      return false;
    }

    const data = response.data;
    console.log('✅ Profile updated successfully', data);
    
    // Backend returns: { success: true, msg: "Profile updated successfully", data: { user: {...} } }
    if (data.data?.user && user) {
      const updatedUser = {
        ...user,
        id: data.data.user.id.toString(),
        name: data.data.user.username || user.name,
        email: data.data.user.email,
        username: data.data.user.username,
        address: data.data.user.address || '',
        isVerified: data.data.user.isVerified,
        createdAt: data.data.user.createdAt,
        updatedAt: data.data.user.updatedAt,
        childrenCount: data.data.user.childrenCount || 0
      } as User;
      
      setUser(updatedUser);
      
      // Update cookie with new user data
      setCookie('user_data', JSON.stringify(updatedUser), 7);
    }
    
    return true;
  } catch (error: any) {
    console.error('❌ Error updating profile:', error);
    
    if (error.response?.status === 401) {
      console.log('🔓 Authentication failed during profile update');
      logout();
    }
    
    return false;
  } finally {
    setIsLoading(false);
  }
};

  const deleteAccount = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('🗑️ Deleting user account...');

      if (!token) {
        console.error('❌ No authentication token available');
        return false;
      }

      const response = await axios.delete(`${AUTH_BASE_URL}/account`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      console.log('📡 Account deletion response status:', response.status);
      const data = response.data;

      if (!data || !data.success) {
        console.error('❌ Account deletion failed:', data?.msg || 'Unknown error');
        return false;
      }

      console.log('✅ Account deleted successfully');
      
      // Logout user after successful account deletion
      logout();
      
      return true;
    } catch (error: any) {
      console.error('❌ Error deleting account:', error);
      
      if (error.response?.status === 401) {
        console.log('🔓 Authentication failed during account deletion');
        logout();
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (verificationToken: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await axios.get(`${AUTH_BASE_URL}/verify/${verificationToken}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = response.data;

      if (!data || !data.success) {
        console.error('Email verification failed:', data?.msg || data?.message || 'Unknown error');
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

  const resendVerification = async (email: string): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      
      console.log('📧 Resending verification email to:', email);
      
      const response = await axios.post(`${AUTH_BASE_URL}/resend-verification`, 
        { email },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data;

      if (!data || !data.success) {
        return { 
          success: false, 
          message: data?.msg || data?.message || 'Failed to resend verification email. Please try again.' 
        };
      }

      return { 
        success: true, 
        message: data.msg || 'Verification email sent successfully!' 
      };
    } catch (error: any) {
      console.error('Resend verification error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        return { success: false, message: 'User not found. Please check the email address.' };
      } else if (error.response?.status === 400) {
        return { success: false, message: error.response.data?.msg || 'Email is already verified.' };
      } else {
        return { success: false, message: 'Failed to resend verification email. Please try again.' };
      }
    } finally {
      setIsLoading(false);
    }
  };

  const requestPasswordReset = async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await axios.post(`${AUTH_BASE_URL}/forgot-password`, 
        { email },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data;

      if (!data || !data.success) {
        console.error('Password reset request failed:', data?.msg || data?.message || 'Unknown error');
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

  const validateResetToken = async (resetToken: string): Promise<{ isValid: boolean; userEmail?: string; userName?: string; message?: string }> => {
    try {
      setIsLoading(true);
      
      const response = await axios.get(`${AUTH_BASE_URL}/reset-password/${resetToken}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = response.data;

      if (!data || !data.success) {
        return { 
          isValid: false, 
          message: data?.msg || 'Invalid or expired reset token' 
        };
      }

      return { 
        isValid: true, 
        userEmail: data.data?.email,
        userName: data.data?.username,
        message: data.msg 
      };
    } catch (error) {
      console.error('Token validation error:', error);
      return { 
        isValid: false, 
        message: 'Failed to validate reset token' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (resetToken: string, newPassword: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await axios.post(`${AUTH_BASE_URL}/reset-password/${resetToken}`, 
        { password: newPassword },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data;

      if (!data || !data.success) {
        console.error('Password reset failed:', data?.msg || data?.message || 'Unknown error');
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
      const googleAuthUrl = `${AUTH_BASE_URL}/google`;
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

  const handleOAuthCallback = async (oauthToken: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('🔐 Processing OAuth callback with token:', oauthToken.substring(0, 20) + '...');
      
      // Set the token first
      setToken(oauthToken);
      setIsEmailVerified(true); // OAuth users are verified by default
      
      // Fetch user data with the provided token
      const userData = await fetchUserProfile(oauthToken);
      
      if (userData) {
        console.log('✅ OAuth authentication successful');
        setUser(userData);
        return true;
      } else {
        console.error('❌ Failed to fetch user data for OAuth token');
        // Clear the token if user data fetch failed
        setToken(null);
        setIsEmailVerified(false);
        return false;
      }
    } catch (error) {
      console.error('❌ OAuth callback error:', error);
      // Clear auth state on error
      setToken(null);
      setUser(null);
      setIsEmailVerified(false);
      return false;
    } finally {
      setIsLoading(false);
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
    resendVerification,
    requestPasswordReset,
    validateResetToken,
    resetPassword,
    googleLogin,
    handleOAuthCallback,
    updateProfile,
    deleteAccount,
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
