// Lazy imports for code splitting and performance
import { lazy } from 'react';

// Lazy load heavy components with strategic chunking
export const LazyEssayDetailsModal = lazy(() =>
  import(
    /* webpackChunkName: "modals" */ '../components/EssayDetailsModal'
  )
);

// Heavy dashboard components
export const LazyEssaysDashboard = lazy(() =>
  import(
    /* webpackChunkName: "dashboard-heavy" */ '../components/EssaysDashboard'
  )
);

export const LazyEnhancedWritingSection = lazy(() =>
  import(
    /* webpackChunkName: "writing-heavy" */ '../components/enhanced/EnhancedWritingSection'
  )
);

// Chart components - separate chunk for analytics
export const LazyLineChart = lazy(() =>
  import(/* webpackChunkName: "charts" */ 'react-chartjs-2').then(module => ({
    default: module.Line,
  }))
);

export const LazyBarChart = lazy(() =>
  import(/* webpackChunkName: "charts" */ 'react-chartjs-2').then(module => ({
    default: module.Bar,
  }))
);

// Gamification components
export const LazyGamificationPanel = lazy(() =>
  import(
    /* webpackChunkName: "gamification" */ '../components/gamification/GamificationPanel'
  )
);

// Future heavy components (for when they're implemented)
// These are commented out until the components are actually created
// export const LazyAnalyticsDashboard = lazy(() =>
//   import(/* webpackChunkName: "analytics" */ '../components/analytics/AnalyticsDashboard')
// );

export const LazyFocusMode = lazy(() =>
  import(/* webpackChunkName: "focus-mode" */ '../components/focus-mode/FocusMode')
);

// export const LazyAIAssistant = lazy(() =>
//   import(/* webpackChunkName: "ai-assistant" */ '../components/ai-suggestions/AIAssistant')
// );

// Preload critical components
export const preloadCriticalComponents = () => {
  // Preload components that are likely to be used soon
  const preloadPromises = [
    import('../components/EssayDetailsModal'),
    import('../components/enhanced/EnhancedWritingSection'),
  ];

  return Promise.all(preloadPromises);
};

// Dynamic import with error handling
export const dynamicImport = async (importFn, fallback = null) => {
  try {
    const module = await importFn();
    return module.default || module;
  } catch (error) {
    console.error('Dynamic import failed:', error);
    return fallback;
  }
};

// Conditional imports based on feature flags
export const conditionalLazyImport = async (condition, importFn) => {
  if (!condition) return null;
  return dynamicImport(importFn);
};
