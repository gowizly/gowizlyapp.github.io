import React, { useState } from 'react';
import { Calendar, Mail, Lock, Eye, EyeOff, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface PasswordResetPageProps {
  onBackToLogin: () => void;
}

const PasswordResetPage: React.FC<PasswordResetPageProps> = ({ onBackToLogin }) => {
  const { requestPasswordReset, resetPassword, isLoading } = useAuth();
  const [step, setStep] = useState<'request' | 'reset' | 'success'>('request');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Check if we have a reset token in URL (from email link)
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setResetToken(token);
      setStep('reset');
    }
  }, []);

  const validateEmail = (email: string) => {
    if (!email.trim()) {
      return 'Email is required';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePassword = (password: string) => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return '';
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await requestPasswordReset(email);
      if (success) {
        setSuccessMessage('Password reset instructions have been sent to your email.');
        setStep('success');
      } else {
        setErrors({ general: 'Failed to send reset email. Please try again.' });
      }
    } catch (error) {
      setErrors({ general: 'An error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const passwordError = validatePassword(newPassword);
    const confirmError = newPassword !== confirmPassword ? 'Passwords do not match' : '';
    
    if (passwordError || confirmError) {
      setErrors({ 
        password: passwordError, 
        confirmPassword: confirmError 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await resetPassword(resetToken, newPassword);
      if (success) {
        setSuccessMessage('Your password has been successfully reset.');
        setStep('success');
      } else {
        setErrors({ general: 'Failed to reset password. The link may be expired or invalid.' });
      }
    } catch (error) {
      setErrors({ general: 'An error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'email') setEmail(value);
    if (field === 'newPassword') setNewPassword(value);
    if (field === 'confirmPassword') setConfirmPassword(value);
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderRequestStep = () => (
    <div>
      <div className="text-center mb-8">
        <Mail className="w-16 h-16 text-purple-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Reset Your Password</h2>
        <p className="text-gray-600">Enter your email address and we'll send you a link to reset your password.</p>
      </div>

      {errors.general && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleRequestReset} className="space-y-6">
        <div>
          <label className="block text-left text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <div className="relative">
            <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your email address"
              disabled={isSubmitting}
            />
          </div>
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting || isLoading ? (
            <div className="flex items-center justify-center">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              Sending Reset Link...
            </div>
          ) : (
            'Send Reset Link'
          )}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Back to Login
          </button>
        </div>
      </form>
    </div>
  );

  const renderResetStep = () => (
    <div>
      <div className="text-center mb-8">
        <Lock className="w-16 h-16 text-purple-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Set New Password</h2>
        <p className="text-gray-600">Enter your new password below.</p>
      </div>

      {errors.general && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {errors.general}
        </div>
      )}

      <form onSubmit={handlePasswordReset} className="space-y-6">
        <div>
          <label className="block text-left text-sm font-medium text-gray-700 mb-2">New Password</label>
          <div className="relative">
            <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => handleInputChange('newPassword', e.target.value)}
              className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter new password"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={isSubmitting}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
        </div>

        <div>
          <label className="block text-left text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
          <div className="relative">
            <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Confirm new password"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={isSubmitting}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting || isLoading ? (
            <div className="flex items-center justify-center">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              Resetting Password...
            </div>
          ) : (
            'Reset Password'
          )}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Back to Login
          </button>
        </div>
      </form>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center">
      <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        {step === 'success' && successMessage.includes('sent') ? 'Check Your Email' : 'Password Reset!'}
      </h2>
      <p className="text-gray-600 mb-8">{successMessage}</p>
      <button
        onClick={onBackToLogin}
        className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
      >
        {step === 'success' && successMessage.includes('sent') ? 'Back to Login' : 'Continue to Login'}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-purple-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Calendar className="w-12 h-12 text-purple-600 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-gray-800">GoWizly Calendar</h1>
        </div>

        {step === 'request' && renderRequestStep()}
        {step === 'reset' && renderResetStep()}
        {step === 'success' && renderSuccessStep()}
      </div>
    </div>
  );
};

export default PasswordResetPage;
