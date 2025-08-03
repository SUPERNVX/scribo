// Mobile Demo Component - Demonstrates all mobile optimizations
import React, { memo, useState } from 'react';
import { Smartphone, Tablet, Monitor, Vibrate, Hand, RotateCcw } from 'lucide-react';

import { useDeviceDetection, useBreakpoint } from '../../hooks/useResponsive';
import { useVirtualKeyboard, useOrientationOptimization, useSafeArea, useMobilePerformance } from '../../hooks/useMobileOptimizations';
import { useHapticFeedback, useTouchGestures } from '../../hooks/useTouchGestures';
import MobileWritingEditor from './MobileWritingEditor';
import { TouchFriendlyButton } from '../responsive/MobileOptimized';

/**
 * MobileDemo Component
 * Demonstrates all mobile optimization features
 */
const MobileDemo = memo(() => {
  const [demoText, setDemoText] = useState('');
  const [gestureLog, setGestureLog] = useState([]);

  // Mobile optimization hooks
  const device = useDeviceDetection();
  const breakpoint = useBreakpoint();
  const keyboard = useVirtualKeyboard();
  const orientation = useOrientationOptimization();
  const safeArea = useSafeArea();
  const performance = useMobilePerformance();
  const haptics = useHapticFeedback();

  // Touch gestures
  const { touchRef, touchState } = useTouchGestures({
    onSwipeLeft: () => {
      addGestureLog('Swipe Left');
      haptics.mediumTap();
    },
    onSwipeRight: () => {
      addGestureLog('Swipe Right');
      haptics.mediumTap();
    },
    onSwipeUp: () => {
      addGestureLog('Swipe Up');
      haptics.mediumTap();
    },
    onSwipeDown: () => {
      addGestureLog('Swipe Down');
      haptics.mediumTap();
    },
    onTap: () => {
      addGestureLog('Tap');
      haptics.lightTap();
    },
    onDoubleTap: () => {
      addGestureLog('Double Tap');
      haptics.doubleTap();
    },
    onLongPress: () => {
      addGestureLog('Long Press');
      haptics.longPress();
    },
    onPinch: (data) => {
      addGestureLog(`Pinch - Scale: ${data.scale.toFixed(2)}`);
      haptics.lightTap();
    },
    enableHaptics: true,
  });

  const addGestureLog = (gesture) => {
    const timestamp = new Date().toLocaleTimeString();
    setGestureLog(prev => [
      { gesture, timestamp, id: Date.now() },
      ...prev.slice(0, 9) // Keep only last 10 entries
    ]);
  };

  const testHaptics = (type) => {
    switch (type) {
      case 'light':
        haptics.lightTap();
        break;
      case 'medium':
        haptics.mediumTap();
        break;
      case 'heavy':
        haptics.heavyTap();
        break;
      case 'success':
        haptics.success();
        break;
      case 'error':
        haptics.error();
        break;
      default:
        haptics.lightTap();
    }
  };

  const getDeviceIcon = () => {
    if (device.isMobile) return <Smartphone size={20} />;
    if (device.isTablet) return <Tablet size={20} />;
    return <Monitor size={20} />;
  };

  return (
    <div 
      className="mobile-demo min-h-screen bg-gradient-to-br from-pastel-blue-50 to-pastel-purple-50 dark:from-gray-900 dark:to-gray-800"
      style={safeArea.paddingStyle}
    >
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 p-4">
        <h1 className="font-display text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          {getDeviceIcon()}
          Mobile Optimizations Demo
        </h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Device Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Device Information
          </h2>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Device Type:</span>
              <p className="text-gray-900 dark:text-white">
                {device.isMobile ? 'Mobile' : device.isTablet ? 'Tablet' : 'Desktop'}
              </p>
            </div>
            
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Breakpoint:</span>
              <p className="text-gray-900 dark:text-white">{breakpoint.breakpoint}</p>
            </div>
            
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Touch Device:</span>
              <p className="text-gray-900 dark:text-white">
                {device.isTouchDevice ? 'Yes' : 'No'}
              </p>
            </div>
            
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Has Hover:</span>
              <p className="text-gray-900 dark:text-white">
                {device.hasHover ? 'Yes' : 'No'}
              </p>
            </div>
            
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Orientation:</span>
              <p className="text-gray-900 dark:text-white flex items-center gap-1">
                <RotateCcw size={14} />
                {orientation.isPortrait ? 'Portrait' : 'Landscape'}
              </p>
            </div>
            
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Pixel Ratio:</span>
              <p className="text-gray-900 dark:text-white">{device.pixelRatio}x</p>
            </div>
          </div>
        </div>

        {/* Virtual Keyboard Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Virtual Keyboard Status
          </h2>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Visible:</span>
              <p className="text-gray-900 dark:text-white">
                {keyboard.isVisible ? 'Yes' : 'No'}
              </p>
            </div>
            
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Height:</span>
              <p className="text-gray-900 dark:text-white">{keyboard.height}px</p>
            </div>
            
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Viewport Height:</span>
              <p className="text-gray-900 dark:text-white">{keyboard.viewportHeight}px</p>
            </div>
            
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Adjusted Height:</span>
              <p className="text-gray-900 dark:text-white">{keyboard.adjustedHeight}px</p>
            </div>
          </div>
        </div>

        {/* Performance Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Performance Optimization
          </h2>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Low-End Device:</span>
              <p className="text-gray-900 dark:text-white">
                {performance.isLowEndDevice ? 'Yes' : 'No'}
              </p>
            </div>
            
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Connection:</span>
              <p className="text-gray-900 dark:text-white">{performance.connectionType}</p>
            </div>
            
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Reduce Animations:</span>
              <p className="text-gray-900 dark:text-white">
                {performance.shouldReduceAnimations ? 'Yes' : 'No'}
              </p>
            </div>
            
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Optimize Images:</span>
              <p className="text-gray-900 dark:text-white">
                {performance.shouldOptimizeImages ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </div>

        {/* Haptic Feedback Test */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Vibrate size={20} />
            Haptic Feedback Test
          </h2>
          
          <div className="grid grid-cols-2 gap-2">
            {[
              { type: 'light', label: 'Light Tap' },
              { type: 'medium', label: 'Medium Tap' },
              { type: 'heavy', label: 'Heavy Tap' },
              { type: 'success', label: 'Success' },
              { type: 'error', label: 'Error' },
            ].map(({ type, label }) => (
              <TouchFriendlyButton
                key={type}
                onClick={() => testHaptics(type)}
                className="bg-pastel-purple-100 dark:bg-pastel-purple-900/30 text-pastel-purple-700 dark:text-pastel-purple-300 rounded-lg font-body text-sm hover:bg-pastel-purple-200 dark:hover:bg-pastel-purple-900/50 transition-colors duration-200"
              >
                {label}
              </TouchFriendlyButton>
            ))}
          </div>
        </div>

        {/* Touch Gestures Test */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Hand size={20} />
            Touch Gestures Test
          </h2>
          
          <div
            ref={touchRef}
            className="bg-gradient-to-br from-pastel-blue-100 to-pastel-purple-100 dark:from-pastel-blue-900/30 dark:to-pastel-purple-900/30 rounded-lg p-8 mb-4 text-center border-2 border-dashed border-gray-300 dark:border-gray-600"
          >
            <p className="font-body text-gray-700 dark:text-gray-300 mb-2">
              Try different gestures here:
            </p>
            <p className="font-body text-sm text-gray-500 dark:text-gray-400">
              Tap, Double Tap, Long Press, Swipe (↑↓←→), Pinch
            </p>
            
            {touchState.isTouching && (
              <div className="mt-4 p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-xs font-mono">
                  Delta: ({touchState.deltaX.toFixed(0)}, {touchState.deltaY.toFixed(0)})
                  | Distance: {touchState.distance.toFixed(0)}px
                  {touchState.isPinching && ` | Scale: ${touchState.scale?.toFixed(2)}`}
                </p>
              </div>
            )}
          </div>

          {/* Gesture Log */}
          <div className="max-h-40 overflow-y-auto">
            <h3 className="font-body font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recent Gestures:
            </h3>
            {gestureLog.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No gestures detected yet. Try interacting with the area above.
              </p>
            ) : (
              <div className="space-y-1">
                {gestureLog.map((log) => (
                  <div
                    key={log.id}
                    className="flex justify-between items-center text-xs bg-gray-50 dark:bg-gray-700 rounded px-2 py-1"
                  >
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {log.gesture}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {log.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Writing Editor Demo */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-white">
              Mobile Writing Editor Demo
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Try typing to see virtual keyboard optimizations
            </p>
          </div>
          
          <MobileWritingEditor
            value={demoText}
            onChange={setDemoText}
            placeholder="Start typing to test mobile optimizations...

Features:
• Virtual keyboard detection
• Haptic feedback on focus
• Touch gesture support
• Orientation adaptation
• Auto-resize based on content"
            className="min-h-[200px]"
          />
        </div>

        {/* Safe Area Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Safe Area Insets
          </h2>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Top:</span>
              <p className="text-gray-900 dark:text-white">{safeArea.top}px</p>
            </div>
            
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Bottom:</span>
              <p className="text-gray-900 dark:text-white">{safeArea.bottom}px</p>
            </div>
            
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Left:</span>
              <p className="text-gray-900 dark:text-white">{safeArea.left}px</p>
            </div>
            
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">Right:</span>
              <p className="text-gray-900 dark:text-white">{safeArea.right}px</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

MobileDemo.displayName = 'MobileDemo';

export default MobileDemo;