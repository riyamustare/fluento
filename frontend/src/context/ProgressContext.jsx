import React, { createContext, useContext, useState, useCallback } from 'react';
import { levelsAPI, feedbackAPI } from '../utils/api';

const ProgressContext = createContext();

export const ProgressProvider = ({ children }) => {
  const [levels, setLevels] = useState([]);
  const [userProgress, setUserProgress] = useState(null);
  const [userFeedback, setUserFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLevels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await levelsAPI.getAll();
      setLevels(response.data);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to fetch levels';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserProgress = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await levelsAPI.getUserProgress();
      setUserProgress(response.data);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to fetch progress';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserFeedback = useCallback(async () => {
    try {
      const response = await feedbackAPI.getAllUserFeedback();
      setUserFeedback(response.data || []);
      return response.data || [];
    } catch (err) {
      console.error('Failed to fetch user feedback:', err);
      return [];
    }
  }, []);

  const getLevelById = useCallback(async (id) => {
    try {
      const response = await levelsAPI.getById(id);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to fetch level';
      setError(message);
      return null;
    }
  }, []);

  const isLevelUnlocked = (levelId) => {
    if (!userProgress) return false;
    if (levelId === 1) return true;
    const completedLevels = userProgress.completed_levels || [];
    return completedLevels.includes(levelId - 1);
  };

  return (
    <ProgressContext.Provider
      value={{
        levels,
        userProgress,
        userFeedback,
        loading,
        error,
        fetchLevels,
        fetchUserProgress,
        fetchUserFeedback,
        getLevelById,
        isLevelUnlocked,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within ProgressProvider');
  }
  return context;
};
