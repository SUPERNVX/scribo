// Tests for performance monitoring utilities
import { 
  PerformanceMonitoringService, 
  performanceMonitor,
  measureFunction,
  measureAsyncFunction,
  mark,
  measure,
  performanceMonitorDecorator
} from '../performanceMonitoring';
import { act } from '@testing-library/react';

// Mock web-vitals with proper cleanup
jest.mock('web-vitals', () => ({
  onCLS: jest.fn((callback) => {
    if (typeof callback === 'function') {
      const timeoutId = setTimeout(() => callback({ 
        value: 0.05, 
        name: 'CLS',
        id: 'test-cls',
        delta: 0.05
      }), 10);
      return () => clearTimeout(timeoutId);
    }
    return () => {};
  }),
  onINP: jest.fn((callback) => {
    if (typeof callback === 'function') {
      const timeoutId = setTimeout(() => callback({ 
        value: 50, 
        name: 'INP',
        id: 'test-inp',
        delta: 50
      }), 10);
      return () => clearTimeout(timeoutId);
    }
    return () => {};
  }),
  onFCP: jest.fn((callback) => {
    if (typeof callback === 'function') {
      const timeoutId = setTimeout(() => callback({ 
        value: 1200, 
        name: 'FCP',
        id: 'test-fcp',
        delta: 1200
      }), 10);
      return () => clearTimeout(timeoutId);
    }
    return () => {};
  }),
  onLCP: jest.fn((callback) => {
    if (typeof callback === 'function') {
      const timeoutId = setTimeout(() => callback({ 
        value: 2000, 
        name: 'LCP',
        id: 'test-lcp',
        delta: 2000
      }), 10);
      return () => clearTimeout(timeoutId);
    }
    return () => {};
  }),
  onTTFB: jest.fn((callback) => {
    if (typeof callback === 'function') {
      const timeoutId = setTimeout(() => callback({ 
        value: 500, 
        name: 'TTFB',
        id: 'test-ttfb',
        delta: 500
      }), 10);
      return () => clearTimeout(timeoutId);
    }
    return () => {};
  }),
}));

describe('PerformanceMonitoringService', () => {
  let service;

  beforeEach(() => {
    jest.useFakeTimers();
    service = new PerformanceMonitoringService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (service && service.isMonitoring) {
      service.stop();
    }
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('initializes correctly', () => {
    expect(service).toBeDefined();
    expect(service.isMonitoring).toBe(false);
    expect(service.metrics).toBeDefined();
  });

  test('starts monitoring when initialized', async () => {
    await act(async () => {
      await service.init();
    });

    expect(service.isMonitoring).toBe(true);
  });

  test('generates performance summary', async () => {
    await act(async () => {
      await service.init();
    });

    // Fast-forward timers to trigger web vitals callbacks
    act(() => {
      jest.advanceTimersByTime(100);
    });

    const summary = service.generateSummary();
    expect(summary).toBeDefined();
    expect(summary.timestamp).toBeDefined();
  });

  test('calculates performance score', async () => {
    await act(async () => {
      await service.init();
    });

    // Fast-forward timers to trigger web vitals callbacks
    act(() => {
      jest.advanceTimersByTime(100);
    });

    const score = service.calculatePerformanceScore();
    expect(typeof score).toBe('number');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('stops monitoring and cleans up', async () => {
    await act(async () => {
      await service.init();
    });

    expect(service.isMonitoring).toBe(true);

    service.stop();
    expect(service.isMonitoring).toBe(false);
  });
});

describe('Performance Utilities', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('measureFunction works correctly', () => {
    const testFunction = jest.fn(() => 'result');
    const result = measureFunction('test', testFunction);
    
    expect(result).toBe('result');
    expect(testFunction).toHaveBeenCalled();
  });

  test('measureAsyncFunction works correctly', async () => {
    const testAsyncFunction = jest.fn(async () => 'async result');
    
    await act(async () => {
      const result = await measureAsyncFunction('test', testAsyncFunction);
      expect(result).toBe('async result');
      expect(testAsyncFunction).toHaveBeenCalled();
    });
  });

  test('mark function works', () => {
    expect(() => mark('test-mark')).not.toThrow();
  });

  test('measure function works', () => {
    mark('start-mark');
    mark('end-mark');
    expect(() => measure('test-measure', 'start-mark', 'end-mark')).not.toThrow();
  });

  test('performanceMonitor decorator works', () => {
    const TestClass = performanceMonitorDecorator(class {
      testMethod() {
        return 'decorated result';
      }
    });

    const instance = new TestClass();
    const result = instance.testMethod();
    expect(result).toBe('decorated result');
  });
});