/**
 * Animation Components Index
 * Centralized exports for all animation components and utilities
 */

import React from 'react';

// Core Animation Components
export {
  AnimationProvider,
  useAnimation,
  useAnimationState,
  useAnimationPerformance,
  withAnimation,
  type AnimationConfig,
  type AnimationContextType,
  type AnimationContextState,
  type AnimationContextMethods,
} from './AnimationProvider';

export {
  FadeIn,
  FadeInText,
  FadeInStagger,
  type FadeInProps,
  type FadeInTextProps,
  type FadeInStaggerProps,
  type FadeDirection,
} from './FadeIn';

export {
  SlideIn,
  SlideInList,
  SlideInCards,
  SlideInText,
  type SlideInProps,
  type SlideInListProps,
  type SlideInCardsProps,
  type SlideInTextProps,
  type SlideDirection,
  type SlideVariant,
} from './SlideIn';

export {
  ScaleIn,
  ScaleInGrid,
  ScaleInButton,
  type ScaleInProps,
  type ScaleInGridProps,
  type ScaleInButtonProps,
  type ScaleVariant,
  type ScaleOrigin,
} from './ScaleIn';

export {
  StaggerChildren,
  StaggerList,
  StaggerCards,
  StaggerText,
  type StaggerChildrenProps,
  type StaggerListProps,
  type StaggerCardsProps,
  type StaggerTextProps,
  type StaggerPattern,
  type StaggerAnimation,
} from './StaggerChildren';

export {
  ParallaxScroll,
  MouseParallax,
  ParallaxLayers,
  ParallaxSection,
  ParallaxImage,
  type ParallaxScrollProps,
  type MouseParallaxProps,
  type ParallaxLayersProps,
  type ParallaxSectionProps,
  type ParallaxImageProps,
  type ParallaxDirection,
  type ParallaxLayer,
} from './ParallaxScroll';

export {
  PageTransition,
  PageLoader,
  RouteTransition,
  ViewTransitionWrapper,
  TransitionGroup,
  triggerPageTransition,
  usePageTransition,
  type PageTransitionProps,
  type PageLoaderProps,
  type RouteTransitionProps,
  type ViewTransitionWrapperProps,
  type TransitionGroupProps,
  type PageTransitionType,
  type TransitionDirection,
} from './PageTransition';

// Animation Utilities
export {
  // Core utilities
  easingCurves,
  durations,
  staggerDelays,
  animationPresets,
  animationUtils,
  performanceUtils,
  
  // Types
  type EasingCurve,
  type Duration,
  type AnimationPreset,
} from '@utils/animations/animationUtils';

export {
  // Intersection Observer utilities
  useIntersectionObserver,
  useScrollAnimation,
  useStaggeredAnimation,
  IntersectionManager,
  globalIntersectionManager,
  intersectionUtils,
  
  // Types
  type IntersectionConfig,
  type IntersectionState,
} from '@utils/animations/intersectionObserver';

export {
  // Scroll Animation utilities
  smoothScroll,
  ParallaxManager,
  ScrollProgressTracker,
  globalParallaxManager,
  globalScrollTracker,
  scrollAnimations,
  initScrollAnimations,
  
  // Types
  type ScrollAnimationConfig,
  type ParallaxConfig,
  type ProgressCallback,
} from '@utils/animations/scrollAnimations';

export {
  // Reduced Motion utilities
  ReducedMotionManager,
  globalReducedMotionManager,
  reducedMotionUtils,
  useReducedMotion,
  
  // Types
  type ReducedMotionConfig,
} from '@utils/animations/reducedMotion';

// Re-import components for convenience bundles
import { AnimationProvider } from './AnimationProvider';
import { FadeIn, FadeInText } from './FadeIn';
import { SlideIn, SlideInList, SlideInCards, SlideInText } from './SlideIn';
import { ScaleIn, ScaleInGrid, ScaleInButton } from './ScaleIn';
import { StaggerChildren, StaggerList, StaggerCards, StaggerText } from './StaggerChildren';
import { ParallaxScroll, MouseParallax, ParallaxLayers } from './ParallaxScroll';
import { PageTransition, PageLoader, RouteTransition, ViewTransitionWrapper, TransitionGroup } from './PageTransition';

