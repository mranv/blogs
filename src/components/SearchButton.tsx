import React, { useState, useEffect } from "react";
import { Search, Command } from "lucide-react";
import { cn } from "@utils/cn";

interface SearchButtonProps {
  className?: string;
  isActive?: boolean;
  onClick?: () => void;
}

const SearchButton: React.FC<SearchButtonProps> = ({
  className,
  isActive = false,
  onClick,
}) => {
  const [shortcut, setShortcut] = useState("");

  useEffect(() => {
    const isMac =
      typeof window !== "undefined" &&
      navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    setShortcut(isMac ? "⌘K" : "Ctrl+K");
  }, []);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      window.location.href = "/search/";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "group inline-flex h-10 w-max items-center justify-center rounded-lg bg-transparent px-3 py-2 text-sm font-medium transition-all duration-300",
        "hover:bg-primary/15 hover:text-primary hover:shadow-md hover:scale-105",
        "focus:bg-primary/15 focus:text-primary focus:outline-none focus:ring-2 focus:ring-primary",
        "border border-transparent hover:border-primary/20",
        "relative overflow-hidden",
        isActive &&
          "text-primary bg-primary/15 shadow-md border-primary/30 scale-105",
        className
      )}
      aria-label={`Open search (${shortcut})`}
    >
      <Search className="h-5 w-5" aria-hidden="true" />
      <span className="sr-only">Search</span>

      {/* Keyboard shortcut indicator */}
      <span className="hidden md:inline-flex ml-2 text-xs opacity-60 bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
        {shortcut}
      </span>

      {/* Hover effect */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
    </button>
  );
};

export default SearchButton;
