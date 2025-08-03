import React from "react";
import { cn } from "@utils/cn";
import { Card, CardHeader, CardContent, CardTitle } from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import { AnimatedCounter } from "@components/AnimatedCounter";
import type { AuthorStatsCardProps } from "./types";

/**
 * Professional stats and achievements showcase component
 * Features animated counters, configurable layouts, and achievement highlights
 */
export default function AuthorStatsCard({
  stats,
  className,
  variant = "grid",
  showIcons = true,
  animated = true,
}: AuthorStatsCardProps) {
  const statsData: Array<{
    id: string;
    label: string;
    value: number | string;
    suffix?: string;
    icon: React.ReactElement;
    color: string;
    bgColor: string;
  }> = [
    {
      id: "experience",
      label: "Years Experience",
      value: stats.experience,
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "text-primary",
      bgColor: "bg-primary/10 dark:bg-primary/20",
    },
    {
      id: "clients",
      label: "Happy Clients",
      value: stats.clients,
      suffix: "+",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      id: "projects",
      label: "Projects Completed",
      value: stats.projects,
      suffix: "+",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
  ];

  // Add optional stats if they exist
  if (stats.certifications) {
    statsData.push({
      id: "certifications",
      label: "Certifications",
      value: stats.certifications,
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
      ),
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    });
  }

  if (stats.articles) {
    statsData.push({
      id: "articles",
      label: "Articles Published",
      value: stats.articles,
      suffix: "+",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      color: "text-indigo-600",
      bgColor: "bg-indigo-100 dark:bg-indigo-900/20",
    });
  }

  if (variant === "horizontal") {
    return (
      <Card
        className={cn(
          "relative overflow-hidden",
          "bg-gradient-to-r from-card via-card to-card/90",
          "border border-border/50 shadow-lg hover:shadow-xl",
          "transition-all duration-300 hover:-translate-y-0.5",
          className
        )}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />

        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-center gap-8">
            {statsData.map((stat, index) => (
              <div key={stat.id} className="flex items-center space-x-3">
                {showIcons && (
                  <div className={cn("p-2 rounded-full", stat.bgColor)}>
                    <div className={stat.color}>{stat.icon}</div>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {animated ? (
                      <AnimatedCounter
                        end={
                          typeof stat.value === "string"
                            ? parseInt(stat.value)
                            : stat.value
                        }
                        suffix={stat.suffix || ""}
                        delay={index * 200}
                      />
                    ) : (
                      `${stat.value}${stat.suffix || ""}`
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === "vertical") {
    return (
      <Card
        className={cn(
          "relative overflow-hidden max-w-xs",
          "bg-gradient-to-b from-card via-card to-card/90",
          "border border-border/50 shadow-lg hover:shadow-xl",
          "transition-all duration-300 hover:-translate-y-0.5",
          className
        )}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />

        <CardHeader className="text-center pb-4">
          <CardTitle className="text-lg font-bold text-foreground">
            Achievements
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {statsData.map((stat, index) => (
            <div
              key={stat.id}
              className="flex items-center space-x-3 p-3 rounded-lg border border-border/30 bg-muted/30"
            >
              {showIcons && (
                <div
                  className={cn("p-2 rounded-full flex-shrink-0", stat.bgColor)}
                >
                  <div className={stat.color}>{stat.icon}</div>
                </div>
              )}
              <div className="flex-1">
                <div className="text-xl font-bold text-foreground">
                  {animated ? (
                    <AnimatedCounter
                      end={
                        typeof stat.value === "string"
                          ? parseInt(stat.value)
                          : stat.value
                      }
                      suffix={stat.suffix || ""}
                      delay={index * 200}
                    />
                  ) : (
                    `${stat.value}${stat.suffix || ""}`
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Grid variant (default)
  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        "bg-gradient-to-br from-card via-card to-card/90",
        "border border-border/50 shadow-lg hover:shadow-xl",
        "transition-all duration-300 hover:-translate-y-0.5",
        className
      )}
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />

      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center space-x-2">
          <Badge
            variant="secondary"
            className="bg-gradient-to-r from-primary/20 to-accent/20 text-primary"
          >
            Professional Stats
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {statsData.map((stat, index) => (
            <div
              key={stat.id}
              className="text-center p-4 rounded-lg border border-border/30 bg-gradient-to-br from-muted/50 to-muted/20 hover:from-muted/70 hover:to-muted/30 transition-all duration-300 group"
            >
              {showIcons && (
                <div
                  className={cn(
                    "inline-flex p-2 rounded-full mb-2 group-hover:scale-110 transition-transform duration-300",
                    stat.bgColor
                  )}
                >
                  <div className={stat.color}>{stat.icon}</div>
                </div>
              )}
              <div className="text-2xl font-bold text-foreground mb-1">
                {animated ? (
                  <AnimatedCounter
                    end={
                      typeof stat.value === "string"
                        ? parseInt(stat.value)
                        : stat.value
                    }
                    suffix={stat.suffix || ""}
                    delay={index * 200}
                  />
                ) : (
                  `${stat.value}${stat.suffix || ""}`
                )}
              </div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Achievement badge */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 text-primary text-sm font-medium">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span>Proven Track Record</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
