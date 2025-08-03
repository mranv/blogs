import React from "react";
import { EnhancedTag } from "./EnhancedTag";
import { cn } from "@utils/cn";
import { calculateTagSize, getTagVariantByCategory } from "@utils/tagUtils";
import type { TagCloudProps, TagWithStats, Tag } from "./types";

export function TagCloud({
  tags,
  config = {},
  maxTags = 50,
  className,
  onTagClick,
}: TagCloudProps) {
  const {
    minFontSize = 12,
    maxFontSize = 24,
    colorScheme = "cybersecurity",
    layout = "packed",
    interactive = true,
    showCount = true,
  } = config;

  // Limit and sort tags by popularity
  const displayTags = tags
    .slice(0, maxTags)
    .sort((a, b) => b.popularity - a.popularity);

  if (displayTags.length === 0) {
    return (
      <div className={cn("text-center text-muted-foreground py-8", className)}>
        <p>No tags to display</p>
      </div>
    );
  }

  // Calculate font sizes based on popularity
  const getTagStyle = (tag: TagWithStats) => {
    const fontSize = minFontSize + (maxFontSize - minFontSize) * tag.popularity;
    return {
      fontSize: `${fontSize}px`,
      "--tag-opacity": Math.max(0.6, tag.popularity),
    } as React.CSSProperties;
  };

  const getLayoutClasses = () => {
    switch (layout) {
      case "grid":
        return "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2";
      case "circular":
        return "flex flex-wrap justify-center items-center";
      case "packed":
      default:
        return "flex flex-wrap justify-center items-center gap-1";
    }
  };

  const getColorSchemeClasses = () => {
    switch (colorScheme) {
      case "professional":
        return "tag-cloud--professional";
      case "rainbow":
        return "tag-cloud--rainbow";
      case "cybersecurity":
      default:
        return "tag-cloud--cybersecurity";
    }
  };

  return (
    <div
      className={cn(
        "tag-cloud relative p-4 rounded-lg",
        "bg-gradient-to-br from-background/50 to-muted/20",
        "border border-border/50 backdrop-blur-sm",
        getColorSchemeClasses(),
        className
      )}
    >
      {/* Header */}
      <div className="mb-4 text-center">
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Tag Cloud
        </h3>
        <p className="text-sm text-muted-foreground">
          {displayTags.length} most popular tags
        </p>
      </div>

      {/* Tag Cloud Container */}
      <div
        className={cn(
          "tag-cloud__container",
          getLayoutClasses(),
          layout === "circular" && "min-h-[300px]"
        )}
      >
        {displayTags.map((tag, index) => {
          const dynamicSize = calculateTagSize(tag.popularity);
          const variant = getTagVariantByCategory(tag.category || "general");

          return (
            <div
              key={tag.tag}
              className={cn(
                "tag-cloud__item transition-all duration-300 hover:z-10",
                layout === "circular" && "absolute",
                `animate-fade-in-up delay-${Math.min(index * 50, 1000)}`
              )}
              style={{
                ...getTagStyle(tag),
                ...(layout === "circular" &&
                  getCircularPosition(index, displayTags.length)),
                animationDelay: `${index * 50}ms`,
              }}
            >
              <EnhancedTag
                tag={tag}
                size={dynamicSize}
                variant={variant}
                showCount={showCount}
                interactive={interactive}
                onClick={onTagClick as ((tag: Tag) => void) | undefined}
                className={cn(
                  "transition-all duration-300 hover:shadow-lg",
                  "hover:scale-110 hover:-translate-y-1",
                  colorScheme === "rainbow" && `rainbow-tag-${index % 6}`
                )}
              />
            </div>
          );
        })}
      </div>

      {/* Floating particles effect for cybersecurity theme */}
      {colorScheme === "cybersecurity" && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "absolute w-1 h-1 bg-red-500/30 rounded-full",
                "animate-float-particle"
              )}
              style={{
                left: `${20 + i * 30}%`,
                animationDelay: `${i * 2}s`,
                animationDuration: `${4 + i}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Helper function for circular layout positioning
function getCircularPosition(index: number, total: number) {
  const radius = 120;
  const angle = (index / total) * 2 * Math.PI;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;

  return {
    left: `calc(50% + ${x}px)`,
    top: `calc(50% + ${y}px)`,
    transform: "translate(-50%, -50%)",
  };
}

export default TagCloud;

// CSS-in-JS styles for animations (to be added to global CSS)
export const tagCloudStyles = `
  .tag-cloud--cybersecurity {
    background: linear-gradient(135deg, 
      rgba(220, 38, 38, 0.05) 0%, 
      rgba(239, 68, 68, 0.03) 50%, 
      rgba(248, 113, 113, 0.02) 100%);
  }
  
  .tag-cloud--professional {
    background: linear-gradient(135deg, 
      hsl(var(--primary) / 0.05) 0%, 
      hsl(var(--primary) / 0.03) 50%, 
      hsl(var(--primary) / 0.02) 100%);
  }
  
    .tag-cloud--rainbow .rainbow-tag-0 { --tag-color: hsl(var(--destructive)); }
  .tag-cloud--rainbow .rainbow-tag-1 { --tag-color: hsl(var(--chart-1)); }
  .tag-cloud--rainbow .rainbow-tag-2 { --tag-color: hsl(var(--chart-2)); }
  .tag-cloud--rainbow .rainbow-tag-3 { --tag-color: hsl(var(--chart-3)); }
  .tag-cloud--rainbow .rainbow-tag-4 { --tag-color: hsl(var(--primary)); }
  .tag-cloud--rainbow .rainbow-tag-5 { --tag-color: hsl(var(--chart-4)); }
  
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes float-particle {
    0%, 100% {
      transform: translateY(0px);
      opacity: 0.3;
    }
    50% {
      transform: translateY(-20px);
      opacity: 0.8;
    }
  }
  
  .animate-fade-in-up {
    animation: fade-in-up 0.6s ease-out forwards;
    opacity: 0;
  }
  
  .animate-float-particle {
    animation: float-particle 4s ease-in-out infinite;
  }
`;
