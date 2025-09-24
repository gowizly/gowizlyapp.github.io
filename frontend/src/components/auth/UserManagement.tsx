import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, MapPin, Trash2, Edit3, Save, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Header from '../common/Header';

interface UserManagementProps {
  onBack: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ onBack }) => {
  const { user, updateProfile, deleteAccount, isLoading: authLoading } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    username: user?.username || '',
    address: user?.address || ''
  });
  
  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Update form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        address: user.address || ''
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Frontend validation function
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    // Username validation
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      errors.username = 'Username must be between 3 and 50 characters';
    } else if (formData.username.trim().length > 50) {
      errors.username = 'Username must be between 3 and 50 characters';
    }
    // } else if (!/^[a-zA-Z0-9_\-\.]+$/.test(formData.username.trim())) {
    //   errors.username = 'Username can only contain letters, numbers, underscores, hyphens, and dots';
    // }
    
    // Address validation
    if (formData.address.trim() && formData.address.trim().length > 500) {
      errors.address = 'Address cannot exceed 500 characters';
    } else if (formData.address.trim() && formData.address.trim().length < 10) {
      errors.address = 'Address seems too short. Please provide a complete address.';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async () => {
    // Clear previous validation errors
    setValidationErrors({});
    
    // Frontend validation
    if (!validateForm()) {
      showError('Validation Error', 'Please fix the errors below');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔄 Updating user profile...');
      const result = await updateProfile(formData.username.trim(), formData.address.trim());

      if (result.success) {
        showSuccess('Profile Updated', result.message || 'Your profile has been updated successfully');
        setIsEditing(false);
        setValidationErrors({});
      } else {
        // Handle backend validation errors
        if (result.errors) {
          setValidationErrors(result.errors);
          showError('Validation Error', 'Please fix the errors below');
        } else {
          showError('Update Failed', result.message || 'Failed to update profile. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Update Failed', 'An error occurred while updating your profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      console.log('🗑️ Deleting user account...');
      const success = await deleteAccount();

      if (success) {
        showSuccess('Account Deleted', 'Your account has been deleted successfully');
        onBack();
        // The deleteAccount function should handle logout and redirect
      } else {
        showError('Deletion Failed', 'Failed to delete account. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      showError('Deletion Failed', 'An error occurred while deleting your account');
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      username: user?.username || '',
      address: user?.address || ''
    });
    setValidationErrors({});
    setIsEditing(false);
  };

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading user data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show message if no user data
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-gray-600">No user data available. Please try refreshing the page.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Common Header */}
      <Header />

      {/* Page Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
  <div className="flex items-center justify-between py-6">
    {/* Left side */}
    <div className="flex items-center space-x-4">
      <button
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        disabled={isLoading}
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Calendar
      </button>
    </div>

    {/* Right side */}
    <div className="flex items-center space-x-4 mr-4">
      <div className="w-10 h-10 bg-purple-100 rounded-full flex justify-center items-center">
        <User className="w-5 h-5 text-purple-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
    </div>
  </div>
</div>

      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-8">
            <div className="max-w-2xl mx-auto">
              {/* Profile Information */}
              <div className="space-y-6">
                {/* Username */}
                <div className="space-y-2">
                  <label className="flex text-sm font-medium text-gray-700">
                    <User className="w-4 h-4 mr-2 text-gray-500" />
                    Full Name
                  </label>
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left ${
                          validationErrors.username ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter username"
                        disabled={isLoading}
                      />
                      {validationErrors.username && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.username}</p>
                      )}
                    </>
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-800 text-left">
                      {user?.username || 'Not set'}
                    </div>
                  )}
                </div>

                {/* Email (Read-only) */}
                <div className="space-y-2">
                  <label className="flex text-sm font-medium text-gray-700">
                    <Mail className="w-4 h-4 mr-2 text-gray-500" />
                    Email
                  </label>
                  <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-600 text-left">
                    {user?.email || 'Not set'}
                    <span className="text-xs text-gray-500 ml-2">(read-only)</span>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <label className="flex text-sm font-medium text-gray-700">
                    <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                    Address
                  </label>
                  {/* Address (Read / Edit) */}
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left ${
                          validationErrors.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter address (optional)"
                        disabled={isLoading}
                      />
                      {validationErrors.address && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.address}</p>
                      )}
                    </>
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-800 text-left">
                      {user?.address || 'Not set'}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-4 pt-8 border-t border-gray-200">
                {isEditing ? (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    disabled={isLoading}
                    className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </button>
                )}

                {/* Delete Account Button */}
                {!isEditing && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isLoading}
                    className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Account</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
