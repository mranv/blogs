/**
 * Animation utility functions and constants
 * Provides professional easing functions, timing utilities, and animation helpers
 */

// Professional easing curves
export const easingCurves = {
  // Standard easing
  ease: "cubic-bezier(0.25, 0.1, 0.25, 1)",
  easeIn: "cubic-bezier(0.42, 0, 1, 1)",
  easeOut: "cubic-bezier(0, 0, 0.58, 1)",
  easeInOut: "cubic-bezier(0.42, 0, 0.58, 1)",

  // Smooth easing
  smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
  smoothIn: "cubic-bezier(0.4, 0, 1, 1)",
  smoothOut: "cubic-bezier(0, 0, 0.2, 1)",

  // Spring-like easing
  spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  anticipate: "cubic-bezier(0.175, 0.885, 0.320, 1.275)",

  // Sharp transitions
  sharp: "cubic-bezier(0.4, 0, 0.6, 1)",

  // Custom cybersecurity theme curves
  matrix: "cubic-bezier(0.23, 1, 0.32, 1)",
  cyber: "cubic-bezier(0.190, 1.000, 0.220, 1.000)",
  hack: "cubic-bezier(0.77, 0, 0.175, 1)",
} as const;

// Animation durations (in milliseconds)
export const durations = {
  instant: 50,
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 750,
  slowest: 1000,

  // Context-specific durations
  hover: 200,
  focus: 150,
  tooltip: 100,
  modal: 300,
  page: 500,
  stagger: 50,
} as const;

// Stagger delays for child animations
export const staggerDelays = {
  fast: 50,
  normal: 100,
  slow: 150,
  slower: 200,
} as const;

