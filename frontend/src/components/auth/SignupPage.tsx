import React, { useState, useEffect } from 'react';
import { Calendar, User, Lock, Mail, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { 
  validateSignupForm, 
  validateUsername, 
  validateEmail, 
  validatePassword, 
  validatePasswordConfirmation,
  analyzePasswordStrength,
  getPasswordStrengthColor,
  getPasswordStrengthText,
  getPasswordStrengthWidth,
  PasswordStrength
} from '../../utils/signupValidation';

interface SignupPageProps {
  onSwitchToLogin?: () => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onSwitchToLogin }) => {
  const { signup, isLoading } = useAuth();
  const { showError } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, feedback: [], isValid: false });

  // Real-time validation effect
  useEffect(() => {
    if (formData.password) {
      const strength = analyzePasswordStrength(formData.password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({ score: 0, feedback: [], isValid: false });
    }
  }, [formData.password]);

  const validateField = (field: string, value: string | boolean) => {
    let fieldErrors: string[] = [];

    switch (field) {
      case 'username':
        fieldErrors = validateUsername(value as string).map(e => e.message);
        break;
      case 'email':
        fieldErrors = validateEmail(value as string).map(e => e.message);
        break;
      case 'password':
        fieldErrors = validatePassword(value as string).map(e => e.message);
        break;
      case 'confirmPassword':
        fieldErrors = validatePasswordConfirmation(formData.password, value as string).map(e => e.message);
        break;
      case 'acceptTerms':
        if (!value) fieldErrors = ['You must accept the terms and conditions'];
        break;
    }

    setErrors(prev => ({
      ...prev,
      [field]: fieldErrors[0] || ''
    }));
  };

  const validateForm = () => {
    const validation = validateSignupForm(formData);
    setErrors(validation.errors);
    return validation.isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signup(formData.username, formData.email, formData.password, formData.acceptTerms);
      
      if (!result.success) {
        if (result.emailExists) {
          if (result.emailVerified === false) {
            // Email exists but not verified - redirect to verification resend page
            navigate(`/resend-verification?email=${encodeURIComponent(formData.email)}`);
          } else {
            // Email exists and is verified - show error and redirect to login page
            const message = result.message || 'This email is already registered and verified. Please login instead.';
            showError('Registration Failed', message);
            
            // Show a more informative error in the form
            setErrors({ 
              general: `${message} Redirecting to login page...`,
              email: 'This email is already registered and verified'
            });
            
            setTimeout(() => {
              navigate('/login');
            }, 3000); // Give user time to read the message
          }
        } else if (result.errors) {
          // Field-specific validation errors from backend
          setErrors(result.errors);
          // showError('Validation Error', 'Please fix the errors below');
          showError('Validation Error',result.message);
          // console.log(result.message);
        } else {
          // Other errors
          const errorMessage = result.message || 'Failed to create account. Please try again.';
          setErrors({ general: errorMessage });
          showError('Registration Failed', errorMessage);
        }
      } else if (result.needsVerification) {
        // Successful signup - redirect to verification sent page
        navigate(`/resend-verification?email=${encodeURIComponent(formData.email)}&success=true`);
      }
    } catch (error) {
      const errorMessage = 'An error occurred. Please try again.';
      setErrors({ general: errorMessage });
      showError('Registration Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    const updatedFormData = { ...formData, [field]: value };
    setFormData(updatedFormData);
    setFieldTouched(prev => ({ ...prev, [field]: true }));
    
    // Real-time validation for touched fields
    if (fieldTouched[field] || errors[field]) {
      validateField(field, value);
    }
    
    // Special case: when password changes, also validate confirmPassword if it's been touched
    if (field === 'password' && (fieldTouched.confirmPassword || errors.confirmPassword)) {
      // Use updated password value for validation
      const confirmPasswordErrors = validatePasswordConfirmation(value as string, updatedFormData.confirmPassword).map(e => e.message);
      setErrors(prev => ({
        ...prev,
        confirmPassword: confirmPasswordErrors[0] || ''
      }));
    }
    
    // Special case: when confirmPassword changes, validate it against the current password
    if (field === 'confirmPassword' && (fieldTouched.confirmPassword || errors.confirmPassword)) {
      const confirmPasswordErrors = validatePasswordConfirmation(updatedFormData.password, value as string).map(e => e.message);
      setErrors(prev => ({
        ...prev,
        confirmPassword: confirmPasswordErrors[0] || ''
      }));
    }
  };

  const handleBlur = (field: string) => {
    setFieldTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field as keyof typeof formData]);
  };

  const getFieldValidationIcon = (field: string) => {
    if (!fieldTouched[field] && !errors[field]) return null;
    
    if (errors[field]) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    
    // Show success for valid fields
    if (fieldTouched[field]) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    
    return null;
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-purple-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Calendar className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">GoWizly Calendar</h1>
          <p className="text-gray-600">Create your account to get started</p>
        </div>

        {errors.general && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-left font-medium text-gray-700 mb-2">Full Name</label>
            <div className="relative">
              <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                onBlur={() => handleBlur('username')}
                className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.username ? 'border-red-500' : fieldTouched.username && !errors.username ? 'border-green-500' : 'border-gray-300'
                }`}
                placeholder="Enter your Full Name"
                disabled={isSubmitting}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {getFieldValidationIcon('username')}
              </div>
            </div>
            {errors.username && <p className="mt-1 text-sm text-left text-red-600">{errors.username}</p>}
          </div>

          <div>
            <label className="block text-sm text-left font-medium text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.email ? 'border-red-500' : fieldTouched.email && !errors.email ? 'border-green-500' : 'border-gray-300'
                }`}
                placeholder="Enter your email address"
                disabled={isSubmitting}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {getFieldValidationIcon('email')}
              </div>
            </div>
            {errors.email && <p className="mt-1 text-sm text-left text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm text-left font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.password ? 'border-red-500' : fieldTouched.password && passwordStrength.isValid ? 'border-green-500' : 'border-gray-300'
                }`}
                placeholder="Create a password"
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
            
            {/* Password Error Message */}
            {errors.password && <p className="mt-1 text-sm text-left text-red-600">{errors.password}</p>}
            
            {/* Password Requirements */}
            {formData.password && passwordStrength.feedback.length > 0 && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800 mb-1">Password Requirements:</p>
                <ul className="text-sm text-red-700 space-y-1">
                  {passwordStrength.feedback.map((feedback, index) => (
                    <li key={index} className="flex items-center">
                      <XCircle className="w-3 h-3 text-red-600 mr-2 flex-shrink-0" />
                      {feedback}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {fieldTouched.password && passwordStrength.isValid && (
              <p className="mt-1 text-sm text-green-600 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                Strong password!
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm text-left font-medium text-gray-700 mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                onBlur={() => handleBlur('confirmPassword')}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.confirmPassword ? 'border-red-500' : fieldTouched.confirmPassword && formData.password === formData.confirmPassword && formData.confirmPassword ? 'border-green-500' : 'border-gray-300'
                }`}
                placeholder="Confirm your password"
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
            {errors.confirmPassword && <p className="mt-1 text-sm text-left text-red-600">{errors.confirmPassword}</p>}
            {fieldTouched.confirmPassword && !errors.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword && (
              <p className="mt-1 text-sm text-green-600 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                Passwords match!
              </p>
            )}
          </div>

          <div>
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                className={`mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${
                  errors.acceptTerms ? 'border-red-500' : ''
                }`}
                disabled={isSubmitting}
              />
              <span className="text-sm text-gray-700">
                I agree to the{' '}
                <a
                  target='_blank'
                  href='https://gowizly.com/terms.html'
                  rel='nooperner noreferrer'
                  
                  className="text-purple-600 hover:text-purple-700 underline"
                >
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a
                  target='_blank'
                  href='https://gowizly.com/privacy.html '
                  rel='nooperner noreferrer'
                  className="text-purple-600 hover:text-purple-700 underline"
                >
                  Privacy Policy
                </a>
              </span>
            </label>
            {errors.acceptTerms && <p className="mt-1 text-sm text-left text-red-600">{errors.acceptTerms}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting || isLoading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onSwitchToLogin ? onSwitchToLogin() : navigate('/login')}
                className="text-purple-600 hover:text-purple-700 font-semibold"
                disabled={isSubmitting}
              >
                Sign In
              </button>
            </p>
          </div>
        </form>
      </div>

      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="bg-purple-600 text-white p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Terms and Conditions</h3>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-white hover:bg-purple-700 rounded-lg p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700">
                By using GoWizly Family Calendar, you agree to our terms of service and accept responsibility for your account usage.
              </p>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="bg-purple-600 text-white p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Privacy Policy</h3>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="text-white hover:bg-purple-700 rounded-lg p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700">
                We collect and protect your personal information to provide our family calendar services and will not share your data with third parties without your consent.
              </p>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SignupPage;
