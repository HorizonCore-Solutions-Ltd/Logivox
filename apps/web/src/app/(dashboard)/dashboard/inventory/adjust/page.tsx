"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Save, Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdjustStockPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sku, setSku] = useState("");
  const [item, setItem] = useState<any>(null);
  const [quantityChange, setQuantityChange] = useState(0);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const handleSearch = async () => {
    if (!sku) return;
    setLoading(true);
    // Mock search for now or use existing API if available
    // In a real scenario: fetch(`/api/inventory?sku=${sku}`)
    try {
      const res = await fetch(
        `/api/inventory?search=${encodeURIComponent(sku)}`,
      );
      if (res.ok) {
        const data = await res.json();
        // The API returns { items: [...] } or just array? Usually { items: [...] } or similar.
        // The API `inventory/route.ts` I read earlier uses `NextResponse.json(items)`. Wait.
        // Let's check `inventory/route.ts` return format again.
        // It seems to be paginated or array.
        // I'll assume array if not paginated object.
        // Actually, `inventory/page.tsx` uses `res.json()` and assigns to `items`.
        // `const { data: items = [], isLoading } = useQuery...`
        // So the API returns an ARRAY directly? Or object with items property?
        // `return NextResponse.json(items);` (from standard GET usually).
        // Let's assume it returns an array if my memory serves right about `prisma.findMany` results in Next.js APIs usually being wrapped or not.
        // Looking at `inventory/route.ts`... wait I read `inventory/[id]/route.ts`.
        // I only read the input validation part of `inventory/route.ts`.
        // I better assume data structure based on `InventoryPage`: `const { data: items = [] }`. This implies the API returns an array directly, `items` being the alias.
        // So `data` IS the array.
        const list = Array.isArray(data) ? data : data.items || [];

        if (list.length > 0) {
          setItem(list[0]);
        } else {
          toast({ title: "Item not found", variant: "destructive" });
        }
      }
    } catch (e) {
      toast({ title: "Error searching", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    setLoading(true);
    try {
      const res = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryItemId: item.id,
          quantityChange: Number(quantityChange),
          reason,
          notes,
        }),
      });

      if (!res.ok) throw new Error("Failed");

      toast({
        title: "Stock Adjusted",
        description: "Inventory updated successfully.",
      });
      router.push("/dashboard/inventory");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to adjust stock.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Adjust Stock</h1>
          <p className="text-muted-foreground mt-1">
            Manually increase or decrease inventory levels.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Adjustment Details</CardTitle>
          <CardDescription>
            Search for an item and enter the adjustment quantity (positive for
            gain, negative for loss).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex gap-4">
              <Input
                placeholder="Search by SKU..."
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
              <Button onClick={handleSearch} disabled={loading || !sku}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {item && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Current Qty: {item.quantity}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Adjustment Quantity (+/-)</Label>
                    <Input
                      type="number"
                      value={quantityChange}
                      onChange={(e) =>
                        setQuantityChange(Number(e.target.value))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      New Quantity: {item.quantity + Number(quantityChange)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Reason Code</Label>
                    <Select value={reason} onValueChange={setReason}>
                      <SelectTrigger>
                        <SelectValue placeholder="Reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FOUND">Found Stock (+)</SelectItem>
                        <SelectItem value="DAMAGED">Damaged (-)</SelectItem>
                        <SelectItem value="SHRINKAGE">
                          Theft/Loss (-)
                        </SelectItem>
                        <SelectItem value="CORRECTION">
                          Data Correction (+/-)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Optional details..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  className="w-full"
                  disabled={loading || quantityChange === 0 || !reason}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Adjustment
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
