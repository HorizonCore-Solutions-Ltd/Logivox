"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DollarSign, Plus, Edit, Trash2, Save, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface RateCard {
  id: string;
  name: string;
  activityType: string;
  rateType: "PER_UNIT" | "PER_HOUR" | "FLAT_FEE" | "TIERED";
  baseRate: number;
  currency: string;
  unitOfMeasure?: string;
  isActive: boolean;
  effectiveDate: string;
  expiryDate?: string;
  clientId?: string;
  clientName?: string;
}

export default function RateCardsPage() {
  const [rateCards, setRateCards] = useState<RateCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<RateCard | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    activityType: "RECEIVING",
    rateType: "PER_UNIT" as const,
    baseRate: 0,
    currency: "USD",
    unitOfMeasure: "unit",
    isActive: true,
    effectiveDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchRateCards();
  }, []);

  const fetchRateCards = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/billing/rate-cards");
      if (res.ok) {
        const data = await res.json();
        setRateCards(data);
      }
    } catch (error) {
      console.error("Error fetching rate cards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const method = editingCard ? "PUT" : "POST";
      const url = editingCard
        ? `/api/billing/rate-cards/${editingCard.id}`
        : "/api/billing/rate-cards";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: `Rate card ${editingCard ? "updated" : "created"} successfully`,
        });
        fetchRateCards();
        setIsDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save rate card",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (card: RateCard) => {
    setEditingCard(card);
    setFormData({
      name: card.name,
      activityType: card.activityType,
      rateType: card.rateType as any,
      baseRate: card.baseRate,
      currency: card.currency,
      unitOfMeasure: card.unitOfMeasure || "",
      isActive: card.isActive,
      effectiveDate: card.effectiveDate.split("T")[0],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rate card?")) return;

    try {
      const res = await fetch(`/api/billing/rate-cards/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: "Rate card deleted successfully",
        });
        fetchRateCards();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete rate card",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingCard(null);
    setFormData({
      name: "",
      activityType: "RECEIVING",
      rateType: "PER_UNIT",
      baseRate: 0,
      currency: "USD",
      unitOfMeasure: "unit",
      isActive: true,
      effectiveDate: new Date().toISOString().split("T")[0],
    });
  };

  const activityTypes = [
    "RECEIVING",
    "STORAGE",
    "PICKING",
    "PACKING",
    "SHIPPING",
    "KITTING",
    "RETURNS",
    "VALUE_ADDED",
  ];

  const activeCards = rateCards.filter((c) => c.isActive).length;
  const inactiveCards = rateCards.filter((c) => !c.isActive).length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rate Cards</h1>
          <p className="text-gray-600 mt-1">
            Manage billing rates for warehouse activities and services
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              New Rate Card
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCard ? "Edit Rate Card" : "Create New Rate Card"}
              </DialogTitle>
              <DialogDescription>
                Define pricing for warehouse activities and services
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Rate Card Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Standard Receiving Rate"
                  />
                </div>
                <div>
                  <Label htmlFor="activityType">Activity Type</Label>
                  <Select
                    value={formData.activityType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, activityType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activityTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="rateType">Rate Type</Label>
                  <Select
                    value={formData.rateType}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, rateType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PER_UNIT">Per Unit</SelectItem>
                      <SelectItem value="PER_HOUR">Per Hour</SelectItem>
                      <SelectItem value="FLAT_FEE">Flat Fee</SelectItem>
                      <SelectItem value="TIERED">Tiered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="baseRate">Base Rate</Label>
                  <Input
                    id="baseRate"
                    type="number"
                    step="0.01"
                    value={formData.baseRate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        baseRate: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="unitOfMeasure">Unit of Measure</Label>
                  <Input
                    id="unitOfMeasure"
                    value={formData.unitOfMeasure}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unitOfMeasure: e.target.value,
                      })
                    }
                    placeholder="pallet, carton, hour"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) =>
                      setFormData({ ...formData, currency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="effectiveDate">Effective Date</Label>
                  <Input
                    id="effectiveDate"
                    type="date"
                    value={formData.effectiveDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        effectiveDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex items-center pt-8">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="mr-2"
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Rate Card
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Rate Cards
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {rateCards.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Rates
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {activeCards}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Inactive Rates
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">
              {inactiveCards}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rate Cards Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Cards</CardTitle>
          <CardDescription>
            Manage pricing for all warehouse activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Activity Type</TableHead>
                <TableHead>Rate Type</TableHead>
                <TableHead className="text-right">Base Rate</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Effective Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-gray-500"
                  >
                    Loading rate cards...
                  </TableCell>
                </TableRow>
              ) : rateCards.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-gray-500"
                  >
                    No rate cards found. Create your first rate card to get
                    started.
                  </TableCell>
                </TableRow>
              ) : (
                rateCards.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell className="font-medium">{card.name}</TableCell>
                    <TableCell>{card.activityType.replace("_", " ")}</TableCell>
                    <TableCell className="text-sm">
                      {card.rateType.replace("_", " ")}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {card.currency} {card.baseRate.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {card.unitOfMeasure || "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(card.effectiveDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={card.isActive ? "default" : "secondary"}>
                        {card.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(card)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(card.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
