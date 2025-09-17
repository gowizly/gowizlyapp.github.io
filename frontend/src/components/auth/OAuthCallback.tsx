import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config/environment';
import axios from 'axios';

const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser, setToken, setIsEmailVerified } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  // Direct OAuth handling function
  const handleOAuthCallback = async (token: string): Promise<boolean> => {
    try {
      console.log('🔐 Processing Google OAuth callback...');
      
      // Fetch user data with the provided token
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('👤 User profile response:', response.status);

      if (!response.data || !response.data.success) {
        console.error('❌ Failed to fetch user profile:', response.status, response.data);
        return false;
      }

      const userData = response.data.data.user;
      console.log('👤 User profile data:', userData);
      
      // Set auth state using AuthContext
      const user = {
        id: userData.id.toString(),
        name: userData.username || userData.name || userData.email.split('@')[0],
        email: userData.email,
        username: userData.username,
        address: userData.address || '',
        isVerified: userData.isVerified,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        childrenCount: userData.children ? userData.children.length : (userData.childrenCount || 0)
      };

      setUser(user);
      setToken(token);
      setIsEmailVerified(true); // OAuth users are verified by default
      
      console.log('✅ Google OAuth authentication successful');
      return true;
    } catch (error: any) {
      console.error('❌ Error in OAuth callback:', error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      
      return false;
    }
  };

  useEffect(() => {
    const processCallback = async () => {
      try {
        const token = searchParams.get('token');
        const error = searchParams.get('error');
        const currentUrl = window.location.href;

        console.log('🔐 OAuth callback received:', { 
          hasToken: !!token, 
          error, 
          currentUrl,
          searchParams: Object.fromEntries(searchParams.entries())
        });

        if (error) {
          console.error('❌ OAuth error:', error);
          setStatus('error');
          setMessage(getErrorMessage(error));
          return;
        }

        if (!token) {
          console.error('❌ No token in OAuth callback');
          setStatus('error');
          setMessage('No authentication token received');
          return;
        }

        // Process OAuth callback directly
        console.log('🔄 Processing OAuth callback...');
        const success = await handleOAuthCallback(token);

        if (success) {
          console.log('✅ OAuth authentication successful');
          setStatus('success');
          setMessage('Authentication successful! Redirecting to dashboard...');

          // Redirect to home page after success
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 2000);
        } else {
          console.error('❌ OAuth callback processing failed');
          setStatus('error');
          setMessage('Failed to complete authentication');
        }

      } catch (error) {
        console.error('❌ OAuth callback error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred during authentication');
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  const getErrorMessage = (error: string): string => {
    switch (error) {
      case 'no_user_data':
        return 'Authentication failed: No user data received from Google';
      case 'oauth_failed':
        return 'Google authentication was cancelled or failed';
      case 'oauth_callback_failed':
        return 'Authentication processing failed on our server';
      default:
        return `Authentication failed: ${error}`;
    }
  };

  const handleRetry = () => {
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        {status === 'loading' && (
          <>
            <Loader className="w-16 h-16 animate-spin text-purple-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Processing Authentication</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Welcome!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="animate-pulse">
              <div className="h-2 bg-purple-200 rounded-full">
                <div className="h-2 bg-purple-600 rounded-full animate-pulse"></div>
              </div>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Authentication Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back to Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;
