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
            "border-border/50 bg-card/40 backdrop-blur-sm",
            "hover:bg-card/60 hover:border-primary/20",
            "hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300",
            "bg-gradient-to-br from-background to-muted/20"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <CardHeader className="relative pb-3">
            {secHeading ? (
              <CardTitle
                className={cn(headerProps.className, "line-clamp-2")}
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
            <p className="text-muted-foreground/80 group-hover:text-muted-foreground transition-colors duration-300 line-clamp-2 text-sm leading-relaxed">
              {description}
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
              <span>Read article</span>
              <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </CardContent>
        </Card>
      </a>
    </li>
  );
}
