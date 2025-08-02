/**
 * Interactive COBE Globe Component
 * Displays a beautiful rotating 3D globe with markers for geographic locations
 */

import React, { useEffect, useRef, useState } from "react";
import createGlobe from "cobe";
import { cn } from "@utils/cn";

interface GlobeProps {
  className?: string;
  size?: number;
  theme?: "light" | "dark";
  markers?: Array<{
    location: [number, number]; // [latitude, longitude]
    size: number;
    color?: [number, number, number];
  }>;
  autoRotate?: boolean;
  rotationSpeed?: number;
}

const Globe: React.FC<GlobeProps> = ({
  className,
  size = 600,
  theme = "light",
  markers = [
    // Default markers for interesting cybersecurity locations
    { location: [37.7749, -122.4194], size: 0.1 }, // San Francisco (Silicon Valley)
    { location: [40.7128, -74.006], size: 0.08 }, // New York (Financial sector)
    { location: [51.5074, -0.1278], size: 0.06 }, // London (Financial center)
    { location: [35.6762, 139.6503], size: 0.05 }, // Tokyo (Tech hub)
    { location: [52.52, 13.405], size: 0.04 }, // Berlin (Cybersecurity research)
    { location: [55.7558, 37.6176], size: 0.03 }, // Moscow (Cybersecurity)
    { location: [39.9042, 116.4074], size: 0.04 }, // Beijing (Tech center)
    { location: [19.076, 72.8777], size: 0.03 }, // Mumbai (IT hub)
    { location: [1.3521, 103.8198], size: 0.03 }, // Singapore (Fintech)
    { location: [-33.8688, 151.2093], size: 0.03 }, // Sydney (Cybersecurity)
  ],
  autoRotate = true,
  rotationSpeed = 0.005,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const phiRef = useRef(0);

  // Theme-based colors
  const colors = {
    light: {
      baseColor: [0.3, 0.3, 0.3] as [number, number, number],
      markerColor: [0.1, 0.5, 1] as [number, number, number],
      glowColor: [1, 1, 1] as [number, number, number],
      opacity: 0.8,
    },
    dark: {
      baseColor: [0.9, 0.9, 0.9] as [number, number, number],
      markerColor: [0.3, 0.7, 1] as [number, number, number],
      glowColor: [0.2, 0.2, 0.3] as [number, number, number],
      opacity: 0.9,
    },
  };

  const currentColors = colors[theme];

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    // Initialize the globe
    globeRef.current = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: size * 2,
      height: size * 2,
      phi: 0,
      theta: 0.3,
      dark: theme === "dark" ? 1 : 0,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: currentColors.baseColor,
      markerColor: currentColors.markerColor,
      glowColor: currentColors.glowColor,
      markers: markers.map(marker => ({
        location: marker.location,
        size: marker.size,
        color: marker.color || currentColors.markerColor,
      })),
      onRender: state => {
        if (autoRotate) {
          phiRef.current += rotationSpeed;
          state.phi = phiRef.current;
        }
        // Slight theta oscillation for dynamic effect
        state.theta = 0.3 + Math.sin(phiRef.current * 0.5) * 0.1;
      },
    });

    setIsLoaded(true);

    // Cleanup function
    return () => {
      if (globeRef.current) {
        globeRef.current.destroy();
      }
    };
  }, [size, theme, autoRotate, rotationSpeed]);

  // Note: cobe globe doesn't have an updateConfig method
  // Theme changes will require re-initialization of the globe
  useEffect(() => {
    if (globeRef.current) {
      // Re-initialize globe when theme changes
      const canvas = canvasRef.current;
      if (canvas) {
        globeRef.current.destroy();

        globeRef.current = createGlobe(canvas, {
          devicePixelRatio: 2,
          width: size * 2,
          height: size * 2,
          phi: phiRef.current,
          theta: 0.3,
          dark: theme === "dark" ? 1 : 0,
          diffuse: 1.2,
          mapSamples: 16000,
          mapBrightness: 6,
          baseColor: currentColors.baseColor,
          markerColor: currentColors.markerColor,
          glowColor: currentColors.glowColor,
          markers: markers.map(marker => ({
            location: marker.location,
            size: marker.size,
            color: marker.color || currentColors.markerColor,
          })),
          onRender: state => {
            if (autoRotate) {
              phiRef.current += rotationSpeed;
              state.phi = phiRef.current;
            }
            // Slight theta oscillation for dynamic effect
            state.theta = 0.3 + Math.sin(phiRef.current * 0.5) * 0.1;
          },
        });
      }
    }
  }, [theme]);

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!globeRef.current || !autoRotate) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Calculate mouse position relative to canvas center
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const deltaX = (x - centerX) / centerX;
    const deltaY = (y - centerY) / centerY;

    // Slow down rotation based on mouse proximity to center
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const rotationMultiplier = Math.max(0.1, 1 - distance * 0.5);

    // Temporarily modify rotation speed
    phiRef.current += rotationSpeed * rotationMultiplier;
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        "transition-all duration-500 ease-out",
        isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95",
        className
      )}
    >
      {/* Loading placeholder */}
      {!isLoaded && (
        <div
          className="absolute inset-0 rounded-full animate-pulse bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm"
          style={{ width: size, height: size }}
        />
      )}

      {/* Globe canvas */}
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        style={{
          width: size,
          height: size,
          maxWidth: "100%",
          aspectRatio: "1",
        }}
        className={cn(
          "cursor-pointer transition-transform duration-300",
          "hover:scale-105 focus:scale-105 focus:outline-none",
          "rounded-full shadow-2xl",
          theme === "dark"
            ? "shadow-primary/20 hover:shadow-primary/30"
            : "shadow-primary/30 hover:shadow-primary/40"
        )}
        aria-label="Interactive 3D globe showing cybersecurity locations worldwide"
        tabIndex={0}
        role="img"
      />

      {/* Glow effect overlay */}
      <div
        className={cn(
          "absolute inset-0 rounded-full pointer-events-none",
          "bg-gradient-to-br from-primary/10 via-transparent to-accent/10",
          "animate-pulse",
          theme === "dark" ? "opacity-60" : "opacity-40"
        )}
        style={{ width: size, height: size }}
      />

      {/* Interactive hint */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground opacity-70">
        <div className="bg-background/80 backdrop-blur-sm rounded-full px-3 py-1 border border-border/50">
          Hover to interact
        </div>
      </div>
    </div>
  );
};

export default Globe;
