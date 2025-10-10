import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import LoginPage from "./components/auth/LoginPage";
import SignupPage from "./components/auth/SignupPage";
import FamilyCalendarApp from "./components/calendar/FamilyCalendar";
import UserManagement from "./components/auth/UserManagement";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";
import OAuthCallback from "./components/auth/OAuthCallback";
import ErrorBoundary from "./components/common/ErrorBoundary";
import EmailVerificationPage from "./components/auth/EmailVerification";
import VerificationResendPage from "./components/auth/VerificationResendPage";
import ToastContainer from "./components/common/ToastContainer";
import { EmailFilterSetup } from "./components/emailFilter";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-purple-500 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-purple-500 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
};

const UserManagementWrapper: React.FC = () => {
  const navigate = useNavigate();

  return <UserManagement onBack={() => navigate("/")} />;
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ToastProvider>
            <div className="App">
              <Routes>
                {/* Protected Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <EmailFilterSetup />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/user-management"
                  element={
                    <ProtectedRoute>
                      <UserManagementWrapper />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/calendar"
                  element={
                    <ProtectedRoute>
                      <FamilyCalendarApp />
                    </ProtectedRoute>
                  }
                />

                {/* Public Routes */}
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <LoginPage />
                    </PublicRoute>
                  }
                />

                <Route
                  path="/signup"
                  element={
                    <PublicRoute>
                      <SignupPage />
                    </PublicRoute>
                  }
                />

                <Route
                  path="/forgot-password"
                  element={
                    <PublicRoute>
                      <ForgotPassword />
                    </PublicRoute>
                  }
                />

                <Route
                  path="/reset-password/:token"
                  element={<ResetPassword />}
                />

                <Route
                  path="/verify/:token"
                  element={<EmailVerificationPage />}
                />

                <Route
                  path="/resend-verification"
                  element={
                    <PublicRoute>
                      <VerificationResendPage />
                    </PublicRoute>
                  }
                />

                <Route path="/auth/callback" element={<OAuthCallback />} />

                <Route path="/auth/success" element={<OAuthCallback />} />

                <Route path="/auth/error" element={<OAuthCallback />} />

                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <ToastContainer />
            </div>
          </ToastProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
