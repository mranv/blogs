/**
 * Utility functions for managing loading states throughout the application
 */

// Loading state keys for type safety
export const LOADING_KEYS = {
  NAVIGATION: "navigation",
  SEARCH: "search",
  POSTS: "posts",
  HERO: "hero",
  POST_DETAIL: "postDetail",
  GLOBAL: "global",
} as const;

export type LoadingKey = (typeof LOADING_KEYS)[keyof typeof LOADING_KEYS];

// Default loading durations (in milliseconds)
export const LOADING_DURATIONS = {
  FAST: 200,
  NORMAL: 500,
  SLOW: 1000,
  VERY_SLOW: 2000,
} as const;

// Loading animation configurations
export const ANIMATION_CONFIGS = {
  shimmer: {
    duration: "1.5s",
    timing: "infinite",
    direction: "linear",
  },
  pulse: {
    duration: "2s",
    timing: "infinite",
    direction: "ease-in-out",
  },
  fade: {
    duration: "0.8s",
    timing: "ease-out",
    direction: "forwards",
  },
  slideIn: {
    duration: "0.3s",
    timing: "ease-out",
    direction: "forwards",
  },
} as const;

/**
 * Simulates a loading delay for development and testing
 */
export const simulateLoading = (
  duration: number = LOADING_DURATIONS.NORMAL
): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, duration));
};

/**
 * Creates a staggered delay for multiple items
 */
export const createStaggeredDelay = (
  index: number,
  baseDelay: number = 100
): number => {
  return index * baseDelay;
};

/**
 * Generates random width for skeleton elements
 */
export const getRandomSkeletonWidth = (
  min: number = 40,
  max: number = 100
): string => {
  return `${Math.random() * (max - min) + min}%`;
};

/**
 * Creates CSS custom properties for skeleton animations
 */
export const createSkeletonAnimationProps = (delay: number = 0) => ({
  style: {
    animationDelay: `${delay}s`,
    "--shimmer-duration": ANIMATION_CONFIGS.shimmer.duration,
  } as React.CSSProperties,
});

/**
 * Manages loading state transitions with proper cleanup
 */
export class LoadingManager {
  private loadingStates = new Map<string, boolean>();
  private timeouts = new Map<string, NodeJS.Timeout>();
  private callbacks = new Map<string, Set<(loading: boolean) => void>>();

  constructor() {
    // Cleanup on page unload
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => this.cleanup());
    }
  }

  /**
   * Set loading state for a specific key
   */
  setLoading(key: string, loading: boolean, delay: number = 0): void {
    if (delay > 0) {
      const timeoutId = setTimeout(() => {
        this.updateLoadingState(key, loading);
      }, delay);

      this.timeouts.set(key, timeoutId);
    } else {
      this.updateLoadingState(key, loading);
    }
  }

  /**
   * Get loading state for a specific key
   */
  getLoading(key: string): boolean {
    return this.loadingStates.get(key) || false;
  }

  /**
   * Subscribe to loading state changes
   */
  subscribe(key: string, callback: (loading: boolean) => void): () => void {
    if (!this.callbacks.has(key)) {
      this.callbacks.set(key, new Set());
    }

    this.callbacks.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.callbacks.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.callbacks.delete(key);
        }
      }
    };
  }

  /**
   * Clear all loading states
   */
  clearAll(): void {
    this.loadingStates.clear();
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();

    // Notify all callbacks
    this.callbacks.forEach((callbacks, _key) => {
      callbacks.forEach(callback => callback(false));
    });
  }

  /**
   * Get all active loading states
   */
  getActiveStates(): string[] {
    return Array.from(this.loadingStates.entries())
      .filter(([, loading]) => loading)
      .map(([key]) => key);
  }

  /**
   * Check if any loading state is active
   */
  isAnyLoading(): boolean {
    return Array.from(this.loadingStates.values()).some(Boolean);
  }

  private updateLoadingState(key: string, loading: boolean): void {
    this.loadingStates.set(key, loading);

    // Clear timeout if exists
    const timeoutId = this.timeouts.get(key);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(key);
    }

    // Notify callbacks
    const callbacks = this.callbacks.get(key);
    if (callbacks) {
      callbacks.forEach(callback => callback(loading));
    }
  }

  private cleanup(): void {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
    this.loadingStates.clear();
    this.callbacks.clear();
  }
}

