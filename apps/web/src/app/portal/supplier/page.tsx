"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Truck, AlertCircle, CheckCircle } from "lucide-react";

export default function SupplierPortalPage() {
    const [poId, setPoId] = useState("");
    const [poData, setPoData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Form state for items
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [expiryDates, setExpiryDates] = useState<Record<string, string>>({});
    const [lots, setLots] = useState<Record<string, string>>({});

    const handleSearch = async () => {
        if (!poId) return;
        setLoading(true);
        setError("");
        setPoData(null);
        
        try {
            const res = await fetch(`/api/portal/supplier/po/${poId}`);
            if (!res.ok) throw new Error("Purchase Order not found or access denied.");
            const data = await res.json();
            setPoData(data);
            
            // Initialize quantities
            const initQty: any = {};
            data.items.forEach((item: any) => {
                initQty[item.inventoryItemId] = item.quantityOrdered - (item.quantityReceived || 0);
            });
            setQuantities(initQty);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitASN = async () => {
        if (!poData) return;
        setSubmitting(true);
        setError("");
        
        try {
            // Construct payload
            const items = poData.items.map((item: any) => ({
                inventoryItemId: item.inventoryItemId,
                orderedQuantity: item.quantityOrdered,
                receivedQuantity: Number(quantities[item.inventoryItemId] || 0),
                expiry: expiryDates[item.inventoryItemId] || undefined,
                lot: lots[item.inventoryItemId] || undefined
            })).filter((i: any) => i.receivedQuantity > 0);

            if (items.length === 0) {
                throw new Error("No items selected for shipment.");
            }

            const res = await fetch("/api/portal/supplier/asn", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    poId: poData.id,
                    items
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to submit ASN");
            }

            const result = await res.json();
            setSuccess(`ASN Created Successfully! Reference: ${result.grnNumber}`);
            setPoData(null);
            setPoId("");
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Supplier Portal</h1>
                    <p className="text-gray-500">Manage shipments and create Advanced Shipping Notices (ASNs).</p>
                </div>
            </div>

            {/* PO Search */}
            <Card>
                <CardHeader>
                    <CardTitle>Create New ASN</CardTitle>
                    <CardDescription>Enter a Purchase Order ID or Number to begin.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Label htmlFor="po-search" className="sr-only">PO Number</Label>
                            <Input 
                                id="po-search" 
                                placeholder="Enter PO ID (e.g. PO-12345)" 
                                value={poId}
                                onChange={(e) => setPoId(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleSearch} disabled={loading}>
                            {loading ? "Searching..." : <><Search className="mr-2 h-4 w-4" /> Find PO</>}
                        </Button>
                    </div>
                    {error && (
                        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md flex items-center">
                            <AlertCircle className="h-5 w-5 mr-2" />
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md flex items-center">
                            <CheckCircle className="h-5 w-5 mr-2" />
                            {success}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* PO Details & ASN Form */}
            {poData && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                           <div>
                                <CardTitle>PO Details: {poData.poNumber || poData.id}</CardTitle>
                                <CardDescription>
                                    Created: {new Date(poData.createdAt).toLocaleDateString()} | 
                                    Status: <Badge variant="outline">{poData.status}</Badge>
                                </CardDescription>
                           </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>SKU / Item</TableHead>
                                    <TableHead>Ordered</TableHead>
                                    <TableHead>Previously Received</TableHead>
                                    <TableHead>Shipment Qty</TableHead>
                                    <TableHead>Lot Number</TableHead>
                                    <TableHead>Expiry Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {poData.items.map((item: any) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">
                                            <div>{item.inventoryItem?.sku || "Unknown SKU"}</div>
                                            <div className="text-xs text-gray-500">{item.description}</div>
                                        </TableCell>
                                        <TableCell>{item.quantityOrdered}</TableCell>
                                        <TableCell>{item.quantityReceived}</TableCell>
                                        <TableCell>
                                            <Input 
                                                type="number" 
                                                min="0"
                                                className="w-24"
                                                value={quantities[item.inventoryItemId] || 0}
                                                onChange={(e) => setQuantities({
                                                    ...quantities, 
                                                    [item.inventoryItemId]: parseInt(e.target.value) || 0
                                                })}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input 
                                                placeholder="Lot #" 
                                                className="w-32"
                                                value={lots[item.inventoryItemId] || ""}
                                                onChange={(e) => setLots({
                                                    ...lots,
                                                    [item.inventoryItemId]: e.target.value
                                                })}
                                            />
                                        </TableCell>
                                        <TableCell>
                                             <Input 
                                                type="date" 
                                                className="w-40"
                                                value={expiryDates[item.inventoryItemId] || ""}
                                                onChange={(e) => setExpiryDates({
                                                    ...expiryDates,
                                                    [item.inventoryItemId]: e.target.value
                                                })}
                                             />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <div className="mt-8 flex justify-end">
                            <Button size="lg" onClick={handleSubmitASN} disabled={submitting}>
                                {submitting ? "Submitting..." : <><Truck className="mr-2 h-4 w-4" /> Submit ASN</>}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
