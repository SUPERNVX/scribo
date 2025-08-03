# Performance Monitoring System

A comprehensive performance monitoring solution for React applications with Web Vitals tracking, memory monitoring, and real-time performance analytics.

## Features

### 🚀 Web Vitals Tracking
- **LCP (Largest Contentful Paint)**: Measures loading performance
- **FID (First Input Delay)**: Measures interactivity
- **CLS (Cumulative Layout Shift)**: Measures visual stability
- **FCP (First Contentful Paint)**: Measures perceived loading speed
- **TTFB (Time to First Byte)**: Measures server response time

### 📊 Real-time Monitoring
- Memory usage tracking
- DOM complexity analysis
- Network request monitoring
- Component render performance
- Long task detection

### 🎯 Performance Dashboard
- Interactive performance dashboard (Ctrl+Shift+P)
- Real-time metrics visualization
- Performance score calculation
- Historical data tracking
- Export capabilities

### 🔧 Developer Tools
- Performance monitor widget
- Console logging with detailed metrics
- Component-level performance tracking
- Function execution timing
- Async operation monitoring

## Quick Start

### 1. Basic Setup

```jsx
import React from 'react';
import { PerformanceProvider } from './components/performance';

function App() {
  return (
    <PerformanceProvider
      enabled={process.env.NODE_ENV === 'development'}
      showMonitor={true}
    >
      <YourApp />
    </PerformanceProvider>
  );
}
```

### 2. Component Performance Tracking

```jsx
import React, { useState } from 'react';
import { usePerformance } from './hooks/usePerformance';

function MyComponent() {
  const { renderCount, measureSync, measureAsync } = usePerformance('MyComponent', {
    trackRenders: true,
    trackMemory: true,
    logToConsole: true,
  });

  const handleExpensiveOperation = () => {
    const result = measureSync('expensive-calculation', () => {
      // Your expensive operation here
      return performCalculation();
    });
  };

  const handleAsyncOperation = async () => {
    const data = await measureAsync('api-call', async () => {
      return fetch('/api/data').then(res => res.json());
    });
  };

  return (
    <div>
      <p>Rendered {renderCount} times</p>
      <button onClick={handleExpensiveOperation}>
        Run Expensive Operation
      </button>
      <button onClick={handleAsyncOperation}>
        Make API Call
      </button>
    </div>
  );
}
```

### 3. Web Vitals Only

```jsx
import { useWebVitals } from './hooks/usePerformance';

function WebVitalsTracker() {
  const vitals = useWebVitals((metric) => {
    // Send to analytics service
    analytics.track('web_vital', {
      name: metric.name,
      value: metric.value,
    });
  });

  return (
    <div>
      <p>LCP: {vitals.lcp}ms</p>
      <p>FID: {vitals.fid}ms</p>
      <p>CLS: {vitals.cls}</p>
    </div>
  );
}
```

## Components

### PerformanceProvider

Main provider component that initializes performance monitoring.

**Props:**
- `enabled` (boolean): Enable/disable monitoring
- `showMonitor` (boolean): Show performance monitor widget
- `config` (object): Configuration options

**Config Options:**
```jsx
{
  enableConsoleLogging: true,
  enableWebVitals: true,
  enableResourceTiming: true,
  enableMemoryMonitoring: true,
  sampleRate: 1, // 0-1, percentage of users to monitor
}
```

### PerformanceMonitor

Real-time performance monitoring widget.

**Props:**
- `enabled` (boolean): Enable/disable widget
- `onMetricsUpdate` (function): Callback for metric updates
- `enableRealTimeMonitoring` (boolean): Enable real-time updates
- `showDashboard` (boolean): Show/hide widget

### PerformanceDashboard

Comprehensive performance dashboard with detailed analytics.

**Features:**
- Web Vitals overview
- Resource usage monitoring
- Network activity tracking
- Performance score calculation
- Historical data visualization

## Hooks

### usePerformance

Main performance monitoring hook for components.

```jsx
const {
  renderCount,
  renderTime,
  memoryUsage,
  webVitals,
  measureSync,
  measureAsync,
} = usePerformance('ComponentName', options);
```

**Options:**
- `trackWebVitals` (boolean): Track Web Vitals
- `trackMemory` (boolean): Track memory usage
- `trackRenders` (boolean): Track render performance
- `logToConsole` (boolean): Log to console

### useWebVitals

Dedicated hook for Web Vitals monitoring.

```jsx
const vitals = useWebVitals((metric) => {
  // Handle metric update
});
```

