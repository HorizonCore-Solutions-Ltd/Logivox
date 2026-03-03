"use client";

import { useState } from "react";
import {
  ClipboardList,
  Search,
  Play,
  CheckCircle2,
  Clock,
  Package,
  AlertCircle,
  Zap,
  Filter,
  Plus,
  Eye,
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

const PRIORITY_COLOR: Record<string, string> = {
  CRITICAL: "destructive",
  URGENT: "default",
  HIGH: "default",
  NORMAL: "secondary",
  LOW: "outline",
};

const STATUS_COLOR: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "secondary",
  APPROVED: "default",
  PICKING: "default",
  PICKED: "default",
  PACKING: "default",
  PACKED: "default",
  SHIPPED: "default",
  DELIVERED: "default",
  CANCELLED: "destructive",
};

const MOCK_ORDERS = [
  {
    id: "1",
    soNumber: "SO-2026-0412",
    customer: "Acme Corp",
    status: "PICKING",
    priority: "URGENT",
    itemCount: 12,
    totalValue: 4850.0,
    dueDate: "2026-03-04",
    assignee: "John D.",
  },
  {
    id: "2",
    soNumber: "SO-2026-0411",
    customer: "TechFlow Ltd",
    status: "APPROVED",
    priority: "HIGH",
    itemCount: 5,
    totalValue: 1230.5,
    dueDate: "2026-03-04",
    assignee: "Sarah M.",
  },
  {
    id: "3",
    soNumber: "SO-2026-0410",
    customer: "Global Retail Inc",
    status: "PACKING",
    priority: "NORMAL",
    itemCount: 28,
    totalValue: 9200.0,
    dueDate: "2026-03-05",
    assignee: "Mike T.",
  },
  {
    id: "4",
    soNumber: "SO-2026-0409",
    customer: "FastShip Co",
    status: "PICKED",
    priority: "CRITICAL",
    itemCount: 3,
    totalValue: 650.0,
    dueDate: "2026-03-03",
    assignee: "Lisa R.",
  },
  {
    id: "5",
    soNumber: "SO-2026-0408",
    customer: "BigBox Stores",
    status: "PACKED",
    priority: "NORMAL",
    itemCount: 45,
    totalValue: 12400.0,
    dueDate: "2026-03-06",
    assignee: "Tom B.",
  },
  {
    id: "6",
    soNumber: "SO-2026-0407",
    customer: "HealthCare Plus",
    status: "SHIPPED",
    priority: "HIGH",
    itemCount: 8,
    totalValue: 3100.0,
    dueDate: "2026-03-03",
    assignee: "Anna K.",
  },
  {
    id: "7",
    soNumber: "SO-2026-0406",
    customer: "MegaMart",
    status: "PENDING",
    priority: "LOW",
    itemCount: 20,
    totalValue: 5500.0,
    dueDate: "2026-03-07",
    assignee: null,
  },
  {
    id: "8",
    soNumber: "SO-2026-0405",
    customer: "ElectroParts",
    status: "CANCELLED",
    priority: "NORMAL",
    itemCount: 6,
    totalValue: 880.0,
    dueDate: "2026-03-02",
    assignee: "Chris L.",
  },
];

const KPI_CARDS = [
  {
    title: "Pending Approval",
    value: "14",
    icon: Clock,
    color: "text-yellow-500",
    bg: "bg-yellow-50",
  },
  {
    title: "In Picking",
    value: "23",
    icon: Play,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    title: "Ready to Ship",
    value: "8",
    icon: Package,
    color: "text-green-500",
    bg: "bg-green-50",
  },
  {
    title: "Overdue",
    value: "3",
    icon: AlertCircle,
    color: "text-red-500",
    bg: "bg-red-50",
  },
];

const STATUS_TABS = [
  "ALL",
  "PENDING",
  "APPROVED",
  "PICKING",
  "PICKED",
  "PACKING",
  "PACKED",
  "SHIPPED",
];

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const filtered = MOCK_ORDERS.filter((o) => {
    const matchSearch =
      !search ||
      o.soNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
    const matchPriority =
      priorityFilter === "ALL" || o.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-blue-600" />
            Sales Orders
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track all outbound sales orders
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Zap className="h-4 w-4 mr-2" />
            Auto-Allocate
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Order
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

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="h-4 w-4 text-muted-foreground absolute ml-3 pointer-events-none" />
              <Input
                placeholder="Search orders or customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-36">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {["ALL", "CRITICAL", "URGENT", "HIGH", "NORMAL", "LOW"].map(
                    (p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Status tabs */}
          <div className="flex gap-1 flex-wrap pt-2">
            {STATUS_TABS.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={statusFilter === s ? "default" : "ghost"}
                className="h-7 text-xs"
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                    No orders match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((order) => (
                  <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono font-semibold text-blue-600">
                      {order.soNumber}
                    </TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_COLOR[order.status] ?? "secondary"}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          (PRIORITY_COLOR[order.priority] as "default" | "secondary" | "destructive" | "outline") ??
                          "secondary"
                        }
                      >
                        {order.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{order.itemCount}</TableCell>
                    <TableCell className="text-right font-medium">
                      £{order.totalValue.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span
                        className={
                          new Date(order.dueDate) < new Date()
                            ? "text-red-600 font-semibold"
                            : ""
                        }
                      >
                        {order.dueDate}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {order.assignee ?? (
                        <span className="italic text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Play className="h-4 w-4 mr-2" />
                            Start Picking
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Mark Complete
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
