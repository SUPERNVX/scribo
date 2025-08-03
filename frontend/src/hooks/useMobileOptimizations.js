// Mobile Optimizations Hook - Advanced mobile features
import { useState, useEffect, useCallback, useRef } from 'react';
import { useHapticFeedback } from './useTouchGestures';

/**
 * useVirtualKeyboard Hook
 * Handles virtual keyboard optimization for mobile devices
 */
export const useVirtualKeyboard = (options = {}) => {
  const {
    adjustViewport = true,
    preventZoom = true,
    onKeyboardShow,
    onKeyboardHide,
  } = options;

  const [keyboardState, setKeyboardState] = useState({
    isVisible: false,
    height: 0,
    viewportHeight: window.innerHeight,
  });

  const originalViewportHeight = useRef(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = originalViewportHeight.current - currentHeight;
      
      // Keyboard is likely visible if viewport height decreased significantly
      const isKeyboardVisible = heightDifference > 150;
      
      setKeyboardState(prev => {
        const newState = {
          isVisible: isKeyboardVisible,
          height: isKeyboardVisible ? heightDifference : 0,
          viewportHeight: currentHeight,
        };

        // Trigger callbacks if state changed
        if (prev.isVisible !== newState.isVisible) {
          if (newState.isVisible) {
            onKeyboardShow?.(newState);
          } else {
            onKeyboardHide?.(newState);
          }
        }

        return newState;
      });
    };

    const handleVisualViewportChange = () => {
      if (window.visualViewport) {
        const keyboardHeight = window.innerHeight - window.visualViewport.height;
        const isVisible = keyboardHeight > 150;

        setKeyboardState(prev => {
          const newState = {
            isVisible,
            height: isVisible ? keyboardHeight : 0,
            viewportHeight: window.visualViewport.height,
          };

          if (prev.isVisible !== newState.isVisible) {
            if (newState.isVisible) {
              onKeyboardShow?.(newState);
            } else {
              onKeyboardHide?.(newState);
            }
          }

          return newState;
        });
      }
    };

    // Use Visual Viewport API if available (better for keyboard detection)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
    } else {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, [onKeyboardShow, onKeyboardHide]);

  // Prevent zoom on input focus (iOS)
  useEffect(() => {
    if (!preventZoom) return;

    const preventZoomOnFocus = (event) => {
      if (event.target.tagName.match(/input|textarea|select/i)) {
        event.target.style.fontSize = '16px';
      }
    };

    document.addEventListener('focusin', preventZoomOnFocus);
    return () => document.removeEventListener('focusin', preventZoomOnFocus);
  }, [preventZoom]);

  return {
    ...keyboardState,
    adjustedHeight: adjustViewport ? keyboardState.viewportHeight : window.innerHeight,
  };
};

/**
 * useOrientationOptimization Hook
 * Handles orientation changes and adaptive layouts
 */
export const useOrientationOptimization = (options = {}) => {
  const {
    lockOrientation = null, // 'portrait', 'landscape', or null
    onOrientationChange,
    enableHapticFeedback = true,
  } = options;

  const haptics = useHapticFeedback();
  
  const [orientation, setOrientation] = useState({
    angle: 0,
    type: 'portrait-primary',
    isPortrait: true,
    isLandscape: false,
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const updateOrientation = useCallback(() => {
    const angle = screen.orientation?.angle || window.orientation || 0;
    const type = screen.orientation?.type || 
      (Math.abs(angle) === 90 ? 'landscape-primary' : 'portrait-primary');
    
    const isLandscape = Math.abs(angle) === 90;
    const isPortrait = !isLandscape;

    const newOrientation = {
      angle,
      type,
      isPortrait,
      isLandscape,
      width: window.innerWidth,
      height: window.innerHeight,
    };

    setOrientation(prev => {
      // Trigger haptic feedback on orientation change
      if (enableHapticFeedback && prev.type !== newOrientation.type) {
        haptics.lightTap();
      }

      // Trigger callback
      if (prev.type !== newOrientation.type) {
        onOrientationChange?.(newOrientation);
      }

      return newOrientation;
    });
  }, [onOrientationChange, enableHapticFeedback, haptics]);

  useEffect(() => {
    updateOrientation();

    const handleOrientationChange = () => {
      // Small delay to ensure dimensions are updated
      setTimeout(updateOrientation, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', updateOrientation);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', updateOrientation);
    };
  }, [updateOrientation]);

  // Lock orientation if requested
  useEffect(() => {
    if (!lockOrientation || !screen.orientation?.lock) return;

    const lockScreen = async () => {
      try {
        await screen.orientation.lock(lockOrientation);
      } catch (error) {
        console.warn('Could not lock screen orientation:', error);
      }
    };

    lockScreen();

    return () => {
      if (screen.orientation?.unlock) {
        screen.orientation.unlock();
      }
    };
  }, [lockOrientation]);

  return {
    ...orientation,
    lockOrientation: async (newLock) => {
      if (screen.orientation?.lock) {
        try {
          await screen.orientation.lock(newLock);
          return true;
        } catch (error) {
          console.warn('Could not lock orientation:', error);
          return false;
        }
      }
      return false;
    },
    unlockOrientation: () => {
      if (screen.orientation?.unlock) {
        screen.orientation.unlock();
      }
    },
  };
};

/**
 * useSafeArea Hook
 * Handles safe area insets for notched devices
 */
export const useSafeArea = () => {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      
      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)')) || 0,
        bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
        left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)')) || 0,
        right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)')) || 0,
      });
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    window.addEventListener('orientationchange', updateSafeArea);

    return () => {
      window.removeEventListener('resize', updateSafeArea);
      window.removeEventListener('orientationchange', updateSafeArea);
    };
  }, []);

  return {
    ...safeArea,
    paddingStyle: {
      paddingTop: `${safeArea.top}px`,
      paddingBottom: `${safeArea.bottom}px`,
      paddingLeft: `${safeArea.left}px`,
      paddingRight: `${safeArea.right}px`,
    },
    marginStyle: {
      marginTop: `${safeArea.top}px`,
      marginBottom: `${safeArea.bottom}px`,
      marginLeft: `${safeArea.left}px`,
      marginRight: `${safeArea.right}px`,
    },
  };
};

