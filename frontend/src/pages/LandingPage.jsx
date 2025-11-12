import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      // If logged in, go directly to levels
  navigate('/');
    } else {
      // Otherwise go to selection
      navigate('/select');
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
      <div className="text-center text-white px-6">
        {user && (
          <p className="text-3xl font-bold mb-4 app-subtitle">
            Welcome, {user.first_name}!
          </p>
        )}
        <h1 className="text-6xl font-bold mb-4 app-heading">AI Speaking Practice</h1>
        <p className="text-2xl mb-8 font-light">
          Master English Speaking with AI-Powered Feedback
        </p>
        <p className="text-lg mb-12 max-w-2xl mx-auto">
          Practice on engaging topics, get real-time grammar, vocabulary, fluency,
          and relevance feedback, and track your progress with XP.
        </p>
        <button
          onClick={handleGetStarted}
          className="px-8 py-4 bg-white text-purple-600 font-bold text-lg rounded-full hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
        >
          {user ? 'Continue to Levels →' : 'Get Started →'}
        </button>
      </div>
    </div>
  );
}
