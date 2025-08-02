import { cn } from "@utils/cn";
import NavigationSkeleton from "./NavigationSkeleton";
import HeroSkeleton from "./HeroSkeleton";
import BlogCardSkeleton from "./BlogCardSkeleton";
import SearchSkeleton from "./SearchSkeleton";
import PostDetailSkeleton from "./PostDetailSkeleton";

export type PageType =
  | "home"
  | "posts"
  | "post-detail"
  | "search"
  | "tags"
  | "about";

interface PageSkeletonProps {
  pageType: PageType;
  className?: string;
  showNavigation?: boolean;
  showFooter?: boolean;
}

export default function PageSkeleton({
  pageType,
  className,
  showNavigation = true,
  showFooter = true,
}: PageSkeletonProps) {
  return (
    <div className={cn("min-h-screen flex flex-col", className)}>
      {/* Header/Navigation Skeleton */}
      {showNavigation && (
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/40">
          <div className="container mx-auto px-4 py-4">
            <NavigationSkeleton />
          </div>
        </header>
      )}

      {/* Main Content Skeleton */}
      <main className="flex-1">{renderPageContent(pageType)}</main>

      {/* Footer Skeleton */}
      {showFooter && (
        <footer className="border-t border-border/40 mt-auto">
          <div className="container mx-auto px-4 py-8">
            <FooterSkeleton />
          </div>
        </footer>
      )}
    </div>
  );
}

function renderPageContent(pageType: PageType) {
  const containerClasses = "container mx-auto px-4 py-8";

  switch (pageType) {
    case "home":
      return (
        <div className={containerClasses}>
          <HeroSkeleton showVideo showStats showTechnologies />

          {/* Featured Posts Section */}
          <section className="py-16">
            <div className="text-center mb-12 space-y-4">
              <div className="h-8 w-48 mx-auto bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
              <div className="max-w-2xl mx-auto space-y-2">
                <div className="h-4 w-full bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
                <div className="h-4 w-4/5 mx-auto bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
              </div>
            </div>

            <ul className="grid gap-6 sm:grid-cols-2">
              {[...Array(4)].map((_, index) => (
                <BlogCardSkeleton key={index} />
              ))}
            </ul>
          </section>

          {/* Recent Posts Section */}
          <section className="py-16">
            <div className="text-center mb-12 space-y-4">
              <div className="h-8 w-40 mx-auto bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
              <div className="max-w-2xl mx-auto space-y-2">
                <div className="h-4 w-full bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
                <div className="h-4 w-3/4 mx-auto bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
              </div>
            </div>

            <ul className="grid gap-6 sm:grid-cols-2">
              {[...Array(6)].map((_, index) => (
                <BlogCardSkeleton key={index} />
              ))}
            </ul>
          </section>
        </div>
      );

    case "posts":
      return (
        <div className={containerClasses}>
          {/* Page Header */}
          <div className="text-center mb-12 space-y-4">
            <div className="h-10 w-32 mx-auto bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
            <div className="h-4 w-64 mx-auto bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
          </div>

          {/* Posts List */}
          <ul className="space-y-6">
            {[...Array(8)].map((_, index) => (
              <BlogCardSkeleton key={index} />
            ))}
          </ul>

          {/* Pagination Skeleton */}
          <div className="flex justify-center items-center gap-4 mt-12">
            <div className="h-10 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="h-10 w-10 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded"
              />
            ))}
            <div className="h-10 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
          </div>
        </div>
      );

    case "post-detail":
      return (
        <div className={containerClasses}>
          <PostDetailSkeleton showBreadcrumbs showTableOfContents />
        </div>
      );

    case "search":
      return (
        <div className={containerClasses}>
          {/* Page Header */}
          <div className="text-center mb-12 space-y-4">
            <div className="h-10 w-40 mx-auto bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
            <div className="h-4 w-80 mx-auto bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
          </div>

          <SearchSkeleton showFilters resultCount={5} />
        </div>
      );

    case "tags":
      return (
        <div className={containerClasses}>
          {/* Page Header */}
          <div className="text-center mb-12 space-y-4">
            <div className="h-10 w-24 mx-auto bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
            <div className="h-4 w-72 mx-auto bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
          </div>

          {/* Tags Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(20)].map((_, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border border-border/40 bg-card/50 backdrop-blur-sm space-y-2"
              >
                <div
                  className="h-5 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded"
                  style={{
                    width: `${Math.random() * 40 + 60}%`,
                    animationDelay: `${index * 0.05}s`,
                  }}
                />
                <div
                  className="h-3 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded"
                  style={{
                    width: `${Math.random() * 20 + 30}%`,
                    animationDelay: `${index * 0.05 + 0.1}s`,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      );

    case "about":
      return (
        <div className={containerClasses}>
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Page Header */}
            <div className="text-center space-y-4">
              <div className="h-12 w-48 mx-auto bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
              <div className="max-w-2xl mx-auto space-y-2">
                <div className="h-5 w-full bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
                <div className="h-5 w-4/5 mx-auto bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
              </div>
            </div>

            {/* Profile Image */}
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
            </div>

            {/* Content Sections */}
            {[...Array(4)].map((_, sectionIndex) => (
              <section key={sectionIndex} className="space-y-4">
                <div className="h-6 w-48 bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
                <div className="space-y-3">
                  {[...Array(4)].map((_, paraIndex) => (
                    <div key={paraIndex} className="space-y-2">
                      <div className="h-4 w-full bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
                      <div
                        className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded"
                        style={{ width: `${Math.random() * 30 + 70}%` }}
                      />
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {/* Skills/Experience Grid */}
            <section className="space-y-6">
              <div className="h-6 w-32 bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
              <div className="grid gap-4 md:grid-cols-2">
                {[...Array(6)].map((_, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-border/40 bg-card/50 backdrop-blur-sm space-y-3"
                  >
                    <div className="h-5 w-32 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
                    <div className="space-y-2">
                      <div className="h-3 w-full bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
                      <div className="h-3 w-4/5 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      );

    default:
      return (
        <div className={containerClasses}>
          <div className="space-y-8">
            <div className="h-10 w-64 mx-auto bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
            <div className="space-y-4">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="h-4 w-full bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded"
                />
              ))}
            </div>
          </div>
        </div>
      );
  }
}

function FooterSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-4">
      {/* Logo and description */}
      <div className="space-y-4">
        <div className="h-6 w-32 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
          <div className="h-3 w-4/5 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
          <div className="h-3 w-3/5 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
        </div>
      </div>

      {/* Footer links sections */}
      {[...Array(3)].map((_, sectionIndex) => (
        <div key={sectionIndex} className="space-y-4">
          <div className="h-5 w-24 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
          <div className="space-y-3">
            {[...Array(4)].map((_, linkIndex) => (
              <div
                key={linkIndex}
                className="h-3 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded"
                style={{
                  width: `${Math.random() * 30 + 50}%`,
                  animationDelay: `${sectionIndex * 0.1 + linkIndex * 0.05}s`,
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
