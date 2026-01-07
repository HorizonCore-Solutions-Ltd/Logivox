"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Hash,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface SerialNumber {
  serialNumber: string;
  status: "SUCCESS" | "ERROR" | "DUPLICATE";
  message?: string;
}

export default function SerialNumberBulkPage() {
  const [serialNumbers, setSerialNumbers] = useState("");
  const [results, setResults] = useState<SerialNumber[]>([]);
  const [processing, setProcessing] = useState(false);
  const [operation, setOperation] = useState<"CREATE" | "UPDATE" | "DELETE">(
    "CREATE",
  );

  const processSerialNumbers = async () => {
    setProcessing(true);
    setResults([]);

    try {
      const lines = serialNumbers.split("\n").filter((line) => line.trim());
      const response = await fetch("/api/serial-numbers/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation,
          serialNumbers: lines,
        }),
      });

      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error("Error processing serial numbers:", error);
    } finally {
      setProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const template = "SN001\nSN002\nSN003\n";
    const blob = new Blob([template], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "serial-numbers-template.txt";
    a.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setSerialNumbers(text);
    };
    reader.readAsText(file);
  };

  const stats = {
    total: results.length,
    success: results.filter((r) => r.status === "SUCCESS").length,
    errors: results.filter((r) => r.status === "ERROR").length,
    duplicates: results.filter((r) => r.status === "DUPLICATE").length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Serial Number Bulk Operations</h1>
        <p className="text-muted-foreground mt-1">
          Import, update, or delete serial numbers in bulk
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Serial Numbers Input
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <select
                value={operation}
                onChange={(e) => setOperation(e.target.value as any)}
                className="px-4 py-2 border rounded-md"
              >
                <option value="CREATE">Create New</option>
                <option value="UPDATE">Update Existing</option>
                <option value="DELETE">Delete</option>
              </select>

              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Template
              </Button>

              <label className="flex-1">
                <Button variant="outline" className="w-full gap-2" asChild>
                  <span>
                    <Upload className="h-4 w-4" />
                    Upload File
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <Textarea
              placeholder="Enter serial numbers (one per line)&#10;SN001&#10;SN002&#10;SN003"
              value={serialNumbers}
              onChange={(e) => setSerialNumbers(e.target.value)}
              rows={15}
              className="font-mono"
            />

            <Button
              onClick={processSerialNumbers}
              disabled={!serialNumbers.trim() || processing}
              className="w-full gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Process{" "}
                  {serialNumbers.split("\n").filter((l) => l.trim()).length}{" "}
                  Serial Numbers
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Hash className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No results yet</p>
                <p className="text-sm mt-1">
                  Process serial numbers to see results
                </p>
              </div>
            ) : (
              <>
                {/* Stats */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-green-50">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.success}
                    </div>
                    <div className="text-xs text-muted-foreground">Success</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-red-50">
                    <div className="text-2xl font-bold text-red-600">
                      {stats.errors}
                    </div>
                    <div className="text-xs text-muted-foreground">Errors</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-yellow-50">
                    <div className="text-2xl font-bold text-yellow-600">
                      {stats.duplicates}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Duplicates
                    </div>
                  </div>
                </div>

                {/* Results List */}
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`
                        p-3 rounded-lg border-l-4 flex items-start justify-between
                        ${result.status === "SUCCESS" ? "border-green-500 bg-green-50" : ""}
                        ${result.status === "ERROR" ? "border-red-500 bg-red-50" : ""}
                        ${result.status === "DUPLICATE" ? "border-yellow-500 bg-yellow-50" : ""}
                      `}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        {result.status === "SUCCESS" && (
                          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        )}
                        {result.status !== "SUCCESS" && (
                          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="font-mono font-medium">
                            {result.serialNumber}
                          </div>
                          {result.message && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {result.message}
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge
                        className={`
                          ${result.status === "SUCCESS" ? "bg-green-100 text-green-800" : ""}
                          ${result.status === "ERROR" ? "bg-red-100 text-red-800" : ""}
                          ${result.status === "DUPLICATE" ? "bg-yellow-100 text-yellow-800" : ""}
                        `}
                      >
                        {result.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <div className="font-medium mb-1">Format:</div>
              <p className="text-muted-foreground">
                Enter one serial number per line. Serial numbers can contain
                letters, numbers, and hyphens.
              </p>
            </div>
            <div>
              <div className="font-medium mb-1">Operations:</div>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>
                  <strong>Create New:</strong> Add new serial numbers to the
                  system
                </li>
                <li>
                  <strong>Update Existing:</strong> Update information for
                  existing serial numbers
                </li>
                <li>
                  <strong>Delete:</strong> Remove serial numbers from the system
                </li>
              </ul>
            </div>
            <div>
              <div className="font-medium mb-1">File Upload:</div>
              <p className="text-muted-foreground">
                Upload a .txt or .csv file with serial numbers. Each serial
                number should be on a new line.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
