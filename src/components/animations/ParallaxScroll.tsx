/**
 * ParallaxScroll Animation Component
 * Provides smooth parallax scrolling effects with various configurations and performance optimizations
 */

import React, {
  forwardRef,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useAnimation } from "./AnimationProvider";
import { globalParallaxManager } from "@utils/animations/scrollAnimations";

import { cn } from "@utils/cn";

// Parallax directions
export type ParallaxDirection = "up" | "down" | "left" | "right";

// Parallax component props
export interface ParallaxScrollProps {
  children: React.ReactNode;
  speed?: number;
  direction?: ParallaxDirection;
  offset?: number;
  boundary?: number;
  axis?: "x" | "y" | "both";
  disabled?: boolean;
  threshold?: number;
  className?: string;
  style?: React.CSSProperties;
  onEnterView?: () => void;
  onExitView?: () => void;
}

// Mouse parallax props
export interface MouseParallaxProps extends ParallaxScrollProps {
  mouseSpeed?: number;
  mouseBoundary?: number;
  resetOnLeave?: boolean;
  smoothness?: number;
}

// Layer parallax props for multiple layers
export interface ParallaxLayer {
  speed: number;
  direction?: ParallaxDirection;
  className?: string;
  children: React.ReactNode;
}

export interface ParallaxLayersProps {
  layers: ParallaxLayer[];
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

/**
 * ParallaxScroll Component
 */
export const ParallaxScroll = forwardRef<HTMLDivElement, ParallaxScrollProps>(
  (
    {
      children,
      speed = 0.5,
      direction = "up",
      offset = 0,
      boundary = window?.innerHeight || 800,
      axis = "y",
      disabled = false,
      threshold = 0.1,
      className,
      style,
      onEnterView,
      onExitView,
    },
    ref
  ) => {
    const elementRef = useRef<HTMLDivElement>(null);
    const parallaxRef = (ref as React.RefObject<HTMLDivElement>) || elementRef;
    const [isInView, setIsInView] = useState(false);
    const cleanupRef = useRef<(() => void) | null>(null);

    // Get animation context
    const { prefersReducedMotion, shouldAnimateElement, config } =
      useAnimation();

    // Check if parallax should be enabled
    const shouldEnableParallax =
      !disabled &&
      !prefersReducedMotion &&
      config.enableParallax &&
      shouldAnimateElement(elementRef.current!);

    // Setup intersection observer for performance
    useEffect(() => {
      const element = parallaxRef?.current;
      if (!element || !shouldEnableParallax) return;

      const observer = new IntersectionObserver(
        entries => {
          const entry = entries[0];
          const wasInView = isInView;
          const nowInView = entry.isIntersecting;

          setIsInView(nowInView);

          if (!wasInView && nowInView) {
            onEnterView?.();
          } else if (wasInView && !nowInView) {
            onExitView?.();
          }
        },
        {
          threshold,
          rootMargin: `${boundary}px 0px ${boundary}px 0px`,
        }
      );

      observer.observe(element);

      return () => {
        observer.unobserve(element);
      };
    }, [
      shouldEnableParallax,
      threshold,
      boundary,
      isInView,
      onEnterView,
      onExitView,
    ]);

    // Setup parallax effect
    useEffect(() => {
      const element = parallaxRef?.current;
      if (!element || !shouldEnableParallax || !isInView) {
        return;
      }

      // Configure parallax
      const parallaxConfig = {
        speed,
        direction,
        offset,
        boundary,
        axis,
      };

      // Add to global parallax manager
      globalParallaxManager.add(element, parallaxConfig);

      // Store cleanup function
      cleanupRef.current = () => {
        globalParallaxManager.remove(element);
      };

      return cleanupRef.current;
    }, [
      shouldEnableParallax,
      isInView,
      speed,
      direction,
      offset,
      boundary,
      axis,
    ]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (cleanupRef.current) {
          cleanupRef.current();
        }
      };
    }, []);

    // CSS custom properties
    const cssVars = {
      "--parallax-speed": speed.toString(),
      "--parallax-direction": direction,
      "--parallax-offset": `${offset}px`,
    };

    // Combined styles
    const combinedStyles = {
      ...cssVars,
      ...style,
    };

