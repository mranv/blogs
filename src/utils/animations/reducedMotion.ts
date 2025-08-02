/**
 * Reduced motion accessibility utilities
 * Provides support for users who prefer reduced motion for accessibility
 */

// import { animationUtils } from "./animationUtils";

// Configuration for reduced motion
export interface ReducedMotionConfig {
  respectSystemPreference?: boolean;
  fallbackDuration?: number;
  disableParallax?: boolean;
  disableAutoplay?: boolean;
  simplifyAnimations?: boolean;
}

const defaultConfig: Required<ReducedMotionConfig> = {
  respectSystemPreference: true,
  fallbackDuration: 100,
  disableParallax: true,
  disableAutoplay: true,
  simplifyAnimations: true,
};

/**
 * Reduced motion manager class
 */
export class ReducedMotionManager {
  private config: Required<ReducedMotionConfig>;
  private mediaQueryList: MediaQueryList | null = null;
  private callbacks: Set<(isReduced: boolean) => void> = new Set();

  constructor(config: ReducedMotionConfig = {}) {
    this.config = { ...defaultConfig, ...config };
    this.setupMediaQuery();
  }

  /**
   * Setup media query listener for system preference
   */
  private setupMediaQuery(): void {
    if (typeof window === "undefined" || !this.config.respectSystemPreference) {
      return;
    }

    try {
      this.mediaQueryList = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );
      this.mediaQueryList.addEventListener(
        "change",
        this.handleMediaQueryChange.bind(this)
      );
    } catch (error) {
      console.warn("Reduced motion media query not supported:", error);
    }
  }

  /**
   * Handle media query change
   */
  private handleMediaQueryChange(event: MediaQueryListEvent): void {
    this.callbacks.forEach(callback => callback(event.matches));
    this.updateDocumentClass(event.matches);
  }

  /**
   * Update document class for CSS targeting
   */
  private updateDocumentClass(isReduced: boolean): void {
    if (typeof document !== "undefined") {
      if (isReduced) {
        document.documentElement.classList.add("reduce-motion");
        document.documentElement.classList.remove("allow-motion");
      } else {
        document.documentElement.classList.add("allow-motion");
        document.documentElement.classList.remove("reduce-motion");
      }
    }
  }

  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion(): boolean {
    if (!this.config.respectSystemPreference) {
      return false;
    }

    return this.mediaQueryList?.matches || false;
  }

  /**
   * Add callback for motion preference changes
   */
  addCallback(callback: (isReduced: boolean) => void): () => void {
    this.callbacks.add(callback);

    // Call immediately with current state
    callback(this.prefersReducedMotion());

    // Return cleanup function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Get safe animation duration based on preference
   */
  getSafeDuration(normalDuration: number): number {
    if (this.prefersReducedMotion()) {
      return this.config.fallbackDuration;
    }
    return normalDuration;
  }

  /**
   * Get safe animation config
   */
  getSafeAnimationConfig(config: any): any {
    if (!this.prefersReducedMotion()) {
      return config;
    }

    return {
      ...config,
      duration: this.config.fallbackDuration,
      easing: "ease",
      delay: Math.min(config.delay || 0, 100),
    };
  }

  /**
   * Check if animation should be disabled
   */
  shouldDisableAnimation(
    animationType: "parallax" | "autoplay" | "complex"
  ): boolean {
    if (!this.prefersReducedMotion()) {
      return false;
    }

    switch (animationType) {
      case "parallax":
        return this.config.disableParallax;
      case "autoplay":
        return this.config.disableAutoplay;
      case "complex":
        return this.config.simplifyAnimations;
      default:
        return false;
    }
  }

  /**
   * Create CSS custom properties for reduced motion
   */
  createCSSVariables(): Record<string, string> {
    const isReduced = this.prefersReducedMotion();

    return {
      "--motion-duration-fast": isReduced ? "0ms" : "150ms",
      "--motion-duration-normal": isReduced ? "100ms" : "300ms",
      "--motion-duration-slow": isReduced ? "100ms" : "500ms",
      "--motion-easing": isReduced ? "ease" : "cubic-bezier(0.4, 0, 0.2, 1)",
      "--motion-scale": isReduced ? "0" : "1",
      "--motion-translate": isReduced ? "0px" : "1",
    };
  }

  /**
   * Initialize reduced motion support
   */
  initialize(): void {
    // Set initial document class
    this.updateDocumentClass(this.prefersReducedMotion());

    // Apply CSS variables
    if (typeof document !== "undefined") {
      const variables = this.createCSSVariables();
      Object.entries(variables).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
      });
    }

    // Setup mutation observer for dynamic content
    this.setupMutationObserver();
  }

  /**
   * Setup mutation observer to handle dynamically added content
   */
  private setupMutationObserver(): void {
    if (typeof window === "undefined" || !window.MutationObserver) {
      return;
    }

    const observer = new MutationObserver(mutations => {
      if (this.prefersReducedMotion()) {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.processElement(node as Element);
            }
          });
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Process element for reduced motion
   */
  private processElement(element: Element): void {
    if (!this.prefersReducedMotion()) {
      return;
    }

    // Remove autoplay from videos
    if (this.config.disableAutoplay) {
      const videos = element.querySelectorAll("video[autoplay]");
      videos.forEach(video => {
        (video as HTMLVideoElement).removeAttribute("autoplay");
      });

      const gifs = element.querySelectorAll('img[src*=".gif"]');
      gifs.forEach(gif => {
        const img = gif as HTMLImageElement;
        if (img.src.includes(".gif")) {
          // Replace with static version if available
          const staticSrc = img.src.replace(".gif", "-static.png");
          img.src = staticSrc;
        }
      });
    }

    // Disable CSS animations
    if (this.config.simplifyAnimations) {
      (element as HTMLElement).style.animationDuration = "0ms";
      (element as HTMLElement).style.transitionDuration = "0ms";
    }
  }
}

