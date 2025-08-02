import type { SocialObjects } from "@/types";

export interface AuthorInfo {
  name: string;
  title: string;
  bio: string;
  avatar: string;
  location: string;
  company: string;
  email: string;
  socials: SocialObjects;
}

export interface AuthorStats {
  experience: string;
  clients: number;
  projects: number;
  certifications?: number;
  articles?: number;
}

export interface AuthorCardProps {
  author: AuthorInfo;
  stats?: AuthorStats;
  className?: string;
  variant?: "default" | "compact" | "detailed";
  showSocials?: boolean;
  showStats?: boolean;
  showContact?: boolean;
}

export interface AuthorBioProps {
  author: Pick<AuthorInfo, "name" | "title" | "bio" | "avatar">;
  className?: string;
  variant?: "inline" | "compact" | "full";
  showAvatar?: boolean;
  maxBioLength?: number;
}

export interface AuthorHeroProps {
  author: AuthorInfo;
  stats: AuthorStats;
  className?: string;
  showBackground?: boolean;
  ctaText?: string;
  onCtaClick?: () => void;
}

export interface AuthorContactCardProps {
  author: Pick<AuthorInfo, "name" | "title" | "email" | "socials" | "avatar">;
  className?: string;
  showEmail?: boolean;
  showSocials?: boolean;
  primaryCta?: {
    text: string;
    href: string;
    variant?: "default" | "outline" | "corporate";
  };
  secondaryCta?: {
    text: string;
    href: string;
    variant?: "default" | "outline" | "corporate";
  };
}

export interface AuthorStatsCardProps {
  stats: AuthorStats;
  className?: string;
  variant?: "grid" | "horizontal" | "vertical";
  showIcons?: boolean;
  animated?: boolean;
}
