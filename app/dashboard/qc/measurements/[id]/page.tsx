"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  XCircle,
  FileText,
  AlertTriangle,
  CheckCircle,
  BarChart3,
} from "lucide-react";

interface Measurement {
  id: string;
  measurementNumber: string;
  measurementType: string;
  characteristic: string;
  measuredValue: number;
  unit: string;
  specMin: number;
  specMax: number;
  targetValue: number;
  deviation: number;
  conformanceStatus: string;
  cpk?: number;
  measurementDate: string;
  measuredBy: string;
  equipmentUsed?: string;
  calibrationDate?: string;
  notes?: string;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
  lot?: {
    id: string;
    lotNumber: string;
  };
  inspection?: {
    id: string;
    inspectionNumber: string;
  };
  createdAt: string;
  updatedAt: string;
}

const typeColors: Record<string, string> = {
  DIMENSION: "bg-blue-100 text-blue-800",
  WEIGHT: "bg-green-100 text-green-800",
  TEMPERATURE: "bg-orange-100 text-orange-800",
  PRESSURE: "bg-purple-100 text-purple-800",
  HARDNESS: "bg-yellow-100 text-yellow-800",
  VISCOSITY: "bg-cyan-100 text-cyan-800",
  pH: "bg-pink-100 text-pink-800",
  OTHER: "bg-gray-100 text-gray-800",
};

const conformanceColors: Record<string, string> = {
  CONFORMING: "bg-green-100 text-green-800",
  NON_CONFORMING: "bg-red-100 text-red-800",
  MARGINAL: "bg-yellow-100 text-yellow-800",
};

