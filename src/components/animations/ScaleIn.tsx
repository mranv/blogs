/**
 * ScaleIn Animation Component
 * Provides smooth scale-in animations with various effects and hover states
 */

import React, { forwardRef, useEffect, useRef, useState } from "react";
import { useIntersectionObserver } from "@utils/animations/intersectionObserver";
import { useAnimation } from "./AnimationProvider";
import { cn } from "@utils/cn";

// ScaleIn animation variants
export type ScaleVariant =
  | "scale"
  | "zoom"
  | "pop"
  | "elastic"
  | "bounce"
  | "flip"
  | "rotate-scale";

// ScaleIn origin points
export type ScaleOrigin =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

// ScaleIn component props
export interface ScaleInProps {
  children: React.ReactNode;
  variant?: ScaleVariant;
  origin?: ScaleOrigin;
  duration?: number;
  delay?: number;
  initialScale?: number;
  finalScale?: number;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  cascade?: boolean;
  cascadeDelay?: number;
  hoverScale?: number;
  hoverDuration?: number;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}

// Transform origin mapping
const originMap: Record<ScaleOrigin, string> = {
  center: "center center",
  top: "center top",
  bottom: "center bottom",
  left: "left center",
  right: "right center",
  "top-left": "left top",
  "top-right": "right top",
  "bottom-left": "left bottom",
  "bottom-right": "right bottom",
};

// Animation variants with their easing curves and transforms
const variantConfig: Record<
  ScaleVariant,
  {
    easing: string;
    transform?: (scale: number) => string;
  }
