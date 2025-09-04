import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { API_BASE_URL } from '../config/environment';

interface ResetPasswordState {
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
}

interface ValidationErrors {
  password?: string;
  confirmPassword?: string;
  general?: string;
}

const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<ResetPasswordState>({
    password: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false
  });
  
  const [tokenValidation, setTokenValidation] = useState({
    isValid: false,
    isLoading: true,
    userEmail: '',
    userName: ''
  });
  
  const [resetState, setResetState] = useState({
    isSubmitting: false,
    success: false,
    errors: {} as ValidationErrors
  });

  // Validate token on component mount
  useEffect(() => {
    validateResetToken();
  }, [token]);

  const validateResetToken = async () => {
    try {
      console.log('🔐 Validating reset token:', token?.substring(0, 10) + '...');
      
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('🔐 Token validation response:', data);

      if (response.ok && data.success) {
        setTokenValidation({
          isValid: true,
          isLoading: false,
          userEmail: data.data?.email || '',
          userName: data.data?.username || ''
        });
      } else {
        console.error('❌ Invalid reset token:', data.msg);
        setTokenValidation({
          isValid: false,
          isLoading: false,
          userEmail: '',
          userName: ''
        });
      }
    } catch (error) {
      console.error('❌ Token validation error:', error);
      setTokenValidation({
        isValid: false,
        isLoading: false,
        userEmail: '',
        userName: ''
      });
    }
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/(?=.*[a-z])/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/(?=.*\d)/.test(password)) return 'Password must contain at least one number';
    if (!/(?=.*[@$!%*?&])/.test(password)) return 'Password must contain at least one special character (@$!%*?&)';
    return null;
  };

  const validateForm = (): ValidationErrors => {
    const errors: ValidationErrors = {};

    const passwordError = validatePassword(formData.password);
    if (passwordError) errors.password = passwordError;

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setResetState(prev => ({ ...prev, errors: {} }));
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setResetState(prev => ({ ...prev, errors }));
      return;
    }

    setResetState(prev => ({ ...prev, isSubmitting: true }));

    try {
      console.log('🔐 Submitting password reset...');
      
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: formData.password
        })
      });

      const data = await response.json();
      console.log('🔐 Password reset response:', data);

      if (response.ok && data.success) {
        console.log('✅ Password reset successful');
        setResetState(prev => ({
          ...prev,
          isSubmitting: false,
          success: true,
          errors: {}
        }));
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Password reset successful! Please log in with your new password.' 
            }
          });
        }, 3000);
      } else {
        console.error('❌ Password reset failed:', data.msg);
        setResetState(prev => ({
          ...prev,
          isSubmitting: false,
          errors: { general: data.msg || 'Password reset failed' }
        }));
      }
    } catch (error) {
      console.error('❌ Password reset error:', error);
      setResetState(prev => ({
        ...prev,
        isSubmitting: false,
        errors: { general: 'Network error. Please try again.' }
      }));
    }
  };

  const handleInputChange = (field: keyof ResetPasswordState, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error when user starts typing
    if (resetState.errors[field as keyof ValidationErrors]) {
      setResetState(prev => ({
        ...prev,
        errors: { ...prev.errors, [field]: undefined }
      }));
    }
  };

  // Loading state while validating token
  if (tokenValidation.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <Loader className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Validating Reset Link</h2>
          <p className="text-gray-600">Please wait while we verify your password reset link...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!tokenValidation.isValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Invalid Reset Link</h2>
          <p className="text-gray-600 mb-6">
            This password reset link is invalid or has expired. Please request a new password reset.
          </p>
          <button
            onClick={() => navigate('/forgot-password')}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Request New Reset Link
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (resetState.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Password Reset Successful!</h2>
          <p className="text-gray-600 mb-6">
            Your password has been updated successfully. You will be redirected to the login page in a few seconds.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Main reset password form
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <Lock className="w-12 h-12 text-purple-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Reset Your Password</h2>
          <p className="text-gray-600 mt-2">
            Hi {tokenValidation.userName}, enter your new password below.
          </p>
        </div>

        {resetState.errors.general && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {resetState.errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password *
            </label>
            <div className="relative">
              <input
                type={formData.showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full p-3 pr-12 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  resetState.errors.password ? 'border-red-400' : 'border-gray-300'
                }`}
                placeholder="Enter your new password"
                required
              />
              <button
                type="button"
                onClick={() => handleInputChange('showPassword', !formData.showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {formData.showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {resetState.errors.password && (
              <p className="text-red-500 text-sm mt-1">{resetState.errors.password}</p>
            )}
            <div className="text-xs text-gray-500 mt-1">
              Password must be at least 8 characters with uppercase, lowercase, number, and special character
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password *
            </label>
            <div className="relative">
              <input
                type={formData.showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`w-full p-3 pr-12 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  resetState.errors.confirmPassword ? 'border-red-400' : 'border-gray-300'
                }`}
                placeholder="Confirm your new password"
                required
              />
              <button
                type="button"
                onClick={() => handleInputChange('showConfirmPassword', !formData.showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {formData.showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {resetState.errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{resetState.errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={resetState.isSubmitting}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {resetState.isSubmitting ? (
              <>
                <Loader className="w-5 h-5 animate-spin mr-2" />
                Resetting Password...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/login')}
            className="text-purple-600 hover:text-purple-700 text-sm"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
