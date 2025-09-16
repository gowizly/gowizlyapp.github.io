import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, Mail, RefreshCw, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const VerificationResendPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resendVerification, isLoading } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [isResending, setIsResending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isSuccess = searchParams.get('success') === 'true';

  const validateEmail = (email: string) => {
    if (!email.trim()) {
      return 'Email is required';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }
    
    setErrors({});
    setIsResending(true);
    
    try {
      const result = await resendVerification(email);
      if (result.success) {
        showSuccess('Verification Email Sent!', result.message || 'Please check your inbox for the verification link.');
        navigate('/login');
      } else {
        setErrors({ general: result.message || 'Failed to resend verification email. Please try again.' });
        showError('Failed to Resend Email', result.message || 'Failed to resend verification email. Please try again.');
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again later.';
      setErrors({ general: errorMessage });
      showError('Network Error', errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const handleInputChange = (value: string) => {
    setEmail(value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-purple-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Calendar className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          {isSuccess ? (
            <>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Account Created Successfully!</h1>
              <p className="text-gray-600">We've sent a verification link to your email</p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Email Verification</h1>
              <p className="text-gray-600">
                {email ? 'Resend verification email' : 'Enter your email to receive a verification link'}
              </p>
            </>
          )}
        </div>

        {isSuccess && email && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 text-center">
              Please check your email at <strong>{email}</strong> and click the verification link to activate your account.
              If you don't see the email, check your spam folder.
            </p>
          </div>
        )}

        {!isSuccess && email && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800 text-center">
              An account with <strong>{email}</strong> already exists but hasn't been verified yet.
              Click the button below to resend the verification email.
            </p>
          </div>
        )}

        {errors.general && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleResendVerification} className="space-y-6">
          <div>
            <label className="block text-sm text-left font-medium text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => handleInputChange(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your email address"
                disabled={isResending || isLoading}
              />
            </div>
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          <button
            type="submit"
            disabled={isResending || isLoading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isResending || isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                Sending Email...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Resend Verification Email
              </>
            )}
          </button>

          <div className="space-y-4">
            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center text-purple-600 hover:text-purple-700 font-semibold"
                disabled={isResending || isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Login
              </button>
            </div>
            
            <div className="text-center">
              <p className="text-gray-600 text-sm">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  className="text-purple-600 hover:text-purple-700 font-semibold"
                  disabled={isResending || isLoading}
                >
                  Sign Up
                </button>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerificationResendPage;