// Re-import utilities for default export
import { 
  animationUtils, 
  performanceUtils, 
  animationPresets 
} from '@utils/animations/animationUtils';
import { 
  intersectionUtils, 
  globalIntersectionManager 
} from '@utils/animations/intersectionObserver';
import { 
  scrollAnimations, 
  globalParallaxManager, 
  globalScrollTracker 
} from '@utils/animations/scrollAnimations';
import { 
  reducedMotionUtils, 
  globalReducedMotionManager 
} from '@utils/animations/reducedMotion';

// Convenience component bundles
export const CoreAnimations = {
  AnimationProvider,
  FadeIn,
  SlideIn,
  ScaleIn,
};

export const AdvancedAnimations = {
  StaggerChildren,
  ParallaxScroll,
  PageTransition,
};

export const TextAnimations = {
  FadeInText,
  SlideInText,
  StaggerText,
};

export const LayoutAnimations = {
  SlideInList,
  SlideInCards,
  ScaleInGrid,
  StaggerList,
  StaggerCards,
  ParallaxLayers,
};

export const InteractionAnimations = {
  ScaleInButton,
  MouseParallax,
  RouteTransition,
  ViewTransitionWrapper,
};

export const LoadingAnimations = {
  PageLoader,
  TransitionGroup,
};

// Animation presets for common use cases
export const componentAnimationPresets = {
  // Blog post animations
  blogPost: {
    title: { component: FadeIn, props: { direction: 'up', duration: 600 } },
    content: { component: StaggerChildren, props: { animation: 'fade', staggerDelay: 100 } },
    sidebar: { component: SlideIn, props: { direction: 'right', delay: 300 } },
  },
  
  // Navigation animations
  navigation: {
    menu: { component: SlideIn, props: { direction: 'down', duration: 300 } },
    items: { component: StaggerChildren, props: { pattern: 'sequential', staggerDelay: 50 } },
    search: { component: ScaleIn, props: { variant: 'pop', origin: 'top-right' } },
  },
  
  // Card grid animations
  cardGrid: {
    container: { component: FadeIn, props: { direction: 'up' } },
    cards: { component: StaggerCards, props: { pattern: 'grid', itemDelay: 100 } },
  },
  
  // Hero section animations
  hero: {
    background: { component: ParallaxScroll, props: { speed: 0.3, direction: 'up' } },
    title: { component: FadeIn, props: { direction: 'up', duration: 800 } },
    subtitle: { component: SlideIn, props: { direction: 'up', delay: 400 } },
    cta: { component: ScaleIn, props: { variant: 'bounce', delay: 800 } },
  },
  
  // Cybersecurity theme animations
  cybersecurity: {
    terminal: { component: FadeIn, props: { direction: 'up', easing: 'cubic-bezier(0.190, 1.000, 0.220, 1.000)' } },
    matrix: { component: StaggerChildren, props: { animation: 'fade', pattern: 'random' } },
    glitch: { component: ScaleIn, props: { variant: 'elastic', hoverScale: 1.1 } },
  },
};

// Quick start utilities
export const createAnimationSequence = (animations: Array<{
  component: React.ComponentType<any>;
  props: any;
  delay?: number;
}>) => {
  return animations.map(({ component: Component, props, delay = 0 }, index) => ({
    Component,
    props: { ...props, delay: delay + (props.delay || 0) },
    index,
  }));
};

export const withAnimationProvider = <P extends object>(
  Component: React.ComponentType<P>,
  animationConfig?: Partial<AnimationConfig>
) => {
  return withAnimation(Component)(animationConfig || {});
};

// Animation system status
export const getAnimationSystemStatus = () => {
  if (typeof window === 'undefined') {
    return {
      supported: false,
      reducedMotion: false,
      performance: 'unknown',
      activeAnimations: 0,
    };
  }

  return {
    supported: true,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    performance: 'requestAnimationFrame' in window ? 'good' : 'limited',
    activeAnimations: globalIntersectionManager.activeCount,
    parallaxElements: globalParallaxManager.count,
  };
};

// Default export for convenience
export default {
  // Components
  ...CoreAnimations,
  ...AdvancedAnimations,
  ...TextAnimations,
  ...LayoutAnimations,
  ...InteractionAnimations,
  ...LoadingAnimations,
  
  // Utilities
  animationUtils,
  performanceUtils,
  intersectionUtils,
  scrollAnimations,
  reducedMotionUtils,
  
  // Managers
  globalIntersectionManager,
  globalParallaxManager,
  globalScrollTracker,
  globalReducedMotionManager,
  
  // Presets
  animationPresets,
  
  // Utilities
  createAnimationSequence,
  withAnimationProvider,
  getAnimationSystemStatus,
};