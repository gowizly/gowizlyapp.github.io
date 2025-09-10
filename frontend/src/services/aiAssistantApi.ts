import axios, { AxiosResponse } from 'axios';
import { API_BASE_URL } from '../config/environment';
import { getCookie } from '../utils/cookies';

// Types for AI Assistant API responses
type ApiResponse<T> = 
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: string }

interface BackendEnvelope<T> {
  success: boolean;
  msg?: string;
  data: T;
}

interface AIAnalysisEvent {
  event: {
    id: number;
    title: string;
    description: string;
    startDate: string;
    endDate: string | null;
    isAllDay: boolean;
    type: string;
    priority: string;
    color: string;
    hasReminder: boolean;
    reminderMinutes: number | null;
    parentId: number;
    createdAt: string;
    updatedAt: string;
    children: Array<{
      id: number;
      name: string;
    }>;
    startTime: string;
    endTime: string | null;
    startDateOnly: string;
    endDateOnly: string | null;
  };
  childrenCount: number;
}

interface EmailAnalysisResponse {
  hasEvents: boolean;
  eventsCreated: number;
  events: AIAnalysisEvent[];
  analysis: {
    contentLength: number;
    summary: string;
    aiProcessed: boolean;
  };
  errors: string[];
}

interface PhotoAnalysisResponse {
  hasEvents: boolean;
  eventsCreated: number;
  events: AIAnalysisEvent[];
  analysis: {
    bufferSize: number;
    mimeType: string;
    summary: string;
    aiProcessed: boolean;
  };
  errors: string[];
}

// AI Assistant API Service
class AIAssistantApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/assistant`;
    console.log('🤖 AI Assistant API Service initialized with base URL:', this.baseUrl);
  }

  private getAuthHeaders(): Record<string, string> {
    const token = getCookie('auth_token');
    if (!token) {
      console.warn('⚠️ No auth token found in cookies');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  private async handleResponse<T>(response: AxiosResponse<unknown>): Promise<ApiResponse<T>> {
    try {
      const data = response.data as unknown;
      const contentType = response.headers['content-type'] as string | undefined;
      console.log(`📡 AI API Response [${response.status}] Content-Type: ${contentType}`);
      
      console.log(`📡 AI API Response [${response.status}]:`, data);
      
      if (response.status < 200 || response.status >= 300) {
        let errorMessage = `HTTP Error: ${response.status}`;
        
        if (typeof data === 'object' && data !== null) {
          const obj = data as Record<string, unknown>;
          const msg = (obj.msg as string) || (obj.message as string) || (obj.error as string) || undefined;
          errorMessage = msg || errorMessage;
        } else if (typeof data === 'string') {
          errorMessage = data || errorMessage;
        }
        
        return {
          success: false,
          error: errorMessage,
        };
      }

      return {
        success: true,
        data: data as T,
      };
    } catch (error) {
      console.error('📡 AI API Response parsing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse response',
      };
    }
  }

  // Analyze email content and create events
  async analyzeEmail(emailContent: string, childId?: number): Promise<ApiResponse<EmailAnalysisResponse>> {
    try {
      console.log('📧 Analyzing email content...', { 
        contentLength: emailContent.length,
        childId 
      });

      const requestBody = {
        emailContent,
        ...(childId && { childId })
      };

      console.log('📤 AI Email Analysis Request:', requestBody);

      const response = await axios.post<BackendEnvelope<EmailAnalysisResponse>>(
        `${this.baseUrl}/analyze-email`,
        requestBody,
        { headers: this.getAuthHeaders() }
      );

      const result = await this.handleResponse<BackendEnvelope<EmailAnalysisResponse>>(response);
      
      if (result.success && result.data) {
        const envelope = result.data as BackendEnvelope<EmailAnalysisResponse>;
        
        // Check if the envelope has the expected structure
        if (envelope.success && envelope.data) {
          return { success: true, data: envelope.data };
        } else {
          return { success: false, error: envelope.msg || 'Backend returned unsuccessful response' };
        }
      }
      return { success: false, error: result.error || 'Failed to analyze email' };
    } catch (error) {
      console.error('❌ Email analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  // Analyze image content and create events
  async analyzeImage(imageFile: File, childId?: number): Promise<ApiResponse<PhotoAnalysisResponse>> {
    try {
      console.log('📷 Analyzing image...', { 
        fileName: imageFile.name,
        fileSize: imageFile.size,
        childId 
      });

      const formData = new FormData();
      formData.append('photo', imageFile);
      if (childId) {
        formData.append('childId', childId.toString());
      }

      console.log('📤 AI Photo Analysis Request:', { 
        fileName: imageFile.name,
        childId 
      });

      // For FormData, we need to exclude Content-Type and let axios set it with boundary
      const token = getCookie('auth_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
      };

      const response = await axios.post<BackendEnvelope<PhotoAnalysisResponse>>(
        `${this.baseUrl}/analyze-photo`,
        formData,
        { headers }
      );

      const result = await this.handleResponse<BackendEnvelope<PhotoAnalysisResponse>>(response);
      
      if (result.success && result.data) {
        const envelope = result.data as BackendEnvelope<PhotoAnalysisResponse>;
        
        // Check if the envelope has the expected structure
        if (envelope.success && envelope.data) {
          return { success: true, data: envelope.data };
        } else {
          return { success: false, error: envelope.msg || 'Backend returned unsuccessful response' };
        }
      }
      return { success: false, error: result.error || 'Failed to analyze image' };
    } catch (error) {
      console.error('❌ Image analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }
}

// Export singleton instance
export const aiAssistantApiService = new AIAssistantApiService();
export default aiAssistantApiService;
