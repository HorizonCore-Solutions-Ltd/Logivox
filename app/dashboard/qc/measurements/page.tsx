"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  Plus,
  RefreshCw,
  Ruler,
  CheckCircle,
  XCircle,
  LineChart,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

interface MeasurementStats {
  total: number;
  conforming: number;
  nonConforming: number;
  conformanceRate: number;
  byType: Record<string, { count: number; conforming: number }>;
}

interface Measurement {
  id: string;
  measurementNumber: string;
  measurementType: string;
  measurementName: string;
  measurementValue: number;
  unitOfMeasure: string;
  lowerSpecLimit?: number;
  upperSpecLimit?: number;
  isConforming: boolean;
  deviation?: number;
  cpk?: number;
  measurementDate: string;
  referenceName?: string;
}

export default function MeasurementsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MeasurementStats | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [measurementTypeFilter, setMeasurementTypeFilter] =
    useState<string>("");
  const [conformingFilter, setConformingFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const organizationId = "org_123"; // TODO: Get from auth context

  useEffect(() => {
    fetchData();
  }, [measurementTypeFilter, conformingFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({ organizationId });
      if (measurementTypeFilter)
        params.append("measurementType", measurementTypeFilter);
      if (conformingFilter) params.append("isConforming", conformingFilter);

      const [statsRes, measurementsRes] = await Promise.all([
        fetch(`/api/qc/measurements/stats?organizationId=${organizationId}`),
        fetch(`/api/qc/measurements?${params.toString()}`),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (measurementsRes.ok) setMeasurements(await measurementsRes.json());
    } catch (error) {
      console.error("Error fetching measurement data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMeasurements = measurements.filter(
    (m) =>
      m.measurementNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.measurementName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getMeasurementTypeBadge = (type: string) => {
    const config: Record<string, string> = {
      DIMENSIONAL: "bg-blue-500",
      WEIGHT: "bg-purple-500",
      TEMPERATURE: "bg-red-500",
      PRESSURE: "bg-orange-500",
      PH: "bg-green-600",
      HARDNESS: "bg-gray-600",
      THICKNESS: "bg-teal-500",
      VISCOSITY: "bg-pink-500",
    };
    return <Badge className={`${config[type]} text-white`}>{type}</Badge>;
  };

  const getConformanceBadge = (isConforming: boolean) => {
    return isConforming ? (
      <Badge className="bg-green-600 text-white flex items-center gap-1 w-fit">
        <CheckCircle className="h-3 w-3" />
        Conforming
      </Badge>
    ) : (
      <Badge className="bg-red-600 text-white flex items-center gap-1 w-fit">
        <XCircle className="h-3 w-3" />
        Non-Conforming
      </Badge>
    );
  };

  const getCPKBadge = (cpk: number | undefined) => {
    if (!cpk) return <Badge variant="outline">N/A</Badge>;

    if (cpk >= 1.67)
      return (
        <Badge className="bg-green-600 text-white">
          Excellent ({cpk.toFixed(2)})
        </Badge>
      );
    if (cpk >= 1.33)
      return (
        <Badge className="bg-blue-500 text-white">
          Good ({cpk.toFixed(2)})
        </Badge>
      );
    if (cpk >= 1.0)
      return (
        <Badge className="bg-yellow-500 text-white">
          Adequate ({cpk.toFixed(2)})
        </Badge>
      );
    return (
      <Badge className="bg-red-600 text-white">Poor ({cpk.toFixed(2)})</Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quality Measurements</h1>
          <p className="text-muted-foreground">
            Parametric data tracking with SPC
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/qc/measurements/spc">
            <Button variant="outline">
              <LineChart className="h-4 w-4 mr-2" />
              SPC Charts
            </Button>
          </Link>
          <Link href="/dashboard/qc/measurements/record">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Record Measurement
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Measurements
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                All parametric data
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conforming</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.conforming}
              </div>
              <p className="text-xs text-muted-foreground">
                Within spec limits
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Non-Conforming
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.nonConforming}
              </div>
              <p className="text-xs text-muted-foreground">Out of spec</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Conformance Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.conformanceRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">Overall quality</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Measurement Types Breakdown */}
      {stats && Object.keys(stats.byType).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Measurements by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-4">
              {Object.entries(stats.byType).map(([type, data]) => (
                <div key={type} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    {getMeasurementTypeBadge(type)}
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">{data.count}</div>
                  <p className="text-xs text-muted-foreground">
                    {data.conforming} conforming (
                    {((data.conforming / data.count) * 100).toFixed(0)}%)
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Measurements List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search by measurement number or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select
              value={measurementTypeFilter}
              onValueChange={setMeasurementTypeFilter}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="DIMENSIONAL">Dimensional</SelectItem>
                <SelectItem value="WEIGHT">Weight</SelectItem>
                <SelectItem value="TEMPERATURE">Temperature</SelectItem>
                <SelectItem value="PRESSURE">Pressure</SelectItem>
                <SelectItem value="PH">pH</SelectItem>
                <SelectItem value="HARDNESS">Hardness</SelectItem>
                <SelectItem value="THICKNESS">Thickness</SelectItem>
                <SelectItem value="VISCOSITY">Viscosity</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={conformingFilter}
              onValueChange={setConformingFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Results" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Results</SelectItem>
                <SelectItem value="true">Conforming</SelectItem>
                <SelectItem value="false">Non-Conforming</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Measurement #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Spec Limits</TableHead>
                  <TableHead>Deviation</TableHead>
                  <TableHead>CPK</TableHead>
                  <TableHead>Conformance</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMeasurements.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="text-center text-muted-foreground"
                    >
                      No measurements found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMeasurements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">
                        {m.measurementNumber}
                      </TableCell>
                      <TableCell>
                        {getMeasurementTypeBadge(m.measurementType)}
                      </TableCell>
                      <TableCell>{m.measurementName}</TableCell>
                      <TableCell className="font-semibold">
                        {m.measurementValue}
                      </TableCell>
                      <TableCell>{m.unitOfMeasure}</TableCell>
                      <TableCell>
                        {m.lowerSpecLimit && m.upperSpecLimit ? (
                          <span className="text-xs">
                            {m.lowerSpecLimit} - {m.upperSpecLimit}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {m.deviation ? (
                          <span
                            className={
                              m.deviation !== 0
                                ? "text-red-600 font-semibold"
                                : ""
                            }
                          >
                            {m.deviation > 0 ? "+" : ""}
                            {m.deviation.toFixed(3)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{getCPKBadge(m.cpk)}</TableCell>
                      <TableCell>
                        {getConformanceBadge(m.isConforming)}
                      </TableCell>
                      <TableCell>
                        {new Date(m.measurementDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/qc/measurements/${m.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
