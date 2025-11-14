import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProgressProvider } from './context/ProgressContext';

// Pages
import LandingPage from './pages/LandingPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import LevelsDashboard from './pages/LevelsDashboard';
import LevelDetailPage from './pages/LevelDetailPage';
import ResultsPage from './pages/ResultsPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-xl text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/landing" replace />;
  }

  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Root route - show Landing for non-authenticated, Dashboard for authenticated */}
      <Route
        path="/"
        element={
          user ? (
            <ProgressProvider>
              <LevelsDashboard />
            </ProgressProvider>
          ) : (
            <LandingPage />
          )
        }
      />
      {/* Legacy /landing route for backwards compatibility */}
      <Route
        path="/landing"
        element={user ? <Navigate to="/" replace /> : <LandingPage />}
      />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
      {/* Level detail page - protected route with ProgressProvider */}
      <Route
        path="/level/:id"
        element={
          <ProtectedRoute>
            <ProgressProvider>
              <LevelDetailPage />
            </ProgressProvider>
          </ProtectedRoute>
        }
      />
      {/* Results page - protected route with ProgressProvider */}
      <Route
        path="/results"
        element={
          <ProtectedRoute>
            <ProgressProvider>
              <ResultsPage />
            </ProgressProvider>
          </ProtectedRoute>
        }
      />
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
      <Analytics />
    </Router>
  );
}
