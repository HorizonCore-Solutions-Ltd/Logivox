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
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface FailureMode {
  id: string;
  processStep: string;
  failureMode: string;
  effects: string;
  causes: string;
  controls: string;
  severity: number;
  occurrence: number;
  detection: number;
  rpn: number;
  actions: string;
  responsible: string;
}

export default function CreateFMEA() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [scope, setScope] = useState("");
  const [teamLead, setTeamLead] = useState("");
  const [teamMembers, setTeamMembers] = useState("");

  const [failureModes, setFailureModes] = useState<FailureMode[]>([]);
  const [currentMode, setCurrentMode] = useState<Partial<FailureMode>>({
    severity: 5,
    occurrence: 5,
    detection: 5,
  });

  const calculateRPN = (s: number, o: number, d: number) => s * o * d;

  const addFailureMode = () => {
    if (!currentMode.processStep || !currentMode.failureMode) return;

    const rpn = calculateRPN(
      currentMode.severity || 5,
      currentMode.occurrence || 5,
      currentMode.detection || 5,
    );

    const newMode: FailureMode = {
      id: Date.now().toString(),
      processStep: currentMode.processStep || "",
      failureMode: currentMode.failureMode || "",
      effects: currentMode.effects || "",
      causes: currentMode.causes || "",
      controls: currentMode.controls || "",
      severity: currentMode.severity || 5,
      occurrence: currentMode.occurrence || 5,
      detection: currentMode.detection || 5,
      rpn,
      actions: currentMode.actions || "",
      responsible: currentMode.responsible || "",
    };

    setFailureModes([...failureModes, newMode]);
    setCurrentMode({ severity: 5, occurrence: 5, detection: 5 });
  };

  const removeFailureMode = (id: string) => {
    setFailureModes(failureModes.filter((m) => m.id !== id));
  };

  const getRPNColor = (rpn: number) => {
    if (rpn >= 200) return "bg-red-100 text-red-800";
    if (rpn >= 125) return "bg-orange-100 text-orange-800";
    if (rpn >= 50) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/qc/fmea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          type,
          scope,
          teamLead,
          teamMembers: teamMembers.split(",").map((m) => m.trim()),
          failureModes,
          organizationId: "org-1",
          createdBy: "current-user",
        }),
      });

      if (!response.ok) throw new Error("Failed to create FMEA");

      const result = await response.json();
      router.push(`/dashboard/qc/fmea/${result.data.id}`);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">New FMEA</h1>
          <p className="text-muted-foreground">
            Failure Mode and Effects Analysis
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* FMEA Header */}
        <Card>
          <CardHeader>
            <CardTitle>FMEA Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>FMEA Title *</Label>
              <Input
                placeholder="e.g., Receiving Inspection Process FMEA"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>FMEA Type *</Label>
                <Select value={type} onValueChange={setType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROCESS_FMEA">Process FMEA</SelectItem>
                    <SelectItem value="DESIGN_FMEA">Design FMEA</SelectItem>
                    <SelectItem value="SYSTEM_FMEA">System FMEA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Team Lead *</Label>
                <Input
                  placeholder="FMEA team leader"
                  value={teamLead}
                  onChange={(e) => setTeamLead(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Scope *</Label>
              <Textarea
                placeholder="Describe the scope of this FMEA..."
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                required
                rows={2}
              />
            </div>

            <div>
              <Label>Team Members</Label>
              <Input
                placeholder="Comma-separated list of team members"
                value={teamMembers}
                onChange={(e) => setTeamMembers(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Add Failure Mode */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Add Failure Mode</CardTitle>
            <CardDescription>
              Identify potential failure modes and assess risks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Process Step</Label>
                <Input
                  placeholder="e.g., Visual inspection"
                  value={currentMode.processStep || ""}
                  onChange={(e) =>
                    setCurrentMode({
                      ...currentMode,
                      processStep: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label>Failure Mode</Label>
                <Input
                  placeholder="How could it fail?"
                  value={currentMode.failureMode || ""}
                  onChange={(e) =>
                    setCurrentMode({
                      ...currentMode,
                      failureMode: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label>Effects of Failure</Label>
              <Textarea
                placeholder="What happens if it fails?"
                value={currentMode.effects || ""}
                onChange={(e) =>
                  setCurrentMode({ ...currentMode, effects: e.target.value })
                }
                rows={2}
              />
            </div>

            <div>
              <Label>Potential Causes</Label>
              <Textarea
                placeholder="What could cause this failure?"
                value={currentMode.causes || ""}
                onChange={(e) =>
                  setCurrentMode({ ...currentMode, causes: e.target.value })
                }
                rows={2}
              />
            </div>

            <div>
              <Label>Current Controls</Label>
              <Textarea
                placeholder="What controls are currently in place?"
                value={currentMode.controls || ""}
                onChange={(e) =>
                  setCurrentMode({ ...currentMode, controls: e.target.value })
                }
                rows={2}
              />
            </div>

            {/* RPN Calculator */}
            <div className="border p-4 rounded-lg bg-gray-50">
              <h4 className="font-semibold mb-4">
                Risk Assessment (RPN Calculator)
              </h4>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Severity (S)</Label>
                    <span className="font-bold">{currentMode.severity}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={currentMode.severity || 5}
                    onChange={(e) =>
                      setCurrentMode({
                        ...currentMode,
                        severity: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Occurrence (O)</Label>
                    <span className="font-bold">{currentMode.occurrence}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={currentMode.occurrence || 5}
                    onChange={(e) =>
                      setCurrentMode({
                        ...currentMode,
                        occurrence: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Detection (D)</Label>
                    <span className="font-bold">{currentMode.detection}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={currentMode.detection || 5}
                    onChange={(e) =>
                      setCurrentMode({
                        ...currentMode,
                        detection: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                </div>

                <div className="pt-4 border-t">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Risk Priority Number (RPN)
                    </p>
                    <div className="text-4xl font-bold my-2">
                      {calculateRPN(
                        currentMode.severity || 5,
                        currentMode.occurrence || 5,
                        currentMode.detection || 5,
                      )}
                    </div>
                    <p className="text-xs">
                      {currentMode.severity} × {currentMode.occurrence} ×{" "}
                      {currentMode.detection}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Recommended Actions</Label>
                <Textarea
                  placeholder="What should be done?"
                  value={currentMode.actions || ""}
                  onChange={(e) =>
                    setCurrentMode({ ...currentMode, actions: e.target.value })
                  }
                  rows={2}
                />
              </div>

              <div>
                <Label>Responsible Person</Label>
                <Input
                  placeholder="Who is responsible?"
                  value={currentMode.responsible || ""}
                  onChange={(e) =>
                    setCurrentMode({
                      ...currentMode,
                      responsible: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <Button type="button" onClick={addFailureMode} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add This Failure Mode
            </Button>
          </CardContent>
        </Card>

        {/* Failure Modes List */}
        {failureModes.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Failure Modes ({failureModes.length})</CardTitle>
              <CardDescription>All identified failure modes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {failureModes
                  .sort((a, b) => b.rpn - a.rpn)
                  .map((mode) => (
                    <div
                      key={mode.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Badge className={getRPNColor(mode.rpn)}>
                            RPN: {mode.rpn}
                          </Badge>
                          <span className="font-medium">
                            {mode.processStep}
                          </span>
                        </div>
                        <p className="text-sm">{mode.failureMode}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          S:{mode.severity} O:{mode.occurrence} D:
                          {mode.detection}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFailureMode(mode.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        <div className="flex justify-end space-x-3 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || failureModes.length === 0}>
            {loading ? (
              "Saving..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create FMEA
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
