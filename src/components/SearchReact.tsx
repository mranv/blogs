import { useState, useEffect, useMemo } from "react";
import Fuse from "fuse.js";
import { Search, X } from "lucide-react";
import type { CollectionEntry } from "astro:content";

export interface SearchItem {
  title: string;
  description: string;
  data: CollectionEntry<"blog">["data"];
  slug: string;
}

export interface Props {
  searchList: SearchItem[];
}

export default function SearchReact({ searchList }: Props) {
  const [inputVal, setInputVal] = useState("");
  const [searchResults, setSearchResults] = useState<SearchItem[] | null>(null);

  const fuse = useMemo(
    () =>
      new Fuse(searchList, {
        keys: ["title", "description"],
        includeMatches: true,
        minMatchCharLength: 2,
        threshold: 0.5,
      }),
    [searchList]
  );

  useEffect(() => {
    if (inputVal.length > 0) {
      const results = fuse
        .search(inputVal)
        .map(({ item }) => item)
        .slice(0, 6);
      setSearchResults(results);
    } else {
      setSearchResults(null);
    }
  }, [inputVal, fuse]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputVal(e.target.value);
  };

  const clearSearch = () => {
    setInputVal("");
    setSearchResults(null);
  };

  return (
    <div className="relative">
      <label className="relative block">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4">
          <Search className="h-5 w-5 text-muted-foreground" />
        </span>
        <input
          className="block w-full rounded-md border border-input bg-background py-3 pl-12 pr-12 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Search for anything..."
          type="text"
          name="search"
          value={inputVal}
          onChange={handleInputChange}
          autoComplete="off"
        />
        {inputVal && (
          <button
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground hover:text-foreground"
            onClick={clearSearch}
            type="button"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </label>

      {inputVal.length > 1 && (
        <div className="absolute top-full left-0 right-0 z-10 mt-2 max-h-80 overflow-auto rounded-md border border-border bg-popover shadow-lg">
          {searchResults && searchResults.length > 0 ? (
            <ul className="py-2">
              {searchResults.map(({ slug, title, description }) => (
                <li key={slug}>
                  <a
                    href={`/posts/${slug}/`}
                    className="block px-4 py-3 hover:bg-accent focus:bg-accent focus:outline-none"
                  >
                    <h3 className="text-sm font-medium text-foreground mb-1">
                      {title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {description}
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No articles found for "
                <span className="font-medium">{inputVal}</span>"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
