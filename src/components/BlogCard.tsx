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
    className: "transition-all duration-300 hover:text-skin-accent",
  };

  return (
    <li className="my-6 animate-fadeIn">
      <a href={href} className="block no-underline">
        <Card
          className={cn(
            "group relative overflow-hidden",
            "border-skin-line bg-skin-card/50 backdrop-blur-sm",
            "hover:bg-skin-card/80 hover:border-skin-accent/30",
            "hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-skin-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <CardHeader className="relative">
            {secHeading ? (
              <CardTitle
                className={headerProps.className}
                style={headerProps.style}
              >
                {title}
              </CardTitle>
            ) : (
              <CardTitle asChild>
                <h3 className={headerProps.className} style={headerProps.style}>
                  {title}
                </h3>
              </CardTitle>
            )}
            <CardDescription className="opacity-70 group-hover:opacity-100 transition-opacity duration-300">
              <Datetime pubDatetime={pubDatetime} modDatetime={modDatetime} />
            </CardDescription>
          </CardHeader>

          <CardContent className="relative">
            <p className="text-skin-base/80 group-hover:text-skin-base transition-colors duration-300 line-clamp-3">
              {description}
            </p>
            <div className="mt-4 flex items-center text-sm text-skin-accent opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
              <span>Read more</span>
              <ChevronRight className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </CardContent>
        </Card>
      </a>
    </li>
  );
}
