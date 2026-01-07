"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Download } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function CreateReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: "NCR_SUMMARY",
    period: "MONTHLY",
    startDate: "",
    endDate: "",
    includeCharts: true,
    includeDetails: true,
    format: "PDF",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/qc/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate),
        }),
      });

      if (!response.ok) throw new Error("Failed to generate report");

      const data = await response.json();

      // Download the report
      if (formData.format === "PDF") {
        window.open(data.downloadUrl, "_blank");
      }

      router.push(`/dashboard/qc/reports/${data.id}`);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate report");
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
          <h1 className="text-3xl font-bold">Generate Quality Report</h1>
          <p className="text-muted-foreground">
            Create comprehensive quality analytics and summaries
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Type</CardTitle>
              <CardDescription>
                Select the type of quality report to generate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Report Type *</Label>
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
                    <SelectItem value="NCR_SUMMARY">
                      <div className="flex flex-col items-start">
                        <div className="font-semibold">NCR Summary Report</div>
                        <div className="text-xs text-muted-foreground">
                          Overview of all non-conformances
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="CAPA_EFFECTIVENESS">
                      <div className="flex flex-col items-start">
                        <div className="font-semibold">CAPA Effectiveness</div>
                        <div className="text-xs text-muted-foreground">
                          CAPA completion and verification status
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="SUPPLIER_SCORECARD">
                      <div className="flex flex-col items-start">
                        <div className="font-semibold">
                          Supplier Quality Scorecard
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Vendor performance metrics
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="INSPECTION_RESULTS">
                      <div className="flex flex-col items-start">
                        <div className="font-semibold">Inspection Results</div>
                        <div className="text-xs text-muted-foreground">
                          Pass/fail rates and trends
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="COST_IMPACT">
                      <div className="flex flex-col items-start">
                        <div className="font-semibold">
                          Quality Cost Analysis
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Financial impact of quality issues
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="SPC_ANALYSIS">
                      <div className="flex flex-col items-start">
                        <div className="font-semibold">SPC Control Charts</div>
                        <div className="text-xs text-muted-foreground">
                          Statistical process control analysis
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="AUDIT_READINESS">
                      <div className="flex flex-col items-start">
                        <div className="font-semibold">Audit Readiness</div>
                        <div className="text-xs text-muted-foreground">
                          Compliance status for ISO/FDA audits
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Report Period</CardTitle>
              <CardDescription>
                Define the time range for the report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="period">Period Preset</Label>
                <Select
                  value={formData.period}
                  onValueChange={(value) => {
                    const today = new Date();
                    let startDate = new Date();

                    switch (value) {
                      case "WEEKLY":
                        startDate.setDate(today.getDate() - 7);
                        break;
                      case "MONTHLY":
                        startDate.setMonth(today.getMonth() - 1);
                        break;
                      case "QUARTERLY":
                        startDate.setMonth(today.getMonth() - 3);
                        break;
                      case "YEARLY":
                        startDate.setFullYear(today.getFullYear() - 1);
                        break;
                    }

                    setFormData({
                      ...formData,
                      period: value,
                      startDate: startDate.toISOString().split("T")[0],
                      endDate: today.toISOString().split("T")[0],
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEKLY">Last 7 Days</SelectItem>
                    <SelectItem value="MONTHLY">Last 30 Days</SelectItem>
                    <SelectItem value="QUARTERLY">Last 3 Months</SelectItem>
                    <SelectItem value="YEARLY">Last 12 Months</SelectItem>
                    <SelectItem value="CUSTOM">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Report Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCharts"
                  checked={formData.includeCharts}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      includeCharts: checked as boolean,
                    })
                  }
                />
                <label
                  htmlFor="includeCharts"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Include charts and graphs
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeDetails"
                  checked={formData.includeDetails}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      includeDetails: checked as boolean,
                    })
                  }
                />
                <label
                  htmlFor="includeDetails"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Include detailed data tables
                </label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Export Format *</Label>
                <Select
                  value={formData.format}
                  onValueChange={(value) =>
                    setFormData({ ...formData, format: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF Document</SelectItem>
                    <SelectItem value="EXCEL">Excel Spreadsheet</SelectItem>
                    <SelectItem value="CSV">CSV Data</SelectItem>
                  </SelectContent>
                </Select>
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
              {loading ? (
                <>Generating...</>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
