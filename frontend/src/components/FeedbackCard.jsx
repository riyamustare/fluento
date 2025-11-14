import React, { useState } from 'react';

export default function FeedbackCard({ feedback, xpGained }) {
  const [expandedSection, setExpandedSection] = useState(null);

  const getScoreColor = (score) => {
    if (score >= 8) return { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', label: 'Excellent' };
    if (score >= 6) return { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', label: 'Good' };
    return { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', label: 'Keep improving' };
  };

  const getScoreEmoji = (score) => {
    if (score >= 8) return '✨';
    if (score >= 6) return '👍';
    return '📈';
  };

  const scores = [
    { label: 'Grammar', score: feedback.grammar_score, emoji: '✏️', tips: feedback.grammar_tips || [] },
    { label: 'Vocabulary', score: feedback.vocabulary_score, emoji: '📚', tips: [] },
    { label: 'Fluency', score: feedback.fluency_score, emoji: '🎤', tips: feedback.fluency_tips || [] },
    { label: 'Topic Relevance', score: feedback.topic_relevance_score, emoji: '🎯', tips: [] },
  ];

  const averageScore = (scores.reduce((sum, s) => sum + s.score, 0) / scores.length).toFixed(1);
  const scoreColor = getScoreColor(averageScore);

  const ScoreCard = ({ item }) => {
    const color = getScoreColor(item.score);
    const hasTips = item.tips && item.tips.length > 0;
    const isExpanded = expandedSection === item.label;

    return (
      <div className={`${color.bg} border-2 ${color.border} rounded-xl p-6 transition-all`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-3xl">{item.emoji}</span>
            <div>
              <h3 className="text-lg font-bold text-gray-800">{item.label}</h3>
              <p className={`text-sm ${color.text}`}>{color.label}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-gray-800">{item.score.toFixed(1)}</div>
            <div className="text-xs text-gray-600">/10</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
          <div
            className={`h-full bg-linear-to-r ${color.border === 'border-green-300' ? 'from-green-400 to-green-600' : color.border === 'border-yellow-300' ? 'from-yellow-400 to-yellow-600' : 'from-orange-400 to-orange-600'}`}
            style={{ width: `${(item.score / 10) * 100}%` }}
          ></div>
        </div>

        {/* Tips Section */}
        {hasTips && (
          <div>
            <button
              onClick={() => setExpandedSection(isExpanded ? null : item.label)}
              className="w-full text-left flex items-center justify-between py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
            >
              <span>💡 {item.tips.length} Improvement Tips</span>
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>

            {isExpanded && (
              <div className="mt-3 space-y-2 border-t pt-3">
                {item.tips.map((tip, idx) => (
                  <div key={idx} className="flex gap-2 text-sm text-gray-700">
                    <span className="text-lg">→</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-3xl w-full">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="text-5xl mb-4">{getScoreEmoji(averageScore)}</div>
        <h1 className="text-4xl font-bold text-black mb-2 app-heading">Great Job!</h1>
        <p className="text-gray-600">Here's how you performed:</p>
      </div>

      {/* Average Score Card */}
      <div className={`${scoreColor.bg} border-2 ${scoreColor.border} rounded-xl p-8 mb-8 text-center`}>
        <div className="text-sm font-semibold text-gray-700 mb-2">Overall Performance</div>
        <div className="text-5xl font-bold text-gray-800 mb-2">{averageScore}/10</div>
        <div className={`text-lg font-semibold ${scoreColor.text}`}>{scoreColor.label}</div>
      </div>

      {/* Scores Grid */}
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        {scores.map((item) => (
          <ScoreCard key={item.label} item={item} />
        ))}
      </div>

      {/* Summary Feedback */}
      {feedback.summary && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 mb-8">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>📝</span> Summary
          </h4>
          <p className="text-gray-700 leading-relaxed">{feedback.summary}</p>
        </div>
      )}

      {/* Legacy feedback fallback */}
      {!feedback.summary && feedback.feedback && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 mb-8">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>📝</span> AI Feedback
          </h4>
          <p className="text-gray-700 leading-relaxed">{feedback.feedback}</p>
        </div>
      )}

      {/* XP Earned */}
      <div className="bg-green-50 border-2 border-green-400 rounded-xl p-6 mb-8 text-center">
        <p className="text-gray-700 font-semibold mb-2 flex items-center justify-center gap-2">
          <span>⭐</span> XP Earned
        </p>
        <p className="text-4xl font-bold text-green-600">+{xpGained || 0} XP</p>
      </div>

      {/* Transcript */}
      {feedback.transcript && (
        <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-6">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>🎙️</span> Your Transcript
          </h4>
          <p className="text-gray-700 leading-relaxed italic">{feedback.transcript}</p>
        </div>
      )}
    </div>
  );
}
