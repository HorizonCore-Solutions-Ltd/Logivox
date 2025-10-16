"use client"

import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Download, FileSpreadsheet, AlertCircle } from "lucide-react"

interface BulkImportExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "import" | "export"
  onSuccess?: () => void
}

export function BulkImportExportDialog({
  open,
  onOpenChange,
  mode,
  onSuccess,
}: BulkImportExportDialogProps) {
  const { toast } = useToast()
  const [file, setFile] = React.useState<File | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/inventory/export")
      if (!res.ok) throw new Error("Failed to export inventory")
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `inventory-export-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      return true
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Inventory exported successfully",
      })
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/inventory/import", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "Failed to import inventory")
      }

      return res.json()
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Imported ${data.imported} items successfully${
          data.failed > 0 ? `. ${data.failed} items failed.` : ""
        }`,
      })
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleImport = () => {
    if (file) {
      importMutation.mutate(file)
    }
  }

  const handleExport = () => {
    exportMutation.mutate()
  }

  const downloadTemplate = () => {
    const template = `name,sku,description,barcode,quantity,minStockLevel,reorderPoint,costPrice,sellingPrice,unit,warehouseId,categoryId
Sample Item,SKU-001,Sample description,123456789,100,10,20,10.00,15.00,pcs,,
Another Item,SKU-002,Another description,987654321,50,5,10,20.00,30.00,kg,,`

    const blob = new Blob([template], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "inventory-template.csv"
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    toast({
      title: "Template Downloaded",
      description: "Use this template to prepare your inventory data",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "import" ? "Import Inventory" : "Export Inventory"}
          </DialogTitle>
          <DialogDescription>
            {mode === "import"
              ? "Upload a CSV file to import inventory items in bulk"
              : "Download all inventory items as a CSV file"}
          </DialogDescription>
        </DialogHeader>

        {mode === "import" ? (
          <div className="space-y-4">
            {/* Template Download */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Need a template?</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Download our CSV template to ensure proper formatting
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="px-0 h-auto mt-2"
                    onClick={downloadTemplate}
                  >
                    <Download className="mr-2 h-3 w-3" />
                    Download Template
                  </Button>
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file">Upload CSV File</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="file"
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={importMutation.isPending}
                />
                {file && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFile(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ""
                      }
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
              {file && (
                <p className="text-xs text-muted-foreground">
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            {/* Format Instructions */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">CSV Format Requirements:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Required fields: name, sku, quantity, unit</li>
                <li>Use warehouse/category IDs (not names)</li>
                <li>Numeric fields: quantity, prices must be numbers</li>
                <li>First row should be column headers</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-6 border-2 border-dashed rounded-lg text-center">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Export Inventory to CSV</p>
              <p className="text-xs text-muted-foreground mt-1">
                All inventory items will be exported with their details
              </p>
            </div>

            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Export includes:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>All item details (SKU, name, description, barcode)</li>
                <li>Stock quantities and pricing</li>
                <li>Warehouse and category information</li>
                <li>Stock status and levels</li>
              </ul>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={importMutation.isPending || exportMutation.isPending}
          >
            Cancel
          </Button>
          {mode === "import" ? (
            <Button
              onClick={handleImport}
              disabled={!file || importMutation.isPending}
            >
              {importMutation.isPending ? (
                <>Importing...</>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleExport}
              disabled={exportMutation.isPending}
            >
              {exportMutation.isPending ? (
                <>Exporting...</>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
