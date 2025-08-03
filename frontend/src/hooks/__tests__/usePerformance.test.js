// Tests for usePerformance hooks
import { renderHook, act } from '@testing-library/react';
import { usePerformance, useWebVitals, useMemoryMonitor } from '../usePerformance';

// Mock web-vitals
jest.mock('web-vitals', () => ({
  getCLS: jest.fn((callback) => {
    setTimeout(() => callback({ value: 0.05, name: 'CLS' }), 100);
  }),
  getFID: jest.fn((callback) => {
    setTimeout(() => callback({ value: 50, name: 'FID' }), 100);
  }),
  getFCP: jest.fn((callback) => {
    setTimeout(() => callback({ value: 1200, name: 'FCP' }), 100);
  }),
  getLCP: jest.fn((callback) => {
    setTimeout(() => callback({ value: 2000, name: 'LCP' }), 100);
  }),
  getTTFB: jest.fn((callback) => {
    setTimeout(() => callback({ value: 500, name: 'TTFB' }), 100);
  }),
}));

// Mock performance.memory
Object.defineProperty(performance, 'memory', {
  value: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    totalJSHeapSize: 100 * 1024 * 1024, // 100MB
    jsHeapSizeLimit: 2 * 1024 * 1024 * 1024, // 2GB
  },
  writable: true,
});

describe('usePerformance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  test('tracks render count by default', () => {
    const { result, rerender } = renderHook(() => 
      usePerformance('TestComponent')
    );

    expect(result.current.renderCount).toBe(1);

    rerender();
    expect(result.current.renderCount).toBe(2);

    rerender();
    expect(result.current.renderCount).toBe(3);
  });

  test('tracks Web Vitals when enabled', async () => {
    const { result, waitForNextUpdate } = renderHook(() => 
      usePerformance('TestComponent', { trackWebVitals: true })
    );

    await waitForNextUpdate();

    expect(result.current.webVitals.cls).toBe(0.05);
    expect(result.current.webVitals.fid).toBe(50);
    expect(result.current.webVitals.lcp).toBe(2000);
    expect(result.current.webVitals.fcp).toBe(1200);
    expect(result.current.webVitals.ttfb).toBe(500);
  });

  test('tracks memory usage when enabled', async () => {
    const { result, waitForNextUpdate } = renderHook(() => 
      usePerformance('TestComponent', { trackMemory: true })
    );

    await waitForNextUpdate();

    expect(result.current.memoryUsage).toBe(50); // 50MB
  });

  test('provides measureAsync function', async () => {
    const { result } = renderHook(() => 
      usePerformance('TestComponent')
    );

    const asyncFunction = jest.fn().mockResolvedValue('test result');
    
    const measuredResult = await result.current.measureAsync('test-async', asyncFunction);
    
    expect(measuredResult).toBe('test result');
    expect(asyncFunction).toHaveBeenCalled();
  });

  test('provides measureSync function', () => {
    const { result } = renderHook(() => 
      usePerformance('TestComponent')
    );

    const syncFunction = jest.fn().mockReturnValue('test result');
    
    const measuredResult = result.current.measureSync('test-sync', syncFunction);
    
    expect(measuredResult).toBe('test result');
    expect(syncFunction).toHaveBeenCalled();
  });

  test('handles async function errors', async () => {
    const { result } = renderHook(() => 
      usePerformance('TestComponent')
    );

    const errorFunction = jest.fn().mockRejectedValue(new Error('Test error'));
    
    await expect(
      result.current.measureAsync('test-error', errorFunction)
    ).rejects.toThrow('Test error');
  });

  test('handles sync function errors', () => {
    const { result } = renderHook(() => 
      usePerformance('TestComponent')
    );

    const errorFunction = jest.fn().mockImplementation(() => {
      throw new Error('Test error');
    });
    
    expect(() => 
      result.current.measureSync('test-error', errorFunction)
    ).toThrow('Test error');
  });

  test('logs to console when enabled', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    
    renderHook(() => 
      usePerformance('TestComponent', { logToConsole: true })
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('🔍 TestComponent - Render #1')
    );
  });

  test('does not log to console when disabled', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    
    renderHook(() => 
      usePerformance('TestComponent', { logToConsole: false })
    );

    expect(consoleSpy).not.toHaveBeenCalled();
  });
});

describe('useWebVitals', () => {
  test('returns Web Vitals metrics', async () => {
    const mockCallback = jest.fn();
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useWebVitals(mockCallback)
    );

    await waitForNextUpdate();

    expect(result.current.cls).toBe(0.05);
    expect(result.current.fid).toBe(50);
    expect(result.current.lcp).toBe(2000);
    expect(result.current.fcp).toBe(1200);
    expect(result.current.ttfb).toBe(500);

    expect(mockCallback).toHaveBeenCalledTimes(5); // One for each metric
  });

  test('calls callback with metric data', async () => {
    const mockCallback = jest.fn();
    
    const { waitForNextUpdate } = renderHook(() => 
      useWebVitals(mockCallback)
    );

    await waitForNextUpdate();

    expect(mockCallback).toHaveBeenCalledWith({ name: 'cls', value: 0.05 });
    expect(mockCallback).toHaveBeenCalledWith({ name: 'fid', value: 50 });
    expect(mockCallback).toHaveBeenCalledWith({ name: 'lcp', value: 2000 });
    expect(mockCallback).toHaveBeenCalledWith({ name: 'fcp', value: 1200 });
    expect(mockCallback).toHaveBeenCalledWith({ name: 'ttfb', value: 500 });
  });
});

describe('useMemoryMonitor', () => {
  test('returns memory information', async () => {
    const { result, waitForNextUpdate } = renderHook(() => 
      useMemoryMonitor(100) // 100ms interval for faster testing
    );

    await waitForNextUpdate();

    expect(result.current.used).toBe(50); // 50MB
    expect(result.current.total).toBe(100); // 100MB
    expect(result.current.percentage).toBe(50); // 50%
  });

  test('handles missing performance.memory', () => {
    // Temporarily remove performance.memory
    const originalMemory = performance.memory;
    delete performance.memory;
    
    const { result } = renderHook(() => useMemoryMonitor());

    expect(result.current.used).toBe(0);
    expect(result.current.total).toBe(0);
    expect(result.current.percentage).toBe(0);
    
    // Restore performance.memory
    performance.memory = originalMemory;
  });

  test('updates memory info at specified interval', async () => {
    const { result, waitForNextUpdate } = renderHook(() => 
      useMemoryMonitor(50) // 50ms interval
    );

    const initialUsed = result.current.used;

    // Simulate memory change
    performance.memory.usedJSHeapSize = 75 * 1024 * 1024; // 75MB

    await waitForNextUpdate();

    expect(result.current.used).toBe(75);
    expect(result.current.percentage).toBe(75);
  });
});