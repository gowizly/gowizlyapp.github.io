// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Validate required environment variables
if (!API_BASE_URL) {
  console.error('REACT_APP_API_BASE_URL environment variable is required but not set!');
  throw new Error('Missing required environment variable: REACT_APP_API_BASE_URL');
}

// Log the configuration in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 API Configuration:', {
    baseUrl: API_BASE_URL,
    source: 'environment'
  });
}
