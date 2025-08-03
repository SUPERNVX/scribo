// Export all custom hooks from a single file
export { default as useEssays } from './useEssays';
export { default as useStats } from './useStats';
export { default as useThemes } from './useThemes';
export { default as useModels } from './useModels';
export { default as useQuotes } from './useQuotes';
export { default as useOnboarding } from './useOnboarding';

// Performance and optimization hooks
export { default as useLocalStorage } from './useLocalStorage';
export { default as useDebounce } from './useDebounce';
export { default as usePerformance } from './usePerformance';
export { default as useOptimizedState } from './useOptimizedState';

// Accessibility and interaction hooks
export {
  useKeyboardNavigation,
  useFocusManagement,
  useSkipNavigation,
} from './useKeyboardNavigation';
export {
  default as useResponsive,
  useBreakpoint,
  useDeviceDetection,
  useMediaQuery,
  useOrientation,
  useResponsiveValue,
  useViewport,
} from './useResponsive';
export { 
  default as useTouchGestures,
  useHapticFeedback,
  useSwipeNavigation,
  usePullToRefresh,
} from './useTouchGestures';

// Mobile optimization hooks
export {
  useVirtualKeyboard,
  useOrientationOptimization,
  useSafeArea,
  useMobilePerformance,
  useMobileGestures,
} from './useMobileOptimizations';

// Error handling hooks
export {
  default as useErrorHandling,
  useErrorBoundary,
  useErrorRecovery,
  useNetworkStatus,
  useOfflineQueue,
  useRetryableRequest,
} from './useErrorHandling';

// Fluid interactions hooks (Fase 6 - Topico 5)
export {
  useKeyboardShortcuts,
  useGlobalShortcuts,
  useEditorShortcuts,
} from './useKeyboardShortcuts';
export { useAutoSave, useFormAutoSave, useEssayAutoSave } from './useAutoSave';
export { useUndoRedo, useTextUndoRedo, useActionHistory } from './useUndoRedo';
export { useDragAndDrop, useFileDrop, useSortable } from './useDragAndDrop';

// Performance hooks (Fase 6 - Topico 7)
export {
  default as useOptimisticUpdates,
  useOptimisticEssays,
} from './useOptimisticUpdates';
export {
  default as usePrefetching,
  useEssayPrefetching,
} from './usePrefetching';
export {
  default as useBackgroundSync,
  useOfflineSync,
} from './useBackgroundSync';
export {
  default as useSmoothTransitions,
  usePageTransitions,
  useListTransitions,
  useLoadingTransitions,
} from './useSmoothTransitions';

// Notification hooks (Fase 6 - Topico 8)
export {
  default as useNotifications,
  useContextualNotifications,
  useAsyncNotifications,
  useCelebrationNotifications,
} from './useNotifications';
export { default as useScriboNotifications } from './useEnemiaNotifications';

// Dictionary hooks
export { default as useDictionary, useTextSelection } from './useDictionary';

// Focus mode hooks
export { default as useFocusMode } from './useFocusMode';

// Global keyboard shortcuts
export { default as useGlobalKeyboardShortcuts } from './useGlobalKeyboardShortcuts';

// Paragraph analysis hooks
export { default as useParagraphAnalysis } from './useParagraphAnalysis';

// Deep analysis hooks
export { default as useDeepAnalysis } from './useDeepAnalysis';
export { default as useEnhancedDeepAnalysis } from './useEnhancedDeepAnalysis';

// Username validation hooks
export { default as useUsernameValidation } from './useUsernameValidation';

// Re-export existing hooks
export { useAuth } from '../contexts/AuthContext';
