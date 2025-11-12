import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SelectPage() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('English');
  const [focusArea, setFocusArea] = useState('Grammar');
  const [difficulty, setDifficulty] = useState(1);

  const handleContinue = () => {
    // Store preferences in sessionStorage or pass via state
    sessionStorage.setItem(
      'preferences',
      JSON.stringify({ language, focusArea, difficulty })
    );
    navigate('/signup');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center app-heading">
          Customize Your Learning
        </h1>

        {/* Language Selection */}
        <div className="mb-8">
          <label className="block text-lg font-semibold text-gray-700 mb-3">
            Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option>English</option>
            <option>German</option>
          </select>
        </div>

        {/* Focus Area Selection */}
        <div className="mb-8">
          <label className="block text-lg font-semibold text-gray-700 mb-3">
            Focus Area
          </label>
          <select
            value={focusArea}
            onChange={(e) => setFocusArea(e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option>Grammar</option>
            <option>Vocabulary</option>
            <option>Fluency</option>
            <option>Pronunciation</option>
            <option>All</option>
          </select>
        </div>

        {/* Difficulty Selection */}
        <div className="mb-10">
          <label className="block text-lg font-semibold text-gray-700 mb-4">
            Difficulty Level
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                  difficulty === level
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleContinue}
          className="w-full py-4 bg-linear-to-r from-blue-500 to-purple-600 text-white font-bold text-lg rounded-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
