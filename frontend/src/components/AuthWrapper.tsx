import React, { useState } from 'react';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import EmailVerificationPage from './EmailVerificationPage';
import PasswordResetPage from './PasswordResetPage';

type AuthMode = 'login' | 'signup' | 'email-verification' | 'password-reset';

const AuthWrapper: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [verificationEmail] = useState('');

  // Show appropriate auth page based on current mode
  switch (authMode) {
    case 'login':
      return (
        <LoginPage 
          onSwitchToSignup={() => setAuthMode('signup')} 
          onForgotPassword={() => setAuthMode('password-reset')}
        />
      );
    case 'signup':
      return (
        <SignupPage 
          onSwitchToLogin={() => setAuthMode('login')}
        />
      );
    case 'email-verification':
      return (
        <EmailVerificationPage 
          email={verificationEmail}
          onBackToLogin={() => setAuthMode('login')}
        />
      );
    case 'password-reset':
      return (
        <PasswordResetPage 
          onBackToLogin={() => setAuthMode('login')}
        />
      );
    default:
      return (
        <LoginPage 
          onSwitchToSignup={() => setAuthMode('signup')} 
          onForgotPassword={() => setAuthMode('password-reset')}
        />
      );
  }
};

export default AuthWrapper;
