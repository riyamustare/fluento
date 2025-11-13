import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';

// Helper: render a title for a level. If a custom title exists and isn't the generic
// 'Introduce Yourself', show it; otherwise use the topic as the title.
function LevelTitle({ level }) {
  const topic = level.topic || `Level ${level.id}`;
  const useTitle = level.title && level.title.trim().length > 0 && level.title.toLowerCase() !== 'introduce yourself';
  const titleText = useTitle ? level.title : topic;

  return (
    <h3 className="text-xl font-bold text-black mb-2 font-casino">
      {titleText}
    </h3>
  );
}

// Helper: produce a short, customized description when none is provided. We scale
// wording by level id to suggest increasing complexity.
function LevelDescription({ level }) {
  if (level.description && level.description.trim().length > 0) {
    return (
      <p
        className="text-gray-600 text-sm mb-4"
        style={{
          lineHeight: '1.6',
        }}
      >
        {level.description}
      </p>
    );
  }

  const topic = level.topic || 'this topic';
  let desc = '';
  const id = Number(level.id) || 0;

  if (id <= 5) {
    desc = `${topic} using short, clear sentences. Focus on simple vocabulary and accurate pronunciation.`;
  } else if (id <= 12) {
    desc = `${topic} with examples and linking words. Work on fluency, coherence, and varied vocabulary.`;
  } else if (id <= 18) {
    desc = `${topic}. Emphasize clarity, transitions, and richer vocabulary.`;
  } else {
    desc = `${topic}. Show planning, nuance, and advanced language use.`;
  }

  return (
    <p
      className="text-gray-600 text-sm mb-4"
      style={{
        lineHeight: '1.6',
      }}
    >
      {desc}
    </p>
  );
}

export default function LevelsDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { levels, userProgress, error, fetchLevels, fetchUserProgress, isLevelUnlocked } = useProgress();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      try {
        await Promise.all([fetchLevels(), fetchUserProgress()]);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
      setLoading(false);
    };
    loadData();
  }, [user, navigate, fetchLevels, fetchUserProgress]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-xl text-gray-700">Loading your levels...</p>
        </div>
      </div>
    );
  }

  if (error || levels.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600 font-semibold">Unable to load levels</p>
          <p className="text-gray-600 mt-2">{error || 'No levels available'}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-20">
      {/* Header */}
      <div className="max-w-3xl mx-auto mb-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-black app-heading">hey {user?.first_name}!</h1>
            <p className="text-lg text-gray-600 mt-2 app-subtitle">each conversation brings you closer to fluency</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-semibold transition-all"
          >
            Logout
          </button>
        </div>

        {/* Popular Guides Header */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide app-subtitle">TRACK YOUR PROGRESS</h4>
        </div>

        {/* XP Progress */}
        {userProgress && (
          <div className="bg-white rounded-xl p-6 mb-6" style={{ boxShadow: 'rgba(0, 0, 0, 0.12) 0px 12px 32px -1px' }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-base font-semibold text-gray-900 app-subtitle">Total XP: {userProgress.total_xp || 0}</span>
              <span className="text-sm text-gray-600 app-subtitle">{userProgress.completed_levels?.length || 0} Completed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-black h-3 rounded-full transition-all duration-500"
                style={{ width: `${((userProgress.completed_levels?.length || 0) / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Levels List */}
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col gap-5">
          {levels.map((level) => {
            const isUnlocked = isLevelUnlocked(level.id);
            const isCompleted = userProgress?.completed_levels?.includes(level.id);

            return (
              <div
                key={level.id}
                onClick={() => isUnlocked && navigate(`/level/${level.id}`)}
                className={`group p-6 
                  ${isUnlocked ? 'cursor-pointer bg-white' : 'opacity-50 cursor-not-allowed bg-gray-100'} 
                  ${isCompleted ? 'ring-2 ring-green-500' : ''}`}
                style={{
                  borderRadius: '12px',
                  boxShadow: isUnlocked ? 'rgba(0, 0, 0, 0.12) 0px 12px 20px -5px' : 'rgba(0, 0, 0, 0.06) 0px 6px 12px -3px',
                  opacity: isUnlocked ? 1 : 0.6,
                  willChange: 'auto',
                  transition: isUnlocked ? 'box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (isUnlocked) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'rgba(0, 0, 0, 0.16) 0px 16px 32px -5px';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isUnlocked) {
                    e.currentTarget.style.transform = 'translateY(0px)';
                    e.currentTarget.style.boxShadow = 'rgba(0, 0, 0, 0.12) 0px 12px 20px -5px';
                  }
                }}
              >
                <div className="flex justify-between items-start">
                  {/* Left Side - Content */}
                  <div className="flex-1 pr-4">
                      {/** Title and description helpers: use provided title/description if available, otherwise derive from topic and level id */}
                      <LevelTitle level={level} />
                      <LevelDescription level={level} />
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}