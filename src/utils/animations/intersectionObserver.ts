/**
 * Intersection Observer utilities for viewport-based animations
 * Provides hooks and utilities for triggering animations when elements enter/exit viewport
 */

import { useEffect, useRef, useState } from "react";
import { animationUtils } from "./animationUtils";

// Configuration options for intersection observer
export interface IntersectionConfig {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
  disabled?: boolean;
}

// Default configuration
const defaultConfig: Required<IntersectionConfig> = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
  triggerOnce: true,
  delay: 0,
  disabled: false,
};

// Intersection state
export interface IntersectionState {
  isIntersecting: boolean;
  hasIntersected: boolean;
  entry: IntersectionObserverEntry | null;
}

/**
 * Custom hook for intersection observer
 */
export function useIntersectionObserver(
  config: IntersectionConfig = {}
): [React.RefObject<HTMLElement>, IntersectionState] {
  const elementRef = useRef<HTMLElement>(null);
  const [state, setState] = useState<IntersectionState>({
    isIntersecting: false,
    hasIntersected: false,
    entry: null,
  });

  const mergedConfig = { ...defaultConfig, ...config };

  // Handle reduced motion preference
  const shouldAnimate =
    !mergedConfig.disabled && !animationUtils.shouldReduceMotion();

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !shouldAnimate) return;

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];

        const updateState = () => {
          setState(prevState => ({
            isIntersecting: entry.isIntersecting,
            hasIntersected: prevState.hasIntersected || entry.isIntersecting,
            entry,
          }));
        };

        if (mergedConfig.delay > 0 && entry.isIntersecting) {
          setTimeout(updateState, mergedConfig.delay);
        } else {
          updateState();
        }

        // Unobserve if triggerOnce and element has intersected
        if (mergedConfig.triggerOnce && entry.isIntersecting) {
          observer.unobserve(element);
        }
      },
      {
        threshold: mergedConfig.threshold,
        rootMargin: mergedConfig.rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [
    shouldAnimate,
    mergedConfig.threshold,
    mergedConfig.rootMargin,
    mergedConfig.triggerOnce,
    mergedConfig.delay,
  ]);

  return [elementRef, state];
}

/**
 * Hook for animating elements on scroll
 */
export function useScrollAnimation(
  animationClass: string = "animate-in",
  config: IntersectionConfig = {}
) {
  const [ref, { isIntersecting, hasIntersected }] =
    useIntersectionObserver(config);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const shouldTrigger = config.triggerOnce ? hasIntersected : isIntersecting;

    if (shouldTrigger) {
      element.classList.add(animationClass);
    } else if (!config.triggerOnce) {
      element.classList.remove(animationClass);
    }
  }, [isIntersecting, hasIntersected, animationClass, config.triggerOnce]);

  return ref;
}

/**
 * Hook for staggered animations on multiple children
 */
export function useStaggeredAnimation(
  animationClass: string = "animate-in",
  staggerDelay: number = 100,
  config: IntersectionConfig = {}
) {
  const [ref, { isIntersecting, hasIntersected }] =
    useIntersectionObserver(config);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const children = Array.from(element.children) as HTMLElement[];
    const shouldTrigger = config.triggerOnce ? hasIntersected : isIntersecting;

    children.forEach((child, index) => {
      if (shouldTrigger) {
        setTimeout(() => {
          child.classList.add(animationClass);
        }, index * staggerDelay);
      } else if (!config.triggerOnce) {
        child.classList.remove(animationClass);
      }
    });
  }, [
    isIntersecting,
    hasIntersected,
    animationClass,
    staggerDelay,
    config.triggerOnce,
  ]);

  return ref;
}

/**
 * Utility class for managing intersection observers without React
 */
export class IntersectionManager {
  private observers: Map<Element, IntersectionObserver> = new Map();
  private callbacks: Map<Element, (entry: IntersectionObserverEntry) => void> =
    new Map();

  /**
   * Observe an element for intersection
   */
  observe(
    element: Element,
    callback: (entry: IntersectionObserverEntry) => void,
    config: IntersectionConfig = {}
  ): void {
    const mergedConfig = { ...defaultConfig, ...config };

    // Don't observe if animations are disabled
    if (mergedConfig.disabled || animationUtils.shouldReduceMotion()) {
      return;
    }

    // Clean up existing observer for this element
    this.unobserve(element);

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        const storedCallback = this.callbacks.get(element);

        if (storedCallback) {
          if (mergedConfig.delay > 0 && entry.isIntersecting) {
            setTimeout(() => storedCallback(entry), mergedConfig.delay);
          } else {
            storedCallback(entry);
          }
        }

        // Unobserve if triggerOnce and element is intersecting
        if (mergedConfig.triggerOnce && entry.isIntersecting) {
          this.unobserve(element);
        }
      },
      {
        threshold: mergedConfig.threshold,
        rootMargin: mergedConfig.rootMargin,
      }
    );

    observer.observe(element);
    this.observers.set(element, observer);
    this.callbacks.set(element, callback);
  }

  /**
   * Stop observing an element
   */
  unobserve(element: Element): void {
    const observer = this.observers.get(element);
    if (observer) {
      observer.unobserve(element);
      this.observers.delete(element);
      this.callbacks.delete(element);
    }
  }

  /**
   * Clean up all observers
   */
  disconnect(): void {
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();
    this.callbacks.clear();
  }

  /**
   * Get the number of active observers
   */
  get activeCount(): number {
    return this.observers.size;
  }
}

