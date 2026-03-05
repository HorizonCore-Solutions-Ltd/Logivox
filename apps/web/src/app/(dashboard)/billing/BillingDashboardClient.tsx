"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DollarSign,
  FileText,
  Settings,
  Zap,
  Hammer,
  AlertTriangle,
  Play,
  Download
} from "lucide-react";
import { runBillingCycle } from "@/lib/billing/server-actions";
import { toast } from "sonner"; // Assuming sonner or similar toast lib

interface BillingDashboardClientProps {
  stats: {
    pendingRevenue: number;
    invoicedThisMonth: number;
    vasRevenue: number;
    activeContracts: number;
  };
  transactions: any[];
  chargebacks: any[];
  invoices: any[];
  vasRequests: any[];
}

export default function BillingDashboardClient({ stats, transactions, chargebacks, invoices, vasRequests }: BillingDashboardClientProps) {
  const [isAdminless, setIsAdminless] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRunBilling = async () => {
      setIsProcessing(true);
      try {
          const result: any = await runBillingCycle();
          if (result.success) {
            toast.success(`Billing Cycle Complete! ${result.count} Invoices Generated.`);
            // In a real app, you'd revalidate path here or use router.refresh()
            window.location.reload(); 
          } else {
            toast.error("Billing Failed: " + result.message);
          }
      } catch (error) {
          toast.error("An unexpected error occurred.");
      } finally {
          setIsProcessing(false);
      }
  };

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Command Center</h1>
          <p className="mt-2 text-gray-600">
            Manage billing, contracts, VAS, and automation fees.
          </p>
        </div>
        <div className="flex items-center space-x-4 bg-white p-3 rounded-lg border shadow-sm">
             <div className="flex items-center space-x-2">
                <Switch id="adminless-mode" checked={isAdminless} onCheckedChange={setIsAdminless} />
                <Label htmlFor="adminless-mode" className="flex flex-col cursor-pointer">
                    <span className="font-semibold">Adminless Billing</span>
                    <span className="text-xs text-gray-500">Auto-approve & send</span>
                </Label>
             </div>
             {isAdminless && <Badge variant="default" className="bg-purple-600"><Zap className="w-3 h-3 mr-1"/> AI Active</Badge>}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              ${stats.pendingRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">Unbilled transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Invoiced (MTD)</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              ${stats.invoicedThisMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total sent this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">VAS Revenue</CardTitle>
            <Hammer className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              ${stats.vasRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">Kitting & labeling</p>
          </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Rate Cards</CardTitle>
                <Settings className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.activeContracts}</div>
                <p className="text-xs text-gray-500 mt-1">3PL Clients</p>
            </CardContent>
        </Card>
      </div>

      {/* Main Console */}
      <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList>
              <TabsTrigger value="transactions">Live Transactions</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="vas">VAS Jobs</TabsTrigger>
              <TabsTrigger value="chargebacks">Chargebacks</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Recent Billable Events</h3>
                  <Button onClick={handleRunBilling} disabled={isProcessing}>
                      {isProcessing ? "Processing..." : <><Play className="mr-2 h-4 w-4" /> Run Billing Cycle</>}
                  </Button>
              </div>
              <Card>
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Client</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                              <TableHead>Status</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-gray-500">
                                    No recent transactions found.
                                </TableCell>
                            </TableRow>
                          ) : (
                              transactions.map((txn: any) => (
                                <TableRow key={txn.id}>
                                    <TableCell>{new Date(txn.date).toLocaleDateString()} {new Date(txn.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</TableCell>
                                    <TableCell>{txn.clientName}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={
                                            txn.type === 'VAS' ? 'text-orange-600 border-orange-200 bg-orange-50' : 
                                            txn.type === 'STORAGE' ? 'text-blue-600 border-blue-200 bg-blue-50' : ''
                                        }>
                                            {txn.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{txn.description}</TableCell>
                                    <TableCell className="text-right font-medium">${Number(txn.amount).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge variant={txn.status === 'PENDING' ? 'secondary' : 'default'}>
                                            {txn.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                              ))
                          )}
                      </TableBody>
                  </Table>
              </Card>
          </TabsContent>

          <TabsContent value="invoices">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Issued Invoices</h3>
                  <Button variant="outline">
                      <Download className="mr-2 h-4 w-4" /> Export Report
                  </Button>
               </div>
               <Card>
                   {invoices.length === 0 ? (
                       <CardContent className="py-8 text-center text-gray-500">
                           No invoices generated yet.
                       </CardContent>
                   ) : (
                       <Table>
                           <TableHeader>
                               <TableRow>
                                   <TableHead>Invoice #</TableHead>
                                   <TableHead>Date</TableHead>
                                   <TableHead>Client</TableHead>
                                   <TableHead className="text-right">Total</TableHead>
                                   <TableHead>Status</TableHead>
                                   <TableHead>Action</TableHead>
                               </TableRow>
                           </TableHeader>
                           <TableBody>
                               {invoices.map((inv: any) => (
                                   <TableRow key={inv.id}>
                                       <TableCell className="font-mono">{inv.invoiceNumber}</TableCell>
                                       <TableCell>{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                                       <TableCell>{inv.clientName}</TableCell>
                                       <TableCell className="text-right font-bold">${Number(inv.totalAmount).toFixed(2)}</TableCell>
                                       <TableCell>
                                           <Badge variant={inv.status === 'PAID' ? 'default' : inv.status === 'SENT' ? 'secondary' : 'outline'}>
                                               {inv.status}
                                           </Badge>
                                       </TableCell>
                                       <TableCell>
                                           <Button variant="ghost" size="sm">View</Button>
                                       </TableCell>
                                   </TableRow>
                               ))}
                           </TableBody>
                       </Table>
                   )}
               </Card>
          </TabsContent>

          <TabsContent value="vas">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Value Added Service Requests</h3>
               </div>
               <Card>
                   {vasRequests.length === 0 ? (
                       <CardContent className="py-8 text-center text-gray-500">
                           No VAS requests found.
                       </CardContent>
                   ) : (
                       <Table>
                           <TableHeader>
                               <TableRow>
                                   <TableHead>Request Date</TableHead>
                                   <TableHead>Type</TableHead>
                                   <TableHead>Requester</TableHead>
                                   <TableHead>Instructions</TableHead>
                                   <TableHead className="text-right">Est. Fee</TableHead>
                                   <TableHead>Status</TableHead>
                               </TableRow>
                           </TableHeader>
                           <TableBody>
                               {vasRequests.map((vas: any) => (
                                   <TableRow key={vas.id}>
                                       <TableCell>{new Date(vas.createdAt).toLocaleDateString()}</TableCell>
                                       <TableCell>
                                            <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">
                                               {vas.type}
                                            </Badge>
                                       </TableCell>
                                       <TableCell>{vas.requester}</TableCell>
                                       <TableCell className="max-w-xs truncate" title={vas.instructions}>{vas.instructions}</TableCell>
                                       <TableCell className="text-right font-medium">${Number(vas.fee).toFixed(2)}</TableCell>
                                       <TableCell>
                                           <Badge variant={vas.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                               {vas.status}
                                           </Badge>
                                       </TableCell>
                                   </TableRow>
                               ))}
                           </TableBody>
                       </Table>
                   )}
               </Card>
          </TabsContent>
          
          <TabsContent value="chargebacks">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Supplier Chargebacks</h3>
                  <Button variant="destructive">
                      <AlertTriangle className="mr-2 h-4 w-4" /> Issue Chargeback
                  </Button>
               </div>
               <Card>
                   {chargebacks.length === 0 ? (
                       <CardContent className="py-8 text-center text-gray-500">
                           No active chargebacks found.
                       </CardContent>
                   ) : (
                       <Table>
                           <TableHeader>
                               <TableRow>
                                   <TableHead>Date</TableHead>
                                   <TableHead>Supplier</TableHead>
                                   <TableHead>Reason</TableHead>
                                   <TableHead className="text-right">Amount</TableHead>
                                   <TableHead>Status</TableHead>
                               </TableRow>
                           </TableHeader>
                           <TableBody>
                               {chargebacks.map((cb: any) => (
                                   <TableRow key={cb.id}>
                                       <TableCell>{new Date(cb.date).toLocaleDateString()}</TableCell>
                                       <TableCell>{cb.supplierName}</TableCell>
                                       <TableCell>{cb.reason}</TableCell>
                                       <TableCell className="text-right font-medium text-red-600">-${Number(cb.amount).toFixed(2)}</TableCell>
                                       <TableCell><Badge variant="outline">{cb.status}</Badge></TableCell>
                                   </TableRow>
                               ))}
                           </TableBody>
                       </Table>
                   )}
               </Card>
          </TabsContent>
      </Tabs>
    </div>
  );
}
