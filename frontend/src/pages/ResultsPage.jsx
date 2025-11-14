import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';
import { useAuth } from '../context/AuthContext';
import FeedbackCard from '../components/FeedbackCard';

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchUserProgress } = useProgress();
  const [showConfetti, setShowConfetti] = useState(true);

  const feedback = location.state?.feedback;
  const xp = location.state?.xp;
  const levelId = location.state?.levelId;

  useEffect(() => {
    if (!feedback || !xp) {
      navigate('/');
      return;
    }

    // Trigger confetti animation
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, [feedback, xp, navigate]);

  const handleContinue = async () => {
    await fetchUserProgress();
    navigate('/');
  };

  if (!feedback || !xp) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="fixed w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `fall ${2 + Math.random() * 2}s linear forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>

      <div className="flex flex-col items-center gap-8">
        {/* Feedback Card */}
        <FeedbackCard feedback={feedback} xpGained={xp} />

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          className="px-8 py-4 bg-linear-to-r from-green-500 to-emerald-600 text-white font-bold text-lg rounded-xl hover:shadow-xl transform hover:scale-105 transition-all"
        >
          Continue to Dashboard
        </button>
      </div>
    </div>
  );
}
