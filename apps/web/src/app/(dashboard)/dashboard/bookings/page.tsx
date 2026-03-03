"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  MoreHorizontal,
  Eye,
  Ban,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface Booking {
  id: string;
  bookingDate: string;
  deliveryDate: string | null;
  status: string;
  totalAmount: number;
  notes: string | null;
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    type: string;
  };
  _count: {
    items: number;
  };
  createdAt: string;
}

export default function BookingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch bookings
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const res = await fetch("/api/bookings");
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return res.json();
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update booking");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast({
        title: "Success",
        description: "Booking status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate stats
  const stats = React.useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter(
      (b: Booking) => b.status === "PENDING",
    ).length;
    const confirmed = bookings.filter(
      (b: Booking) => b.status === "CONFIRMED",
    ).length;
    const fulfilled = bookings.filter(
      (b: Booking) => b.status === "FULFILLED",
    ).length;
    const totalRevenue = bookings
      .filter((b: Booking) => b.status === "FULFILLED")
      .reduce((sum: number, b: Booking) => sum + Number(b.totalAmount), 0);

    return { total, pending, confirmed, fulfilled, totalRevenue };
  }, [bookings]);

  // Table columns
  const columns: ColumnDef<Booking>[] = [
    {
      accessorKey: "id",
      header: "Booking ID",
      cell: ({ row }) => (
        <div className="font-mono text-sm">#{row.original.id.slice(0, 8)}</div>
      ),
    },
    {
      accessorKey: "customer.name",
      header: "Customer",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.customer.name}</p>
          {row.original.customer.email && (
            <p className="text-xs text-muted-foreground">
              {row.original.customer.email}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "bookingDate",
      header: "Booking Date",
      cell: ({ row }) =>
        new Date(row.original.bookingDate).toLocaleDateString(),
    },
    {
      accessorKey: "deliveryDate",
      header: "Delivery Date",
      cell: ({ row }) =>
        row.original.deliveryDate
          ? new Date(row.original.deliveryDate).toLocaleDateString()
          : "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const variant =
          status === "FULFILLED"
            ? "success"
            : status === "CONFIRMED"
              ? "default"
              : status === "PENDING"
                ? "warning"
                : "destructive";

        const icon =
          status === "FULFILLED" ? (
            <CheckCircle2 className="h-3 w-3 mr-1" />
          ) : status === "CONFIRMED" ? (
            <CheckCircle2 className="h-3 w-3 mr-1" />
          ) : status === "PENDING" ? (
            <Clock className="h-3 w-3 mr-1" />
          ) : (
            <XCircle className="h-3 w-3 mr-1" />
          );

        return (
          <Badge variant={variant as any} className="flex items-center w-fit">
            {icon}
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "_count.items",
      header: "Items",
      cell: ({ row }) => row.original._count.items,
    },
    {
      accessorKey: "totalAmount",
      header: "Total",
      cell: ({ row }) => `$${Number(row.original.totalAmount).toFixed(2)}`,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const booking = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {booking.status === "PENDING" && (
                <DropdownMenuItem
                  onClick={() =>
                    updateStatusMutation.mutate({
                      id: booking.id,
                      status: "CONFIRMED",
                    })
                  }
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirm Booking
                </DropdownMenuItem>
              )}
              {booking.status === "CONFIRMED" && (
                <DropdownMenuItem
                  onClick={() =>
                    updateStatusMutation.mutate({
                      id: booking.id,
                      status: "FULFILLED",
                    })
                  }
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark as Fulfilled
                </DropdownMenuItem>
              )}
              {(booking.status === "PENDING" ||
                booking.status === "CONFIRMED") && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() =>
                      updateStatusMutation.mutate({
                        id: booking.id,
                        status: "CANCELLED",
                      })
                    }
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Cancel Booking
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <>
        <div className="p-6">
          <div className="h-8 w-48 animate-pulse bg-muted rounded mb-6" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse bg-muted rounded" />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Stock Bookings
            </h1>
            <p className="text-muted-foreground">
              Manage customer orders and reservations
            </p>
          </div>
          <Button onClick={() => router.push("/dashboard/bookings/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Bookings
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All time bookings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting confirmation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.confirmed}</div>
              <p className="text-xs text-muted-foreground">Ready to fulfill</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                From {stats.fulfilled} fulfilled bookings
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Bookings</CardTitle>
            <CardDescription>
              View and manage all customer bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={bookings}
              searchKey="customer.name"
              searchPlaceholder="Search by customer name..."
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
