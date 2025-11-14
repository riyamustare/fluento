import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';

// Stats Card Component with expandable activity tracker
function StatsCard({ userProgress, userFeedback }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Calculate league based on XP thresholds
  const calculateLeague = (xp) => {
    const leagues = [
      { name: 'Bronze', color: '#CD7F32', minXp: 0 },
      { name: 'Silver', color: '#C0C0C0', minXp: 500 },
      { name: 'Gold', color: '#FFD700', minXp: 1500 },
      { name: 'Diamond', color: '#B9F2FF', minXp: 3000 },
      { name: 'Ace', color: '#FF1493', minXp: 6000 }
    ];
    
    for (let i = leagues.length - 1; i >= 0; i--) {
      if (xp >= leagues[i].minXp) {
        return leagues[i];
      }
    }
    return leagues[0];
  };
  
  // Generate activity data from actual feedback (completion dates)
  const generateActivityData = () => {
    const data = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - 6);
    
    // Round to start of week
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // Create a set of dates when user was active (completed levels)
    const activeDates = new Set();
    if (userFeedback && userFeedback.length > 0) {
      userFeedback.forEach(feedback => {
        if (feedback.created_at) {
          const dateStr = new Date(feedback.created_at).toLocaleDateString();
          activeDates.add(dateStr);
        }
      });
    }
    
    let currentDate = new Date(startDate);
    while (currentDate <= today) {
      const dateStr = currentDate.toLocaleDateString();
      const isActive = activeDates.has(dateStr);
      
      data.push({
        date: new Date(currentDate),
        isActive: isActive
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return data;
  };
  
  const activityData = generateActivityData();
  
  // Calculate stats
  const xp = userProgress?.xp || 0;
  const completedCount = userProgress?.completed_levels?.length || 0;
  const league = calculateLeague(xp);
  
  return (
    <div>
      {/* Stats Grid - 3 columns */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-black">{xp}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide app-subtitle">XP</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-black">{completedCount}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide app-subtitle">Completed</div>
        </div>
        <div className="text-center">
          <div 
            className="text-3xl font-bold" 
            style={{ color: league.color }}
          >
            {league.name}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wide app-subtitle">League</div>
        </div>
      </div>
      
      {/* Expand/Collapse Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-center gap-2 py-3 text-sm text-gray-600 hover:text-black transition-colors app-subtitle"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        {isExpanded ? 'Hide Activity' : 'View Activity'}
      </button>
      
      {/* GitHub-style Activity Tracker */}
      {isExpanded && (
        <div className="mt-4 overflow-x-auto">
          <ActivityTracker data={activityData} />
        </div>
      )}
    </div>
  );
}

// GitHub-style Activity Tracker
function ActivityTracker({ data }) {
  const COLUMN_WIDTH = 20; // bigger column width so grid fills container

  // Build weekly chunks
  const weeks = [];
  let currentWeek = [];

  data.forEach((day, index) => {
    currentWeek.push(day);
    if (day.date.getDay() === 6 || index === data.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  const getColor = (isActive) => {
    return isActive ? "rgba(0,0,0,0.85)" : "rgba(32,36,44,0.08)";
  };

  return (
    <div className="py-2">
      <div className="flex gap-2">
        {/* Day labels */}
        <div className="flex flex-col gap-1.5 justify-between mr-3 mt-[18px]">
          <div className="text-[10px] text-gray-400">Mon</div>
          <div className="text-[10px] text-gray-400">Wed</div>
          <div className="text-[10px] text-gray-400">Fri</div>
          <div className="text-[10px] text-gray-400">Sun</div>
        </div>

        {/* Grid container */}
        <div className="flex-1">

          {/* Month labels */}
          <div className="flex mb-2 h-4">
            {weeks.map((week, weekIndex) => {
              const firstDay = week[0];
              const monthName = firstDay.date.toLocaleString("default", {
                month: "short",
              });

              const shouldShow =
                weekIndex === 0 || firstDay.date.getDate() <= 7;

              return (
                <div
                  key={weekIndex}
                  className="text-[11px] text-gray-400"
                  style={{ width: `${COLUMN_WIDTH}px` }}
                >
                  {shouldShow ? monthName : ""}
                </div>
              );
            })}
          </div>

          {/* Calendar grid */}
          <div className="flex gap-[3px]">
            {weeks.map((week, weekIndex) => (
              <div
                key={weekIndex}
                className="flex flex-col gap-[3px]"
                style={{ width: `${COLUMN_WIDTH}px` }}
              >
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const day = week.find((d) => d.date.getDay() === dayIndex);

                  return (
                    <div
                      key={dayIndex}
                      className="w-4 h-4 rounded-sm transition-all hover:ring-1 hover:ring-gray-500"
                      style={{
                        backgroundColor: day
                          ? getColor(day.isActive)
                          : "transparent",
                      }}
                      title={
                        day
                          ? `${day.date.toLocaleDateString()}: ${
                              day.isActive ? "Active" : "Inactive"
                            }`
                          : ""
                      }
                    ></div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-3 mt-4 text-xs text-gray-500">
        <span className="app-subtitle">Inactive</span>
        <div
          className="w-4 h-4 rounded-sm"
          style={{ backgroundColor: "rgba(32,36,44,0.08)" }}
        ></div>
        <div
          className="w-4 h-4 rounded-sm"
          style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
        ></div>
        <span className="app-subtitle">Active</span>
      </div>
    </div>
  );
}



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
  const { levels, userProgress, userFeedback, error, fetchLevels, fetchUserProgress, fetchUserFeedback, isLevelUnlocked } = useProgress();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        navigate('/landing', { replace: true });
        return;
      }
      try {
        await Promise.all([fetchLevels(), fetchUserProgress(), fetchUserFeedback()]);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
      setLoading(false);
    };
    loadData();
  }, [user, navigate, fetchLevels, fetchUserProgress, fetchUserFeedback]);

  const handleLogout = () => {
    logout();
    navigate('/landing', { replace: true });
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
            <StatsCard userProgress={userProgress} userFeedback={userFeedback} />
          </div>
        )}
      </div>

      {/* Levels List */}
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col gap-5">
          {levels.map((level) => {
            const isUnlocked = isLevelUnlocked(level.id);
            const isCompleted = userProgress?.completed_levels?.includes(level.id);

            const handleLevelClick = (e) => {
              e.preventDefault();
              if (isUnlocked) {
                navigate(`/level/${level.id}`);
              }
            };

            return (
              <div
                key={level.id}
                onClick={handleLevelClick}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleLevelClick(e);
                  }
                }}
                role="button"
                tabIndex={isUnlocked ? 0 : -1}
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
                  <div className="flex-1 pr-4 ">
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