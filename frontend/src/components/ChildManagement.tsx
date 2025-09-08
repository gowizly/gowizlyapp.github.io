import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Save, X, User, AlertCircle, CheckCircle, Loader, ArrowLeft } from 'lucide-react';
import { Child, childApiService } from '../services/childApi';
import { validateChildForCreation, validateChildForUpdate, ValidationError, VALID_GRADE_LEVELS } from '../utils/childValidation';
import { Event, eventApiService } from '../services/eventApi';

const eventTypes = {
  ASSIGNMENT_DUE: { color: 'bg-purple-500', label: 'Assignment Due' },
  EXTRACURRICULAR: { color: 'bg-red-500', label: 'Extracurricular Event' },
  SCHOOL_EVENT: { color: 'bg-blue-500', label: 'School Event' },
  PARENT_MEETING: { color: 'bg-green-500', label: 'Parent Meeting' },
  HOLIDAY: { color: 'bg-yellow-500', label: 'Holiday' },
  BIRTHDAY: { color: 'bg-pink-500', label: 'Birthday' },
  APPOINTMENT: { color: 'bg-indigo-500', label: 'Appointment' },
  REMINDER: { color: 'bg-cyan-500', label: 'Reminder' },
  EXAM: { color: 'bg-orange-500', label: 'Exam' },
  OTHER: { color: 'bg-gray-500', label: 'Other' }
};
interface ChildManagementProps {
  onBack?: () => void;
  onChildCreated?: () => void;
}

