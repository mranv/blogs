import { Skeleton } from "@components/ui/skeleton";
import { cn } from "@utils/cn";

interface BlogCardSkeletonProps {
  className?: string;
  showGradients?: boolean;
}

export default function BlogCardSkeleton({
  className,
  showGradients = true,
}: BlogCardSkeletonProps) {
  return (
    <li className="my-4">
      <div
        className={cn(
          "group relative overflow-hidden",
          "border-border/40 bg-card/50 backdrop-blur-md",
          "rounded-lg border p-6",
          "bg-gradient-to-br from-background via-card/60 to-muted/30",
          showGradients && [
            "before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/3 before:via-transparent before:to-accent/3",
            "before:opacity-30 before:transition-opacity before:duration-500",
          ],
          className
        )}
      >
        {/* Enhanced gradient overlays for visual consistency */}
        {showGradients && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/4 via-accent/2 to-secondary/3 opacity-30" />
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-40" />
            <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-accent/5 via-transparent to-transparent opacity-30" />
          </>
        )}

        {/* Header Section */}
        <div className="relative pb-3">
          {/* Title skeleton with shimmer animation */}
          <Skeleton className="h-7 w-4/5 mb-3 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />

          {/* Date skeleton */}
          <Skeleton
            className="h-4 w-32 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
            style={{ animationDelay: "0.1s" }}
          />
        </div>

        {/* Content Section */}
        <div className="relative pt-0">
          {/* Description skeleton - multiple lines */}
          <div className="space-y-2 mb-4">
            <Skeleton
              className="h-4 w-full bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
              style={{ animationDelay: "0.2s" }}
            />
            <Skeleton
              className="h-4 w-3/4 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
              style={{ animationDelay: "0.3s" }}
            />
          </div>

          {/* Read more link skeleton */}
          <div className="flex items-center gap-2">
            <Skeleton
              className="h-4 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
              style={{ animationDelay: "0.4s" }}
            />
            <Skeleton
              className="h-4 w-4 rounded bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
              style={{ animationDelay: "0.5s" }}
            />
          </div>
        </div>

        {/* Pulse overlay for loading indication */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
      </div>
    </li>
  );
}
