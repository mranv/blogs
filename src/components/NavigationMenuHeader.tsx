import React, { useState, useEffect, useRef } from "react";
import { Sun, Moon } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
} from "@components/ui/navigation-menu";
import NotificationBadge from "./NotificationBadge.tsx";
import SearchButton from "./SearchButton.tsx";
import NavigationSkeleton from "./skeletons/NavigationSkeleton.tsx";
import { FadeIn, StaggerChildren } from "@components/animations";
import { cn } from "@utils/cn";

interface NavigationMenuHeaderProps {
  activeNav?: "posts" | "tags" | "about" | "search";
  socialLinks?: any[];
  className?: string;
  hasNewPosts?: boolean;
  isLoading?: boolean;
  disableAnimations?: boolean;
}

const NavigationMenuHeader: React.FC<NavigationMenuHeaderProps> = props => {
  const {
    activeNav,
    socialLinks = [],
    className,
    hasNewPosts = false,
    isLoading = false,
    disableAnimations = false,
  } = props;

  // Show skeleton while loading
  if (isLoading) {
    return <NavigationSkeleton className={className} />;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Theme detection
    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const initialTheme = storedTheme || (prefersDark ? "dark" : "light");
    setTheme(initialTheme as "light" | "dark");
  }, []);

  // Navigation menu initialization
  useEffect(() => {
    // Any initialization logic can go here
  }, [activeNav, socialLinks, hasNewPosts]);

  // Handle keyboard navigation for mobile menu
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === "Escape") {
        setIsOpen(false);
        menuButtonRef.current?.focus();
      }

      if (event.key === "Tab") {
        const focusableElements = mobileMenuRef.current?.querySelectorAll(
          "a[href], button:not([disabled])"
        );
        if (focusableElements && focusableElements.length > 0) {
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[
            focusableElements.length - 1
          ] as HTMLElement;

          if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          } else if (
            !event.shiftKey &&
            document.activeElement === lastElement
          ) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Focus first element when menu opens
      const firstLink = mobileMenuRef.current?.querySelector(
        "a"
      ) as HTMLElement;
      firstLink?.focus();
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <FadeIn
      direction="down"
      duration={600}
      disabled={disableAnimations}
      className={cn("relative", className)}
    >
      {/* Desktop Navigation */}
      <StaggerChildren
        animation="slide-down"
        staggerDelay={100}
        duration={400}
        disabled={disableAnimations}
        pattern="sequential"
      >
        <NavigationMenu className="flex">
          <NavigationMenuList className="flex flex-wrap space-x-1 sm:space-x-2">
            {/* Posts Link */}
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <a
                  href="/posts/"
                  className={cn(
                    "group inline-flex h-10 w-max items-center justify-center rounded-lg bg-transparent px-4 py-2 text-sm font-medium transition-all duration-300",
                    "hover:bg-primary/15 hover:text-primary hover:shadow-md hover:scale-105",
                    "focus:bg-primary/15 focus:text-primary focus:outline-none",
                    "border border-transparent hover:border-primary/20",
                    "relative overflow-hidden cursor-pointer",
                    activeNav === "posts" &&
                      "text-primary bg-primary/15 shadow-md border-primary/30 scale-105"
                  )}
                >
                  <NotificationBadge show={hasNewPosts}>
                    <span className="relative z-10">Posts</span>
                  </NotificationBadge>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </a>
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* Tags Link */}
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <a
                  href="/tags/"
                  className={cn(
                    "group inline-flex h-10 w-max items-center justify-center rounded-lg bg-transparent px-4 py-2 text-sm font-medium transition-all duration-300",
                    "hover:bg-primary/15 hover:text-primary hover:shadow-md hover:scale-105",
                    "focus:bg-primary/15 focus:text-primary focus:outline-none",
                    "border border-transparent hover:border-primary/20",
                    "relative overflow-hidden cursor-pointer",
                    activeNav === "tags" &&
                      "text-primary bg-primary/15 shadow-md border-primary/30 scale-105"
                  )}
                >
                  <span className="relative z-10">Tags</span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </a>
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* About Link */}
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <a
                  href="/about/"
                  className={cn(
                    "group inline-flex h-10 w-max items-center justify-center rounded-lg bg-transparent px-4 py-2 text-sm font-medium transition-all duration-300",
                    "hover:bg-primary/15 hover:text-primary hover:shadow-md hover:scale-105",
                    "focus:bg-primary/15 focus:text-primary focus:outline-none",
                    "border border-transparent hover:border-primary/20",
                    "relative overflow-hidden cursor-pointer",
                    activeNav === "about" &&
                      "text-primary bg-primary/15 shadow-md border-primary/30 scale-105"
                  )}
                >
                  <span className="relative z-10">About</span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </a>
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* Search Button */}
            <NavigationMenuItem>
              <SearchButton isActive={activeNav === "search"} />
            </NavigationMenuItem>

            {/* Theme Toggle */}
            <NavigationMenuItem>
              <button
                onClick={toggleTheme}
                className={cn(
                  "group inline-flex h-10 w-max items-center justify-center rounded-lg bg-transparent px-3 py-2 text-sm font-medium transition-all duration-300",
                  "hover:bg-primary/15 hover:text-primary hover:shadow-md hover:scale-105",
                  "focus:bg-primary/15 focus:text-primary focus:outline-none",
                  "border border-transparent hover:border-primary/20",
                  "relative overflow-hidden"
                )}
                aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
                {theme === "light" ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </StaggerChildren>
    </FadeIn>
  );
};

export default NavigationMenuHeader;
