"use client";

import { useState } from "react";
import { Scan, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  placeholder?: string;
  label?: string;
}

export function BarcodeScanner({
  onScan,
  placeholder = "Scan or enter barcode",
  label = "Barcode",
}: BarcodeScannerProps) {
  const [manualCode, setManualCode] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode("");
    }
  };

  const startScanner = async () => {
    setShowScanner(true);
    setScanning(true);

    try {
      // In a real implementation, this would use:
      // - @zxing/browser for web
      // - react-native-camera for React Native
      // - @capacitor/barcode-scanner for Capacitor

      // Simulate scanner for demo
      setTimeout(() => {
        const mockCode = "1234567890123";
        onScan(mockCode);
        setShowScanner(false);
        setScanning(false);
      }, 2000);
    } catch (error) {
      console.error("Scanner error:", error);
      setScanning(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>

      <div className="flex gap-2">
        <form onSubmit={handleManualSubmit} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={placeholder}
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={startScanner}
        >
          <Scan className="h-4 w-4" />
        </Button>
      </div>

      {/* Scanner Modal */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scan Barcode</DialogTitle>
            <DialogDescription>
              Position the barcode within the camera view
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <div className="relative h-64 w-full rounded-lg border-4 border-primary bg-muted">
              {scanning ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <Scan className="mx-auto mb-4 h-16 w-16 animate-pulse text-primary" />
                    <p className="text-sm text-muted-foreground">Scanning...</p>
                  </div>
                </div>
              ) : (
                <video
                  className="h-full w-full object-cover"
                  autoPlay
                  playsInline
                />
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setShowScanner(false);
                setScanning(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
