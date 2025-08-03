// Tests for PerformanceMonitor component
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import PerformanceMonitor from '../PerformanceMonitor';

// Mock web-vitals with proper cleanup
const mockCallbacks = new Set();

jest.mock('web-vitals', () => ({
  onCLS: jest.fn((callback) => {
    const timeoutId = setTimeout(() => {
      callback({ value: 0.05, name: 'CLS' });
    }, 10);
    mockCallbacks.add(() => clearTimeout(timeoutId));
    return () => clearTimeout(timeoutId);
  }),
  onINP: jest.fn((callback) => {
    const timeoutId = setTimeout(() => {
      callback({ value: 50, name: 'INP' });
    }, 10);
    mockCallbacks.add(() => clearTimeout(timeoutId));
    return () => clearTimeout(timeoutId);
  }),
  onFCP: jest.fn((callback) => {
    const timeoutId = setTimeout(() => {
      callback({ value: 1200, name: 'FCP' });
    }, 10);
    mockCallbacks.add(() => clearTimeout(timeoutId));
    return () => clearTimeout(timeoutId);
  }),
  onLCP: jest.fn((callback) => {
    const timeoutId = setTimeout(() => {
      callback({ value: 2000, name: 'LCP' });
    }, 10);
    mockCallbacks.add(() => clearTimeout(timeoutId));
    return () => clearTimeout(timeoutId);
  }),
  onTTFB: jest.fn((callback) => {
    const timeoutId = setTimeout(() => {
      callback({ value: 500, name: 'TTFB' });
    }, 10);
    mockCallbacks.add(() => clearTimeout(timeoutId));
    return () => clearTimeout(timeoutId);
  }),
  getCLS: jest.fn((callback) => {
    const timeoutId = setTimeout(() => {
      callback({ value: 0.05, name: 'CLS' });
    }, 10);
    mockCallbacks.add(() => clearTimeout(timeoutId));
    return () => clearTimeout(timeoutId);
  }),
  getFID: jest.fn((callback) => {
    const timeoutId = setTimeout(() => {
      callback({ value: 50, name: 'FID' });
    }, 10);
    mockCallbacks.add(() => clearTimeout(timeoutId));
    return () => clearTimeout(timeoutId);
  }),
  getFCP: jest.fn((callback) => {
    const timeoutId = setTimeout(() => {
      callback({ value: 1200, name: 'FCP' });
    }, 10);
    mockCallbacks.add(() => clearTimeout(timeoutId));
    return () => clearTimeout(timeoutId);
  }),
  getLCP: jest.fn((callback) => {
    const timeoutId = setTimeout(() => {
      callback({ value: 2000, name: 'LCP' });
    }, 10);
    mockCallbacks.add(() => clearTimeout(timeoutId));
    return () => clearTimeout(timeoutId);
  }),
  getTTFB: jest.fn((callback) => {
    const timeoutId = setTimeout(() => {
      callback({ value: 500, name: 'TTFB' });
    }, 10);
    mockCallbacks.add(() => clearTimeout(timeoutId));
    return () => clearTimeout(timeoutId);
  }),
}));

