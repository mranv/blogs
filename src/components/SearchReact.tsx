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
          <Search className="h-5 w-5 search-icon" />
        </span>
        <input
          className="search-input-enhanced block w-full"
          placeholder="Search for anything..."
          type="text"
          name="search"
          value={inputVal}
          onChange={handleInputChange}
          autoComplete="off"
        />
        {inputVal && (
          <button
            className="absolute inset-y-0 right-0 flex items-center pr-4 search-clear-btn"
            onClick={clearSearch}
            type="button"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </label>

      {inputVal.length > 1 && (
        <div className="search-results absolute top-full left-0 right-0 z-10 mt-2 max-h-80 overflow-auto">
          {searchResults && searchResults.length > 0 ? (
            <ul className="py-2">
              {searchResults.map(({ slug, title, description }) => (
                <li key={slug}>
                  <a
                    href={`/posts/${slug}/`}
                    className="search-result-item block px-4 py-3 focus:outline-none"
                  >
                    <h3 className="search-result-title text-sm font-medium mb-1">
                      {title}
                    </h3>
                    <p className="search-result-description text-xs line-clamp-2">
                      {description}
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="search-no-results text-sm">
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
