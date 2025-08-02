import React from "react";
import { cn } from "@utils/cn";
import { Avatar, AvatarImage, AvatarFallback } from "@components/ui/avatar";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { AnimatedCounter } from "@components/AnimatedCounter";
import socialIcons from "@assets/socialIcons";
import type { AuthorHeroProps } from "./types";

/**
 * Large author profile component for about page enhancement
 * Features animated stats, background effects, and comprehensive author showcase
 */
export default function AuthorHero({
  author,
  stats,
  className,
  showBackground = true,
  ctaText = "Let's Connect",
  onCtaClick,
}: AuthorHeroProps) {
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
    <section
      className={cn("relative py-16 lg:py-24 overflow-hidden", className)}
    >
      {/* Background effects */}
      {showBackground && (
        <>
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />

          {/* Animated grid */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(var(--primary),0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--primary),0.1)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
          </div>

          {/* Floating orbs */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </>
      )}

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              {/* Badge */}
              <Badge
                variant="secondary"
                className="bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-primary/30 px-4 py-2 text-sm font-medium"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>Available for Consulting</span>
                </div>
              </Badge>

              {/* Name and title */}
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                  Hi, I'm{" "}
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {author.name.split(" ")[0]}
                  </span>
                </h1>
                <h2 className="text-xl lg:text-2xl text-muted-foreground font-medium">
                  {author.title}
                </h2>
              </div>

              {/* Bio */}
              <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                {author.bio}
              </p>

              {/* Location and company */}
              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <svg
                    className="h-5 w-5"
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
                <div className="flex items-center space-x-2">
                  <svg
                    className="h-5 w-5"
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
            </div>

            {/* CTA and socials */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Button
                onClick={onCtaClick}
                asChild={!onCtaClick}
                size="lg"
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                {onCtaClick ? (
                  <span>{ctaText}</span>
                ) : (
                  <a href={`mailto:${author.email}`}>
                    <svg
                      className="w-5 h-5 mr-2"
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
                    {ctaText}
                  </a>
                )}
              </Button>

              {/* Social links */}
              <div className="flex space-x-4">
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
                          className="p-3 rounded-full border border-border/50 hover:border-primary/50 bg-background/50 hover:bg-primary/10 transition-all duration-300 group-hover/social:scale-110 group-hover/social:shadow-lg backdrop-blur-sm"
                          dangerouslySetInnerHTML={{
                            __html: socialIcons[
                              social.name as keyof typeof socialIcons
                            ]?.replace(
                              'class="icon-tabler"',
                              'class="icon-tabler w-5 h-5 stroke-current text-muted-foreground group-hover/social:text-primary transition-colors duration-300"'
                            ),
                          }}
                        />
                      </a>
                    )
                  )}
              </div>
            </div>
          </div>

          {/* Right column - Avatar and stats */}
          <div className="flex flex-col items-center space-y-8">
            {/* Avatar */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-2xl opacity-30 animate-pulse" />
              <Avatar className="relative h-48 w-48 lg:h-64 lg:w-64 border-8 border-background shadow-2xl">
                <AvatarImage
                  src={author.avatar}
                  alt={author.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-4xl lg:text-5xl">
                  {getInitials(author.name)}
                </AvatarFallback>
              </Avatar>

              {/* Status indicator */}
              <div className="absolute bottom-4 right-4 h-8 w-8 bg-green-500 border-4 border-background rounded-full flex items-center justify-center">
                <div className="h-3 w-3 bg-white rounded-full animate-pulse" />
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-6 w-full max-w-md">
              <div className="text-center p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="text-2xl lg:text-3xl font-bold text-primary mb-1">
                  <AnimatedCounter
                    end={parseInt(stats.experience)}
                    suffix="+"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Years Experience
                </div>
              </div>

              <div className="text-center p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="text-2xl lg:text-3xl font-bold text-primary mb-1">
                  <AnimatedCounter end={stats.clients} suffix="+" />
                </div>
                <div className="text-sm text-muted-foreground">
                  Happy Clients
                </div>
              </div>

              <div className="text-center p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="text-2xl lg:text-3xl font-bold text-primary mb-1">
                  <AnimatedCounter end={stats.projects} suffix="+" />
                </div>
                <div className="text-sm text-muted-foreground">
                  Projects Done
                </div>
              </div>

              {stats.certifications && (
                <div className="text-center p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
                  <div className="text-2xl lg:text-3xl font-bold text-primary mb-1">
                    <AnimatedCounter end={stats.certifications} />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Certifications
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
