/**
 * PageTransition Animation Component
 * Provides smooth page-to-page transitions with various effects and Astro View Transitions integration
 */

import React, { forwardRef, useEffect, useRef, useState } from "react";
import { useAnimation } from "./AnimationProvider";
import { cn } from "@utils/cn";

// Page transition types
export type PageTransitionType =
  | "fade"
  | "slide-left"
  | "slide-right"
  | "slide-up"
  | "slide-down"
  | "scale"
  | "blur"
  | "wipe"
  | "flip"
  | "cube"
  | "matrix"
  | "cyber-glitch";

// Transition direction
export type TransitionDirection = "in" | "out";

// PageTransition component props
export interface PageTransitionProps {
  children: React.ReactNode;
  type?: PageTransitionType;
  duration?: number;
  delay?: number;
  direction?: TransitionDirection;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  onTransitionStart?: () => void;
  onTransitionComplete?: () => void;
}

// Page loader props
export interface PageLoaderProps {
  type?: "spinner" | "progress" | "dots" | "cyber" | "matrix";
  message?: string;
  progress?: number;
  className?: string;
  style?: React.CSSProperties;
}

// Route transition props
export interface RouteTransitionProps
  extends Omit<PageTransitionProps, "direction"> {
  from?: string;
  to?: string;
  trigger?: boolean;
}

/**
 * PageTransition Component
 */
const PageTransition = forwardRef<HTMLDivElement, PageTransitionProps>(
  (
    {
      children,
      type = "fade",
      duration = 500,
      delay = 0,
      direction = "in",
      className,
      style,
      disabled = false,
      onTransitionStart,
      onTransitionComplete,
    },
    ref
  ) => {
    const elementRef = useRef<HTMLDivElement>(null);
    const transitionRef = ref || elementRef;
    const [isActive, setIsActive] = useState(false);

    // Get animation context
    const { prefersReducedMotion, shouldAnimateElement, getOptimalDuration } =
      useAnimation();

    // Calculate effective values
    const effectiveDuration = getOptimalDuration(duration);
    const shouldAnimate =
      !disabled && shouldAnimateElement(elementRef.current!);

    // Trigger transition
    useEffect(() => {
      if (!shouldAnimate) return;

      const timer = setTimeout(() => {
        setIsActive(true);
        onTransitionStart?.();

        // Complete transition after duration
        const completeTimer = setTimeout(() => {
          onTransitionComplete?.();
        }, effectiveDuration);

        return () => clearTimeout(completeTimer);
      }, delay);

      return () => clearTimeout(timer);
    }, [
      shouldAnimate,
      delay,
      effectiveDuration,
      onTransitionStart,
      onTransitionComplete,
    ]);

    // CSS custom properties for transitions
    const cssVars = {
      "--transition-duration": `${effectiveDuration}ms`,
      "--transition-delay": `${delay}ms`,
      "--transition-easing": prefersReducedMotion
        ? "ease"
        : "cubic-bezier(0.4, 0, 0.2, 1)",
    };

    const combinedStyles = {
      ...cssVars,
      ...style,
    };

    // If animations are disabled, render children directly
    if (!shouldAnimate) {
      return (
        <div ref={transitionRef} className={className} style={style}>
          {children}
        </div>
      );
    }

    return (
      <div
        ref={transitionRef}
        className={cn(
          "page-transition-container",
          `page-transition-${type}`,
          `page-transition-${direction}`,
          {
            "page-transition-active": isActive,
            "page-transition-reduced-motion": prefersReducedMotion,
          },
          className
        )}
        style={combinedStyles}
      >
        {children}
      </div>
    );
  }
);

PageTransition.displayName = "PageTransition";

/**
 * PageLoader Component
 */
