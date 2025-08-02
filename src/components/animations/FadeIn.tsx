/**
 * FadeIn Animation Component
 * Provides smooth fade-in animations with various directions and configurations
 */

import React, { forwardRef, useEffect, useRef } from "react";
import { useIntersectionObserver } from "@utils/animations/intersectionObserver";
import { useAnimation } from "./AnimationProvider";
import { cn } from "@utils/cn";

// FadeIn animation directions
export type FadeDirection =
  | "up"
  | "down"
  | "left"
  | "right"
  | "up-left"
  | "up-right"
  | "down-left"
  | "down-right"
  | "none";

// FadeIn component props
export interface FadeInProps {
  children: React.ReactNode;
  direction?: FadeDirection;
  duration?: number;
  delay?: number;
  distance?: number;
  easing?: string;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  cascade?: boolean;
  cascadeDelay?: number;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
}

// Direction to transform mapping
const directionTransforms: Record<FadeDirection, string> = {
  up: "translateY(var(--fade-distance))",
  down: "translateY(calc(-1 * var(--fade-distance)))",
  left: "translateX(var(--fade-distance))",
  right: "translateX(calc(-1 * var(--fade-distance)))",
  "up-left": "translate(var(--fade-distance), var(--fade-distance))",
  "up-right":
    "translate(calc(-1 * var(--fade-distance)), var(--fade-distance))",
  "down-left":
    "translate(var(--fade-distance), calc(-1 * var(--fade-distance)))",
  "down-right":
    "translate(calc(-1 * var(--fade-distance)), calc(-1 * var(--fade-distance)))",
  none: "none",
};

/**
 * FadeIn Component
 */
export const FadeIn = forwardRef<HTMLDivElement, FadeInProps>(
  (
    {
      children,
      direction = "up",
      duration = 600,
      delay = 0,
      distance = 30,
      easing = "cubic-bezier(0.4, 0, 0.2, 1)",
      threshold = 0.1,
      rootMargin = "0px 0px -50px 0px",
      triggerOnce = true,
      cascade = false,
      cascadeDelay = 100,
      className,
      style,
      disabled = false,
      onAnimationStart,
      onAnimationComplete,
    },
    ref
  ) => {
    const elementRef = useRef<HTMLDivElement>(null);
    const animationRef = ref || elementRef;

    // Get animation context
    const {
      prefersReducedMotion,
      shouldAnimateElement,
      getOptimalDuration,
      registerAnimation,
    } = useAnimation();

    // Calculate effective values based on context
    const effectiveDuration = getOptimalDuration(duration);
    const shouldAnimate =
      !disabled && shouldAnimateElement(elementRef.current!);
    const finalDistance = prefersReducedMotion ? distance * 0.5 : distance;

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
        (animationRef as React.MutableRefObject<HTMLElement>).current =
          observerRef.current;
      }
    }, [animationRef, observerRef]);

    // Register animation with provider
    useEffect(() => {
      if (!shouldAnimate) return;

      const animationId = `fade-in-${Math.random().toString(36).substring(2, 11)}`;
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
        element.classList.add("fade-in-active");
        onAnimationStart?.();

        // Handle animation complete
        const handleAnimationEnd = () => {
          onAnimationComplete?.();
          element.removeEventListener("transitionend", handleAnimationEnd);
        };

        element.addEventListener("transitionend", handleAnimationEnd);
      } else if (!triggerOnce) {
        // Reset animation
        element.classList.remove("fade-in-active");
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
          const currentDelay = index * cascadeDelay;
          child.style.transitionDelay = `${delay + currentDelay}ms`;

          setTimeout(() => {
            child.classList.add("fade-in-cascade-active");
          }, currentDelay);
        });
      } else if (!triggerOnce) {
        children.forEach(child => {
          child.classList.remove("fade-in-cascade-active");
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

    // CSS custom properties
    const cssVars = {
      "--fade-duration": `${effectiveDuration}ms`,
      "--fade-delay": `${delay}ms`,
      "--fade-distance": `${finalDistance}px`,
      "--fade-easing": easing,
      "--fade-transform": directionTransforms[direction],
    };

    // Combined styles
    const combinedStyles = {
      ...cssVars,
      ...style,
    };

    // If animations are disabled, render children directly
    if (!shouldAnimate || prefersReducedMotion) {
      return (
        <div
          ref={animationRef}
          className={cn("fade-in-disabled", className)}
          style={style}
        >
          {children}
        </div>
      );
    }

    return (
      <div
        ref={observerRef as React.RefObject<HTMLDivElement>}
        className={cn(
          "fade-in-container",
          {
            "fade-in-cascade": cascade,
            "fade-in-reduced-motion": prefersReducedMotion,
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

FadeIn.displayName = "FadeIn";

/**
 * FadeInText Component - Specialized for text with character reveal
 */
export interface FadeInTextProps
  extends Omit<FadeInProps, "cascade" | "cascadeDelay"> {
  text: string;
  characterDelay?: number;
  wordDelay?: number;
  byWord?: boolean;
}

export const FadeInText = forwardRef<HTMLDivElement, FadeInTextProps>(
  (
    { text, characterDelay = 50, wordDelay = 100, byWord = false, ...props },
    ref
  ) => {
    const textElements = byWord
      ? text.split(" ").map((word, index) => (
          <span key={index} className="fade-in-word">
            {word}
            {index < text.split(" ").length - 1 && " "}
          </span>
        ))
      : text.split("").map((char, index) => (
          <span key={index} className="fade-in-char">
            {char === " " ? "\u00A0" : char}
          </span>
        ));

    return (
      <FadeIn
        ref={ref}
        cascade
        cascadeDelay={byWord ? wordDelay : characterDelay}
        {...props}
      >
        {textElements}
      </FadeIn>
    );
  }
);

FadeInText.displayName = "FadeInText";

/**
 * FadeInStagger Component - For staggered child animations
 */
export interface FadeInStaggerProps extends FadeInProps {
  staggerDelay?: number;
  staggerDirection?: "normal" | "reverse";
}

export const FadeInStagger = forwardRef<HTMLDivElement, FadeInStaggerProps>(
  (
    { children, staggerDelay = 100, staggerDirection = "normal", ...props },
    ref
  ) => {
    return (
      <FadeIn ref={ref} cascade cascadeDelay={staggerDelay} {...props}>
        <div className={`fade-in-stagger fade-in-stagger-${staggerDirection}`}>
          {children}
        </div>
      </FadeIn>
    );
  }
);

FadeInStagger.displayName = "FadeInStagger";

export default FadeIn;
