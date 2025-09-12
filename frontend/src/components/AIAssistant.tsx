import React, { useState } from 'react';
import { Mail, Camera, Upload, Bot, Loader2, ArrowLeft } from 'lucide-react';
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
  children: Child[];
  onEventsCreated?: () => void; // Callback to refresh events after creation
  onBack: () => void; // Navigation back function
}

const AIAssistant: React.FC<AIAssistantProps> = ({ children, onEventsCreated, onBack }) => {
  const [aiMode, setAiMode] = useState<'email' | 'photo'>('email');
  const [emailText, setEmailText] = useState('');
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
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

      if (result.success && result.data?.hasEvents) {
        showSuccess(
          `${result.data.eventsCreated} events created!`, 
          result.data.analysis.summary
        );
        
        // Clear the form
        setEmailText('');
        
        // Refresh events in parent component
        if (onEventsCreated) {
          onEventsCreated();
        }
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

      if (result.success && result.data?.hasEvents) {
        showSuccess(
          `${result.data.eventsCreated} events created!`, 
          result.data.analysis.summary
        );
        
        // Clear the form
        setSelectedImage(null);
        setImagePreview(null);
        
        // Refresh events in parent component
        if (onEventsCreated) {
          onEventsCreated();
        }
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-16">
              <div className="flex items-center  justify-center space-x-4">
                <Bot className="w-8 h-8 text-purple-600 " />
                <h1 className="text-2xl font-bold text-gray-900">AI Calendar Assistant</h1>
              </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Mode Selection */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex space-x-4">
              <button
                onClick={() => setAiMode('email')}
                className={`px-6 py-3 rounded-lg flex items-center space-x-2 font-medium transition-colors ${
                  aiMode === 'email' 
                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-300' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Mail className="w-5 h-5" />
                <span>Parse Email</span>
              </button>
              <button
                onClick={() => setAiMode('photo')}
                className={`px-6 py-3 rounded-lg flex items-center space-x-2 font-medium transition-colors ${
                  aiMode === 'photo' 
                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-300' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Camera className="w-5 h-5" />
                <span>Upload Photo</span>
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6">
            {aiMode === 'email' ? (
              <div className="space-y-6">

                {/* Child Selection */}
                {children.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign events to child:
                    </label>
                    <select
                      value={selectedChildId || ''}
                      onChange={(e) => setSelectedChildId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">All children</option>
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
                    Email Content:
                  </label>
                  <textarea
                    value={emailText}
                    onChange={(e) => setEmailText(e.target.value)}
                    className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none text-sm"
                    placeholder="Paste your email content here. The AI will extract dates, events, assignments, and other calendar items..."
                    disabled={isProcessing}
                  />
                  <div className="mt-2 text-sm text-gray-500">
                    Characters: {emailText.length}
                  </div>
                </div>

                <button
                  onClick={handleEmailAnalysis}
                  disabled={!emailText.trim() || isProcessing}
                  className="w-full bg-purple-600 text-white py-4 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                      Processing Email...
                    </>
                  ) : (
                    <>
                      <Bot className="w-6 h-6 mr-3" />
                      Process Email
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-6">

                {/* Child Selection */}
                {children.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign events to child:
                    </label>
                    <select
                      value={selectedChildId || ''}
                      onChange={(e) => setSelectedChildId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">All children</option>
                      {children.map((child) => (
                        <option key={child.id} value={child.id || ''}>
                          {child.name} ({child.gradeLevel})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Image Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-gray-50">
                  {!imagePreview ? (
                    <>
                      <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Upload an Image</h3>
                      <p className="text-gray-600 mb-6">
                        Drag and drop or click to select photos of school documents, flyers, or calendars
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
                        className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center mx-auto cursor-pointer font-medium text-lg"
                      >
                        <Upload className="w-6 h-6 mr-3" />
                        Choose File
                      </label>
                      <p className="text-sm text-gray-500 mt-4">
                        Supported formats: JPG, PNG, GIF (Max 10MB)
                      </p>
                    </>
                  ) : (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Selected preview"
                        className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
                      />
                      <button
                        onClick={handleRemoveImage}
                        className="absolute top-4 right-4 bg-red-500 text-white rounded-full p-3 hover:bg-red-600 transition-colors text-xl font-bold"
                        disabled={isProcessing}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                {/* File Info */}
                {selectedImage && (
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">File Information:</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Name:</strong> {selectedImage.name}</p>
                      <p><strong>Size:</strong> {(selectedImage.size / 1024 / 1024).toFixed(2)} MB</p>
                      <p><strong>Type:</strong> {selectedImage.type}</p>
                    </div>
                  </div>
                )}

                {/* Process Button */}
                <button
                  onClick={handlePhotoAnalysis}
                  disabled={!selectedImage || isProcessing}
                  className="w-full bg-purple-600 text-white py-4 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                      Processing Photo...
                    </>
                  ) : (
                    <>
                      <Camera className="w-6 h-6 mr-3" />
                      Process Photo
                    </>
                  )}
                </button>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;