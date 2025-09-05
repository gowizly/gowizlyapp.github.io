import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/environment';

const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken, setUser, setIsEmailVerified } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleCallback = async () => {
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

        // Validate token with backend and get user data
        console.log('🔄 Validating OAuth token...');
        const meEndpoint = `${API_BASE_URL}/api/auth/me`;
        console.log('🌐 Making request to:', meEndpoint);
        
        const response = await fetch(meEndpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('📡 Token validation response:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Token validation failed:', {
            status: response.status,
            statusText: response.statusText,
            errorText: errorText.substring(0, 200)
          });
          setStatus('error');
          setMessage('Authentication token validation failed');
          return;
        }

        const responseText = await response.text();
        console.log('📡 Raw response:', responseText.substring(0, 200));
        
        let userData;
        try {
          userData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError);
          console.error('❌ Response was:', responseText.substring(0, 500));
          setStatus('error');
          setMessage('Invalid response format from server');
          return;
        }
        console.log('✅ OAuth user data received:', userData);

        // Set authentication state
        console.log('🔄 Setting OAuth authentication state...');
        setIsEmailVerified(true); // Set this first
        setToken(token);
        setUser({
          id: (userData.id || userData.userId || 'temp_id').toString(),
          name: userData.username || userData.name || userData.email?.split('@')[0] || 'User',
          email: userData.email,
          username: userData.username
        });
        console.log('✅ OAuth authentication state set');

        setStatus('success');
        setMessage('Authentication successful! Redirecting...');

        // Redirect to home page after success
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);

      } catch (error) {
        console.error('❌ OAuth callback error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred during authentication');
      }
    };

    handleCallback();
  }, [searchParams, navigate, setToken, setUser, setIsEmailVerified]);

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
