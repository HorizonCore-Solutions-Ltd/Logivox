"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import { Badge } from "@repo/ui/components/ui/badge";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";

interface SearchResult {
  id: string;
  type: "product" | "category" | "supplier" | "customer";
  title: string;
  description: string;
  relevanceScore: number;
  metadata: any;
}

interface SmartSearchProps {
  onSelect?: (result: SearchResult) => void;
  placeholder?: string;
  showHistory?: boolean;
}

export function SmartSearch({ onSelect, placeholder = "Search products, orders, customers...", showHistory = true }: SmartSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<Array<{ query: string; count: number }>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load search history and popular searches
    const history = localStorage.getItem("searchHistory");
    if (history) {
      setSearchHistory(JSON.parse(history));
    }

    loadPopularSearches();

    // Click outside to close
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadPopularSearches = async () => {
    try {
      const response = await fetch("/api/search/popular");
      if (response.ok) {
        const data = await response.json();
        setPopularSearches(data.searches || []);
      }
    } catch (error) {
      console.error("Error loading popular searches:", error);
    }
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Get autocomplete suggestions
      const suggestResponse = await fetch(`/api/search/suggest?q=${encodeURIComponent(searchQuery)}`);
      if (suggestResponse.ok) {
        const suggestData = await suggestResponse.json();
        setSuggestions(suggestData.suggestions || []);
      }

      // Perform search
      const searchResponse = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        setResults(searchData.results || []);
      }
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setIsOpen(true);

    // Debounced search
    const timeoutId = setTimeout(() => {
      if (value.trim()) {
        handleSearch(value);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const selectResult = (result: SearchResult) => {
    // Add to search history
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));

    // Track search
    fetch("/api/search/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, resultId: result.id }),
    }).catch(console.error);

    if (onSelect) {
      onSelect(result);
    }

    setIsOpen(false);
    setQuery("");
  };

  const selectSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("searchHistory");
  };

  const getTypeIcon = (type: string) => {
    // Return appropriate icon based on type
    return null;
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      product: "bg-blue-100 text-blue-800",
      category: "bg-green-100 text-green-800",
      supplier: "bg-purple-100 text-purple-800",
      customer: "bg-orange-100 text-orange-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setSuggestions([]);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <Card className="absolute top-full mt-2 w-full max-h-[500px] overflow-y-auto z-50 shadow-lg">
          <CardContent className="p-0">
            {/* Loading State */}
            {loading && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            )}

            {/* Autocomplete Suggestions */}
            {!loading && suggestions.length > 0 && (
              <div className="border-b">
                <div className="p-2 text-xs text-muted-foreground font-medium">Suggestions</div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => selectSuggestion(suggestion)}
                    className="w-full text-left px-4 py-2 hover:bg-muted flex items-center gap-2"
                  >
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Search Results */}
            {!loading && results.length > 0 && (
              <div className="border-b">
                <div className="p-2 text-xs text-muted-foreground font-medium">
                  Results ({results.length})
                </div>
                {results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => selectResult(result)}
                    className="w-full text-left px-4 py-3 hover:bg-muted border-b last:border-b-0"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">{result.title}</span>
                          <Badge className={getTypeBadge(result.type)}>
                            {result.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {result.description}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0">
                        {Math.round(result.relevanceScore * 100)}% match
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {!loading && query && results.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No results found for "{query}"</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Try different keywords or check your spelling
                </p>
              </div>
            )}

            {/* Search History */}
            {!loading && !query && showHistory && searchHistory.length > 0 && (
              <div className="border-b">
                <div className="p-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Recent Searches</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                    className="h-6 text-xs"
                  >
                    Clear
                  </Button>
                </div>
                {searchHistory.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => selectSuggestion(search)}
                    className="w-full text-left px-4 py-2 hover:bg-muted flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{search}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Popular Searches */}
            {!loading && !query && popularSearches.length > 0 && (
              <div>
                <div className="p-2 text-xs text-muted-foreground font-medium">Trending Searches</div>
                {popularSearches.slice(0, 5).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => selectSuggestion(search.query)}
                    className="w-full text-left px-4 py-2 hover:bg-muted flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span>{search.query}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{search.count} searches</span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
