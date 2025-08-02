import React from "react";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/utils/cn";

interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  className?: string;
}

const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ items, className }) => {
  return (
    <nav
      className={cn(
        "flex items-center space-x-1 text-sm text-muted-foreground",
        className
      )}
      aria-label="Breadcrumb"
    >
      <a
        href="/"
        className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors duration-200"
        aria-label="Go to homepage"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">Home</span>
      </a>

      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight
            className="h-4 w-4 text-muted-foreground/50"
            aria-hidden="true"
          />
          {item.href && !item.active ? (
            <a
              href={item.href}
              className="hover:text-foreground transition-colors duration-200 capitalize"
            >
              {item.label}
            </a>
          ) : (
            <span
              className={cn(
                "capitalize",
                item.active && "text-foreground font-medium"
              )}
              aria-current={item.active ? "page" : undefined}
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default BreadcrumbNav;
