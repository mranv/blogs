/**
 * StaggerChildren Animation Component
 * Provides staggered animations for child elements with various patterns and timing
 */

import React, {
  forwardRef,
  useEffect,
  useRef,
  Children,
  cloneElement,
  isValidElement,
} from "react";
import { useIntersectionObserver } from "@utils/animations/intersectionObserver";
import { useAnimation } from "./AnimationProvider";
import { cn } from "@utils/cn";

// Stagger patterns
export type StaggerPattern =
  | "sequential"
  | "reverse"
  | "center-out"
  | "edges-in"
  | "random"
  | "wave"
  | "spiral"
  | "grid";

// Stagger animation types
export type StaggerAnimation =
  | "fade"
  | "slide-up"
  | "slide-down"
  | "slide-left"
  | "slide-right"
  | "scale"
  | "rotate"
  | "flip";

// StaggerChildren component props
export interface StaggerChildrenProps {
  children: React.ReactNode;
  pattern?: StaggerPattern;
  animation?: StaggerAnimation;
  duration?: number;
  delay?: number;
  staggerDelay?: number;
  distance?: number;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  gridColumns?: number;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  onAnimationStart?: (index: number) => void;
  onAnimationComplete?: (index: number) => void;
  onAllAnimationsComplete?: () => void;
}

// Animation configurations
const animationConfigs: Record<
  StaggerAnimation,
  {
    transform: string;
    properties: string[];
  }
> = {
  fade: {
    transform: "none",
    properties: ["opacity"],
  },
  "slide-up": {
    transform: "translateY(var(--stagger-distance))",
    properties: ["opacity", "transform"],
  },
  "slide-down": {
    transform: "translateY(calc(-1 * var(--stagger-distance)))",
    properties: ["opacity", "transform"],
  },
  "slide-left": {
    transform: "translateX(var(--stagger-distance))",
    properties: ["opacity", "transform"],
  },
  "slide-right": {
    transform: "translateX(calc(-1 * var(--stagger-distance)))",
    properties: ["opacity", "transform"],
  },
  scale: {
    transform: "scale(0.8)",
    properties: ["opacity", "transform"],
  },
  rotate: {
    transform: "rotate(-10deg) scale(0.9)",
    properties: ["opacity", "transform"],
  },
  flip: {
    transform: "rotateY(90deg)",
    properties: ["opacity", "transform"],
  },
};

/**
 * StaggerChildren Component
 */
