"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, TrendingDown, CheckCircle2, XCircle } from "lucide-react";

export default function CreateMeasurementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: "DIMENSIONAL",
    characteristic: "",
    productId: "",
    lotNumber: "",
    measuredValue: "",
    lowerLimit: "",
    upperLimit: "",
    target: "",
    unit: "",
    inspectionMethod: "",
    inspector: "",
    notes: "",
  });

  // Calculate CPK
  const calculateCPK = () => {
    const value = parseFloat(formData.measuredValue);
    const lsl = parseFloat(formData.lowerLimit);
    const usl = parseFloat(formData.upperLimit);
    const target = parseFloat(formData.target);

    if (isNaN(value) || isNaN(lsl) || isNaN(usl)) return null;

    // Simplified CPK calculation (single measurement)
    // In production, use statistical methods with multiple samples
    const cpkLower = (value - lsl) / (3 * 0.1); // Assuming std dev
    const cpkUpper = (usl - value) / (3 * 0.1);
    const cpk = Math.min(cpkLower, cpkUpper);

    return {
      cpk: cpk.toFixed(2),
      withinSpec: value >= lsl && value <= usl,
      status: cpk >= 1.33 ? "Capable" : cpk >= 1.0 ? "Marginal" : "Not Capable",
    };
  };

  const stats = calculateCPK();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/qc/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          measuredValue: parseFloat(formData.measuredValue),
          lowerLimit: parseFloat(formData.lowerLimit) || null,
          upperLimit: parseFloat(formData.upperLimit) || null,
          target: parseFloat(formData.target) || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to create measurement");

      const data = await response.json();
      router.push(`/dashboard/qc/measurements/${data.id}`);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to create measurement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Record Quality Measurement</h1>
          <p className="text-muted-foreground">
            Parametric quality data with statistical analysis
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Measurement Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">Measurement Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DIMENSIONAL">Dimensional</SelectItem>
                      <SelectItem value="WEIGHT">Weight</SelectItem>
                      <SelectItem value="VISUAL">Visual Inspection</SelectItem>
                      <SelectItem value="FUNCTIONAL">
                        Functional Test
                      </SelectItem>
                      <SelectItem value="CHEMICAL">
                        Chemical Analysis
                      </SelectItem>
                      <SelectItem value="ELECTRICAL">Electrical</SelectItem>
                      <SelectItem value="HARDNESS">Hardness</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="characteristic">Characteristic *</Label>
                  <Input
                    id="characteristic"
                    required
                    value={formData.characteristic}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        characteristic: e.target.value,
                      })
                    }
                    placeholder="e.g., Length, Diameter, Resistance"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="productId">Product ID *</Label>
                  <Input
                    id="productId"
                    required
                    value={formData.productId}
                    onChange={(e) =>
                      setFormData({ ...formData, productId: e.target.value })
                    }
                    placeholder="Product identifier"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lotNumber">Lot Number *</Label>
                  <Input
                    id="lotNumber"
                    required
                    value={formData.lotNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, lotNumber: e.target.value })
                    }
                    placeholder="Lot/batch number"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Measurement Data</CardTitle>
              <CardDescription>
                Enter measured value and specification limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="lowerLimit">Lower Limit (LSL)</Label>
                  <Input
                    id="lowerLimit"
                    type="number"
                    step="any"
                    value={formData.lowerLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, lowerLimit: e.target.value })
                    }
                    placeholder="Min spec"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target">Target</Label>
                  <Input
                    id="target"
                    type="number"
                    step="any"
                    value={formData.target}
                    onChange={(e) =>
                      setFormData({ ...formData, target: e.target.value })
                    }
                    placeholder="Nominal"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="upperLimit">Upper Limit (USL)</Label>
                  <Input
                    id="upperLimit"
                    type="number"
                    step="any"
                    value={formData.upperLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, upperLimit: e.target.value })
                    }
                    placeholder="Max spec"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <Input
                    id="unit"
                    required
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    placeholder="mm, kg, Ω"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="measuredValue">Measured Value *</Label>
                <Input
                  id="measuredValue"
                  type="number"
                  step="any"
                  required
                  value={formData.measuredValue}
                  onChange={(e) =>
                    setFormData({ ...formData, measuredValue: e.target.value })
                  }
                  placeholder="Actual measured value"
                  className="text-lg font-semibold"
                />
              </div>

              {/* CPK Indicator */}
              {stats && (
                <Alert
                  className={
                    stats.withinSpec
                      ? "border-green-500 bg-green-50"
                      : "border-red-500 bg-red-50"
                  }
                >
                  <AlertDescription className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {stats.withinSpec ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span
                        className={
                          stats.withinSpec ? "text-green-600" : "text-red-600"
                        }
                      >
                        {stats.withinSpec
                          ? "Within Specification"
                          : "Out of Specification"}
                      </span>
                    </div>
                    <div>
                      <Badge
                        variant={
                          stats.cpk && parseFloat(stats.cpk) >= 1.33
                            ? "default"
                            : "destructive"
                        }
                      >
                        CPK: {stats.cpk} - {stats.status}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inspection Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="inspectionMethod">Inspection Method *</Label>
                  <Input
                    id="inspectionMethod"
                    required
                    value={formData.inspectionMethod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        inspectionMethod: e.target.value,
                      })
                    }
                    placeholder="e.g., Caliper, Scale, Multimeter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inspector">Inspector *</Label>
                  <Input
                    id="inspector"
                    required
                    value={formData.inspector}
                    onChange={(e) =>
                      setFormData({ ...formData, inspector: e.target.value })
                    }
                    placeholder="Your name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Additional observations or comments..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Recording..." : "Record Measurement"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
