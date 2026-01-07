"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Package,
  Truck,
  ClipboardCheck,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface RMAItem {
  id: string;
  quantityRequested: number;
  quantityReceived: number | null;
  quantityAccepted: number | null;
  quantityRejected: number | null;
  condition: string | null;
  action: string;
  unitPrice: number;
  refundAmount: number;
  inventoryItem: {
    sku: string;
    name: string;
  };
}

interface RMA {
  id: string;
  rmaNumber: string;
  status: string;
  requestedDate: string;
  approvedDate: string | null;
  receivedDate: string | null;
  inspectedDate: string | null;
  completedDate: string | null;
  totalRefundAmount: number;
  restockingFee: number | null;
  returnTrackingNumber: string | null;
  returnCarrier: string | null;
  customerNotes: string | null;
  qcNotes: string | null;
  customer: {
    name: string;
    email: string;
  };
  returnReason: {
    name: string;
    description: string;
  };
  items: RMAItem[];
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  REJECTED: "bg-red-100 text-red-800",
  IN_TRANSIT: "bg-purple-100 text-purple-800",
  RECEIVED: "bg-indigo-100 text-indigo-800",
  INSPECTING: "bg-orange-100 text-orange-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

export default function RMADetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [rma, setRma] = useState<RMA | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRMA();
  }, [params.id]);

  const loadRMA = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/rmas/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setRma(data);
      } else {
        console.error("Failed to load RMA");
      }
    } catch (error) {
      console.error("Error loading RMA:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">Loading RMA...</p>
        </div>
      </div>
    );
  }

  if (!rma) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-2 text-lg font-semibold">RMA not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/rmas">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {rma.rmaNumber}
            </h1>
            <p className="text-muted-foreground">Return details and tracking</p>
          </div>
        </div>
        <Badge className={statusColors[rma.status] || ""}>
          {rma.status.replace("_", " ")}
        </Badge>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Return Timeline</CardTitle>
          <CardDescription>Track the progress of this return</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Requested</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(rma.requestedDate)}
                </p>
              </div>
            </div>

            {rma.approvedDate && (
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Approved</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(rma.approvedDate)}
                  </p>
                </div>
              </div>
            )}

            {rma.returnTrackingNumber && (
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                  <Truck className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">In Transit</p>
                  <p className="text-sm text-muted-foreground">
                    Tracking: {rma.returnTrackingNumber}
                  </p>
                  {rma.returnCarrier && (
                    <p className="text-sm text-muted-foreground">
                      Carrier: {rma.returnCarrier}
                    </p>
                  )}
                </div>
              </div>
            )}

            {rma.receivedDate && (
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                  <Package className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Received</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(rma.receivedDate)}
                  </p>
                </div>
              </div>
            )}

            {rma.inspectedDate && (
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                  <ClipboardCheck className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Inspected</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(rma.inspectedDate)}
                  </p>
                </div>
              </div>
            )}

            {rma.completedDate && (
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Completed</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(rma.completedDate)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium">Name</p>
              <p className="text-sm text-muted-foreground">
                {rma.customer.name}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">
                {rma.customer.email}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Return Reason */}
        <Card>
          <CardHeader>
            <CardTitle>Return Reason</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium">{rma.returnReason.name}</p>
              <p className="text-sm text-muted-foreground">
                {rma.returnReason.description}
              </p>
            </div>
            {rma.customerNotes && (
              <div>
                <p className="text-sm font-medium">Customer Notes</p>
                <p className="text-sm text-muted-foreground">
                  {rma.customerNotes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Return Items</CardTitle>
          <CardDescription>Items included in this return</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rma.items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between border-b pb-4"
              >
                <div className="flex-1">
                  <p className="font-medium">{item.inventoryItem.name}</p>
                  <p className="text-sm text-muted-foreground">
                    SKU: {item.inventoryItem.sku}
                  </p>
                  <div className="mt-2 flex gap-4 text-sm">
                    <span>Qty Requested: {item.quantityRequested}</span>
                    {item.quantityReceived !== null && (
                      <span>Received: {item.quantityReceived}</span>
                    )}
                    {item.quantityAccepted !== null && (
                      <span>Accepted: {item.quantityAccepted}</span>
                    )}
                    {item.quantityRejected !== null && (
                      <span>Rejected: {item.quantityRejected}</span>
                    )}
                  </div>
                  {item.condition && (
                    <Badge variant="outline" className="mt-2">
                      {item.condition}
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {formatCurrency(item.unitPrice)}
                  </p>
                  <Badge className="mt-2">{item.action}</Badge>
                  {item.refundAmount > 0 && (
                    <p className="mt-2 text-sm text-green-600">
                      Refund: {formatCurrency(item.refundAmount)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="my-4 border-t" />

          <div className="space-y-2">
            {rma.restockingFee && rma.restockingFee > 0 && (
              <div className="flex justify-between text-sm">
                <span>Restocking Fee</span>
                <span className="text-red-600">
                  -{formatCurrency(rma.restockingFee)}
                </span>
              </div>
            )}
            <div className="flex justify-between font-medium">
              <span>Total Refund</span>
              <span className="text-green-600">
                {formatCurrency(rma.totalRefundAmount)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {rma.qcNotes && (
        <Card>
          <CardHeader>
            <CardTitle>QC Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{rma.qcNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
