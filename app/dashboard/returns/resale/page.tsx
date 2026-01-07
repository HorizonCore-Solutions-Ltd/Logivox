"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Package,
  Plus,
  RefreshCw,
  ExternalLink,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface ResaleCandidate {
  id: string;
  return_id: string;
  rma_number: string;
  item_name: string;
  item_sku: string;
  condition: string;
  estimated_value: number;
  recommended_price: number;
  market_demand: string;
  status: string;
  created_at: string;
}

interface ResaleListing {
  id: string;
  candidate_id: string;
  item_name: string;
  item_sku: string;
  title: string;
  description: string;
  price: number;
  cost: number;
  marketplace: string;
  listing_url: string | null;
  status: string;
  listed_at: string | null;
  sold_at: string | null;
  sale_price: number | null;
}

interface CreateListingForm {
  candidateId: string;
  title: string;
  description: string;
  price: number;
  marketplace: string;
}

export default function ResaleManagerPage() {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<ResaleCandidate[]>([]);
  const [listings, setListings] = useState<ResaleListing[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] =
    useState<ResaleCandidate | null>(null);
  const [formData, setFormData] = useState<CreateListingForm>({
    candidateId: "",
    title: "",
    description: "",
    price: 0,
    marketplace: "EBAY",
  });
  const [activeTab, setActiveTab] = useState<"candidates" | "listings">(
    "candidates",
  );

  useEffect(() => {
    fetchResaleData();
  }, []);

  const fetchResaleData = async () => {
    try {
      setLoading(true);

      // Fetch candidates
      const candidatesResponse = await fetch("/api/returns/resale/candidates");
      const candidatesData = await candidatesResponse.json();
      setCandidates(candidatesData.candidates || []);

      // Fetch listings
      const listingsResponse = await fetch("/api/returns/resale/listings");
      const listingsData = await listingsResponse.json();
      setListings(listingsData.listings || []);
    } catch (error) {
      console.error("Error fetching resale data:", error);
      toast.error("Failed to load resale data");
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = (candidate: ResaleCandidate) => {
    setSelectedCandidate(candidate);
    setFormData({
      candidateId: candidate.id,
      title: candidate.item_name,
      description: `${candidate.item_name} in ${candidate.condition} condition`,
      price: candidate.recommended_price,
      marketplace: "EBAY",
    });
    setCreateDialogOpen(true);
  };

  const createListing = async () => {
    try {
      const response = await fetch("/api/returns/resale/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: formData.candidateId,
          title: formData.title,
          description: formData.description,
          price: formData.price,
          marketplace: formData.marketplace,
        }),
      });

      if (response.ok) {
        toast.success("Listing created successfully");
        setCreateDialogOpen(false);
        fetchResaleData();
      } else {
        throw new Error("Failed to create listing");
      }
    } catch (error) {
      console.error("Error creating listing:", error);
      toast.error("Failed to create listing");
    }
  };

  const syncListing = async (listingId: string, marketplace: string) => {
    try {
      const response = await fetch(
        `/api/returns/resale/listings/${listingId}/sync`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ marketplace }),
        },
      );

      if (response.ok) {
        toast.success("Listing synced to marketplace");
        fetchResaleData();
      } else {
        throw new Error("Failed to sync listing");
      }
    } catch (error) {
      console.error("Error syncing listing:", error);
      toast.error("Failed to sync listing");
    }
  };

  const getConditionBadge = (condition: string) => {
    const config = {
      LIKE_NEW: { color: "bg-green-500", text: "Like New" },
      GOOD: { color: "bg-blue-500", text: "Good" },
      FAIR: { color: "bg-yellow-500", text: "Fair" },
      REFURBISHED: { color: "bg-purple-500", text: "Refurbished" },
    };

    const { color, text } =
      config[condition as keyof typeof config] || config.GOOD;
    return <Badge className={`${color} text-white`}>{text}</Badge>;
  };

  const getDemandBadge = (demand: string) => {
    const config = {
      HIGH: { color: "bg-green-500", text: "High Demand" },
      MEDIUM: { color: "bg-yellow-500", text: "Medium" },
      LOW: { color: "bg-gray-500", text: "Low" },
    };

    const { color, text } =
      config[demand as keyof typeof config] || config.MEDIUM;
    return <Badge className={`${color} text-white`}>{text}</Badge>;
  };

  const getListingStatusBadge = (status: string) => {
    const config = {
      DRAFT: { color: "bg-gray-500", text: "Draft" },
      LISTED: { color: "bg-blue-500", text: "Listed" },
      SOLD: { color: "bg-green-500", text: "Sold" },
      EXPIRED: { color: "bg-red-500", text: "Expired" },
    };

    const { color, text } =
      config[status as keyof typeof config] || config.DRAFT;
    return <Badge className={`${color} text-white`}>{text}</Badge>;
  };

  const candidatesStats = {
    total: candidates.length,
    highDemand: candidates.filter((c) => c.market_demand === "HIGH").length,
    totalValue: candidates.reduce((sum, c) => sum + c.estimated_value, 0),
  };

  const listingsStats = {
    total: listings.length,
    active: listings.filter((l) => l.status === "LISTED").length,
    sold: listings.filter((l) => l.status === "SOLD").length,
    revenue: listings
      .filter((l) => l.status === "SOLD")
      .reduce((sum, l) => sum + (l.sale_price || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingBag className="w-8 h-8" />
            Resale Manager
          </h1>
          <p className="text-muted-foreground">Monetize returned inventory</p>
        </div>
        <Button onClick={fetchResaleData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="w-4 h-4" />
              Candidates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{candidatesStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {candidatesStats.highDemand} high demand
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Est. Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${candidatesStats.totalValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Total potential</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Active Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {listingsStats.active}
            </div>
            <p className="text-xs text-muted-foreground">
              of {listingsStats.total} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              ${listingsStats.revenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {listingsStats.sold} sold
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === "candidates" ? "default" : "ghost"}
          onClick={() => setActiveTab("candidates")}
        >
          Candidates ({candidates.length})
        </Button>
        <Button
          variant={activeTab === "listings" ? "default" : "ghost"}
          onClick={() => setActiveTab("listings")}
        >
          Listings ({listings.length})
        </Button>
      </div>

      {/* Candidates Tab */}
      {activeTab === "candidates" && (
        <Card>
          <CardHeader>
            <CardTitle>Resale Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {candidates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-2" />
                  <p>No resale candidates found</p>
                </div>
              ) : (
                candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                  >
                    <div className="flex items-center gap-4">
                      <Package className="w-8 h-8 text-primary" />
                      <div>
                        <div className="font-bold">{candidate.item_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {candidate.item_sku}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          RMA: {candidate.rma_number}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          Estimated Value
                        </div>
                        <div className="text-xl font-bold">
                          ${candidate.estimated_value.toFixed(2)}
                        </div>
                        <div className="text-xs text-green-600">
                          Rec. ${candidate.recommended_price.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {getConditionBadge(candidate.condition)}
                        {getDemandBadge(candidate.market_demand)}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => openCreateDialog(candidate)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Listing
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Listings Tab */}
      {activeTab === "listings" && (
        <Card>
          <CardHeader>
            <CardTitle>Resale Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {listings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-2" />
                  <p>No listings found</p>
                </div>
              ) : (
                listings.map((listing) => (
                  <div
                    key={listing.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                  >
                    <div className="flex items-center gap-4">
                      <ShoppingBag className="w-8 h-8 text-primary" />
                      <div>
                        <div className="font-bold">{listing.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {listing.item_sku}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {listing.marketplace}
                          {listing.listed_at &&
                            ` • Listed ${new Date(listing.listed_at).toLocaleDateString()}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xl font-bold">
                          ${listing.price.toFixed(2)}
                        </div>
                        {listing.status === "SOLD" && listing.sale_price && (
                          <div className="text-sm text-green-600">
                            Sold for ${listing.sale_price.toFixed(2)}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Cost: ${listing.cost.toFixed(2)}
                        </div>
                      </div>
                      {getListingStatusBadge(listing.status)}
                      {listing.status === "DRAFT" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            syncListing(listing.id, listing.marketplace)
                          }
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Sync
                        </Button>
                      )}
                      {listing.listing_url && (
                        <Button size="sm" variant="outline" asChild>
                          <a
                            href={listing.listing_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Listing Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Resale Listing</DialogTitle>
          </DialogHeader>

          {selectedCandidate && (
            <div className="space-y-4">
              {/* Candidate Info */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold">
                        {selectedCandidate.item_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedCandidate.item_sku}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {getConditionBadge(selectedCandidate.condition)}
                      {getDemandBadge(selectedCandidate.market_demand)}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">
                        Estimated Value
                      </div>
                      <div className="font-bold">
                        ${selectedCandidate.estimated_value.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">
                        Recommended Price
                      </div>
                      <div className="font-bold text-green-600">
                        ${selectedCandidate.recommended_price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Marketplace
                  </label>
                  <Select
                    value={formData.marketplace}
                    onValueChange={(value) =>
                      setFormData({ ...formData, marketplace: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EBAY">eBay</SelectItem>
                      <SelectItem value="AMAZON">Amazon</SelectItem>
                      <SelectItem value="SHOPIFY">Shopify</SelectItem>
                      <SelectItem value="FACEBOOK">
                        Facebook Marketplace
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Title
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Listing title"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Description
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Listing description"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Price
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={createListing}>
              <Check className="w-4 h-4 mr-2" />
              Create Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