// Mock performance.memory
Object.defineProperty(performance, 'memory', {
  value: {
    usedJSHeapSize: 0, // 0MB
    totalJSHeapSize: 100 * 1024 * 1024, // 100MB
    jsHeapSizeLimit: 2 * 1024 * 1024 * 1024, // 2GB
  },
  writable: true,
});

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up all mock callbacks
    mockCallbacks.forEach(cleanup => cleanup());
    mockCallbacks.clear();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders when enabled', () => {
    render(<PerformanceMonitor enabled={true} />);
    
    expect(screen.getByText('⚡ Performance Monitor')).toBeInTheDocument();
  });

  test('does not render when disabled', () => {
    render(<PerformanceMonitor enabled={false} />);
    
    expect(screen.queryByText('⚡ Performance Monitor')).not.toBeInTheDocument();
  });

  test('displays Web Vitals metrics', async () => {
    render(<PerformanceMonitor enabled={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Web Vitals')).toBeInTheDocument();
    });

    // Check for metric labels
    expect(screen.getByText(/LCP:/)).toBeInTheDocument();
    expect(screen.getByText(/FID:/)).toBeInTheDocument();
    expect(screen.getByText(/CLS:/)).toBeInTheDocument();
  });

  test('displays memory usage', async () => {
    render(<PerformanceMonitor enabled={true} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Memory:/)).toBeInTheDocument();
      expect(screen.getByText(/0\s*MB/)).toBeInTheDocument();
    });
  });

  test('calls onMetricsUpdate callback when metrics change', async () => {
    const mockCallback = jest.fn();
    
    await act(async () => {
      render(
        <PerformanceMonitor 
          enabled={true} 
          onMetricsUpdate={mockCallback}
        />
      );
    });
    
    // Fast-forward timers to trigger callbacks
    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalled();
    }, { timeout: 1000 });

    if (mockCallback.mock.calls.length > 0) {
      const lastCall = mockCallback.mock.calls[mockCallback.mock.calls.length - 1];
      const metrics = lastCall[0];
      
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('lcp');
      expect(metrics).toHaveProperty('fid');
      expect(metrics).toHaveProperty('cls');
    }
  });

  test('shows alerts for poor performance', async () => {
    // Mock poor performance values
    const { onCLS, onINP, onLCP } = require('web-vitals');
    
    onCLS.mockImplementation((callback) => {
      const timeoutId = setTimeout(() => callback({ value: 0.3, name: 'CLS' }), 10);
      return () => clearTimeout(timeoutId);
    });
    
    onINP.mockImplementation((callback) => {
      const timeoutId = setTimeout(() => callback({ value: 300, name: 'INP' }), 10);
      return () => clearTimeout(timeoutId);
    });
    
    onLCP.mockImplementation((callback) => {
      const timeoutId = setTimeout(() => callback({ value: 3000, name: 'LCP' }), 10);
      return () => clearTimeout(timeoutId);
    });

    await act(async () => {
      render(<PerformanceMonitor enabled={true} />);
    });
    
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/LCP is slow/)).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  test('expands and collapses when clicked', async () => {
    render(<PerformanceMonitor enabled={true} />);
    
    const header = screen.getByText('⚡ Performance Monitor');
    
    // Initially collapsed (should show ▶)
    expect(screen.getByText('▶')).toBeInTheDocument();
    
    // Click to expand
    header.click();
    
    await waitFor(() => {
      expect(screen.getByText('▼')).toBeInTheDocument();
      expect(screen.getByText('Additional Metrics')).toBeInTheDocument();
    });
  });

  test('updates metrics in real-time when enabled', async () => {
    const mockCallback = jest.fn();
    
    await act(async () => {
      render(
        <PerformanceMonitor 
          enabled={true}
          enableRealTimeMonitoring={true}
          onMetricsUpdate={mockCallback}
        />
      );
    });
    
    // Fast-forward initial timers
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    // Wait for initial metrics
    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalled();
    }, { timeout: 1000 });

    const initialCallCount = mockCallback.mock.calls.length;
    
    // Fast-forward to trigger real-time updates (every 2 seconds)
    act(() => {
      jest.advanceTimersByTime(2100);
    });
    
    // Check if more calls were made
    await waitFor(() => {
      expect(mockCallback.mock.calls.length).toBeGreaterThan(initialCallCount);
    }, { timeout: 1000 });
  });

  test('does not show dashboard when showDashboard is false', () => {
    render(<PerformanceMonitor enabled={true} showDashboard={false} />);
    
    expect(screen.queryByText('⚡ Performance Monitor')).not.toBeInTheDocument();
  });

  test('handles missing performance.memory gracefully', () => {
    // Temporarily remove performance.memory
    const originalMemory = performance.memory;
    delete performance.memory;
    
    render(<PerformanceMonitor enabled={true} />);
    
    expect(screen.getByText('⚡ Performance Monitor')).toBeInTheDocument();
    
    // Restore performance.memory
    performance.memory = originalMemory;
  });

  test('logs metrics to console in development', async () => {
    const consoleSpy = jest.spyOn(console, 'group').mockImplementation();
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    const consoleGroupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation();
    
    // Set NODE_ENV to development
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    render(<PerformanceMonitor enabled={true} />);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('🚀 Performance Metrics');
    });
    
    // Restore environment and clean up spies
    process.env.NODE_ENV = originalEnv;
    consoleSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleGroupEndSpy.mockRestore();
  });
});