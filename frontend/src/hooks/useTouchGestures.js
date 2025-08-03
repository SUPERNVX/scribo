// Touch Gestures Hook for mobile interactions
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useHapticFeedback Hook
 * Provides haptic feedback for touch interactions
 */
export const useHapticFeedback = () => {
  const vibrate = useCallback((pattern = [10]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const lightTap = useCallback(() => vibrate([10]), [vibrate]);
  const mediumTap = useCallback(() => vibrate([20]), [vibrate]);
  const heavyTap = useCallback(() => vibrate([30]), [vibrate]);
  const doubleTap = useCallback(() => vibrate([10, 50, 10]), [vibrate]);
  const longPress = useCallback(() => vibrate([50]), [vibrate]);
  const success = useCallback(() => vibrate([10, 50, 10, 50, 10]), [vibrate]);
  const error = useCallback(() => vibrate([100, 50, 100]), [vibrate]);

  return {
    vibrate,
    lightTap,
    mediumTap,
    heavyTap,
    doubleTap,
    longPress,
    success,
    error,
  };
};

/**
 * useTouchGestures Hook
 * Detecta gestos de toque mantendo design atual com haptic feedback
 */
export const useTouchGestures = (options = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinch,
    onTap,
    onDoubleTap,
    onLongPress,
    threshold = 50, // Distância mínima para swipe
    longPressDelay = 500, // Tempo para long press
    enableHaptics = true, // Habilitar feedback háptico
    pinchSensitivity = 0.1, // Sensibilidade do pinch
  } = options;

  const haptics = useHapticFeedback();

  const [touchState, setTouchState] = useState({
    isTouching: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
    distance: 0,
    scale: 1,
    initialPinchDistance: 0,
    isPinching: false,
  });

  const touchRef = useRef();
  const longPressTimer = useRef();
  const lastTap = useRef(0);
  const pinchStartDistance = useRef(0);

  const handleTouchStart = useCallback(
    event => {
      const touch = event.touches[0];
      const now = Date.now();

      // Haptic feedback for touch start
      if (enableHaptics) {
        haptics.lightTap();
      }

      setTouchState(prev => ({
        ...prev,
        isTouching: true,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        deltaX: 0,
        deltaY: 0,
        isPinching: event.touches.length === 2,
      }));

      // Handle pinch start
      if (event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        pinchStartDistance.current = distance;
        
        setTouchState(prev => ({
          ...prev,
          initialPinchDistance: distance,
          isPinching: true,
        }));
      }

      // Long press timer
      if (onLongPress && event.touches.length === 1) {
        longPressTimer.current = setTimeout(() => {
          if (enableHaptics) {
            haptics.longPress();
          }
          onLongPress(event);
        }, longPressDelay);
      }

      // Double tap detection
      if (onDoubleTap && now - lastTap.current < 300 && event.touches.length === 1) {
        clearTimeout(longPressTimer.current);
        if (enableHaptics) {
          haptics.doubleTap();
        }
        onDoubleTap(event);
      }
      lastTap.current = now;
    },
    [onLongPress, onDoubleTap, longPressDelay, enableHaptics, haptics]
  );

  const handleTouchMove = useCallback(
    event => {
      if (!touchState.isTouching) return;

      const touch = event.touches[0];
      const deltaX = touch.clientX - touchState.startX;
      const deltaY = touch.clientY - touchState.startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      setTouchState(prev => ({
        ...prev,
        currentX: touch.clientX,
        currentY: touch.clientY,
        deltaX,
        deltaY,
        distance,
      }));

      // Cancel long press if moved too much
      if (distance > 10) {
        clearTimeout(longPressTimer.current);
      }

      // Handle pinch gesture with improved sensitivity
      if (event.touches.length === 2 && onPinch && touchState.isPinching) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );

        const scale = currentDistance / pinchStartDistance.current;
        const scaleDelta = Math.abs(scale - touchState.scale);

        // Only trigger pinch if scale change is significant enough
        if (scaleDelta > pinchSensitivity) {
          setTouchState(prev => ({ ...prev, scale }));
          
          onPinch({
            scale,
            scaleDelta,
            center: {
              x: (touch1.clientX + touch2.clientX) / 2,
              y: (touch1.clientY + touch2.clientY) / 2,
            },
            isZoomIn: scale > 1,
            isZoomOut: scale < 1,
          });
        }
      }
    },
    [touchState, onPinch, pinchSensitivity]
  );

  const handleTouchEnd = useCallback(
    event => {
      clearTimeout(longPressTimer.current);

      const { deltaX, deltaY, distance } = touchState;

      // Detect swipe gestures with haptic feedback
      if (distance > threshold) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (enableHaptics) {
          haptics.mediumTap();
        }

        if (absX > absY) {
          // Horizontal swipe
          if (deltaX > 0 && onSwipeRight) {
            onSwipeRight({ deltaX, deltaY, distance });
          } else if (deltaX < 0 && onSwipeLeft) {
            onSwipeLeft({ deltaX, deltaY, distance });
          }
        } else {
          // Vertical swipe
          if (deltaY > 0 && onSwipeDown) {
            onSwipeDown({ deltaX, deltaY, distance });
          } else if (deltaY < 0 && onSwipeUp) {
            onSwipeUp({ deltaX, deltaY, distance });
          }
        }
      } else if (distance < 10 && onTap) {
        // Simple tap with light haptic feedback
        if (enableHaptics) {
          haptics.lightTap();
        }
        onTap(event);
      }

      setTouchState(prev => ({
        ...prev,
        isTouching: false,
        deltaX: 0,
        deltaY: 0,
        distance: 0,
        scale: 1,
        isPinching: false,
      }));
    },
    [
      touchState,
      threshold,
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
      onSwipeDown,
      onTap,
      enableHaptics,
      haptics,
    ]
  );

  useEffect(() => {
    const element = touchRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, {
      passive: false,
    });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    touchRef,
    touchState,
    isGesturing: touchState.isTouching && touchState.distance > threshold,
  };
};

