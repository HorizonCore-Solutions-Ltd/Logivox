"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface CatalogueEntry {
  provider: string;
  category: string;
  name: string;
  description: string;
  authType: string;
  syncDirection: string;
  webhookSupport: boolean;
  docsUrl: string;
  logoEmoji: string;
  popularity: "HIGH" | "MEDIUM" | "LOW";
  setupComplexity: "LOW" | "MEDIUM" | "HIGH" | "ENTERPRISE";
  connectorRoute?: string;
}

interface CategorySummary {
  id: string;
  label: string;
  count: number;
  total: number;
}

interface Connection {
  id: string;
  provider: string;
  isActive: boolean;
  name: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  ACCOUNTING: "🧾",
  ERP: "🏭",
  ECOMMERCE: "🛒",
  SHIPPING: "📦",
  PAYMENT: "💳",
  CRM: "👥",
  MARKETING: "📣",
  COMMUNICATION: "💬",
  ANALYTICS: "📉",
  BI: "📊",
  HR: "🧑‍💼",
  SSO: "🔐",
  ACCESS_CONTROL: "🚪",
  HARDWARE: "🔧",
  ROBOTICS: "🤖",
  TMS_YMS: "🚛",
  QMS: "✅",
  IOT_CLOUD: "☁️",
  VOICE_HARDWARE: "🎧",
  CUSTOM: "⚙️",
};

const COMPLEXITY_COLORS: Record<string, string> = {
  LOW: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  ENTERPRISE: "bg-red-100 text-red-800",
};

const POPULARITY_STARS: Record<string, string> = {
  HIGH: "★★★",
  MEDIUM: "★★☆",
  LOW: "★☆☆",
};

export default function IntegrationCataloguePage() {
  const [catalogue, setCatalogue] = useState<CatalogueEntry[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [catalogueRes, connectionsRes] = await Promise.all([
        fetch("/api/integrations/catalogue"),
        fetch("/api/integrations/connections"),
      ]);

      if (!catalogueRes.ok) throw new Error("Failed to load catalogue");

      const catalogueData = await catalogueRes.json();
      setCatalogue(catalogueData.catalogue ?? []);
      setCategories([
        {
          id: "ALL",
          label: "All",
          count: catalogueData.total,
          total: catalogueData.total,
        },
        ...(catalogueData.categories ?? []),
      ]);

      if (connectionsRes.ok) {
        const connectionsData = await connectionsRes.json();
        setConnections(connectionsData.connections ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const connectedProviders = new Set(
    connections.filter((c) => c.isActive).map((c) => c.provider),
  );

  const filteredCatalogue = catalogue.filter((entry) => {
    const matchCategory =
      activeCategory === "ALL" || entry.category === activeCategory;
    const matchSearch =
      !searchQuery ||
      entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.provider.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const getConnectionStatus = (provider: string): "connected" | "available" => {
    return connectedProviders.has(provider) ? "connected" : "available";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading integration catalogue…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow p-8 max-w-md text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Failed to load catalogue
          </h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Integration Catalogue
              </h1>
              <p className="text-gray-500 mt-1">
                {catalogue.length} integrations across {categories.length - 1}{" "}
                categories ·{" "}
                <span className="text-green-600 font-medium">
                  {connections.filter((c) => c.isActive).length} connected
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/integrations"
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                My Integrations
              </Link>
              <Link
                href="/integrations/new"
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                + Add Integration
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4 relative max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search integrations…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">
        {/* Sidebar: Category tabs */}
        <aside className="w-56 flex-shrink-0">
          <nav className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm border-b border-gray-50 last:border-0 transition ${
                  activeCategory === cat.id
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{CATEGORY_ICONS[cat.id] ?? "🔌"}</span>
                  <span className="truncate">{cat.label}</span>
                </span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeCategory === cat.id
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main grid */}
        <main className="flex-1 min-w-0">
          {filteredCatalogue.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="text-4xl mb-4">🔌</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">
                No integrations found
              </h3>
              <p className="text-gray-400 text-sm">
                Try adjusting your search or category filter.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">
                Showing {filteredCatalogue.length} integration
                {filteredCatalogue.length !== 1 ? "s" : ""}
                {activeCategory !== "ALL" && (
                  <span>
                    {" "}
                    in <strong>{activeCategory.replace(/_/g, " ")}</strong>
                  </span>
                )}
                {searchQuery && (
                  <span> matching &ldquo;{searchQuery}&rdquo;</span>
                )}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredCatalogue.map((entry) => {
                  const status = getConnectionStatus(entry.provider);

                  return (
                    <div
                      key={entry.provider}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col hover:shadow-md transition"
                    >
                      {/* Top row */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl leading-none">
                            {entry.logoEmoji}
                          </span>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                              {entry.name}
                            </h3>
                            <span className="text-xs text-gray-400">
                              {CATEGORY_ICONS[entry.category] ?? "🔌"}{" "}
                              {entry.category.replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>
                        {status === "connected" ? (
                          <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                            Connected
                          </span>
                        ) : (
                          <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                            Available
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-1 line-clamp-2">
                        {entry.description}
                      </p>

                      {/* Meta badges */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700">
                          {entry.authType}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-50 text-purple-700">
                          {entry.syncDirection}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${COMPLEXITY_COLORS[entry.setupComplexity]}`}
                        >
                          {entry.setupComplexity}
                        </span>
                        {entry.webhookSupport && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                            Webhooks
                          </span>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                        <span
                          className="text-xs text-yellow-500"
                          title={`Popularity: ${entry.popularity}`}
                        >
                          {POPULARITY_STARS[entry.popularity]}
                        </span>
                        <div className="flex items-center gap-2">
                          {entry.docsUrl && (
                            <a
                              href={entry.docsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-gray-400 hover:text-gray-600 transition"
                              title="Documentation"
                            >
                              Docs ↗
                            </a>
                          )}
                          {status === "connected" ? (
                            <Link
                              href="/integrations"
                              className="text-xs px-3 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition font-medium"
                            >
                              Manage
                            </Link>
                          ) : (
                            <Link
                              href={`/integrations/new?provider=${entry.provider}`}
                              className="text-xs px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-medium"
                            >
                              Connect
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
