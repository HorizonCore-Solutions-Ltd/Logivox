"use client";

import * as React from "react";
import {
  Search,
  X,
  Clock,
  TrendingUp,
  FileText,
  BookOpen,
  HelpCircle,
  Code,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Suggestion {
  id: string;
  text: string;
  type?: "recent" | "popular" | "category" | "page";
  url?: string;
  category?: string;
}

interface AutoSuggestSearchProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onValueChange: (value: string) => void;
  suggestions: Suggestion[];
  onSuggestionSelect?: (suggestion: Suggestion) => void;
  showHistory?: boolean;
  contextType?: "blog" | "docs" | "help" | "general";
  onSearch?: (query: string) => void;
}

export function AutoSuggestSearch({
  value,
  onValueChange,
  suggestions,
  onSuggestionSelect,
  showHistory = true,
  contextType = "general",
  onSearch,
  className,
  placeholder = "Search...",
  ...props
}: AutoSuggestSearchProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [focusedIndex, setFocusedIndex] = React.useState(-1);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
  const searchRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  React.useEffect(() => {
    if (showHistory) {
      const stored = localStorage.getItem(`search-history-${contextType}`);
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to load search history:", e);
        }
      }
    }
  }, [showHistory, contextType]);

  // Handle click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Popular searches by context
  const popularSearches = React.useMemo(() => {
    const searches: Record<string, string[]> = {
      blog: [
        "Warehouse automation",
        "Inventory optimization",
        "Voice picking",
        "Best practices",
      ],
      docs: [
        "API authentication",
        "Getting started",
        "Webhooks",
        "Integration guide",
      ],
      help: [
        "How to track orders",
        "Reset password",
        "Configure users",
        "Troubleshooting",
      ],
      general: [
        "Warehouse management",
        "Order fulfillment",
        "Returns processing",
        "Real-time tracking",
      ],
    };
    return searches[contextType] || searches.general;
  }, [contextType]);

  const saveToHistory = (query: string) => {
    if (!query.trim() || !showHistory) return;

    const updated = [
      query,
      ...recentSearches.filter((s) => s.toLowerCase() !== query.toLowerCase()),
    ].slice(0, 5);

    setRecentSearches(updated);
    localStorage.setItem(
      `search-history-${contextType}`,
      JSON.stringify(updated),
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onValueChange(newValue);
    setIsOpen(true);
    setFocusedIndex(-1);
  };

  const handleSuggestionClick = (suggestion: Suggestion | string) => {
    const queryText =
      typeof suggestion === "string" ? suggestion : suggestion.text;
    onValueChange(queryText);
    saveToHistory(queryText);

    if (typeof suggestion === "object" && onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }

    if (onSearch) {
      onSearch(queryText);
    }

    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allSuggestions = [
      ...suggestions,
      ...(value.trim() === "" && showHistory
        ? recentSearches.map((text) => ({
            id: text,
            text,
            type: "recent" as const,
          }))
        : []),
    ];

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => Math.min(prev + 1, allSuggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && allSuggestions[focusedIndex]) {
        handleSuggestionClick(allSuggestions[focusedIndex]);
      } else if (value.trim()) {
        saveToHistory(value);
        if (onSearch) {
          onSearch(value);
        }
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    onValueChange("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const clearHistory = () => {
    setRecentSearches([]);
    localStorage.removeItem(`search-history-${contextType}`);
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case "recent":
        return <Clock className="h-4 w-4" />;
      case "popular":
        return <TrendingUp className="h-4 w-4" />;
      case "page":
        return <FileText className="h-4 w-4" />;
      case "category":
        return contextType === "docs" ? (
          <Code className="h-4 w-4" />
        ) : (
          <BookOpen className="h-4 w-4" />
        );
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const showSuggestions =
    isOpen &&
    (value.trim() !== "" ||
      (showHistory && recentSearches.length > 0) ||
      popularSearches.length > 0);

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={cn("pl-10 pr-10", className)}
          {...props}
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showSuggestions && (
        <div className="absolute z-50 w-full mt-2 bg-popover border rounded-lg shadow-lg max-h-[400px] overflow-y-auto">
          {/* Suggestions from search */}
          {value.trim() !== "" && suggestions.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                Suggestions
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-left",
                    focusedIndex === index && "bg-accent",
                  )}
                >
                  <span className="text-muted-foreground">
                    {getTypeIcon(suggestion.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {suggestion.text}
                    </div>
                    {suggestion.category && (
                      <div className="text-xs text-muted-foreground truncate">
                        {suggestion.category}
                      </div>
                    )}
                  </div>
                  {suggestion.type && (
                    <Badge variant="secondary" className="text-xs">
                      {suggestion.type}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Recent searches */}
          {value.trim() === "" && showHistory && recentSearches.length > 0 && (
            <div className="p-2 border-t">
              <div className="flex items-center justify-between px-3 py-2">
                <div className="text-xs font-semibold text-muted-foreground">
                  Recent Searches
                </div>
                <button
                  onClick={clearHistory}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={search}
                  onClick={() => handleSuggestionClick(search)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-left",
                    focusedIndex === index + suggestions.length && "bg-accent",
                  )}
                >
                  <span className="text-muted-foreground">
                    <Clock className="h-4 w-4" />
                  </span>
                  <span className="flex-1 truncate">{search}</span>
                </button>
              ))}
            </div>
          )}

          {/* Popular searches */}
          {value.trim() === "" && popularSearches.length > 0 && (
            <div className="p-2 border-t">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                Popular Searches
              </div>
              {popularSearches.map((search) => (
                <button
                  key={search}
                  onClick={() => handleSuggestionClick(search)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-left"
                >
                  <span className="text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                  </span>
                  <span className="flex-1 truncate">{search}</span>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {value.trim() !== "" && suggestions.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No results found for "{value}"</p>
              <p className="text-xs mt-1">Try different keywords</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
