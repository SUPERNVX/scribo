// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';

// Store original timers
const originalSetTimeout = global.setTimeout;
const originalSetInterval = global.setInterval;
const originalClearTimeout = global.clearTimeout;
const originalClearInterval = global.clearInterval;

// Track active timers for cleanup
const activeTimers = new Set();
const activeIntervals = new Set();

// Override setTimeout to track timers
global.setTimeout = (callback, delay, ...args) => {
  const id = originalSetTimeout(callback, delay, ...args);
  activeTimers.add(id);
  return id;
};

// Override setInterval to track intervals
global.setInterval = (callback, delay, ...args) => {
  const id = originalSetInterval(callback, delay, ...args);
  activeIntervals.add(id);
  return id;
};

// Override clearTimeout to untrack timers
global.clearTimeout = (id) => {
  activeTimers.delete(id);
  return originalClearTimeout(id);
};

// Override clearInterval to untrack intervals
global.clearInterval = (id) => {
  activeIntervals.delete(id);
  return originalClearInterval(id);
};

// Mock web-vitals with proper cleanup
jest.mock('web-vitals', () => ({
  onCLS: jest.fn((callback) => {
    const id = setTimeout(() => callback({ value: 0.05, name: 'CLS' }), 10);
    return () => clearTimeout(id);
  }),
  onINP: jest.fn((callback) => {
    const id = setTimeout(() => callback({ value: 50, name: 'INP' }), 10);
    return () => clearTimeout(id);
  }),
  onFCP: jest.fn((callback) => {
    const id = setTimeout(() => callback({ value: 1200, name: 'FCP' }), 10);
    return () => clearTimeout(id);
  }),
  onLCP: jest.fn((callback) => {
    const id = setTimeout(() => callback({ value: 2000, name: 'LCP' }), 10);
    return () => clearTimeout(id);
  }),
  onTTFB: jest.fn((callback) => {
    const id = setTimeout(() => callback({ value: 500, name: 'TTFB' }), 10);
    return () => clearTimeout(id);
  }),
  getCLS: jest.fn((callback) => {
    const id = setTimeout(() => callback({ value: 0.05, name: 'CLS' }), 10);
    return () => clearTimeout(id);
  }),
  getFID: jest.fn((callback) => {
    const id = setTimeout(() => callback({ value: 50, name: 'FID' }), 10);
    return () => clearTimeout(id);
  }),
  getFCP: jest.fn((callback) => {
    const id = setTimeout(() => callback({ value: 1200, name: 'FCP' }), 10);
    return () => clearTimeout(id);
  }),
  getLCP: jest.fn((callback) => {
    const id = setTimeout(() => callback({ value: 2000, name: 'LCP' }), 10);
    return () => clearTimeout(id);
  }),
  getTTFB: jest.fn((callback) => {
    const id = setTimeout(() => callback({ value: 500, name: 'TTFB' }), 10);
    return () => clearTimeout(id);
  }),
}));

// Mock performance APIs for testing
global.performance = global.performance || {};

// Mock performance.getEntriesByType
global.performance.getEntriesByType = jest.fn((type) => {
  if (type === 'navigation') {
    return [{
      loadEventEnd: 2000,
      fetchStart: 500,
      domainLookupStart: 600,
      domainLookupEnd: 650,
      connectStart: 650,
      connectEnd: 700,
      requestStart: 700,
      responseStart: 800,
      responseEnd: 1000,
      domContentLoadedEventStart: 1200,
      loadEventStart: 1800,
    }];
  }
  if (type === 'resource') {
    return [
      { name: 'script.js', duration: 100, transferSize: 1024 },
      { name: 'style.css', duration: 50, transferSize: 512 },
    ];
  }
  return [];
});

// Mock performance.mark and performance.measure
global.performance.mark = jest.fn();
global.performance.measure = jest.fn();
global.performance.getEntriesByName = jest.fn(() => [
  { duration: 100, startTime: 0 }
]);

// Mock performance.memory
Object.defineProperty(global.performance, 'memory', {
  value: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    totalJSHeapSize: 100 * 1024 * 1024, // 100MB
    jsHeapSizeLimit: 2 * 1024 * 1024 * 1024, // 2GB
  },
  writable: true,
  configurable: true,
});

// Mock PerformanceObserver
global.PerformanceObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock PerformanceObserver.supportedEntryTypes
Object.defineProperty(global.PerformanceObserver, 'supportedEntryTypes', {
  value: ['navigation', 'resource', 'measure', 'longtask', 'paint'],
  writable: false,
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock framer-motion to prevent animation issues in tests
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: ({ children, ...props }) => React.createElement('div', props, children),
      button: ({ children, ...props }) => React.createElement('button', props, children),
      span: ({ children, ...props }) => React.createElement('span', props, children),
      p: ({ children, ...props }) => React.createElement('p', props, children),
      h1: ({ children, ...props }) => React.createElement('h1', props, children),
      h2: ({ children, ...props }) => React.createElement('h2', props, children),
      h3: ({ children, ...props }) => React.createElement('h3', props, children),
    },
    AnimatePresence: ({ children }) => children,
    useAnimation: () => ({
      start: jest.fn(),
      stop: jest.fn(),
      set: jest.fn(),
    }),
  };
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Suppress console warnings in tests
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: React does not recognize') ||
       args[0].includes('Warning: An update to') ||
       args[0].includes('act(...)') ||
       args[0].includes('Error reading localStorage'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Performance measurement error') ||
       args[0].includes('componentWillReceiveProps'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
  console.log = originalLog;
});

// Clean up after each test
afterEach(() => {
  // Clear all active timers
  activeTimers.forEach(id => {
    originalClearTimeout(id);
  });
  activeTimers.clear();

  // Clear all active intervals
  activeIntervals.forEach(id => {
    originalClearInterval(id);
  });
  activeIntervals.clear();

  // Clear all mocks
  jest.clearAllMocks();
  
  // Clear storage mocks
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
});