// Enhanced Performance monitoring component with Web Vitals
import React, { useEffect, useState, useCallback } from 'react';
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

const PerformanceMonitor = ({
  enabled = process.env.NODE_ENV === 'development',
  onMetricsUpdate,
  enableRealTimeMonitoring = true,
  showDashboard = true,
}) => {
  const [metrics, setMetrics] = useState({
    // Basic metrics
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    bundleSize: 0,
    
    // Web Vitals
    lcp: 0,      // Largest Contentful Paint
    fid: 0,      // First Input Delay
    cls: 0,      // Cumulative Layout Shift
    fcp: 0,      // First Contentful Paint
    ttfb: 0,     // Time to First Byte
    
    // Additional metrics
    domNodes: 0,
    eventListeners: 0,
    networkRequests: 0,
    cacheHitRate: 0,
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [alerts, setAlerts] = useState([]);

  // Update metrics and trigger callback
  const updateMetrics = useCallback((newMetrics) => {
    setMetrics(prev => {
      const updated = { ...prev, ...newMetrics };
      onMetricsUpdate?.(updated);
      return updated;
    });
  }, [onMetricsUpdate]);

  // Check for performance alerts
  const checkAlerts = useCallback((metrics) => {
    const newAlerts = [];
    
    if (metrics.lcp > 2500) {
      newAlerts.push({ type: 'warning', message: 'LCP is slow (>2.5s)' });
    }
    if (metrics.fid > 200) { // INP threshold is higher than old FID
      newAlerts.push({ type: 'warning', message: 'INP is high (>200ms)' });
    }
    if (metrics.cls > 0.1) {
      newAlerts.push({ type: 'warning', message: 'CLS is high (>0.1)' });
    }
    if (metrics.memoryUsage > 100) {
      newAlerts.push({ type: 'error', message: 'High memory usage (>100MB)' });
    }
    
    setAlerts(newAlerts);
  }, []);

  // Initialize Web Vitals monitoring
  useEffect(() => {
    if (!enabled) return;

    // Monitor Web Vitals
    onCLS((metric) => {
      updateMetrics({ cls: Math.round(metric.value * 1000) / 1000 });
    });

    onINP((metric) => {
      updateMetrics({ fid: Math.round(metric.value) });
    });

    onFCP((metric) => {
      updateMetrics({ fcp: Math.round(metric.value) });
    });

    onLCP((metric) => {
      updateMetrics({ lcp: Math.round(metric.value) });
    });

    onTTFB((metric) => {
      updateMetrics({ ttfb: Math.round(metric.value) });
    });

  }, [enabled, updateMetrics]);

  // Monitor basic performance metrics
  useEffect(() => {
    if (!enabled) return;

    const measureBasicMetrics = () => {
      try {
        // Navigation timing
        if (performance.getEntriesByType) {
          const navigation = performance.getEntriesByType('navigation')[0];
          if (navigation) {
            const loadTime = navigation.loadEventEnd - navigation.fetchStart;
            updateMetrics({ loadTime: Math.round(loadTime) });
          }
        }

        // Memory usage
        if (performance.memory) {
          const memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
          updateMetrics({ memoryUsage });
        }

        // DOM complexity
        const domNodes = document.querySelectorAll('*').length;
        updateMetrics({ domNodes });

        // Network requests count
        if (performance.getEntriesByType) {
          const networkRequests = performance.getEntriesByType('resource').length;
          updateMetrics({ networkRequests });
        }
      } catch (error) {
        // Silently handle errors in test environments
        if (process.env.NODE_ENV === 'development') {
          console.warn('Performance measurement error:', error);
        }
      }
    };

    // Initial measurement
    if (document.readyState === 'complete') {
      measureBasicMetrics();
    } else {
      window.addEventListener('load', measureBasicMetrics);
    }

    // Real-time monitoring
    let monitoringInterval;
    if (enableRealTimeMonitoring) {
      monitoringInterval = setInterval(() => {
        if (performance.memory) {
          const memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
          updateMetrics({ memoryUsage });
        }
        
        const domNodes = document.querySelectorAll('*').length;
        updateMetrics({ domNodes });
      }, 2000);
    }

    return () => {
      window.removeEventListener('load', measureBasicMetrics);
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
    };
  }, [enabled, enableRealTimeMonitoring, updateMetrics]);

  // Check alerts when metrics change
  useEffect(() => {
    checkAlerts(metrics);
  }, [metrics, checkAlerts]);

  // Log detailed metrics to console
  useEffect(() => {
    if (!enabled || process.env.NODE_ENV !== 'development') return;

    console.group('🚀 Performance Metrics');
    console.log('📊 Web Vitals:');
    console.log(`  LCP: ${metrics.lcp}ms ${metrics.lcp > 2500 ? '⚠️' : '✅'}`);
    console.log(`  FID: ${metrics.fid}ms ${metrics.fid > 100 ? '⚠️' : '✅'}`);
    console.log(`  CLS: ${metrics.cls} ${metrics.cls > 0.1 ? '⚠️' : '✅'}`);
    console.log(`  FCP: ${metrics.fcp}ms`);
    console.log(`  TTFB: ${metrics.ttfb}ms`);
    console.log('💾 Resources:');
    console.log(`  Memory: ${metrics.memoryUsage}MB`);
    console.log(`  DOM Nodes: ${metrics.domNodes}`);
    console.log(`  Network Requests: ${metrics.networkRequests}`);
    console.log(`  Load Time: ${metrics.loadTime}ms`);
    console.groupEnd();
  }, [enabled, metrics]);

  if (!enabled || !showDashboard) return null;

  const getStatusColor = (value, thresholds) => {
    if (value <= thresholds.good) return '#10b981'; // green
    if (value <= thresholds.needs_improvement) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const webVitalsThresholds = {
    lcp: { good: 2500, needs_improvement: 4000 },
    fid: { good: 200, needs_improvement: 500 }, // Updated for INP thresholds
    cls: { good: 0.1, needs_improvement: 0.25 },
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '11px',
        fontFamily: 'monospace',
        zIndex: 9999,
        minWidth: isExpanded ? '300px' : '200px',
        maxHeight: '80vh',
        overflowY: 'auto',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '8px',
          cursor: 'pointer'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ fontWeight: 'bold' }}>
          ⚡ Performance Monitor
        </div>
        <div style={{ fontSize: '10px' }}>
          {isExpanded ? '▼' : '▶'}
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          {alerts.map((alert, index) => (
            <div
              key={index}
              style={{
                color: alert.type === 'error' ? '#ef4444' : '#f59e0b',
                fontSize: '10px',
                marginBottom: '2px',
              }}
            >
              {alert.type === 'error' ? '🚨' : '⚠️'} {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* Core Web Vitals */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Web Vitals</div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>LCP:</span>
          <span style={{ color: getStatusColor(metrics.lcp, webVitalsThresholds.lcp) }}>
            {metrics.lcp}ms
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>FID:</span>
          <span style={{ color: getStatusColor(metrics.fid, webVitalsThresholds.fid) }}>
            {metrics.fid}ms
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>CLS:</span>
          <span style={{ color: getStatusColor(metrics.cls, webVitalsThresholds.cls) }}>
            {metrics.cls}
          </span>
        </div>
      </div>

      {/* Basic Metrics */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Memory:</span>
          <span style={{ color: metrics.memoryUsage > 100 ? '#ef4444' : '#10b981' }}>
            {metrics.memoryUsage}MB
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Load:</span>
          <span>{metrics.loadTime}ms</span>
        </div>
      </div>

      {/* Expanded metrics */}
      {isExpanded && (
        <>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Additional Metrics</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>FCP:</span>
              <span>{metrics.fcp}ms</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>TTFB:</span>
              <span>{metrics.ttfb}ms</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>DOM Nodes:</span>
              <span>{metrics.domNodes}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Requests:</span>
              <span>{metrics.networkRequests}</span>
            </div>
          </div>

          <div style={{ fontSize: '9px', opacity: 0.7, textAlign: 'center' }}>
            Click to collapse • F12 for console logs
          </div>
        </>
      )}
    </div>
  );
};

export default PerformanceMonitor;
