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
        "inline-block transition-all duration-300 hover:scale-105",
        size === "sm" ? "my-1" : "my-3 mx-1"
      )}
    >
      <a
        href={`/tags/${tag}/`}
        className={cn("no-underline", size === "sm" ? "text-sm" : "text-lg")}
      >
        <Badge
          variant="outline"
          className={cn(
            "group relative inline-flex items-center gap-1",
            "border-skin-line hover:border-skin-accent",
            "shadow-sm hover:shadow-md",
            "transition-all duration-300",
            "bg-skin-accent/10 hover:bg-skin-accent/20",
            size === "lg" && "px-4 py-2 text-base"
          )}
        >
          <Hash
            className={cn(
              "text-skin-accent opacity-70 group-hover:opacity-100 transition-all duration-300 group-hover:rotate-12",
              size === "sm" ? "h-3 w-3" : "h-4 w-4"
            )}
          />
          <span className="font-medium">{tag}</span>
        </Badge>
      </a>
    </li>
  );
}
