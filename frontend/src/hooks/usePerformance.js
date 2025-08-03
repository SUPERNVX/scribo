// Enhanced Performance monitoring hook with Web Vitals
import { useEffect, useRef, useState, useCallback } from 'react';
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

/**
 * usePerformance Hook
 * Monitora performance de componentes e Web Vitals
 */
export const usePerformance = (componentName, options = {}) => {
  const {
    trackWebVitals = false,
    trackMemory = false,
    trackRenders = true,
    logToConsole = process.env.NODE_ENV === 'development'
  } = options;

  const renderCount = useRef(0);
  const startTime = useRef(performance.now());
  const mountTime = useRef(performance.now());
  
  const [metrics, setMetrics] = useState({
    renderCount: 0,
    renderTime: 0,
    totalRenderTime: 0,
    averageRenderTime: 0,
    memoryUsage: 0,
    webVitals: {
      lcp: 0,
      fid: 0,
      cls: 0,
      fcp: 0,
      ttfb: 0,
    }
  });

  // Track component renders
  useEffect(() => {
    if (!trackRenders) return;

    renderCount.current += 1;
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    const totalTime = endTime - mountTime.current;

    setMetrics(prev => ({
      ...prev,
      renderCount: renderCount.current,
      renderTime,
      totalRenderTime: totalTime,
      averageRenderTime: totalTime / renderCount.current,
    }));

    if (logToConsole) {
      console.log(
        `🔍 ${componentName} - Render #${renderCount.current} - ${renderTime.toFixed(2)}ms`
      );
    }

    startTime.current = performance.now();
  });

  // Track memory usage
  useEffect(() => {
    if (!trackMemory || !performance.memory) return;

    const updateMemory = () => {
      const memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
      setMetrics(prev => ({
        ...prev,
        memoryUsage,
      }));
    };

    updateMemory();
    const interval = setInterval(updateMemory, 5000);

    return () => clearInterval(interval);
  }, [trackMemory]);

  // Track Web Vitals
  useEffect(() => {
    if (!trackWebVitals) return;

    const updateWebVital = (metric, value) => {
      setMetrics(prev => ({
        ...prev,
        webVitals: {
          ...prev.webVitals,
          [metric]: Math.round(value * (metric === 'cls' ? 1000 : 1)) / (metric === 'cls' ? 1000 : 1),
        }
      }));

      if (logToConsole) {
        console.log(`📊 ${componentName} - ${metric.toUpperCase()}: ${value}${metric === 'cls' ? '' : 'ms'}`);
      }
    };

    onCLS((metric) => updateWebVital('cls', metric.value));
    onINP((metric) => updateWebVital('fid', metric.value));
    onFCP((metric) => updateWebVital('fcp', metric.value));
    onLCP((metric) => updateWebVital('lcp', metric.value));
    onTTFB((metric) => updateWebVital('ttfb', metric.value));
  }, [trackWebVitals, componentName, logToConsole]);

  // Performance measurement utility
  const measureAsync = useCallback(async (name, asyncFn) => {
    const start = performance.now();
    try {
      const result = await asyncFn();
      const end = performance.now();
      
      if (logToConsole) {
        console.log(`⚡ ${componentName} - ${name}: ${(end - start).toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const end = performance.now();
      
      if (logToConsole) {
        console.error(`❌ ${componentName} - ${name} failed after ${(end - start).toFixed(2)}ms:`, error);
      }
      
      throw error;
    }
  }, [componentName, logToConsole]);

  const measureSync = useCallback((name, syncFn) => {
    const start = performance.now();
    try {
      const result = syncFn();
      const end = performance.now();
      
      if (logToConsole) {
        console.log(`⚡ ${componentName} - ${name}: ${(end - start).toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const end = performance.now();
      
      if (logToConsole) {
        console.error(`❌ ${componentName} - ${name} failed after ${(end - start).toFixed(2)}ms:`, error);
      }
      
      throw error;
    }
  }, [componentName, logToConsole]);

  return {
    ...metrics,
    measureAsync,
    measureSync,
  };
};

/**
 * useWebVitals Hook
 * Dedicated hook for Web Vitals monitoring
 */
export const useWebVitals = (onMetric) => {
  const [vitals, setVitals] = useState({
    lcp: 0,
    fid: 0,
    cls: 0,
    fcp: 0,
    ttfb: 0,
  });

  useEffect(() => {
    const updateVital = (name, value) => {
      const roundedValue = Math.round(value * (name === 'cls' ? 1000 : 1)) / (name === 'cls' ? 1000 : 1);
      
      setVitals(prev => ({
        ...prev,
        [name]: roundedValue,
      }));

      onMetric?.({ name, value: roundedValue });
    };

    onCLS((metric) => updateVital('cls', metric.value));
    onINP((metric) => updateVital('fid', metric.value));
    onFCP((metric) => updateVital('fcp', metric.value));
    onLCP((metric) => updateVital('lcp', metric.value));
    onTTFB((metric) => updateVital('ttfb', metric.value));
  }, [onMetric]);

  return vitals;
};

/**
 * useMemoryMonitor Hook
 * Monitor memory usage
 */
export const useMemoryMonitor = (interval = 5000) => {
  const [memoryInfo, setMemoryInfo] = useState({
    used: 0,
    total: 0,
    percentage: 0,
  });

  useEffect(() => {
    if (!performance.memory) return;

    const updateMemory = () => {
      const used = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
      const total = Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024);
      const percentage = Math.round((used / total) * 100);

      setMemoryInfo({ used, total, percentage });
    };

    updateMemory();
    const intervalId = setInterval(updateMemory, interval);

    return () => clearInterval(intervalId);
  }, [interval]);

  return memoryInfo;
};

export default usePerformance;
