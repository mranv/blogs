/**
 * Scroll-triggered animation handlers and utilities
 * Provides smooth scrolling, scroll-based animations, and performance optimizations
 */

import { animationUtils, performanceUtils } from "./animationUtils";

// Scroll animation configuration
export interface ScrollAnimationConfig {
  offset?: number;
  duration?: number;
  easing?: string;
  behavior?: ScrollBehavior;
  threshold?: number;
}

// Default scroll configuration
const defaultScrollConfig: Required<ScrollAnimationConfig> = {
  offset: 0,
  duration: 800,
  easing: "ease-out",
  behavior: "smooth",
  threshold: 0.1,
};

// Parallax configuration
export interface ParallaxConfig {
  speed?: number;
  direction?: "up" | "down" | "left" | "right";
  offset?: number;
  boundary?: number;
  axis?: "x" | "y" | "both";
}

// Progress callback type
export type ProgressCallback = (progress: number, scrollY: number) => void;

/**
 * Smooth scroll utilities
 */
export const smoothScroll = {
  /**
   * Smooth scroll to element
   */
  toElement: (
    target: Element | string,
    config: ScrollAnimationConfig = {}
  ): Promise<void> => {
    return new Promise(resolve => {
      const element =
        typeof target === "string" ? document.querySelector(target) : target;

      if (!element) {
        resolve();
        return;
      }

      const mergedConfig = { ...defaultScrollConfig, ...config };
      const targetPosition =
        element.getBoundingClientRect().top +
        window.pageYOffset -
        mergedConfig.offset;

      // Use native smooth scroll if supported and no custom duration
      if (
        mergedConfig.behavior === "smooth" &&
        mergedConfig.duration === defaultScrollConfig.duration
      ) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        setTimeout(resolve, mergedConfig.duration);
        return;
      }

      // Custom smooth scroll implementation
      const startPosition = window.pageYOffset;
      const distance = targetPosition - startPosition;
      const startTime = performance.now();

      const animateScroll = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / mergedConfig.duration, 1);

        // Apply easing
        let easedProgress = progress;
        if (mergedConfig.easing === "ease-out") {
          easedProgress = 1 - Math.pow(1 - progress, 3);
        } else if (mergedConfig.easing === "ease-in") {
          easedProgress = Math.pow(progress, 3);
        } else if (mergedConfig.easing === "ease-in-out") {
          easedProgress =
            progress < 0.5
              ? 4 * Math.pow(progress, 3)
              : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        }

        const currentPosition = startPosition + distance * easedProgress;
        window.scrollTo(0, currentPosition);

        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animateScroll);
    });
  },

  /**
   * Smooth scroll to top
   */
  toTop: (config: ScrollAnimationConfig = {}): Promise<void> => {
    return smoothScroll.toElement(document.body, config);
  },

  /**
   * Smooth scroll by distance
   */
  by: (distance: number, config: ScrollAnimationConfig = {}): Promise<void> => {
    const mergedConfig = { ...defaultScrollConfig, ...config };
    const startPosition = window.pageYOffset;
    const targetPosition = startPosition + distance;
    const startTime = performance.now();

    return new Promise(resolve => {
      const animateScroll = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / mergedConfig.duration, 1);

        let easedProgress = progress;
        if (mergedConfig.easing === "ease-out") {
          easedProgress = 1 - Math.pow(1 - progress, 3);
        }

        const currentPosition = startPosition + distance * easedProgress;
        window.scrollTo(0, currentPosition);

        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animateScroll);
    });
  },
};

/**
 * Parallax scroll effects
 */
export class ParallaxManager {
  private elements: Map<Element, ParallaxConfig> = new Map();
  private isRunning = false;
  private animationId: number = 0;

  /**
   * Add element for parallax effect
   */
  add(element: Element, config: ParallaxConfig = {}): void {
    const defaultConfig: Required<ParallaxConfig> = {
      speed: 0.5,
      direction: "up",
      offset: 0,
      boundary: window.innerHeight,
      axis: "y",
    };

    this.elements.set(element, { ...defaultConfig, ...config });

    if (!this.isRunning) {
      this.start();
    }
  }

  /**
   * Remove element from parallax
   */
  remove(element: Element): void {
    this.elements.delete(element);

    if (this.elements.size === 0) {
      this.stop();
    }
  }

