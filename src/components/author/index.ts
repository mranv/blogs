// Author component barrel exports
export { default as AuthorCard } from "./AuthorCard";
export { default as AuthorBio } from "./AuthorBio";
export { default as AuthorHero } from "./AuthorHero";
export { default as AuthorContactCard } from "./AuthorContactCard";
export { default as AuthorStatsCard } from "./AuthorStatsCard";

// Export types
export type {
  AuthorInfo,
  AuthorStats,
  AuthorCardProps,
  AuthorBioProps,
  AuthorHeroProps,
  AuthorContactCardProps,
  AuthorStatsCardProps,
} from "./types";

// Author data utilities
import { SITE, SOCIALS } from "@config";
import type { AuthorInfo, AuthorStats } from "./types";

/**
 * Default author information based on site configuration
 */
export const defaultAuthorInfo: AuthorInfo = {
  name: SITE.author,
  title: "DevSecOps Engineer & Cybersecurity Expert",
  bio: SITE.desc,
  avatar: "/assets/gainsaheb.jpg",
  location: "Vadodara, Gujarat, India",
  company: "Infopercept Consulting",
  email: "iamanubhavgain@gmail.com",
  socials: SOCIALS,
};

/**
 * Default author statistics
 */
export const defaultAuthorStats: AuthorStats = {
  experience: "8+",
  clients: 150,
  projects: 200,
  certifications: 12,
  articles: 50,
};

/**
 * Utility function to create author data with overrides
 */
export function createAuthorInfo(
  overrides: Partial<AuthorInfo> = {}
): AuthorInfo {
  return {
    ...defaultAuthorInfo,
    ...overrides,
  };
}

/**
 * Utility function to create author stats with overrides
 */
export function createAuthorStats(
  overrides: Partial<AuthorStats> = {}
): AuthorStats {
  return {
    ...defaultAuthorStats,
    ...overrides,
  };
}
