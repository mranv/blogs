import { slugifyStr } from "@utils/slugify";
import Datetime from "./Datetime";
import type { CollectionEntry } from "astro:content";

export interface Props {
  href?: string;
  frontmatter: CollectionEntry<"blog">["data"];
  secHeading?: boolean;
}

export default function Card({ href, frontmatter, secHeading = true }: Props) {
  const { title, pubDatetime, modDatetime, description } = frontmatter;

  const headerProps = {
    style: { viewTransitionName: slugifyStr(title) },
    className:
      "text-lg font-medium decoration-dashed hover:underline transition-all duration-300 hover:text-primary",
  };

  return (
    <li className="my-6 animate-fadeIn">
      <a
        href={href}
        className="group block p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm hover:bg-card/80 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative">
          {secHeading ? (
            <h2 {...headerProps}>{title}</h2>
          ) : (
            <h3 {...headerProps}>{title}</h3>
          )}
          <div className="mt-2 mb-3 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
            <Datetime pubDatetime={pubDatetime} modDatetime={modDatetime} />
          </div>
          <p className="text-foreground/80 group-hover:text-foreground transition-colors duration-300 line-clamp-3">
            {description}
          </p>
          <div className="mt-4 flex items-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <span>Read more</span>
            <svg
              className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </a>
    </li>
  );
}