> = {
  scale: {
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
  zoom: {
    easing: "cubic-bezier(0.25, 0.1, 0.25, 1)",
  },
  pop: {
    easing: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  },
  elastic: {
    easing: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },
  bounce: {
    easing: "cubic-bezier(0.68, -0.6, 0.32, 1.6)",
  },
  flip: {
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    transform: scale => `scale(${scale}) rotateY(180deg)`,
  },
  "rotate-scale": {
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    transform: scale => `scale(${scale}) rotate(360deg)`,
  },
};

/**
 * ScaleIn Component
 */
export const ScaleIn = forwardRef<HTMLDivElement, ScaleInProps>(
  (
    {
      children,
      variant = "scale",
      origin = "center",
      duration = 600,
      delay = 0,
      initialScale = 0.8,
      finalScale = 1,
      threshold = 0.1,
      rootMargin = "0px 0px -50px 0px",
      triggerOnce = true,
      cascade = false,
      cascadeDelay = 100,
      hoverScale,
      hoverDuration = 200,
      className,
      style,
      disabled = false,
      onAnimationStart,
      onAnimationComplete,
      onHoverStart,
      onHoverEnd,
    },
    ref
  ) => {
    const elementRef = useRef<HTMLDivElement>(null);
    const animationRef = ref || elementRef;
    const [isHovered, setIsHovered] = useState(false);

    // Get animation context
    const {
      prefersReducedMotion,
      shouldAnimateElement,
      getOptimalDuration,
      registerAnimation,
    } = useAnimation();

    // Calculate effective values based on context
    const effectiveDuration = getOptimalDuration(duration);
    const effectiveHoverDuration = getOptimalDuration(hoverDuration);
    const shouldAnimate =
      !disabled && shouldAnimateElement(elementRef.current!);
    const finalInitialScale = prefersReducedMotion ? 0.95 : initialScale;
    const config = variantConfig[variant];

    // Setup intersection observer
    const [observerRef, { isIntersecting, hasIntersected }] =
      useIntersectionObserver({
        threshold,
        rootMargin,
        triggerOnce,
        delay,
        disabled: disabled || !shouldAnimate,
      });

    // Sync refs
    useEffect(() => {
      if (animationRef && "current" in animationRef && observerRef.current) {
        (animationRef as React.MutableRefObject<HTMLDivElement>).current =
          observerRef.current;
      }
    }, [animationRef, observerRef]);

    // Register animation with provider
    useEffect(() => {
      if (!shouldAnimate) return;

      const animationId = `scale-in-${Math.random().toString(36).substr(2, 9)}`;
      const cleanup = registerAnimation(animationId);

      return cleanup;
    }, [shouldAnimate, registerAnimation]);

    // Handle animation state changes
    useEffect(() => {
      const element = observerRef.current;
      if (!element || !shouldAnimate) return;

      const shouldTrigger = triggerOnce ? hasIntersected : isIntersecting;

      if (shouldTrigger) {
        // Start animation
        element.classList.add("scale-in-active");
        onAnimationStart?.();

        // Handle animation complete
        const handleAnimationEnd = (event: TransitionEvent) => {
          if (event.target === element && event.propertyName === "transform") {
            onAnimationComplete?.();
            element.removeEventListener("transitionend", handleAnimationEnd);
          }
        };

        element.addEventListener("transitionend", handleAnimationEnd);
      } else if (!triggerOnce) {
        // Reset animation
        element.classList.remove("scale-in-active");
      }
    }, [
      isIntersecting,
      hasIntersected,
      triggerOnce,
      shouldAnimate,
      onAnimationStart,
      onAnimationComplete,
    ]);

    // Handle cascade animations
    useEffect(() => {
      const element = observerRef.current;
      if (!element || !shouldAnimate || !cascade) return;

      const children = Array.from(element.children) as HTMLElement[];
      const shouldTrigger = triggerOnce ? hasIntersected : isIntersecting;

      if (shouldTrigger) {
        children.forEach((child, index) => {
          const childDelay = delay + index * cascadeDelay;
          child.style.transitionDelay = `${childDelay}ms`;

          setTimeout(() => {
            child.classList.add("scale-in-cascade-active");
          }, index * cascadeDelay);
        });
      } else if (!triggerOnce) {
        children.forEach(child => {
          child.classList.remove("scale-in-cascade-active");
          child.style.transitionDelay = "";
        });
      }
    }, [
      isIntersecting,
      hasIntersected,
      triggerOnce,
      cascade,
      cascadeDelay,
      delay,
      shouldAnimate,
    ]);

    // Handle hover events
    const handleMouseEnter = () => {
      if (!hoverScale || !shouldAnimate) return;
      setIsHovered(true);
      onHoverStart?.();
    };

    const handleMouseLeave = () => {
      if (!hoverScale || !shouldAnimate) return;
      setIsHovered(false);
      onHoverEnd?.();
    };

    // Generate transform function
    const getTransform = (scale: number): string => {
      if (config.transform) {
        return config.transform(scale);
      }
      return `scale(${scale})`;
    };

    // CSS custom properties
    const cssVars = {
      "--scale-duration": `${effectiveDuration}ms`,
      "--scale-delay": `${delay}ms`,
      "--scale-initial": finalInitialScale.toString(),
      "--scale-final": finalScale.toString(),
      "--scale-hover": hoverScale?.toString() || finalScale.toString(),
      "--scale-hover-duration": `${effectiveHoverDuration}ms`,
      "--scale-easing": prefersReducedMotion ? "ease" : config.easing,
      "--scale-origin": originMap[origin],
      "--scale-transform-initial": getTransform(finalInitialScale),
      "--scale-transform-final": getTransform(finalScale),
      "--scale-transform-hover": getTransform(hoverScale || finalScale),
    };

    // Combined styles
    const combinedStyles = {
      ...cssVars,
      ...style,
    };

    // If animations are disabled, render children directly
    if (!shouldAnimate) {
      return (
        <div
          ref={animationRef}
          className={cn("scale-in-disabled", className)}
          style={style}
          onMouseEnter={hoverScale ? handleMouseEnter : undefined}
          onMouseLeave={hoverScale ? handleMouseLeave : undefined}
        >
          {children}
        </div>
      );
    }

    return (
      <div
        ref={observerRef}
        className={cn(
          "scale-in-container",
          `scale-in-${variant}`,
          `scale-in-origin-${origin}`,
          {
            "scale-in-cascade": cascade,
            "scale-in-hoverable": hoverScale,
            "scale-in-hovered": isHovered,
            "scale-in-reduced-motion": prefersReducedMotion,
          },
          className
        )}
        style={combinedStyles}
        onMouseEnter={hoverScale ? handleMouseEnter : undefined}
        onMouseLeave={hoverScale ? handleMouseLeave : undefined}
      >
        {children}
      </div>
    );
  }
);

ScaleIn.displayName = "ScaleIn";

/**
 * ScaleInGrid Component - For grid layout animations
 */
export interface ScaleInGridProps
  extends Omit<ScaleInProps, "cascade" | "cascadeDelay"> {
  items: React.ReactNode[];
  columns?: number;
  itemDelay?: number;
  pattern?: "sequential" | "spiral" | "random" | "wave";
}

export const ScaleInGrid = forwardRef<HTMLDivElement, ScaleInGridProps>(
  (
    { items, columns = 3, itemDelay = 100, pattern = "sequential", ...props },
    ref
  ) => {
    // Calculate delay based on pattern
    const getItemDelay = (index: number): number => {
      const row = Math.floor(index / columns);
      const col = index % columns;

      switch (pattern) {
        case "spiral":
          // Spiral from outside to inside
          const distance = Math.min(
            Math.min(row, Math.floor(items.length / columns) - row),
            Math.min(col, columns - 1 - col)
          );
          return distance * itemDelay;

        case "wave":
          // Wave pattern
          return (row + col) * itemDelay;

        case "random":
          // Random order
          return Math.random() * itemDelay * items.length;

        case "sequential":
        default:
          return index * itemDelay;
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "scale-in-grid-container",
          `scale-in-grid-columns-${columns}`,
          `scale-in-grid-${pattern}`
        )}
      >
        {items.map((item, index) => (
          <ScaleIn key={index} delay={getItemDelay(index)} {...props}>
            <div className="scale-in-grid-item">{item}</div>
          </ScaleIn>
        ))}
      </div>
    );
  }
);

ScaleInGrid.displayName = "ScaleInGrid";

/**
 * ScaleInButton Component - Enhanced button with scale animations
 */
export interface ScaleInButtonProps extends ScaleInProps {
  onClick?: () => void;
  href?: string;
  target?: string;
  rel?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
}

export const ScaleInButton = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ScaleInButtonProps
>(
  (
    {
      children,
      onClick,
      href,
      target,
      rel,
      type = "button",
      disabled = false,
      loading = false,
      loadingText = "Loading...",
      hoverScale = 1.05,
      variant = "pop",
      ...props
    },
    ref
  ) => {
    const content = loading ? loadingText : children;

    const Component = href ? "a" : "button";
    const componentProps = href ? { href, target, rel } : { type, onClick };

    return (
      <ScaleIn
        hoverScale={hoverScale}
        variant={variant}
        disabled={disabled || loading}
        {...props}
      >
        <Component
          ref={ref as any}
          className={cn("scale-in-button", {
            "scale-in-button-loading": loading,
            "scale-in-button-disabled": disabled,
          })}
          disabled={disabled || loading}
          {...componentProps}
        >
          {content}
        </Component>
      </ScaleIn>
    );
  }
);

ScaleInButton.displayName = "ScaleInButton";

export default ScaleIn;
