import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Search, Sun, Moon, Menu, X, Bell } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuLink,
} from "@components/ui/navigation-menu";
import NotificationBadge from "./NotificationBadge.tsx";
import SearchButton from "./SearchButton.tsx";
import NavigationSkeleton from "./skeletons/NavigationSkeleton.tsx";
import {
  FadeIn,
  SlideIn,
  StaggerChildren,
  ScaleIn,
} from "@components/animations";
import { cn } from "@utils/cn";

interface NavigationMenuHeaderProps {
  activeNav?: "posts" | "tags" | "about" | "search";
  posts?: any[];
  tags?: any[];
  socialLinks?: any[];
  className?: string;
  hasNewPosts?: boolean;
  isLoading?: boolean;
  disableAnimations?: boolean;
}

const NavigationMenuHeader: React.FC<NavigationMenuHeaderProps> = ({
  activeNav,
  posts = [],
  tags = [],
  socialLinks = [],
  className,
  hasNewPosts = false,
  isLoading = false,
  disableAnimations = false,
}) => {
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

  const recentPosts = posts.slice(0, 5);
  const popularTags = tags.slice(0, 8);

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
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="space-x-2">
            {/* Posts Menu */}
            <NavigationMenuItem>
              <NavigationMenuTrigger
                className={cn(
                  "group inline-flex h-10 w-max items-center justify-center rounded-lg bg-transparent px-4 py-2 text-sm font-medium transition-all duration-300",
                  "hover:bg-skin-accent/15 hover:text-skin-accent hover:shadow-md hover:scale-105",
                  "focus:bg-skin-accent/15 focus:text-skin-accent focus:outline-none",
                  "border border-transparent hover:border-skin-accent/20",
                  "relative overflow-hidden",
                  activeNav === "posts" &&
                    "text-skin-accent bg-skin-accent/15 shadow-md border-skin-accent/30 scale-105"
                )}
              >
                <NotificationBadge show={hasNewPosts}>
                  <span className="relative z-10">Posts</span>
                </NotificationBadge>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-skin-accent/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid gap-3 p-4 sm:p-6 w-full sm:w-[90vw] md:w-[400px] lg:w-[500px] xl:w-[600px] lg:grid-cols-[.75fr_1fr]">
                  <div className="row-span-3">
                    <NavigationMenuLink asChild>
                      <a
                        className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-skin-accent/20 to-skin-accent/10 p-6 no-underline outline-none focus:shadow-md"
                        href="/posts/"
                      >
                        <div className="mb-2 mt-4 text-lg font-medium">
                          All Posts
                        </div>
                        <p className="text-sm leading-tight text-muted-foreground">
                          Explore all cybersecurity insights and DevSecOps
                          guides.
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </div>
                  <div className="grid gap-2">
                    <h4 className="text-sm font-medium leading-none mb-2">
                      Recent Posts
                    </h4>
                    {recentPosts.map((post, index) => (
                      <NavigationMenuLink key={index} asChild>
                        <a
                          href={`/posts/${post.slug}/`}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none line-clamp-1">
                            {post.data?.title || post.title}
                          </div>
                          <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                            {post.data?.description || post.description}
                          </p>
                        </a>
                      </NavigationMenuLink>
                    ))}
                  </div>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Tags Menu */}
            <NavigationMenuItem>
              <NavigationMenuTrigger
                className={cn(
                  "group inline-flex h-10 w-max items-center justify-center rounded-lg bg-transparent px-4 py-2 text-sm font-medium transition-all duration-300",
                  "hover:bg-skin-accent/15 hover:text-skin-accent hover:shadow-md hover:scale-105",
                  "focus:bg-skin-accent/15 focus:text-skin-accent focus:outline-none",
                  "border border-transparent hover:border-skin-accent/20",
                  "relative overflow-hidden",
                  activeNav === "tags" &&
                    "text-skin-accent bg-skin-accent/15 shadow-md border-skin-accent/30 scale-105"
                )}
              >
                <span className="relative z-10">Tags</span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-skin-accent/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid gap-3 p-4 sm:p-6 w-full sm:w-[90vw] md:w-[400px] lg:w-[500px] xl:w-[600px]">
                  <div className="grid gap-2">
                    <NavigationMenuLink asChild>
                      <a
                        href="/tags/"
                        className="block select-none space-y-1 rounded-md bg-gradient-to-b from-skin-accent/20 to-skin-accent/10 p-4 leading-none no-underline outline-none transition-colors hover:shadow-md focus:shadow-md"
                      >
                        <div className="text-lg font-medium">All Tags</div>
                        <p className="text-sm leading-tight text-muted-foreground">
                          Browse all topics and categories.
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </div>
                  <div className="grid gap-2">
                    <h4 className="text-sm font-medium leading-none mb-2">
                      Popular Tags
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {popularTags.map((tag, index) => (
                        <NavigationMenuLink key={index} asChild>
                          <a
                            href={`/tags/${tag.tag || tag.slug}/`}
                            className="block select-none rounded-md p-2 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <span className="font-medium">
                              {tag.tagName || tag.name}
                            </span>
                          </a>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </div>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* About Menu */}
            <NavigationMenuItem>
              <NavigationMenuTrigger
                className={cn(
                  "group inline-flex h-10 w-max items-center justify-center rounded-lg bg-transparent px-4 py-2 text-sm font-medium transition-all duration-300",
                  "hover:bg-skin-accent/15 hover:text-skin-accent hover:shadow-md hover:scale-105",
                  "focus:bg-skin-accent/15 focus:text-skin-accent focus:outline-none",
                  "border border-transparent hover:border-skin-accent/20",
                  "relative overflow-hidden",
                  activeNav === "about" &&
                    "text-skin-accent bg-skin-accent/15 shadow-md border-skin-accent/30 scale-105"
                )}
              >
                <span className="relative z-10">About</span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-skin-accent/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid gap-3 p-4 sm:p-6 w-full sm:w-[90vw] md:w-[400px] lg:w-[500px] xl:w-[600px] lg:grid-cols-2">
                  <div>
                    <NavigationMenuLink asChild>
                      <a
                        href="/about/"
                        className="block select-none space-y-1 rounded-md bg-gradient-to-b from-skin-accent/20 to-skin-accent/10 p-4 leading-none no-underline outline-none transition-colors hover:shadow-md focus:shadow-md"
                      >
                        <div className="text-lg font-medium">About Me</div>
                        <p className="text-sm leading-tight text-muted-foreground">
                          Learn about my background in DevSecOps and
                          cybersecurity.
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </div>
                  <div className="grid gap-2">
                    <h4 className="text-sm font-medium leading-none mb-2">
                      Connect
                    </h4>
                    {socialLinks
                      .filter(link => link.active)
                      .map((link, index) => (
                        <NavigationMenuLink key={index} asChild>
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block select-none space-y-1 rounded-md p-2 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium">
                              {link.name}
                            </div>
                          </a>
                        </NavigationMenuLink>
                      ))}
                  </div>
                </div>
              </NavigationMenuContent>
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
                  "hover:bg-skin-accent/15 hover:text-skin-accent hover:shadow-md hover:scale-105",
                  "focus:bg-skin-accent/15 focus:text-skin-accent focus:outline-none",
                  "border border-transparent hover:border-skin-accent/20",
                  "relative overflow-hidden"
                )}
                aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
                {theme === "light" ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-skin-accent/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Mobile Menu Button */}
        <ScaleIn variant="pop" hoverScale={1.1} disabled={disableAnimations}>
          <button
            ref={menuButtonRef}
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg border border-transparent hover:border-skin-accent/20 hover:bg-skin-accent/15 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-skin-accent/50"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation-menu"
          >
            {isOpen ? (
              <X className="h-6 w-6 transform transition-transform duration-300 rotate-90" />
            ) : (
              <Menu className="h-6 w-6 transform transition-transform duration-300" />
            )}
          </button>
        </ScaleIn>
      </StaggerChildren>

      {/* Mobile Menu */}
      {isOpen && (
        <SlideIn direction="down" duration={300} disabled={disableAnimations}>
          <div
            ref={mobileMenuRef}
            id="mobile-navigation-menu"
            className="absolute top-full left-0 right-0 z-50 md:hidden bg-skin-fill/95 backdrop-blur-md border-t border-skin-accent/20 shadow-lg"
            role="navigation"
            aria-label="Mobile navigation menu"
          >
            <StaggerChildren
              animation="slide-left"
              staggerDelay={80}
              duration={300}
              disabled={disableAnimations}
              className="p-4 space-y-4"
            >
              <a
                href="/posts/"
                className={cn(
                  "block px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-skin-accent/50",
                  "hover:bg-skin-accent/15 hover:text-skin-accent",
                  activeNav === "posts" && "text-skin-accent bg-skin-accent/15"
                )}
                onClick={() => setIsOpen(false)}
                aria-current={activeNav === "posts" ? "page" : undefined}
              >
                <NotificationBadge show={hasNewPosts}>Posts</NotificationBadge>
              </a>
              <a
                href="/tags/"
                className={cn(
                  "block px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-skin-accent/50",
                  "hover:bg-skin-accent/15 hover:text-skin-accent",
                  activeNav === "tags" && "text-skin-accent bg-skin-accent/15"
                )}
                onClick={() => setIsOpen(false)}
                aria-current={activeNav === "tags" ? "page" : undefined}
              >
                Tags
              </a>
              <a
                href="/about/"
                className={cn(
                  "block px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-skin-accent/50",
                  "hover:bg-skin-accent/15 hover:text-skin-accent",
                  activeNav === "about" && "text-skin-accent bg-skin-accent/15"
                )}
                onClick={() => setIsOpen(false)}
                aria-current={activeNav === "about" ? "page" : undefined}
              >
                About
              </a>
              <a
                href="/search/"
                className={cn(
                  "flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-skin-accent/50",
                  "hover:bg-skin-accent/15 hover:text-skin-accent",
                  activeNav === "search" && "text-skin-accent bg-skin-accent/15"
                )}
                onClick={() => setIsOpen(false)}
                aria-current={activeNav === "search" ? "page" : undefined}
              >
                <Search className="mr-2 h-4 w-4" aria-hidden="true" />
                Search
              </a>
              <button
                onClick={() => {
                  toggleTheme();
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-skin-accent/15 hover:text-skin-accent focus:outline-none focus:ring-2 focus:ring-skin-accent/50"
                aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
                {theme === "light" ? (
                  <>
                    <Moon className="mr-2 h-4 w-4" aria-hidden="true" />
                    Dark Mode
                  </>
                ) : (
                  <>
                    <Sun className="mr-2 h-4 w-4" aria-hidden="true" />
                    Light Mode
                  </>
                )}
              </button>
            </StaggerChildren>
          </div>
        </SlideIn>
      )}
    </FadeIn>
  );
};

export default NavigationMenuHeader;
