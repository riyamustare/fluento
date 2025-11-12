import React from 'react';

export default function FeedbackCard({ feedback, xpGained }) {
  const getScoreColor = (score) => {
    if (score >= 8) return 'from-green-500 to-emerald-600';
    if (score >= 6) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  const getScoreLabel = (score) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    return 'Needs Work';
  };

  const scores = [
    { label: 'Grammar', score: feedback.grammar_score },
    { label: 'Vocabulary', score: feedback.vocabulary_score },
    { label: 'Fluency', score: feedback.fluency_score },
    { label: 'Topic Relevance', score: feedback.topic_relevance_score },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-2xl w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 app-heading">Great Job!</h1>
        <p className="text-gray-600 app-subtitle">Here's your detailed feedback:</p>
      </div>

      {/* Scores Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {scores.map((item) => (
          <div key={item.label} className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">{item.label}</h3>
            <div className="flex items-end gap-4 mb-3">
              <span className="text-4xl font-bold text-gray-800">{item.score.toFixed(1)}</span>
              <span className="text-sm text-gray-600 mb-1">/10</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full bg-linear-to-r ${getScoreColor(item.score)}`}
                style={{ width: `${(item.score / 10) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs mt-2 text-gray-600">{getScoreLabel(item.score)}</p>
          </div>
        ))}
      </div>

      {/* Average Score */}
      <div className="bg-linear-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6 mb-8 text-center">
        <div className="text-sm font-semibold mb-2">Average Score</div>
        <div className="text-5xl font-bold mb-1">
          {((scores.reduce((sum, s) => sum + s.score, 0) / scores.length) || 0).toFixed(1)}/10
        </div>
      </div>

      {/* XP Earned */}
      <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6 mb-8 text-center">
        <p className="text-gray-700 font-semibold mb-2">XP Earned</p>
        <p className="text-4xl font-bold text-green-600">+{xpGained || 0} XP</p>
      </div>

      {/* Feedback Text */}
      <div className="bg-blue-50 rounded-xl p-6 mb-8">
          <h4 className="font-bold text-gray-800 mb-3">AI Feedback</h4>
          <p className="text-gray-700 leading-relaxed">{feedback.feedback}</p>
        </div>

      {/* Transcript */}
      {feedback.transcript && (
        <div className="bg-gray-50 rounded-xl p-6">
          <h4 className="font-bold text-gray-800 mb-3">Your Transcript</h4>
          <p className="text-gray-700 leading-relaxed italic">{feedback.transcript}</p>
        </div>
      )}
    </div>
  );
}