  /**
   * Start parallax animation loop
   */
  private start(): void {
    if (this.isRunning) return;

    this.isRunning = true;

    const updateParallax = () => {
      if (!this.isRunning) return;

      const scrollY = window.pageYOffset;
      const windowHeight = window.innerHeight;

      this.elements.forEach((config, element) => {
        const rect = element.getBoundingClientRect();
        const elementTop = rect.top + scrollY;
        const elementBottom = elementTop + rect.height;

        // Check if element is in viewport bounds
        if (
          elementBottom < scrollY - config.boundary ||
          elementTop > scrollY + windowHeight + config.boundary
        ) {
          return;
        }

        // Calculate parallax offset
        const progress =
          (scrollY - elementTop + windowHeight) / (windowHeight + rect.height);
        let offset = 0;

        switch (config.direction) {
          case "up":
            offset = -(scrollY * config.speed);
            break;
          case "down":
            offset = scrollY * config.speed;
            break;
          case "left":
            offset = -(scrollY * config.speed);
            break;
          case "right":
            offset = scrollY * config.speed;
            break;
        }

        offset += config.offset;

        // Apply transform based on axis
        let transform = "";
        if (config.axis === "y" || config.axis === "both") {
          transform += `translateY(${config.direction === "up" || config.direction === "down" ? offset : 0}px) `;
        }
        if (config.axis === "x" || config.axis === "both") {
          transform += `translateX(${config.direction === "left" || config.direction === "right" ? offset : 0}px) `;
        }

        // Add 3D transform for hardware acceleration
        transform += "translateZ(0)";

        (element as HTMLElement).style.transform = transform;
      });

      this.animationId = requestAnimationFrame(updateParallax);
    };

    updateParallax();
  }

  /**
   * Stop parallax animation loop
   */
  private stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  /**
   * Clear all parallax elements
   */
  clear(): void {
    this.elements.clear();
    this.stop();
  }

  /**
   * Get number of active parallax elements
   */
  get count(): number {
    return this.elements.size;
  }
}

// Global parallax manager
export const globalParallaxManager = new ParallaxManager();

/**
 * Scroll progress tracking
 */
export class ScrollProgressTracker {
  private callbacks: Set<ProgressCallback> = new Set();
  private isTracking = false;
  private animationId: number = 0;

  /**
   * Add progress callback
   */
  addCallback(callback: ProgressCallback): void {
    this.callbacks.add(callback);

    if (!this.isTracking) {
      this.start();
    }
  }

  /**
   * Remove progress callback
   */
  removeCallback(callback: ProgressCallback): void {
    this.callbacks.delete(callback);

    if (this.callbacks.size === 0) {
      this.stop();
    }
  }

  /**
   * Start tracking scroll progress
   */
  private start(): void {
    if (this.isTracking) return;

    this.isTracking = true;

    const trackProgress = () => {
      if (!this.isTracking) return;

      const scrollY = window.pageYOffset;
      const documentHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(scrollY / documentHeight, 1);

      this.callbacks.forEach(callback => {
        callback(progress, scrollY);
      });

      this.animationId = requestAnimationFrame(trackProgress);
    };

    trackProgress();
  }

