"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle,
  AlertTriangle,
  Loader2,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ImportInventoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please choose a CSV file.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/inventory/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Import failed");
      }

      setResult(data);
      toast({
        title: "Import Complete",
        description: `Successfully imported ${data.imported} items.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers =
      "name,sku,quantity,unit,price,cost,description,binLocation,minStock,maxStock";
    const example =
      "Example Product,PROD-001,100,EA,19.99,10.00,Sample item description,A-01-01,10,200";
    const csvContent =
      "data:text/csv;charset=utf-8," + headers + "\n" + example;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventory_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Upload className="h-8 w-8 text-primary" />
          Import Inventory
        </h1>
        <p className="text-muted-foreground mt-2">
          Bulk upload inventory items using a CSV file. This is the fastest way
          to migrate your data.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Download the CSV template.</li>
              <li>Fill in your inventory data.</li>
              <li>
                Required columns: <strong>name, sku, quantity, unit</strong>.
              </li>
              <li>
                Optional columns: price, cost, description, binLocation,
                minStock, maxStock.
              </li>
              <li>Save as .csv and upload below.</li>
            </ol>
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" /> Download Template
            </Button>
          </CardContent>
        </Card>

        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Upload File
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Input
                  id="csv"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!file || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" /> Start Import
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Import Summary</CardTitle>
            <CardDescription>Results of your recent upload.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
                <span className="text-2xl font-bold text-green-700">
                  {result.imported}
                </span>
                <span className="text-sm text-green-600">
                  Successfully Imported
                </span>
              </div>
              <div className="bg-red-50 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                <AlertTriangle className="h-8 w-8 text-red-600 mb-2" />
                <span className="text-2xl font-bold text-red-700">
                  {result.failed}
                </span>
                <span className="text-sm text-red-600">Failed / Errors</span>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="mt-4 border rounded-md p-4 bg-muted/50 max-h-60 overflow-y-auto">
                <h4 className="font-semibold mb-2 text-sm">Error Log:</h4>
                <ul className="list-disc list-inside text-sm text-destructive space-y-1">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/inventory")}
              >
                View Inventory
              </Button>
              <Button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                }}
              >
                Import Another File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
