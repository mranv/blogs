import React from "react";
import { cn } from "@utils/cn";
import { Avatar, AvatarImage, AvatarFallback } from "@components/ui/avatar";
import { Button } from "@components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import socialIcons from "@assets/socialIcons";
import type { AuthorCardProps } from "./types";

/**
 * Main author profile card component with Avatar, bio, and social links
 * Features professional styling with cybersecurity theme and hover animations
 */
export default function AuthorCard({
  author,
  stats,
  className,
  variant = "default",
  showSocials = true,
  showStats = true,
  showContact = true,
}: AuthorCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const activeSocials = author.socials.filter(
    (social: { active: boolean }) => social.active
  );

  return (
    <Card
      className={cn(
        "group relative overflow-hidden",
        "bg-gradient-to-br from-background via-background to-background/50",
        "border-2 border-border/50 hover:border-primary/30",
        "shadow-lg hover:shadow-xl hover:shadow-primary/10",
        "transition-all duration-500 ease-out",
        "hover:-translate-y-2 hover:scale-[1.02]",
        variant === "compact" && "max-w-sm",
        variant === "detailed" && "max-w-2xl",
        className
      )}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Cybersecurity accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary animate-pulse" />

      <CardHeader className="relative text-center pb-4">
        <div className="flex flex-col items-center space-y-4">
          {/* Avatar with glow effect */}
          <div className="relative">
            <Avatar
              className={cn(
                "transition-all duration-300 border-4 border-background shadow-lg",
                "group-hover:border-primary/30 group-hover:shadow-primary/20",
                variant === "compact" ? "h-16 w-16" : "h-24 w-24"
              )}
            >
              <AvatarImage
                src={author.avatar}
                alt={author.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-lg">
                {getInitials(author.name)}
              </AvatarFallback>
            </Avatar>

            {/* Online indicator */}
            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-background rounded-full animate-pulse" />
          </div>

          {/* Name and title */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
              {author.name}
            </h3>
            <Badge
              variant="secondary"
              className="bg-gradient-to-r from-primary/10 to-accent/10 text-primary border-primary/20"
            >
              {author.title}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* Bio */}
        {variant !== "compact" && (
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            {author.bio.length > 120
              ? `${author.bio.slice(0, 120)}...`
              : author.bio}
          </p>
        )}

        {/* Location and company */}
        <div className="flex flex-col space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-center space-x-2">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>{author.location}</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <span>{author.company}</span>
          </div>
        </div>

        {/* Stats */}
        {showStats && stats && variant !== "compact" && (
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
            <div className="text-center">
              <div className="text-lg font-bold text-primary">
                {stats.experience}
              </div>
              <div className="text-xs text-muted-foreground">Experience</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-primary">
                {stats.clients}+
              </div>
              <div className="text-xs text-muted-foreground">Clients</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-primary">
                {stats.projects}+
              </div>
              <div className="text-xs text-muted-foreground">Projects</div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Social links and contact */}
      {(showSocials || showContact) && (
        <CardFooter className="relative flex flex-col space-y-4 pt-4 border-t border-border/50">
          {/* Social links */}
          {showSocials && activeSocials.length > 0 && (
            <div className="flex justify-center space-x-3">
              {activeSocials
                .slice(0, 4)
                .map(
                  (social: {
                    name: keyof typeof socialIcons;
                    href: string;
                    linkTitle: string;
                  }) => (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/social relative"
                      aria-label={social.linkTitle}
                    >
                      <div
                        className="p-2 rounded-full bg-muted hover:bg-primary/10 transition-all duration-300 group-hover/social:scale-110 group-hover/social:shadow-lg"
                        dangerouslySetInnerHTML={{
                          __html: socialIcons[
                            social.name as keyof typeof socialIcons
                          ]?.replace(
                            'class="icon-tabler"',
                            'class="icon-tabler w-4 h-4 stroke-current text-muted-foreground group-hover/social:text-primary transition-colors duration-300"'
                          ),
                        }}
                      />

                      {/* Tooltip */}
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover/social:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                        {social.name}
                      </div>
                    </a>
                  )
                )}
            </div>
          )}

          {/* Contact button */}
          {showContact && (
            <Button
              asChild
              variant="default"
              className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <a href={`mailto:${author.email}`}>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Get in Touch
              </a>
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
