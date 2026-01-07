/**
 * AI-Powered Smart Search Engine
 * Provides semantic search, autocomplete, filters, and intelligent ranking
 */

// Product interface for type safety
export interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  price?: number;
  inStock?: boolean;
  tags?: string[];
  type?: string;
  [key: string]: any;
}

export interface SearchResult {
  id: string;
  type: "product" | "category" | "supplier" | "customer";
  title: string;
  description: string;
  relevanceScore: number;
  metadata: Record<string, any>;
  highlights: string[];
}

export interface SearchFilters {
  type?: string[];
  category?: string[];
  priceRange?: { min: number; max: number };
  inStock?: boolean;
  tags?: string[];
  dateRange?: { start: Date; end: Date };
}

export interface SearchOptions {
  query: string;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
  sortBy?: "relevance" | "name" | "price" | "date";
  sortOrder?: "asc" | "desc";
}

/**
 * Calculate semantic similarity between two strings using word overlap and fuzzy matching
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const normalize = (s: string) => s.toLowerCase().trim();
  const s1 = normalize(str1);
  const s2 = normalize(str2);

  // Exact match
  if (s1 === s2) return 1.0;

  // Contains match
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;

  // Word-based similarity
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);

  const commonWords = words1.filter((w) => words2.includes(w));
  const similarity = (2 * commonWords.length) / (words1.length + words2.length);

  // Character-based similarity (Levenshtein distance approximation)
  const maxLen = Math.max(s1.length, s2.length);
  const charSimilarity = 1 - levenshteinDistance(s1, s2) / maxLen;

  // Combined score (weighted average)
  return similarity * 0.6 + charSimilarity * 0.4;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = [];

  for (let i = 0; i <= m; i++) {
    dp[i] = [i];
  }

  for (let j = 1; j <= n; j++) {
    dp[0]![j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i]![j] = dp[i - 1]![j - 1]!;
      } else {
        dp[i]![j] =
          1 +
          Math.min(
            dp[i - 1]![j]!, // deletion
            dp[i]![j - 1]!, // insertion
            dp[i - 1]![j - 1]!, // substitution
          );
      }
    }
  }

  return dp[m]![n]!;
}

/**
 * Extract keywords from text for better matching
 */
export function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "has",
    "he",
    "in",
    "is",
    "it",
    "its",
    "of",
    "on",
    "that",
    "the",
    "to",
    "was",
    "will",
    "with",
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

/**
 * Rank search results by relevance
 */