export default function MeasurementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeasurement();
  }, [params.id]);

  const fetchMeasurement = async () => {
    try {
      const response = await fetch(`/api/qc/measurements/${params.id}`);
      const data = await response.json();
      setMeasurement(data);
    } catch (error) {
      console.error("Error fetching measurement:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this measurement?")) return;

    try {
      await fetch(`/api/qc/measurements/${params.id}`, {
        method: "DELETE",
      });
      router.push("/dashboard/qc/measurements");
    } catch (error) {
      console.error("Error deleting measurement:", error);
    }
  };

  const getCPKLevel = (cpk?: number) => {
    if (!cpk) return { label: "N/A", color: "text-gray-600", bgColor: "bg-gray-100" };
    if (cpk >= 2.0) return { label: "Excellent", color: "text-green-600", bgColor: "bg-green-100" };
    if (cpk >= 1.33) return { label: "Good", color: "text-blue-600", bgColor: "bg-blue-100" };
    if (cpk >= 1.0) return { label: "Adequate", color: "text-yellow-600", bgColor: "bg-yellow-100" };
    return { label: "Poor", color: "text-red-600", bgColor: "bg-red-100" };
  };

  const getSpecRange = () => {
    if (!measurement) return 0;
    return measurement.specMax - measurement.specMin;
  };

  const getDeviationPercentage = () => {
    if (!measurement) return 0;
    const range = getSpecRange();
    if (range === 0) return 0;
    return (Math.abs(measurement.deviation) / range) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading measurement details...</p>
        </div>
      </div>
    );
  }

  if (!measurement) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-muted-foreground">Measurement not found</p>
        </div>
      </div>
    );
  }

  const cpkLevel = getCPKLevel(measurement.cpk);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/dashboard/qc/measurements")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{measurement.measurementNumber}</h1>
            <p className="text-muted-foreground">{measurement.characteristic}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/qc/measurements/${params.id}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex gap-2 flex-wrap">
        <Badge className={conformanceColors[measurement.conformanceStatus] || "bg-gray-100"}>
          {measurement.conformanceStatus.replace("_", " ")}
        </Badge>
        <Badge className={typeColors[measurement.measurementType] || "bg-gray-100"}>
          {measurement.measurementType}
        </Badge>
        {measurement.cpk && (
          <Badge className={`${cpkLevel.bgColor} ${cpkLevel.color}`}>
            CPK: {measurement.cpk.toFixed(2)} - {cpkLevel.label}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Measurement Value */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Measurement Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-2">Measured Value</p>
                <p className="text-5xl font-bold mb-2">
                  {measurement.measuredValue}
                  <span className="text-2xl text-muted-foreground ml-2">
                    {measurement.unit}
                  </span>
                </p>
                {measurement.deviation !== 0 && (
                  <p className={`text-sm ${measurement.deviation > 0 ? "text-red-600" : "text-green-600"}`}>
                    {measurement.deviation > 0 ? "+" : ""}{measurement.deviation} {measurement.unit} from target
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Specification Limits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Specification Limits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Visual Range */}
              <div className="relative py-8">
                <div className="absolute w-full h-2 bg-gradient-to-r from-red-200 via-green-200 to-red-200 rounded-full" />
                
                {/* Min Marker */}
                <div className="absolute left-0 top-0">
                  <div className="w-1 h-12 bg-red-500" />
                  <p className="text-xs mt-1 text-red-600 font-semibold">
                    Min: {measurement.specMin}
                  </p>
                </div>

                {/* Target Marker */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0">
                  <div className="w-1 h-12 bg-blue-500" />
                  <p className="text-xs mt-1 text-blue-600 font-semibold">
                    Target: {measurement.targetValue}
                  </p>
                </div>

                {/* Max Marker */}
                <div className="absolute right-0 top-0">
                  <div className="w-1 h-12 bg-red-500" />
                  <p className="text-xs mt-1 text-red-600 font-semibold text-right">
                    Max: {measurement.specMax}
                  </p>
                </div>

                {/* Measured Value Marker */}
                <div
                  className="absolute top-0"
                  style={{
                    left: `${((measurement.measuredValue - measurement.specMin) / getSpecRange()) * 100}%`,
                  }}
                >
                  <div className="w-2 h-16 bg-purple-600 rounded-full -translate-x-1/2" />
                  <p className="text-xs mt-1 text-purple-600 font-bold whitespace-nowrap -translate-x-1/2">
                    Actual: {measurement.measuredValue}
                  </p>
                </div>
              </div>

              {/* Numeric Summary */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Spec Min</p>
                  <p className="text-lg font-bold text-red-600">
                    {measurement.specMin} {measurement.unit}
                  </p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Target</p>
                  <p className="text-lg font-bold text-blue-600">
                    {measurement.targetValue} {measurement.unit}
                  </p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Spec Max</p>
                  <p className="text-lg font-bold text-red-600">
                    {measurement.specMax} {measurement.unit}
                  </p>
                </div>
              </div>

              {/* Deviation */}
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Deviation from Target</p>
                <p className={`text-2xl font-bold ${measurement.deviation === 0 ? "text-green-600" : measurement.conformanceStatus === "CONFORMING" ? "text-yellow-600" : "text-red-600"}`}>
                  {measurement.deviation > 0 ? "+" : ""}{measurement.deviation} {measurement.unit}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {getDeviationPercentage().toFixed(1)}% of specification range
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Process Capability */}
          {measurement.cpk && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Process Capability (CPK)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-center p-6 rounded-lg ${cpkLevel.bgColor}`}>
                  <p className="text-sm text-muted-foreground mb-2">CPK Value</p>
                  <p className={`text-4xl font-bold ${cpkLevel.color}`}>
                    {measurement.cpk.toFixed(2)}
                  </p>
                  <p className={`text-lg ${cpkLevel.color} mt-2`}>{cpkLevel.label}</p>
                  <p className="text-xs text-muted-foreground mt-4">
                    {measurement.cpk >= 2.0 && "World-class process capability"}
                    {measurement.cpk >= 1.33 && measurement.cpk < 2.0 && "Good process control"}
                    {measurement.cpk >= 1.0 && measurement.cpk < 1.33 && "Adequate, but improvement recommended"}
                    {measurement.cpk < 1.0 && "Process improvement required"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {measurement.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{measurement.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Measurement Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Measurement Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Measured By</p>
                <p className="text-sm font-medium">{measurement.measuredBy}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Measurement Date</p>
                <p className="text-sm">
                  {new Date(measurement.measurementDate).toLocaleString()}
                </p>
              </div>
              {measurement.equipmentUsed && (
                <div>
                  <p className="text-sm text-muted-foreground">Equipment Used</p>
                  <p className="text-sm">{measurement.equipmentUsed}</p>
                </div>
              )}
              {measurement.calibrationDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Calibration Date</p>
                  <p className="text-sm">
                    {new Date(measurement.calibrationDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Related Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {measurement.product && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Product</p>
                  <p className="text-sm font-medium">{measurement.product.name}</p>
                  <p className="text-xs text-muted-foreground">{measurement.product.sku}</p>
                </div>
              )}
              {measurement.lot && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Lot</p>
                  <p className="text-sm font-medium">{measurement.lot.lotNumber}</p>
                </div>
              )}
              {measurement.inspection && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Inspection</p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-sm"
                    onClick={() =>
                      router.push(`/dashboard/qc/inspections/${measurement.inspection?.id}`)
                    }
                  >
                    {measurement.inspection.inspectionNumber}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm">{new Date(measurement.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm">{new Date(measurement.updatedAt).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push(`/dashboard/qc/measurements/spc?productId=${measurement.product?.id}&characteristic=${measurement.characteristic}`)}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View SPC Chart
              </Button>
              {measurement.conformanceStatus === "NON_CONFORMING" && (
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 border-red-600 hover:bg-red-50"
                  onClick={() => router.push(`/dashboard/qc/ncr/create?measurementId=${measurement.id}`)}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Create NCR
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.print()}
              >
                <FileText className="w-4 h-4 mr-2" />
                Print Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
