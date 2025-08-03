import { useState, useEffect } from "react";
import type { CollectionEntry } from "astro:content";

export type SearchItem = {
  title: string;
  description: string;
  data: CollectionEntry<"blog">["data"];
  slug: string;
};

interface Props {
  searchList: SearchItem[];
}

export default function SearchSimple({ searchList }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    // Simple search logic
    const results = searchList.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.title.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        (item.data.tags &&
          item.data.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    });

    setSearchResults(results);
    setIsSearching(false);
  }, [searchTerm, searchList]);

  return (
    <div className="search-container max-w-4xl mx-auto">
      {/* Search Input */}
      <div className="relative mb-8">
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search articles... (min 2 characters)"
          className="w-full px-4 py-3 pl-12 text-lg border-2 border-border rounded-xl bg-background hover:border-primary/50 focus:border-primary focus:outline-none transition-colors"
        />
        <svg
          className="absolute left-4 top-4 w-5 h-5 text-muted-foreground"
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

      {/* Search Status */}
      {searchTerm.length > 0 && searchTerm.length < 2 && (
        <div className="text-muted-foreground text-center py-4">
          Type at least 2 characters to search...
        </div>
      )}

      {isSearching && (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-muted-foreground">Searching...</p>
        </div>
      )}

      {/* Search Results */}
      {searchTerm.length >= 2 && !isSearching && (
        <div>
          <div className="mb-4 text-sm text-muted-foreground">
            Found {searchResults.length} result
            {searchResults.length !== 1 ? "s" : ""} for "{searchTerm}"
          </div>

          {searchResults.length === 0 ? (
            <div className="text-center py-16 bg-muted/20 rounded-xl">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-xl font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try searching with different keywords
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.map(result => (
                <a
                  key={result.slug}
                  href={`/posts/${result.slug}/`}
                  className="block p-6 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-lg transition-all duration-200"
                >
                  <h3 className="text-xl font-semibold mb-2 text-foreground hover:text-primary transition-colors">
                    {result.title}
                  </h3>
                  <p className="text-muted-foreground mb-3 line-clamp-2">
                    {result.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {result.data.tags?.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-primary text-sm font-medium">
                      Read more →
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Initial State */}
      {searchTerm.length === 0 && (
        <div className="text-center py-16">
          <svg
            className="w-24 h-24 mx-auto mb-6 text-primary/20"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h2 className="text-2xl font-semibold mb-2">Start searching</h2>
          <p className="text-muted-foreground">
            Enter keywords to find articles from our collection
          </p>
        </div>
      )}
    </div>
  );
}
