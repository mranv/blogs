/**
 * Animation Wrapper Component
 * Provides AnimationProvider context for the entire application
 */

import React from "react";
import { AnimationProvider, type AnimationConfig } from "./animations";

interface AnimationWrapperProps {
  children: React.ReactNode;
  config?: Partial<AnimationConfig>;
}

export const AnimationWrapper: React.FC<AnimationWrapperProps> = ({
  children,
  config = {},
}) => {
  // Default configuration optimized for blog/content site
  const defaultConfig: Partial<AnimationConfig> = {
    respectSystemPreference: true,
    enableParallax: true,
    enableIntersectionAnimations: true,
    enableScrollAnimations: true,
    performanceMode: "balanced",
    globalStaggerDelay: 100,
    debugMode: false,
    ...config,
  };

  return (
    <AnimationProvider config={defaultConfig}>{children}</AnimationProvider>
  );
};

export default AnimationWrapper;
