"use client";

import { useState } from "react";
import { Scan, CheckCircle2, XCircle, Camera, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { PhotoUpload } from "@/components/qc/PhotoUpload";
import { SignatureCapture } from "@/components/qc/SignatureCapture";

export default function MobileInspectionPage() {
  const [step, setStep] = useState<"scan" | "inspect" | "record" | "complete">(
    "scan",
  );
  const [lotNumber, setLotNumber] = useState("");
  const [inspectionData, setInspectionData] = useState({
    result: "",
    defects: 0,
    sampleSize: 0,
    photos: [] as string[],
    notes: "",
    signature: "",
  });

  const handleScan = (code: string) => {
    setLotNumber(code);
    setStep("inspect");
  };

  const handleInspectionResult = (result: "PASS" | "FAIL") => {
    setInspectionData({ ...inspectionData, result });
    setStep("record");
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch("/api/qc/mobile/inspection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lotNumber,
          ...inspectionData,
        }),
      });

      if (response.ok) {
        setStep("complete");
        setTimeout(() => {
          setStep("scan");
          setLotNumber("");
          setInspectionData({
            result: "",
            defects: 0,
            sampleSize: 0,
            photos: [],
            notes: "",
            signature: "",
          });
        }, 3000);
      }
    } catch (error) {
      alert("Failed to submit inspection");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
        <h1 className="text-2xl font-bold">Mobile QC Inspection</h1>
        <p className="text-blue-100">Quick receiving and quality checks</p>
      </Card>

      {/* Step: Scan */}
      {step === "scan" && (
        <Card className="p-6">
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-blue-50">
              <Scan className="h-16 w-16 text-blue-600" />
            </div>

            <div>
              <h2 className="text-xl font-semibold">Scan Lot Number</h2>
              <p className="text-sm text-muted-foreground">
                Scan barcode or QR code to begin inspection
              </p>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={() => handleScan("LOT-" + Date.now())}
            >
              <Scan className="mr-2 h-5 w-5" />
              Scan Barcode
            </Button>

            <div className="text-sm text-muted-foreground">
              or enter manually
            </div>

            <Input
              placeholder="Enter lot number"
              value={lotNumber}
              onChange={(e) => setLotNumber(e.target.value)}
              className="text-center text-lg"
            />

            {lotNumber && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setStep("inspect")}
              >
                Continue
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Step: Inspect */}
      {step === "inspect" && (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Inspecting</div>
                <div className="text-lg font-bold">{lotNumber}</div>
              </div>
              <Badge>In Progress</Badge>
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label>Sample Size</Label>
                <Input
                  type="number"
                  value={inspectionData.sampleSize}
                  onChange={(e) =>
                    setInspectionData({
                      ...inspectionData,
                      sampleSize: parseInt(e.target.value),
                    })
                  }
                  placeholder="Number of units inspected"
                />
              </div>

              <div>
                <Label>Defects Found</Label>
                <Input
                  type="number"
                  value={inspectionData.defects}
                  onChange={(e) =>
                    setInspectionData({
                      ...inspectionData,
                      defects: parseInt(e.target.value),
                    })
                  }
                  placeholder="Number of defective units"
                />
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Button
              size="lg"
              variant="outline"
              className="h-32 flex-col gap-2 border-green-500 bg-green-50 hover:bg-green-100"
              onClick={() => handleInspectionResult("PASS")}
            >
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <span className="text-lg font-semibold text-green-700">PASS</span>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-32 flex-col gap-2 border-red-500 bg-red-50 hover:bg-red-100"
              onClick={() => handleInspectionResult("FAIL")}
            >
              <XCircle className="h-12 w-12 text-red-600" />
              <span className="text-lg font-semibold text-red-700">FAIL</span>
            </Button>
          </div>
        </div>
      )}

      {/* Step: Record Details */}
      {step === "record" && (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Recording</div>
                <div className="text-lg font-bold">{lotNumber}</div>
              </div>
              <Badge
                variant={
                  inspectionData.result === "PASS" ? "default" : "destructive"
                }
              >
                {inspectionData.result}
              </Badge>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <PhotoUpload
              value={inspectionData.photos}
              onChange={(photos) =>
                setInspectionData({ ...inspectionData, photos })
              }
              maxPhotos={5}
              label="Evidence Photos"
            />
          </Card>

          <Card className="p-6 space-y-4">
            <div>
              <Label>Inspector Notes</Label>
              <Textarea
                rows={4}
                value={inspectionData.notes}
                onChange={(e) =>
                  setInspectionData({
                    ...inspectionData,
                    notes: e.target.value,
                  })
                }
                placeholder="Observations, defects found, etc..."
              />
            </div>
          </Card>

          <Card className="p-6">
            <SignatureCapture
              value={inspectionData.signature}
              onChange={(signature) =>
                setInspectionData({ ...inspectionData, signature })
              }
              label="Inspector Signature"
              required
            />
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={() => setStep("inspect")}>
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={!inspectionData.signature}>
              <FileText className="mr-2 h-4 w-4" />
              Submit
            </Button>
          </div>
        </div>
      )}

      {/* Step: Complete */}
      {step === "complete" && (
        <Card className="p-6">
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-green-700">
                Inspection Recorded
              </h2>
              <p className="text-sm text-muted-foreground">
                Lot {lotNumber} has been successfully inspected
              </p>
            </div>

            <div className="text-sm">Redirecting to next inspection...</div>
          </div>
        </Card>
      )}
    </div>
  );
}
