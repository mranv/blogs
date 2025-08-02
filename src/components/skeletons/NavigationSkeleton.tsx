import { Skeleton } from "@components/ui/skeleton";
import { cn } from "@utils/cn";

interface NavigationSkeletonProps {
  className?: string;
  isMobile?: boolean;
  showLogo?: boolean;
}

export default function NavigationSkeleton({
  className,
  isMobile = false,
  showLogo = true,
}: NavigationSkeletonProps) {
  if (isMobile) {
    return (
      <div
        className={cn(
          "md:hidden space-y-4 p-4 bg-skin-fill/95 backdrop-blur-md border-t border-skin-accent/20 shadow-lg",
          className
        )}
      >
        {/* Mobile menu items */}
        {[...Array(4)].map((_, index) => (
          <div key={index} className="flex items-center space-x-3">
            <Skeleton
              className="w-5 h-5 rounded bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
              style={{ animationDelay: `${index * 0.1}s` }}
            />
            <Skeleton
              className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
              style={{
                width: `${Math.random() * 40 + 60}px`,
                animationDelay: `${index * 0.1 + 0.05}s`,
              }}
            />
          </div>
        ))}

        {/* Theme toggle */}
        <div className="flex items-center space-x-3 pt-2 border-t border-border/40">
          <Skeleton
            className="w-5 h-5 rounded bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
            style={{ animationDelay: "0.4s" }}
          />
          <Skeleton
            className="h-4 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
            style={{ animationDelay: "0.45s" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("hidden md:flex items-center space-x-6", className)}>
      {/* Logo skeleton */}
      {showLogo && (
        <div className="flex items-center space-x-2">
          <Skeleton className="w-8 h-8 rounded bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
          <Skeleton
            className="h-6 w-24 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
            style={{ animationDelay: "0.1s" }}
          />
        </div>
      )}

      {/* Navigation menu items */}
      <div className="flex items-center space-x-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="relative">
            {/* Menu trigger skeleton */}
            <div className="flex items-center space-x-1 p-2 rounded-lg border border-transparent hover:border-skin-accent/20">
              <Skeleton
                className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                style={{
                  width: `${Math.random() * 30 + 50}px`,
                  animationDelay: `${0.2 + index * 0.1}s`,
                }}
              />
              <Skeleton
                className="w-3 h-3 rounded bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                style={{ animationDelay: `${0.25 + index * 0.1}s` }}
              />
            </div>

            {/* Dropdown content skeleton (visible on hover simulation) */}
            {index < 3 && (
              <div className="absolute top-full left-0 mt-2 w-96 bg-card border border-border/40 rounded-xl shadow-lg backdrop-blur-sm opacity-20 pointer-events-none">
                <div className="p-6 space-y-4">
                  {/* Dropdown header */}
                  <div className="space-y-2">
                    <Skeleton
                      className="h-5 w-24 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                      style={{ animationDelay: `${0.6 + index * 0.1}s` }}
                    />
                    <Skeleton
                      className="h-3 w-48 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                      style={{ animationDelay: `${0.65 + index * 0.1}s` }}
                    />
                  </div>

                  {/* Dropdown items */}
                  <div className="space-y-3">
                    {[...Array(3)].map((_, itemIndex) => (
                      <div key={itemIndex} className="space-y-1">
                        <Skeleton
                          className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                          style={{
                            width: `${Math.random() * 60 + 80}px`,
                            animationDelay: `${0.7 + index * 0.1 + itemIndex * 0.05}s`,
                          }}
                        />
                        <Skeleton
                          className="h-3 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                          style={{
                            width: `${Math.random() * 80 + 100}px`,
                            animationDelay: `${0.75 + index * 0.1 + itemIndex * 0.05}s`,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Right side actions */}
      <div className="flex items-center space-x-3 ml-auto">
        {/* Search button skeleton */}
        <div className="relative">
          <Skeleton
            className="w-10 h-10 rounded-lg bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
            style={{ animationDelay: "0.8s" }}
          />
        </div>

        {/* Theme toggle skeleton */}
        <div className="relative">
          <Skeleton
            className="w-10 h-10 rounded-lg bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
            style={{ animationDelay: "0.85s" }}
          />
        </div>

        {/* Mobile menu button skeleton */}
        <div className="md:hidden">
          <Skeleton
            className="w-10 h-10 rounded-lg bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
            style={{ animationDelay: "0.9s" }}
          />
        </div>
      </div>

      {/* Loading indicator for dropdown content */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 opacity-30">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin" />
          <span>Loading navigation...</span>
        </div>
      </div>

      {/* Subtle shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent animate-pulse pointer-events-none" />
    </div>
  );
}
