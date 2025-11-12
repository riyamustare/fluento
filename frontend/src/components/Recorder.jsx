import React, { useState, useRef, useEffect } from 'react';

export default function Recorder({ onRecordingComplete, maxDuration = 120, onRecordingStart, onTimeUpdate, onTranscriptUpdate, isMinimalMode = false }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedTime, setRecordedTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const MIN_DURATION = 60; // 1 minute minimum

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US'; // Default to English

      // Track finalized text separately from interim
      recognitionRef.current.finalizedText = '';
      recognitionRef.current.lastFinalIndex = -1;
      
      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let newFinalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            // Only add if we haven't seen this one before
            if (i > recognitionRef.current.lastFinalIndex) {
              newFinalTranscript += transcript + ' ';
              recognitionRef.current.lastFinalIndex = i;
            }
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Append only NEW final results to finalized text
        if (newFinalTranscript) {
          recognitionRef.current.finalizedText += newFinalTranscript;
        }
        
        // Display: finalized text + interim preview
        if (onTranscriptUpdate) {
          const displayText = recognitionRef.current.finalizedText + interimTranscript;
          onTranscriptUpdate(displayText.trim());
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.warn('[Speech Recognition] Error:', event.error);
      };
    }
  }, [onTranscriptUpdate]);

  useEffect(() => {
    if (isRecording && recordedTime >= maxDuration) {
      stopRecording();
    }
  }, [recordedTime, isRecording, maxDuration]);

  // Notify parent of time updates
  useEffect(() => {
    if (onTimeUpdate && isRecording) {
      onTimeUpdate(recordedTime);
    }
  }, [recordedTime, isRecording, onTimeUpdate]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordedTime(0);

      // Start speech recognition for real-time transcript
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          console.log('[Speech Recognition] Started');
        } catch (err) {
          console.warn('[Speech Recognition] Failed to start:', err);
        }
      }

      // Notify parent that recording has started
      if (onRecordingStart) {
        onRecordingStart(true);
      }

      timerRef.current = setInterval(() => {
        setRecordedTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Please allow microphone access to record');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      // Check minimum duration
      if (recordedTime < MIN_DURATION) {
        alert(`Please record for at least ${Math.ceil(MIN_DURATION / 60)} minute(s). Current: ${formatTime(recordedTime)}`);
        return;
      }

      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);

      // Stop speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          console.log('[Speech Recognition] Stopped');
        } catch (err) {
          console.warn('[Speech Recognition] Failed to stop:', err);
        }
      }

      // Notify parent that recording has stopped
      if (onRecordingStart) {
        onRecordingStart(false);
      }

      // Call the callback after a brief delay to ensure blob is set
      setTimeout(() => {
        onRecordingComplete(chunksRef.current);
      }, 500);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (recordedTime / maxDuration) * 100;
  const canStop = recordedTime >= MIN_DURATION;

  // Minimal mode - only show the start button
  if (isMinimalMode) {
    return (
      <div className="flex gap-4 justify-center">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="px-12 py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-all shadow-lg text-lg"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            disabled={!canStop}
            className={`px-12 py-3 text-white font-bold rounded-lg transition-all text-lg ${
              canStop
                ? 'bg-red-500 hover:bg-red-600 cursor-pointer'
                : 'bg-gray-400 cursor-not-allowed opacity-50'
            }`}
          >
            Stop Recording
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Record Your Response</h3>

      {/* Timer */}
      <div className="text-center mb-8">
        <div className="text-5xl font-bold text-blue-600 mb-2">{formatTime(recordedTime)}</div>
        <p className="text-gray-600">
          Minimum: {formatTime(MIN_DURATION)} | Max: {formatTime(maxDuration)}
          {recordedTime < MIN_DURATION && (
            <span className="block text-red-600 font-semibold mt-1">
              Keep recording for {formatTime(MIN_DURATION - recordedTime)} more
            </span>
          )}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${
              progress > 80 ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 justify-center">
        {!isRecording ? (
          <>
            <button
              onClick={startRecording}
              className="px-8 py-4 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-all flex items-center gap-2"
            >
              Start Recording
            </button>
          </>
        ) : (
          <>
            <button
              onClick={stopRecording}
              disabled={!canStop}
              className={`px-8 py-4 text-white font-bold rounded-lg transition-all flex items-center gap-2 ${
                canStop
                  ? 'bg-red-500 hover:bg-red-600 cursor-pointer'
                  : 'bg-gray-400 cursor-not-allowed opacity-50'
              }`}
            >
              Stop Recording {!canStop && `(${formatTime(MIN_DURATION - recordedTime)})`}
            </button>
          </>
        )}
      </div>

      {/* Recording Status */}
      {isRecording && (
        <div className="mt-6 text-center">
          <div className="inline-block">
            <span className="inline-block w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></span>
            <span className="text-red-600 font-semibold">Recording...</span>
          </div>
        </div>
      )}
    </div>
  );
}
