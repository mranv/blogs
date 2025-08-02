import React, { useState, useMemo } from "react";
import { EnhancedTag } from "./EnhancedTag";
import { TagFilter } from "./TagFilter";
import { cn } from "@utils/cn";
import { filterTags, getTagVariantByCategory } from "@utils/tagUtils";
import type {
  TagListProps,
  TagWithStats,
  TagFilterOptions,
  TagCategory,
} from "./types";

// Category grouping configuration
const CATEGORY_ORDER: TagCategory[] = [
  "security",
  "compliance",
  "rust",
  "kubernetes",
  "infrastructure",
  "tools",
  "development",
  "technology",
  "monitoring",
  "automation",
  "networking",
  "ai-ml",
  "general",
];

const CATEGORY_LABELS: Record<TagCategory, string> = {
  security: "🔒 Security & Cybersecurity",
  compliance: "📋 Compliance & Standards",
  rust: "🦀 Rust Programming",
  kubernetes: "☸️ Kubernetes & Orchestration",
  infrastructure: "🏗️ Infrastructure & Cloud",
  tools: "🔧 Tools & Platforms",
  development: "💻 Development & APIs",
  technology: "⚡ Technology Stack",
  monitoring: "📊 Monitoring & Observability",
  automation: "🤖 Automation & DevOps",
  networking: "🌐 Networking & Protocols",
  "ai-ml": "🧠 AI & Machine Learning",
  general: "📁 General Topics",
};

export function TagList({
  tags,
  filterOptions = {},
  showFilters = true,
  groupByCategory = false,
  sortable = true,
  searchable = true,
  className,
  onTagClick,
  onFilterChange,
}: TagListProps) {
  const [currentFilters, setCurrentFilters] =
    useState<TagFilterOptions>(filterOptions);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Convert tags to TagWithStats if needed
  const tagsWithStats = useMemo(() => {
    return tags.map(tag => {
      if ("count" in tag) {
        return tag as TagWithStats;
      }
      return { ...tag, count: 0, popularity: 0 } as TagWithStats;
    });
  }, [tags]);

  // Get available categories
  const availableCategories = useMemo(() => {
    const categories = new Set<TagCategory>();
    tagsWithStats.forEach(tag => {
      if (tag.category) {
        categories.add(tag.category);
      }
    });
    return CATEGORY_ORDER.filter(cat => categories.has(cat));
  }, [tagsWithStats]);

  // Apply filters
  const filteredTags = useMemo(() => {
    return filterTags(tagsWithStats, currentFilters);
  }, [tagsWithStats, currentFilters]);

  // Group tags by category if needed
  const groupedTags = useMemo(() => {
    if (!groupByCategory) {
      return { all: filteredTags };
    }

    const groups: Record<string, TagWithStats[]> = {};

    filteredTags.forEach(tag => {
      const category = tag.category || "general";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(tag);
    });

    // Sort groups by category order
    const sortedGroups: Record<string, TagWithStats[]> = {};
    CATEGORY_ORDER.forEach(category => {
      if (groups[category]) {
        sortedGroups[category] = groups[category];
      }
    });

    return sortedGroups;
  }, [filteredTags, groupByCategory]);

  const handleFilterChange = (newFilters: TagFilterOptions) => {
    setCurrentFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleTagClick = (tag: TagWithStats) => {
    if (onTagClick) {
      onTagClick(tag);
    } else {
      // Default navigation
      window.location.href = `/tags/${tag.tag}/`;
    }
  };

  const totalTags = filteredTags.length;
  const hasResults = totalTags > 0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tag Library</h2>
          <p className="text-muted-foreground">
            {hasResults ? (
              <>
                Showing {totalTags} tag{totalTags !== 1 ? "s" : ""}
                {currentFilters.search &&
                  ` matching "${currentFilters.search}"`}
              </>
            ) : (
              "No tags found matching your criteria"
            )}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "px-3 py-2 text-sm font-medium transition-colors",
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:text-foreground"
              )}
              title="Grid view"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "px-3 py-2 text-sm font-medium transition-colors",
                viewMode === "list"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:text-foreground"
              )}
              title="List view"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="8" x2="21" y1="6" y2="6" />
                <line x1="8" x2="21" y1="12" y2="12" />
                <line x1="8" x2="21" y1="18" y2="18" />
                <line x1="3" x2="3.01" y1="6" y2="6" />
                <line x1="3" x2="3.01" y1="12" y2="12" />
                <line x1="3" x2="3.01" y1="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <TagFilter
          options={currentFilters}
          availableCategories={availableCategories}
          onFilterChange={handleFilterChange}
          showAdvanced={true}
        />
      )}

      {/* Results */}
      {hasResults ? (
        <div className="space-y-8">
          {Object.entries(groupedTags).map(([categoryKey, categoryTags]) => (
            <div key={categoryKey} className="space-y-4">
              {/* Category Header (only show if grouping) */}
              {groupByCategory && (
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-foreground">
                    {CATEGORY_LABELS[categoryKey as TagCategory] || categoryKey}
                  </h3>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {categoryTags.length} tag
                    {categoryTags.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              {/* Tags */}
              <div
                className={cn(
                  "transition-all duration-300",
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
                    : "space-y-2"
                )}
              >
                {categoryTags.map((tag, index) => {
                  const variant = getTagVariantByCategory(
                    tag.category || "general"
                  );

                  return (
                    <div
                      key={tag.tag}
                      className={cn(
                        "transition-all duration-300",
                        viewMode === "list" &&
                          "flex items-center justify-between p-3 bg-card rounded-lg border hover:shadow-md"
                      )}
                      style={{
                        animationDelay: `${index * 50}ms`,
                      }}
                    >
                      {viewMode === "list" ? (
                        <>
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <EnhancedTag
                              tag={tag}
                              variant={variant}
                              showCount={false}
                              interactive={false}
                              size="sm"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground truncate">
                                {tag.tagName}
                              </h4>
                              {tag.category && (
                                <p className="text-xs text-muted-foreground">
                                  {CATEGORY_LABELS[tag.category]?.replace(
                                    /^.+\s/,
                                    ""
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {tag.trending && (
                              <span
                                className="text-orange-500"
                                title="Trending"
                              >
                                🔥
                              </span>
                            )}
                            <span className="font-medium">
                              {tag.count} post{tag.count !== 1 ? "s" : ""}
                            </span>
                            <button
                              onClick={() => handleTagClick(tag)}
                              className="text-primary hover:text-primary/80 font-medium"
                            >
                              View →
                            </button>
                          </div>
                        </>
                      ) : (
                        <EnhancedTag
                          tag={tag}
                          variant={variant}
                          showCount={true}
                          interactive={true}
                          onClick={() => handleTagClick(tag)}
                          size="md"
                          className="w-full justify-center animate-fade-in-up"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mb-4">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto text-muted-foreground/50"
            >
              <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
              <circle cx="7" cy="7" r="1" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No tags found
          </h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters or search criteria
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => handleFilterChange({})}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TagList;
