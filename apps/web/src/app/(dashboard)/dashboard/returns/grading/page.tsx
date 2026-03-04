"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Loader2, ShieldCheck, Truck, RotateCcw, AlertTriangle } from "lucide-react";

export default function ReturnsGradingPage() {
  const [rma, setRma] = useState("");
  const [item, setItem] = useState("");
  const [grade, setGrade] = useState("A");
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState<any>(null);

  const processGrading = async () => {
    setLoading(true);
    try {
      // Calling the Brain's Disposition Logic
      const res = await fetch("/api/returns/process-disposition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rmaNumber: rma,
          sku: item,
          grade: grade, // A, B, C, D
          notes: "Graded via Returns Dashboard",
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process");

      setDecision(data.decision); // e.g. { action: "RESTOCK", credit: true }
      toast({
        title: "Disposition Complete",
        description: `Item routed to: ${data.decision?.action || "Review"}`,
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Wait", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Returns Grading Station</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Scan Item & Assess Condition</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="rma">RMA Number (Scan Barcode)</Label>
            <Input 
              id="rma" 
              placeholder="RMA-2024-..." 
              value={rma} 
              onChange={(e) => setRma(e.target.value)} 
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sku">Item SKU / UPC</Label>
            <Input 
              id="sku" 
              placeholder="Scan Product..." 
              value={item} 
              onChange={(e) => setItem(e.target.value)} 
            />
          </div>

          <div className="grid gap-2">
            <Label>Condition Grade</Label>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant={grade === "A" ? "default" : "outline"}
                className={`h-24 flex flex-col items-center justify-center ${grade === "A" ? "bg-green-600 hover:bg-green-700" : ""}`}
                onClick={() => setGrade("A")}
              >
                <div className="text-2xl font-bold">Grade A</div>
                <div className="text-xs mt-1">New / Unopened</div>
              </Button>
              <Button 
                variant={grade === "B" ? "default" : "outline"}
                className={`h-24 flex flex-col items-center justify-center ${grade === "B" ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                onClick={() => setGrade("B")}
              >
                <div className="text-2xl font-bold">Grade B</div>
                <div className="text-xs mt-1">Open Box / Good</div>
              </Button>
              <Button 
                variant={grade === "C" ? "default" : "outline"}
                className={`h-24 flex flex-col items-center justify-center ${grade === "C" ? "bg-orange-500 hover:bg-orange-600" : ""}`}
                onClick={() => setGrade("C")}
              >
                 <div className="text-2xl font-bold">Grade C</div>
                 <div className="text-xs mt-1">Damaged / Repair</div>
              </Button>
              <Button 
                variant={grade === "D" ? "default" : "outline"}
                className={`h-24 flex flex-col items-center justify-center ${grade === "D" ? "bg-red-600 hover:bg-red-700" : ""}`}
                onClick={() => setGrade("D")}
              >
                 <div className="text-2xl font-bold">Grade D</div>
                 <div className="text-xs mt-1">Scrap / Recycle</div>
              </Button>
            </div>
          </div>

          <Button 
            className="w-full h-12 text-lg mt-4" 
            onClick={processGrading}
            disabled={loading || !rma || !item}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Disposition"}
          </Button>
        </CardContent>
      </Card>

      {decision && (
        <Card className="mt-8 border-2 border-primary animate-in fade-in slide-in-from-bottom-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              Brain Decision
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center">
                    {decision.action === "RESTOCK" ? <RotateCcw className="h-6 w-6 text-primary" /> : 
                     decision.action === "REFURB" ? <Truck className="h-6 w-6 text-orange-500" /> :
                     <AlertTriangle className="h-6 w-6 text-red-500" />
                    }
                </div>
                <div>
                    <div className="font-bold text-lg">{decision.action}</div>
                    <div className="text-sm text-gray-500">{decision.reason || "Automatic routing based on Grade & SKU value."}</div>
                </div>
            </div>
            
            {decision.creditIssued && (
                <div className="flex items-center gap-2 text-green-600 font-medium">
                    <ShieldCheck className="h-4 w-4" />
                    Instant Credit Approved
                </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