  /**
   * Stop tracking scroll progress
   */
  private stop(): void {
    this.isTracking = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  /**
   * Get current scroll progress
   */
  getCurrentProgress(): { progress: number; scrollY: number } {
    const scrollY = window.pageYOffset;
    const documentHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(scrollY / documentHeight, 1);

    return { progress, scrollY };
  }
}

// Global scroll progress tracker
export const globalScrollTracker = new ScrollProgressTracker();

/**
 * Scroll-based animation utilities
 */
export const scrollAnimations = {
  /**
   * Animate element based on scroll progress
   */
  animateOnScroll: (
    element: Element,
    startValue: number,
    endValue: number,
    property: string = "opacity",
    startOffset: number = 0,
    endOffset: number = 1
  ): (() => void) => {
    const callback: ProgressCallback = progress => {
      // Map progress to offset range
      const normalizedProgress = Math.max(
        0,
        Math.min(1, (progress - startOffset) / (endOffset - startOffset))
      );

      const currentValue =
        startValue + (endValue - startValue) * normalizedProgress;

      // Apply the animated property
      if (property === "transform") {
        (element as HTMLElement).style.transform =
          `translateY(${currentValue}px)`;
      } else {
        (element as HTMLElement).style.setProperty(
          property,
          currentValue.toString()
        );
      }
    };

    globalScrollTracker.addCallback(callback);

    // Return cleanup function
    return () => {
      globalScrollTracker.removeCallback(callback);
    };
  },

  /**
   * Create scroll-triggered fade effect
   */
  fadeOnScroll: (element: Element, fadeIn: boolean = true): (() => void) => {
    return scrollAnimations.animateOnScroll(
      element,
      fadeIn ? 0 : 1,
      fadeIn ? 1 : 0,
      "opacity"
    );
  },

  /**
   * Create scroll-triggered slide effect
   */
  slideOnScroll: (
    element: Element,
    distance: number = 50,
    direction: "up" | "down" | "left" | "right" = "up"
  ): (() => void) => {
    const callback: ProgressCallback = progress => {
      const rect = element.getBoundingClientRect();
      const elementTop = rect.top + window.pageYOffset;
      const windowHeight = window.innerHeight;

      // Calculate visibility progress
      const elementProgress = Math.max(
        0,
        Math.min(
          1,
          (window.pageYOffset + windowHeight - elementTop) / windowHeight
        )
      );

      let transform = "";
      const offset = distance * (1 - elementProgress);

      switch (direction) {
        case "up":
          transform = `translateY(${offset}px)`;
          break;
        case "down":
          transform = `translateY(${-offset}px)`;
          break;
        case "left":
          transform = `translateX(${offset}px)`;
          break;
        case "right":
          transform = `translateX(${-offset}px)`;
          break;
      }

      (element as HTMLElement).style.transform = transform;
      (element as HTMLElement).style.opacity = elementProgress.toString();
    };

    globalScrollTracker.addCallback(callback);

    return () => {
      globalScrollTracker.removeCallback(callback);
    };
  },

  /**
   * Create scroll-triggered scale effect
   */
  scaleOnScroll: (
    element: Element,
    startScale: number = 0.8,
    endScale: number = 1
  ): (() => void) => {
    const callback: ProgressCallback = () => {
      const rect = element.getBoundingClientRect();
      const elementTop = rect.top + window.pageYOffset;
      const windowHeight = window.innerHeight;

      const elementProgress = Math.max(
        0,
        Math.min(
          1,
          (window.pageYOffset + windowHeight - elementTop) / windowHeight
        )
      );

      const scale = startScale + (endScale - startScale) * elementProgress;
      (element as HTMLElement).style.transform = `scale(${scale})`;
      (element as HTMLElement).style.opacity = elementProgress.toString();
    };

    globalScrollTracker.addCallback(callback);

    return () => {
      globalScrollTracker.removeCallback(callback);
    };
  },

  /**
   * Create scroll progress indicator
   */
  createProgressIndicator: (element: Element): (() => void) => {
    const callback: ProgressCallback = progress => {
      (element as HTMLElement).style.transform = `scaleX(${progress})`;
    };

    globalScrollTracker.addCallback(callback);

    return () => {
      globalScrollTracker.removeCallback(callback);
    };
  },
};

/**
 * Initialize scroll animations
 */
export const initScrollAnimations = (): void => {
  if (typeof window === "undefined") return;

  // Throttled scroll handler for performance
  const throttledScrollHandler = performanceUtils.throttle(() => {
    // Additional scroll-based logic can be added here
  }, 16); // ~60fps

  window.addEventListener("scroll", throttledScrollHandler, { passive: true });

  // Auto-initialize parallax elements
  document.querySelectorAll("[data-parallax]").forEach(element => {
    const speed = parseFloat(element.getAttribute("data-parallax") || "0.5");
    const direction =
      (element.getAttribute(
        "data-parallax-direction"
      ) as ParallaxConfig["direction"]) || "up";

    globalParallaxManager.add(element, { speed, direction });
  });

  // Auto-initialize scroll animations
  document.querySelectorAll("[data-scroll-animation]").forEach(element => {
    const animationType = element.getAttribute("data-scroll-animation");

    switch (animationType) {
      case "fade":
        scrollAnimations.fadeOnScroll(element);
        break;
      case "slide-up":
        scrollAnimations.slideOnScroll(element, 50, "up");
        break;
      case "slide-down":
        scrollAnimations.slideOnScroll(element, 50, "down");
        break;
      case "scale":
        scrollAnimations.scaleOnScroll(element);
        break;
    }
  });

  // Initialize progress indicators
  document.querySelectorAll("[data-scroll-progress]").forEach(element => {
    scrollAnimations.createProgressIndicator(element);
  });
};

// Auto-initialize on DOM load
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initScrollAnimations);
  } else {
    initScrollAnimations();
  }
}

export default {
  smoothScroll,
  ParallaxManager,
  ScrollProgressTracker,
  globalParallaxManager,
  globalScrollTracker,
  scrollAnimations,
  initScrollAnimations,
};
