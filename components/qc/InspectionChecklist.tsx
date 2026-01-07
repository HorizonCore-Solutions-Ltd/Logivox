"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  type: "checkbox" | "text" | "number" | "measurement";
  value?: any;
  passed?: boolean;
  notes?: string;
  unit?: string;
}

interface InspectionChecklistProps {
  checklistData: ChecklistItem[];
  onChange: (data: ChecklistItem[]) => void;
  readOnly?: boolean;
}

export default function InspectionChecklist({
  checklistData,
  onChange,
  readOnly = false,
}: InspectionChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>(checklistData);

  const updateItem = (index: number, updates: Partial<ChecklistItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    setItems(newItems);
    onChange(newItems);
  };

  const getCompletionStats = () => {
    const total = items.filter((item) => item.required).length;
    const completed = items.filter(
      (item) => item.required && item.passed !== undefined,
    ).length;
    const passed = items.filter(
      (item) => item.required && item.passed === true,
    ).length;
    return { total, completed, passed };
  };

  const stats = getCompletionStats();
  const completionRate =
    stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Checklist Progress</span>
            <span className="text-sm font-medium">
              {stats.completed} / {stats.total}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>{stats.passed} Passed</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="w-4 h-4 text-red-600" />
              <span>{stats.completed - stats.passed} Failed</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-gray-400" />
              <span>{stats.total - stats.completed} Pending</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist Items */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <Card
            key={item.id}
            className={item.passed === false ? "border-red-300" : ""}
          >
            <CardContent className="pt-4">
              <div className="flex items-start gap-4">
                {/* Status Icon */}
                <div className="mt-1">
                  {item.passed === true && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  {item.passed === false && (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  {item.passed === undefined && (
                    <AlertCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">
                      {item.label}
                      {item.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                  </div>

                  {/* Input based on type */}
                  {item.type === "checkbox" && !readOnly && (
                    <div className="flex gap-4">
                      <button
                        onClick={() => updateItem(index, { passed: true })}
                        className={`px-4 py-2 rounded border ${
                          item.passed === true
                            ? "bg-green-500 text-white border-green-500"
                            : "border-gray-300"
                        }`}
                      >
                        Pass
                      </button>
                      <button
                        onClick={() => updateItem(index, { passed: false })}
                        className={`px-4 py-2 rounded border ${
                          item.passed === false
                            ? "bg-red-500 text-white border-red-500"
                            : "border-gray-300"
                        }`}
                      >
                        Fail
                      </button>
                    </div>
                  )}

                  {item.type === "text" && !readOnly && (
                    <Input
                      value={item.value || ""}
                      onChange={(e) =>
                        updateItem(index, { value: e.target.value })
                      }
                      placeholder="Enter value..."
                    />
                  )}

                  {item.type === "number" && !readOnly && (
                    <Input
                      type="number"
                      value={item.value || ""}
                      onChange={(e) =>
                        updateItem(index, { value: parseFloat(e.target.value) })
                      }
                      placeholder="Enter numeric value..."
                    />
                  )}

                  {item.type === "measurement" && !readOnly && (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={item.value || ""}
                        onChange={(e) =>
                          updateItem(index, {
                            value: parseFloat(e.target.value),
                          })
                        }
                        placeholder="Measurement..."
                        className="flex-1"
                      />
                      <span className="flex items-center px-3 bg-gray-100 rounded border">
                        {item.unit || "unit"}
                      </span>
                    </div>
                  )}

                  {/* Read-only display */}
                  {readOnly && (
                    <div className="text-sm">
                      {item.type === "checkbox" && (
                        <span
                          className={
                            item.passed ? "text-green-600" : "text-red-600"
                          }
                        >
                          {item.passed ? "PASSED" : "FAILED"}
                        </span>
                      )}
                      {item.type !== "checkbox" && (
                        <span className="font-medium">
                          {item.value} {item.unit || ""}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {!readOnly && (
                    <Textarea
                      value={item.notes || ""}
                      onChange={(e) =>
                        updateItem(index, { notes: e.target.value })
                      }
                      placeholder="Add notes (optional)..."
                      rows={2}
                      className="text-sm"
                    />
                  )}

                  {readOnly && item.notes && (
                    <div className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                      {item.notes}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
