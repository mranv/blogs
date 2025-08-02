// Enhanced Tag Components
export { EnhancedTag } from "./EnhancedTag";
export { TagCloud } from "./TagCloud";
export { TagFilter } from "./TagFilter";
export { TagList } from "./TagList";
export { PopularTags } from "./PopularTags";

// Types
export type {
  Tag,
  TagWithStats,
  TagCategory,
  TagFilterOptions,
  TagCloudConfig,
  TagAnalytics,
  TagSize,
  TagVariant,
  EnhancedTagProps,
  TagListProps,
  TagCloudProps,
  PopularTagsProps,
  TagFilterProps,
} from "./types";

// Re-export commonly used utilities
export {
  getTagsWithStats,
  filterTags,
  getTagAnalytics,
  categorizeTag,
  getTagColor,
  calculateTagSize,
  getTagVariantByCategory,
  getUniqueTags, // For backward compatibility
} from "@utils/tagUtils";

// Default exports for convenience
export { default as EnhancedTagComponent } from "./EnhancedTag";
export { default as TagCloudComponent } from "./TagCloud";
export { default as TagFilterComponent } from "./TagFilter";
export { default as TagListComponent } from "./TagList";
export { default as PopularTagsComponent } from "./PopularTags";
