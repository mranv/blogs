/**
 * SlideIn Animation Component
 * Provides smooth slide-in animations from various directions with spring physics
 */

import React, { forwardRef, useEffect, useRef } from "react";
import { useIntersectionObserver } from "@utils/animations/intersectionObserver";
import { useAnimation } from "./AnimationProvider";
import { cn } from "@utils/cn";

// SlideIn animation directions
export type SlideDirection =
  | "up"
  | "down"
  | "left"
  | "right"
  | "up-left"
  | "up-right"
  | "down-left"
  | "down-right";

// SlideIn animation variants
export type SlideVariant = "slide" | "elastic" | "spring" | "bounce" | "smooth";

// SlideIn component props
export interface SlideInProps {
  children: React.ReactNode;
  direction?: SlideDirection;
  variant?: SlideVariant;
  duration?: number;
  delay?: number;
  distance?: number;
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
const directionTransforms: Record<
  SlideDirection,
  (distance: number) => string
> = {
  up: d => `translateY(${d}px)`,
  down: d => `translateY(-${d}px)`,
  left: d => `translateX(${d}px)`,
  right: d => `translateX(-${d}px)`,
  "up-left": d => `translate(${d}px, ${d}px)`,
  "up-right": d => `translate(-${d}px, ${d}px)`,
  "down-left": d => `translate(${d}px, -${d}px)`,
  "down-right": d => `translate(-${d}px, -${d}px)`,
};

// Animation variants with their easing curves
const variantEasing: Record<SlideVariant, string> = {
  slide: "cubic-bezier(0.4, 0, 0.2, 1)",
  elastic: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  spring: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  bounce: "cubic-bezier(0.68, -0.6, 0.32, 1.6)",
  smooth: "cubic-bezier(0.25, 0.1, 0.25, 1)",
};

/**
 * SlideIn Component
 */
export const SlideIn = forwardRef<HTMLDivElement, SlideInProps>(
  (
    {
      children,
      direction = "up",
      variant = "slide",
      duration = 600,
      delay = 0,
      distance = 50,
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
    const finalDistance = prefersReducedMotion ? distance * 0.3 : distance;
    const finalEasing = prefersReducedMotion ? "ease" : variantEasing[variant];

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

      const animationId = `slide-in-${Math.random().toString(36).substring(2, 11)}`;
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
        element.classList.add("slide-in-active");
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
        element.classList.remove("slide-in-active");
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
            child.classList.add("slide-in-cascade-active");
          }, index * cascadeDelay);
        });
      } else if (!triggerOnce) {
        children.forEach(child => {
          child.classList.remove("slide-in-cascade-active");
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
      "--slide-duration": `${effectiveDuration}ms`,
      "--slide-delay": `${delay}ms`,
      "--slide-distance": `${finalDistance}px`,
      "--slide-easing": finalEasing,
      "--slide-transform": directionTransforms[direction](finalDistance),
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
          className={cn("slide-in-disabled", className)}
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
          "slide-in-container",
          `slide-in-${direction}`,
          `slide-in-${variant}`,
          {
            "slide-in-cascade": cascade,
            "slide-in-reduced-motion": prefersReducedMotion,
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

SlideIn.displayName = "SlideIn";

/**
 * SlideInList Component - For list item animations
 */
export interface SlideInListProps
  extends Omit<SlideInProps, "cascade" | "cascadeDelay"> {
  items: React.ReactNode[];
  itemDelay?: number;
  reverse?: boolean;
}

export const SlideInList = forwardRef<HTMLDivElement, SlideInListProps>(
  ({ items, itemDelay = 100, reverse = false, ...props }, ref) => {
    const processedItems = reverse ? [...items].reverse() : items;

    return (
      <SlideIn ref={ref} cascade cascadeDelay={itemDelay} {...props}>
        {processedItems.map((item, index) => (
          <div key={index} className="slide-in-list-item">
            {item}
          </div>
        ))}
      </SlideIn>
    );
  }
);

SlideInList.displayName = "SlideInList";

/**
 * SlideInCards Component - For card layout animations
 */
export interface SlideInCardsProps extends Omit<SlideInProps, "direction"> {
  cards: React.ReactNode[];
  columns?: number;
  cardDelay?: number;
  slidePattern?: "sequential" | "wave" | "random";
}

export const SlideInCards = forwardRef<HTMLDivElement, SlideInCardsProps>(
  (
    {
      cards,
      columns = 3,
      cardDelay = 150,
      slidePattern = "sequential",
      ...props
    },
    ref
  ) => {
    // Calculate slide directions based on pattern
    const getSlideDirection = (index: number): SlideDirection => {
      switch (slidePattern) {
        case "wave":
          const row = Math.floor(index / columns);
          return row % 2 === 0 ? "left" : "right";
        case "random":
          const directions: SlideDirection[] = ["up", "down", "left", "right"];
          return directions[index % directions.length];
        case "sequential":
        default:
          return "up";
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "slide-in-cards-container",
          `slide-in-cards-columns-${columns}`,
          `slide-in-cards-${slidePattern}`
        )}
      >
        {cards.map((card, index) => (
          <SlideIn
            key={index}
            direction={getSlideDirection(index)}
            delay={index * cardDelay}
            {...props}
          >
            <div className="slide-in-card">{card}</div>
          </SlideIn>
        ))}
      </div>
    );
  }
);

SlideInCards.displayName = "SlideInCards";

/**
 * SlideInText Component - For text with word-by-word animation
 */
export interface SlideInTextProps
  extends Omit<SlideInProps, "cascade" | "cascadeDelay"> {
  text: string;
  wordDelay?: number;
  lineDelay?: number;
  preserveSpaces?: boolean;
}

export const SlideInText = forwardRef<HTMLDivElement, SlideInTextProps>(
  (
    { text, wordDelay = 100, lineDelay = 200, preserveSpaces = true, ...props },
    ref
  ) => {
    // Split text into lines and words
    const lines = text.split("\n");

    return (
      <div ref={ref} className="slide-in-text-container">
        {lines.map((line, lineIndex) => (
          <SlideIn
            key={lineIndex}
            delay={lineIndex * lineDelay}
            cascade
            cascadeDelay={wordDelay}
            {...props}
          >
            <div className="slide-in-text-line">
              {line.split(" ").map((word, wordIndex) => (
                <span key={wordIndex} className="slide-in-text-word">
                  {word}
                  {preserveSpaces &&
                    wordIndex < line.split(" ").length - 1 &&
                    " "}
                </span>
              ))}
            </div>
          </SlideIn>
        ))}
      </div>
    );
  }
);

SlideInText.displayName = "SlideInText";

export default SlideIn;
