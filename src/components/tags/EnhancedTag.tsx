import React from "react";
import { Badge, badgeVariants } from "@components/ui/badge";
import { cn } from "@utils/cn";
import type { EnhancedTagProps, TagSize, TagVariant } from "./types";

// Size mappings for enhanced visual hierarchy
const tagSizes: Record<TagSize, string> = {
  xs: "text-xs px-2 py-0.5 min-h-[20px]",
  sm: "text-sm px-2.5 py-0.5 min-h-[24px]",
  md: "text-sm px-3 py-1 min-h-[28px]",
  lg: "text-base px-3.5 py-1.5 min-h-[32px]",
  xl: "text-lg px-4 py-2 min-h-[36px]",
};

// Enhanced variants for cybersecurity theme
const enhancedVariants = {
  cybersecurity:
    "border-transparent bg-gradient-to-r from-red-500/10 to-orange-500/10 text-red-600 hover:from-red-500/20 hover:to-orange-500/20 border border-red-500/30 hover:border-red-500/50 shadow-sm hover:shadow-md hover:shadow-red-500/20",
  professional:
    "border-transparent bg-gradient-to-r from-primary/10 to-primary/20 text-primary hover:from-primary/20 hover:to-primary/30 border border-primary/30 hover:border-primary/50 shadow-sm hover:shadow-md hover:shadow-primary/20",
} as const;

// Dark mode variants
const darkModeVariants = {
  cybersecurity:
    "dark:text-red-400 dark:from-red-400/15 dark:to-orange-400/15 dark:hover:from-red-400/25 dark:hover:to-orange-400/25 dark:border-red-400/40 dark:hover:border-red-400/60 dark:hover:shadow-red-400/25",
  professional:
    "dark:text-primary/80 dark:from-primary/15 dark:to-primary/25 dark:hover:from-primary/25 dark:hover:to-primary/35 dark:border-primary/40 dark:hover:border-primary/60 dark:hover:shadow-primary/25",
} as const;

export function EnhancedTag({
  tag,
  size = "sm",
  variant = "default",
  showCount = false,
  interactive = true,
  removable = false,
  onClick,
  onRemove,
  className,
  ...props
}: EnhancedTagProps) {
  const isClickable = interactive && (onClick || tag.tag);
  const tagStats = "count" in tag ? tag : null;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick(tag);
    } else if (isClickable && tag.tag) {
      // Default navigation to tag page
      window.location.href = `/tags/${tag.tag}/`;
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRemove) {
      onRemove(tag);
    }
  };

  const baseClasses = cn(
    "inline-flex items-center gap-1.5 font-medium transition-all duration-300 ease-in-out",
    "hover:scale-105 active:scale-95",
    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
    tagSizes[size],
    isClickable && "cursor-pointer select-none",
    !isClickable && "cursor-default"
  );

  const variantClasses = cn(
    variant === "cybersecurity" && enhancedVariants.cybersecurity,
    variant === "professional" && enhancedVariants.professional,
    variant === "cybersecurity" && darkModeVariants.cybersecurity,
    variant === "professional" && darkModeVariants.professional
  );

  const badgeContent = (
    <>
      {/* Tag icon */}
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 opacity-70 transition-opacity duration-200 hover:opacity-100"
        aria-hidden="true"
      >
        <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
        <circle cx="7" cy="7" r="1" />
      </svg>

      {/* Tag name */}
      <span className="truncate">{tag.tagName}</span>

      {/* Count badge */}
      {showCount && tagStats && (
        <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] text-xs font-bold bg-current/20 text-current rounded-full px-1">
          {tagStats.count}
        </span>
      )}

      {/* Trending indicator */}
      {tagStats?.trending && (
        <span className="ml-0.5 text-xs" title="Trending tag">
          🔥
        </span>
      )}

      {/* Remove button */}
      {removable && (
        <button
          onClick={handleRemove}
          className="ml-1 p-0.5 rounded-full hover:bg-current/20 transition-colors duration-200"
          title="Remove tag"
          aria-label={`Remove ${tag.tagName} tag`}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </>
  );

  // Handle enhanced variants
  if (variant === "cybersecurity" || variant === "professional") {
    return (
      <span
        className={cn(
          baseClasses,
          variantClasses,
          "relative overflow-hidden",
          className
        )}
        onClick={isClickable ? handleClick : undefined}
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={
          isClickable
            ? e => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClick(e as any);
                }
              }
            : undefined
        }
        title={
          tagStats ? `${tag.tagName} (${tagStats.count} posts)` : tag.tagName
        }
        {...props}
      >
        {/* Animated background gradient */}
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />

        {/* Content */}
        <span className="relative z-10 flex items-center gap-1.5">
          {badgeContent}
        </span>
      </span>
    );
  }

  // Standard shadcn Badge variants
  return (
    <Badge
      variant={variant as any}
      className={cn(baseClasses, className)}
      onClick={isClickable ? handleClick : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? e => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick(e as any);
              }
            }
          : undefined
      }
      title={
        tagStats ? `${tag.tagName} (${tagStats.count} posts)` : tag.tagName
      }
      {...props}
    >
      {badgeContent}
    </Badge>
  );
}

export default EnhancedTag;
