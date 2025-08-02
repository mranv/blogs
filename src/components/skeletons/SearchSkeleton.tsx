import { Skeleton } from "@components/ui/skeleton";
import { cn } from "@utils/cn";

interface SearchSkeletonProps {
  className?: string;
  showFilters?: boolean;
  resultCount?: number;
}

export default function SearchSkeleton({
  className,
  showFilters = true,
  resultCount = 3,
}: SearchSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Search Input Skeleton */}
      <div className="relative">
        <div className="relative">
          {/* Search icon skeleton */}
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 opacity-75 z-10">
            <Skeleton className="w-5 h-5 rounded-full bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
          </div>

          {/* Input field skeleton */}
          <Skeleton className="w-full h-14 rounded-xl bg-gradient-to-r from-card/60 via-card/40 to-card/60 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />

          {/* Keyboard shortcut hint skeleton */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-4">
            <Skeleton
              className="w-8 h-6 rounded bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
              style={{ animationDelay: "0.1s" }}
            />
          </div>
        </div>
      </div>

      {/* Category Filters Skeleton */}
      {showFilters && (
        <div className="animate-in slide-in-from-top-2 duration-300">
          <div className="flex flex-wrap gap-2 mb-4">
            <Skeleton
              className="h-4 w-32 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
              style={{ animationDelay: "0.2s" }}
            />
            <div className="flex flex-wrap gap-2">
              {[...Array(6)].map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-6 rounded-full bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                  style={{
                    width: `${Math.random() * 40 + 60}px`,
                    animationDelay: `${0.3 + index * 0.1}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search Results Header Skeleton */}
      <div className="animate-in slide-in-from-top-2 duration-300">
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-full">
          <Skeleton
            className="w-4 h-4 rounded-full bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
            style={{ animationDelay: "0.5s" }}
          />
          <Skeleton
            className="h-4 w-48 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
            style={{ animationDelay: "0.6s" }}
          />
        </div>
      </div>

      {/* Search Results Skeleton */}
      <div className="space-y-4">
        {[...Array(resultCount)].map((_, index) => (
          <div
            key={index}
            className="p-6 rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm relative overflow-hidden"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Background gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent opacity-30" />

            <div className="relative space-y-3">
              {/* Title skeleton */}
              <Skeleton
                className="h-6 w-4/5 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                style={{ animationDelay: `${0.7 + index * 0.1}s` }}
              />

              {/* Description skeleton */}
              <div className="space-y-2">
                <Skeleton
                  className="h-4 w-full bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                  style={{ animationDelay: `${0.8 + index * 0.1}s` }}
                />
                <Skeleton
                  className="h-4 w-2/3 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                  style={{ animationDelay: `${0.9 + index * 0.1}s` }}
                />
              </div>

              {/* Tags skeleton */}
              <div className="flex gap-2 mt-3">
                {[...Array(3)].map((_, tagIndex) => (
                  <Skeleton
                    key={tagIndex}
                    className="h-6 rounded-full bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                    style={{
                      width: `${Math.random() * 30 + 50}px`,
                      animationDelay: `${1.0 + index * 0.1 + tagIndex * 0.05}s`,
                    }}
                  />
                ))}
              </div>

              {/* Read more link skeleton */}
              <div className="flex items-center gap-2 mt-4">
                <Skeleton
                  className="h-4 w-16 bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                  style={{ animationDelay: `${1.1 + index * 0.1}s` }}
                />
                <Skeleton
                  className="h-4 w-4 bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                  style={{ animationDelay: `${1.2 + index * 0.1}s` }}
                />
              </div>
            </div>

            {/* Shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent animate-pulse" />
          </div>
        ))}
      </div>

      {/* Loading indicator */}
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-3 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <Skeleton className="h-4 w-24 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
        </div>
      </div>
    </div>
  );
}
