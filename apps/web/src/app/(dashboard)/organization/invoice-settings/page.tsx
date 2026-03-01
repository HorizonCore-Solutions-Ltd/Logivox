"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { RefreshCw, Save, Info } from "lucide-react";

interface InvoiceSettings {
  trigger: string;
  termsNet: number;
  footerText: string;
  showPackingSlip: boolean;
  logoUrl: string;
  requireDeliveryConfirmation: boolean;
  taxRate: number;
  invoicePrefix: string;
  nextSequence: number;
  currency: string;
  bankDetails: string;
  paymentInstructions: string;
  ccEmails: string[];
}

const TRIGGER_OPTIONS = [
  { value: "ON_ORDER_CONFIRMATION", label: "On Order Confirmation", description: "Invoice is generated as soon as an order is confirmed/approved" },
  { value: "ON_SHIPMENT", label: "On Shipment", description: "Invoice is generated when goods leave the warehouse" },
  { value: "ON_DELIVERY_CONFIRMATION", label: "On Delivery Confirmation", description: "Invoice is generated after customer confirms receipt" },
  { value: "MANUAL", label: "Manual", description: "Finance team generates invoices manually" },
];

const CURRENCIES = ["USD", "EUR", "GBP", "ZAR", "AUD", "CAD", "JPY", "CNY", "NGN", "KES"];