// Global intersection manager instance
export const globalIntersectionManager = new IntersectionManager();

/**
 * Utility functions for common intersection patterns
 */
export const intersectionUtils = {
  /**
   * Add animation class when element is in viewport
   */
  animateOnView: (
    element: Element,
    animationClass: string = "animate-in",
    config: IntersectionConfig = {}
  ): void => {
    globalIntersectionManager.observe(
      element,
      entry => {
        if (entry.isIntersecting) {
          (element as HTMLElement).classList.add(animationClass);
        } else if (!config.triggerOnce) {
          (element as HTMLElement).classList.remove(animationClass);
        }
      },
      config
    );
  },

  /**
   * Animate children with stagger effect
   */
  staggerChildren: (
    parent: Element,
    animationClass: string = "animate-in",
    staggerDelay: number = 100,
    config: IntersectionConfig = {}
  ): void => {
    globalIntersectionManager.observe(
      parent,
      entry => {
        if (entry.isIntersecting) {
          const children = Array.from(parent.children) as HTMLElement[];
          children.forEach((child, index) => {
            setTimeout(() => {
              child.classList.add(animationClass);
            }, index * staggerDelay);
          });
        } else if (!config.triggerOnce) {
          const children = Array.from(parent.children) as HTMLElement[];
          children.forEach(child => {
            child.classList.remove(animationClass);
          });
        }
      },
      config
    );
  },

  /**
   * Reveal text characters with stagger
   */
  revealText: (
    element: Element,
    config: IntersectionConfig & { charDelay?: number } = {}
  ): void => {
    const charDelay = config.charDelay || 50;
    const textContent = element.textContent || "";

    // Wrap each character in a span
    element.innerHTML = textContent
      .split("")
      .map((char, index) =>
        char === " "
          ? " "
          : `<span class="char-reveal" style="animation-delay: ${index * charDelay}ms">${char}</span>`
      )
      .join("");

    globalIntersectionManager.observe(
      element,
      entry => {
        if (entry.isIntersecting) {
          element.classList.add("text-reveal-active");
        }
      },
      config
    );
  },

  /**
   * Animate counter from 0 to target value
   */
  animateCounter: (
    element: Element,
    targetValue: number,
    duration: number = 2000,
    config: IntersectionConfig = {}
  ): void => {
    globalIntersectionManager.observe(
      element,
      entry => {
        if (entry.isIntersecting) {
          const startTime = performance.now();
          const startValue = 0;

          const updateCounter = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out)
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.floor(
              startValue + (targetValue - startValue) * easedProgress
            );

            element.textContent = currentValue.toLocaleString();

            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            }
          };

          requestAnimationFrame(updateCounter);
        }
      },
      config
    );
  },

  /**
   * Setup parallax scrolling effect
   */
  parallaxScroll: (
    element: Element,
    speed: number = 0.5,
    config: IntersectionConfig = {}
  ): (() => void) => {
    let isInView = false;
    let animationId: number;

    const updateParallax = () => {
      if (!isInView) return;

      const rect = element.getBoundingClientRect();
      const scrollY = window.pageYOffset;
      const elementTop = rect.top + scrollY;
      const windowHeight = window.innerHeight;

      // Calculate parallax offset
      const parallaxY = (scrollY - elementTop + windowHeight) * speed;

      (element as HTMLElement).style.transform = `translateY(${parallaxY}px)`;

      animationId = requestAnimationFrame(updateParallax);
    };

    // Track intersection
    globalIntersectionManager.observe(
      element,
      entry => {
        isInView = entry.isIntersecting;
        if (isInView) {
          updateParallax();
        } else {
          cancelAnimationFrame(animationId);
        }
      },
      { ...config, rootMargin: "100px" }
    );

    // Cleanup function
    return () => {
      cancelAnimationFrame(animationId);
      globalIntersectionManager.unobserve(element);
    };
  },
};

// Initialize observers on DOM content loaded
if (typeof window !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    // Auto-animate elements with data attributes
    document.querySelectorAll("[data-animate]").forEach(element => {
      const animationType = element.getAttribute("data-animate") || "fadeIn";
      const delay = parseInt(element.getAttribute("data-delay") || "0");
      const triggerOnce = element.getAttribute("data-trigger-once") !== "false";

      intersectionUtils.animateOnView(element, `animate-${animationType}`, {
        delay,
        triggerOnce,
      });
    });

    // Auto-stagger children
    document.querySelectorAll("[data-stagger]").forEach(element => {
      const staggerDelay = parseInt(
        element.getAttribute("data-stagger") || "100"
      );
      const animationClass =
        element.getAttribute("data-stagger-class") || "animate-in";

      intersectionUtils.staggerChildren(element, animationClass, staggerDelay);
    });

    // Auto-reveal text
    document.querySelectorAll("[data-text-reveal]").forEach(element => {
      intersectionUtils.revealText(element);
    });
  });
}

export default {
  useIntersectionObserver,
  useScrollAnimation,
  useStaggeredAnimation,
  IntersectionManager,
  globalIntersectionManager,
  intersectionUtils,
};
