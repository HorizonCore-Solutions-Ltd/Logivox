/**
 * Secondary Market / Resale Automation System
 * Dynamic pricing, multi-channel listing, performance tracking
 */

export type ResaleChannel = 'AMAZON_RENEWED' | 'AMAZON_WAREHOUSE' | 'EBAY' | 'SHOPIFY_OUTLET' | 'B2B_LIQUIDATION' | 'FACEBOOK_MARKETPLACE' | 'MERCARI' | 'POSHMARK';
export type ListingStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'LISTED' | 'SOLD' | 'CANCELLED' | 'EXPIRED' | 'RETURNED';
export type PricingStrategy = 'COMPETITIVE' | 'AGGRESSIVE' | 'PREMIUM' | 'LIQUIDATION' | 'DYNAMIC';

export interface ResaleCandidate {
  id: string;
  
  // Source
  rmaId?: string;
  refurbWorkOrderId?: string;
  receiptLineId: string;
  
  // Product
  sku: string;
  serial?: string;
  lot?: string;
  
  // Condition
  grade: string; // 'A', 'B', 'C'
  conditionDescription: string;
  functionalityScore: number; // 0-100
  cosmeticScore: number; // 0-100
  
  // Original Product Info
  originalPrice: number;
  originalCurrency: string;
  category: string;
  brand?: string;
  model?: string;
  
  // Defects / Missing Items
  defects: string[];
  missingItems: string[];
  includedAccessories: string[];
  
  // Costs
  acquisitionCost: number; // cost to acquire (refund given)
  refurbCost: number; // cost to refurbish
  totalCost: number;
  
  // Evidence
  photos: {
    url: string;
    type: 'MAIN' | 'DETAIL' | 'DEFECT' | 'PACKAGE';
    caption?: string;
  }[];
  
  // Pricing
  pricingRecommendation?: PricingRecommendation;
  
  // Channel Recommendations
  recommendedChannels: {
    channel: ResaleChannel;
    suitabilityScore: number; // 0-100
    estimatedRevenue: number;
    estimatedFees: number;
    estimatedNet: number;
    timeToSell: number; // days
  }[];
  
  // Status
  status: 'EVALUATING' | 'READY' | 'LISTED' | 'SOLD' | 'REMOVED';
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface PricingRecommendation {
  candidateId: string;
  generatedAt: Date;
  strategy: PricingStrategy;
  
  // Recommended Pricing
  suggestedPrice: number;
  currency: string;
  
  // Range
  priceFloor: number; // minimum acceptable
  priceCeiling: number; // maximum realistic
  optimalPrice: number; // best revenue/speed balance
  
  // Factors
  factors: {
    factor: 'MARKET_COMP' | 'GRADE' | 'DEMAND' | 'AGE' | 'SEASONALITY' | 'SUPPLY' | 'FEES' | 'COSTS';
    impact: number; // -100 to +100
    description: string;
  }[];
  
  // Market Data
  marketData: {
    avgSoldPrice: number;
    minPrice: number;
    maxPrice: number;
    activeListing: number;
    recentSales: number;
    avgDaysToSell: number;
  };
  
  // Confidence
  confidence: number; // 0-100
  
  // Projections
  projections: {
    atPrice: number;
    estimatedDaysToSell: number;
    conversionProbability: number; // 0-100
    expectedRevenue: number;
    expectedNet: number;
    roi: number; // %
  }[];
  
  // Model version
  modelVersion: string;
}

export interface ResaleListing {
  id: string;
  candidateId: string;
  
  // Channel
  channel: ResaleChannel;
  externalListingId?: string; // ID in external system
  listingUrl?: string;
  
  // Product
  title: string;
  description: string;
  category: string;
  
  // Pricing
  listPrice: number;
  currency: string;
  acceptOffers: boolean;
  minimumOffer?: number;
  
  // Condition
  conditionGrade: string;
  conditionNotes: string;
  
