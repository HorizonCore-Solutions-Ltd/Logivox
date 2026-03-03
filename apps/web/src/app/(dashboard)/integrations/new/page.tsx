"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader2, Plug, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PROVIDERS = [
  {
    id: "shopify",
    name: "Shopify",
    category: "E-Commerce",
    description: "Connect your Shopify store",
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    category: "E-Commerce",
    description: "Sync with WooCommerce orders",
  },
  {
    id: "amazon",
    name: "Amazon Seller",
    category: "Marketplace",
    description: "Amazon marketplace orders",
  },
  {
    id: "fedex",
    name: "FedEx",
    category: "Shipping",
    description: "FedEx shipping & tracking",
  },
  {
    id: "ups",
    name: "UPS",
    category: "Shipping",
    description: "UPS shipping & tracking",
  },
  {
    id: "dhl",
    name: "DHL",
    category: "Shipping",
    description: "DHL shipping & tracking",
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    category: "Accounting",
    description: "QuickBooks Online sync",
  },
  {
    id: "xero",
    name: "Xero",
    category: "Accounting",
    description: "Xero accounting sync",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    category: "CRM",
    description: "Salesforce CRM integration",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    category: "CRM",
    description: "HubSpot CRM integration",
  },
  {
    id: "custom",
    name: "Custom Webhook",
    category: "Custom",
    description: "Custom HTTP webhook",
  },
];

export default function NewIntegrationPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("");

  const [name, setName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [shopDomain, setShopDomain] = useState("");
  const [accountId, setAccountId] = useState("");
  const [notes, setNotes] = useState("");
  const [syncFrequency, setSyncFrequency] = useState("REALTIME");

  const provider = PROVIDERS.find((p) => p.id === selectedProvider);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) {
      toast({
        title: "Select an integration provider",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const config: Record<string, string> = {};
      if (shopDomain) config.shopDomain = shopDomain;
      if (accountId) config.accountId = accountId;
      if (webhookUrl) config.webhookUrl = webhookUrl;

      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider.toUpperCase(),
          name: name || provider?.name,
          apiKey: apiKey || undefined,
          apiSecret: apiSecret || undefined,
          syncFrequency,
          notes: notes || undefined,
          config: Object.keys(config).length > 0 ? config : undefined,
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed");
      }
      const data = await res.json();
      toast({
        title: "Integration connected",
        description: data.integration?.name,
      });
      router.push("/integrations");
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/integrations">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Plug className="h-7 w-7" />
            New Integration
          </h1>
          <p className="text-muted-foreground mt-1">
            Connect a third-party service to your account
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Provider Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Choose Provider</CardTitle>
            <CardDescription>
              Select the service you want to connect
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProvider(p.id)}
                  className={`text-left p-4 rounded-lg border-2 transition-colors ${selectedProvider === p.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{p.name}</span>
                    {selectedProvider === p.id && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {p.category}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {p.description}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedProvider && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Connection Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Integration Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={provider?.name}
                  />
                </div>
                {["shopify", "woocommerce"].includes(selectedProvider) && (
                  <div className="space-y-2">
                    <Label>Shop Domain</Label>
                    <Input
                      value={shopDomain}
                      onChange={(e) => setShopDomain(e.target.value)}
                      placeholder="yourstore.myshopify.com"
                    />
                  </div>
                )}
                {[
                  "amazon",
                  "quickbooks",
                  "xero",
                  "salesforce",
                  "hubspot",
                ].includes(selectedProvider) && (
                  <div className="space-y-2">
                    <Label>Account ID</Label>
                    <Input
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      placeholder="Your account ID"
                    />
                  </div>
                )}
                {selectedProvider === "custom" && (
                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <Input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://your-endpoint.com/webhook"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="API key or access token"
                  />
                </div>
                <div className="space-y-2">
                  <Label>API Secret</Label>
                  <Input
                    type="password"
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    placeholder="API secret (if required)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sync Frequency</Label>
                  <Select
                    value={syncFrequency}
                    onValueChange={setSyncFrequency}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "REALTIME",
                        "EVERY_15_MIN",
                        "HOURLY",
                        "DAILY",
                        "MANUAL",
                      ].map((f) => (
                        <SelectItem key={f} value={f}>
                          {f.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes about this integration..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3 justify-end">
              <Link href="/integrations">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plug className="h-4 w-4 mr-2" />
                )}
                {saving ? "Connecting..." : "Connect Integration"}
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