const PageLoader = forwardRef<HTMLDivElement, PageLoaderProps>(
  (
    {
      type = "spinner",
      message = "Loading...",
      progress = 0,
      className,
      style,
    },
    ref
  ) => {
    const [dots, setDots] = useState("");

    // Animate dots for certain loader types
    useEffect(() => {
      if (type === "dots") {
        const interval = setInterval(() => {
          setDots(prev => (prev.length >= 3 ? "" : prev + "."));
        }, 500);

        return () => clearInterval(interval);
      }
    }, [type]);

    const renderLoader = () => {
      switch (type) {
        case "spinner":
          return (
            <div className="page-loader-spinner">
              <div className="spinner-ring"></div>
            </div>
          );

        case "progress":
          return (
            <div className="page-loader-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="progress-text">{Math.round(progress)}%</div>
            </div>
          );

        case "dots":
          return (
            <div className="page-loader-dots">
              <div className="dots-container">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          );

        case "cyber":
          return (
            <div className="page-loader-cyber">
              <div className="cyber-grid">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="cyber-cell" />
                ))}
              </div>
              <div className="cyber-scanline" />
            </div>
          );

        case "matrix":
          return (
            <div className="page-loader-matrix">
              <div className="matrix-rain">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="matrix-column">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <span key={j} className="matrix-char">
                        {String.fromCharCode(0x30a0 + Math.random() * 96)}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );

        default:
          return <div className="page-loader-default" />;
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "page-loader-container",
          `page-loader-${type}`,
          className
        )}
        style={style}
      >
        {renderLoader()}
        {message && (
          <div className="page-loader-message">
            {message}
            {type === "dots" && dots}
          </div>
        )}
      </div>
    );
  }
);

PageLoader.displayName = "PageLoader";

/**
 * RouteTransition Component - For route changes
 */
const RouteTransition = forwardRef<HTMLDivElement, RouteTransitionProps>(
  (
    { children, from: _from, to: _to, trigger = false, ...transitionProps },
    ref
  ) => {
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [currentChildren, setCurrentChildren] = useState(children);

    useEffect(() => {
      if (trigger) {
        setIsTransitioning(true);

        // Start exit transition
        setTimeout(
          () => {
            setCurrentChildren(children);
            // Start enter transition
            setTimeout(() => {
              setIsTransitioning(false);
            }, 50);
          },
          transitionProps.duration ? transitionProps.duration / 2 : 250
        );
      } else {
        setCurrentChildren(children);
      }
    }, [trigger, children, transitionProps.duration]);

    return (
      <div
        ref={ref}
        className={cn("route-transition-container", {
          "route-transitioning": isTransitioning,
        })}
      >
        <PageTransition
          direction={isTransitioning ? "out" : "in"}
          {...transitionProps}
        >
          {currentChildren}
        </PageTransition>
      </div>
    );
  }
);

RouteTransition.displayName = "RouteTransition";

/**
 * ViewTransitionWrapper - Integration with Astro View Transitions
 */
export interface ViewTransitionWrapperProps {
  children: React.ReactNode;
  name?: string;
  className?: string;
  style?: React.CSSProperties;
}

const ViewTransitionWrapper = forwardRef<
  HTMLDivElement,
  ViewTransitionWrapperProps
>(({ children, name, className, style }, ref) => {
  const wrapperStyle = {
    viewTransitionName: name,
    ...style,
  };

  return (
    <div
      ref={ref}
      className={cn("view-transition-wrapper", className)}
      style={wrapperStyle}
    >
      {children}
    </div>
  );
});

ViewTransitionWrapper.displayName = "ViewTransitionWrapper";

/**
 * TransitionGroup - Manage multiple transitions
 */
export interface TransitionGroupProps {
  children: React.ReactNode;
  mode?: "out-in" | "in-out" | "simultaneous";
  className?: string;
  style?: React.CSSProperties;
}

const TransitionGroup = forwardRef<HTMLDivElement, TransitionGroupProps>(
  ({ children, mode = "out-in", className, style }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "transition-group",
          `transition-group-${mode}`,
          className
        )}
        style={style}
      >
        {children}
      </div>
    );
  }
);

TransitionGroup.displayName = "TransitionGroup";

/**
 * Utility function to trigger programmatic page transitions
 */
const triggerPageTransition = (
  type: PageTransitionType = "fade",
  duration: number = 500
): Promise<void> => {
  return new Promise(resolve => {
    // Add transition class to body
    document.body.classList.add(`page-transition-${type}-out`);

    setTimeout(() => {
      document.body.classList.remove(`page-transition-${type}-out`);
      document.body.classList.add(`page-transition-${type}-in`);

      setTimeout(() => {
        document.body.classList.remove(`page-transition-${type}-in`);
        resolve();
      }, duration);
    }, duration / 2);
  });
};

/**
 * Hook for managing page transitions
 */
const usePageTransition = (type: PageTransitionType = "fade") => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const startTransition = async (callback?: () => void) => {
    setIsTransitioning(true);

    await triggerPageTransition(type);
    callback?.();

    setIsTransitioning(false);
  };

  return {
    isTransitioning,
    startTransition,
  };
};

export {
  PageTransition,
  PageLoader,
  RouteTransition,
  ViewTransitionWrapper,
  TransitionGroup,
  triggerPageTransition,
  usePageTransition,
};

export default PageTransition;