const ChildManagement: React.FC<ChildManagementProps> = ({ onBack, onChildCreated }) => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [formData, setFormData] = useState<Omit<Child, 'id'>>({
    name: '',
    gradeLevel: '',
    schoolName: '',
    birthDate: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  useEffect(() => {
    loadChildren();
    getUpcomingEvents();
  }, []);

  const loadChildren = async () => {
    setLoading(true);
    setError(null);

    console.log('📋 Loading children from API...');
    const response = await childApiService.getChildren();

    if (response.success && response.data) {
      console.log('✅ Children loaded successfully:', response.data);
      // Ensure we have an array, not HTML or other data
      if (Array.isArray(response.data)) {
        setChildren(response.data);
      } else {
        console.error('❌ Expected array but got:', typeof response.data, response.data);
        setError('Invalid response format - expected array of children');
        setChildren([]); // Reset to empty array
      }
    } else {
      console.error('❌ Failed to load children:', response.error);
      setError(response.error || 'Failed to load children');
      setChildren([]); // Reset to empty array
    }

    setLoading(false);
  };

  const handleCreateChild = async () => {
    // Clear previous validation errors
    setValidationErrors([]);
    setError(null);

    // Validate child data
    const validation = validateChildForCreation(formData);

    if (!validation.isValid) {
      console.warn('⚠️ Create child validation failed:', validation.errors);
      setValidationErrors(validation.errors);
      return;
    }

    setFormLoading(true);

    console.log('🆕 Creating new child with data:', formData);
    const response = await childApiService.createChild(formData);

    if (response.success) {
      console.log('✅ Child created successfully:', response.data);
      setSuccess('Child added successfully!');
      setShowAddModal(false);
      resetForm();
      loadChildren();

      // Notify parent component (FamilyCalendar) that a child was created
      if (onChildCreated) {
        console.log('📢 Notifying parent component about child creation...');
        onChildCreated();
      }
    } else {
      console.error('❌ Failed to create child:', response.error);
      setError(response.error || 'Failed to create child');
    }

    setFormLoading(false);
  };

  const handleUpdateChild = async () => {
    if (!editingChild) {
      setError('No child selected for editing');
      return;
    }

    // Clear previous validation errors
    setValidationErrors([]);
    setError(null);

    // Validate child data for update
    const validation = validateChildForUpdate(formData);

    if (!validation.isValid) {
      console.warn('Update child validation failed:', validation.errors);
      setValidationErrors(validation.errors);
      return;
    }

    setFormLoading(true);

    console.log('✏️ Updating child:', editingChild.id, 'with data:', formData);
    const response = await childApiService.updateChild(editingChild.id!, formData);

    if (response.success) {
      console.log('✅ Child updated successfully:', response.data);
      setSuccess('Child updated successfully!');
      setShowAddModal(false);
      setEditingChild(null);
      resetForm();
      loadChildren();

      // Notify parent component (FamilyCalendar) that a child was updated
      if (onChildCreated) {
        console.log('📢 Notifying parent component about child update...');
        onChildCreated();
      }
    } else {
      console.error('❌ Failed to update child:', response.error);
      setError(response.error || 'Failed to update child');
    }

    setFormLoading(false);
  };

  const handleDeleteChild = async (childId: number) => {
    if (!window.confirm('Are you sure you want to delete this child? This action cannot be undone.')) {
      console.log('🚫 Delete operation cancelled by user');
      return;
    }

    setError(null);

    console.log('🗑️ Deleting child with ID:', childId);
    const response = await childApiService.deleteChild(childId);

    if (response.success) {
      console.log('✅ Child deleted successfully');
      setSuccess('Child deleted successfully!');
      loadChildren();

      // Notify parent component (FamilyCalendar) that a child was deleted
      if (onChildCreated) {
        console.log('📢 Notifying parent component about child deletion...');
        onChildCreated();
      }
    } else {
      console.error('❌ Failed to delete child:', response.error);
      setError(response.error || 'Failed to delete child');
    }
  };

  const openEditModal = (child: Child) => {
    console.log('✏️ Opening edit modal for child:', child.id);
    setEditingChild(child);

    // Convert ISO date to YYYY-MM-DD format for date input
    const formatDateForInput = (isoDate: string) => {
      if (!isoDate) return '';
      const date = new Date(isoDate);
      return date.toISOString().split('T')[0];
    };

    setFormData({
      name: child.name,
      gradeLevel: child.gradeLevel,
      schoolName: child.schoolName,
      birthDate: formatDateForInput(child.birthDate),
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      gradeLevel: '',
      schoolName: '',
      birthDate: '',
    });
    setEditingChild(null);
    setValidationErrors([]);
  };

  const closeModal = () => {
    setShowAddModal(false);
    resetForm();
    setError(null);
  };

  // Auto-hide notifications
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const getUpcomingEvents = async () => {
    console.log("getting upcoming events");
    try {
      const response = await eventApiService.getEvents();
      if (response.success && response.data) {
        console.log("upcoming events are:", response.data.events);
        setUpcomingEvents(response.data.events);
        console.log("upcoming events are:", upcomingEvents);
      } else {
        console.error("error getting upcoming events:", response.error);
        setUpcomingEvents([]);
      }
    } catch (error) {
      console.error("error getting upcoming events:", error);
      setUpcomingEvents([]);
    }
  };

  // Using grade options from validation utility to ensure consistency
  const gradeOptions = VALID_GRADE_LEVELS;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading children...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <h3 className='text-2xl font-bold'>My Children</h3>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Child</span>
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>{success}</span>
          </div>
        )}

        {/* Children Grid */}
        {children.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Children Added</h3>
            <p className="text-gray-500 mb-4">Start by adding your first child to manage their information.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Add Your First Child
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {children.map((child) => (
              <div key={child.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{child.name}</h3>
                      <p className="text-sm text-gray-600">{child.gradeLevel}</p>
                      <p className="text-sm text-gray-600">{child.schoolName}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(child)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Edit child"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteChild(child.id!)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Delete child"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <hr />
                  <div className='text-sm text-gray-600'>
                    <p className='font-bold text-left'>Upcoming Events</p>
                    {/* fileter upcoming events according to child id */}
                    {upcomingEvents
                      .filter((event) => event.children?.some((c) => c.id === child.id))
                      .map((event) => (
                        <div key={event.id}>
                          <div className="flex">
                            <p
                              className={`w-6 h-6 mt-1 mr-1 rounded-full ${eventTypes[event.type as keyof typeof eventTypes]?.color || "bg-gray-400"
                                }`}
                            ></p>
                            <p className="text-left text-xl font-bold">{event.title}</p>
                          </div>
                        </div>
                      ))}

                    {upcomingEvents.filter((event) => event.children?.some((c) => c.id === child.id)).length === 0 && (
                      <p className="text-gray-500">No upcoming events</p>
                    )}

                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="bg-purple-600 text-white p-4 flex justify-between items-center rounded-t-lg">
              <h3 className="text-lg font-semibold">
                {editingChild ? 'Edit Child' : 'Add New Child'}
              </h3>
              <button
                onClick={closeModal}
                className="text-white hover:bg-purple-700 rounded-lg p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Validation Errors Display */}
              {validationErrors.length > 0 && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  <h4 className="font-medium mb-2">Please fix the following errors:</h4>
                  <ul className="list-disc list-inside text-sm">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  editingChild ? handleUpdateChild() : handleCreateChild();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter child's name"
                    maxLength={50}
                    required
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {formData.name.length}/50 characters
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade Level *
                  </label>
                  <select
                    value={formData.gradeLevel}
                    onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select grade level</option>
                    {gradeOptions.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School Name *
                  </label>
                  <input
                    type="text"
                    value={formData.schoolName}
                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter school name"
                    maxLength={100}
                    required
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {formData.schoolName.length}/100 characters
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Birth Date *
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                  {formData.birthDate && (
                    <div className="text-xs text-gray-500 mt-1">
                      {(() => {
                        const birthDate = new Date(formData.birthDate);
                        const today = new Date();
                        const age = today.getFullYear() - birthDate.getFullYear();
                        const monthDiff = today.getMonth() - birthDate.getMonth();
                        const dayDiff = today.getDate() - birthDate.getDate();
                        const actualAge = (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) ? age - 1 : age;
                        return `Age: ${actualAge} years (valid range: 0-21 years)`;
                      })()}
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    disabled={formLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    {formLoading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>{editingChild ? 'Update' : 'Add'} Child</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChildManagement;
