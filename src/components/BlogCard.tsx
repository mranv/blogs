import { slugifyStr } from "@utils/slugify";
import Datetime from "./Datetime";
import type { CollectionEntry } from "astro:content";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { cn } from "@utils/cn";
import { ChevronRight } from "lucide-react";

export interface Props {
  href?: string;
  frontmatter: CollectionEntry<"blog">["data"];
  secHeading?: boolean;
}

export default function BlogCard({
  href,
  frontmatter,
  secHeading = true,
}: Props) {
  const { title, pubDatetime, modDatetime, description } = frontmatter;

  const headerProps = {
    style: { viewTransitionName: slugifyStr(title) },
    className:
      "text-xl font-semibold text-foreground/90 group-hover:text-primary transition-colors duration-300",
  };

  return (
    <li className="my-4">
      <a href={href} className="block no-underline">
        <Card
          className={cn(
            "group relative overflow-hidden",
            "border-border/40 bg-card/50 backdrop-blur-md",
            "hover:bg-card/70 hover:border-primary/30",
            "hover:shadow-2xl hover:-translate-y-1 transition-all duration-500",
            "bg-gradient-to-br from-background via-card/60 to-muted/30",
            "before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/3 before:via-transparent before:to-accent/3",
            "before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100"
          )}
        >
          {/* Enhanced gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-accent/4 to-secondary/6 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-accent/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          <CardHeader className="relative pb-3">
            {secHeading ? (
              <CardTitle
                className={cn(
                  headerProps.className,
                  "line-clamp-2 group-hover:scale-[1.02] transition-transform duration-300"
                )}
                style={headerProps.style}
              >
                {title}
              </CardTitle>
            ) : (
              <CardTitle asChild>
                <h3
                  className={cn(headerProps.className, "line-clamp-2")}
                  style={headerProps.style}
                >
                  {title}
                </h3>
              </CardTitle>
            )}
            <CardDescription className="text-muted-foreground/70 text-sm mt-2">
              <Datetime pubDatetime={pubDatetime} modDatetime={modDatetime} />
            </CardDescription>
          </CardHeader>

          <CardContent className="relative pt-0">
            <p className="text-muted-foreground/80 group-hover:text-muted-foreground transition-all duration-300 line-clamp-2 text-sm leading-relaxed group-hover:leading-normal">
              {description}
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
              <span className="relative overflow-hidden">
                <span className="block transition-transform duration-300 group-hover:-translate-y-full">
                  Read article
                </span>
                <span className="absolute top-full left-0 transition-transform duration-300 group-hover:-translate-y-full text-accent">
                  Read article →
                </span>
              </span>
              <ChevronRight className="w-4 h-4 transform group-hover:translate-x-2 group-hover:scale-110 transition-all duration-300" />
            </div>
          </CardContent>
        </Card>
      </a>
    </li>
  );
}
