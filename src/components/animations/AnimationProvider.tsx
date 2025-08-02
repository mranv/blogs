/**
 * Animation Provider Component
 * Global context provider for managing animation states and preferences
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  globalReducedMotionManager,
  type ReducedMotionConfig,
} from "@utils/animations/reducedMotion";
import { globalIntersectionManager } from "@utils/animations/intersectionObserver";
import {
  globalParallaxManager,
  globalScrollTracker,
} from "@utils/animations/scrollAnimations";

// Animation context configuration
export interface AnimationConfig extends ReducedMotionConfig {
  enableParallax?: boolean;
  enableIntersectionAnimations?: boolean;
  enableScrollAnimations?: boolean;
  globalStaggerDelay?: number;
  performanceMode?: "high" | "balanced" | "low";
  debugMode?: boolean;
}

// Animation context state
export interface AnimationContextState {
  config: Required<AnimationConfig>;
  prefersReducedMotion: boolean;
  isScrolling: boolean;
  scrollProgress: number;
  viewportSize: { width: number; height: number };
  activeAnimations: number;
  performanceMetrics: {
    fps: number;
    droppedFrames: number;
  };
}

// Animation context methods
export interface AnimationContextMethods {
  updateConfig: (newConfig: Partial<AnimationConfig>) => void;
  registerAnimation: (id: string) => () => void;
  shouldAnimateElement: (element: Element) => boolean;
  getOptimalDuration: (baseDuration: number) => number;
  reportPerformanceIssue: (issue: string) => void;
}

// Combined context type
export type AnimationContextType = AnimationContextState &
  AnimationContextMethods;

// Default configuration
const defaultConfig: Required<AnimationConfig> = {
  respectSystemPreference: true,
  fallbackDuration: 100,
  disableParallax: true,
  disableAutoplay: true,
  simplifyAnimations: true,
  enableParallax: true,
  enableIntersectionAnimations: true,
  enableScrollAnimations: true,
  globalStaggerDelay: 100,
  performanceMode: "balanced",
  debugMode: false,
};

// Create context
const AnimationContext = createContext<AnimationContextType | null>(null);

// Performance monitor class
class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 60;
  private droppedFrames = 0;
  private callbacks: Set<
    (metrics: { fps: number; droppedFrames: number }) => void
  > = new Set();

  start(): void {
    this.monitor();
  }

  private monitor(): void {
    const now = performance.now();
    const delta = now - this.lastTime;

    if (delta >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / delta);

      // Detect dropped frames
      const expectedFrames = Math.floor(delta / 16.67); // 60fps = 16.67ms per frame
      this.droppedFrames = Math.max(0, expectedFrames - this.frameCount);

      // Notify callbacks
      this.callbacks.forEach(callback => {
        callback({ fps: this.fps, droppedFrames: this.droppedFrames });
      });

      this.frameCount = 0;
      this.lastTime = now;
    }

    this.frameCount++;
    requestAnimationFrame(() => this.monitor());
  }

  addCallback(
    callback: (metrics: { fps: number; droppedFrames: number }) => void
  ): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  getCurrentMetrics(): { fps: number; droppedFrames: number } {
    return { fps: this.fps, droppedFrames: this.droppedFrames };
  }
}

// Global performance monitor
const performanceMonitor = new PerformanceMonitor();

// Animation Provider Props
export interface AnimationProviderProps {
  children: React.ReactNode;
  config?: Partial<AnimationConfig>;
}

/**
 * Animation Provider Component
 */