// Global reduced motion manager
export const globalReducedMotionManager = new ReducedMotionManager();

/**
 * Utility functions for reduced motion
 */
export const reducedMotionUtils = {
  /**
   * Check if reduced motion is preferred
   */
  isReduced: (): boolean => {
    return globalReducedMotionManager.prefersReducedMotion();
  },

  /**
   * Get motion-safe duration
   */
  safeDuration: (duration: number): number => {
    return globalReducedMotionManager.getSafeDuration(duration);
  },

  /**
   * Get motion-safe delay
   */
  safeDelay: (delay: number): number => {
    return reducedMotionUtils.isReduced() ? Math.min(delay, 100) : delay;
  },

  /**
   * Create motion-safe CSS transition
   */
  safeTransition: (
    property: string,
    duration: number,
    easing: string = "ease"
  ): string => {
    const safeDuration = reducedMotionUtils.safeDuration(duration);
    const safeEasing = reducedMotionUtils.isReduced() ? "ease" : easing;
    return `${property} ${safeDuration}ms ${safeEasing}`;
  },

  /**
   * Create motion-safe animation
   */
  safeAnimation: (
    name: string,
    duration: number,
    easing: string = "ease",
    delay: number = 0,
    fillMode: string = "both"
  ): string => {
    if (reducedMotionUtils.isReduced()) {
      return "none";
    }

    const safeDuration = reducedMotionUtils.safeDuration(duration);
    const safeDelay = reducedMotionUtils.safeDelay(delay);

    return `${name} ${safeDuration}ms ${easing} ${safeDelay}ms ${fillMode}`;
  },

  /**
   * Apply reduced motion styles to element
   */
  applyReducedMotion: (element: HTMLElement): void => {
    if (reducedMotionUtils.isReduced()) {
      element.style.animationDuration = "0ms";
      element.style.animationDelay = "0ms";
      element.style.transitionDuration = "100ms";
      element.style.transitionDelay = "0ms";
    }
  },

  /**
   * Create accessible animation wrapper
   */
  wrapAnimation: <T extends HTMLElement>(
    element: T,
    animationConfig: {
      keyframes: Keyframe[];
      options: KeyframeAnimationOptions;
    }
  ): Animation | null => {
    if (reducedMotionUtils.isReduced()) {
      // Apply end state immediately
      const endState =
        animationConfig.keyframes[animationConfig.keyframes.length - 1];
      Object.assign(element.style, endState);
      return null;
    }

    // Create normal animation
    return element.animate(animationConfig.keyframes, animationConfig.options);
  },

  /**
   * Create reduced motion CSS
   */
  createReducedMotionCSS: (): string => {
    return `
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
        
        /* Disable parallax */
        [data-parallax] {
          transform: none !important;
        }
        
        /* Disable autoplay */
        video[autoplay] {
          animation-play-state: paused;
        }
        
        /* Simplify complex animations */
        .animate-spin,
        .animate-bounce,
        .animate-pulse {
          animation: none !important;
        }
      }
      
      .reduce-motion *,
      .reduce-motion *::before,
      .reduce-motion *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    `;
  },

  /**
   * Inject reduced motion CSS
   */
  injectReducedMotionCSS: (): void => {
    if (typeof document === "undefined") return;

    const existingStyle = document.getElementById("reduced-motion-styles");
    if (existingStyle) return;

    const style = document.createElement("style");
    style.id = "reduced-motion-styles";
    style.textContent = reducedMotionUtils.createReducedMotionCSS();
    document.head.appendChild(style);
  },
};

/**
 * React hook for reduced motion
 */
export const useReducedMotion = (config: ReducedMotionConfig = {}) => {
  if (typeof window === "undefined") {
    return {
      prefersReducedMotion: false,
      safeDuration: (duration: number) => duration,
      safeDelay: (delay: number) => delay,
    };
  }

  const manager = new ReducedMotionManager(config);

  return {
    prefersReducedMotion: manager.prefersReducedMotion(),
    safeDuration: manager.getSafeDuration.bind(manager),
    safeDelay: (delay: number) => reducedMotionUtils.safeDelay(delay),
    shouldDisableAnimation: manager.shouldDisableAnimation.bind(manager),
  };
};

// Initialize on load
if (typeof window !== "undefined") {
  // Initialize global manager
  globalReducedMotionManager.initialize();

  // Inject CSS
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      reducedMotionUtils.injectReducedMotionCSS();
    });
  } else {
    reducedMotionUtils.injectReducedMotionCSS();
  }
}

export default {
  ReducedMotionManager,
  globalReducedMotionManager,
  reducedMotionUtils,
  useReducedMotion,
};