export function rankResults(
  results: SearchResult[],
  query: string,
): SearchResult[] {
  const queryKeywords = extractKeywords(query);

  return results
    .map((result) => {
      let score = result.relevanceScore;

      // Boost exact title matches
      if (result.title.toLowerCase() === query.toLowerCase()) {
        score *= 2.0;
      }

      // Boost title containing query
      if (result.title.toLowerCase().includes(query.toLowerCase())) {
        score *= 1.5;
      }

      // Boost keyword matches
      const titleKeywords = extractKeywords(result.title);
      const descKeywords = extractKeywords(result.description);
      const allKeywords = [...titleKeywords, ...descKeywords];

      const matchingKeywords = queryKeywords.filter((kw) =>
        allKeywords.includes(kw),
      );
      const keywordScore = matchingKeywords.length / queryKeywords.length;
      score *= 1 + keywordScore;

      return { ...result, relevanceScore: score };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Generate search suggestions based on partial input
 */
export function generateSuggestions(
  partial: string,
  items: string[],
): string[] {
  if (!partial || partial.length < 2) return [];

  const normalized = partial.toLowerCase();

  return items
    .filter((item) => item.toLowerCase().includes(normalized))
    .map((item) => ({
      item,
      score: calculateSimilarity(partial, item),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((s) => s.item);
}

/**
 * Highlight matching terms in text
 */
export function highlightMatches(text: string, query: string): string {
  const keywords = extractKeywords(query);
  let highlighted = text;

  keywords.forEach((keyword) => {
    const regex = new RegExp(`(${keyword})`, "gi");
    highlighted = highlighted.replace(regex, "<mark>$1</mark>");
  });

  return highlighted;
}

/**
 * Build search index for faster lookups
 */
export class SearchIndex {
  private index: Map<string, Set<string>> = new Map();

  addDocument(id: string, text: string) {
    const keywords = extractKeywords(text);

    keywords.forEach((keyword) => {
      if (!this.index.has(keyword)) {
        this.index.set(keyword, new Set());
      }
      this.index.get(keyword)!.add(id);
    });
  }

  search(query: string): Set<string> {
    const keywords = extractKeywords(query);
    const results = new Set<string>();

    keywords.forEach((keyword) => {
      const docs = this.index.get(keyword);
      if (docs) {
        docs.forEach((doc) => results.add(doc));
      }
    });

    return results;
  }

  clear() {
    this.index.clear();
  }
}

/**
 * Advanced search with filters and pagination
 */
export interface SearchEngine<T> {
  index: (items: T[]) => void;
  search: (options: SearchOptions) => Promise<{
    results: SearchResult[];
    total: number;
    page: number;
    hasMore: boolean;
  }>;
  suggest: (partial: string) => Promise<string[]>;
  clearIndex: () => void;
}

/**
 * Create a search engine instance
 */
export function createSearchEngine<T>(): SearchEngine<T> {
  const searchIndex = new SearchIndex();
  let indexedItems: Map<string, T> = new Map();

  return {
    index: (items: T[]) => {
      searchIndex.clear();
      indexedItems.clear();

      items.forEach((item: any) => {
        const id = item.id || item._id || Math.random().toString(36);
        const text = `${item.name || item.title || ""} ${item.description || ""} ${item.tags?.join(" ") || ""}`;

        searchIndex.addDocument(id, text);
        indexedItems.set(id, item);
      });
    },

    search: async (options: SearchOptions) => {
      const {
        query,
        filters,
        limit = 20,
        offset = 0,
        sortBy = "relevance",
        sortOrder = "desc",
      } = options;

      // Get matching document IDs
      const matchingIds = searchIndex.search(query);

      // Convert to search results
      let results: SearchResult[] = Array.from(matchingIds)
        .map((id) => {
          const item: any = indexedItems.get(id);
          if (!item) return null;

          const title = item.name || item.title || "";
          const description = item.description || "";
          const relevanceScore = calculateSimilarity(
            query,
            `${title} ${description}`,
          );

          return {
            id,
            type: item.type || "product",
            title,
            description,
            relevanceScore,
            metadata: item,
            highlights: [highlightMatches(title, query)],
          };
        })
        .filter((r): r is SearchResult => r !== null);

      // Apply filters
      if (filters) {
        results = results.filter((result) => {
          if (filters.type && !filters.type.includes(result.type)) return false;
          if (filters.inStock !== undefined && result.metadata.stock <= 0)
            return false;
          if (filters.priceRange) {
            const price = result.metadata.price || 0;
            if (
              price < filters.priceRange.min ||
              price > filters.priceRange.max
            )
              return false;
          }
          return true;
        });
      }

      // Rank and sort
      results = rankResults(results, query);

      if (sortBy !== "relevance") {
        results.sort((a, b) => {
          let aVal: any, bVal: any;

          switch (sortBy) {
            case "name":
              aVal = a.title;
              bVal = b.title;
              break;
            case "price":
              aVal = a.metadata.price || 0;
              bVal = b.metadata.price || 0;
              break;
            case "date":
              aVal = a.metadata.createdAt || 0;
              bVal = b.metadata.createdAt || 0;
              break;
            default:
              return 0;
          }

          const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          return sortOrder === "asc" ? comparison : -comparison;
        });
      }

      // Paginate
      const total = results.length;
      const paginatedResults = results.slice(offset, offset + limit);

      return {
        results: paginatedResults,
        total,
        page: Math.floor(offset / limit) + 1,
        hasMore: offset + limit < total,
      };
    },

    suggest: async (partial: string) => {
      const allTitles = Array.from(indexedItems.values()).map(
        (item: any) => item.name || item.title || "",
      );
      return generateSuggestions(partial, allTitles);
    },

    clearIndex: () => {
      searchIndex.clear();
      indexedItems.clear();
    },
  };
}

/**
 * Search history tracking
 */
export class SearchHistory {
  private history: string[] = [];
  private maxSize = 50;

  add(query: string) {
    // Remove duplicates
    this.history = this.history.filter((q) => q !== query);

    // Add to front
    this.history.unshift(query);

    // Limit size
    if (this.history.length > this.maxSize) {
      this.history = this.history.slice(0, this.maxSize);
    }
  }

  get(limit: number = 10): string[] {
    return this.history.slice(0, limit);
  }

  clear() {
    this.history = [];
  }
}

/**
 * Popular searches tracking
 */
export class PopularSearches {
  private searches: Map<string, number> = new Map();

  increment(query: string) {
    const count = this.searches.get(query) || 0;
    this.searches.set(query, count + 1);
  }

  getTop(limit: number = 10): Array<{ query: string; count: number }> {
    return Array.from(this.searches.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  clear() {
    this.searches.clear();
  }
}