// Global loading manager instance
export const globalLoadingManager = new LoadingManager();

/**
 * Utility function to show loading for async operations
 */
export const withLoading = async <T>(
  loadingKey: string,
  asyncOperation: () => Promise<T>,
  minDuration: number = LOADING_DURATIONS.FAST
): Promise<T> => {
  const startTime = Date.now();
  globalLoadingManager.setLoading(loadingKey, true);

  try {
    const result = await asyncOperation();

    // Ensure minimum loading duration for better UX
    const elapsed = Date.now() - startTime;
    if (elapsed < minDuration) {
      await simulateLoading(minDuration - elapsed);
    }

    return result;
  } finally {
    globalLoadingManager.setLoading(loadingKey, false);
  }
};

/**
 * Creates skeleton configuration for consistent styling
 */
export interface SkeletonConfig {
  count: number;
  heights: string[];
  widths: string[];
  delays: number[];
  className?: string;
}

export const createSkeletonConfig = (
  count: number,
  options: {
    minHeight?: string;
    maxHeight?: string;
    minWidth?: string;
    maxWidth?: string;
    baseDelay?: number;
    className?: string;
  } = {}
): SkeletonConfig => {
  const {
    minHeight = "h-4",
    maxHeight = "h-6",
    minWidth = "40%",
    maxWidth = "100%",
    baseDelay = 0.1,
    className = "",
  } = options;

  const heights = Array.from({ length: count }, (_, i) =>
    i % 2 === 0 ? minHeight : maxHeight
  );

  const widths = Array.from({ length: count }, () =>
    getRandomSkeletonWidth(
      parseInt(minWidth.replace("%", "")),
      parseInt(maxWidth.replace("%", ""))
    )
  );

  const delays = Array.from({ length: count }, (_, i) => i * baseDelay);

  return {
    count,
    heights,
    widths,
    delays,
    className,
  };
};

/**
 * Intersection Observer utility for lazy loading skeletons
 */
export const createSkeletonObserver = (
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver => {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: "50px",
    threshold: 0.1,
    ...options,
  };

  return new IntersectionObserver(entries => {
    entries.forEach(callback);
  }, defaultOptions);
};

/**
 * Performance monitoring for loading states
 */
export class LoadingPerformanceMonitor {
  private measurements = new Map<string, { start: number; end?: number }>();

  startMeasurement(key: string): void {
    this.measurements.set(key, { start: performance.now() });
  }

  endMeasurement(key: string): number | null {
    const measurement = this.measurements.get(key);
    if (!measurement) return null;

    const end = performance.now();
    measurement.end = end;

    const duration = end - measurement.start;

    // Log performance in development
    if (process.env.NODE_ENV === "development") {
      console.log(`Loading performance - ${key}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  getMeasurement(
    key: string
  ): { duration: number; start: number; end: number } | null {
    const measurement = this.measurements.get(key);
    if (!measurement || !measurement.end) return null;

    return {
      start: measurement.start,
      end: measurement.end,
      duration: measurement.end - measurement.start,
    };
  }

  getAllMeasurements(): Record<
    string,
    { duration: number; start: number; end: number }
  > {
    const result: Record<
      string,
      { duration: number; start: number; end: number }
    > = {};

    this.measurements.forEach((measurement, key) => {
      if (measurement.end) {
        result[key] = {
          start: measurement.start,
          end: measurement.end,
          duration: measurement.end - measurement.start,
        };
      }
    });

    return result;
  }

  clear(): void {
    this.measurements.clear();
  }
}

// Global performance monitor instance
export const loadingPerformanceMonitor = new LoadingPerformanceMonitor();
