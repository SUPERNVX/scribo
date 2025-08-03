// Resource preloading utilities for critical performance optimization

/**
 * Preload critical resources based on priority
 */
export const preloadCriticalResources = () => {
  // High priority - immediately needed resources
  preloadHighPriorityResources();

  // Medium priority - likely to be needed soon
  setTimeout(() => preloadMediumPriorityResources(), 1000);

  // Low priority - nice to have cached
  setTimeout(() => preloadLowPriorityResources(), 3000);
};

/**
 * High priority resources - needed immediately
 */
const preloadHighPriorityResources = () => {
  // Critical CSS and JS chunks
  preloadResource('/static/css/main.css', 'style');

  // Critical fonts
  preloadFont('Simonetta', 'woff2');
  preloadFont('Inter', 'woff2');

  // Essential API endpoints for authenticated users
  if (localStorage.getItem('token')) {
    prefetchAPIEndpoint('/api/themes');
    prefetchAPIEndpoint('/api/models');
  }
};

/**
 * Medium priority resources - likely to be needed
 */
const preloadMediumPriorityResources = () => {
  // Chart.js for dashboard
  preloadResource('/static/js/charts.chunk.js', 'script');

  // Dashboard components
  import(
    /* webpackChunkName: "dashboard-heavy" */ '../components/EssaysDashboard'
  ).catch(() => {});

  // Common UI components
  import(
    /* webpackChunkName: "modals" */ '../components/EssayDetailsModal'
  ).catch(() => {});

  // User stats if authenticated
  if (localStorage.getItem('token')) {
    prefetchAPIEndpoint('/api/stats/my');
  }
};

/**
 * Low priority resources - nice to have
 */
const preloadLowPriorityResources = () => {
  // Less critical chunks
  preloadResource('/static/js/gamification.chunk.js', 'script');

  // Future components (commented out until implemented)
  // import(/* webpackChunkName: "analytics" */ '../components/analytics/AnalyticsDashboard').catch(() => {});
  import(/* webpackChunkName: "focus-mode" */ '../components/focus-mode/FocusMode').catch(() => {});

  // External resources - disabled to prevent console errors
  // prefetchAPIEndpoint('https://api.quotable.io/random');
};

/**
 * Preload a resource with specified type
 */
const preloadResource = (href, as, crossorigin = false) => {
  // Check if already preloaded
  const existing = document.querySelector(`link[href="${href}"]`);
  if (existing) return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;

  if (crossorigin) {
    link.crossOrigin = 'anonymous';
  }

  // Add error handling
  link.onerror = () => {
    console.warn(`Failed to preload resource: ${href}`);
  };

  document.head.appendChild(link);
};

/**
 * Preload fonts with proper format detection
 */
const preloadFont = (fontFamily, format = 'woff2') => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'font';
  link.type = `font/${format}`;
  link.crossOrigin = 'anonymous';
  link.href = `/fonts/${fontFamily.toLowerCase()}.${format}`;

  link.onerror = () => {
    console.warn(`Failed to preload font: ${fontFamily}`);
  };

  document.head.appendChild(link);
};

/**
 * Prefetch API endpoints to warm up cache
 */
const prefetchAPIEndpoint = async endpoint => {
  try {
    const fullUrl = endpoint.startsWith('http')
      ? endpoint
      : `http://localhost:8000${endpoint}`;

    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // Use fetch with cache to warm up browser cache
    await fetch(fullUrl, {
      method: 'GET',
      headers,
      cache: 'force-cache',
      mode: 'cors',
    });
  } catch (error) {
    // Silently fail for prefetch operations - this is expected for external APIs
    // console.debug(`Prefetch failed for ${endpoint}:`, error);
  }
};

/**
 * Preload images that are likely to be shown
 */
export const preloadImages = imageUrls => {
  imageUrls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
};

/**
 * Intelligent preloading based on user behavior
 */
export const intelligentPreload = () => {
  // Preload based on current route
  const currentPath = window.location.pathname;

  switch (currentPath) {
    case '/':
      // On home page, preload login and pricing
      import(/* webpackChunkName: "auth" */ '../pages/LoginPage').catch(
        () => {}
      );
      import(/* webpackChunkName: "pricing" */ '../pages/PricingPage').catch(
        () => {}
      );
      break;

    case '/login':
      // On login page, preload dashboard and write page
      import(
        /* webpackChunkName: "dashboard" */ '../pages/DashboardPage'
      ).catch(() => {});
      import(/* webpackChunkName: "write" */ '../pages/WritePage').catch(
        () => {}
      );
      break;

    case '/dashboard':
      // On dashboard, preload write page and charts
      import(/* webpackChunkName: "write" */ '../pages/WritePage').catch(
        () => {}
      );
      import(/* webpackChunkName: "charts" */ 'react-chartjs-2').catch(
        () => {}
      );
      break;

    case '/write':
      // On write page, preload dashboard
      import(
        /* webpackChunkName: "dashboard" */ '../pages/DashboardPage'
      ).catch(() => {});
      break;
  }
};

/**
 * Preload resources on user interaction hints
 */
export const preloadOnHover = (element, resourceLoader) => {
  let hasPreloaded = false;

  const preload = () => {
    if (!hasPreloaded) {
      hasPreloaded = true;
      resourceLoader();
    }
  };

  element.addEventListener('mouseenter', preload, { once: true });
  element.addEventListener('touchstart', preload, { once: true });
  element.addEventListener('focus', preload, { once: true });
};

/**
 * Monitor network conditions and adjust preloading
 */
export const adaptivePreloading = () => {
  // Check if Network Information API is available
  if ('connection' in navigator) {
    const connection = navigator.connection;

    // Reduce preloading on slow connections
    if (
      connection.effectiveType === 'slow-2g' ||
      connection.effectiveType === '2g'
    ) {
      console.log('Slow connection detected, reducing preloading');
      return false;
    }

    // Reduce preloading when data saver is on
    if (connection.saveData) {
      console.log('Data saver mode detected, reducing preloading');
      return false;
    }
  }

  return true;
};

/**
 * Initialize all preloading strategies
 */
export const initializePreloading = () => {
  // Check if we should preload based on network conditions
  if (!adaptivePreloading()) {
    console.log('Preloading disabled due to network conditions');
    return;
  }

  // Start preloading critical resources
  preloadCriticalResources();

  // Intelligent preloading based on current context
  intelligentPreload();

  // Set up intersection observer for lazy loading
  setupIntersectionObserver();
};

/**
 * Set up intersection observer for progressive loading
 */
const setupIntersectionObserver = () => {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target;

            // Trigger preloading for elements coming into view
            if (element.dataset.preload) {
              const preloadFunction = window[element.dataset.preload];
              if (typeof preloadFunction === 'function') {
                preloadFunction();
              }
            }

            observer.unobserve(element);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before element is visible
      }
    );

    // Observe elements with data-preload attribute
    document.querySelectorAll('[data-preload]').forEach(el => {
      observer.observe(el);
    });
  }
};
