import { Skeleton } from "@components/ui/skeleton";
import { cn } from "@utils/cn";

interface PostDetailSkeletonProps {
  className?: string;
  showBreadcrumbs?: boolean;
  showTableOfContents?: boolean;
}

export default function PostDetailSkeleton({
  className,
  showBreadcrumbs = true,
  showTableOfContents = true,
}: PostDetailSkeletonProps) {
  return (
    <div className={cn("space-y-8", className)}>
      {/* Breadcrumbs Skeleton */}
      {showBreadcrumbs && (
        <div className="flex items-center space-x-2">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Skeleton
                className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                style={{
                  width: `${Math.random() * 30 + 40}px`,
                  animationDelay: `${index * 0.1}s`,
                }}
              />
              {index < 2 && (
                <Skeleton
                  className="h-3 w-3 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                  style={{ animationDelay: `${index * 0.1 + 0.05}s` }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Post Header */}
      <div className="space-y-6">
        {/* Title Skeleton */}
        <div className="space-y-3">
          <Skeleton
            className="h-10 w-full bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
            style={{ animationDelay: "0.3s" }}
          />
          <Skeleton
            className="h-10 w-4/5 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
            style={{ animationDelay: "0.4s" }}
          />
        </div>

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Date */}
          <div className="flex items-center gap-2">
            <Skeleton
              className="w-4 h-4 rounded bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
              style={{ animationDelay: "0.5s" }}
            />
            <Skeleton
              className="h-4 w-24 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
              style={{ animationDelay: "0.6s" }}
            />
          </div>

          {/* Reading time */}
          <div className="flex items-center gap-2">
            <Skeleton
              className="w-4 h-4 rounded bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
              style={{ animationDelay: "0.7s" }}
            />
            <Skeleton
              className="h-4 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
              style={{ animationDelay: "0.8s" }}
            />
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {[...Array(4)].map((_, index) => (
            <Skeleton
              key={index}
              className="h-6 rounded-full bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
              style={{
                width: `${Math.random() * 40 + 60}px`,
                animationDelay: `${0.9 + index * 0.1}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Two-column layout for larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Article Content */}
          <div className="space-y-4">
            {/* Paragraphs */}
            {[...Array(8)].map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton
                  className="h-4 w-full bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                  style={{ animationDelay: `${1.3 + index * 0.1}s` }}
                />
                <Skeleton
                  className="h-4 w-full bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                  style={{ animationDelay: `${1.4 + index * 0.1}s` }}
                />
                <Skeleton
                  className="h-4 w-3/4 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                  style={{ animationDelay: `${1.5 + index * 0.1}s` }}
                />
              </div>
            ))}

            {/* Code block skeleton */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border/40 space-y-2">
              {[...Array(5)].map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                  style={{
                    width: `${Math.random() * 60 + 40}%`,
                    animationDelay: `${2.1 + index * 0.05}s`,
                  }}
                />
              ))}
            </div>

            {/* More paragraphs */}
            {[...Array(4)].map((_, index) => (
              <div key={index + 8} className="space-y-2">
                <Skeleton
                  className="h-4 w-full bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                  style={{ animationDelay: `${2.4 + index * 0.1}s` }}
                />
                <Skeleton
                  className="h-4 w-5/6 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                  style={{ animationDelay: `${2.5 + index * 0.1}s` }}
                />
              </div>
            ))}
          </div>

          {/* Share buttons */}
          <div className="flex items-center gap-3 pt-6 border-t border-border/40">
            <Skeleton
              className="h-4 w-16 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
              style={{ animationDelay: "2.8s" }}
            />
            {[...Array(4)].map((_, index) => (
              <Skeleton
                key={index}
                className="w-8 h-8 rounded bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                style={{ animationDelay: `${2.9 + index * 0.05}s` }}
              />
            ))}
          </div>
        </div>

        {/* Sidebar - Table of Contents */}
        {showTableOfContents && (
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* TOC Header */}
              <Skeleton
                className="h-5 w-32 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                style={{ animationDelay: "3.1s" }}
              />

              {/* TOC Items */}
              <div className="space-y-3">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton
                      className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                      style={{
                        width: `${Math.random() * 50 + 50}%`,
                        marginLeft: index % 3 === 1 ? "16px" : "0px",
                        animationDelay: `${3.2 + index * 0.1}s`,
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Progress indicator */}
              <div className="mt-6 pt-4 border-t border-border/40">
                <Skeleton
                  className="h-2 w-full rounded-full bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                  style={{ animationDelay: "3.8s" }}
                />
                <Skeleton
                  className="h-3 w-16 mt-2 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                  style={{ animationDelay: "3.9s" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Related Posts */}
      <div className="mt-12 pt-8 border-t border-border/40">
        <Skeleton
          className="h-6 w-32 mb-6 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
          style={{ animationDelay: "4.0s" }}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border border-border/40 bg-card/50 backdrop-blur-sm space-y-3"
            >
              <Skeleton
                className="h-5 w-full bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                style={{ animationDelay: `${4.1 + index * 0.1}s` }}
              />
              <Skeleton
                className="h-4 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                style={{ animationDelay: `${4.2 + index * 0.1}s` }}
              />
              <Skeleton
                className="h-3 w-full bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                style={{ animationDelay: `${4.3 + index * 0.1}s` }}
              />
              <Skeleton
                className="h-3 w-3/4 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                style={{ animationDelay: `${4.4 + index * 0.1}s` }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Global shimmer overlay */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/[0.02] to-transparent animate-pulse" />
    </div>
  );
}
