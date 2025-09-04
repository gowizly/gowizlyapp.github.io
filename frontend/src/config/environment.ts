// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Validate required environment variables
if (!API_BASE_URL) {
  console.error('❌ REACT_APP_API_BASE_URL environment variable is required but not set!');
  console.error('📋 Please create a .env file with: REACT_APP_API_BASE_URL=http://localhost:5000');
  throw new Error('Missing required environment variable: REACT_APP_API_BASE_URL');
}

// Log the configuration in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 API Configuration:', {
    baseUrl: API_BASE_URL,
    source: 'environment'
  });
}
