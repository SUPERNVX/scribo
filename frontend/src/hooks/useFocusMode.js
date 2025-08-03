// Custom hook for Focus Mode functionality
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';

import { useAuth } from '../contexts/AuthContext';
import useGamification from './useGamification';

/**
 * Custom hook for managing focus mode sessions and configuration
 */
export const useFocusMode = () => {
  const { user } = useAuth();
  const { recordFocusSession } = useGamification();
  const [focusSession, setFocusSession] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [wordsWritten, setWordsWritten] = useState(0);
  const [productivity, setProductivity] = useState(0);
  const [distractions, setDistractions] = useState(0);
  
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const initialWordCountRef = useRef(0);

  // Default configuration
  const [config, setConfig] = useState({
    hideUI: false,
    enableAmbientSounds: true,
    showWordCount: true,
    enableBreakReminders: true,
    breakInterval: 25, // minutes
    customTheme: {
      backgroundColor: '#f9fafb',
      textColor: '#1f2937',
      fontSize: '18px',
      lineHeight: '1.7',
    },
    ambientSoundType: 'rain',
    ambientVolume: 0.3,
  });

  /**
   * Load configuration from localStorage
   */
  useEffect(() => {
    if (user) {
      try {
        const savedConfig = localStorage.getItem(`focus_config_${user.id}`);
        if (savedConfig) {
          setConfig(prevConfig => ({
            ...prevConfig,
            ...JSON.parse(savedConfig),
          }));
        }
      } catch (error) {
        console.error('Error loading focus config:', error);
      }
    }
  }, [user]);

  /**
   * Save configuration to localStorage
   */
  const updateConfig = useCallback((updates) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    
    if (user) {
      try {
        localStorage.setItem(`focus_config_${user.id}`, JSON.stringify(newConfig));
      } catch (error) {
        console.error('Error saving focus config:', error);
      }
    }
  }, [config, user]);

  /**
   * Calculate productivity score based on activity patterns
   */
  const calculateProductivity = useCallback((session, currentTime) => {
    if (!session || !session.startTime) return 0;

    const sessionDuration = (currentTime - session.startTime) / 1000; // in seconds
    const expectedWords = Math.max(1, sessionDuration / 60 * 20); // 20 words per minute baseline
    const actualWords = wordsWritten - initialWordCountRef.current;
    
    // Base productivity on word output vs expected
    let wordProductivity = Math.min(100, (actualWords / expectedWords) * 100);
    
    // Factor in consistency (less distractions = higher score)
    const distractionPenalty = Math.min(50, distractions * 5);
    
    // Factor in session length (longer focused sessions get bonus)
    const lengthBonus = Math.min(20, sessionDuration / 60 / 30 * 20); // Bonus for 30+ min sessions
    
    const finalScore = Math.max(0, Math.min(100, wordProductivity - distractionPenalty + lengthBonus));
    
    return Math.round(finalScore);
  }, [wordsWritten, distractions]);

  /**
   * Track user activity for productivity calculation
   */
  const trackActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  /**
   * Start a new focus session
   */
  const startSession = useCallback(() => {
    const now = Date.now();
    const newSession = {
      sessionId: `session_${now}`,
      userId: user?.id,
      startTime: now,
      endTime: null,
      wordsWritten: 0,
      distractions: 0,
      productivity: 0,
      config: { ...config },
    };

    setFocusSession(newSession);
    setIsActive(true);
    setTimeElapsed(0);
    setDistractions(0);
    startTimeRef.current = now;
    lastActivityRef.current = now;
    initialWordCountRef.current = wordsWritten;

    // Start the timer
    intervalRef.current = setInterval(() => {
      const currentTime = Date.now();
      const elapsed = Math.floor((currentTime - startTimeRef.current) / 1000);
      setTimeElapsed(elapsed);

      // Check for inactivity (potential distraction)
      const timeSinceActivity = currentTime - lastActivityRef.current;
      if (timeSinceActivity > 30000) { // 30 seconds of inactivity
        setDistractions(prev => prev + 1);
        lastActivityRef.current = currentTime; // Reset to avoid multiple counts
      }

      // Calculate and update productivity
      const productivityScore = calculateProductivity(newSession, currentTime);
      setProductivity(productivityScore);

      // Break reminders
      if (config.enableBreakReminders && elapsed > 0 && elapsed % (config.breakInterval * 60) === 0) {
        toast('💡 Hora de fazer uma pausa! Descanse por alguns minutos.', {
          duration: 5000,
          icon: '⏰',
        });
      }
    }, 1000);

    toast.success('Sessão de foco iniciada! 🎯');
  }, [user, config, wordsWritten, calculateProductivity]);

  /**
   * Pause the current session
   */
  const pauseSession = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
    toast('Sessão pausada ⏸️');
  }, []);

  /**
   * Resume the current session
   */
  const resumeSession = useCallback(() => {
    if (!focusSession || isActive) return;

    setIsActive(true);
    lastActivityRef.current = Date.now();

    // Restart the timer from where it left off
    intervalRef.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1);

      // Check for inactivity
      const currentTime = Date.now();
      const timeSinceActivity = currentTime - lastActivityRef.current;
      if (timeSinceActivity > 30000) {
        setDistractions(prev => prev + 1);
        lastActivityRef.current = currentTime;
      }

      // Update productivity
      const productivityScore = calculateProductivity(focusSession, currentTime);
      setProductivity(productivityScore);
    }, 1000);

    toast.success('Sessão retomada! 🎯');
  }, [focusSession, isActive, calculateProductivity]);

  /**
   * End the current session
   */
  const endSession = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (focusSession) {
      const endTime = Date.now();
      const finalSession = {
        ...focusSession,
        endTime,
        duration: timeElapsed,
        wordsWritten: wordsWritten - initialWordCountRef.current,
        distractions,
        productivity,
      };

      // Save session to history
      try {
        const history = JSON.parse(localStorage.getItem('focus_sessions_history') || '[]');
        history.push(finalSession);
        
        // Keep only last 50 sessions
        if (history.length > 50) {
          history.splice(0, history.length - 50);
        }
        
        localStorage.setItem('focus_sessions_history', JSON.stringify(history));
      } catch (error) {
        console.error('Error saving session history:', error);
      }

      // Record session for gamification
      if (recordFocusSession && finalSession.duration > 60) { // Only record sessions longer than 1 minute
        recordFocusSession({
          duration: finalSession.duration,
          productivity: finalSession.productivity,
          wordsWritten: finalSession.wordsWritten,
        });
      }

      setFocusSession(null);
    }

    setIsActive(false);
    setTimeElapsed(0);
    setWordsWritten(0);
    setProductivity(0);
    setDistractions(0);
    startTimeRef.current = null;
    initialWordCountRef.current = 0;

    toast.success('Sessão finalizada! 📊');
  }, [focusSession, timeElapsed, wordsWritten, distractions, productivity]);

  /**
   * Update words written (called from the writing component)
   */
  const updateWordsWritten = useCallback((content) => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0).length;
    setWordsWritten(words);
    trackActivity(); // Track as user activity
  }, [trackActivity]);

  /**
   * Get session statistics
   */
  const getSessionStats = useCallback(() => {
    if (!focusSession) return null;

    const wordsPerMinute = timeElapsed > 0 ? ((wordsWritten - initialWordCountRef.current) / (timeElapsed / 60)) : 0;
    
    return {
      duration: timeElapsed,
      wordsWritten: wordsWritten - initialWordCountRef.current,
      wordsPerMinute: Math.round(wordsPerMinute * 10) / 10,
      productivity,
      distractions,
      isActive,
    };
  }, [focusSession, timeElapsed, wordsWritten, productivity, distractions, isActive]);

  /**
   * Get historical session data
   */
  const getSessionHistory = useCallback(() => {
    try {
      const history = JSON.parse(localStorage.getItem('focus_sessions_history') || '[]');
      return history.filter(session => session.userId === user?.id);
    } catch (error) {
      console.error('Error loading session history:', error);
      return [];
    }
  }, [user]);

  /**
   * Clean up on unmount
   */
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  /**
   * Handle page visibility change (detect when user switches tabs)
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isActive) {
        setDistractions(prev => prev + 1);
        toast.warning('Foco perdido! Tente manter-se na aba de escrita.', {
          duration: 3000,
        });
      } else if (!document.hidden && isActive) {
        trackActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive, trackActivity]);

  return {
    // Session state
    focusSession,
    isActive,
    timeElapsed,
    wordsWritten,
    productivity,
    distractions,
    
    // Configuration
    config,
    updateConfig,
    
    // Session controls
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    
    // Utilities
    updateWordsWritten,
    trackActivity,
    getSessionStats,
    getSessionHistory,
  };
};

export default useFocusMode;