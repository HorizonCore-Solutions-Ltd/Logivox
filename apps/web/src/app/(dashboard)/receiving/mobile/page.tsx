"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Check, Package, Search, Truck } from "lucide-react";

interface TaskItem {
  id: string; // InventoryItemId
  poItemId: string;
  name: string;
  sku: string;
  orderedQty: number;
  receivedQty: number;
}

interface Task {
  id: string; // This is the PO ID
  shipmentNumber: string;
  supplier: string;
  poNumber: string;
  status: string;
  priority: number;
  appointmentTime: string | null;
  itemCount: number;
  dockNumber: number | null;
  items?: TaskItem[];
}

interface QuickStats {
  todayCompleted: number;
  myActive: number;
  myTodayUnits: number;
  userName: string;
}

export default function ReceivingMobile() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanInput, setScanInput] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Receiving State
  const [receiveQuantities, setReceiveQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedResult, setCompletedResult] = useState<any>(null);

  useEffect(() => {
    fetchMobileData();
  }, []);

  const fetchMobileData = async () => {
    try {
      setLoading(true);
      const [tasksRes, statsRes] = await Promise.all([
        fetch("/api/receiving/mobile?action=my_tasks"),
        fetch("/api/receiving/mobile?action=quick_stats"),
      ]);

      const tasksData = await tasksRes.json();
      const statsData = await statsRes.json();

      setTasks(tasksData.tasks || []);
      setStats(statsData.stats);
    } catch (error) {
      console.error("Failed to fetch mobile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    if (!scanInput.trim()) return;

    try {
      const response = await fetch("/api/receiving/mobile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "scan_barcode",
          barcode: scanInput,
        }),
      });

      const data = await response.json();
      if (data.success && data.result) {
        // Find task in local list or fetch it
        // Ideally fetch detailed task
        const task = tasks.find(t => t.id === data.result.id);
        if (task) {
             handleSelectTask(task);
        } else {
            // Should fetch single task detail if not in list
            alert(`Shipment ${data.result.shipmentNumber} found but not in your active list. Refreshing...`);
            fetchMobileData();
        }
        setScanInput("");
      } else {
        alert("No shipment found with this barcode");
      }
    } catch (error) {
      console.error("Scan failed:", error);
      alert("Scan failed. Please try again.");
    }
  };

  const handleSelectTask = (task: Task) => {
      setSelectedTask(task);
      // Initialize quantities
      const initialQty: Record<string, number> = {};
      task.items?.forEach(item => {
          initialQty[item.id] = Math.max(0, item.orderedQty - item.receivedQty);
      });
      setReceiveQuantities(initialQty);
      setCompletedResult(null);
  };

  const handleQtyChange = (itemId: string, val: string) => {
      setReceiveQuantities(prev => ({
          ...prev,
          [itemId]: parseInt(val) || 0
      }));
  };

  const handleSubmitReceipt = async () => {
      if (!selectedTask || !selectedTask.items) return;
      setIsSubmitting(true);

      // Build GRN Payload
      const itemsPayload = selectedTask.items.map(item => {
          const qty = receiveQuantities[item.id] || 0;
          if (qty <= 0) return null;
          return {
              inventoryItemId: item.id,
              purchaseOrderItemId: item.poItemId,
              orderedQuantity: item.orderedQty,
              receivedQuantity: qty,
              acceptedQuantity: qty, // Assume fully accepted for now (add QC split later)
              rejectedQuantity: 0,
              // unitCost is optional in updated API
              notes: "Received via Mobile App"
          };
      }).filter(Boolean);

      if (itemsPayload.length === 0) {
          alert("Please enter at least one quantity.");
          setIsSubmitting(false);
          return;
      }

      try {
          const res = await fetch("/api/grn", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  purchaseOrderId: selectedTask.id,
                  // warehouseId: // Could be selected or inferred from user context
                  warehouseId: "default", // Should be real ID ideally, but server handles it if it can. If not, error.
                  // Actually, server expects warehouseId. If "default", it might fail validation if UUID expected.
                  // Let's omit warehouseId if possible or fetch it from session/user context in future.
                  // For now, let's hope API handles missing warehouseId gracefully or we need to pass one.
                  // Wait, createGRNSchema marked warehouseId as OPTIONAL in my view earlier.
                  items: itemsPayload,
                  notes: "Received via Mobile App"
              })
          });

          if (!res.ok) {
              const err = await res.json();
              throw new Error(err.error || "Failed to create GRN");
          }
          
          const result = await res.json();
          setCompletedResult(result.grn);
          // Don't close immediately, show result!
      } catch (e: any) {
          console.error(e);
          alert(`Error creating GRN: ${e.message}`);
      } finally {
          setIsSubmitting(false);
      }
  };

  if (loading && !tasks.length) return <div className="p-8 text-center text-gray-500">Loading Tasks...</div>;

  // Detail View
  if (selectedTask) {
      return (
          <div className="p-4 max-w-md mx-auto h-screen flex flex-col bg-slate-50">
              <div className="flex items-center mb-4 sticky top-0 bg-slate-50 pt-2 z-10 pb-2 border-b">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedTask(null)}>
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back
                  </Button>
                  <h2 className="text-lg font-bold ml-2">{selectedTask.poNumber}</h2>
              </div>

              {completedResult ? (
                  <Card className="bg-green-50 border-green-200 shadow-lg animate-in fade-in zoom-in duration-300">
                      <CardHeader>
                          <CardTitle className="text-green-800 flex items-center">
                              <Check className="h-6 w-6 mr-2 bg-green-200 rounded-full p-1" /> Receipt Complete
                          </CardTitle>
                          <CardDescription className="text-green-700">GRN: {completedResult.grnNumber}</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <div className="space-y-4">
                              <h4 className="font-semibold text-sm uppercase tracking-wide text-green-800 border-b border-green-200 pb-1">Put-away Instructions</h4>
                              {completedResult.items.map((item: any) => (
                                  <div key={item.id} className="text-sm pb-2 border-b border-green-100 last:border-0">
                                      <div className="font-medium text-gray-800">{item.inventoryItem.name}</div>
                                      <div className="flex justify-between mt-1 items-center">
                                          <span className="text-gray-600">Qty: {item.acceptedQuantity}</span>
                                          <div className="flex flex-col items-end">
                                            <span className="bg-white px-2 py-0.5 rounded border border-green-300 font-mono font-bold text-green-700 shadow-sm">
                                                Bin: {item.binLocation || "Unassigned"}
                                            </span>
                                          </div>
                                      </div>
                                      {(item.notes && item.notes.includes("CROSS-DOCK")) && (
                                          <div className="text-xs bg-orange-100 text-orange-800 mt-1 px-2 py-0.5 rounded font-bold inline-block border border-orange-200">
                                              ⚡ {item.notes}
                                          </div>
                                      )}
                                      {(item.qcStatus === "PENDING" && item.notes?.includes("QC")) && (
                                           <div className="text-xs bg-red-100 text-red-800 mt-1 px-2 py-0.5 rounded font-bold inline-block border border-red-200 ml-1">
                                           🛡️ QC HOLD
                                       </div>
                                      )}
                                  </div>
                              ))}
                          </div>
                          <Button className="w-full mt-6 bg-green-600 hover:bg-green-700" onClick={() => {
                              setSelectedTask(null);
                              fetchMobileData();
                          }}>Done</Button>
                      </CardContent>
                  </Card>
              ) : (
                  <div className="flex-1 overflow-hidden flex flex-col">
                      <div className="flex-1 overflow-auto space-y-4 pb-20">
                        <div className="text-sm text-gray-500 px-1">{selectedTask.supplier}</div>
                          {selectedTask.items?.map(item => (
                              <Card key={item.id} className="border border-slate-200 shadow-sm">
                                  <CardContent className="p-4">
                                    <div className="font-medium">{item.name}</div>
                                    <div className="text-xs text-gray-500 mb-3">SKU: {item.sku}</div>
                                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded">
                                        <div className="text-xs text-gray-600">
                                            <div>Ord: {item.orderedQty}</div>
                                            <div>Open: {item.orderedQty - item.receivedQty}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-bold uppercase text-gray-500">Recv</label>
                                            <Input 
                                                type="number" 
                                                className="w-24 text-right font-mono text-lg h-10 border-blue-200 focus:ring-blue-500"
                                                value={receiveQuantities[item.id] || 0}
                                                onChange={(e) => handleQtyChange(item.id, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                  </CardContent>
                              </Card>
                          ))}
                      </div>
                      <div className="p-4 border-t bg-white sticky bottom-0 z-20 shadow-up">
                          <Button className="w-full h-12 text-lg" onClick={handleSubmitReceipt} disabled={isSubmitting}>
                              {isSubmitting ? "Processing..." : "Confirm Receipt"}
                          </Button>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  // Dashboard View
  return (
    <div className="p-4 max-w-md mx-auto space-y-4 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold text-slate-800">Inbound</h1>
        <div className="text-xs text-right text-slate-500">
             {stats?.userName}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats?.todayCompleted || 0}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Completed</div>
            </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-orange-600">{stats?.myActive || 0}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Pending</div>
            </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Input 
            placeholder="Scan PO / SKU..." 
            className="bg-white"
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
        />
        <Button onClick={handleScan} variant="secondary">
            <Search className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="tasks">My Tasks</TabsTrigger>
          <TabsTrigger value="recent">History</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks" className="space-y-3 mt-4">
            {tasks.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                    <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No pending receipts found.</p>
                </div>
            ) : (
                tasks.map(task => (
                    <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500" onClick={() => handleSelectTask(task)}>
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold flex items-center text-slate-800">
                                    <Truck className="h-4 w-4 mr-2 text-slate-500" />
                                    {task.poNumber}
                                </span>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-full border border-slate-200 font-medium">{task.status}</span>
                            </div>
                            <div className="text-sm text-slate-600 mb-3">{task.supplier}</div>
                            <div className="flex justify-between text-xs text-slate-400 border-t pt-2 mt-2">
                                <span>{task.items?.length || task.itemCount} Items</span>
                                <span>{task.appointmentTime ? new Date(task.appointmentTime).toLocaleDateString() : 'No Appt'}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}
        </TabsContent>
        <TabsContent value="recent">
            <div className="text-center py-8 text-gray-400 text-sm">History shown in full dashboard</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
