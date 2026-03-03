"use client";

import { useState } from "react";
import {
  RotateCcw,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Eye,
  Package,
  ClipboardCheck,
  AlertTriangle,
  Filter,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  RECEIVED: "default",
  INSPECTING: "default",
  COMPLETED: "default",
  CANCELLED: "outline",
};

const MOCK_RETURNS = [
  {
    id: "1",
    rmaNumber: "RMA-2026-0088",
    customerName: "Acme Corp",
    orderId: "SO-2026-0320",
    status: "INSPECTING",
    reason: "Damaged in transit",
    lines: 3,
    createdAt: "2026-03-01T10:00:00Z",
    value: 540.0,
    assignee: "Warehouse QC",
  },
  {
    id: "2",
    rmaNumber: "RMA-2026-0087",
    customerName: "TechFlow Ltd",
    orderId: "SO-2026-0315",
    status: "APPROVED",
    reason: "Wrong item shipped",
    lines: 1,
    createdAt: "2026-03-01T08:30:00Z",
    value: 210.0,
    assignee: "Sarah M.",
  },
  {
    id: "3",
    rmaNumber: "RMA-2026-0086",
    customerName: "BigBox Stores",
    orderId: "SO-2026-0300",
    status: "COMPLETED",
    reason: "Customer changed mind",
    lines: 5,
    createdAt: "2026-02-28T14:00:00Z",
    value: 1200.0,
    assignee: "John D.",
  },
  {
    id: "4",
    rmaNumber: "RMA-2026-0085",
    customerName: "HealthCare Plus",
    orderId: "SO-2026-0295",
    status: "PENDING",
    reason: "Product defect",
    lines: 2,
    createdAt: "2026-02-28T11:45:00Z",
    value: 890.0,
    assignee: null,
  },
  {
    id: "5",
    rmaNumber: "RMA-2026-0084",
    customerName: "MegaMart",
    orderId: "SO-2026-0290",
    status: "REJECTED",
    reason: "Outside return window",
    lines: 4,
    createdAt: "2026-02-27T09:15:00Z",
    value: 320.0,
    assignee: "Lisa R.",
  },
  {
    id: "6",
    rmaNumber: "RMA-2026-0083",
    customerName: "Global Retail Inc",
    orderId: "SO-2026-0285",
    status: "RECEIVED",
    reason: "Quality below spec",
    lines: 7,
    createdAt: "2026-02-27T07:00:00Z",
    value: 2750.0,
    assignee: "Mike T.",
  },
];

const KPI_CARDS = [
  {
    title: "Pending Review",
    value: "7",
    icon: AlertTriangle,
    color: "text-yellow-500",
    bg: "bg-yellow-50",
  },
  {
    title: "In Inspection",
    value: "4",
    icon: ClipboardCheck,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    title: "Awaiting Restock",
    value: "11",
    icon: Package,
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  {
    title: "Completed This Month",
    value: "38",
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-50",
  },
];

const RETURN_REASONS = [
  "Damaged in transit",
  "Wrong item shipped",
  "Product defect",
  "Customer changed mind",
  "Quality below spec",
  "Duplicate order",
  "Outside return window",
];

export default function ReturnsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = MOCK_RETURNS.filter((r) => {
    const matchSearch =
      !search ||
      r.rmaNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.customerName.toLowerCase().includes(search.toLowerCase()) ||
      r.reason.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <RotateCcw className="h-6 w-6 text-purple-600" />
            Returns (RMA)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage return merchandise authorisations and reverse logistics
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New RMA
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {KPI_CARDS.map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${kpi.bg}`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2 flex-1 max-w-md relative">
              <Search className="h-4 w-4 text-muted-foreground absolute ml-3 pointer-events-none" />
              <Input
                placeholder="Search RMA number, customer, reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {[
                  "ALL",
                  "PENDING",
                  "APPROVED",
                  "REJECTED",
                  "RECEIVED",
                  "INSPECTING",
                  "COMPLETED",
                  "CANCELLED",
                ].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>RMA #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Order Ref</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Lines</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center py-10 text-muted-foreground"
                  >
                    No returns match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((rma) => (
                  <TableRow
                    key={rma.id}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="font-mono font-semibold text-purple-600">
                      {rma.rmaNumber}
                    </TableCell>
                    <TableCell>{rma.customerName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {rma.orderId}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[rma.status] ?? "secondary"}>
                        {rma.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-[160px] truncate">
                      {rma.reason}
                    </TableCell>
                    <TableCell className="text-right">{rma.lines}</TableCell>
                    <TableCell className="text-right font-medium">
                      £
                      {rma.value.toLocaleString("en-GB", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(rma.createdAt).toLocaleDateString("en-GB")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {rma.assignee ?? (
                        <span className="italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <ClipboardCheck className="h-4 w-4 mr-2" />
                            Mark Received
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