### useMemoryMonitor

Monitor memory usage with configurable intervals.

```jsx
const { used, total, percentage } = useMemoryMonitor(5000); // 5 second interval
```

## Utilities

### Performance Monitoring Service

Global service for centralized performance tracking.

```jsx
import { performanceMonitor } from './utils/performanceMonitoring';

// Initialize monitoring
performanceMonitor.init({
  enableWebVitals: true,
  enableConsoleLogging: true,
});

// Record custom metrics
performanceMonitor.recordMetric('custom', 'my-metric', { value: 100 });

// Get performance summary
const summary = performanceMonitor.getPerformanceSummary();

// Export all metrics
const data = performanceMonitor.exportMetrics();
```

### Function Measurement

Utility functions for measuring performance.

```jsx
import { measureFunction, measureAsyncFunction, mark, measure } from './utils/performanceMonitoring';

// Wrap functions for automatic measurement
const optimizedFunction = measureFunction('my-function', originalFunction);
const optimizedAsyncFunction = measureAsyncFunction('my-async-function', originalAsyncFunction);

// Manual timing
mark('operation-start');
// ... do work ...
mark('operation-end');
measure('operation-duration', 'operation-start', 'operation-end');
```

## Performance Thresholds

### Web Vitals Ratings

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP    | ≤2.5s | ≤4.0s | >4.0s |
| FID    | ≤100ms | ≤300ms | >300ms |
| CLS    | ≤0.1 | ≤0.25 | >0.25 |
| FCP    | ≤1.8s | ≤3.0s | >3.0s |
| TTFB   | ≤800ms | ≤1.8s | >1.8s |

### Performance Score

The system calculates an overall performance score (0-100) based on:
- Web Vitals ratings (60% weight)
- Memory usage (25% weight)
- Load time (15% weight)

## Production Usage

### Analytics Integration

```jsx
// Initialize with analytics
performanceMonitor.init({
  enableWebVitals: true,
  enableConsoleLogging: false,
  sampleRate: 0.1, // Monitor 10% of users
});

// Send metrics to analytics service
const sendMetrics = () => {
  const summary = performanceMonitor.getPerformanceSummary();
  
  // Google Analytics
  if (window.gtag) {
    window.gtag('event', 'web_vitals', {
      lcp: summary.webVitals.lcp,
      fid: summary.webVitals.fid,
      cls: summary.webVitals.cls,
      performance_score: summary.score,
    });
  }
  
  // Custom analytics endpoint
  fetch('/api/analytics/performance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(summary),
  });
};
```

### Error Monitoring

```jsx
// Monitor performance-related errors
window.addEventListener('error', (event) => {
  performanceMonitor.recordMetric('errors', 'javascript-error', {
    message: event.error.message,
    stack: event.error.stack,
    timestamp: Date.now(),
  });
});

// Monitor unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  performanceMonitor.recordMetric('errors', 'unhandled-rejection', {
    reason: event.reason,
    timestamp: Date.now(),
  });
});
```

## Best Practices

### 1. Selective Monitoring
- Enable full monitoring only in development
- Use sampling in production (10-20% of users)
- Monitor critical user journeys

### 2. Performance Budgets
- Set performance budgets for key metrics
- Alert when budgets are exceeded
- Track performance over time

### 3. Component Optimization
- Use performance hooks to identify slow components
- Measure before and after optimizations
- Focus on components with high render counts

### 4. Memory Management
- Monitor memory usage trends
- Identify memory leaks early
- Clean up resources properly

## Keyboard Shortcuts

- **Ctrl+Shift+P**: Open performance dashboard
- **Ctrl+Shift+M**: Toggle performance monitor widget
- **Ctrl+Shift+E**: Export performance data

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

**Note:** Some features (like memory monitoring) are only available in Chromium-based browsers.

## Troubleshooting

### Common Issues

1. **Web Vitals not reporting**: Ensure the page has user interactions for FID
2. **Memory monitoring unavailable**: Only available in Chromium browsers
3. **High memory usage**: Check for memory leaks in components
4. **Poor performance scores**: Focus on optimizing LCP and CLS first

### Debug Mode

Enable debug mode for detailed logging:

```jsx
performanceMonitor.init({
  enableConsoleLogging: true,
  debug: true,
});
```

## Contributing

When adding new performance metrics:

1. Add the metric to the `PerformanceMonitoringService`
2. Update the dashboard to display the new metric
3. Add tests for the new functionality
4. Update this documentation

## License

This performance monitoring system is part of the Scribo project and follows the same license terms.