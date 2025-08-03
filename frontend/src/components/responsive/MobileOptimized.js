// Mobile Optimized Components - mantendo estilos existentes
import React, { memo, useState } from 'react';

import {
  useTouchGestures,
  useSwipeNavigation,
} from '../../hooks/useTouchGestures';
import { useDeviceDetection } from '../../hooks/useResponsive';
import { SmartIcon } from '../ModernIcons';

/**
 * MobileDrawer Component
 * Drawer otimizado para mobile mantendo design atual
 */
export const MobileDrawer = memo(
  ({
    isOpen = false,
    onClose,
    children,
    position = 'left', // left, right, top, bottom
    className = '',
  }) => {
    const { touchRef } = useTouchGestures({
      onSwipeLeft: position === 'left' ? onClose : undefined,
      onSwipeRight: position === 'right' ? onClose : undefined,
      onSwipeUp: position === 'bottom' ? onClose : undefined,
      onSwipeDown: position === 'top' ? onClose : undefined,
      threshold: 50,
    });

    if (!isOpen) return null;

    const positionClasses = {
      left: 'left-0 top-0 h-full w-80 transform -translate-x-full',
      right: 'right-0 top-0 h-full w-80 transform translate-x-full',
      top: 'top-0 left-0 w-full h-80 transform -translate-y-full',
      bottom: 'bottom-0 left-0 w-full h-80 transform translate-y-full',
    };

    const openClasses = {
      left: 'translate-x-0',
      right: 'translate-x-0',
      top: 'translate-y-0',
      bottom: 'translate-y-0',
    };

    return (
      <>
        {/* Backdrop */}
        <div
          className='fixed inset-0 bg-black/50 backdrop-blur-sm z-40'
          onClick={onClose}
        />

        {/* Drawer */}
        <div
          ref={touchRef}
          className={`
          fixed z-50 bg-white dark:bg-gray-800 shadow-xl
          transition-transform duration-300 ease-out
          ${positionClasses[position]}
          ${isOpen ? openClasses[position] : ''}
          ${className}
        `}
        >
          {children}
        </div>
      </>
    );
  }
);

/**
 * SwipeableCard Component
 * Card com gestos de swipe para ações
 */
export const SwipeableCard = memo(
  ({
    children,
    onSwipeLeft,
    onSwipeRight,
    leftAction,
    rightAction,
    className = '',
    ...props
  }) => {
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isRevealed, setIsRevealed] = useState(false);

    const { touchRef, touchState } = useTouchGestures({
      onSwipeLeft: () => {
        if (onSwipeLeft) {
          onSwipeLeft();
          setIsRevealed(false);
          setSwipeOffset(0);
        }
      },
      onSwipeRight: () => {
        if (onSwipeRight) {
          onSwipeRight();
          setIsRevealed(false);
          setSwipeOffset(0);
        }
      },
      threshold: 80,
    });

    // Update offset during touch
    React.useEffect(() => {
      if (touchState.isTouching) {
        setSwipeOffset(touchState.deltaX);
      } else {
        setSwipeOffset(0);
      }
    }, [touchState]);

    return (
      <div className='relative overflow-hidden'>
        {/* Action buttons background */}
        {(leftAction || rightAction) && (
          <div className='absolute inset-y-0 left-0 right-0 flex'>
            {leftAction && (
              <div className='flex-1 bg-green-500 flex items-center justify-start pl-4'>
                {leftAction}
              </div>
            )}
            {rightAction && (
              <div className='flex-1 bg-red-500 flex items-center justify-end pr-4'>
                {rightAction}
              </div>
            )}
          </div>
        )}

        {/* Main card */}
        <div
          ref={touchRef}
          className={`
          relative bg-white dark:bg-gray-800 transition-transform duration-200
          ${className}
        `}
          style={{
            transform: `translateX(${swipeOffset}px)`,
          }}
          {...props}
        >
          {children}
        </div>
      </div>
    );
  }
);

/**
 * MobileCarousel Component
 * Carrossel otimizado para touch
 */