export const AnimationProvider: React.FC<AnimationProviderProps> = ({
  children,
  config: userConfig = {},
}) => {
  // Merge user config with defaults
  const [config, setConfig] = useState<Required<AnimationConfig>>({
    ...defaultConfig,
    ...userConfig,
  });

  // Animation state
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [activeAnimations, setActiveAnimations] = useState(0);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 60,
    droppedFrames: 0,
  });

  // Active animation tracking
  const [animationRegistry] = useState(new Set<string>());

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<AnimationConfig>) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      ...newConfig,
    }));
  }, []);

  // Register animation
  const registerAnimation = useCallback(
    (id: string) => {
      animationRegistry.add(id);
      setActiveAnimations(animationRegistry.size);

      // Return cleanup function
      return () => {
        animationRegistry.delete(id);
        setActiveAnimations(animationRegistry.size);
      };
    },
    [animationRegistry]
  );

  // Check if element should animate
  const shouldAnimateElement = useCallback(
    (element: Element): boolean => {
      // Check reduced motion preference
      if (prefersReducedMotion && config.simplifyAnimations) {
        return false;
      }

      // Check if element is in a performance-critical area
      if (config.performanceMode === "low") {
        return false;
      }

      // Check if too many animations are active
      if (config.performanceMode === "balanced" && activeAnimations > 10) {
        return false;
      }

      // Check FPS performance
      if (performanceMetrics.fps < 30 && config.performanceMode !== "high") {
        return false;
      }

      return true;
    },
    [prefersReducedMotion, config, activeAnimations, performanceMetrics.fps]
  );

  // Get optimal duration based on performance
  const getOptimalDuration = useCallback(
    (baseDuration: number): number => {
      if (prefersReducedMotion) {
        return config.fallbackDuration;
      }

      // Adjust duration based on performance
      if (performanceMetrics.fps < 30) {
        return baseDuration * 0.5; // Faster animations for poor performance
      }

      if (config.performanceMode === "low") {
        return baseDuration * 0.7;
      }

      return baseDuration;
    },
    [prefersReducedMotion, config, performanceMetrics.fps]
  );

  // Report performance issues
  const reportPerformanceIssue = useCallback(
    (issue: string) => {
      if (config.debugMode) {
        console.warn("Animation Performance Issue:", issue, {
          fps: performanceMetrics.fps,
          droppedFrames: performanceMetrics.droppedFrames,
          activeAnimations,
        });
      }
    },
    [config.debugMode, performanceMetrics, activeAnimations]
  );

  // Initialize reduced motion listener
  useEffect(() => {
    const cleanup = globalReducedMotionManager.addCallback(isReduced => {
      setPrefersReducedMotion(isReduced);

      if (isReduced && config.debugMode) {
        console.log("Reduced motion preference detected, adapting animations");
      }
    });

    return cleanup;
  }, [config.debugMode]);

  // Initialize scroll tracking
  useEffect(() => {
    if (!config.enableScrollAnimations) return;

    let scrollTimeout: NodeJS.Timeout;

    const scrollCallback = (progress: number, scrollY: number) => {
      setScrollProgress(progress);
      setIsScrolling(true);

      // Clear existing timeout
      clearTimeout(scrollTimeout);

      // Set scrolling to false after scroll ends
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 100);
    };

    globalScrollTracker.addCallback(scrollCallback);

    return () => {
      globalScrollTracker.removeCallback(scrollCallback);
      clearTimeout(scrollTimeout);
    };
  }, [config.enableScrollAnimations]);

  // Initialize viewport size tracking
  useEffect(() => {
    const updateViewportSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateViewportSize();

    const handleResize = () => {
      updateViewportSize();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize performance monitoring
  useEffect(() => {
    if (config.performanceMode === "high") return;

    performanceMonitor.start();

    const cleanup = performanceMonitor.addCallback(metrics => {
      setPerformanceMetrics(metrics);

      // Auto-adjust performance mode based on metrics
      if (metrics.fps < 30 && config.performanceMode === "balanced") {
        reportPerformanceIssue(
          "Low FPS detected, consider reducing animation complexity"
        );
      }

      if (metrics.droppedFrames > 5) {
        reportPerformanceIssue(
          "Frame drops detected, animations may be too complex"
        );
      }
    });

    return cleanup;
  }, [config.performanceMode, reportPerformanceIssue]);

  // Disable features based on reduced motion preference
  useEffect(() => {
    if (prefersReducedMotion) {
      if (config.disableParallax && config.enableParallax) {
        globalParallaxManager.clear();
      }

      if (config.simplifyAnimations) {
        // Reduce global stagger delay
        updateConfig({ globalStaggerDelay: 50 });
      }
    }
  }, [prefersReducedMotion, config]);

  // Debug logging
  useEffect(() => {
    if (config.debugMode) {
      console.log("Animation Provider State:", {
        prefersReducedMotion,
        isScrolling,
        scrollProgress: Math.round(scrollProgress * 100),
        viewportSize,
        activeAnimations,
        performanceMetrics,
      });
    }
  }, [
    config.debugMode,
    prefersReducedMotion,
    isScrolling,
    scrollProgress,
    viewportSize,
    activeAnimations,
    performanceMetrics,
  ]);

  // Context value
  const contextValue: AnimationContextType = {
    config,
    prefersReducedMotion,
    isScrolling,
    scrollProgress,
    viewportSize,
    activeAnimations,
    performanceMetrics,
    updateConfig,
    registerAnimation,
    shouldAnimateElement,
    getOptimalDuration,
    reportPerformanceIssue,
  };

  return (
    <AnimationContext.Provider value={contextValue}>
      {children}
    </AnimationContext.Provider>
  );
};

/**
 * Hook to use animation context
 */
function useAnimation(): AnimationContextType {
  const context = useContext(AnimationContext);

  if (!context) {
    // Return a safe default context for SSR or when provider is not available
    return {
      config: defaultConfig,
      prefersReducedMotion: false,
      isScrolling: false,
      scrollProgress: 0,
      viewportSize: { width: 0, height: 0 },
      activeAnimations: 0,
      performanceMetrics: { fps: 60, droppedFrames: 0 },
      updateConfig: () => {},
      registerAnimation: () => () => {},
      shouldAnimateElement: () => false,
      getOptimalDuration: (duration: number) => duration,
      reportPerformanceIssue: () => {},
    };
  }

  return context;
}

export { useAnimation };

/**
 * Hook for simplified animation state
 */
function useAnimationState() {
  const {
    prefersReducedMotion,
    isScrolling,
    scrollProgress,
    shouldAnimateElement,
    getOptimalDuration,
  } = useAnimation();

  return {
    prefersReducedMotion,
    isScrolling,
    scrollProgress,
    shouldAnimateElement,
    getOptimalDuration,
  };
}

export { useAnimationState };

/**
 * Hook for animation performance metrics
 */
function useAnimationPerformance() {
  const { performanceMetrics, activeAnimations, reportPerformanceIssue } =
    useAnimation();

  return {
    ...performanceMetrics,
    activeAnimations,
    reportPerformanceIssue,
  };
}

export { useAnimationPerformance };

/**
 * Higher-order component for animation context
 */
export const withAnimation = <P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P & { animationConfig?: Partial<AnimationConfig> }> => {
  return ({ animationConfig, ...props }) => (
    <AnimationProvider config={animationConfig}>
      <Component {...(props as P)} />
    </AnimationProvider>
  );
};

export default AnimationProvider;