// Animation configuration presets
export const animationPresets = {
  fadeIn: {
    duration: durations.normal,
    easing: easingCurves.smooth,
    from: { opacity: 0, transform: "translateY(20px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
  slideUp: {
    duration: durations.normal,
    easing: easingCurves.smooth,
    from: { opacity: 0, transform: "translateY(40px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
  slideDown: {
    duration: durations.normal,
    easing: easingCurves.smooth,
    from: { opacity: 0, transform: "translateY(-40px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
  slideLeft: {
    duration: durations.normal,
    easing: easingCurves.smooth,
    from: { opacity: 0, transform: "translateX(40px)" },
    to: { opacity: 1, transform: "translateX(0)" },
  },
  slideRight: {
    duration: durations.normal,
    easing: easingCurves.smooth,
    from: { opacity: 0, transform: "translateX(-40px)" },
    to: { opacity: 1, transform: "translateX(0)" },
  },
  scaleIn: {
    duration: durations.fast,
    easing: easingCurves.spring,
    from: { opacity: 0, transform: "scale(0.8)" },
    to: { opacity: 1, transform: "scale(1)" },
  },
  scaleOut: {
    duration: durations.fast,
    easing: easingCurves.smooth,
    from: { opacity: 1, transform: "scale(1)" },
    to: { opacity: 0, transform: "scale(0.8)" },
  },
  rotateIn: {
    duration: durations.normal,
    easing: easingCurves.spring,
    from: { opacity: 0, transform: "rotate(-10deg) scale(0.9)" },
    to: { opacity: 1, transform: "rotate(0deg) scale(1)" },
  },
} as const;

// Utility functions
export const animationUtils = {
  /**
   * Create a CSS animation string
   */
  createAnimation: (
    keyframes: string,
    duration: number = durations.normal,
    easing: string = easingCurves.smooth,
    delay: number = 0,
    fillMode: string = "both"
  ): string => {
    return `${keyframes} ${duration}ms ${easing} ${delay}ms ${fillMode}`;
  },

  /**
   * Convert milliseconds to seconds
   */
  msToS: (ms: number): string => `${ms / 1000}s`,

  /**
   * Generate stagger delay for nth child
   */
  staggerDelay: (
    index: number,
    baseDelay: number = staggerDelays.normal
  ): number => {
    return index * baseDelay;
  },

  /**
   * Create CSS custom properties for animation
   */
  createCSSVars: (
    config: Record<string, string | number>
  ): Record<string, string> => {
    const vars: Record<string, string> = {};
    Object.entries(config).forEach(([key, value]) => {
      vars[`--anim-${key}`] = typeof value === "number" ? `${value}ms` : value;
    });
    return vars;
  },

  /**
   * Check if user prefers reduced motion
   */
  shouldReduceMotion: (): boolean => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  },

  /**
   * Get animation duration based on user preference
   */
  getReducedDuration: (normalDuration: number): number => {
    return animationUtils.shouldReduceMotion()
      ? normalDuration * 0.3
      : normalDuration;
  },

  /**
   * Get safe animation config for reduced motion
   */
  getSafeConfig: (config: any) => {
    if (animationUtils.shouldReduceMotion()) {
      return {
        ...config,
        duration: config.duration * 0.3,
        easing: easingCurves.ease,
      };
    }
    return config;
  },

  /**
   * Generate unique animation name
   */
  generateAnimationName: (): string => {
    return `anim-${Math.random().toString(36).substring(2, 11)}`;
  },

  /**
   * Create keyframes string
   */
  createKeyframes: (
    name: string,
    frames: Record<string, Record<string, string>>
  ): string => {
    const keyframeRules = Object.entries(frames)
      .map(([percentage, styles]) => {
        const styleRules = Object.entries(styles)
          .map(([prop, value]) => `${prop}: ${value};`)
          .join(" ");
        return `${percentage} { ${styleRules} }`;
      })
      .join(" ");

    return `@keyframes ${name} { ${keyframeRules} }`;
  },

  /**
   * Parse transform values from string
   */
  parseTransform: (transform: string): Record<string, string> => {
    const transforms: Record<string, string> = {};
    const regex = /(\w+)\(([^)]+)\)/g;
    let match;

    while ((match = regex.exec(transform)) !== null) {
      transforms[match[1]] = match[2];
    }

    return transforms;
  },

  /**
   * Combine transform values
   */
  combineTransforms: (transforms: Record<string, string>): string => {
    return Object.entries(transforms)
      .map(([func, value]) => `${func}(${value})`)
      .join(" ");
  },

  /**
   * Calculate bezier curve value at time t
   */
  bezier: (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    t: number
  ): number => {
    // const cx = 3 * x1;
    // const bx = 3 * (x2 - x1) - cx;
    // const _ax = 1 - cx - bx; // Unused variable

    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;

    // const _cuberoot = (x: number) =>
    //   x < 0 ? -Math.pow(-x, 1 / 3) : Math.pow(x, 1 / 3); // Unused function

    return ay * Math.pow(t, 3) + by * Math.pow(t, 2) + cy * t;
  },

  /**
   * Spring physics animation calculator
   */
  spring: (tension: number = 170, friction: number = 26, mass: number = 1) => {
    const w0 = Math.sqrt(tension / mass);
    const zeta = friction / (2 * Math.sqrt(tension * mass));

    return {
      tension,
      friction,
      mass,
      omega: w0,
      dampingRatio: zeta,
      duration: (4 / (zeta * w0)) * 1000, // Convert to milliseconds
    };
  },
};

// Performance optimization utilities
export const performanceUtils = {
  /**
   * Create optimized animation with will-change
   */
  withWillChange: (element: HTMLElement, properties: string[]) => {
    element.style.willChange = properties.join(", ");
    return () => {
      element.style.willChange = "auto";
    };
  },

  /**
   * Force hardware acceleration
   */
  forceHardwareAcceleration: (element: HTMLElement) => {
    element.style.transform = element.style.transform
      ? `${element.style.transform} translateZ(0)`
      : "translateZ(0)";
  },

  /**
   * Debounce function for scroll/resize handlers
   */
  debounce: <T extends (...args: any[]) => void>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  /**
   * Throttle function for frequent events
   */
  throttle: <T extends (...args: any[]) => void>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  /**
   * Request animation frame with fallback
   */
  requestFrame: (callback: FrameRequestCallback): number => {
    return requestAnimationFrame(callback);
  },

  /**
   * Cancel animation frame
   */
  cancelFrame: (id: number): void => {
    cancelAnimationFrame(id);
  },
};

// Export types
export type EasingCurve = keyof typeof easingCurves;
export type Duration = keyof typeof durations;
export type AnimationPreset = keyof typeof animationPresets;

export default {
  easingCurves,
  durations,
  staggerDelays,
  animationPresets,
  animationUtils,
  performanceUtils,
};
