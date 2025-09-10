import React, { useState } from 'react';
import { Mail, Camera, Upload, Bot, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { aiAssistantApiService } from '../services/aiAssistantApi';
import { useToast } from '../contexts/ToastContext';

interface Child {
  id: number | null;
  name: string;
  gradeLevel: string;
  schoolName: string;
  birthDate?: string;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  children: Child[];
  onEventsCreated?: () => void; // Callback to refresh events after creation
}

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, children, onEventsCreated }) => {
  const [aiMode, setAiMode] = useState<'email' | 'photo'>('email');
  const [emailText, setEmailText] = useState('');
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  // const [lastAnalysisResult, setLastAnalysisResult] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { showSuccess, showError, showInfo } = useToast();

  // Handle email analysis
  const handleEmailAnalysis = async () => {
    if (!emailText.trim()) return;

    setIsProcessing(true);
    try {
      console.log('📧 Starting email analysis...', { childId: selectedChildId });
      
      const result = await aiAssistantApiService.analyzeEmail(emailText, selectedChildId || undefined);
      
      console.log('✅ Email analysis completed:', result);
      // setLastAnalysisResult(result);

      if (result.success && result.data?.hasEvents) {
        showSuccess(
          `${result.data.eventsCreated} events created!`, 
          result.data.analysis.summary
        );
        
        // Clear the form
        setEmailText('');
        
        // Refresh events in parent component first
        if (onEventsCreated) {
          onEventsCreated();
        }
        
        // Close the modal after a short delay to allow refresh
        setTimeout(() => {
          onClose();
        }, 500);
      } else if (result.success && !result.data?.hasEvents) {
        showInfo('No events found', 'The AI could not extract any calendar events from the email content.');
      } else {
        showError('Analysis failed', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('❌ Email analysis error:', error);
      showError('Analysis failed', error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle photo analysis
  const handlePhotoAnalysis = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    try {
      console.log('📷 Starting photo analysis...', { 
        fileName: selectedImage.name,
        childId: selectedChildId 
      });
      
      const result = await aiAssistantApiService.analyzeImage(selectedImage, selectedChildId || undefined);
      
      console.log('✅ Photo analysis completed:', result);
      // setLastAnalysisResult(result);

      if (result.success && result.data?.hasEvents) {
        showSuccess(
          `${result.data.eventsCreated} events created!`, 
          result.data.analysis.summary
        );
        
        // Clear the form
        setSelectedImage(null);
        setImagePreview(null);
        
        // Refresh events in parent component first
        if (onEventsCreated) {
          onEventsCreated();
        }
        
        // Close the modal after a short delay to allow refresh
        setTimeout(() => {
          onClose();
        }, 500);
      } else if (result.success && !result.data?.hasEvents) {
        showInfo('No events found', 'The AI could not extract any calendar events from the image.');
      } else {
        showError('Analysis failed', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('❌ Photo analysis error:', error);
      showError('Analysis failed', error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle image file selection
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showError('Invalid file', 'Please select an image file (JPG, PNG, GIF, etc.)');
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        showError('File too large', 'Please select an image smaller than 10MB');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle removing selected image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-purple-600 text-white p-4 flex justify-between items-center flex-shrink-0">
          <h3 className="text-lg font-semibold">AI Calendar Assistant</h3>
          <button
            onClick={onClose}
            className="text-white hover:bg-purple-700 rounded-lg p-2 transition-colors"
          >
            ×
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setAiMode('email')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                aiMode === 'email' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Mail className="w-5 h-5" />
              <span>Parse Email</span>
            </button>
            <button
              onClick={() => setAiMode('photo')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                aiMode === 'photo' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Camera className="w-5 h-5" />
              <span>Upload Photo</span>
            </button>
          </div>

          {aiMode === 'email' ? (
            <div className="space-y-4">
              {/* Child Selection */}
              {children.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign events to child (optional):
                  </label>
                  <select
                    value={selectedChildId || ''}
                    onChange={(e) => setSelectedChildId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Select a child</option>
                    {children.map((child) => (
                      <option key={child.id} value={child.id || ''}>
                        {child.name} ({child.gradeLevel})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste email content or forward emails here:
                </label>
                <textarea
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                  className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="Paste your email content here. The AI will extract dates, events, assignments, and other calendar items..."
                  disabled={isProcessing}
                />
              </div>

              <button
                onClick={handleEmailAnalysis}
                disabled={!emailText.trim() || isProcessing}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing Email...
                  </>
                ) : (
                  <>
                    <Bot className="w-5 h-5 mr-2" />
                    Process Email
                  </>
                )}
              </button>

              {/* Last Analysis Result - Commented out for now */}
              {/* {lastAnalysisResult && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    {lastAnalysisResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    )}
                    <span className="font-medium">
                      Last Analysis: {lastAnalysisResult.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  {lastAnalysisResult.success && lastAnalysisResult.data.hasEvents && (
                    <div className="text-sm text-gray-600">
                      <p><strong>Events Created:</strong> {lastAnalysisResult.data.eventsCreated}</p>
                      <p><strong>Summary:</strong> {lastAnalysisResult.data.analysis.summary}</p>
                    </div>
                  )}
                </div>
              )} */}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Child Selection */}
              {children.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign events to child (optional):
                  </label>
                  <select
                    value={selectedChildId || ''}
                    onChange={(e) => setSelectedChildId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Select a child</option>
                    {children.map((child) => (
                      <option key={child.id} value={child.id || ''}>
                        {child.name} ({child.gradeLevel})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Image Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                {!imagePreview ? (
                  <>
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Upload photos of school flyers, assignment sheets, or calendars
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={isProcessing}
                    />
                    <label
                      htmlFor="image-upload"
                      className="bg-purple-100 text-purple-700 px-6 py-2 rounded-lg hover:bg-purple-200 transition-colors flex items-center mx-auto cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Choose File
                    </label>
                  </>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Selected preview"
                      className="max-w-full max-h-64 mx-auto rounded-lg shadow-lg"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                      disabled={isProcessing}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {/* File Info */}
              {selectedImage && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">
                    <p><strong>File:</strong> {selectedImage.name}</p>
                    <p><strong>Size:</strong> {(selectedImage.size / 1024 / 1024).toFixed(2)} MB</p>
                    <p><strong>Type:</strong> {selectedImage.type}</p>
                  </div>
                </div>
              )}

              {/* Process Button */}
              <button
                onClick={handlePhotoAnalysis}
                disabled={!selectedImage || isProcessing}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing Photo...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5 mr-2" />
                    Process Photo
                  </>
                )}
              </button>

              {/* Last Analysis Result - Commented out for now */}
              {/* {lastAnalysisResult && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    {lastAnalysisResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    )}
                    <span className="font-medium">
                      Last Analysis: {lastAnalysisResult.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  {lastAnalysisResult.success && lastAnalysisResult.data.hasEvents && (
                    <div className="text-sm text-gray-600">
                      <p><strong>Events Created:</strong> {lastAnalysisResult.data.eventsCreated}</p>
                      <p><strong>Summary:</strong> {lastAnalysisResult.data.analysis.summary}</p>
                      {lastAnalysisResult.data.analysis.bufferSize && (
                        <p><strong>Image Size:</strong> {(lastAnalysisResult.data.analysis.bufferSize / 1024 / 1024).toFixed(2)} MB</p>
                      )}
                    </div>
                  )}
                </div>
              )} */}

              <p className="text-sm text-gray-500 text-center">
                The AI will analyze the image and extract events, dates, and assignments automatically.
              </p>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
