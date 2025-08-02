import React, { useState } from "react";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { cn } from "@utils/cn";
import type { TagFilterProps, TagFilterOptions, TagCategory } from "./types";

// Category display names and colors using theme variables
const CATEGORY_CONFIG: Record<TagCategory, { label: string; color: string }> = {
  security: {
    label: "Security",
    color: "bg-destructive/10 text-destructive border-destructive/30",
  },
  compliance: {
    label: "Compliance",
    color: "bg-chart-4/10 text-chart-4 border-chart-4/30",
  },
  technology: {
    label: "Technology",
    color: "bg-primary/10 text-primary border-primary/30",
  },
  tools: {
    label: "Tools",
    color: "bg-chart-1/10 text-chart-1 border-chart-1/30",
  },
  infrastructure: {
    label: "Infrastructure",
    color: "bg-chart-2/10 text-chart-2 border-chart-2/30",
  },
  development: {
    label: "Development",
    color: "bg-chart-3/10 text-chart-3 border-chart-3/30",
  },
  rust: {
    label: "Rust",
    color: "bg-chart-5/10 text-chart-5 border-chart-5/30",
  },
  kubernetes: {
    label: "Kubernetes",
    color: "bg-primary/20 text-primary border-primary/40",
  },
  monitoring: {
    label: "Monitoring",
    color: "bg-accent/10 text-accent-foreground border-accent/30",
  },
  automation: {
    label: "Automation",
    color: "bg-secondary/10 text-secondary-foreground border-secondary/30",
  },
  networking: {
    label: "Networking",
    color: "bg-muted/10 text-muted-foreground border-muted/30",
  },
  "ai-ml": {
    label: "AI/ML",
    color: "bg-chart-4/10 text-chart-4 border-chart-4/30",
  },
  general: {
    label: "General",
    color: "bg-muted/10 text-muted-foreground border-muted/30",
  },
};

const SORT_OPTIONS = [
  { value: "count", label: "Post Count" },
  { value: "name", label: "Name" },
  { value: "popularity", label: "Popularity" },
  { value: "recent", label: "Recently Used" },
] as const;

export function TagFilter({
  options,
  availableCategories,
  onFilterChange,
  showAdvanced = true,
  className,
}: TagFilterProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [localOptions, setLocalOptions] = useState<TagFilterOptions>(options);

  const handleOptionChange = (updates: Partial<TagFilterOptions>) => {
    const newOptions = { ...localOptions, ...updates };
    setLocalOptions(newOptions);
    onFilterChange(newOptions);
  };

  const handleCategoryToggle = (category: TagCategory) => {
    const currentCategories = localOptions.categories || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category];

    handleOptionChange({ categories: newCategories });
  };

  const handleReset = () => {
    const resetOptions: TagFilterOptions = {
      categories: [],
      minCount: undefined,
      sortBy: "count",
      sortOrder: "desc",
      search: "",
      showTrending: false,
    };
    setLocalOptions(resetOptions);
    onFilterChange(resetOptions);
  };

  const activeFiltersCount = [
    localOptions.categories?.length || 0,
    localOptions.minCount ? 1 : 0,
    localOptions.search ? 1 : 0,
    localOptions.showTrending ? 1 : 0,
  ].reduce((sum, count) => sum + count, 0);

  return (
    <div className={cn("space-y-4 p-4 bg-card rounded-lg border", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          Filter Tags
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </h3>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Search Tags
        </label>
        <Input
          type="text"
          placeholder="Search tags..."
          value={localOptions.search || ""}
          onChange={e => handleOptionChange({ search: e.target.value })}
          className="w-full"
        />
      </div>

      {/* Category Filters */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Categories
        </label>
        <div className="flex flex-wrap gap-2">
          {availableCategories.map(category => {
            const config = CATEGORY_CONFIG[category];
            const isSelected =
              localOptions.categories?.includes(category) || false;

            return (
              <button
                key={category}
                onClick={() => handleCategoryToggle(category)}
                className={cn(
                  "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium",
                  "border transition-all duration-200 hover:scale-105",
                  isSelected
                    ? cn(config.color, "ring-2 ring-current/20")
                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() =>
            handleOptionChange({ showTrending: !localOptions.showTrending })
          }
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
            "border transition-all duration-200 hover:scale-105",
            localOptions.showTrending
              ? "bg-gradient-to-r from-orange-500/10 to-red-500/10 text-orange-600 border-orange-500/30"
              : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
          )}
        >
          <span className="text-xs">🔥</span>
          Trending Only
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn(
                "transition-transform",
                isAdvancedOpen && "rotate-90"
              )}
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
            Advanced Filters
          </Button>

          {isAdvancedOpen && (
            <div className="space-y-4 pl-4 border-l-2 border-muted">
              {/* Minimum Count */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Minimum Post Count
                </label>
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g., 5"
                  value={localOptions.minCount || ""}
                  onChange={e =>
                    handleOptionChange({
                      minCount: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>

              {/* Sort Options */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Sort By
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={localOptions.sortBy || "count"}
                    onChange={e =>
                      handleOptionChange({ sortBy: e.target.value as any })
                    }
                    className="px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm"
                  >
                    {SORT_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={localOptions.sortOrder || "desc"}
                    onChange={e =>
                      handleOptionChange({
                        sortOrder: e.target.value as "asc" | "desc",
                      })
                    }
                    className="px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter Summary */}
      {activeFiltersCount > 0 && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {activeFiltersCount}
            </span>{" "}
            filter{activeFiltersCount !== 1 ? "s" : ""} active
            {localOptions.categories && localOptions.categories.length > 0 && (
              <>
                {" • "}
                <span className="font-medium">Categories:</span>{" "}
                {localOptions.categories.length}
              </>
            )}
            {localOptions.minCount && (
              <>
                {" • "}
                <span className="font-medium">Min count:</span>{" "}
                {localOptions.minCount}
              </>
            )}
            {localOptions.search && (
              <>
                {" • "}
                <span className="font-medium">Search:</span> "
                {localOptions.search}"
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

export default TagFilter;
