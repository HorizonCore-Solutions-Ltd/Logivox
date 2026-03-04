// apps/web/src/app/(dashboard)/dashboard/brain/page.tsx

"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";

type Config = {
  id: string;
  minTrustScore: number;
  requireVerification: boolean; // Assisted Mode
  enableAutoReorders: boolean; // Autonomous Replen
  enableAutoTransfers: boolean; // Autonomous Moves
  enableAutoAdjustments: boolean; // Autonomous Stock Updates
};

const MODE_LABELS = {
  ADMIN_CONTROLLED: "Admin Controlled (Manual)",
  ADMIN_ASSISTED: "Admin Assisted (Copilot)",
  AUTONOMOUS: "Autonomous (Self-Driving)",
};

const MODE_DESCRIPTIONS = {
  ADMIN_CONTROLLED: "Humans approve everything. The safest mode.",
  ADMIN_ASSISTED: "System suggests, you verify. Good for day 1.",
  AUTONOMOUS: "System acts, you monitor. The goal.",
};

export default function FulfillmentBrainPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/fulfillment/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.organizationId) setConfig(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const updateConfig = async (key: keyof Config, value: any) => {
    if (!config) return;
    try {
      const res = await fetch("/api/fulfillment/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      const updated = await res.json();
      setConfig((prev) => ({ ...prev!, [key]: value }));
      toast({
        title: "Brain Configuration Updated",
        description: `Running in ${determineMode(updated)} mode.`,
      });
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed", description: String(err) });
    }
  };

  const determineMode = (c: Config) => {
    if (c.enableAutoReorders && c.enableAutoTransfers) return "AUTONOMOUS";
    if (!c.requireVerification) return "ADMIN_ASSISTED";
    return "ADMIN_CONTROLLED";
  };

  const currentMode = config ? determineMode(config) : "ADMIN_CONTROLLED";

  if (loading) return <div>Loading Intelligence Layer...</div>;

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fulfillment Brain Control Tower</h1>
          <p className="text-gray-500">Configure the autonomy level of your warehouse.</p>
        </div>
        <div className={`px-4 py-2 rounded-full font-bold ${
          currentMode === "AUTONOMOUS" ? "bg-purple-100 text-purple-700" :
          currentMode === "ADMIN_ASSISTED" ? "bg-blue-100 text-blue-700" :
          "bg-gray-100 text-gray-700"
        }`}>
          {MODE_LABELS[currentMode]}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className={currentMode === "ADMIN_CONTROLLED" ? "border-2 border-blue-500" : ""}>
          <CardHeader>
            <CardTitle>Admin Controlled</CardTitle>
            <CardDescription>Everything requires approval.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
                variant={currentMode === "ADMIN_CONTROLLED" ? "default" : "outline"}
                className="w-full"
                onClick={() => {
                    updateConfig("requireVerification", true);
                    updateConfig("enableAutoReorders", false);
                    updateConfig("enableAutoTransfers", false);
                }}
            >
                Set Active
            </Button>
          </CardContent>
        </Card>

        <Card className={currentMode === "ADMIN_ASSISTED" ? "border-2 border-blue-500" : ""}>
          <CardHeader>
            <CardTitle>Admin Assisted</CardTitle>
            <CardDescription>Auto-release, manual exceptions.</CardDescription>
          </CardHeader>
          <CardContent>
             <Button 
                variant={currentMode === "ADMIN_ASSISTED" ? "default" : "outline"}
                className="w-full"
                onClick={() => {
                    updateConfig("requireVerification", false); // Don't require check
                    updateConfig("enableAutoReorders", false); // But don't auto-reorder yet
                }}
            >
                Set Active
            </Button>
          </CardContent>
        </Card>

        <Card className={currentMode === "AUTONOMOUS" ? "border-2 border-purple-500" : ""}>
          <CardHeader>
            <CardTitle>Autonomous</CardTitle>
            <CardDescription>Zero-touch operations.</CardDescription>
          </CardHeader>
          <CardContent>
             <Button 
                variant={currentMode === "AUTONOMOUS" ? "default" : "outline"}
                className="w-full"
                onClick={() => {
                    updateConfig("requireVerification", false);
                    updateConfig("enableAutoReorders", true);
                    updateConfig("enableAutoTransfers", true);
                }}
            >
                Set Active
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Micro-Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-medium">Auto-Replenish Forward Pick</h3>
                    <p className="text-sm text-gray-500">Automatically generate tasks to move reserve stock when min/max hits.</p>
                </div>
                <Switch 
                    checked={config?.enableAutoReorders}
                    onCheckedChange={(c) => updateConfig("enableAutoReorders", c)}
                />
            </div>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-medium">Task Interleaving</h3>
                    <p className="text-sm text-gray-500">Allow drivers to receive interleaved tasks based on location.</p>
                </div>
                <Switch 
                    checked={config?.enableAutoTransfers}
                    onCheckedChange={(c) => updateConfig("enableAutoTransfers", c)}
                />
            </div>
             <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-medium">Inventory Trust Score Threshold</h3>
                    <p className="text-sm text-gray-500">Minimum reliability score required to bypass audit ({config?.minTrustScore}%).</p>
                </div>
                <input 
                    type="range" 
                    min="0" max="100" 
                    value={config?.minTrustScore} 
                    onChange={(e) => updateConfig("minTrustScore", Number(e.target.value))}
                    className="w-48"
                />
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
