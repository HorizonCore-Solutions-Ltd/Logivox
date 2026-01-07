"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Package, Printer, Download, QrCode, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LabelGenerationModalProps {
  open: boolean;
  onClose: () => void;
  rmaId: string;
  rmaNumber: string;
}

export default function LabelGenerationModal({
  open,
  onClose,
  rmaId,
  rmaNumber,
}: LabelGenerationModalProps) {
  const [loading, setLoading] = useState(false);
  const [carrier, setCarrier] = useState("UPS");
  const [serviceLevel, setServiceLevel] = useState("GROUND");
  const [label, setLabel] = useState<any>(null);

  const [shipFrom, setShipFrom] = useState({
    name: "",
    address1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });

  const [shipTo, setShipTo] = useState({
    name: "",
    address1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });

  const [packageInfo, setPackageInfo] = useState({
    weight: 5,
    weightUnit: "lb",
  });

  const handleGenerate = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/returns/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rmaId,
          carrier,
          serviceLevel,
          type: "PREPAID",
          shipFrom,
          shipTo,
          package: packageInfo,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate label");
      }

      const data = await response.json();
      setLabel(data.label);
      toast.success("Label generated successfully!");
    } catch (error) {
      console.error("Error generating label:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate label",
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (label?.labelUrl) {
      window.open(label.labelUrl, "_blank");
    }
  };

  const handleDownload = () => {
    if (label?.labelUrl) {
      const link = document.createElement("a");
      link.href = label.labelUrl;
      link.download = `${rmaNumber}-label.pdf`;
      link.click();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Generate Return Label - {rmaNumber}
          </DialogTitle>
        </DialogHeader>

        {!label ? (
          <div className="space-y-6">
            {/* Carrier Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Carrier</Label>
                <Select value={carrier} onValueChange={setCarrier}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPS">UPS</SelectItem>
                    <SelectItem value="FedEx">FedEx</SelectItem>
                    <SelectItem value="USPS">USPS</SelectItem>
                    <SelectItem value="DHL">DHL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Service Level</Label>
                <Select value={serviceLevel} onValueChange={setServiceLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GROUND">Ground</SelectItem>
                    <SelectItem value="2DAY">2-Day</SelectItem>
                    <SelectItem value="OVERNIGHT">Overnight</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ship From */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Ship From (Warehouse)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Company Name"
                  value={shipFrom.name}
                  onChange={(e) =>
                    setShipFrom({ ...shipFrom, name: e.target.value })
                  }
                />
                <Input
                  placeholder="Address"
                  value={shipFrom.address1}
                  onChange={(e) =>
                    setShipFrom({ ...shipFrom, address1: e.target.value })
                  }
                />
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="City"
                    value={shipFrom.city}
                    onChange={(e) =>
                      setShipFrom({ ...shipFrom, city: e.target.value })
                    }
                  />
                  <Input
                    placeholder="State"
                    value={shipFrom.state}
                    onChange={(e) =>
                      setShipFrom({ ...shipFrom, state: e.target.value })
                    }
                  />
                  <Input
                    placeholder="ZIP"
                    value={shipFrom.postalCode}
                    onChange={(e) =>
                      setShipFrom({ ...shipFrom, postalCode: e.target.value })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Ship To */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Ship To (Customer)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Customer Name"
                  value={shipTo.name}
                  onChange={(e) =>
                    setShipTo({ ...shipTo, name: e.target.value })
                  }
                />
                <Input
                  placeholder="Address"
                  value={shipTo.address1}
                  onChange={(e) =>
                    setShipTo({ ...shipTo, address1: e.target.value })
                  }
                />
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="City"
                    value={shipTo.city}
                    onChange={(e) =>
                      setShipTo({ ...shipTo, city: e.target.value })
                    }
                  />
                  <Input
                    placeholder="State"
                    value={shipTo.state}
                    onChange={(e) =>
                      setShipTo({ ...shipTo, state: e.target.value })
                    }
                  />
                  <Input
                    placeholder="ZIP"
                    value={shipTo.postalCode}
                    onChange={(e) =>
                      setShipTo({ ...shipTo, postalCode: e.target.value })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Package Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Weight (lbs)</Label>
                <Input
                  type="number"
                  value={packageInfo.weight}
                  onChange={(e) =>
                    setPackageInfo({
                      ...packageInfo,
                      weight: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </div>
        ) : (
          /* Label Generated */
          <div className="space-y-4">
            <Card className="bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Label Generated!</h3>
                    <p className="text-sm text-muted-foreground">
                      Tracking: {label.trackingNumber}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Carrier</div>
                    <div className="font-medium">{label.carrier}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Service</div>
                    <div className="font-medium">{label.serviceLevel}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Cost</div>
                    <div className="font-medium">
                      ${label.cost?.amount || "0.00"}{" "}
                      {label.cost?.currency || "USD"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Format</div>
                    <div className="font-medium">{label.format}</div>
                  </div>
                </div>

                {label.qrCodeUrl && (
                  <div className="mt-4 flex justify-center">
                    <img
                      src={label.qrCodeUrl}
                      alt="QR Code"
                      className="w-32 h-32 border-2 border-green-500 rounded"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button onClick={handlePrint} className="flex-1">
                <Printer className="w-4 h-4 mr-2" />
                Print Label
              </Button>
              <Button
                onClick={handleDownload}
                variant="outline"
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          {!label ? (
            <>
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4 mr-2" />
                    Generate Label
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={onClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
