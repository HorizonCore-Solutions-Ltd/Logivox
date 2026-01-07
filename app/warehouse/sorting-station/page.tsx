"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  ScanIcon,
  PackageIcon,
  TruckIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  TimerIcon,
} from "lucide-react";

interface Allocation {
  id: string;
  receiptItem: {
    id: string;
    sku: string;
    productName: string;
    receipt: {
      receiptNumber: string;
      carrier: string;
    };
    inventory: {
      sku: string;
      name: string;
    };
  };
  shipment: {
    id: string;
    shipmentNumber: string;
    customer: {
      name: string;
    };
    outboundCarrier: string;
    targetShipDate: string;
  };
  quantityAllocated: number;
  quantityPicked: number;
  status: string;
}

interface SortingTask {
  id: string;
  appointment: {
    appointmentNumber: string;
    warehouse: {
      name: string;
    };
  };
  sortingMethod: string;
  totalUnits: number;
  sortedUnits: number;
  unitsPerHour?: number;
  accuracy?: number;
  status: string;
  startedAt?: string;
}

export default function SortingStation() {
  const [sortingTask, setSortingTask] = useState<SortingTask | null>(null);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [selectedAllocation, setSelectedAllocation] =
    useState<Allocation | null>(null);
  const [scanInput, setScanInput] = useState("");
  const [scanStatus, setScanStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [pickQuantity, setPickQuantity] = useState(1);
  const [sessionStats, setSessionStats] = useState({
    unitsPicked: 0,
    startTime: new Date(),
    errors: 0,
  });

  const scanInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadActiveTasks();
    scanInputRef.current?.focus();
  }, []);

  const loadActiveTasks = async () => {
    try {
      // Load worker's active sorting task
      const sortingRes = await fetch(
        "/api/cross-dock/sorting?status=IN_PROGRESS",
      );
      const sortingData = await sortingRes.json();

      if (sortingData.length > 0) {
        setSortingTask(sortingData[0]);

        // Load allocations for the appointment
        const allocRes = await fetch(
          `/api/cross-dock/allocations?appointmentId=${sortingData[0].appointment.id}&status=ALLOCATED&status=PICKING`,
        );
        const allocData = await allocRes.json();
        setAllocations(allocData);
      }
    } catch (error) {
      console.error("Failed to load tasks:", error);
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!scanInput.trim()) return;

    // Find matching allocation by SKU
    const allocation = allocations.find(
      (a) =>
        a.receiptItem.sku === scanInput.trim() ||
        a.receiptItem.inventory.sku === scanInput.trim(),
    );

    if (allocation) {
      setScanStatus("success");
      setSelectedAllocation(allocation);

      // Auto-pick if quantity is 1
      if (pickQuantity === 1) {
        await handlePick(allocation);
      }
    } else {
      setScanStatus("error");
      setSessionStats((prev) => ({ ...prev, errors: prev.errors + 1 }));

      setTimeout(() => {
        setScanStatus("idle");
        setScanInput("");
      }, 2000);
    }
  };

  const handlePick = async (allocation: Allocation) => {
    try {
      const res = await fetch(`/api/cross-dock/allocations/${allocation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pick",
          quantityPicked: pickQuantity,
        }),
      });

      if (res.ok) {
        // Update local state
        setAllocations((prev) =>
          prev.map((a) =>
            a.id === allocation.id
              ? {
                  ...a,
                  quantityPicked: a.quantityPicked + pickQuantity,
                  status:
                    a.quantityPicked + pickQuantity >= a.quantityAllocated
                      ? "PICKED"
                      : "PICKING",
                }
              : a,
          ),
        );

        // Update session stats
        setSessionStats((prev) => ({
          ...prev,
          unitsPicked: prev.unitsPicked + pickQuantity,
        }));

        // Update sorting task progress
        if (sortingTask) {
          await fetch(`/api/cross-dock/sorting/${sortingTask.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "updateProgress",
              sortedUnits: sortingTask.sortedUnits + pickQuantity,
            }),
          });
        }

        // Reset for next scan
        setScanStatus("idle");
        setScanInput("");
        setSelectedAllocation(null);
        setPickQuantity(1);
        scanInputRef.current?.focus();
      }
    } catch (error) {
      console.error("Failed to pick:", error);
      setScanStatus("error");
    }
  };

  const calculateUnitsPerHour = () => {
    const elapsed =
      (new Date().getTime() - sessionStats.startTime.getTime()) /
      (1000 * 60 * 60);
    return elapsed > 0 ? Math.round(sessionStats.unitsPicked / elapsed) : 0;
  };

  const calculateAccuracy = () => {
    const total = sessionStats.unitsPicked + sessionStats.errors;
    return total > 0
      ? Math.round((sessionStats.unitsPicked / total) * 100)
      : 100;
  };

  const getStatusIcon = () => {
    switch (scanStatus) {
      case "success":
        return <CheckCircle2Icon className="h-6 w-6 text-green-500" />;
      case "error":
        return <AlertCircleIcon className="h-6 w-6 text-red-500" />;
      default:
        return <ScanIcon className="h-6 w-6 text-muted-foreground" />;
    }
  };

  if (!sortingTask) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <PackageIcon className="h-16 w-16 text-muted-foreground" />
        <div className="text-center">
          <h2 className="text-xl font-semibold">No Active Sorting Task</h2>
          <p className="text-muted-foreground">
            Please check with your supervisor to get assigned
          </p>
        </div>
      </div>
    );
  }

  const progress =
    sortingTask.totalUnits > 0
      ? (sortingTask.sortedUnits / sortingTask.totalUnits) * 100
      : 0;

  const pendingAllocations = allocations.filter(
    (a) => a.status === "ALLOCATED" || a.status === "PICKING",
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Sorting Station</h1>
          <p className="text-muted-foreground">
            {sortingTask.appointment.appointmentNumber} -{" "}
            {sortingTask.appointment.warehouse.name}
          </p>
        </div>
        <Badge className="text-lg px-4 py-2">{sortingTask.sortingMethod}</Badge>
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sortingTask.sortedUnits}/{sortingTask.totalUnits}
            </div>
            <Progress value={progress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TimerIcon className="h-4 w-4" />
              Units/Hour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateUnitsPerHour()}</div>
            <p className="text-xs text-muted-foreground">Target: 100/hr</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateAccuracy()}%</div>
            <p className="text-xs text-muted-foreground">
              {sessionStats.errors} errors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Session Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionStats.unitsPicked}</div>
            <p className="text-xs text-muted-foreground">units picked</p>
          </CardContent>
        </Card>
      </div>

      {/* Scan Interface */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Scan Item
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleScan} className="space-y-4">
            <div className="flex gap-2">
              <Input
                ref={scanInputRef}
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Scan barcode or enter SKU"
                className="text-lg"
                disabled={scanStatus === "success"}
              />
              <Button
                type="submit"
                size="lg"
                disabled={scanStatus === "success"}
              >
                Scan
              </Button>
            </div>

            {scanStatus === "error" && (
              <div className="text-red-500 text-sm">
                Item not found in current allocations. Please try again.
              </div>
            )}
          </form>

          {/* Selected Item Details */}
          {selectedAllocation && scanStatus === "success" && (
            <div className="mt-4 p-4 border rounded-lg bg-accent/20">
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Product</div>
                  <div className="font-semibold">
                    {selectedAllocation.receiptItem.productName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    SKU: {selectedAllocation.receiptItem.sku}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      From (Receipt)
                    </div>
                    <div className="font-medium">
                      {selectedAllocation.receiptItem.receipt.receiptNumber}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedAllocation.receiptItem.receipt.carrier}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">
                      To (Shipment)
                    </div>
                    <div className="font-medium">
                      {selectedAllocation.shipment.shipmentNumber}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedAllocation.shipment.customer.name}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Quantity to Pick
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPickQuantity(Math.max(1, pickQuantity - 1))
                        }
                      >
                        -
                      </Button>
                      <span className="font-bold text-lg w-12 text-center">
                        {pickQuantity}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPickQuantity(
                            Math.min(
                              selectedAllocation.quantityAllocated -
                                selectedAllocation.quantityPicked,
                              pickQuantity + 1,
                            ),
                          )
                        }
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    onClick={() => handlePick(selectedAllocation)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2Icon className="h-5 w-5 mr-2" />
                    Confirm Pick
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Allocations */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Items ({pendingAllocations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingAllocations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              All items picked! Great job!
            </div>
          ) : (
            <div className="space-y-2">
              {pendingAllocations.slice(0, 10).map((allocation) => (
                <div
                  key={allocation.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <PackageIcon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {allocation.receiptItem.productName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        SKU: {allocation.receiptItem.sku}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold">
                        {allocation.quantityPicked}/
                        {allocation.quantityAllocated}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        picked
                      </div>
                    </div>
                    <TruckIcon className="h-5 w-5 text-muted-foreground" />
                    <div className="text-sm">
                      <div className="font-medium">
                        {allocation.shipment.customer.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {allocation.shipment.shipmentNumber}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
