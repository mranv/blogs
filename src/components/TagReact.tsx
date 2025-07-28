import { Badge } from "./ui/badge";
import { Hash } from "lucide-react";
import { cn } from "@utils/cn";

export interface Props {
  tag: string;
  size?: "sm" | "lg";
}

export default function TagReact({ tag, size = "sm" }: Props) {
  return (
    <li
      className={cn(
        "inline-block transition-all duration-200",
        size === "sm" ? "my-1 mx-1" : "my-2 mx-1.5"
      )}
    >
      <a
        href={`/tags/${tag}/`}
        className={cn("no-underline", size === "sm" ? "text-sm" : "text-base")}
      >
        <Badge
          variant="secondary"
          className={cn(
            "group relative inline-flex items-center gap-1.5",
            "border-border/50 hover:border-primary/30",
            "bg-secondary/50 hover:bg-secondary/80",
            "shadow-sm hover:shadow",
            "transition-all duration-200",
            "font-medium",
            size === "lg" && "px-4 py-2 text-base",
            "hover:-translate-y-0.5"
          )}
        >
          <Hash
            className={cn(
              "text-primary/60 group-hover:text-primary transition-all duration-200",
              size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"
            )}
          />
          <span className="text-foreground/80 group-hover:text-foreground">
            {tag}
          </span>
        </Badge>
      </a>
    </li>
  );
}
