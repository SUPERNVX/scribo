// Bundle optimization utilities
import { preloadCriticalComponents } from './lazyImports';

/**
 * Initialize app with performance optimizations
 */
export const initializeApp = async () => {
  // Preload critical components
  try {
    await preloadCriticalComponents();
  } catch (error) {
    console.warn('Failed to preload critical components:', error);
  }

  // Preload critical fonts
  preloadFont('Simonetta', 'display');
  preloadFont('Inter', 'sans-serif');

  // Initialize service worker for caching
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration);

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            // New content is available, notify user
            console.log('New content available, please refresh');

            // Optionally show user notification
            if (
              'Notification' in window &&
              Notification.permission === 'granted'
            ) {
              new Notification('Scribo atualizado!', {
                body: 'Nova versão disponível. Recarregue a página para atualizar.',
                icon: '/icon-192x192.png',
              });
            }
          }
        });
      });
    } catch (error) {
      console.warn('Service worker registration failed:', error);
    }
  }
};

/**
 * Preload fonts for better performance
 */
const preloadFont = (fontFamily, fallback) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'font';
  link.type = 'font/woff2';
  link.crossOrigin = 'anonymous';

  // This is a simplified example - in production you'd have actual font URLs
  link.href = `/fonts/${fontFamily.toLowerCase()}.woff2`;

  document.head.appendChild(link);
};

/**
 * Optimize images with lazy loading
 */
export const optimizeImage = (src, options = {}) => {
  const { width, height, quality = 80, format = 'webp', lazy = true } = options;

  // In a real app, you might use a service like Cloudinary or similar
  let optimizedSrc = src;

  if (width || height) {
    optimizedSrc += `?w=${width}&h=${height}&q=${quality}&f=${format}`;
  }

  return {
    src: optimizedSrc,
    loading: lazy ? 'lazy' : 'eager',
    decoding: 'async',
  };
};

/**
 * Resource hints for better loading
 */
export const addResourceHints = () => {
  // DNS prefetch for external domains
  addDNSPrefetch('https://fonts.googleapis.com');
  addDNSPrefetch('https://api.quotable.io');

  // Preconnect to critical domains
  addPreconnect('https://fonts.gstatic.com');
};

const addDNSPrefetch = href => {
  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = href;
  document.head.appendChild(link);
};

const addPreconnect = href => {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = href;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
};

/**
 * Monitor bundle size and performance
 */
export const monitorPerformance = () => {
  if (process.env.NODE_ENV === 'development') {
    // Monitor bundle size
    console.log('📦 Bundle analysis available at build time');

    // Monitor render performance
    if (window.performance && window.performance.measure) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0];
          // Performance metrics logged (removed console.log)
          const metrics = {
            'DOM Content Loaded': `${navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart}ms`,
            'Load Complete': `${navigation.loadEventEnd - navigation.loadEventStart}ms`,
            'Total Load Time': `${navigation.loadEventEnd - navigation.fetchStart}ms`,
          };
          // Metrics available but not logged to console
        }, 0);
      });
    }
  }
};

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  monitorPerformance();
  addResourceHints();
}
