// Performance Provider - Context for performance monitoring
import React, { createContext, useContext, useEffect, useState } from 'react';
import { performanceMonitor } from '../../utils/performanceMonitoring';
import PerformanceMonitor from './PerformanceMonitor';
import PerformanceDashboard from './PerformanceDashboard';

const PerformanceContext = createContext();

export const usePerformanceContext = () => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformanceContext must be used within a PerformanceProvider');
  }
  return context;
};

const PerformanceProvider = ({ 
  children, 
  enabled = process.env.NODE_ENV === 'development',
  showMonitor = true,
  config = {}
}) => {
  const [metrics, setMetrics] = useState({});
  const [showDashboard, setShowDashboard] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Initialize performance monitoring
  useEffect(() => {
    if (!enabled) return;

    const defaultConfig = {
      enableConsoleLogging: process.env.NODE_ENV === 'development',
      enableWebVitals: true,
      enableResourceTiming: true,
      enableMemoryMonitoring: true,
      sampleRate: process.env.NODE_ENV === 'development' ? 1 : 0.1,
      ...config
    };

    performanceMonitor.init(defaultConfig);
    setIsMonitoring(true);

    // Update metrics periodically
    const updateMetrics = () => {
      const summary = performanceMonitor.getPerformanceSummary();
      setMetrics(summary);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 3000);

    // Keyboard shortcut to open dashboard (Ctrl+Shift+P)
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        setShowDashboard(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
      performanceMonitor.stop();
      setIsMonitoring(false);
    };
  }, [enabled, config]);

  // Performance utilities
  const measureFunction = (name, fn) => {
    return (...args) => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();
      
      performanceMonitor.recordMetric('function-timing', name, {
        duration: end - start,
        timestamp: Date.now(),
      });
      
      return result;
    };
  };

  const measureAsyncFunction = (name, fn) => {
    return async (...args) => {
      const start = performance.now();
      try {
        const result = await fn(...args);
        const end = performance.now();
        
        performanceMonitor.recordMetric('async-function-timing', name, {
          duration: end - start,
          success: true,
          timestamp: Date.now(),
        });
        
        return result;
      } catch (error) {
        const end = performance.now();
        
        performanceMonitor.recordMetric('async-function-timing', name, {
          duration: end - start,
          success: false,
          error: error.message,
          timestamp: Date.now(),
        });
        
        throw error;
      }
    };
  };

  const mark = (name) => {
    performance.mark(name);
    performanceMonitor.recordMetric('user-marks', name, {
      timestamp: Date.now(),
    });
  };

  const measure = (name, startMark, endMark) => {
    performance.measure(name, startMark, endMark);
    const entry = performance.getEntriesByName(name, 'measure')[0];
    
    if (entry) {
      performanceMonitor.recordMetric('user-measures', name, {
        duration: entry.duration,
        startTime: entry.startTime,
        timestamp: Date.now(),
      });
    }
  };

  const exportMetrics = () => {
    return performanceMonitor.exportMetrics();
  };

  const clearMetrics = () => {
    performanceMonitor.clearMetrics();
    setMetrics({});
  };

  const contextValue = {
    metrics,
    isMonitoring,
    showDashboard,
    setShowDashboard,
    measureFunction,
    measureAsyncFunction,
    mark,
    measure,
    exportMetrics,
    clearMetrics,
    performanceMonitor,
  };

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
      
      {/* Performance Monitor Widget */}
      {showMonitor && (
        <PerformanceMonitor
          enabled={enabled}
          onMetricsUpdate={setMetrics}
          enableRealTimeMonitoring={true}
          showDashboard={true}
        />
      )}

      {/* Performance Dashboard */}
      {showDashboard && (
        <PerformanceDashboard
          enabled={enabled}
          onClose={() => setShowDashboard(false)}
        />
      )}

      {/* Development helper text */}
      {process.env.NODE_ENV === 'development' && (
        <div
          style={{
            position: 'fixed',
            bottom: '10px',
            left: '10px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '10px',
            fontFamily: 'monospace',
            zIndex: 9998,
            opacity: 0.7,
          }}
        >
          Press Ctrl+Shift+P for Performance Dashboard
        </div>
      )}
    </PerformanceContext.Provider>
  );
};

export default PerformanceProvider;