"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, Sparkles, ShoppingCart, Star } from "lucide-react";

interface Recommendation {
  productId: string;
  productName: string;
  score: number;
  reason: string;
  category: string;
  price: number;
  imageUrl?: string;
}

interface ProductRecommendationsProps {
  productId?: string;
  customerId?: string;
  limit?: number;
  showTypes?: Array<"user-based" | "item-based" | "trending" | "personalized" | "all">;
}

export function ProductRecommendations({
  productId,
  customerId,
  limit = 10,
  showTypes = ["all"],
}: ProductRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Record<string, Recommendation[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    fetchRecommendations();
  }, [productId, customerId]);

  const fetchRecommendations = async () => {
    setLoading(true);
    const results: Record<string, Recommendation[]> = {};

    try {
      // Fetch recommendations for each type
      for (const type of showTypes) {
        const response = await fetch(
          `/api/recommendations/${productId || "default"}?type=${type}&limit=${limit}`
        );

        if (response.ok) {
          const data = await response.json();
          results[type] = data.recommendations || [];
        }
      }

      setRecommendations(results);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTabIcon = (type: string) => {
    switch (type) {
      case "user-based":
        return <Users className="h-4 w-4" />;
      case "item-based":
        return <ShoppingCart className="h-4 w-4" />;
      case "trending":
        return <TrendingUp className="h-4 w-4" />;
      case "personalized":
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  const getTabTitle = (type: string) => {
    switch (type) {
      case "user-based":
        return "Customers Also Bought";
      case "item-based":
        return "Frequently Bought Together";
      case "trending":
        return "Trending Now";
      case "personalized":
        return "Recommended for You";
      default:
        return "All Recommendations";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-blue-600";
    if (score >= 0.4) return "text-yellow-600";
    return "text-gray-600";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading recommendations...</p>
          </div>
        </div>
      </div>
    );
  }

  const currentRecommendations = recommendations[activeTab] || [];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      {showTypes.length > 1 && (
        <div className="flex flex-wrap gap-2 border-b pb-4">
          {showTypes.map((type) => (
            <Button
              key={type}
              variant={activeTab === type ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(type)}
              className="gap-2"
            >
              {getTabIcon(type)}
              {getTabTitle(type)}
              {recommendations[type] && (
                <Badge variant="secondary" className="ml-1">
                  {recommendations[type].length}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      )}

      {/* Recommendations Grid */}
      {currentRecommendations.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              We don't have enough data to generate recommendations yet. As you browse and
              purchase products, we'll learn your preferences.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Grid Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{getTabTitle(activeTab)}</h3>
              <p className="text-sm text-muted-foreground">
                {currentRecommendations.length} product{currentRecommendations.length !== 1 ? "s" : ""} recommended
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchRecommendations}>
              Refresh
            </Button>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {currentRecommendations.map((rec) => (
              <Card
                key={rec.productId}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
              >
                {/* Product Image */}
                <div className="aspect-square bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  {rec.imageUrl ? (
                    <img
                      src={rec.imageUrl}
                      alt={rec.productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ShoppingCart className="h-16 w-16 text-muted-foreground opacity-50" />
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4 space-y-3">
                  {/* Category Badge */}
                  <Badge variant="outline" className="text-xs">
                    {rec.category}
                  </Badge>

                  {/* Product Name */}
                  <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {rec.productName}
                  </h4>

                  {/* Reason */}
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {rec.reason}
                  </p>

                  {/* Price and Score */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Price</p>
                      <p className="text-lg font-bold text-primary">
                        ${rec.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Match</p>
                      <div className="flex items-center gap-1">
                        <Star className={`h-4 w-4 ${getScoreColor(rec.score)}`} fill="currentColor" />
                        <p className={`text-sm font-semibold ${getScoreColor(rec.score)}`}>
                          {(rec.score * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => {
                      // Navigate to product or add to cart
                      window.location.href = `/dashboard/inventory/${rec.productId}`;
                    }}
                  >
                    View Product
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Stats Summary */}
      {currentRecommendations.length > 0 && (
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Products</p>
              <p className="text-2xl font-bold">{currentRecommendations.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Avg Match Score</p>
              <p className="text-2xl font-bold">
                {(
                  (currentRecommendations.reduce((sum, r) => sum + r.score, 0) /
                    currentRecommendations.length) *
                  100
                ).toFixed(0)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Price Range</p>
              <p className="text-2xl font-bold">
                ${Math.min(...currentRecommendations.map((r) => r.price)).toFixed(0)} -
                ${Math.max(...currentRecommendations.map((r) => r.price)).toFixed(0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Categories</p>
              <p className="text-2xl font-bold">
                {new Set(currentRecommendations.map((r) => r.category)).size}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
