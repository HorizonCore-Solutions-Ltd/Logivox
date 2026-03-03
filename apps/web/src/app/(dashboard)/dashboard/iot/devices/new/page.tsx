"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, Loader2, Cpu } from "lucide-react";

interface Warehouse {
  id: string;
  name: string;
}

const DEVICE_TYPES = [
  "SENSOR",
  "SCANNER",
  "SCALE",
  "CAMERA",
  "CONVEYOR",
  "FORKLIFT",
  "ROBOT",
  "GATEWAY",
  "RFID_READER",
  "PRINTER",
  "OTHER",
];

export default function NewIoTDevicePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [name, setName] = useState("");
  const [deviceType, setDeviceType] = useState("SCANNER");
  const [serialNumber, setSerialNumber] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [macAddress, setMacAddress] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [firmwareVersion, setFirmwareVersion] = useState("");

  useEffect(() => {
    fetch("/api/warehouses")
      .then((r) => r.json())
      .then((d) => setWarehouses(d.warehouses || d.data || []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Device name is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/iot/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          deviceType,
          serialNumber: serialNumber || undefined,
          manufacturer: manufacturer || undefined,
          model: model || undefined,
          ipAddress: ipAddress || undefined,
          macAddress: macAddress || undefined,
          warehouseId: warehouseId || undefined,
          location: location || undefined,
          description: description || undefined,
          apiKey: apiKey || undefined,
          firmwareVersion: firmwareVersion || undefined,
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed");
      }
      const data = await res.json();
      toast({ title: "Device registered", description: data.device?.name });
      router.push("/dashboard/iot");
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
        <Link href="/dashboard/iot">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Cpu className="h-7 w-7" />
            Register IoT Device
          </h1>
          <p className="text-muted-foreground mt-1">
            Add a new IoT device to your warehouse network
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Device Identity</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Device Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Dock Door Scanner #3"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Device Type</Label>
              <Select value={deviceType} onValueChange={setDeviceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEVICE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Serial Number</Label>
              <Input
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="SN-XXXX-XXXX"
              />
            </div>
            <div className="space-y-2">
              <Label>Manufacturer</Label>
              <Input
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g., Zebra, Honeywell"
              />
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Model number"
              />
            </div>
            <div className="space-y-2">
              <Label>Firmware Version</Label>
              <Input
                value={firmwareVersion}
                onChange={(e) => setFirmwareVersion(e.target.value)}
                placeholder="e.g., 2.4.1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Network &amp; Location</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>IP Address</Label>
              <Input
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="192.168.1.100"
              />
            </div>
            <div className="space-y-2">
              <Label>MAC Address</Label>
              <Input
                value={macAddress}
                onChange={(e) => setMacAddress(e.target.value)}
                placeholder="AA:BB:CC:DD:EE:FF"
              />
            </div>
            <div className="space-y-2">
              <Label>Warehouse</Label>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select warehouse..." />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Physical Location</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Dock Door 3, Zone A"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Device API key or token"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notes about this device..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Link href="/dashboard/iot">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Cpu className="h-4 w-4 mr-2" />
            )}
            {saving ? "Registering..." : "Register Device"}
          </Button>
        </div>
      </form>
    </div>
  );
}
