/**
 * AI-Powered Product Recommendations Engine
 * Collaborative filtering, purchase history analysis, and personalized suggestions
 */

export interface RecommendationResult {
  productId: string;
  productName: string;
  score: number;
  reason: string;
  category: string;
  price: number;
  imageUrl?: string;
}

export interface UserProfile {
  userId: string;
  purchases: Array<{ productId: string; quantity: number; date: Date }>;
  views: Array<{ productId: string; timestamp: Date }>;
  categories: string[];
  priceRange: { min: number; max: number };
}

/**
 * Calculate Jaccard similarity between two sets
 */
function jaccardSimilarity<T>(set1: Set<T>, set2: Set<T>): number {
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) return 0;

  let dotProduct: number = 0;
  let mag1: number = 0;
  let mag2: number = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += (vec1[i] ?? 0) * (vec2[i] ?? 0);
    mag1 += (vec1[i] ?? 0) * (vec1[i] ?? 0);
    mag2 += (vec2[i] ?? 0) * (vec2[i] ?? 0);
  }

  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);

  return mag1 === 0 || mag2 === 0 ? 0 : dotProduct / (mag1 * mag2);
}

/**
 * Collaborative Filtering - User-based recommendations
 */
export async function getUserBasedRecommendations(
  userId: string,
  allUsers: UserProfile[],
  allProducts: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
  }>,
  limit: number = 10,
): Promise<RecommendationResult[]> {
  const currentUser = allUsers.find((u) => u.userId === userId);
  if (!currentUser) return [];

  const currentUserProducts = new Set(
    currentUser.purchases.map((p) => p.productId),
  );

  // Find similar users
  const similarities = allUsers
    .filter((u) => u.userId !== userId)
    .map((user) => {
      const userProducts = new Set(user.purchases.map((p) => p.productId));
      const similarity = jaccardSimilarity(currentUserProducts, userProducts);
      return { userId: user.userId, similarity, products: userProducts };
    })
    .filter((s) => s.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10); // Top 10 similar users

  // Aggregate product scores from similar users
  const productScores = new Map<string, number>();

  similarities.forEach(({ similarity, products }) => {
    products.forEach((productId) => {
      if (!currentUserProducts.has(productId)) {
        const currentScore = productScores.get(productId) || 0;
        productScores.set(productId, currentScore + similarity);
      }
    });
  });

  // Convert to recommendations
  const recommendations = Array.from(productScores.entries())
    .map(([productId, score]) => {
      const product = allProducts.find((p) => p.id === productId);
      if (!product) return null;

      return {
        productId,
        productName: product.name,
        score,
        reason: "Customers like you also purchased this",
        category: product.category,
        price: product.price,
      };
    })
    .filter((r): r is RecommendationResult => r !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return recommendations;
}

/**
 * Collaborative Filtering - Item-based recommendations
 */
export async function getItemBasedRecommendations(
  productId: string,
  allProducts: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    tags?: string[];
    description?: string;
  }>,
  purchaseHistory: Array<{ productId: string; relatedProductId: string }>,
  limit: number = 10,
): Promise<RecommendationResult[]> {
  const currentProduct = allProducts.find((p) => p.id === productId);
  if (!currentProduct) return [];

  // Find products frequently purchased together
  const relatedProducts = new Map<string, number>();

  purchaseHistory
    .filter((h) => h.productId === productId)
    .forEach((h) => {
      const count = relatedProducts.get(h.relatedProductId) || 0;
      relatedProducts.set(h.relatedProductId, count + 1);
    });

  // Also find similar products by category and tags
  const similarProducts = allProducts
    .filter((p) => p.id !== productId)
    .map((product) => {
      let similarity = 0;

      // Category match
      if (product.category === currentProduct.category) {
        similarity += 0.5;
      }

      // Tag similarity
      if (currentProduct.tags && product.tags) {
        const tagSimilarity = jaccardSimilarity(
          new Set(currentProduct.tags),
          new Set(product.tags),
        );
        similarity += tagSimilarity * 0.3;
      }

      // Price similarity (closer prices = higher similarity)
      const priceDiff = Math.abs(product.price - currentProduct.price);
      const priceMax = Math.max(product.price, currentProduct.price);
      const priceSimilarity = priceMax > 0 ? 1 - priceDiff / priceMax : 1;
      similarity += priceSimilarity * 0.2;

      return { productId: product.id, similarity };
    })
    .filter((s) => s.similarity > 0.3);

  // Combine purchase history and similarity scores
  const combinedScores = new Map<string, { score: number; reason: string }>();

  relatedProducts.forEach((count, pid) => {
    combinedScores.set(pid, {
      score: count * 2, // Weight purchase history highly
      reason: "Frequently bought together",
    });
  });

  similarProducts.forEach(({ productId: pid, similarity }) => {
    if (combinedScores.has(pid)) {
      const current = combinedScores.get(pid)!;
      combinedScores.set(pid, {
        score: current.score + similarity,
        reason: current.reason,
      });
    } else {
      combinedScores.set(pid, {
        score: similarity,
        reason: "Similar product",
      });
    }
  });

  // Convert to recommendations
  const recommendations = Array.from(combinedScores.entries())
    .map(([pid, { score, reason }]) => {
      const product = allProducts.find((p) => p.id === pid);
      if (!product) return null;

      return {
        productId: pid,
        productName: product.name,
        score,
        reason,
        category: product.category,
        price: product.price,
      };
    })
    .filter((r): r is RecommendationResult => r !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return recommendations;
}

/**
 * Trending products based on recent activity
 */
export async function getTrendingProducts(
  recentPurchases: Array<{ productId: string; date: Date }>,
  allProducts: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
  }>,
  daysBack: number = 7,
  limit: number = 10,
): Promise<RecommendationResult[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  // Count purchases within time window
  const productCounts = new Map<string, number>();

  recentPurchases
    .filter((p) => p.date >= cutoffDate)
    .forEach((p) => {
      const count = productCounts.get(p.productId) || 0;
      productCounts.set(p.productId, count + 1);
    });

  // Convert to recommendations
  const recommendations = Array.from(productCounts.entries())
    .map(([productId, count]) => {
      const product = allProducts.find((p) => p.id === productId);
      if (!product) return null;

      return {
        productId,
        productName: product.name,
        score: count,
        reason: `Trending - ${count} purchases in last ${daysBack} days`,
        category: product.category,
        price: product.price,
      };
    })
    .filter((r): r is RecommendationResult => r !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return recommendations;
}

/**
 * Personalized recommendations based on browsing history
 */
export async function getPersonalizedRecommendations(
  userProfile: UserProfile,
  allProducts: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    tags?: string[];
  }>,
  limit: number = 10,
): Promise<RecommendationResult[]> {
  const purchasedProductIds = new Set(
    userProfile.purchases.map((p) => p.productId),
  );
  const viewedProductIds = new Set(userProfile.views.map((v) => v.productId));

  // Score products based on user preferences
  const recommendations = allProducts
    .filter((p) => !purchasedProductIds.has(p.id)) // Exclude already purchased
    .map((product) => {
      let score = 0;
      let reasons: string[] = [];

      // Category preference
      if (userProfile.categories.includes(product.category)) {
        score += 0.5;
        reasons.push("matches your interests");
      }

      // Price range preference
      if (
        product.price >= userProfile.priceRange.min &&
        product.price <= userProfile.priceRange.max
      ) {
        score += 0.3;
        reasons.push("in your price range");
      }

      // Viewed but not purchased (high intent)
      if (viewedProductIds.has(product.id)) {
        score += 0.7;
        reasons.push("you viewed this item");
      }

      return {
        productId: product.id,
        productName: product.name,
        score,
        reason: reasons.length > 0 ? reasons.join(", ") : "Recommended for you",
        category: product.category,
        price: product.price,
      };
    })
    .filter((r) => r.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return recommendations;
}

/**
 * Category-based recommendations
 */
export async function getCategoryRecommendations(
  category: string,
  allProducts: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
  }>,
  popularityScores: Map<string, number>,
  limit: number = 10,
): Promise<RecommendationResult[]> {
  const recommendations = allProducts
    .filter((p) => p.category === category)
    .map((product) => ({
      productId: product.id,
      productName: product.name,
      score: popularityScores.get(product.id) || 0,
      reason: `Popular in ${category}`,
      category: product.category,
      price: product.price,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return recommendations;
}

/**
 * Cross-sell recommendations (products that complement current selection)
 */
export async function getCrossSellRecommendations(
  currentProductIds: string[],
  allProducts: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
  }>,
  complementaryProducts: Map<string, string[]>, // productId -> complementary product IDs
  limit: number = 10,
): Promise<RecommendationResult[]> {
  const recommendedIds = new Map<string, number>();

  currentProductIds.forEach((productId) => {
    const complementary = complementaryProducts.get(productId) || [];
    complementary.forEach((compId) => {
      const count = recommendedIds.get(compId) || 0;
      recommendedIds.set(compId, count + 1);
    });
  });

  const recommendations = Array.from(recommendedIds.entries())
    .map(([productId, count]) => {
      const product = allProducts.find((p) => p.id === productId);
      if (!product) return null;

      return {
        productId,
        productName: product.name,
        score: count,
        reason: "Complements your selection",
        category: product.category,
        price: product.price,
      };
    })
    .filter((r): r is RecommendationResult => r !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return recommendations;
}

/**
 * Matrix Factorization for recommendations (simplified SVD)
 */
export class MatrixFactorization {
  private userFeatures: Map<string, number[]> = new Map();
  private productFeatures: Map<string, number[]> = new Map();
  private numFeatures: number;

  constructor(numFeatures: number = 10) {
    this.numFeatures = numFeatures;
  }

  /**
   * Train the model on user-product interactions
   */
  train(
    interactions: Array<{ userId: string; productId: string; rating: number }>,
    iterations: number = 100,
    learningRate: number = 0.01,
  ) {
    // Initialize random features
    const users = new Set(interactions.map((i) => i.userId));
    const products = new Set(interactions.map((i) => i.productId));

    users.forEach((userId) => {
      this.userFeatures.set(userId, this.randomVector());
    });

    products.forEach((productId) => {
      this.productFeatures.set(productId, this.randomVector());
    });

    // Gradient descent
    for (let iter = 0; iter < iterations; iter++) {
      interactions.forEach(({ userId, productId, rating }) => {
        const userVec = this.userFeatures.get(userId);
        const productVec = this.productFeatures.get(productId);

        if (!userVec || !productVec) return;

        const predicted = this.dotProduct(userVec, productVec);
        const error = rating - predicted;

        // Update features (vectors are guaranteed to exist after check above)
        for (let f = 0; f < this.numFeatures; f++) {
          const userVal = userVec[f];
          const prodVal = productVec[f];
          if (userVal !== undefined && prodVal !== undefined) {
            userVec[f] = userVal + learningRate * error * prodVal;
            productVec[f] = prodVal + learningRate * error * userVal;
          }
        }
      });
    }
  }

  /**
   * Predict rating for user-product pair
   */
  predict(userId: string, productId: string): number {
    const userVec = this.userFeatures.get(userId);
    const productVec = this.productFeatures.get(productId);

    if (!userVec || !productVec) return 0;

    return this.dotProduct(userVec, productVec);
  }

  /**
   * Get top N recommendations for a user
   */
  recommend(
    userId: string,
    allProductIds: string[],
    limit: number = 10,
  ): string[] {
    const scores = allProductIds
      .map((productId) => ({
        productId,
        score: this.predict(userId, productId),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scores.map((s) => s.productId);
  }

  private randomVector(): number[] {
    return Array(this.numFeatures)
      .fill(0)
      .map(() => Math.random() * 0.1);
  }

  private dotProduct(vec1: number[], vec2: number[]): number {
    return vec1.reduce((sum, val, i) => sum + val * (vec2[i] || 0), 0);
  }
}
