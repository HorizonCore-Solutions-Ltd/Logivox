"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader2, Receipt, Plus, Trash2 } from "lucide-react";

interface Customer { id: string; name: string; code: string; }
interface LineItem { description: string; quantity: number; unitPrice: number; taxRate: number; }

export default function NewInvoicePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: 0, taxRate: 0 },
  ]);

  useEffect(() => {
    fetch("/api/customers").then((r) => r.json()).then((d) => setCustomers(d.customers || d.data || []));
  }, []);

  const addLine = () => setLineItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0, taxRate: 0 }]);
  const removeLine = (i: number) => setLineItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateLine = (i: number, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) => { const u = [...prev]; (u[i] as any)[field] = value; return u; });
  };

  const subtotal = lineItems.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const tax = lineItems.reduce((s, it) => s + it.quantity * it.unitPrice * (it.taxRate / 100), 0);
  const total = subtotal + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) { toast({ title: "Select a customer", variant: "destructive" }); return; }
    const validItems = lineItems.filter((it) => it.description.trim() && it.quantity > 0);
    if (validItems.length === 0) { toast({ title: "Add at least one line item", variant: "destructive" }); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/billing/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          dueDate: dueDate || undefined,
          currency,
          notes: notes || undefined,
          lineItems: validItems,
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
      const data = await res.json();
      toast({ title: "Invoice created", description: `Invoice #${data.invoice?.invoiceNumber || ""}` });
      router.push("/dashboard/billing");
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/billing"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button></Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Receipt className="h-7 w-7" />New Invoice</h1>
          <p className="text-muted-foreground mt-1">Create a new billing invoice</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Invoice Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId} required>
                <SelectTrigger><SelectValue placeholder="Select customer..." /></SelectTrigger>
                <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["USD","EUR","GBP","CAD","AUD","JPY"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle>Line Items</CardTitle><CardDescription>Services or products to bill</CardDescription></div>
            <Button type="button" variant="outline" size="sm" onClick={addLine}><Plus className="h-4 w-4 mr-1" />Add Line</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground border-b pb-1">
              <div className="col-span-5">Description</div>
              <div className="col-span-2">Qty</div>
              <div className="col-span-2">Unit Price</div>
              <div className="col-span-2">Tax %</div>
              <div className="col-span-1"></div>
            </div>
            {lineItems.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5"><Input value={item.description} onChange={(e) => updateLine(i, "description", e.target.value)} placeholder="Description..." className="h-8 text-sm" /></div>
                <div className="col-span-2"><Input type="number" min="1" value={item.quantity} onChange={(e) => updateLine(i, "quantity", parseFloat(e.target.value) || 1)} className="h-8 text-sm" /></div>
                <div className="col-span-2"><Input type="number" step="0.01" min="0" value={item.unitPrice} onChange={(e) => updateLine(i, "unitPrice", parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
                <div className="col-span-2"><Input type="number" step="0.1" min="0" max="100" value={item.taxRate} onChange={(e) => updateLine(i, "taxRate", parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
                <div className="col-span-1"><Button type="button" variant="ghost" size="sm" onClick={() => removeLine(i)} disabled={lineItems.length === 1}><Trash2 className="h-4 w-4 text-red-500" /></Button></div>
              </div>
            ))}
            <div className="border-t pt-3 space-y-1 text-sm text-right">
              <div>Subtotal: <span className="font-medium">${subtotal.toFixed(2)}</span></div>
              <div>Tax: <span className="font-medium">${tax.toFixed(2)}</span></div>
              <div className="text-base font-bold">Total: ${total.toFixed(2)} {currency}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Payment terms, notes for the customer..." rows={3} />
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Link href="/dashboard/billing"><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Receipt className="h-4 w-4 mr-2" />}
            {saving ? "Creating..." : "Create Invoice"}
          </Button>
        </div>
      </form>
    </div>
  );
}
