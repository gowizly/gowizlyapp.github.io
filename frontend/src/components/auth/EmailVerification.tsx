import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle, Loader, Calendar, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface VerificationState {
  isLoading: boolean;
  success: boolean;
  error: string | null;
  userInfo: {
    username: string;
    email: string;
  } | null;
}

const EmailVerificationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { verifyEmail, resendVerification, isLoading } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [verificationState, setVerificationState] = useState<VerificationState>({
    isLoading: true,
    success: false,
    error: null,
    userInfo: null
  });

  const [isResending, setIsResending] = useState(false);

  // Verify email on component mount
  useEffect(() => {
    if (token) {
      handleVerifyEmail();
    } else {
      setVerificationState({
        isLoading: false,
        success: false,
        error: 'No verification token provided',
        userInfo: null
      });
    }
  }, [token]);

  const handleVerifyEmail = async () => {
    if (!token) return;
    
    try {
      console.log('📧 Verifying email with token:', token?.substring(0, 10) + '...');
      
      const success = await verifyEmail(token);

      if (success) {
        console.log('✅ Email verification successful');
        setVerificationState({
          isLoading: false,
          success: true,
          error: null,
          userInfo: {
            username: 'User', // AuthContext handles user data
            email: ''
          }
        });
        showSuccess(
          'Email Verified Successfully!',
          'Your account is now active. You can now log in.'
        );
      } else {
        console.error('❌ Email verification failed');
        const errorMessage = 'Email verification failed. The link may be invalid or expired.';
        setVerificationState({
          isLoading: false,
          success: false,
          error: errorMessage,
          userInfo: null
        });
        showError('Email Verification Failed', errorMessage);
      }
    } catch (error) {
      console.error('❌ Email verification error:', error);
      const errorMessage = 'Network error. Please try again later.';
      setVerificationState({
        isLoading: false,
        success: false,
        error: errorMessage,
        userInfo: null
      });
      showError('Network Error', errorMessage);
    }
  };

  const handleResendVerification = async () => {
    // You can get email from URL params if needed: ?email=user@example.com
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email') || verificationState.userInfo?.email;
    
    if (!email) {
      alert('Email address not available. Please request verification from the login page.');
      return;
    }

    setIsResending(true);
    
    try {
      console.log('📧 Resending verification email to:', email);
      
      const result = await resendVerification(email);

      if (result.success) {
        showSuccess('Verification Email Sent!', result.message || 'Please check your inbox for the verification link.');
      } else {
        const errorMessage = result.message || 'Failed to resend verification email';
        showError('Failed to Resend Email', errorMessage);
      }
    } catch (error) {
      console.error('❌ Resend verification error:', error);
      showError('Network Error', 'Network error. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  const handleContinueToLogin = () => {
    navigate('/login', {
      state: {
        message: verificationState.success 
          ? 'Email verified successfully! You can now log in to your account.'
          : undefined
      }
    });
  };

  // Loading state
  if (verificationState.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-purple-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <Calendar className="w-12 h-12 text-purple-600 mx-auto mb-2" />
            <h1 className="text-2xl font-bold text-gray-800">GoWizly Calendar</h1>
          </div>
          
          <div className="text-center">
            <Loader className="w-16 h-16 animate-spin text-purple-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifying Your Email</h2>
            <p className="text-gray-600">Please wait while we verify your email address...</p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (verificationState.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-purple-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <Calendar className="w-12 h-12 text-purple-600 mx-auto mb-2" />
            <h1 className="text-2xl font-bold text-gray-800">GoWizly Calendar</h1>
          </div>
          
          <div className="text-center">
            <div className="relative mb-6">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 border-4 border-green-200 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Email Verified!</h2>
            
            {verificationState.userInfo && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 font-medium">
                  Welcome, {verificationState.userInfo.username}!
                </p>
                <p className="text-green-600 text-sm mt-1">
                  {verificationState.userInfo.email}
                </p>
              </div>
            )}
            
            <p className="text-gray-600 mb-8">
              Your email has been successfully verified. You can now access all features of your GoWizly Family Calendar account.
            </p>
            
            <button
              onClick={handleContinueToLogin}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors transform hover:scale-105 duration-200 shadow-lg"
            >
              Continue to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-purple-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Calendar className="w-12 h-12 text-purple-600 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-gray-800">GoWizly Family Calendar</h1>
        </div>
        
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h2>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-medium">
              {verificationState.error}
            </p>
          </div>
          
          <p className="text-gray-600 mb-6">
            {verificationState.error?.includes('expired') || verificationState.error?.includes('invalid')
              ? 'Your verification link may have expired or is invalid. You can request a new verification email below.'
              : 'There was an issue verifying your email address. Please try again or contact support if the problem persists.'}
          </p>
          
          <div className="space-y-3">
            {(verificationState.error?.includes('expired') || verificationState.error?.includes('invalid')) && (
              <button
                onClick={handleResendVerification}
                disabled={isResending || isLoading}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isResending || isLoading ? (
                  <div className="flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Sending Email...
                  </div>
                ) : (
                  <>
                    <Mail className="w-4 h-4 inline mr-2" />
                    Resend Verification Email
                  </>
                )}
              </button>
            )}
            
            <button
              onClick={handleContinueToLogin}
              className="w-full bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;