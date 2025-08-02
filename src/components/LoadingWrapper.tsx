import React, { Suspense } from "react";
import { cn } from "@utils/cn";
import PageSkeleton, { type PageType } from "./skeletons/PageSkeleton";
import BlogCardSkeleton from "./skeletons/BlogCardSkeleton";
import SearchSkeleton from "./skeletons/SearchSkeleton";
import NavigationSkeleton from "./skeletons/NavigationSkeleton";
import HeroSkeleton from "./skeletons/HeroSkeleton";
import PostDetailSkeleton from "./skeletons/PostDetailSkeleton";

export type LoadingType =
  | "page"
  | "blogCard"
  | "search"
  | "navigation"
  | "hero"
  | "postDetail"
  | "custom";

interface LoadingWrapperProps {
  isLoading: boolean;
  loadingType: LoadingType;
  pageType?: PageType;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  skeletonProps?: Record<string, any>;
  showNavigation?: boolean;
  showFooter?: boolean;
  error?: Error | null;
  retry?: () => void;
}

/**
 * A comprehensive loading wrapper that provides skeleton loading states
 * for different component types throughout the application
 */
export default function LoadingWrapper({
  isLoading,
  loadingType,
  pageType = "home",
  fallback,
  children,
  className,
  skeletonProps = {},
  showNavigation = true,
  showFooter = true,
  error,
  retry,
}: LoadingWrapperProps) {
  // Error state
  if (error) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center min-h-[400px] p-8",
          className
        )}
      >
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            Something went wrong
          </h3>
          <p className="text-sm text-muted-foreground">
            {error.message ||
              "An unexpected error occurred while loading the content."}
          </p>
          {retry && (
            <button
              onClick={retry}
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors duration-200 text-sm font-medium"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className={className}>
        {renderLoadingSkeleton(
          loadingType,
          pageType,
          skeletonProps,
          showNavigation,
          showFooter
        )}
      </div>
    );
  }

  // Content loaded state
  return (
    <Suspense
      fallback={renderLoadingSkeleton(
        loadingType,
        pageType,
        skeletonProps,
        showNavigation,
        showFooter
      )}
    >
      {children}
    </Suspense>
  );
}

function renderLoadingSkeleton(
  loadingType: LoadingType,
  pageType: PageType,
  skeletonProps: Record<string, any>,
  showNavigation: boolean,
  showFooter: boolean
) {
  switch (loadingType) {
    case "page":
      return (
        <PageSkeleton
          pageType={pageType}
          showNavigation={showNavigation}
          showFooter={showFooter}
          {...skeletonProps}
        />
      );

    case "blogCard":
      return <BlogCardSkeleton {...skeletonProps} />;

    case "search":
      return <SearchSkeleton {...skeletonProps} />;

    case "navigation":
      return <NavigationSkeleton {...skeletonProps} />;

    case "hero":
      return <HeroSkeleton {...skeletonProps} />;

    case "postDetail":
      return <PostDetailSkeleton {...skeletonProps} />;

    case "custom":
      return (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="skeleton-shimmer h-8 w-1/2 rounded" />
          <div className="skeleton-shimmer h-4 w-full rounded" />
          <div className="skeleton-shimmer h-4 w-3/4 rounded" />
          <div className="skeleton-shimmer h-4 w-1/2 rounded" />
        </div>
      );

    default:
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground animate-pulse">
              Loading...
            </p>
          </div>
        </div>
      );
  }
}

/**
 * Hook for managing loading states with automatic timeout
 */
export function useLoadingTimeout(
  initialLoading: boolean = false,
  timeout: number = 10000
) {
  const [isLoading, setIsLoading] = React.useState(initialLoading);
  const [isTimeout, setIsTimeout] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading) return;

    const timer = setTimeout(() => {
      setIsTimeout(true);
      setIsLoading(false);
    }, timeout);

    return () => clearTimeout(timer);
  }, [isLoading, timeout]);

  const startLoading = React.useCallback(() => {
    setIsLoading(true);
    setIsTimeout(false);
  }, []);

  const stopLoading = React.useCallback(() => {
    setIsLoading(false);
    setIsTimeout(false);
  }, []);

  return {
    isLoading,
    isTimeout,
    startLoading,
    stopLoading,
  };
}

/**
 * Higher-order component for adding loading states to any component
 */
export function withLoading<P extends object>(
  Component: React.ComponentType<P>,
  loadingType: LoadingType = "custom",
  defaultSkeletonProps?: Record<string, any>
) {
  return React.forwardRef<
    any,
    P & { isLoading?: boolean; skeletonProps?: Record<string, any> }
  >(function WithLoadingComponent(
    { isLoading = false, skeletonProps, ...props },
    ref
  ) {
    return (
      <LoadingWrapper
        isLoading={isLoading}
        loadingType={loadingType}
        skeletonProps={{ ...defaultSkeletonProps, ...skeletonProps }}
      >
        <Component {...(props as P)} ref={ref} />
      </LoadingWrapper>
    );
  });
}

/**
 * Optimized loading component for list items
 */
interface LoadingListProps {
  count: number;
  itemComponent: React.ComponentType<{ index: number }>;
  className?: string;
}

export function LoadingList({
  count,
  itemComponent: ItemComponent,
  className,
}: LoadingListProps) {
  return (
    <div className={cn("stagger-fade-in space-y-4", className)}>
      {Array.from({ length: count }, (_, index) => (
        <ItemComponent key={index} index={index} />
      ))}
    </div>
  );
}

/**
 * Progressive loading component that shows content as it becomes available
 */
interface ProgressiveLoadingProps {
  stages: Array<{
    id: string;
    component: React.ReactNode;
    isLoaded: boolean;
    skeleton?: React.ReactNode;
  }>;
  className?: string;
}

export function ProgressiveLoading({
  stages,
  className,
}: ProgressiveLoadingProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {stages.map(stage => (
        <div key={stage.id} className="transition-all duration-300">
          {stage.isLoaded ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {stage.component}
            </div>
          ) : (
            stage.skeleton || (
              <div className="skeleton-shimmer h-20 w-full rounded-lg" />
            )
          )}
        </div>
      ))}
    </div>
  );
}
