import React, { useState, useEffect } from 'react';
import { Calendar, Mail, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface EmailVerificationPageProps {
  email: string;
  onBackToLogin: () => void;
}

const EmailVerificationPage: React.FC<EmailVerificationPageProps> = ({ email, onBackToLogin }) => {
  const { verifyEmail, isLoading } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [verificationToken, setVerificationToken] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleVerification = async (token: string) => {
    try {
      const success = await verifyEmail(token);
      if (success) {
        setVerificationStatus('success');
      } else {
        setVerificationStatus('error');
        setErrorMessage('Invalid or expired verification link. Please request a new one.');
      }
    } catch (error) {
      setVerificationStatus('error');
      setErrorMessage('Verification failed. Please try again.');
    }
  };

  // Mock verification token from URL (in real app, this would come from email link)
  useEffect(() => {
    const handleVerificationFromURL = async (token: string) => {
      await handleVerification(token);
    };

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setVerificationToken(token);
      handleVerificationFromURL(token);
    }
  }, [handleVerification]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleManualVerification = async () => {
    if (!verificationToken.trim()) {
      setErrorMessage('Please enter a verification code');
      return;
    }
    await handleVerification(verificationToken);
  };

  const handleResendEmail = async () => {
    setResendCooldown(60); // 60 second cooldown
    // In real app, this would call an API to resend verification email
    console.log('Resending verification email to:', email);
  };

  const renderPendingState = () => (
    <div className="text-center">
      <Mail className="w-16 h-16 text-purple-600 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Check Your Email</h2>
      <p className="text-gray-600 mb-6">
        We've sent a verification link to <strong>{email}</strong>
      </p>
      <p className="text-sm text-gray-500 mb-8">
        Click the link in your email to verify your account. If you don't see the email, check your spam folder.
      </p>

      <div className="space-y-4">
        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600 mb-3">Or enter verification code manually:</p>
          <div className="flex space-x-2">
            <input
              type="text"
              value={verificationToken}
              onChange={(e) => setVerificationToken(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter verification code"
              disabled={isLoading}
            />
            <button
              onClick={handleManualVerification}
              disabled={isLoading || !verificationToken.trim()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verify'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-4 text-sm">
          <span className="text-gray-500">Didn't receive the email?</span>
          <button
            onClick={handleResendEmail}
            disabled={resendCooldown > 0}
            className="text-purple-600 hover:text-purple-700 font-semibold disabled:opacity-50"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Email'}
          </button>
        </div>

        <button
          onClick={onBackToLogin}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          Back to Login
        </button>
      </div>
    </div>
  );

  const renderSuccessState = () => (
    <div className="text-center">
      <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Email Verified!</h2>
      <p className="text-gray-600 mb-8">
        Your email has been successfully verified. You can now access your account.
      </p>
      <button
        onClick={onBackToLogin}
        className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
      >
        Continue to Dashboard
      </button>
    </div>
  );

  const renderErrorState = () => (
    <div className="text-center">
      <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Verification Failed</h2>
      <p className="text-gray-600 mb-6">{errorMessage}</p>
      <div className="space-y-3">
        <button
          onClick={() => setVerificationStatus('pending')}
          className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
        >
          Try Again
        </button>
        <button
          onClick={onBackToLogin}
          className="w-full text-gray-500 hover:text-gray-700"
        >
          Back to Login
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-purple-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Calendar className="w-12 h-12 text-purple-600 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-gray-800">Family Calendar</h1>
        </div>

        {verificationStatus === 'pending' && renderPendingState()}
        {verificationStatus === 'success' && renderSuccessState()}
        {verificationStatus === 'error' && renderErrorState()}
      </div>
    </div>
  );
};

export default EmailVerificationPage;
