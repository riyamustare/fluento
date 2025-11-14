import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';
import { aiAPI, feedbackAPI } from '../utils/api';
import Recorder from '../components/Recorder';
import Teleprompter from '../components/Teleprompter';

export default function LevelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getLevelById } = useProgress();
  const [level, setLevel] = useState(null);
  const [mode, setMode] = useState(null); // 'continue' or 'read'
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [language, setLanguage] = useState('English');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const transcriptEndRef = React.useRef(null);
  const timerRef = React.useRef(null);

  // Auto-scroll transcript to bottom when new text arrives
  React.useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Reset timer when recording stops; reset transcript when starting new recording
  useEffect(() => {
    if (!isRecording) {
      setElapsedTime(0);
      // Don't reset transcript - keep it for display after recording stops
    } else {
      // Clear transcript when starting new recording
      setTranscript('');
    }
  }, [isRecording]);

  useEffect(() => {
    let isMounted = true;

    const loadLevel = async () => {
      try {
        const preferences = JSON.parse(sessionStorage.getItem('preferences') || '{}');
        setLanguage(preferences.language || 'English');
        
        // Get level data
        const levelData = await getLevelById(id);
        if (!isMounted) return;
        
        if (!levelData) {
          console.log('[LevelDetailPage] Level not found, redirecting');
          navigate('/', { replace: true });
          return;
        }
        
        setLevel(levelData);
        setLoading(false);
      } catch (error) {
        console.error('[LevelDetailPage] Error loading level:', error);
        if (isMounted) {
          navigate('/', { replace: true });
        }
      }
    };

    loadLevel();

    return () => {
      isMounted = false;
    };
  }, [id, getLevelById, navigate]);

  const handleRecordingComplete = async (chunks) => {
    if (chunks.length === 0) {
      alert('No audio recorded');
      return;
    }

    setAnalyzing(true);
    try {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');
      formData.append('topic', level.topic);

      const endpoint = mode === 'continue' ? aiAPI.analyzeSpeech : aiAPI.analyzeReading;
      const response = await endpoint(formData);
      const analysis = response.data;

      // Calculate XP (max 25 per exercise)
      const avgScore =
        (analysis.grammar_score +
          analysis.vocabulary_score +
          analysis.fluency_score +
          analysis.topic_relevance_score) /
        4;
      const xp = Math.min(Math.round(avgScore * 2.5), 25);

      // Save feedback
      await feedbackAPI.save({
        level_id: level.id,
        transcript: analysis.transcript || '',
        grammar_score: analysis.grammar_score,
        vocabulary_score: analysis.vocabulary_score,
        fluency_score: analysis.fluency_score,
        topic_relevance_score: analysis.topic_relevance_score,
        feedback_text: analysis.feedback,
        xp_earned: xp,
      });

      // Navigate to results
      navigate('/results', { state: { feedback: analysis, xp, levelId: level.id } });
    } catch (error) {
      console.error('Error analyzing speech:', error);
      alert('Failed to analyze your speech. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-xl text-gray-700">Loading level...</p>
        </div>
      </div>
    );
  }

  if (!level) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl text-gray-700">Level not found</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Back to Levels
          </button>
        </div>
      </div>
    );
  }

  if (!mode) {
    return (
      <div className="min-h-screen bg-gray-50 p-20">
        <div className="max-w-3xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="mb-6 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-semibold"
          >
            return to home
          </button>

          {/* Level Header */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-gray-700 mb-4 app-heading">{level.topic}</h2>
            <p className="text-gray-600">
              You have 5 minutes to complete this exercise. Choose your preferred mode below.
            </p>
          </div>

          {/* Mode Selection - Stack vertically */}
          <div className="flex flex-col gap-6">
            {/* Continue Mode */}
            <div className="bg-white p-8 hover:shadow-lg transition-all cursor-pointer rounded-lg"
              onClick={() => setMode('continue')}>
              <h3 className="text-2xl font-bold text-black mb-3">Continue</h3>
              <p className="text-gray-600 mb-4">
                Freely speak about the topic for up to 5 minutes. Let your thoughts flow naturally.
              </p>
              <div className="text-gray-600 font-semibold">Click to Start →</div>
            </div>

            {/* Read Mode */}
            <div className="bg-white p-8 rounded-lg hover:shadow-lg transition-all cursor-pointer"
              onClick={() => setMode('read')}>
              <h3 className="text-2xl font-bold text-black mb-3">Read Mode</h3>
              <p className="text-gray-600 mb-4">
                Read the provided text like a teleprompter while recording. Focus on pronunciation and pacing.
              </p>
              <div className="text-gray-600 font-semibold">Click to Start →</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Format elapsed time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-20 pb-32">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => setMode(null)}
            className="mb-4 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-semibold"
          >
            Change Mode
          </button>
          <h1 className="text-4xl font-bold text-black app-heading">
            {mode === 'continue' ? 'Continue Mode' : 'Read Mode'}
          </h1>
          <p className="text-gray-600 mt-2">{level.topic}</p>
        </div>

        {/* Teleprompter (Read Mode) with Timer */}
        {mode === 'read' && (
          <div className="mb-12">
            
            {/* Teleprompter Content */}
            <Teleprompter 
              text={language === 'German' && level.text_german ? level.text_german : level.text}
              onRecordingStatusChange={setIsRecording}
            />
            {/* Timer - Large, only when recording with smooth transition */}
            <div className={`transition-all duration-300 ${isRecording ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              {isRecording && (
                <div className="text-center mb-8">
                  <h2 className="text-6xl font-bold text-black app-heading">
                    {formatTime(elapsedTime)}
                  </h2>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Continue Mode - Real-time Transcript */}
        {mode === 'continue' && (
          <div className="mb-12">
            
            {/* Real-time Transcript Display - Teleprompter Style */}
            <div className="h-1/3 bg-gray-50 rounded-lg p-6 overflow-y-auto border-2 border-gray-200 min-h-32">
              <div className="text-lg leading-8 text-gray-800 whitespace-pre-wrap font-aeroport">
                {transcript || (isRecording ? 'Listening...' : 'Start speaking to see transcript')}
                <div ref={transcriptEndRef} className="h-0" />
              </div>
            </div>
            {/* Timer - Large, only when recording with smooth transition */}
            <div className={`transition-all duration-300 ${isRecording ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              {isRecording && (
                <div className="text-center mb-8">
                  <h2 className="text-6xl font-bold text-black app-heading">
                    {formatTime(elapsedTime)}
                  </h2>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Start Recording Button at Bottom */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center pointer-events-none">
        <div className="pointer-events-auto">
          <Recorder 
            onRecordingComplete={handleRecordingComplete}
            maxDuration={120}
            onRecordingStart={setIsRecording}
            onTimeUpdate={setElapsedTime}
            onTranscriptUpdate={setTranscript}
            isMinimalMode={true}
          />
        </div>
      </div>

      {/* Analyzing Overlay */}
      {analyzing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center max-w-sm">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-black mb-6"></div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Analyzing Your Speech</h3>
            <p className="text-gray-600 mb-6">We're processing your response with AI...</p>
            
            {/* Progress Steps */}
            <div className="space-y-3 text-left mb-6">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-700">Transcribing audio</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-black"></div>
                <span className="text-sm text-gray-700">Evaluating speech</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-300 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-500">Preparing results</span>
              </div>
            </div>
            
            <p className="text-xs text-gray-500">This usually takes 30-45 seconds</p>
          </div>
        </div>
      )}
    </div>
  );
}
