// Route preloading utilities for better performance
import { ROUTES } from '../constants';

/**
 * Preload critical routes based on user behavior patterns
 */
export const preloadCriticalRoutes = () => {
  // Preload most commonly accessed routes after initial load
  setTimeout(() => {
    // Preload dashboard for authenticated users
    if (localStorage.getItem('token')) {
      import(/* webpackChunkName: "dashboard" */ '../pages/DashboardPage');
      import(/* webpackChunkName: "write" */ '../pages/WritePage');
    } else {
      // Preload login for unauthenticated users
      import(/* webpackChunkName: "auth" */ '../pages/LoginPage');
    }

    // Preload analytics for premium users
    import(/* webpackChunkName: "analytics" */ '../pages/AnalyticsPage').catch(() => {});
  }, 2000); // Delay to not interfere with initial load
};

/**
 * Preload route on hover (for navigation links)
 */
export const preloadRouteOnHover = routePath => {
  const routeImportMap = {
    [ROUTES.HOME]: () =>
      import(/* webpackChunkName: "home" */ '../pages/HomePage'),
    [ROUTES.LOGIN]: () =>
      import(/* webpackChunkName: "auth" */ '../pages/LoginPage'),
    [ROUTES.WRITE]: () =>
      import(/* webpackChunkName: "write" */ '../pages/WritePage'),
    [ROUTES.DASHBOARD]: () =>
      import(/* webpackChunkName: "dashboard" */ '../pages/DashboardPage'),
    [ROUTES.PRICING]: () =>
      import(/* webpackChunkName: "pricing" */ '../pages/PricingPage'),
  };

  const importFn = routeImportMap[routePath];
  if (importFn) {
    importFn().catch(error => {
      console.warn(`Failed to preload route ${routePath}:`, error);
    });
  }
};

/**
 * Intelligent route preloading based on current route
 */
export const preloadRelatedRoutes = currentRoute => {
  const relatedRoutes = {
    [ROUTES.HOME]: [ROUTES.LOGIN, ROUTES.PRICING],
    [ROUTES.LOGIN]: [ROUTES.DASHBOARD, ROUTES.WRITE],
    [ROUTES.DASHBOARD]: [ROUTES.WRITE, ROUTES.PRICING],
    [ROUTES.WRITE]: [ROUTES.DASHBOARD],
    [ROUTES.PRICING]: [ROUTES.LOGIN, ROUTES.DASHBOARD],
  };

  const routes = relatedRoutes[currentRoute] || [];
  routes.forEach(route => {
    setTimeout(() => preloadRouteOnHover(route), 1000);
  });
};

/**
 * Preload components that are likely to be used
 */
export const preloadLikelyComponents = () => {
  // Preload heavy components after initial render
  setTimeout(() => {
    // Preload chart components for dashboard
    import('react-chartjs-2')
      .then(module => {
        // Charts are now available in cache
      })
      .catch(error => {
        console.warn('Failed to preload chart components:', error);
      });

    // Preload modal components
    import('../components/EssayDetailsModal').catch(error => {
      console.warn('Failed to preload modal components:', error);
    });
  }, 3000);
};
