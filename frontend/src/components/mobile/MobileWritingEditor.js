// Mobile-optimized writing editor with virtual keyboard handling
import React, { memo, useState, useRef, useEffect } from 'react';
import { useVirtualKeyboard, useOrientationOptimization, useSafeArea } from '../../hooks/useMobileOptimizations';
import { useTouchGestures, useHapticFeedback } from '../../hooks/useTouchGestures';
import { useDeviceDetection } from '../../hooks/useResponsive';

/**
 * MobileWritingEditor Component
 * Optimized textarea for mobile writing with keyboard handling
 */
const MobileWritingEditor = memo(({
  value = '',
  onChange,
  placeholder = 'Comece a escrever...',
  className = '',
  onFocus,
  onBlur,
  disabled = false,
  autoFocus = false,
  maxLength,
  rows = 10,
  ...props
}) => {
  const textareaRef = useRef(null);
  const containerRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  const device = useDeviceDetection();
  const haptics = useHapticFeedback();
  const safeArea = useSafeArea();

  // Virtual keyboard handling
  const keyboard = useVirtualKeyboard({
    adjustViewport: true,
    preventZoom: true,
    onKeyboardShow: (state) => {
      // Scroll focused element into view when keyboard appears
      if (isFocused && textareaRef.current) {
        setTimeout(() => {
          textareaRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }, 100);
      }
    },
    onKeyboardHide: () => {
      // Optional: Handle keyboard hide
    },
  });

  // Orientation handling
  const orientation = useOrientationOptimization({
    onOrientationChange: (newOrientation) => {
      // Adjust layout on orientation change
      if (isFocused && textareaRef.current) {
        setTimeout(() => {
          textareaRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }, 200);
      }
    },
    enableHapticFeedback: true,
  });

  // Touch gestures for enhanced interaction
  const { touchRef } = useTouchGestures({
    onDoubleTap: (event) => {
      // Double tap to select word
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        const position = textarea.selectionStart;
        const text = textarea.value;
        
        // Find word boundaries
        let start = position;
        let end = position;
        
        while (start > 0 && /\w/.test(text[start - 1])) start--;
        while (end < text.length && /\w/.test(text[end])) end++;
        
        textarea.setSelectionRange(start, end);
        haptics.mediumTap();
      }
    },
    onLongPress: (event) => {
      // Long press for context menu (let browser handle it)
      haptics.longPress();
    },
    enableHaptics: true,
  });

  const handleFocus = (event) => {
    setIsFocused(true);
    haptics.lightTap();
    onFocus?.(event);
  };

  const handleBlur = (event) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  const handleChange = (event) => {
    const newValue = event.target.value;
    setCursorPosition(event.target.selectionStart);
    onChange?.(newValue);
  };

  const handleSelectionChange = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  };

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  // Calculate dynamic height based on keyboard state
  const dynamicStyle = {
    minHeight: keyboard.isVisible 
      ? `${Math.max(200, keyboard.adjustedHeight * 0.4)}px`
      : `${Math.max(300, orientation.height * 0.3)}px`,
    maxHeight: keyboard.isVisible
      ? `${keyboard.adjustedHeight * 0.6}px`
      : `${orientation.height * 0.7}px`,
    ...safeArea.paddingStyle,
  };

  return (
    <div
      ref={containerRef}
      className={`
        mobile-writing-editor relative w-full
        ${keyboard.isVisible ? 'keyboard-visible' : ''}
        ${orientation.isLandscape ? 'landscape' : 'portrait'}
        ${className}
      `}
      style={dynamicStyle}
    >
      {/* Writing area with enhanced mobile support */}
      <div
        ref={touchRef}
        className="relative w-full h-full"
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSelect={handleSelectionChange}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          maxLength={maxLength}
          rows={rows}
          className={`
            w-full h-full resize-none border-0 outline-none
            bg-transparent font-body text-base leading-relaxed
            ${device.isTouchDevice ? 'touch-manipulation' : ''}
            ${isFocused ? 'ring-2 ring-pastel-purple-300' : ''}
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            text-gray-800 dark:text-gray-200
            p-4 rounded-lg
            ${keyboard.isVisible ? 'pb-8' : 'pb-4'}
          `}
          style={{
            fontSize: '16px', // Prevent zoom on iOS
            lineHeight: '1.6',
            minHeight: '100%',
          }}
          {...props}
        />

        {/* Mobile-specific UI enhancements */}
        {isFocused && (
          <div className="absolute bottom-2 right-2 flex items-center gap-2">
            {/* Word count indicator */}
            {value && (
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-gray-600 dark:text-gray-400">
                {value.split(/\s+/).filter(word => word.length > 0).length} palavras
              </div>
            )}

            {/* Cursor position indicator (for debugging) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-blue-500/90 text-white rounded-full px-2 py-1 text-xs">
                {cursorPosition}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Keyboard spacer */}
      {keyboard.isVisible && (
        <div 
          className="keyboard-spacer"
          style={{ height: `${keyboard.height}px` }}
        />
      )}

      {/* Mobile toolbar (when focused) */}
      {isFocused && device.isMobile && (
        <div className="mobile-toolbar fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2 flex justify-between items-center z-50">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (textareaRef.current) {
                  textareaRef.current.blur();
                }
              }}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-md"
            >
              Concluir
            </button>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {maxLength && (
              <span>
                {value.length}/{maxLength}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

MobileWritingEditor.displayName = 'MobileWritingEditor';

export default MobileWritingEditor;