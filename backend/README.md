# GoWizly Backend API

A comprehensive authentication system for the GoWizly application built with Node.js, Express, and Prisma.

## Features

### 🔐 Complete Authentication System
- **User Registration** with email verification
- **Email/Password Login** with secure password hashing
- **Google OAuth Integration** for social login
- **Password Reset Flow** with secure token-based reset
- **JWT-based Authentication** with 7-day token expiration

### 🛡️ Security Features
- **Rate Limiting** to prevent brute force attacks
- **Input Validation** with comprehensive validation rules
- **Password Security** with bcrypt hashing (12 salt rounds)
- **CORS Protection** with configurable origins
- **Secure Error Handling** that doesn't leak sensitive information

### 📧 Email System
- **Beautiful HTML Email Templates** for all communications
- **Email Verification** with 24-hour token expiration
- **Password Reset Emails** with 1-hour token expiration
- **Welcome Emails** sent after successful verification

### 🔧 Developer Experience
- **Comprehensive API Documentation**
- **Environment Configuration** with .env.example
- **Error Handling Middleware** with detailed logging
- **Health Check Endpoint** for monitoring
- **Prisma ORM** for type-safe database operations

## Quick Start

### 1. Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd gowizlyapp-backend

# Install dependencies
npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 3. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed the database
npx prisma db seed
```

### 4. Start the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication Routes
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify/:token` - Email verification
- `POST /api/auth/resend-verification` - Resend verification email
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user (protected)

### Password Reset Routes
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password

### OAuth Routes
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback

### System Routes
- `GET /api/health` - Health check endpoint

## Environment Variables

Required environment variables (see `.env.example`):

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/gowizly_db"

# JWT
JWT_SECRET="your-super-secure-jwt-secret-key"

# Server
PORT=5000
CLIENT_URL="http://localhost:3000"
SERVER_URL="http://localhost:5000"

# Email (Gmail)
EMAIL_USER="your-gmail@gmail.com"
EMAIL_PASS="your-app-password"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Project Structure

```
src/
├── auth/
│   ├── auth.controller.js    # Authentication controllers
│   └── auth.route.js         # Authentication routes
├── config/
│   ├── db.js                 # Prisma client configuration
│   └── passport.js           # Passport.js OAuth configuration
├── middleware/
│   ├── auth.js               # JWT authentication middleware
│   ├── errorHandler.js       # Global error handling
│   ├── rateLimiter.js        # Rate limiting configuration
│   └── validation.js         # Input validation middleware
├── utils/
│   ├── emailTemplates.js     # HTML email templates
│   ├── generateToken.js      # JWT token generation
│   └── sendEmail.js          # Email sending utility
└── index.js                  # Main application file
```

## User Authentication Flows

### 1. Registration Flow
1. User submits registration form
2. Server validates input and checks for existing users
3. Password is hashed and user is created
4. Verification email is sent
5. User clicks verification link
6. Account is activated and welcome email is sent

### 2. Login Flow
1. User submits email/password
2. Server validates credentials
3. JWT token is generated and returned
4. Client stores token for authenticated requests

### 3. Google OAuth Flow
1. User clicks "Continue with Google"
2. Redirected to Google OAuth consent
3. Google returns user data to callback
4. Server creates/finds user and generates JWT
5. User is redirected to frontend with token

### 4. Password Reset Flow
1. User requests password reset
2. Reset email is sent (if user exists)
3. User clicks reset link
4. New password is submitted and updated
5. User can login with new password

## Rate Limiting

- **Registration:** 3 attempts per hour
- **Login/Auth:** 5 attempts per 15 minutes  
- **Password Reset:** 3 attempts per hour

## Security Considerations

- Passwords are hashed with bcrypt (12 salt rounds)
- JWT tokens expire after 7 days
- Verification tokens expire after 24 hours
- Reset tokens expire after 1 hour
- Rate limiting prevents brute force attacks
- CORS is configured for specific origins only
- Error messages don't reveal sensitive information

## Development

### Scripts
```bash
npm run dev      # Start development server with nodemon
npm start        # Start production server
```

### Database Operations
```bash
npx prisma studio          # Open Prisma Studio
npx prisma generate        # Generate Prisma client
npx prisma migrate dev     # Run migrations
npx prisma db push         # Push schema changes
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
