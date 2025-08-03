import Fuse from "fuse.js";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Input } from "@components/ui/input";
import { Badge } from "@components/ui/badge";
import { Skeleton } from "@components/ui/skeleton";
import SearchSkeleton from "@components/skeletons/SearchSkeleton";
import {
  FadeIn,
  ScaleIn,
  StaggerChildren,
  SlideIn,
} from "@components/animations";
import type { CollectionEntry } from "astro:content";

export type SearchItem = {
  title: string;
  description: string;
  data: CollectionEntry<"blog">["data"];
  slug: string;
};

type RecentSearch = {
  query: string;
  timestamp: number;
  isTag?: boolean;
};

type CategoryFilter = {
  name: string;
  count: number;
  active: boolean;
};

interface Props {
  searchList: SearchItem[];
  isLoading?: boolean;
  className?: string;
  disableAnimations?: boolean;
}

interface SearchResult {
  item: SearchItem;
  refIndex: number;
  score?: number;
  matches?: ReadonlyArray<{
    indices: ReadonlyArray<readonly [number, number]>;
    value: string;
    key: string;
  }>;
}

export default function SearchBar({
  searchList,
  isLoading = false,
  className,
  disableAnimations = false,
}: Props) {
  // Show skeleton while loading
  if (isLoading || !searchList || searchList.length === 0) {
    return <SearchSkeleton className={className} showFilters resultCount={3} />;
  }
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputVal, setInputVal] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(
    null
  );
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<CategoryFilter[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<
    string | null
  >(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [searchStats, setSearchStats] = useState<{
    searchTime: number;
    totalPosts: number;
    resultsFound: number;
  } | null>(null);

  // localStorage functions for recent searches
  const saveRecentSearch = useCallback(
    (query: string) => {
      if (query.trim().length < 2) return;

      const newSearch: RecentSearch = {
        query: query.trim(),
        timestamp: Date.now(),
      };

      const existing = recentSearches.filter(
        search => search.query !== query.trim()
      );
      const updated = [newSearch, ...existing].slice(0, 5); // Keep only 5 recent searches

      setRecentSearches(updated);
      localStorage.setItem("blog-recent-searches", JSON.stringify(updated));
    },
    [recentSearches]
  );

  const loadRecentSearches = useCallback(() => {
    try {
      const stored = localStorage.getItem("blog-recent-searches");
      if (stored) {
        const parsed = JSON.parse(stored) as RecentSearch[];
        // Remove searches older than 30 days
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const filtered = parsed.filter(
          search => search.timestamp > thirtyDaysAgo
        );
        setRecentSearches(filtered);
      }
    } catch (error) {
      console.error("Error loading recent searches:", error);
    }
  }, []);

  const handleChange = (e: React.FormEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    setInputVal(value);
    setShowSuggestions(value.length === 0 && recentSearches.length > 0);
    setSelectedSuggestionIndex(-1);
  };

  const fuse = useMemo(
    () =>
      new Fuse(searchList, {
        keys: [
          { name: "title", weight: 2.0 },
          { name: "description", weight: 1.5 },
          { name: "data.tags", weight: 1.2 },
          { name: "data.author", weight: 0.5 },
        ],
        includeMatches: true,
        includeScore: true,
        minMatchCharLength: 1,
        threshold: 0.3, // More permissive fuzzy matching
        distance: 100,
        useExtendedSearch: true,
        ignoreLocation: true,
        findAllMatches: true,
        shouldSort: true,
      }),
    [searchList]
  );

  // Get all unique categories from blog posts
  const allCategories = useMemo(() => {
    const categories = new Map<string, number>();
    searchList.forEach(item => {
      if (item.data.tags && Array.isArray(item.data.tags)) {
        item.data.tags.forEach(tag => {
          categories.set(tag, (categories.get(tag) || 0) + 1);
        });
      }
    });
    return Array.from(categories.entries())
      .map(([name, count]) => ({ name, count, active: false }))
      .sort((a, b) => b.count - a.count);
  }, [searchList]);

  // Initialize category filters
  useEffect(() => {
    setCategoryFilters(allCategories);
  }, [allCategories]);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }

      // Handle suggestion navigation when suggestions are shown
      if (showSuggestions && recentSearches.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedSuggestionIndex(prev =>
            prev < recentSearches.length - 1 ? prev + 1 : 0
          );
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedSuggestionIndex(prev =>
            prev > 0 ? prev - 1 : recentSearches.length - 1
          );
        } else if (e.key === "Enter" && selectedSuggestionIndex >= 0) {
          e.preventDefault();
          const selectedSearch = recentSearches[selectedSuggestionIndex];
          setInputVal(selectedSearch.query);
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
        } else if (e.key === "Escape") {
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showSuggestions, recentSearches, selectedSuggestionIndex]);

  useEffect(() => {
    // Load recent searches from localStorage
    loadRecentSearches();

    // if URL has search query,
    // insert that search query in input field
    const searchUrl = new URLSearchParams(window.location.search);
    const searchStr = searchUrl.get("q");
    if (searchStr) setInputVal(searchStr);

    // put focus cursor at the end of the string
    setTimeout(function () {
      inputRef.current!.selectionStart = inputRef.current!.selectionEnd =
        searchStr?.length || 0;
    }, 50);
  }, [loadRecentSearches]);

  useEffect(() => {
    const performSearch = async () => {
      if (inputVal.length <= 1) {
        setSearchResults([]);
        setIsSearching(false);
        setSearchStats(null);
        return;
      }

      setIsSearching(true);
      const searchStartTime = performance.now();

      // Simulate a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 100));

      let inputResult = fuse.search(inputVal);

      // Apply category filter if active
      if (activeCategoryFilter) {
        inputResult = inputResult.filter(result =>
          result.item.data.tags?.includes(activeCategoryFilter)
        );
      }

      const searchEndTime = performance.now();
      const searchTime = searchEndTime - searchStartTime;

      setSearchResults(inputResult);
      setSearchStats({
        searchTime,
        totalPosts: searchList.length,
        resultsFound: inputResult.length,
      });
      setIsSearching(false);

      // Save to recent searches if we have results
      if (inputResult.length > 0) {
        saveRecentSearch(inputVal);
      }
    };

    performSearch();

    // Update search string in URL
    if (inputVal.length > 0) {
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set("q", inputVal);
      const newRelativePathQuery =
        window.location.pathname + "?" + searchParams.toString();
      history.replaceState(history.state, "", newRelativePathQuery);
    } else {
      history.replaceState(history.state, "", window.location.pathname);
    }
  }, [inputVal, fuse, activeCategoryFilter, saveRecentSearch]);

  // Enhanced highlighting function using Fuse.js matches
  const highlightMatches = (
    text: string,
    matches: ReadonlyArray<{
      indices: ReadonlyArray<readonly [number, number]>;
      value: string;
      key: string;
    }> = [],
    fieldKey: string
  ) => {
    const fieldMatches = matches.filter(
      match => match.key === fieldKey || match.key.endsWith(fieldKey)
    );

    if (fieldMatches.length === 0) {
      return highlightSearchTerm(text, inputVal);
    }

    // Since we can't mutate the text directly, we'll use the fallback highlighting
    return highlightSearchTerm(text, inputVal);
  };

  // Fallback highlighting function
  const highlightSearchTerm = (text: string, term: string) => {
    if (!term || term.length < 1) return text;

    const regex = new RegExp(
      `(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded font-medium"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const handleCategoryFilter = (categoryName: string) => {
    setActiveCategoryFilter(prev =>
      prev === categoryName ? null : categoryName
    );
  };

  const getSuggestions = () => {
    if (inputVal.length === 0) return recentSearches;

    // Filter recent searches
    const filteredRecent = recentSearches.filter(search =>
      search.query.toLowerCase().includes(inputVal.toLowerCase())
    );

    // Add tag suggestions if input is short
    if (inputVal.length <= 3) {
      const tagSuggestions = categoryFilters
        .filter(
          category =>
            category.name.toLowerCase().startsWith(inputVal.toLowerCase()) &&
            !filteredRecent.some(recent => recent.query === category.name)
        )
        .slice(0, 3)
        .map(category => ({
          query: category.name,
          timestamp: Date.now(),
          isTag: true,
        }));

      return [...filteredRecent, ...tagSuggestions];
    }

    return filteredRecent;
  };

  return (
    <FadeIn
      direction="up"
      duration={600}
      disabled={disableAnimations}
      className={className}
    >
      {/* Command Palette Style Search Interface */}
      <ScaleIn
        variant="scale"
        duration={500}
        disabled={disableAnimations}
        className="relative"
      >
        <label className="relative block">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 opacity-75 z-10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="sr-only">Search</span>
          </span>

          <Input
            ref={inputRef}
            className="search-input-enhanced"
            placeholder="Search articles, topics, technologies... (Ctrl+K)"
            type="text"
            name="search"
            value={inputVal}
            onChange={handleChange}
            onFocus={() =>
              setShowSuggestions(
                inputVal.length === 0 && recentSearches.length > 0
              )
            }
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            autoComplete="off"
          />

          {/* Keyboard shortcut hint */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-4">
            <kbd className="search-kbd hidden sm:inline-flex items-center">
              ⌘K
            </kbd>
          </div>
        </label>

        {/* Search Suggestions Dropdown */}
        {showSuggestions && getSuggestions().length > 0 && (
          <SlideIn
            direction="down"
            duration={300}
            disabled={disableAnimations}
            className="search-suggestions absolute top-full left-0 right-0 mt-2 z-50 max-h-60 overflow-y-auto"
          >
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground px-3 py-2 mb-1">
                {inputVal.length === 0 ? "Recent Searches" : "Suggestions"}
              </div>
              {getSuggestions().map((search, index) => (
                <button
                  key={search.query}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    index === selectedSuggestionIndex
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => {
                    setInputVal(search.query);
                    setShowSuggestions(false);
                    setSelectedSuggestionIndex(-1);
                  }}
                >
                  <div className="flex items-center gap-2">
                    {search.isTag ? (
                      <svg
                        className="w-4 h-4 opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                    <span>{search.query}</span>
                    {search.isTag && (
                      <span className="text-xs opacity-60">tag</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </SlideIn>
        )}
      </ScaleIn>

      {/* Category Filters */}
      {inputVal.length > 0 && categoryFilters.length > 0 && (
        <SlideIn
          direction="up"
          delay={200}
          disabled={disableAnimations}
          className="mt-6"
        >
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm text-muted-foreground mr-2">
              Filter by category:
            </span>
            <Badge
              variant={activeCategoryFilter === null ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/20 transition-colors"
              onClick={() => setActiveCategoryFilter(null)}
            >
              All
            </Badge>
            {categoryFilters.slice(0, 8).map(category => (
              <Badge
                key={category.name}
                variant={
                  activeCategoryFilter === category.name ? "default" : "outline"
                }
                className="cursor-pointer hover:bg-primary/20 transition-colors"
                onClick={() => handleCategoryFilter(category.name)}
              >
                {category.name} ({category.count})
              </Badge>
            ))}
          </div>
        </SlideIn>
      )}

      {/* Search Results Header */}
      {inputVal.length > 1 && (
        <FadeIn
          direction="up"
          delay={300}
          disabled={disableAnimations}
          className="mt-6"
        >
          {isLoading ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full text-sm">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              <span>Searching...</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Found {searchResults?.length || 0}
              {searchResults?.length === 1 ? " result" : " results"} for{" "}
              <span className="font-semibold">'{inputVal}'</span>
              {searchStats && (
                <span className="text-xs opacity-75 ml-2">
                  ({searchStats.searchTime.toFixed(1)}ms across{" "}
                  {searchStats.totalPosts} posts)
                </span>
              )}
              {activeCategoryFilter && (
                <span className="text-xs opacity-75">
                  in{" "}
                  <Badge variant="secondary" className="text-xs">
                    {activeCategoryFilter}
                  </Badge>
                </span>
              )}
            </div>
          )}
        </FadeIn>
      )}

      {/* Search Results */}
      <div className="mt-6">
        {isSearching ? (
          /* Loading State with Skeletons */
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="p-6 rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm"
              >
                <Skeleton className="h-6 w-3/4 mb-3" />
                <Skeleton className="h-4 w-1/2 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2 mt-3">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : inputVal.length > 1 && searchResults?.length === 0 ? (
          /* No Results State */
          <div className="search-no-results text-center py-16 animate-in slide-in-from-bottom-2 duration-300">
            <div className="w-24 h-24 mx-auto mb-6 bg-muted/50 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">No articles found</h3>
            <p className="text-muted-foreground mb-6">
              We couldn't find any articles matching "
              <span className="font-medium">{inputVal}</span>"
              {activeCategoryFilter && (
                <span>
                  {" "}
                  in category "
                  <span className="font-medium">{activeCategoryFilter}</span>"
                </span>
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={() => setInputVal("")}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Clear search
              </button>
              {activeCategoryFilter && (
                <button
                  onClick={() => setActiveCategoryFilter(null)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  Remove category filter
                </button>
              )}
            </div>
            {recentSearches.length > 0 && (
              <div className="mt-8 pt-6 border-t border-border/40">
                <p className="text-sm text-muted-foreground mb-3">
                  Try one of your recent searches:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {recentSearches.slice(0, 3).map(search => (
                    <button
                      key={search.query}
                      onClick={() => setInputVal(search.query)}
                      className="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded-full transition-colors"
                    >
                      {search.query}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Search Results */
          <StaggerChildren
            animation="slide-up"
            staggerDelay={100}
            duration={500}
            disabled={disableAnimations}
            pattern="sequential"
          >
            {searchResults &&
              searchResults.map(({ item, refIndex, score, matches }) => (
                <div key={`${refIndex}-${item.slug}`}>
                  <div className="search-result-item group block p-6 relative overflow-hidden border border-border/40 bg-card/50 backdrop-blur-sm rounded-xl mb-4 hover:border-primary/30 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                    <div className="relative">
                      {/* Relevance score indicator */}
                      {score !== undefined && (
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  score < 0.3
                                    ? "bg-green-500"
                                    : score < 0.6
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                }`}
                              ></div>
                              <span className="text-xs text-muted-foreground">
                                {score < 0.3
                                  ? "Excellent match"
                                  : score < 0.6
                                    ? "Good match"
                                    : "Partial match"}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Relevance: {((1 - (score || 0)) * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}

                      <a href={`/posts/${item.slug}/`} className="block">
                        <h3 className="search-result-title text-lg font-medium mb-2 group-hover:text-primary transition-colors duration-300">
                          {highlightMatches(item.title, matches, "title")}
                        </h3>
                        <p className="search-result-description text-muted-foreground mb-3 line-clamp-3 text-sm leading-relaxed">
                          {highlightMatches(
                            item.description,
                            matches,
                            "description"
                          )}
                        </p>
                      </a>

                      {/* Tags */}
                      {item.data.tags && item.data.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {item.data.tags.slice(0, 4).map(tag => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs cursor-pointer hover:bg-primary/20 transition-colors"
                              onClick={e => {
                                e.preventDefault();
                                handleCategoryFilter(tag);
                              }}
                            >
                              {tag}
                            </Badge>
                          ))}
                          {item.data.tags.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{item.data.tags.length - 4} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Read more link */}
                      <a
                        href={`/posts/${item.slug}/`}
                        className="inline-flex items-center text-sm text-primary mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0"
                      >
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
                      </a>
                    </div>
                  </div>
                </div>
              ))}
          </StaggerChildren>
        )}
      </div>
    </FadeIn>
  );
}
