// Performance utilities and optimizations
import { apiCache } from './cache';

/**
 * Debounce function for performance optimization
 */
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

/**
 * Throttle function for performance optimization
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Memoize function results
 */
export const memoize = (fn, getKey = (...args) => JSON.stringify(args)) => {
  const cache = new Map();

  return (...args) => {
    const key = getKey(...args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);

    // Limit cache size
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return result;
  };
};

/**
 * Lazy load images with intersection observer
 */
export const lazyLoadImage = (img, src) => {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.src = src;
        entry.target.classList.remove('lazy');
        observer.unobserve(entry.target);
      }
    });
  });

  observer.observe(img);
};

/**
 * Preload critical resources
 */
export const preloadResource = (href, as = 'script') => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
};

/**
 * Measure performance of functions
 */
export const measurePerformance = (name, fn) => {
  return (...args) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();

    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ ${name}: ${(end - start).toFixed(2)}ms`);
    }

    return result;
  };
};

/**
 * Batch API calls to reduce requests
 */
export class APIBatcher {
  constructor(batchFn, delay = 50) {
    this.batchFn = batchFn;
    this.delay = delay;
    this.queue = [];
    this.timeout = null;
  }

  add(request) {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });

      if (this.timeout) {
        clearTimeout(this.timeout);
      }

      this.timeout = setTimeout(() => {
        this.flush();
      }, this.delay);
    });
  }

  flush() {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0);
    const requests = batch.map(item => item.request);

    this.batchFn(requests)
      .then(results => {
        batch.forEach((item, index) => {
          item.resolve(results[index]);
        });
      })
      .catch(error => {
        batch.forEach(item => {
          item.reject(error);
        });
      });
  }
}

/**
 * Virtual scrolling for large lists
 */
export const calculateVirtualItems = (
  scrollTop,
  itemHeight,
  containerHeight,
  totalItems,
  overscan = 5
) => {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalItems - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  return {
    startIndex,
    endIndex,
    visibleItems: endIndex - startIndex + 1,
    offsetY: startIndex * itemHeight,
  };
};

/**
 * Optimize bundle size by checking if feature is used
 */
export const conditionalImport = async (condition, importFn) => {
  if (condition) {
    return await importFn();
  }
  return null;
};