export const StaggerChildren = forwardRef<HTMLDivElement, StaggerChildrenProps>(
  (
    {
      children,
      pattern = "sequential",
      animation = "fade",
      duration = 600,
      delay = 0,
      staggerDelay = 100,
      distance = 30,
      threshold = 0.1,
      rootMargin = "0px 0px -50px 0px",
      triggerOnce = true,
      gridColumns = 3,
      className,
      style,
      disabled = false,
      onAnimationStart,
      onAnimationComplete,
      onAllAnimationsComplete,
    },
    ref
  ) => {
    const elementRef = useRef<HTMLDivElement>(null);
    const animationRef = ref || elementRef;
    const animationCountRef = useRef(0);
    const completedAnimationsRef = useRef(0);

    // Get animation context
    const {
      prefersReducedMotion,
      shouldAnimateElement,
      getOptimalDuration,
      registerAnimation,
    } = useAnimation();

    // Calculate effective values based on context
    const effectiveDuration = getOptimalDuration(duration);
    const effectiveStaggerDelay = prefersReducedMotion
      ? staggerDelay * 0.5
      : staggerDelay;
    const shouldAnimate =
      !disabled && shouldAnimateElement(elementRef.current!);
    const finalDistance = prefersReducedMotion ? distance * 0.5 : distance;

    // Convert children to array
    const childrenArray = Children.toArray(children);

    // Setup intersection observer
    const [observerRef, { isIntersecting, hasIntersected }] =
      useIntersectionObserver({
        threshold,
        rootMargin,
        triggerOnce,
        delay,
        disabled: disabled || !shouldAnimate,
      });

    // Calculate stagger delays based on pattern
    const calculateStaggerDelays = (count: number): number[] => {
      const delays: number[] = [];

      switch (pattern) {
        case "sequential":
          for (let i = 0; i < count; i++) {
            delays.push(i * effectiveStaggerDelay);
          }
          break;

        case "reverse":
          for (let i = 0; i < count; i++) {
            delays.push((count - 1 - i) * effectiveStaggerDelay);
          }
          break;

        case "center-out":
          const center = Math.floor(count / 2);
          for (let i = 0; i < count; i++) {
            const distance = Math.abs(i - center);
            delays.push(distance * effectiveStaggerDelay);
          }
          break;

        case "edges-in":
          for (let i = 0; i < count; i++) {
            const center = Math.floor(count / 2);
            const distance = center - Math.abs(i - center);
            delays.push(distance * effectiveStaggerDelay);
          }
          break;

        case "random":
          const shuffled = Array.from({ length: count }, (_, i) => i).sort(
            () => Math.random() - 0.5
          );
          for (let i = 0; i < count; i++) {
            delays.push(shuffled[i] * effectiveStaggerDelay);
          }
          break;

        case "wave":
          for (let i = 0; i < count; i++) {
            delays.push(
              Math.sin(i * 0.5) * effectiveStaggerDelay +
                i * (effectiveStaggerDelay * 0.2)
            );
          }
          break;

        case "spiral":
          const gridSize = Math.ceil(Math.sqrt(count));
          for (let i = 0; i < count; i++) {
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            const spiralOrder = Math.min(
              Math.min(row, gridSize - 1 - row),
              Math.min(col, gridSize - 1 - col)
            );
            delays.push(spiralOrder * effectiveStaggerDelay);
          }
          break;

        case "grid":
          for (let i = 0; i < count; i++) {
            const row = Math.floor(i / gridColumns);
            const col = i % gridColumns;
            delays.push((row + col) * effectiveStaggerDelay);
          }
          break;

        default:
          for (let i = 0; i < count; i++) {
            delays.push(i * effectiveStaggerDelay);
          }
      }

      return delays;
    };

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

      const animationId = `stagger-children-${Math.random().toString(36).substring(2, 11)}`;
      const cleanup = registerAnimation(animationId);

      return cleanup;
    }, [shouldAnimate, registerAnimation]);

    // Handle animation state changes
    useEffect(() => {
      const element = observerRef.current;
      if (!element || !shouldAnimate) return;

      const shouldTrigger = triggerOnce ? hasIntersected : isIntersecting;
      const children = Array.from(element.children) as HTMLElement[];
      const delays = calculateStaggerDelays(children.length);

      if (shouldTrigger) {
        animationCountRef.current = children.length;
        completedAnimationsRef.current = 0;

        children.forEach((child, index) => {
          const animationDelay = delay + delays[index];

          // Set up transition properties
          child.style.transitionDelay = `${animationDelay}ms`;

          // Add animation class after delay
          setTimeout(() => {
            child.classList.add("stagger-child-active");
            onAnimationStart?.(index);

            // Listen for animation completion
            const handleAnimationEnd = (event: TransitionEvent) => {
              if (event.target === child) {
                completedAnimationsRef.current++;
                onAnimationComplete?.(index);

                if (
                  completedAnimationsRef.current === animationCountRef.current
                ) {
                  onAllAnimationsComplete?.();
                }

                child.removeEventListener("transitionend", handleAnimationEnd);
              }
            };

            child.addEventListener("transitionend", handleAnimationEnd);
          }, delays[index]);
        });

        // Add active class to container
        element.classList.add("stagger-children-active");
      } else if (!triggerOnce) {
        // Reset animations
        children.forEach(child => {
          child.classList.remove("stagger-child-active");
          child.style.transitionDelay = "";
        });
        element.classList.remove("stagger-children-active");
      }
    }, [
      isIntersecting,
      hasIntersected,
      triggerOnce,
      shouldAnimate,
      delay,
      effectiveStaggerDelay,
      pattern,
      onAnimationStart,
      onAnimationComplete,
      onAllAnimationsComplete,
    ]);

    // CSS custom properties
    const animationConfig = animationConfigs[animation];
    const cssVars = {
      "--stagger-duration": `${effectiveDuration}ms`,
      "--stagger-delay": `${delay}ms`,
      "--stagger-distance": `${finalDistance}px`,
      "--stagger-easing": prefersReducedMotion
        ? "ease"
        : "cubic-bezier(0.4, 0, 0.2, 1)",
      "--stagger-transform": animationConfig.transform,
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
          className={cn("stagger-children-disabled", className)}
          style={style}
        >
          {children}
        </div>
      );
    }

    // Enhanced children with stagger classes
    const enhancedChildren = childrenArray.map((child, index) => {
      if (isValidElement(child)) {
        return cloneElement(child, {
          key: child.key || index,
          className: cn(
            child.props.className,
            "stagger-child",
            `stagger-child-${animation}`,
            `stagger-child-index-${index}`
          ),
        } as any);
      }
      return child;
    });

    return (
      <div
        ref={observerRef as React.RefObject<HTMLDivElement>}
        className={cn(
          "stagger-children-container",
          `stagger-children-${pattern}`,
          `stagger-children-${animation}`,
          {
            "stagger-children-reduced-motion": prefersReducedMotion,
          },
          className
        )}
        style={combinedStyles}
      >
        {enhancedChildren}
      </div>
    );
  }
);