    return (
      <div
        ref={parallaxRef}
        className={cn(
          "parallax-scroll-container",
          `parallax-${direction}`,
          `parallax-axis-${axis}`,
          {
            "parallax-in-view": isInView,
            "parallax-disabled": !shouldEnableParallax,
            "parallax-reduced-motion": prefersReducedMotion,
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

ParallaxScroll.displayName = "ParallaxScroll";

/**
 * MouseParallax Component - Follows mouse movement
 */
export const MouseParallax = forwardRef<HTMLDivElement, MouseParallaxProps>(
  (
    {
      children,
      mouseSpeed = 0.1,
      mouseBoundary = 50,
      resetOnLeave = true,
      smoothness = 0.1,
      ...parallaxProps
    },
    ref
  ) => {
    const elementRef = useRef<HTMLDivElement>(null);
    const mouseParallaxRef =
      (ref as React.RefObject<HTMLDivElement>) || elementRef;
    const animationRef = useRef<number>();

    const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 });
    // const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    // Get animation context
    const { prefersReducedMotion } = useAnimation();

    // Handle mouse move
    const handleMouseMove = useCallback(
      (event: MouseEvent) => {
        if (!mouseParallaxRef?.current || prefersReducedMotion) return;

        const rect = mouseParallaxRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = (event.clientX - centerX) * mouseSpeed;
        const deltaY = (event.clientY - centerY) * mouseSpeed;

        // Clamp to boundary
        const clampedX = Math.max(
          -mouseBoundary,
          Math.min(mouseBoundary, deltaX)
        );
        const clampedY = Math.max(
          -mouseBoundary,
          Math.min(mouseBoundary, deltaY)
        );

        setTargetPosition({ x: clampedX, y: clampedY });
      },
      [mouseSpeed, mouseBoundary, prefersReducedMotion]
    );

    // Handle mouse leave
    const handleMouseLeave = useCallback(() => {
      if (resetOnLeave) {
        setTargetPosition({ x: 0, y: 0 });
      }
    }, [resetOnLeave]);

    // Smooth animation loop
    useEffect(() => {
      const animate = () => {
        // Apply transform directly without state update
        if (mouseParallaxRef?.current) {
          const currentX =
            parseFloat(
              mouseParallaxRef.current.style.transform.replace(/[^\d.-]/g, "")
            ) || 0;
          const currentY =
            parseFloat(
              mouseParallaxRef.current.style.transform.replace(/[^\d.-]/g, "")
            ) || 0;
          const newX = currentX + (targetPosition.x - currentX) * smoothness;
          const newY = currentY + (targetPosition.y - currentY) * smoothness;
          mouseParallaxRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
        }

        animationRef.current = requestAnimationFrame(animate);
      };

      if (!prefersReducedMotion) {
        animationRef.current = requestAnimationFrame(animate);
      }

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [targetPosition, smoothness, prefersReducedMotion]);

    // Setup event listeners
    useEffect(() => {
      const element = mouseParallaxRef?.current;
      if (!element || prefersReducedMotion) return;

      element.addEventListener("mousemove", handleMouseMove);
      element.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        element.removeEventListener("mousemove", handleMouseMove);
        element.removeEventListener("mouseleave", handleMouseLeave);
      };
    }, [handleMouseMove, handleMouseLeave, prefersReducedMotion]);

    return (
      <ParallaxScroll
        ref={mouseParallaxRef}
        className={cn("mouse-parallax-container")}
        {...parallaxProps}
      >
        {children}
      </ParallaxScroll>
    );
  }
);

MouseParallax.displayName = "MouseParallax";

/**
 * ParallaxLayers Component - Multiple layers with different speeds
 */
export const ParallaxLayers = forwardRef<HTMLDivElement, ParallaxLayersProps>(
  ({ layers, className, style, disabled = false }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("parallax-layers-container", className)}
        style={style}
      >
        {layers.map((layer, index) => (
          <ParallaxScroll
            key={index}
            speed={layer.speed}
            direction={layer.direction}
            disabled={disabled}
            className={cn("parallax-layer", layer.className)}
          >
            {layer.children}
          </ParallaxScroll>
        ))}
      </div>
    );
  }
);

ParallaxLayers.displayName = "ParallaxLayers";

/**
 * ParallaxSection Component - Full section with background parallax
 */
export interface ParallaxSectionProps {
  children: React.ReactNode;
  backgroundImage?: string;
  backgroundSpeed?: number;
  contentSpeed?: number;
  height?: string;
  className?: string;
  style?: React.CSSProperties;
  overlay?: boolean;
  overlayOpacity?: number;
}

export const ParallaxSection = forwardRef<HTMLDivElement, ParallaxSectionProps>(
  (
    {
      children,
      backgroundImage,
      backgroundSpeed = 0.5,
      contentSpeed = 0,
      height = "100vh",
      className,
      style,
      overlay = false,
      overlayOpacity = 0.5,
    },
    ref
  ) => {
    const sectionStyle = {
      height,
      position: "relative" as const,
      overflow: "hidden" as const,
      ...style,
    };

    const backgroundStyle = {
      position: "absolute" as const,
      top: 0,
      left: 0,
      width: "100%",
      height: "120%", // Larger to accommodate parallax
      backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      zIndex: -2,
    };

    const overlayStyle = {
      position: "absolute" as const,
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
      zIndex: -1,
    };

    const contentStyle = {
      position: "relative" as const,
      zIndex: 1,
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    };

    return (
      <div
        ref={ref}
        className={cn("parallax-section", className)}
        style={sectionStyle}
      >
        {backgroundImage && (
          <ParallaxScroll
            speed={backgroundSpeed}
            direction="up"
            className="parallax-section-background"
            style={backgroundStyle}
          >
            <div />
          </ParallaxScroll>
        )}

        {overlay && <div style={overlayStyle} />}

        <ParallaxScroll
          speed={contentSpeed}
          direction="up"
          className="parallax-section-content"
          style={contentStyle}
        >
          {children}
        </ParallaxScroll>
      </div>
    );
  }
);

ParallaxSection.displayName = "ParallaxSection";

/**
 * ParallaxImage Component - Image with parallax effect
 */
export interface ParallaxImageProps {
  src: string;
  alt: string;
  speed?: number;
  direction?: ParallaxDirection;
  className?: string;
  style?: React.CSSProperties;
  loading?: "lazy" | "eager";
}

export const ParallaxImage = forwardRef<HTMLDivElement, ParallaxImageProps>(
  (
    {
      src,
      alt,
      speed = 0.3,
      direction = "up",
      className,
      style,
      loading = "lazy",
    },
    ref
  ) => {
    return (
      <ParallaxScroll
        ref={ref}
        speed={speed}
        direction={direction}
        className={cn("parallax-image-container", className)}
        style={{
          overflow: "hidden",
          ...style,
        }}
      >
        <img
          src={src}
          alt={alt}
          loading={loading}
          className="parallax-image"
          style={{
            width: "100%",
            height: "120%", // Larger to accommodate parallax
            objectFit: "cover",
          }}
        />
      </ParallaxScroll>
    );
  }
);

ParallaxImage.displayName = "ParallaxImage";

export default ParallaxScroll;