/**
 * useMobilePerformance Hook
 * Optimizes performance for mobile devices
 */
export const useMobilePerformance = (options = {}) => {
  const {
    enablePassiveListeners = true,
    optimizeScrolling = true,
    reduceAnimations = false,
  } = options;

  const [performanceState, setPerformanceState] = useState({
    isLowEndDevice: false,
    memoryInfo: null,
    connectionType: 'unknown',
  });

  useEffect(() => {
    // Detect low-end devices
    const detectLowEndDevice = () => {
      const memory = navigator.deviceMemory || 4; // Default to 4GB if not available
      const cores = navigator.hardwareConcurrency || 4;
      const isLowEnd = memory <= 2 || cores <= 2;

      setPerformanceState(prev => ({
        ...prev,
        isLowEndDevice: isLowEnd,
        memoryInfo: {
          deviceMemory: memory,
          cores,
        },
      }));
    };

    // Detect connection type
    const updateConnection = () => {
      if (navigator.connection) {
        setPerformanceState(prev => ({
          ...prev,
          connectionType: navigator.connection.effectiveType || 'unknown',
        }));
      }
    };

    detectLowEndDevice();
    updateConnection();

    if (navigator.connection) {
      navigator.connection.addEventListener('change', updateConnection);
    }

    return () => {
      if (navigator.connection) {
        navigator.connection.removeEventListener('change', updateConnection);
      }
    };
  }, []);

  // Apply performance optimizations
  useEffect(() => {
    if (optimizeScrolling) {
      document.body.style.webkitOverflowScrolling = 'touch';
    }

    if (reduceAnimations || performanceState.isLowEndDevice) {
      document.documentElement.style.setProperty('--animation-duration', '0s');
    }
  }, [optimizeScrolling, reduceAnimations, performanceState.isLowEndDevice]);

  return {
    ...performanceState,
    shouldReduceAnimations: reduceAnimations || performanceState.isLowEndDevice,
    shouldOptimizeImages: performanceState.connectionType === 'slow-2g' || 
                          performanceState.connectionType === '2g',
  };
};

/**
 * useMobileGestures Hook
 * Combines all mobile gesture optimizations
 */
export const useMobileGestures = (element, options = {}) => {
  const {
    enableSwipe = true,
    enablePinch = true,
    enableLongPress = true,
    enableHaptics = true,
    ...gestureOptions
  } = options;

  const haptics = useHapticFeedback();
  const [gestureState, setGestureState] = useState({
    isActive: false,
    currentGesture: null,
  });

  const handleGestureStart = useCallback((gestureType) => {
    setGestureState({
      isActive: true,
      currentGesture: gestureType,
    });

    if (enableHaptics) {
      haptics.lightTap();
    }
  }, [enableHaptics, haptics]);

  const handleGestureEnd = useCallback(() => {
    setGestureState({
      isActive: false,
      currentGesture: null,
    });
  }, []);

  return {
    gestureState,
    handleGestureStart,
    handleGestureEnd,
  };
};

export default {
  useVirtualKeyboard,
  useOrientationOptimization,
  useSafeArea,
  useMobilePerformance,
  useMobileGestures,
};