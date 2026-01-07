/**
 * Cross-Docking Shared Components
 * Reusable components for cross-dock operations
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  TruckIcon,
  PackageIcon,
  ClockIcon,
  ArrowRightIcon,
  AlertTriangleIcon,
} from "lucide-react";

interface AppointmentCardProps {
  appointment: {
    id: string;
    appointmentNumber: string;
    type: string;
    status: string;
    priority: string;
    expectedArrival: string;
    targetShipDate: string;
    inboundCarrier?: string;
    outboundCarrier?: string;
    totalUnits: number;
    receivedUnits: number;
    sortedUnits: number;
    shippedUnits: number;
    dwellTimeMinutes?: number;
    maxDwellTimeHours: number;
  };
  onClick?: () => void;
}

export function AppointmentCard({
  appointment,
  onClick,
}: AppointmentCardProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SCHEDULED: "bg-blue-500",
      RECEIVING: "bg-yellow-500",
      SORTING: "bg-purple-500",
      STAGED: "bg-indigo-500",
      LOADING: "bg-orange-500",
      COMPLETED: "bg-green-500",
      CANCELLED: "bg-gray-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getPriorityVariant = (priority: string) => {
    const variants: Record<string, any> = {
      URGENT: "destructive",
      HIGH: "destructive",
      MEDIUM: "default",
      LOW: "secondary",
    };
    return variants[priority] || "default";
  };

  const isDwellTimeWarning = () => {
    if (!appointment.dwellTimeMinutes) return false;
    const maxMinutes = appointment.maxDwellTimeHours * 60;
    return appointment.dwellTimeMinutes > maxMinutes * 0.8;
  };

  const progress =
    appointment.totalUnits > 0
      ? (appointment.shippedUnits / appointment.totalUnits) * 100
      : 0;

  return (
    <Card
      className="hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">
              {appointment.appointmentNumber}
            </span>
            <Badge variant={getPriorityVariant(appointment.priority)}>
              {appointment.priority}
            </Badge>
            <Badge className={getStatusColor(appointment.status)}>
              {appointment.status}
            </Badge>
            <Badge variant="outline">{appointment.type}</Badge>
            {isDwellTimeWarning() && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangleIcon className="h-3 w-3" />
                Dwell Warning
              </Badge>
            )}
          </div>

          {/* Carriers */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <TruckIcon className="h-4 w-4" />
              <span>In: {appointment.inboundCarrier || "N/A"}</span>
            </div>
            <ArrowRightIcon className="h-4 w-4" />
            <div className="flex items-center gap-1">
              <TruckIcon className="h-4 w-4" />
              <span>Out: {appointment.outboundCarrier || "N/A"}</span>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Received: </span>
              <span className="font-medium">
                {appointment.receivedUnits}/{appointment.totalUnits}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Sorted: </span>
              <span className="font-medium">
                {appointment.sortedUnits}/{appointment.receivedUnits}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Shipped: </span>
              <span className="font-medium">
                {appointment.shippedUnits}/{appointment.totalUnits}
              </span>
            </div>
          </div>

          {/* Dwell Time */}
          {appointment.dwellTimeMinutes && (
            <div className="text-sm">
              <span className="text-muted-foreground">Dwell Time: </span>
              <span
                className={
                  isDwellTimeWarning() ? "text-destructive font-medium" : ""
                }
              >
                {Math.floor(appointment.dwellTimeMinutes / 60)}h{" "}
                {appointment.dwellTimeMinutes % 60}m
              </span>
              <span className="text-muted-foreground">
                {" "}
                / {appointment.maxDwellTimeHours}h max
              </span>
            </div>
          )}

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AllocationListProps {
  allocations: Array<{
    id: string;
    receiptItem: {
      sku: string;
      productName: string;
      receipt: {
        receiptNumber: string;
      };
    };
    shipment: {
      shipmentNumber: string;
      customer: {
        name: string;
      };
    };
    quantityAllocated: number;
    quantityPicked: number;
    quantityShipped: number;
    status: string;
  }>;
  onAllocationClick?: (allocationId: string) => void;
}

