"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  CheckCircle2,
  Clock,
  Link as LinkIcon,
  Package,
  TrendingUp,
  Search,
  Download,
  ExternalLink,
  Lock,
  AlertTriangle,
} from "lucide-react";

interface BlockchainTransaction {
  id: string;
  transactionHash: string;
  blockNumber: number;
  transactionType:
    | "SHIPMENT_CREATED"
    | "STATUS_UPDATE"
    | "OWNERSHIP_TRANSFER"
    | "QUALITY_CHECK";
  entityType: string;
  entityId: string;
  timestamp: string;
  status: "PENDING" | "CONFIRMED" | "FAILED";
  gasUsed?: number;
  from: string;
  to: string;
  metadata: any;
}

interface ShipmentTrace {
  shipmentId: string;
  currentStatus: string;
  origin: string;
  destination: string;
  checkpoints: {
    timestamp: string;
    location: string;
    status: string;
    verifiedBy: string;
    blockchainHash: string;
  }[];
}

export default function BlockchainDashboard() {
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
  const [shipmentTrace, setShipmentTrace] = useState<ShipmentTrace | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/blockchain/transactions");
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error("Error fetching blockchain transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const traceShipment = async (shipmentId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/blockchain/trace/${shipmentId}`);
      if (res.ok) {
        const data = await res.json();
        setShipmentTrace(data);
      }
    } catch (error) {
      console.error("Error tracing shipment:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmedTxns = transactions.filter(
    (t) => t.status === "CONFIRMED",
  ).length;
  const pendingTxns = transactions.filter((t) => t.status === "PENDING").length;
  const failedTxns = transactions.filter((t) => t.status === "FAILED").length;

  const getTypeColor = (type: string) => {
    switch (type) {
      case "SHIPMENT_CREATED":
        return "bg-blue-100 text-blue-800";
      case "STATUS_UPDATE":
        return "bg-purple-100 text-purple-800";
      case "OWNERSHIP_TRANSFER":
        return "bg-orange-100 text-orange-800";
      case "QUALITY_CHECK":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Blockchain Traceability
          </h1>
          <p className="text-gray-600 mt-1">
            Immutable shipment tracking and supply chain verification
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Audit Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Transactions
            </CardTitle>
            <LinkIcon className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {transactions.length.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Confirmed
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {confirmedTxns}
            </div>
            <p className="text-xs text-gray-500 mt-1">On-chain verified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {pendingTxns}
            </div>
            <p className="text-xs text-gray-500 mt-1">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Failed
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{failedTxns}</div>
            <p className="text-xs text-gray-500 mt-1">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">
            <LinkIcon className="h-4 w-4 mr-2" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="trace">
            <Package className="h-4 w-4 mr-2" />
            Shipment Trace
          </TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Blockchain Transactions</CardTitle>
              <CardDescription>
                All supply chain events recorded on the blockchain
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.map((txn) => (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className={getTypeColor(txn.transactionType)}
                        >
                          {txn.transactionType.replace("_", " ")}
                        </Badge>
                        <Badge
                          variant={
                            txn.status === "CONFIRMED"
                              ? "default"
                              : txn.status === "FAILED"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {txn.status}
                        </Badge>
                      </div>
                      <div className="font-mono text-sm text-gray-600 mb-1">
                        <Lock className="h-3 w-3 inline mr-1" />
                        {txn.transactionHash}
                      </div>
                      <div className="text-xs text-gray-500">
                        Block #{txn.blockNumber} •{" "}
                        {new Date(txn.timestamp).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {txn.entityType} ID: {txn.entityId}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {txn.gasUsed && (
                        <div className="text-right">
                          <div className="text-xs text-gray-600">Gas Used</div>
                          <div className="text-sm font-medium">
                            {txn.gasUsed.toLocaleString()}
                          </div>
                        </div>
                      )}
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipment Trace Tab */}
        <TabsContent value="trace" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trace Shipment</CardTitle>
              <CardDescription>
                Search for a shipment to view its complete blockchain-verified
                history
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter shipment ID or tracking number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && traceShipment(searchQuery)
                  }
                />
                <Button
                  onClick={() => traceShipment(searchQuery)}
                  disabled={!searchQuery}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Trace
                </Button>
              </div>

              {shipmentTrace && (
                <div className="mt-6 space-y-6">
                  {/* Shipment Info */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-600 mb-1">
                          Shipment ID
                        </div>
                        <div className="font-mono text-sm font-medium">
                          {shipmentTrace.shipmentId}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">
                          Current Status
                        </div>
                        <Badge>{shipmentTrace.currentStatus}</Badge>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Origin</div>
                        <div className="text-sm font-medium">
                          {shipmentTrace.origin}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">
                          Destination
                        </div>
                        <div className="text-sm font-medium">
                          {shipmentTrace.destination}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    <div className="space-y-6">
                      {shipmentTrace.checkpoints.map((checkpoint, index) => (
                        <div key={index} className="relative flex gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center z-10">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </div>
                          <Card className="flex-1">
                            <CardContent className="pt-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {checkpoint.status}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {checkpoint.location}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-gray-500">
                                    {new Date(
                                      checkpoint.timestamp,
                                    ).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 mb-2">
                                Verified by: {checkpoint.verifiedBy}
                              </div>
                              <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                                <Shield className="h-3 w-3 text-green-500" />
                                <span className="text-xs font-mono text-gray-600">
                                  {checkpoint.blockchainHash}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 ml-auto"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {!shipmentTrace && (
                <div className="text-center py-12 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Enter a shipment ID to view its blockchain trace</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
