"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Calculator } from "lucide-react";
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

export default function CreateCAPAPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "CORRECTIVE",
    source: "NCR",
    sourceId: "",
    description: "",
    severity: 5,
    occurrence: 5,
    detection: 5,
    rootCause: "",
    correctiveAction: "",
    preventiveAction: "",
    responsiblePerson: "",
    targetDate: "",
    verificationMethod: "PROCESS_AUDIT",
  });

  // Calculate RPN
  const rpn = formData.severity * formData.occurrence * formData.detection;

  const getRPNColor = (value: number) => {
    if (value >= 125) return "text-red-600 bg-red-50";
    if (value >= 50) return "text-orange-600 bg-orange-50";
    return "text-green-600 bg-green-50";
  };

  const getRPNLabel = (value: number) => {
    if (value >= 125) return "High Risk - Immediate Action Required";
    if (value >= 50) return "Medium Risk - Action Needed";
    return "Low Risk - Monitor";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/qc/capa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          rpn,
          targetDate: new Date(formData.targetDate),
        }),
      });

      if (!response.ok) throw new Error("Failed to create CAPA");

      const data = await response.json();
      router.push(`/dashboard/qc/capa/${data.id}`);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to create CAPA");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create CAPA</h1>
          <p className="text-muted-foreground">
            Corrective and Preventive Action with Risk Analysis
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Brief description of the action"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
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
                      <SelectItem value="CORRECTIVE">Corrective</SelectItem>
                      <SelectItem value="PREVENTIVE">Preventive</SelectItem>
                      <SelectItem value="BOTH">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source">Source *</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(value) =>
                      setFormData({ ...formData, source: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NCR">NCR</SelectItem>
                      <SelectItem value="AUDIT">Audit Finding</SelectItem>
                      <SelectItem value="COMPLAINT">
                        Customer Complaint
                      </SelectItem>
                      <SelectItem value="IMPROVEMENT">
                        Continuous Improvement
                      </SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sourceId">Source Reference</Label>
                  <Input
                    id="sourceId"
                    value={formData.sourceId}
                    onChange={(e) =>
                      setFormData({ ...formData, sourceId: e.target.value })
                    }
                    placeholder="NCR ID, Audit ID, etc."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Problem Description *</Label>
                <Textarea
                  id="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Detailed description of the problem..."
                />
              </div>
            </CardContent>
          </Card>

          {/* RPN Calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Risk Priority Number (RPN) Calculator
              </CardTitle>
              <CardDescription>
                Rate Severity, Occurrence, and Detection (1-10 scale)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Severity */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="severity">Severity (Impact)</Label>
                  <Badge variant="outline">{formData.severity}</Badge>
                </div>
                <input
                  id="severity"
                  type="range"
                  min="1"
                  max="10"
                  value={formData.severity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      severity: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  1 = Minor inconvenience | 10 = Hazardous without warning
                </p>
              </div>

              {/* Occurrence */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="occurrence">Occurrence (Frequency)</Label>
                  <Badge variant="outline">{formData.occurrence}</Badge>
                </div>
                <input
                  id="occurrence"
                  type="range"
                  min="1"
                  max="10"
                  value={formData.occurrence}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      occurrence: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  1 = Nearly never (1 in 1,500,000) | 10 = Very high (≥1 in 2)
                </p>
              </div>

              {/* Detection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="detection">
                    Detection (Likelihood to Detect)
                  </Label>
                  <Badge variant="outline">{formData.detection}</Badge>
                </div>
                <input
                  id="detection"
                  type="range"
                  min="1"
                  max="10"
                  value={formData.detection}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      detection: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  1 = Almost certain to detect | 10 = Absolute uncertainty
                </p>
              </div>

              {/* RPN Result */}
              <Alert className={getRPNColor(rpn)}>
                <AlertDescription className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">RPN = {rpn}</div>
                    <div className="text-sm">{getRPNLabel(rpn)}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formData.severity} × {formData.occurrence} ×{" "}
                    {formData.detection}
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Root Cause & Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Root Cause & Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rootCause">Root Cause Analysis *</Label>
                <Textarea
                  id="rootCause"
                  required
                  rows={3}
                  value={formData.rootCause}
                  onChange={(e) =>
                    setFormData({ ...formData, rootCause: e.target.value })
                  }
                  placeholder="Use 5 Whys or Fishbone diagram..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="correctiveAction">Corrective Action *</Label>
                <Textarea
                  id="correctiveAction"
                  required
                  rows={3}
                  value={formData.correctiveAction}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      correctiveAction: e.target.value,
                    })
                  }
                  placeholder="Immediate actions to fix the problem..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preventiveAction">Preventive Action</Label>
                <Textarea
                  id="preventiveAction"
                  rows={3}
                  value={formData.preventiveAction}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preventiveAction: e.target.value,
                    })
                  }
                  placeholder="Long-term actions to prevent recurrence..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Assignment & Verification */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment & Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="responsiblePerson">
                    Responsible Person *
                  </Label>
                  <Input
                    id="responsiblePerson"
                    required
                    value={formData.responsiblePerson}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        responsiblePerson: e.target.value,
                      })
                    }
                    placeholder="Person responsible for completion"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetDate">Target Completion Date *</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    required
                    value={formData.targetDate}
                    onChange={(e) =>
                      setFormData({ ...formData, targetDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verificationMethod">
                  Verification Method *
                </Label>
                <Select
                  value={formData.verificationMethod}
                  onValueChange={(value) =>
                    setFormData({ ...formData, verificationMethod: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROCESS_AUDIT">Process Audit</SelectItem>
                    <SelectItem value="INSPECTION">
                      Inspection/Testing
                    </SelectItem>
                    <SelectItem value="DATA_ANALYSIS">Data Analysis</SelectItem>
                    <SelectItem value="DOCUMENTATION_REVIEW">
                      Documentation Review
                    </SelectItem>
                    <SelectItem value="CUSTOMER_FEEDBACK">
                      Customer Feedback
                    </SelectItem>
                    <SelectItem value="COMBINATION">Combination</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
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
              {loading ? "Creating..." : "Create CAPA"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
