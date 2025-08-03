import React from "react";
import { EnhancedTag } from "./EnhancedTag";
import { cn } from "@utils/cn";

import type { PopularTagsProps, TagWithStats } from "./types";

export function PopularTags({
  tags,
  maxTags = 10,
  showTrending = true,
  showStats = true,
  className,
  onTagClick,
}: PopularTagsProps) {
  // Separate trending and popular tags
  const trendingTags = showTrending
    ? tags.filter(tag => tag.trending).slice(0, Math.min(5, maxTags))
    : [];

  const popularTags = tags
    .filter(tag => !showTrending || !tag.trending)
    .slice(0, maxTags - trendingTags.length);

  const handleTagClick = (tag: TagWithStats) => {
    if (onTagClick) {
      onTagClick(tag);
    } else {
      // Default navigation
      window.location.href = `/tags/${tag.tag}/`;
    }
  };

  const totalPosts = tags.reduce((sum, tag) => sum + tag.count, 0);
  const averageTagsPerPost = totalPosts / tags.length;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Stats Overview */}
      {showStats && (
        <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
            Tag Statistics
          </h3>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Tags</span>
              <span className="font-semibold text-foreground">
                {tags.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Posts</span>
              <span className="font-semibold text-foreground">
                {totalPosts}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Avg Tags/Post</span>
              <span className="font-semibold text-foreground">
                {averageTagsPerPost.toFixed(1)}
              </span>
            </div>
            {trendingTags.length > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Trending</span>
                <span className="font-semibold text-orange-600">
                  {trendingTags.length}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trending Tags */}
      {trendingTags.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">
              Trending Tags
            </h3>
            <span className="text-lg">🔥</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Recently active and gaining popularity
          </p>
          <div className="space-y-2">
            {trendingTags.map((tag, index) => {
              return (
                <div
                  key={tag.tag}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-500/5 to-red-500/5 rounded-lg border border-orange-500/20 hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 text-white text-xs font-bold rounded-full">
                      {index + 1}
                    </div>
                    <EnhancedTag
                      tag={tag}
                      variant="outline"
                      showCount={false}
                      interactive={false}
                      size="sm"
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{tag.count}</span>
                    <button
                      onClick={() => handleTagClick(tag)}
                      className="text-chart-1 hover:text-chart-1/80 font-medium transition-colors"
                      title={`View ${tag.tagName} posts`}
                    >
                      →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Popular Tags */}
      {popularTags.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Popular Tags
          </h3>
          <p className="text-sm text-muted-foreground">
            Most referenced across all posts
          </p>
          <div className="space-y-2">
            {popularTags.map((tag, index) => {
              const popularityPercentage = Math.round(tag.popularity * 100);

              return (
                <div
                  key={tag.tag}
                  className="group relative overflow-hidden p-3 bg-card rounded-lg border hover:shadow-md transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  onClick={() => handleTagClick(tag)}
                  style={{
                    animationDelay: `${(index + trendingTags.length) * 100}ms`,
                  }}
                >
                  {/* Animated progress bar background */}
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent transition-all duration-500 group-hover:to-primary/5"
                    style={{
                      width: `${Math.max(popularityPercentage, 10)}%`,
                    }}
                  />

                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="flex items-center justify-center w-6 h-6 bg-muted text-muted-foreground text-xs font-bold rounded-full">
                        {index + trendingTags.length + 1}
                      </div>
                      <EnhancedTag
                        tag={tag}
                        variant="default"
                        showCount={false}
                        interactive={false}
                        size="sm"
                        className="flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="text-right">
                        <div className="font-semibold text-foreground">
                          {tag.count}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {popularityPercentage}%
                        </div>
                      </div>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-muted-foreground group-hover:text-primary transition-colors"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="p-4 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30">
        <h4 className="text-sm font-semibold text-foreground mb-3">
          Explore More
        </h4>
        <div className="space-y-2">
          <a
            href="/tags"
            className="flex items-center justify-between p-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
          >
            <span>Browse all tags</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </a>
          <a
            href="/search"
            className="flex items-center justify-between p-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
          >
            <span>Search posts</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

export default PopularTags;
