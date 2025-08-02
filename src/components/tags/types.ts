export interface Tag {
  tag: string;
  tagName: string;
  count?: number;
  category?: TagCategory;
  popularity?: number;
  color?: string;
  description?: string;
}

export interface TagWithStats extends Tag {
  count: number;
  popularity: number;
  relatedTags?: string[];
  trending?: boolean;
  lastUsed?: Date;
}

export type TagCategory =
  | "security"
  | "technology"
  | "tools"
  | "infrastructure"
  | "development"
  | "rust"
  | "kubernetes"
  | "monitoring"
  | "automation"
  | "networking"
  | "ai-ml"
  | "compliance"
  | "general";

export interface TagFilterOptions {
  categories?: TagCategory[];
  minCount?: number;
  sortBy?: "name" | "count" | "popularity" | "recent";
  sortOrder?: "asc" | "desc";
  search?: string;
  showTrending?: boolean;
}

export interface TagCloudConfig {
  minFontSize?: number;
  maxFontSize?: number;
  colorScheme?: "default" | "cybersecurity" | "professional" | "rainbow";
  layout?: "packed" | "grid" | "circular";
  interactive?: boolean;
  showCount?: boolean;
}

export interface TagAnalytics {
  totalTags: number;
  averageTagsPerPost: number;
  mostPopularTags: TagWithStats[];
  trendingTags: TagWithStats[];
  categoryDistribution: Record<TagCategory, number>;
  recentlyUsedTags: TagWithStats[];
}

export type TagSize = "xs" | "sm" | "md" | "lg" | "xl";
export type TagVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "cybersecurity"
  | "professional";

export interface EnhancedTagProps {
  tag: Tag | TagWithStats;
  size?: TagSize;
  variant?: TagVariant;
  showCount?: boolean;
  interactive?: boolean;
  removable?: boolean;
  onClick?: (tag: Tag) => void;
  onRemove?: (tag: Tag) => void;
  className?: string;
}

export interface TagListProps {
  tags: (Tag | TagWithStats)[];
  filterOptions?: TagFilterOptions;
  showFilters?: boolean;
  groupByCategory?: boolean;
  sortable?: boolean;
  searchable?: boolean;
  className?: string;
  onTagClick?: (tag: Tag) => void;
  onFilterChange?: (options: TagFilterOptions) => void;
}

export interface TagCloudProps {
  tags: TagWithStats[];
  config?: TagCloudConfig;
  maxTags?: number;
  className?: string;
  onTagClick?: (tag: TagWithStats) => void;
}

export interface PopularTagsProps {
  tags: TagWithStats[];
  maxTags?: number;
  showTrending?: boolean;
  showStats?: boolean;
  className?: string;
  onTagClick?: (tag: TagWithStats) => void;
}

export interface TagFilterProps {
  options: TagFilterOptions;
  availableCategories: TagCategory[];
  onFilterChange: (options: TagFilterOptions) => void;
  showAdvanced?: boolean;
  className?: string;
}
