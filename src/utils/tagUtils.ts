import type { CollectionEntry } from "astro:content";
import { slugifyStr } from "./slugify";
import postFilter from "./postFilter";
import type {
  Tag,
  TagWithStats,
  TagCategory,
  TagFilterOptions,
  TagAnalytics,
} from "@components/tags/types";

// Tag category mappings based on common cybersecurity and tech terms
const TAG_CATEGORIES: Record<string, TagCategory> = {
  // Security terms
  security: "security",
  cybersecurity: "security",
  encryption: "security",
  authentication: "security",
  authorization: "security",
  vulnerability: "security",
  threat: "security",
  malware: "security",
  "zero-trust": "security",
  compliance: "compliance",
  cis: "compliance",
  gdpr: "compliance",
  soc: "compliance",
  pci: "compliance",

  // Technology stacks
  rust: "rust",
  kubernetes: "kubernetes",
  k8s: "kubernetes",
  docker: "infrastructure",
  podman: "infrastructure",
  containers: "infrastructure",
  microservices: "infrastructure",

  // Tools and platforms
  wazuh: "tools",
  opensearch: "tools",
  elasticsearch: "tools",
  ansible: "automation",
  terraform: "automation",
  helm: "tools",
  grafana: "monitoring",
  prometheus: "monitoring",
  netdata: "monitoring",

  // Development
  api: "development",
  rest: "development",
  graphql: "development",
  database: "development",
  sql: "development",
  nosql: "development",

  // Infrastructure
  cloud: "infrastructure",
  aws: "infrastructure",
  azure: "infrastructure",
  gcp: "infrastructure",
  linux: "infrastructure",
  windows: "infrastructure",
  macos: "infrastructure",

  // Networking
  dns: "networking",
  ssl: "networking",
  tls: "networking",
  vpn: "networking",
  firewall: "networking",

  // AI/ML
  ai: "ai-ml",
  ml: "ai-ml",
  tensorflow: "ai-ml",
  pytorch: "ai-ml",
  "machine-learning": "ai-ml",
  "artificial-intelligence": "ai-ml",
};

// Cybersecurity color scheme
const CYBERSECURITY_COLORS: Record<TagCategory, string> = {
  security: "#dc2626", // Red
  compliance: "#7c3aed", // Purple
  technology: "hsl(var(--primary))", // Primary theme color
  tools: "#059669", // Green
  infrastructure: "#ea580c", // Orange
  development: "#0891b2", // Cyan
  rust: "#f97316", // Orange
  kubernetes: "hsl(var(--primary))", // Primary theme color
  monitoring: "#84cc16", // Lime
  automation: "#8b5cf6", // Violet
  networking: "#06b6d4", // Cyan
  "ai-ml": "#ec4899", // Pink
  general: "#6b7280", // Gray
};

export function categorizeTag(tagName: string): TagCategory {
  const normalizedTag = tagName.toLowerCase().replace(/[-_\s]/g, "");

  // Direct match
  if (TAG_CATEGORIES[normalizedTag]) {
    return TAG_CATEGORIES[normalizedTag];
  }

  // Partial match for compound terms
  for (const [key, category] of Object.entries(TAG_CATEGORIES)) {
    if (normalizedTag.includes(key) || key.includes(normalizedTag)) {
      return category;
    }
  }

  return "general";
}

export function getTagColor(category: TagCategory): string {
  return CYBERSECURITY_COLORS[category] || CYBERSECURITY_COLORS.general;
}

export function getTagsWithStats(
  posts: CollectionEntry<"blog">[]
): TagWithStats[] {
  const tagCounts = new Map<string, number>();
  const tagLastUsed = new Map<string, Date>();

  // Count tag occurrences and track last used dates
  posts.filter(postFilter).forEach(post => {
    const postDate = new Date(post.data.modDatetime || post.data.pubDatetime);
    post.data.tags?.forEach(tag => {
      const normalizedTag = tag.toLowerCase();
      tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);

      const existingDate = tagLastUsed.get(normalizedTag);
      if (!existingDate || postDate > existingDate) {
        tagLastUsed.set(normalizedTag, postDate);
      }
    });
  });

  // Convert to TagWithStats array
  const tags: TagWithStats[] = Array.from(tagCounts.entries()).map(
    ([tagName, count]) => {
      const tag = slugifyStr(tagName);
      const category = categorizeTag(tagName);
      const maxCount = Math.max(...tagCounts.values());
      const popularity = count / maxCount;
      const lastUsed = tagLastUsed.get(tagName);

      // Determine if trending (used in last 30 days and has decent popularity)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const trending = lastUsed
        ? lastUsed > thirtyDaysAgo && popularity > 0.3
        : false;

      return {
        tag,
        tagName,
        count,
        category,
        popularity,
        color: getTagColor(category),
        trending,
        lastUsed,
        relatedTags: getRelatedTags(tagName, tagCounts),
      };
    }
  );

  return tags.sort((a, b) => b.count - a.count);
}

