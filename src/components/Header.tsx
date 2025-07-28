import { SITE } from "@config";
import { Button } from "./ui/button";
import ThemeToggleReact from "./ThemeToggleReact";
import { Menu, X, Search, Home, BookOpen, Tags, User } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@utils/cn";

export interface Props {
  activeNav?: "posts" | "tags" | "about" | "search";
}

export default function Header({ activeNav }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { href: "/", label: "Home", icon: Home, active: activeNav === undefined },
    {
      href: "/posts",
      label: "Posts",
      icon: BookOpen,
      active: activeNav === "posts",
    },
    { href: "/tags", label: "Tags", icon: Tags, active: activeNav === "tags" },
    {
      href: "/about",
      label: "About",
      icon: User,
      active: activeNav === "about",
    },
    {
      href: "/search",
      label: "Search",
      icon: Search,
      active: activeNav === "search",
    },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm"
          : "bg-background/50 backdrop-blur-sm border-b border-border/30"
      )}
    >
      <nav className="mx-auto max-w-6xl px-6 sm:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a
            href="/"
            className="flex items-center gap-2 text-xl font-bold text-foreground hover:text-primary transition-colors"
          >
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {SITE.title}
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <Button
                key={item.href}
                variant={item.active ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "gap-2 font-medium",
                  item.active && "bg-secondary/70"
                )}
                asChild
              >
                <a href={item.href}>
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </a>
              </Button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggleReact />

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <div className="flex flex-col gap-2">
              {navItems.map(item => (
                <Button
                  key={item.href}
                  variant={item.active ? "secondary" : "ghost"}
                  size="default"
                  className={cn(
                    "justify-start gap-3 font-medium",
                    item.active && "bg-secondary/70"
                  )}
                  asChild
                >
                  <a href={item.href}>
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </a>
                </Button>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
