import React, { useState, useRef, useEffect } from 'react';

export default function Teleprompter({ text, isScrolling = true, onRecordingStatusChange }) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true); // Always start with autoscroll on
  const textContainerRef = useRef(null);
  const animationRef = useRef(null);

  // Debug: Log the text being received
  useEffect(() => {
    console.log('[Teleprompter] Text received:', text);
    console.log('[Teleprompter] Text length:', text?.length);
  }, [text]);

  // Auto-scroll effect - constant smooth scroll at 60px per second
  useEffect(() => {
    if (!isAutoScrolling || !textContainerRef.current) return;

    const scroll = () => {
      const container = textContainerRef.current;
      if (container) {
        const maxScroll = container.scrollHeight - container.clientHeight;
        setScrollPosition((prev) => {
          const newPosition = prev + (60 / 1000) * 16; // Smooth scroll at 60px/s
          if (newPosition >= maxScroll) {
            setIsAutoScrolling(false);
            return maxScroll;
          }
          return newPosition;
        });
      }
      animationRef.current = requestAnimationFrame(scroll);
    };

    animationRef.current = requestAnimationFrame(scroll);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAutoScrolling]);

  useEffect(() => {
    if (textContainerRef.current) {
      textContainerRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition]);

  const handleScroll = (e) => {
    setScrollPosition(e.target.scrollTop);
  };

  return (
    <div className="relative">
      {/* Text Container - 1/3 screen height */}
      <div
        ref={textContainerRef}
        onScroll={handleScroll}
        className="h-1/3 bg-gray-50 rounded-lg p-6 overflow-y-auto border-2 border-gray-200"
      >
        <div className="text-lg leading-8 text-gray-800 whitespace-pre-wrap">{text}</div>
      </div>
    </div>
  );
}
