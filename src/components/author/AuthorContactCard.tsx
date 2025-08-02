import React from "react";
import { cn } from "@utils/cn";
import { Avatar, AvatarImage, AvatarFallback } from "@components/ui/avatar";
import { Button } from "@components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@components/ui/card";
import socialIcons from "@assets/socialIcons";
import type { AuthorContactCardProps } from "./types";

/**
 * Contact-focused author profile card with CTAs and social integration
 * Optimized for lead generation and professional networking
 */
export default function AuthorContactCard({
  author,
  className,
  showEmail = true,
  showSocials = true,
  primaryCta = {
    text: "Schedule Consultation",
    href: `mailto:${author.email}?subject=Consultation Request`,
    variant: "default",
  },
  secondaryCta,
}: AuthorContactCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const activeSocials = author.socials.filter(social => social.active);

  return (
    <Card
      className={cn(
        "relative overflow-hidden max-w-md mx-auto",
        "bg-gradient-to-br from-card via-card to-card/80",
        "border-2 border-primary/20 shadow-xl shadow-primary/10",
        "hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1",
        "transition-all duration-500 ease-out",
        className
      )}
    >
      {/* Premium gradient border */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary p-[2px] rounded-xl">
        <div className="h-full w-full bg-card rounded-[10px]" />
      </div>

      {/* Content overlay */}
      <div className="relative">
        <CardHeader className="text-center pb-4">
          {/* Header background effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-t-xl" />

          <div className="relative space-y-4">
            {/* Avatar with premium styling */}
            <div className="relative mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-lg opacity-50 animate-pulse" />
              <Avatar className="relative h-20 w-20 border-4 border-background shadow-lg">
                <AvatarImage
                  src={author.avatar}
                  alt={author.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-xl">
                  {getInitials(author.name)}
                </AvatarFallback>
              </Avatar>

              {/* Online status */}
              <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 border-3 border-background rounded-full flex items-center justify-center">
                <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
              </div>
            </div>

            {/* Name and title */}
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">
                {author.name}
              </h3>
              <p className="text-sm font-medium text-primary">{author.title}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Contact info */}
          {showEmail && (
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 bg-muted/30">
                <div className="p-2 rounded-full bg-primary/10">
                  <svg
                    className="w-4 h-4 text-primary"
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
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground truncate">
                    {author.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Value proposition */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 text-primary text-xs font-medium">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Available for Projects</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Expert cybersecurity consulting • DevSecOps implementation •
              Security audits
            </p>
          </div>

          {/* Social links */}
          {showSocials && activeSocials.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground text-center">
                Connect on Social
              </p>
              <div className="flex justify-center space-x-3">
                {activeSocials.slice(0, 4).map(social => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/social relative"
                    aria-label={social.linkTitle}
                  >
                    <div
                      className="p-2.5 rounded-full border border-border/50 hover:border-primary/50 bg-background/50 hover:bg-primary/10 transition-all duration-300 group-hover/social:scale-110 group-hover/social:shadow-lg"
                      dangerouslySetInnerHTML={{
                        __html: socialIcons[social.name]?.replace(
                          'class="icon-tabler"',
                          'class="icon-tabler w-4 h-4 stroke-current text-muted-foreground group-hover/social:text-primary transition-colors duration-300"'
                        ),
                      }}
                    />

                    {/* Tooltip */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover/social:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-10">
                      {social.name}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="space-y-3 pt-6">
          {/* Primary CTA */}
          <Button
            asChild
            variant={primaryCta.variant}
            className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            <a href={primaryCta.href}>
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {primaryCta.text}
            </a>
          </Button>

          {/* Secondary CTA */}
          {secondaryCta && (
            <Button
              asChild
              variant={secondaryCta.variant || "outline"}
              className="w-full hover:-translate-y-0.5 transition-all duration-300"
            >
              <a href={secondaryCta.href}>
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
                    d="M7 8h10m0 0V18a2 2 0 01-2 2H9a2 2 0 01-2-2V8m5 0V3"
                  />
                </svg>
                {secondaryCta.text}
              </a>
            </Button>
          )}

          {/* Trust indicators */}
          <div className="flex items-center justify-center space-x-4 pt-2 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <svg
                className="w-3 h-3 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Verified Expert</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg
                className="w-3 h-3 text-primary"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              <span>Quick Response</span>
            </div>
          </div>
        </CardFooter>
      </div>
    </Card>
  );
}