export default function InvoiceSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [settings, setSettings] = useState<InvoiceSettings>({
    trigger: "ON_ORDER_CONFIRMATION",
    termsNet: 30,
    footerText: "",
    showPackingSlip: true,
    logoUrl: "",
    requireDeliveryConfirmation: false,
    taxRate: 0,
    invoicePrefix: "INV",
    nextSequence: 1,
    currency: "USD",
    bankDetails: "",
    paymentInstructions: "",
    ccEmails: [],
  });
  const [ccEmailInput, setCcEmailInput] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/organization/invoice-settings");
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setSettings((prev) => ({ ...prev, ...data.settings }));
        setOrgName(data.organizationName || "");
        setCcEmailInput((data.settings?.ccEmails || []).join(", "));
      } catch (err) {
        toast({ title: "Failed to load settings", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const ccEmails = ccEmailInput
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e.length > 0);

      const res = await fetch("/api/organization/invoice-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, ccEmails }),
      });

      const data = await res.json();
      if (!res.ok) {
        const issues = data.issues ? Object.entries(data.issues).map(([k, v]) => `${k}: ${v}`).join("; ") : data.error;
        throw new Error(issues);
      }

      setSettings((prev) => ({ ...prev, ...data.settings }));
      toast({ title: "Settings saved", description: "Invoice settings updated successfully." });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const update = <K extends keyof InvoiceSettings>(key: K, value: InvoiceSettings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const selectedTrigger = TRIGGER_OPTIONS.find((t) => t.value === settings.trigger);

  if (loading) {
    return (
      <DashboardSidebar>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />Loading settings...
        </div>
      </DashboardSidebar>
    );
  }

  return (
    <DashboardSidebar>
      <div className="p-6 max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Invoice Settings</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {orgName && <span className="font-medium">{orgName} · </span>}
              Configure how and when invoices are generated for your customers
            </p>
          </div>
          <Button onClick={save} disabled={saving}>
            {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Settings
          </Button>
        </div>

        {/* Invoice Trigger */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice Trigger</CardTitle>
            <CardDescription>Determines at which point in the order lifecycle an invoice is automatically created</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>When to generate invoice</Label>
              <Select value={settings.trigger} onValueChange={(v) => update("trigger", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTrigger && (
                <p className="text-xs text-muted-foreground flex items-start gap-1">
                  <Info className="h-3 w-3 mt-0.5 shrink-0" />
                  {selectedTrigger.description}
                </p>
              )}
            </div>

            {settings.trigger === "ON_DELIVERY_CONFIRMATION" && (
              <div className="flex items-center justify-between rounded-lg border p-3 bg-amber-50">
                <div>
                  <p className="text-sm font-medium">Require Delivery Confirmation</p>
                  <p className="text-xs text-muted-foreground">Block invoice generation until delivery is confirmed by customer</p>
                </div>
                <Switch
                  checked={settings.requireDeliveryConfirmation}
                  onCheckedChange={(v) => update("requireDeliveryConfirmation", v)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Terms</CardTitle>
            <CardDescription>Default terms applied to all generated invoices</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Net Days (payment due)</Label>
              <Input
                type="number"
                min={0}
                max={365}
                value={settings.termsNet}
                onChange={(e) => update("termsNet", Number(e.target.value))}
                placeholder="30"
              />
              <p className="text-xs text-muted-foreground">e.g. 30 = "Net 30" — payment due 30 days from invoice date</p>
            </div>
            <div className="space-y-2">
              <Label>Default Tax Rate (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={settings.taxRate}
                onChange={(e) => update("taxRate", Number(e.target.value))}
                placeholder="0"
              />
            </div>
          </CardContent>
        </Card>

        {/* Numbering */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice Numbering</CardTitle>
            <CardDescription>Customize the format of generated invoice numbers</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Invoice Prefix</Label>
              <Input
                value={settings.invoicePrefix}
                onChange={(e) => update("invoicePrefix", e.target.value)}
                placeholder="INV"
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">Example: {settings.invoicePrefix || "INV"}-20250101-0001</p>
            </div>
            <div className="space-y-2">
              <Label>Next Sequence Number</Label>
              <Input
                type="number"
                min={1}
                value={settings.nextSequence}
                onChange={(e) => update("nextSequence", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Default Currency</Label>
              <Select value={settings.currency} onValueChange={(v) => update("currency", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Document Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Document Settings</CardTitle>
            <CardDescription>Packing slips and invoice document customisation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Auto-generate Packing Slips</p>
                <p className="text-xs text-muted-foreground">Automatically make packing slips available when an order is packed/shipped</p>
              </div>
              <Switch
                checked={settings.showPackingSlip}
                onCheckedChange={(v) => update("showPackingSlip", v)}
              />
            </div>

            <div className="space-y-2">
              <Label>Logo URL (overrides default)</Label>
              <Input
                value={settings.logoUrl}
                onChange={(e) => update("logoUrl", e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="space-y-2">
              <Label>Invoice Footer Text</Label>
              <Textarea
                value={settings.footerText}
                onChange={(e) => update("footerText", e.target.value)}
                placeholder="Thank you for your business! Terms and conditions apply..."
                rows={3}
                maxLength={2000}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bank / Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Details</CardTitle>
            <CardDescription>Information printed on invoices to guide customers on how to pay</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Bank Details</Label>
              <Textarea
                value={settings.bankDetails}
                onChange={(e) => update("bankDetails", e.target.value)}
                placeholder="Bank: First National Bank&#10;Account: 1234567890&#10;Branch Code: 250655&#10;SWIFT: FIRNZAJJ"
                rows={4}
                maxLength={2000}
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Instructions</Label>
              <Textarea
                value={settings.paymentInstructions}
                onChange={(e) => update("paymentInstructions", e.target.value)}
                placeholder="Please use your invoice number as reference when making payment..."
                rows={3}
                maxLength={2000}
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Email Notifications</CardTitle>
            <CardDescription>Additional recipients CC'd on invoice emails</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label>CC Emails (comma-separated)</Label>
            <Input
              value={ccEmailInput}
              onChange={(e) => setCcEmailInput(e.target.value)}
              placeholder="finance@company.com, accounts@company.com"
            />
            <p className="text-xs text-muted-foreground">These addresses will be CC'd on every invoice email sent to customers.</p>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving} size="lg">
            {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save All Settings
          </Button>
        </div>
      </div>
    </DashboardSidebar>
  );
}