function getRelatedTags(
  targetTag: string,
  tagCounts: Map<string, number>
): string[] {
  const related: string[] = [];
  const targetCategory = categorizeTag(targetTag);

  // Find tags in the same category
  for (const [tag] of tagCounts) {
    if (tag !== targetTag && categorizeTag(tag) === targetCategory) {
      related.push(tag);
    }
  }

  return related.slice(0, 5); // Limit to 5 related tags
}

export function filterTags(
  tags: TagWithStats[],
  options: TagFilterOptions
): TagWithStats[] {
  let filtered = [...tags];

  // Filter by categories
  if (options.categories && options.categories.length > 0) {
    filtered = filtered.filter(tag =>
      options.categories!.includes(tag.category || "general")
    );
  }

  // Filter by minimum count
  if (options.minCount && options.minCount > 0) {
    filtered = filtered.filter(tag => tag.count >= options.minCount!);
  }

  // Filter by search term
  if (options.search) {
    const searchLower = options.search.toLowerCase();
    filtered = filtered.filter(
      tag =>
        tag.tagName.toLowerCase().includes(searchLower) ||
        tag.tag.toLowerCase().includes(searchLower)
    );
  }

  // Filter trending only
  if (options.showTrending) {
    filtered = filtered.filter(tag => tag.trending);
  }

  // Sort
  const sortBy = options.sortBy || "count";
  const sortOrder = options.sortOrder || "desc";

  filtered.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "name":
        comparison = a.tagName.localeCompare(b.tagName);
        break;
      case "count":
        comparison = a.count - b.count;
        break;
      case "popularity":
        comparison = a.popularity - b.popularity;
        break;
      case "recent":
        if (a.lastUsed && b.lastUsed) {
          comparison = a.lastUsed.getTime() - b.lastUsed.getTime();
        } else if (a.lastUsed) {
          comparison = 1;
        } else if (b.lastUsed) {
          comparison = -1;
        }
        break;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  return filtered;
}

export function getTagAnalytics(
  tags: TagWithStats[],
  posts: CollectionEntry<"blog">[]
): TagAnalytics {
  const totalPosts = posts.filter(postFilter).length;
  const totalTagInstances = tags.reduce((sum, tag) => sum + tag.count, 0);

  // Category distribution
  const categoryDistribution: Record<TagCategory, number> = {
    security: 0,
    compliance: 0,
    technology: 0,
    tools: 0,
    infrastructure: 0,
    development: 0,
    rust: 0,
    kubernetes: 0,
    monitoring: 0,
    automation: 0,
    networking: 0,
    "ai-ml": 0,
    general: 0,
  };

  tags.forEach(tag => {
    const category = tag.category || "general";
    categoryDistribution[category] += tag.count;
  });

  return {
    totalTags: tags.length,
    averageTagsPerPost: totalTagInstances / totalPosts,
    mostPopularTags: tags.slice(0, 10),
    trendingTags: tags.filter(tag => tag.trending).slice(0, 10),
    categoryDistribution,
    recentlyUsedTags: tags
      .filter(tag => tag.lastUsed)
      .sort((a, b) => b.lastUsed!.getTime() - a.lastUsed!.getTime())
      .slice(0, 10),
  };
}

export function calculateTagSize(
  popularity: number
): "xs" | "sm" | "md" | "lg" | "xl" {
  if (popularity >= 0.8) return "xl";
  if (popularity >= 0.6) return "lg";
  if (popularity >= 0.4) return "md";
  if (popularity >= 0.2) return "sm";
  return "xs";
}

export function getTagVariantByCategory(
  category: TagCategory
):
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "cybersecurity"
  | "professional" {
  switch (category) {
    case "security":
    case "compliance":
      return "destructive";
    case "rust":
    case "tools":
      return "cybersecurity";
    case "infrastructure":
    case "kubernetes":
      return "default";
    case "development":
    case "technology":
      return "professional";
    default:
      return "secondary";
  }
}

// Legacy compatibility function
export function getUniqueTags(posts: CollectionEntry<"blog">[]): Tag[] {
  return getTagsWithStats(posts).map(
    ({
      relatedTags: _relatedTags,
      trending: _trending,
      lastUsed: _lastUsed,
      ...tag
    }) => tag
  );
}
