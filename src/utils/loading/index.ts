/**
 * Loading utilities barrel export
 * Provides a centralized export for all loading-related functionality
 */

// Provider and hooks
export {
  LoadingProvider,
  useLoading,
  useSpecificLoading,
  useAsyncLoading,
  useDebouncedLoading,
  type LoadingState,
} from "./LoadingProvider";

// Utilities and constants
export {
  LOADING_KEYS,
  LOADING_DURATIONS,
  ANIMATION_CONFIGS,
  simulateLoading,
  createStaggeredDelay,
  getRandomSkeletonWidth,
  createSkeletonAnimationProps,
  LoadingManager,
  globalLoadingManager,
  withLoading,
  createSkeletonConfig,
  createSkeletonObserver,
  LoadingPerformanceMonitor,
  loadingPerformanceMonitor,
  type LoadingKey,
  type SkeletonConfig,
} from "./loadingUtils";

// Skeleton components
export { default as BlogCardSkeleton } from "@components/skeletons/BlogCardSkeleton";
export { default as SearchSkeleton } from "@components/skeletons/SearchSkeleton";
export { default as PostDetailSkeleton } from "@components/skeletons/PostDetailSkeleton";
export { default as NavigationSkeleton } from "@components/skeletons/NavigationSkeleton";
export { default as HeroSkeleton } from "@components/skeletons/HeroSkeleton";

// Re-export base skeleton component
export { Skeleton } from "@components/ui/skeleton";
