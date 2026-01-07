"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Download,
  Calendar,
  Send,
  Plus,
  Eye,
  Trash2,
  Clock,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ReportConfig {
  reportType: string;
  frequency: string;
  format: string;
  recipients: string[];
  startDate?: string;
  endDate?: string;
}

export default function ReportsManagement({
  organizationId,
}: {
  organizationId: string;
}) {
  const { toast } = useToast();
  const [config, setConfig] = useState<ReportConfig>({
    reportType: "management_review",
    frequency: "MONTHLY",
    format: "PDF",
    recipients: [],
  });
  const [recipientEmail, setRecipientEmail] = useState("");
  const [generating, setGenerating] = useState(false);

  const reportTypes = [
    {
      value: "management_review",
      label: "Management Review Report",
      description: "ISO 9001 Clause 9.3",
    },
    {
      value: "supplier_quality",
      label: "Supplier Quality Report",
      description: "Supplier scorecard analysis",
    },
    {
      value: "calibration",
      label: "Calibration Status Report",
      description: "ISO/IEC 17025 compliance",
    },
    {
      value: "training",
      label: "Training Compliance Report",
      description: "ISO 9001 Clause 7.2",
    },
    {
      value: "regulatory",
      label: "Regulatory Compliance Summary",
      description: "Multi-standard compliance",
    },
  ];

  const frequencies = [
    { value: "DAILY", label: "Daily" },
    { value: "WEEKLY", label: "Weekly" },
    { value: "MONTHLY", label: "Monthly" },
    { value: "QUARTERLY", label: "Quarterly" },
    { value: "ANNUAL", label: "Annual" },
  ];

  const formats = [
    { value: "PDF", label: "PDF Document" },
    { value: "EXCEL", label: "Excel Spreadsheet" },
    { value: "JSON", label: "JSON Data" },
  ];

  const addRecipient = () => {
    if (recipientEmail && !config.recipients.includes(recipientEmail)) {
      setConfig({
        ...config,
        recipients: [...config.recipients, recipientEmail],
      });
      setRecipientEmail("");
    }
  };

  const removeRecipient = (email: string) => {
    setConfig({
      ...config,
      recipients: config.recipients.filter((r) => r !== email),
    });
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/qc/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          reportType: config.reportType,
          format: config.format,
          startDate: config.startDate,
          endDate: config.endDate,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${config.reportType}_${new Date().toISOString().split("T")[0]}.${config.format.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Report Generated",
          description: "Your report has been downloaded successfully.",
        });
      } else {
        throw new Error("Failed to generate report");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleScheduleReport = async () => {
    try {
      const response = await fetch("/api/qc/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          reportType: config.reportType,
          frequency: config.frequency,
          format: config.format,
          recipients: config.recipients,
        }),
      });

      if (response.ok) {
        toast({
          title: "Report Scheduled",
          description: `${config.frequency} ${config.reportType} report has been scheduled.`,
        });
        // Reset form
        setConfig({
          reportType: "management_review",
          frequency: "MONTHLY",
          format: "PDF",
          recipients: [],
        });
      } else {
        throw new Error("Failed to schedule report");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate Report</TabsTrigger>
          <TabsTrigger value="schedule">Schedule Reports</TabsTrigger>
        </TabsList>

        {/* Generate Report Tab */}
        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generate Quality Report
              </CardTitle>
              <CardDescription>
                Create an instant quality management report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="report-type">Report Type</Label>
                <Select
                  value={config.reportType}
                  onValueChange={(value) =>
                    setConfig({ ...config, reportType: value })
                  }
                >
                  <SelectTrigger id="report-type">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex flex-col">
                          <span>{type.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {type.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={config.startDate || ""}
                    onChange={(e) =>
                      setConfig({ ...config, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={config.endDate || ""}
                    onChange={(e) =>
                      setConfig({ ...config, endDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Export Format</Label>
                <Select
                  value={config.format}
                  onValueChange={(value) =>
                    setConfig({ ...config, format: value })
                  }
                >
                  <SelectTrigger id="format">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {formats.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerateReport}
                disabled={generating}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {generating ? "Generating..." : "Generate & Download Report"}
              </Button>
            </CardContent>
          </Card>

          {/* Available Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Available Report Types</CardTitle>
              <CardDescription>
                Regulatory-compliant quality reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportTypes.map((type) => (
                  <div
                    key={type.value}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{type.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {type.description}
                      </div>
                    </div>
                    <Badge variant="outline">
                      <FileText className="h-3 w-3 mr-1" />
                      Available
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Reports Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule Automated Reports
              </CardTitle>
              <CardDescription>
                Set up recurring report generation and distribution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scheduled-report-type">Report Type</Label>
                <Select
                  value={config.reportType}
                  onValueChange={(value) =>
                    setConfig({ ...config, reportType: value })
                  }
                >
                  <SelectTrigger id="scheduled-report-type">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={config.frequency}
                    onValueChange={(value) =>
                      setConfig({ ...config, frequency: value })
                    }
                  >
                    <SelectTrigger id="frequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencies.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduled-format">Format</Label>
                  <Select
                    value={config.format}
                    onValueChange={(value) =>
                      setConfig({ ...config, format: value })
                    }
                  >
                    <SelectTrigger id="scheduled-format">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      {formats.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipient">Email Recipients</Label>
                <div className="flex gap-2">
                  <Input
                    id="recipient"
                    type="email"
                    placeholder="Enter email address"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addRecipient()}
                  />
                  <Button onClick={addRecipient} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {config.recipients.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {config.recipients.map((email) => (
                      <Badge key={email} variant="secondary" className="gap-1">
                        {email}
                        <button
                          onClick={() => removeRecipient(email)}
                          className="ml-1 hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={handleScheduleReport}
                disabled={config.recipients.length === 0}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Schedule Report
              </Button>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Report Scheduling Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Daily reports are generated at 6:00 AM local time</li>
                <li>• Weekly reports are sent every Monday</li>
                <li>
                  • Monthly reports are generated on the 1st of each month
                </li>
                <li>• Quarterly reports align with calendar quarters</li>
                <li>• Annual reports are generated on January 1st</li>
                <li>
                  • All reports are automatically emailed to specified
                  recipients
                </li>
                <li>
                  • Reports can be managed from the scheduled reports list
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