export const MobileCarousel = memo(
  ({
    items = [],
    renderItem,
    className = '',
    showDots = true,
    autoPlay = false,
    autoPlayInterval = 3000,
  }) => {
    const { touchRef, currentIndex, setCurrentIndex } = useSwipeNavigation(
      items,
      {
        loop: true,
      }
    );

    // Auto play
    React.useEffect(() => {
      if (!autoPlay) return;

      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % items.length);
      }, autoPlayInterval);

      return () => clearInterval(interval);
    }, [autoPlay, autoPlayInterval, items.length, setCurrentIndex]);

    return (
      <div className={`relative ${className}`}>
        {/* Carousel container */}
        <div ref={touchRef} className='overflow-hidden rounded-lg'>
          <div
            className='flex transition-transform duration-300 ease-out'
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
            }}
          >
            {items.map((item, index) => (
              <div key={index} className='w-full flex-shrink-0'>
                {renderItem ? renderItem(item, index) : item}
              </div>
            ))}
          </div>
        </div>

        {/* Dots indicator */}
        {showDots && items.length > 1 && (
          <div className='flex justify-center mt-4 gap-2'>
            {items.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`
                w-2 h-2 rounded-full transition-all duration-200
                ${
                  index === currentIndex
                    ? 'bg-pastel-purple-500 w-6'
                    : 'bg-gray-300 dark:bg-gray-600'
                }
              `}
                aria-label={`Ir para slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

/**
 * MobileBottomSheet Component
 * Bottom sheet para mobile
 */
export const MobileBottomSheet = memo(
  ({
    isOpen = false,
    onClose,
    children,
    snapPoints = ['25%', '50%', '90%'],
    initialSnap = 0,
    className = '',
  }) => {
    const [currentSnap, setCurrentSnap] = useState(initialSnap);
    const device = useDeviceDetection();

    const { touchRef } = useTouchGestures({
      onSwipeDown: () => {
        if (currentSnap < snapPoints.length - 1) {
          setCurrentSnap(currentSnap + 1);
        } else {
          onClose();
        }
      },
      onSwipeUp: () => {
        if (currentSnap > 0) {
          setCurrentSnap(currentSnap - 1);
        }
      },
      threshold: 50,
    });

    if (!isOpen) return null;

    const height = snapPoints[currentSnap];

    return (
      <>
        {/* Backdrop */}
        <div
          className='fixed inset-0 bg-black/50 backdrop-blur-sm z-40'
          onClick={onClose}
        />

        {/* Bottom Sheet */}
        <div
          className={`
          fixed bottom-0 left-0 right-0 z-50
          bg-white dark:bg-gray-800 rounded-t-xl shadow-xl
          transition-all duration-300 ease-out
          ${className}
        `}
          style={{ height }}
        >
          {/* Handle */}
          <div
            ref={touchRef}
            className='flex justify-center py-3 cursor-grab active:cursor-grabbing'
          >
            <div className='w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full' />
          </div>

          {/* Content */}
          <div className='px-4 pb-4 h-full overflow-y-auto'>{children}</div>
        </div>
      </>
    );
  }
);

/**
 * TouchFriendlyButton Component
 * Botão otimizado para touch
 */
export const TouchFriendlyButton = memo(
  ({ children, size = 'md', className = '', ...props }) => {
    const device = useDeviceDetection();

    const sizeClasses = {
      sm: device.isTouchDevice
        ? 'min-h-[44px] min-w-[44px] px-4 py-3'
        : 'px-3 py-2',
      md: device.isTouchDevice
        ? 'min-h-[48px] min-w-[48px] px-6 py-3'
        : 'px-4 py-2',
      lg: device.isTouchDevice
        ? 'min-h-[52px] min-w-[52px] px-8 py-4'
        : 'px-6 py-3',
    };

    return (
      <button
        className={`
        ${sizeClasses[size]}
        ${device.isTouchDevice ? 'touch-manipulation' : ''}
        ${className}
      `}
        {...props}
      >
        {children}
      </button>
    );
  }
);

MobileDrawer.displayName = 'MobileDrawer';
SwipeableCard.displayName = 'SwipeableCard';
MobileCarousel.displayName = 'MobileCarousel';
MobileBottomSheet.displayName = 'MobileBottomSheet';
TouchFriendlyButton.displayName = 'TouchFriendlyButton';

export default {
  MobileDrawer,
  SwipeableCard,
  MobileCarousel,
  MobileBottomSheet,
  TouchFriendlyButton,
};
