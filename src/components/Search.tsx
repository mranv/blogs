import Fuse from "fuse.js";
import { useEffect, useRef, useState, useMemo } from "react";
import Card from "@components/Card";
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

interface SearchResult {
  item: SearchItem;
  refIndex: number;
}

export default function SearchBar({ searchList }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputVal, setInputVal] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(
    null
  );

  const handleChange = (e: React.FormEvent<HTMLInputElement>) => {
    setInputVal(e.currentTarget.value);
  };

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
  }, []);

  useEffect(() => {
    // Add search result only if
    // input value is more than one character
    let inputResult = inputVal.length > 1 ? fuse.search(inputVal) : [];
    setSearchResults(inputResult);

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
  }, [inputVal]);

  return (
    <>
      <label className="relative block">
        <span className="absolute inset-y-0 left-0 flex items-center pl-2 opacity-75">
          <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M19.023 16.977a35.13 35.13 0 0 1-1.367-1.384c-.372-.378-.596-.653-.596-.653l-2.8-1.337A6.962 6.962 0 0 0 16 9c0-3.859-3.14-7-7-7S2 5.141 2 9s3.14 7 7 7c1.763 0 3.37-.66 4.603-1.739l1.337 2.8s.275.224.653.596c.387.363.896.854 1.384 1.367l1.358 1.392.604.646 2.121-2.121-.646-.604c-.379-.372-.885-.866-1.391-1.36zM9 14c-2.757 0-5-2.243-5-5s2.243-5 5-5 5 2.243 5 5-2.243 5-5 5z"></path>
          </svg>
          <span className="sr-only">Search</span>
        </span>
        <input
          className="block w-full rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm py-4 pl-10 pr-3 
                   placeholder:italic placeholder:text-muted-foreground/60 text-foreground
                   focus:border-primary/50 focus:bg-card/80 focus:outline-none focus:ring-2 focus:ring-primary/20
                   transition-all duration-300 hover:border-border/60 hover:bg-card/70
                   shadow-sm hover:shadow-md focus:shadow-lg"
          placeholder="Search articles, topics, technologies..."
          type="text"
          name="search"
          value={inputVal}
          onChange={handleChange}
          autoComplete="off"
          ref={inputRef}
        />
      </label>

      {inputVal.length > 1 && (
        <div className="mt-8 animate-in slide-in-from-top-2 duration-300">
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
            Found {searchResults?.length}
            {searchResults?.length && searchResults?.length === 1
              ? " result"
              : " results"}{" "}
            for <span className="font-semibold">'{inputVal}'</span>
          </div>
        </div>
      )}

      <ul className="space-y-4 mt-6">
        {searchResults &&
          searchResults.map(({ item, refIndex }, index) => (
            <div
              key={`${refIndex}-${item.slug}`}
              className="animate-in slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Card href={`/posts/${item.slug}/`} frontmatter={item.data} />
            </div>
          ))}
      </ul>
    </>
  );
}
