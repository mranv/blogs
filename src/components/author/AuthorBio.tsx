import React from "react";
import { cn } from "@utils/cn";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { AuthorBioProps } from "./types";

/**
 * Compact author bio component for post headers/footers
 * Features responsive design and configurable content length
 */
export default function AuthorBio({
  author,
  className,
  variant = "full",
  showAvatar = true,
  maxBioLength = 150,
}: AuthorBioProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const truncatedBio =
    author.bio.length > maxBioLength
      ? `${author.bio.slice(0, maxBioLength)}...`
      : author.bio;

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center space-x-3", className)}>
        {showAvatar && (
          <Avatar className="h-8 w-8 border-2 border-border/50">
            <AvatarImage src={author.avatar} alt={author.name} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary text-sm font-medium">
              {getInitials(author.name)}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline space-x-2">
            <span className="font-medium text-foreground text-sm">
              {author.name}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground truncate">
              {author.title}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-start space-x-4 p-4 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm",
          className
        )}
      >
        {showAvatar && (
          <Avatar className="h-12 w-12 border-2 border-border/50 shadow-sm">
            <AvatarImage src={author.avatar} alt={author.name} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-medium">
              {getInitials(author.name)}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <h4 className="font-semibold text-foreground">{author.name}</h4>
            <p className="text-sm text-muted-foreground">{author.title}</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {truncatedBio}
          </p>
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6",
        "p-6 rounded-xl border border-border/50 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm",
        "shadow-sm hover:shadow-md transition-shadow duration-300",
        className
      )}
    >
      {showAvatar && (
        <div className="flex-shrink-0">
          <Avatar className="h-16 w-16 border-4 border-background shadow-lg">
            <AvatarImage
              src={author.avatar}
              alt={author.name}
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold text-lg">
              {getInitials(author.name)}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      <div className="flex-1 min-w-0 space-y-3">
        <div className="space-y-1">
          <h4 className="text-lg font-bold text-foreground">{author.name}</h4>
          <p className="text-sm font-medium text-primary">{author.title}</p>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {truncatedBio}
        </p>

        {/* Author signature */}
        <div className="flex items-center space-x-2 pt-2 border-t border-border/30">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-muted-foreground font-medium">
            Written by {author.name}
          </span>
        </div>
      </div>
    </div>
  );
}
