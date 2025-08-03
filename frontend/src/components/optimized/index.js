// Optimized Components Index
// Export all optimized components for easy importing

// Main optimized components
export { default as OptimizedGamificationPanel } from './OptimizedGamificationPanel';

// Component replacement mapping for easy migration
export const ComponentReplacements = {
  // Original -> Optimized
  'GamificationPanel': 'OptimizedGamificationPanel',
};

// Performance optimization utilities
export const OptimizationUtils = {
  // Check if component should be memoized
  shouldMemoize: (componentName) => {
    const memoizedComponents = [
      'OptimizedGamificationPanel',
    ];
    return memoizedComponents.includes(componentName);
  },

  // Get optimization recommendations
  getOptimizationRecommendations: () => ({
    memoization: 'Use React.memo for components that receive stable props',
    callbacks: 'Use useCallback for event handlers and useStableCallback for complex functions',
    state: 'Use optimized state hooks for better performance',
    selectors: 'Use useMemoizedSelector for derived state calculations',
    rendering: 'Break large components into smaller, focused components',
  }),
};

export default {
  OptimizedGamificationPanel,
  ComponentReplacements,
  OptimizationUtils,
};