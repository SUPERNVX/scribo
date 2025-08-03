// Production-specific optimizations
import { initializeApp } from './bundleOptimization';

/**
 * Initialize production optimizations
 */
export const initProductionOptimizations = () => {
  if (process.env.NODE_ENV === 'production') {
    // Remove console.logs in production
    if (typeof console !== 'undefined') {
      console.log = () => {};
      console.debug = () => {};
      console.info = () => {};
    }

    // Initialize app optimizations
    initializeApp();

    // Add error boundary for production
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Performance monitoring
    monitorCoreWebVitals();
  }
};

/**
 * Global error handler
 */
const handleGlobalError = event => {
  // In production, you might want to send errors to a service like Sentry
  console.error('Global error:', event.error);
};

/**
 * Unhandled promise rejection handler
 */
const handleUnhandledRejection = event => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
};

/**
 * Monitor Core Web Vitals
 */
const monitorCoreWebVitals = () => {
  // Import and initialize performance monitoring
  import('./performanceMonitoring').then(({ performanceMonitor }) => {
    performanceMonitor.init({
      enableConsoleLogging: false, // Disable console logging in production
      sampleRate: 0.1, // Sample 10% of users in production
      enableWebVitals: true,
      enableResourceTiming: true,
      enableMemoryMonitoring: true,
    });

    // Send metrics to analytics service (if available)
    const sendMetrics = () => {
      const summary = performanceMonitor.getPerformanceSummary();
      
      // Example: Send to analytics service
      if (window.gtag) {
        window.gtag('event', 'web_vitals', {
          event_category: 'Performance',
          lcp: summary.webVitals.lcp,
          fid: summary.webVitals.fid,
          cls: summary.webVitals.cls,
          performance_score: summary.score,
        });
      }

      // Example: Send to custom analytics endpoint
      if (window.fetch) {
        fetch('/api/analytics/performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(summary),
        }).catch(() => {
          // Silently fail in production
        });
      }
    };

    // Send metrics after page load and periodically
    window.addEventListener('load', () => {
      setTimeout(sendMetrics, 5000); // Wait 5s after load
    });

    // Send metrics every 30 seconds
    setInterval(sendMetrics, 30000);
  }).catch(() => {
    // Fallback to basic performance monitoring if module fails to load
    if (window.performance && window.performance.measure) {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            // Basic FCP tracking
            if (window.gtag) {
              window.gtag('event', 'timing_complete', {
                name: 'FCP',
                value: Math.round(entry.startTime),
              });
            }
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['paint'] });
      } catch (e) {
        // Silently fail if observer is not supported
      }
    }
  });
};

/**
 * Optimize for mobile devices
 */
export const optimizeForMobile = () => {
  // Disable hover effects on touch devices
  if ('ontouchstart' in window) {
    document.body.classList.add('touch-device');
  }

  // Optimize viewport for mobile
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.content =
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
  }

  // Prevent zoom on input focus (iOS)
  const inputs = document.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      if (window.innerWidth < 768) {
        document.querySelector('meta[name="viewport"]').content =
          'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
      }
    });
  });
};

/**
 * Memory management
 */
export const optimizeMemoryUsage = () => {
  // Clean up intervals and timeouts
  const cleanupIntervals = [];
  const cleanupTimeouts = [];

  const originalSetInterval = window.setInterval;
  const originalSetTimeout = window.setTimeout;

  window.setInterval = (...args) => {
    const id = originalSetInterval(...args);
    cleanupIntervals.push(id);
    return id;
  };

  window.setTimeout = (...args) => {
    const id = originalSetTimeout(...args);
    cleanupTimeouts.push(id);
    return id;
  };

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    cleanupIntervals.forEach(id => clearInterval(id));
    cleanupTimeouts.forEach(id => clearTimeout(id));
  });
};

/**
 * Network optimization
 */
export const optimizeNetworkRequests = () => {
  // Add request deduplication
  const pendingRequests = new Map();

  const originalFetch = window.fetch;
  window.fetch = (url, options = {}) => {
    const key = `${url}-${JSON.stringify(options)}`;

    if (pendingRequests.has(key)) {
      return pendingRequests.get(key);
    }

    const promise = originalFetch(url, options).finally(() => {
      pendingRequests.delete(key);
    });

    pendingRequests.set(key, promise);
    return promise;
  };
};

// Initialize optimizations
if (typeof window !== 'undefined') {
  initProductionOptimizations();
  optimizeForMobile();
  optimizeMemoryUsage();
  optimizeNetworkRequests();
}