export function AllocationList({
  allocations,
  onAllocationClick,
}: AllocationListProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ALLOCATED: "bg-blue-500",
      PICKING: "bg-yellow-500",
      PICKED: "bg-purple-500",
      STAGED: "bg-indigo-500",
      LOADED: "bg-orange-500",
      SHIPPED: "bg-green-500",
    };
    return colors[status] || "bg-gray-500";
  };

  if (allocations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No allocations found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {allocations.map((allocation) => (
        <div
          key={allocation.id}
          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
          onClick={() => onAllocationClick?.(allocation.id)}
        >
          <div className="flex items-center gap-3 flex-1">
            <PackageIcon className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
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
              <div className="text-sm text-muted-foreground">From</div>
              <div className="font-medium">
                {allocation.receiptItem.receipt.receiptNumber}
              </div>
            </div>

            <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />

            <div className="text-right">
              <div className="text-sm text-muted-foreground">To</div>
              <div className="font-medium">
                {allocation.shipment.customer.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {allocation.shipment.shipmentNumber}
              </div>
            </div>

            <div className="text-right min-w-[80px]">
              <div className="font-semibold">
                {allocation.quantityShipped || allocation.quantityPicked}/
                {allocation.quantityAllocated}
              </div>
              <Badge className={`${getStatusColor(allocation.status)} text-xs`}>
                {allocation.status}
              </Badge>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface DwellTimeIndicatorProps {
  dwellTimeMinutes?: number;
  maxDwellTimeHours: number;
  size?: "sm" | "md" | "lg";
}

export function DwellTimeIndicator({
  dwellTimeMinutes,
  maxDwellTimeHours,
  size = "md",
}: DwellTimeIndicatorProps) {
  if (!dwellTimeMinutes) {
    return null;
  }

  const maxMinutes = maxDwellTimeHours * 60;
  const percentage = (dwellTimeMinutes / maxMinutes) * 100;
  const isWarning = percentage > 80;
  const isCritical = percentage > 100;

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className={`flex items-center gap-2 ${sizeClasses[size]}`}>
      <ClockIcon
        className={`h-4 w-4 ${
          isCritical
            ? "text-red-500"
            : isWarning
              ? "text-orange-500"
              : "text-muted-foreground"
        }`}
      />
      <span
        className={
          isCritical
            ? "text-red-500 font-bold"
            : isWarning
              ? "text-orange-500 font-medium"
              : ""
        }
      >
        {Math.floor(dwellTimeMinutes / 60)}h {dwellTimeMinutes % 60}m
      </span>
      <span className="text-muted-foreground">/ {maxDwellTimeHours}h</span>
      {isWarning && (
        <AlertTriangleIcon
          className={`h-4 w-4 ${isCritical ? "text-red-500" : "text-orange-500"}`}
        />
      )}
    </div>
  );
}

interface CrossDockStatsGridProps {
  stats: {
    totalAppointments: number;
    activeAppointments: number;
    completedToday: number;
    totalUnits: number;
    shippedUnits: number;
    avgDwellTime: number;
    onTimeRate: number;
  };
}

export function CrossDockStatsGrid({ stats }: CrossDockStatsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Active</div>
              <div className="text-2xl font-bold">
                {stats.activeAppointments}
              </div>
            </div>
            <TruckIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Completed</div>
              <div className="text-2xl font-bold">{stats.completedToday}</div>
            </div>
            <PackageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Throughput</div>
              <div className="text-2xl font-bold">
                {stats.totalUnits > 0
                  ? Math.round((stats.shippedUnits / stats.totalUnits) * 100)
                  : 0}
                %
              </div>
            </div>
            <ArrowRightIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">On-Time</div>
              <div className="text-2xl font-bold">
                {Math.round(stats.onTimeRate)}%
              </div>
            </div>
            <ClockIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