/**
 * useSwipeNavigation Hook
 * Navegação por swipe para carrosséis e listas
 */
export const useSwipeNavigation = (items = [], options = {}) => {
  const { onNext, onPrevious, threshold = 50, loop = true } = options;

  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipeLeft = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < items.length) {
      setCurrentIndex(nextIndex);
      onNext?.(nextIndex);
    } else if (loop) {
      setCurrentIndex(0);
      onNext?.(0);
    }
  }, [currentIndex, items.length, loop, onNext]);

  const handleSwipeRight = useCallback(() => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentIndex(prevIndex);
      onPrevious?.(prevIndex);
    } else if (loop) {
      const lastIndex = items.length - 1;
      setCurrentIndex(lastIndex);
      onPrevious?.(lastIndex);
    }
  }, [currentIndex, items.length, loop, onPrevious]);

  const { touchRef } = useTouchGestures({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    threshold,
  });

  return {
    touchRef,
    currentIndex,
    setCurrentIndex,
    canGoNext: currentIndex < items.length - 1 || loop,
    canGoPrevious: currentIndex > 0 || loop,
  };
};

/**
 * usePullToRefresh Hook
 * Pull to refresh functionality
 */
export const usePullToRefresh = (onRefresh, threshold = 100) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTouchMove = useCallback(
    event => {
      if (window.scrollY > 0) return; // Only at top of page

      const touch = event.touches[0];
      const startY = touch.clientY;

      if (startY > 0) {
        setIsPulling(true);
        setPullDistance(Math.min(startY, threshold * 1.5));
      }
    },
    [threshold]
  );

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setIsPulling(false);
    setPullDistance(0);
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  const { touchRef } = useTouchGestures({
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  });

  return {
    touchRef,
    isPulling,
    pullDistance,
    isRefreshing,
    pullProgress: Math.min(pullDistance / threshold, 1),
  };
};

export default {
  useTouchGestures,
  useSwipeNavigation,
  usePullToRefresh,
};
