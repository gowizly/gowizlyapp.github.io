import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, Loader } from 'lucide-react';
import { API_BASE_URL } from '../config/environment';
import { useToast } from '../contexts/ToastContext';

interface ForgotPasswordState {
  email: string;
  isSubmitting: boolean;
  success: boolean;
  error: string;
}

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState<ForgotPasswordState>({
    email: '',
    isSubmitting: false,
    success: false,
    error: ''
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous error
    setFormData(prev => ({ ...prev, error: '' }));
    
    // Validate email
    if (!formData.email) {
      setFormData(prev => ({ ...prev, error: 'Email is required' }));
      return;
    }
    
    if (!validateEmail(formData.email)) {
      setFormData(prev => ({ ...prev, error: 'Please enter a valid email address' }));
      return;
    }

    setFormData(prev => ({ ...prev, isSubmitting: true }));

    try {
      console.log('📧 Sending forgot password request for:', formData.email);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email
        })
      });

      const data = await response.json();
      console.log('📧 Forgot password response:', data);

      if (response.ok && data.success) {
        console.log('✅ Forgot password request successful');
        setFormData(prev => ({
          ...prev,
          isSubmitting: false,
          success: true,
          error: ''
        }));
        showSuccess(
          'Reset Email Sent!',
          'Please check your email for password reset instructions.'
        );
      } else {
        console.error('❌ Forgot password request failed:', data.msg);
        const errorMessage = data.msg || 'Failed to send reset email';
        setFormData(prev => ({
          ...prev,
          isSubmitting: false,
          error: errorMessage
        }));
        showError('Password Reset Failed', errorMessage);
      }
    } catch (error) {
      console.error('❌ Forgot password error:', error);
      const errorMessage = 'Network error. Please try again.';
      setFormData(prev => ({
        ...prev,
        isSubmitting: false,
        error: errorMessage
      }));
      showError('Network Error', errorMessage);
    }
  };

  const handleInputChange = (value: string) => {
    setFormData(prev => ({ ...prev, email: value, error: '' }));
  };

  // Success state
  if (formData.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Check Your Email</h2>
          <p className="text-gray-600 mb-6">
            If an account with this email exists, you will receive a password reset link within a few minutes.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Back to Login
            </button>
            <button
              onClick={() => setFormData(prev => ({ ...prev, success: false, email: '' }))}
              className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Send Another Email
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main forgot password form
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <Mail className="w-12 h-12 text-purple-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Forgot Password?</h2>
          <p className="text-gray-600 mt-2">
            No worries! Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {formData.error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {formData.error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-left text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange(e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                formData.error ? 'border-red-400' : 'border-gray-300'
              }`}
              placeholder="Enter your email address"
              required
            />
          </div>

          <button
            type="submit"
            disabled={formData.isSubmitting}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {formData.isSubmitting ? (
              <>
                <Loader className="w-5 h-5 animate-spin mr-2" />
                Sending Reset Link...
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/login')}
            className="text-purple-600 hover:text-purple-700 text-sm flex items-center justify-center mx-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Login
          </button>
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