StaggerChildren.displayName = "StaggerChildren";

/**
 * StaggerList Component - Specialized for list items
 */
export interface StaggerListProps
  extends Omit<StaggerChildrenProps, "children"> {
  items: React.ReactNode[];
  itemClassName?: string;
  ListComponent?: React.ElementType;
  listProps?: Record<string, any>;
}

export const StaggerList = forwardRef<HTMLDivElement, StaggerListProps>(
  (
    { items, itemClassName, ListComponent = "ul", listProps = {}, ...props },
    ref
  ) => {
    return (
      <StaggerChildren ref={ref} {...props}>
        <ListComponent {...listProps}>
          {items.map((item, index) => (
            <li key={index} className={cn("stagger-list-item", itemClassName)}>
              {item}
            </li>
          ))}
        </ListComponent>
      </StaggerChildren>
    );
  }
);

StaggerList.displayName = "StaggerList";

/**
 * StaggerCards Component - For card layouts
 */
export interface StaggerCardsProps
  extends Omit<StaggerChildrenProps, "children"> {
  cards: React.ReactNode[];
  columns?: number;
  gap?: string;
  cardClassName?: string;
}

export const StaggerCards = forwardRef<HTMLDivElement, StaggerCardsProps>(
  (
    { cards, columns = 3, gap = "1rem", cardClassName, gridColumns, ...props },
    ref
  ) => {
    const containerStyle = {
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap,
    };

    return (
      <StaggerChildren
        ref={ref}
        pattern="grid"
        gridColumns={gridColumns || columns}
        style={containerStyle}
        {...props}
      >
        {cards.map((card, index) => (
          <div key={index} className={cn("stagger-card", cardClassName)}>
            {card}
          </div>
        ))}
      </StaggerChildren>
    );
  }
);

StaggerCards.displayName = "StaggerCards";

/**
 * StaggerText Component - For text with word/character staggering
 */
export interface StaggerTextProps
  extends Omit<StaggerChildrenProps, "children"> {
  text: string;
  splitBy?: "words" | "characters" | "lines";
  preserveSpaces?: boolean;
  WordComponent?: React.ElementType;
  CharComponent?: React.ElementType;
}

export const StaggerText = forwardRef<HTMLDivElement, StaggerTextProps>(
  (
    {
      text,
      splitBy = "words",
      preserveSpaces = true,
      WordComponent = "span",
      CharComponent = "span",
      ...props
    },
    ref
  ) => {
    let textElements: React.ReactNode[] = [];

    switch (splitBy) {
      case "characters":
        textElements = text.split("").map((char, index) => (
          <CharComponent key={index} className="stagger-char">
            {char === " " && preserveSpaces ? "\u00A0" : char}
          </CharComponent>
        ));
        break;

      case "words":
        textElements = text.split(" ").map((word, index) => (
          <WordComponent key={index} className="stagger-word">
            {word}
            {index < text.split(" ").length - 1 && preserveSpaces && " "}
          </WordComponent>
        ));
        break;

      case "lines":
        textElements = text.split("\n").map((line, index) => (
          <div key={index} className="stagger-line">
            {line}
          </div>
        ));
        break;
    }

    return (
      <StaggerChildren ref={ref} {...props}>
        {textElements}
      </StaggerChildren>
    );
  }
);

StaggerText.displayName = "StaggerText";

export default StaggerChildren;