  // Photos
  photos: string[];
  mainPhotoIndex: number;
  
  // Inventory
  quantity: number;
  quantitySold: number;
  quantityAvailable: number;
  
  // Fulfillment
  fulfillmentMethod: 'SELF' | 'FBA' | 'DROPSHIP';
  shippingProfile: string;
  handlingTime: number; // days
  
  // Status
  status: ListingStatus;
  
  // Performance
  views: number;
  watchers: number;
  offers: number;
  
  // Timing
  listedAt?: Date;
  soldAt?: Date;
  expiresAt?: Date;
  
  // Fees & Revenue
  finalPrice?: number;
  fees?: {
    platformFee: number;
    paymentProcessingFee: number;
    shippingFee: number;
    otherFees: number;
    totalFees: number;
  };
  netRevenue?: number;
  
  // Buyer
  buyerId?: string;
  buyerUsername?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Sync
  lastSyncAt?: Date;
  syncErrors?: string[];
}

/**
 * Resale Automation Service
 */
export class ResaleAutomationService {
  /**
   * Create resale candidate from returned item
   */
  async createCandidate(request: {
    receiptLineId: string;
    sku: string;
    serial?: string;
    grade: string;
    photos: string[];
    defects?: string[];
    missingItems?: string[];
    acquisitionCost: number;
    refurbCost: number;
  }): Promise<ResaleCandidate> {
    // Lookup product details
    const productDetails = await this.lookupProduct(request.sku);
    
    // Calculate condition scores
    const scores = this.calculateConditionScores(request.grade, request.defects || []);
    
    // Get pricing recommendation
    const pricing = await this.getPricing(request.sku, request.grade, scores);
    
    // Evaluate channels
    const channels = await this.evaluateChannels(request, pricing);
    
    const candidate: ResaleCandidate = {
      id: `rc-${Date.now()}`,
      receiptLineId: request.receiptLineId,
      sku: request.sku,
      serial: request.serial,
      grade: request.grade,
      conditionDescription: this.generateConditionDescription(request.grade, request.defects),
      functionalityScore: scores.functionality,
      cosmeticScore: scores.cosmetic,
      originalPrice: productDetails.price,
      originalCurrency: 'USD',
      category: productDetails.category,
      brand: productDetails.brand,
      model: productDetails.model,
      defects: request.defects || [],
      missingItems: request.missingItems || [],
      includedAccessories: productDetails.includedAccessories,
      acquisitionCost: request.acquisitionCost,
      refurbCost: request.refurbCost,
      totalCost: request.acquisitionCost + request.refurbCost,
      photos: request.photos.map((url, i) => ({
        url,
        type: i === 0 ? 'MAIN' : 'DETAIL',
      })),
      pricingRecommendation: pricing,
      recommendedChannels: channels,
      status: 'READY',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    return candidate;
  }

  /**
   * Get dynamic pricing recommendation
   */
  async getPricing(sku: string, grade: string, scores: any): Promise<PricingRecommendation> {
    // Get market data from various sources
    const marketData = await this.getMarketData(sku, grade);
    
    // Get product costs
    const costs = await this.getCosts(sku);
    
    // Calculate pricing
    const basePrice = marketData.avgSoldPrice;
    const gradeMultiplier = this.getGradeMultiplier(grade);
    const conditionMultiplier = (scores.functionality + scores.cosmetic) / 200;
    
    let suggestedPrice = basePrice * gradeMultiplier * conditionMultiplier;
    
    // Factor in demand/supply
    const demandFactor = marketData.recentSales / Math.max(marketData.activeListings, 1);
    if (demandFactor > 2) suggestedPrice *= 1.1; // high demand
    if (demandFactor < 0.5) suggestedPrice *= 0.9; // low demand
    
    // Floor at cost + minimum margin
    const floor = costs.total * 1.2; // 20% minimum margin
    suggestedPrice = Math.max(suggestedPrice, floor);
    
    // Ceiling at market max
    const ceiling = marketData.maxPrice;
    
    // Generate factors
    const factors = [
      {
        factor: 'MARKET_COMP' as const,
        impact: 30,
        description: `Market average is $${marketData.avgSoldPrice.toFixed(2)}`,
      },
      {
        factor: 'GRADE' as const,
        impact: grade === 'A' ? 20 : grade === 'B' ? 0 : -20,
        description: `Grade ${grade} items sell at ${(gradeMultiplier * 100).toFixed(0)}% of new price`,
      },
      {
        factor: 'DEMAND' as const,
        impact: demandFactor > 2 ? 15 : demandFactor < 0.5 ? -15 : 0,
        description: `Demand is ${demandFactor > 2 ? 'high' : demandFactor < 0.5 ? 'low' : 'moderate'}`,
      },
    ];
    
    // Generate projections at different prices
    const projections = [0.8, 0.9, 1.0, 1.1, 1.2].map(multiplier => {
      const price = suggestedPrice * multiplier;
      const daysToSell = this.estimateDaysToSell(price, marketData);
      const conversionProb = this.estimateConversionProbability(price, marketData);
      const fees = price * 0.15; // estimate 15% fees
      const net = price - fees - costs.total;
      const roi = (net / costs.total) * 100;
      
      return {
        atPrice: price,
        estimatedDaysToSell: daysToSell,
        conversionProbability: conversionProb,
        expectedRevenue: price * (conversionProb / 100),
        expectedNet: net * (conversionProb / 100),
        roi,
      };
    });
    
    return {
      candidateId: '',
      generatedAt: new Date(),
      strategy: 'DYNAMIC',
      suggestedPrice,
      currency: 'USD',
      priceFloor: floor,
      priceCeiling: ceiling,
      optimalPrice: suggestedPrice,
      factors,
      marketData,
      confidence: 75,
      projections,
      modelVersion: 'v1.2.0',
    };
  }

  /**
   * Create listing on channel
   */
  async createListing(candidateId: string, channel: ResaleChannel, options?: {
    price?: number;
    title?: string;
    description?: string;
    autoPublish?: boolean;
  }): Promise<ResaleListing> {
    // Get candidate
    const candidate = await this.getCandidate(candidateId);
    
    // Generate listing content
    const title = options?.title || this.generateTitle(candidate);
    const description = options?.description || this.generateDescription(candidate);
    const price = options?.price || candidate.pricingRecommendation?.suggestedPrice || 0;
    
    // Create listing
    const listing: ResaleListing = {
      id: `listing-${Date.now()}`,
      candidateId,
      channel,
      title,
      description,
      category: candidate.category,
      listPrice: price,
      currency: 'USD',
      acceptOffers: true,
      minimumOffer: price * 0.85,
      conditionGrade: candidate.grade,
      conditionNotes: candidate.conditionDescription,
      photos: candidate.photos.map(p => p.url),
      mainPhotoIndex: 0,
      quantity: 1,
      quantitySold: 0,
      quantityAvailable: 1,
      fulfillmentMethod: 'SELF',
      shippingProfile: 'standard',
      handlingTime: 2,
      status: options?.autoPublish ? 'LISTED' : 'DRAFT',
      views: 0,
      watchers: 0,
      offers: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Sync to external platform if auto-publish
    if (options?.autoPublish) {
      await this.syncToChannel(listing);
    }
    
    return listing;
  }

  /**
   * Sync listing to external channel
   */
  async syncToChannel(listing: ResaleListing): Promise<void> {
    switch (listing.channel) {
      case 'EBAY':
        await this.syncToEbay(listing);
        break;
      case 'AMAZON_RENEWED':
        await this.syncToAmazon(listing);
        break;
      case 'SHOPIFY_OUTLET':
        await this.syncToShopify(listing);
        break;
      default:
        throw new Error(`Channel ${listing.channel} not implemented`);
    }
  }

  /**
   * Mark item as sold
   */
  async markSold(listingId: string, sale: {
    soldPrice: number;
    buyerId?: string;
    buyerUsername?: string;
    fees: {
      platformFee: number;
      paymentProcessingFee: number;
      shippingFee: number;
      otherFees: number;
    };
  }): Promise<void> {
    // Update listing
    // Calculate net revenue
    // Update candidate status
    // Create fulfillment task
  }

  /**
   * Get resale analytics
   */
  async getAnalytics(period: { start: Date; end: Date }): Promise<ResaleAnalytics> {
    return {
      period,
      totalCandidates: 245,
      listed: 198,
      sold: 142,
      sellThroughRate: 71.7,
      avgDaysToSell: 12.3,
      avgListPrice: 128.50,
      avgSoldPrice: 118.20,
      totalRevenue: 16784.40,
      totalFees: 2517.66,
      totalCosts: 8934.00,
      netProfit: 5332.74,
      roi: 59.7,
      byChannel: [
        { channel: 'EBAY', listed: 89, sold: 67, revenue: 7845.30, roi: 62.3 },
        { channel: 'AMAZON_RENEWED', listed: 56, sold: 42, revenue: 5934.10, roi: 71.2 },
        { channel: 'SHOPIFY_OUTLET', listed: 53, sold: 33, revenue: 3005.00, roi: 42.8 },
      ],
      topCategories: [
        { category: 'Electronics', sold: 78, revenue: 9234.50, roi: 68.4 },
        { category: 'Apparel', sold: 34, revenue: 3450.20, roi: 45.2 },
        { category: 'Home Goods', sold: 30, revenue: 4099.70, roi: 55.7 },
      ],
    };
  }

  // Helper methods
  private async lookupProduct(sku: string): Promise<any> {
    return {
      price: 299.99,
      category: 'Electronics',
      brand: 'TechBrand',
      model: 'TB-123',
      includedAccessories: ['Power adapter', 'USB cable', 'Manual'],
    };
  }

  private calculateConditionScores(grade: string, defects: string[]): { functionality: number; cosmetic: number } {
    const baseScores = {
      'A': { functionality: 95, cosmetic: 95 },
      'B': { functionality: 85, cosmetic: 80 },
      'C': { functionality: 70, cosmetic: 60 },
      'D': { functionality: 50, cosmetic: 40 },
    };
    
    const base = baseScores[grade as keyof typeof baseScores] || { functionality: 50, cosmetic: 50 };
    
    // Deduct for each defect
    const deduction = defects.length * 5;
    
    return {
      functionality: Math.max(base.functionality - deduction, 0),
      cosmetic: Math.max(base.cosmetic - deduction, 0),
    };
  }

  private generateConditionDescription(grade: string, defects?: string[]): string {
    const gradeDescriptions = {
      'A': 'Like new condition with minimal signs of use',
      'B': 'Good condition with minor cosmetic imperfections',
      'C': 'Fair condition with visible wear',
      'D': 'Poor condition with significant wear',
    };
    
    let desc = gradeDescriptions[grade as keyof typeof gradeDescriptions] || 'Used condition';
    
    if (defects && defects.length > 0) {
      desc += `. Note: ${defects.join(', ')}`;
    }
    
    return desc;
  }

  private getGradeMultiplier(grade: string): number {
    const multipliers: Record<string, number> = {
      'A': 0.75, 'B': 0.60, 'C': 0.45, 'D': 0.30,
    };
    return multipliers[grade] || 0.50;
  }

  private async getMarketData(sku: string, grade: string): Promise<any> {
    // In production, query market data APIs (eBay, Amazon, etc.)
    return {
      avgSoldPrice: 225.00,
      minPrice: 180.00,
      maxPrice: 280.00,
      activeListings: 45,
      recentSales: 23,
      avgDaysToSell: 14,
    };
  }

  private async getCosts(sku: string): Promise<{ acquisition: number; refurb: number; total: number }> {
    return { acquisition: 150.00, refurb: 25.00, total: 175.00 };
  }

  private estimateDaysToSell(price: number, marketData: any): number {
    const avgPrice = marketData.avgSoldPrice;
    const ratio = price / avgPrice;
    
    // Higher price = longer to sell
    if (ratio > 1.2) return marketData.avgDaysToSell * 2;
    if (ratio > 1.1) return marketData.avgDaysToSell * 1.5;
    if (ratio < 0.9) return marketData.avgDaysToSell * 0.7;
    return marketData.avgDaysToSell;
  }

  private estimateConversionProbability(price: number, marketData: any): number {
    const avgPrice = marketData.avgSoldPrice;
    const ratio = price / avgPrice;
    
    if (ratio > 1.3) return 30;
    if (ratio > 1.2) return 50;
    if (ratio > 1.1) return 70;
    if (ratio < 0.9) return 95;
    return 85;
  }

  private async evaluateChannels(request: any, pricing: PricingRecommendation): Promise<any[]> {
    // Evaluate suitability of each channel
    return [
      {
        channel: 'EBAY',
        suitabilityScore: 85,
        estimatedRevenue: pricing.suggestedPrice * 0.95,
        estimatedFees: pricing.suggestedPrice * 0.13,
        estimatedNet: pricing.suggestedPrice * 0.82,
        timeToSell: 14,
      },
      {
        channel: 'AMAZON_RENEWED',
        suitabilityScore: 78,
        estimatedRevenue: pricing.suggestedPrice * 1.05,
        estimatedFees: pricing.suggestedPrice * 0.17,
        estimatedNet: pricing.suggestedPrice * 0.88,
        timeToSell: 7,
      },
    ];
  }

  private generateTitle(candidate: ResaleCandidate): string {
    return `${candidate.brand} ${candidate.model} - Grade ${candidate.grade} - ${candidate.sku}`;
  }

  private generateDescription(candidate: ResaleCandidate): string {
    let desc = `${candidate.conditionDescription}\n\n`;
    desc += `Functionality: ${candidate.functionalityScore}%\n`;
    desc += `Cosmetic Condition: ${candidate.cosmeticScore}%\n\n`;
    
    if (candidate.defects.length > 0) {
      desc += `Known Issues: ${candidate.defects.join(', ')}\n\n`;
    }
    
    if (candidate.missingItems.length > 0) {
      desc += `Missing Items: ${candidate.missingItems.join(', ')}\n\n`;
    }
    
    desc += `Includes: ${candidate.includedAccessories.join(', ')}`;
    
    return desc;
  }

  private async syncToEbay(listing: ResaleListing): Promise<void> {
    // Implement eBay API integration
  }

  private async syncToAmazon(listing: ResaleListing): Promise<void> {
    // Implement Amazon MWS/SP-API integration
  }

  private async syncToShopify(listing: ResaleListing): Promise<void> {
    // Implement Shopify API integration
  }

  private async getCandidate(candidateId: string): Promise<ResaleCandidate> {
    // Query database
    throw new Error('Not implemented');
  }
}

export interface ResaleAnalytics {
  period: { start: Date; end: Date };
  totalCandidates: number;
  listed: number;
  sold: number;
  sellThroughRate: number; // %
  avgDaysToSell: number;
  avgListPrice: number;
  avgSoldPrice: number;
  totalRevenue: number;
  totalFees: number;
  totalCosts: number;
  netProfit: number;
  roi: number; // %
  byChannel: {
    channel: string;
    listed: number;
    sold: number;
    revenue: number;
    roi: number;
  }[];
  topCategories: {
    category: string;
    sold: number;
    revenue: number;
    roi: number;
  }[];
}
