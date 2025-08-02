import { Skeleton } from "@components/ui/skeleton";
import { cn } from "@utils/cn";

interface HeroSkeletonProps {
  className?: string;
  showVideo?: boolean;
  showStats?: boolean;
  showTechnologies?: boolean;
}

export default function HeroSkeleton({
  className,
  showVideo = true,
  showStats = true,
  showTechnologies = true,
}: HeroSkeletonProps) {
  return (
    <div className={cn("py-12 space-y-12", className)}>
      {/* Hero Title and Subtitle */}
      <div className="text-center space-y-6">
        {/* Main title skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-12 w-4/5 mx-auto bg-gradient-to-r from-primary/30 via-accent/20 to-primary/30 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
          <Skeleton
            className="h-12 w-3/5 mx-auto bg-gradient-to-r from-primary/30 via-accent/20 to-primary/30 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
            style={{ animationDelay: "0.1s" }}
          />
        </div>

        {/* Subtitle skeleton */}
        <Skeleton
          className="h-6 w-3/4 mx-auto bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
          style={{ animationDelay: "0.2s" }}
        />

        {/* Description paragraph */}
        <div className="max-w-3xl mx-auto space-y-2">
          <Skeleton
            className="h-5 w-full bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
            style={{ animationDelay: "0.3s" }}
          />
          <Skeleton
            className="h-5 w-4/5 mx-auto bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
            style={{ animationDelay: "0.4s" }}
          />
          <Skeleton
            className="h-5 w-3/4 mx-auto bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
            style={{ animationDelay: "0.5s" }}
          />
        </div>
      </div>

      {/* Video Container Skeleton */}
      {showVideo && (
        <div className="relative mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-lg shadow-lg bg-muted/30">
            {/* Video placeholder */}
            <div className="aspect-video w-full bg-gradient-to-br from-muted via-muted/50 to-muted relative">
              <Skeleton
                className="absolute inset-0 bg-gradient-to-r from-muted via-muted/30 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                style={{ animationDelay: "0.6s" }}
              />

              {/* Play button skeleton */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Skeleton
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                  style={{ animationDelay: "0.7s" }}
                />
              </div>

              {/* Unmute button skeleton */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <Skeleton
                  className="h-10 w-20 rounded bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                  style={{ animationDelay: "0.8s" }}
                />
              </div>
            </div>

            {/* Video overlay effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
          </div>
        </div>
      )}

      {/* Stats Cards Skeleton */}
      {showStats && (
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300 backdrop-blur-sm bg-card/90 p-4 relative overflow-hidden"
              >
                {/* Card background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-30" />

                <div className="relative text-center space-y-2">
                  {/* Number skeleton */}
                  <Skeleton
                    className="h-8 mx-auto bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                    style={{
                      width: `${Math.random() * 20 + 40}px`,
                      animationDelay: `${0.9 + index * 0.1}s`,
                    }}
                  />

                  {/* Label skeleton */}
                  <Skeleton
                    className="h-4 mx-auto bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                    style={{
                      width: `${Math.random() * 30 + 60}px`,
                      animationDelay: `${1.0 + index * 0.1}s`,
                    }}
                  />
                </div>

                {/* Card shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social Links Skeleton */}
      <div className="flex flex-col items-center justify-center sm:flex-row">
        <div className="mb-2 mr-4 sm:mb-0">
          <Skeleton
            className="h-5 w-24 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
            style={{ animationDelay: "1.4s" }}
          />
        </div>

        <div className="flex items-center gap-3">
          {[...Array(5)].map((_, index) => (
            <Skeleton
              key={index}
              className="w-8 h-8 rounded bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
              style={{ animationDelay: `${1.5 + index * 0.05}s` }}
            />
          ))}
        </div>
      </div>

      {/* Technologies Section Skeleton */}
      {showTechnologies && (
        <div className="py-16 space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-4">
            <Skeleton
              className="h-8 w-48 mx-auto bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
              style={{ animationDelay: "1.7s" }}
            />
            <div className="max-w-2xl mx-auto space-y-2">
              <Skeleton
                className="h-4 w-full bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                style={{ animationDelay: "1.8s" }}
              />
              <Skeleton
                className="h-4 w-4/5 mx-auto bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                style={{ animationDelay: "1.9s" }}
              />
            </div>
          </div>

          {/* Technology Cards Grid */}
          <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300 backdrop-blur-sm bg-card/90 group relative overflow-hidden"
              >
                {/* Card background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-30" />

                <div className="relative p-6 space-y-4">
                  {/* Icon and title */}
                  <div className="flex items-center space-x-3">
                    <Skeleton
                      className="w-8 h-8 rounded bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                      style={{ animationDelay: `${2.0 + index * 0.1}s` }}
                    />
                    <Skeleton
                      className="h-6 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                      style={{
                        width: `${Math.random() * 40 + 80}px`,
                        animationDelay: `${2.1 + index * 0.1}s`,
                      }}
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Skeleton
                      className="h-4 w-full bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                      style={{ animationDelay: `${2.2 + index * 0.1}s` }}
                    />
                    <Skeleton
                      className="h-4 w-3/4 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                      style={{ animationDelay: `${2.3 + index * 0.1}s` }}
                    />
                  </div>
                </div>

                {/* Card shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global loading overlay */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 animate-pulse" />

      {/* Progress indicator */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 text-sm text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span>Loading homepage content...</span>
        </div>
      </div>
    </div>
  );
}
