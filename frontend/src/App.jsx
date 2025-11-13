import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProgressProvider } from './context/ProgressContext';

// Pages
import LandingPage from './pages/LandingPage';
import SelectPage from './pages/SelectPage';
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
    return <Navigate to="/login" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ProgressProvider>
              <LevelsDashboard />
            </ProgressProvider>
          </ProtectedRoute>
        }
      />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/select" element={<SelectPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
      {/* legacy /levels path redirected to root */}
      <Route path="/levels" element={<Navigate to="/" replace />} />
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
