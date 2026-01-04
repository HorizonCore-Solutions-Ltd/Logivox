'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Wrench,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Package,
  AlertCircle,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface WorkOrder {
  id: string;
  work_order_number: string;
  return_id: string;
  rma_number: string;
  item_name: string;
  priority: string;
  status: string;
  current_step: number;
  total_steps: number;
  assigned_to: string | null;
  estimated_cost: number;
  actual_cost: number | null;
  created_at: string;
  completed_at: string | null;
}

interface WorkOrderDetails extends WorkOrder {
  steps: Array<{
    id: string;
    step_number: number;
    description: string;
    status: string;
    completed_at: string | null;
    notes: string | null;
  }>;
  parts_used: Array<{
    id: string;
    part_name: string;
    part_sku: string;
    quantity: number;
    cost: number;
  }>;
}

export default function RefurbishmentQueuePage() {
  const [loading, setLoading] = useState(true);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrderDetails | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');

  useEffect(() => {
    fetchWorkOrders();
  }, [filterStatus, filterPriority]);

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'ALL') params.append('status', filterStatus);
      if (filterPriority !== 'ALL') params.append('priority', filterPriority);

      const response = await fetch(`/api/returns/refurbishment/work-orders?${params}`);
      const data = await response.json();
      setWorkOrders(data.workOrders || []);
    } catch (error) {
      console.error('Error fetching work orders:', error);
      toast.error('Failed to load work orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkOrderDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/returns/refurbishment/work-orders/${id}`);
      const data = await response.json();
      setSelectedOrder(data);
      setDetailsOpen(true);
    } catch (error) {
      console.error('Error fetching work order details:', error);
      toast.error('Failed to load work order details');
    }
  };

  const completeStep = async (workOrderId: string, stepId: string, notes: string) => {
    try {
      const response = await fetch(`/api/returns/refurbishment/work-orders/${workOrderId}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId, notes }),
      });

      if (response.ok) {
        toast.success('Step completed');
        fetchWorkOrderDetails(workOrderId);
        fetchWorkOrders();
      }
    } catch (error) {
      console.error('Error completing step:', error);
      toast.error('Failed to complete step');
    }
  };

  const assignTechnician = async (workOrderId: string, technicianId: string) => {
    try {
      const response = await fetch(`/api/returns/refurbishment/work-orders/${workOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: technicianId }),
      });

      if (response.ok) {
        toast.success('Technician assigned');
        fetchWorkOrders();
      }
    } catch (error) {
      console.error('Error assigning technician:', error);
      toast.error('Failed to assign technician');
    }
  };

  const getPriorityBadge = (priority: string) => {
    const config = {
      URGENT: { color: 'bg-red-500', text: 'Urgent' },
      HIGH: { color: 'bg-orange-500', text: 'High' },
      MEDIUM: { color: 'bg-yellow-500', text: 'Medium' },
      LOW: { color: 'bg-green-500', text: 'Low' },
    };

    const { color, text } = config[priority as keyof typeof config] || config.LOW;
    return <Badge className={`${color} text-white`}>{text}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config = {
      PENDING: { color: 'bg-gray-500', icon: Clock },
      IN_PROGRESS: { color: 'bg-blue-500', icon: Wrench },
      QA_REVIEW: { color: 'bg-purple-500', icon: AlertCircle },
      COMPLETED: { color: 'bg-green-500', icon: CheckCircle },
      FAILED: { color: 'bg-red-500', icon: XCircle },
    };

    const { color, icon: Icon } = config[status as keyof typeof config] || config.PENDING;
    return (
      <Badge className={`${color} text-white flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const filteredOrders = workOrders;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wrench className="w-8 h-8" />
            Refurbishment Queue
          </h1>
          <p className="text-muted-foreground">Manage work orders and track repairs</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchWorkOrders}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workOrders.filter((w) => w.status === 'PENDING').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {workOrders.filter((w) => w.status === 'IN_PROGRESS').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">QA Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">
              {workOrders.filter((w) => w.status === 'QA_REVIEW').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {
                workOrders.filter(
                  (w) =>
                    w.status === 'COMPLETED' &&
                    w.completed_at &&
                    new Date(w.completed_at).toDateString() === new Date().toDateString()
                ).length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="QA_REVIEW">QA Review</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Priorities</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Work Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-2" />
                <p>No work orders found</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => fetchWorkOrderDetails(order.id)}
                >
                  <div className="flex items-center gap-4">
                    <Wrench className="w-8 h-8 text-primary" />
                    <div>
                      <div className="font-bold">{order.work_order_number}</div>
                      <div className="text-sm text-muted-foreground">{order.item_name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        RMA: {order.rma_number}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        Step {order.current_step} of {order.total_steps}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Est. ${order.estimated_cost.toFixed(2)}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {getPriorityBadge(order.priority)}
                      {getStatusBadge(order.status)}
                    </div>
                    {order.assigned_to && (
                      <div className="flex items-center gap-1 text-sm">
                        <User className="w-4 h-4" />
                        {order.assigned_to}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Work Order Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Wrench className="w-6 h-6" />
                  {selectedOrder.work_order_number}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Status and Priority */}
                <div className="flex items-center gap-4">
                  {getStatusBadge(selectedOrder.status)}
                  {getPriorityBadge(selectedOrder.priority)}
                </div>

                {/* Item Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Item Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Item</div>
                        <div className="font-medium">{selectedOrder.item_name}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">RMA Number</div>
                        <div className="font-medium">{selectedOrder.rma_number}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Estimated Cost</div>
                        <div className="font-medium">${selectedOrder.estimated_cost.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Actual Cost</div>
                        <div className="font-medium">
                          {selectedOrder.actual_cost
                            ? `$${selectedOrder.actual_cost.toFixed(2)}`
                            : 'TBD'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Steps */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Refurbishment Steps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedOrder.steps.map((step) => (
                        <div
                          key={step.id}
                          className="flex items-start justify-between p-3 border rounded"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                step.status === 'COMPLETED'
                                  ? 'bg-green-500 text-white'
                                  : step.status === 'IN_PROGRESS'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-200'
                              }`}
                            >
                              {step.step_number}
                            </div>
                            <div>
                              <div className="font-medium">{step.description}</div>
                              {step.notes && (
                                <div className="text-sm text-muted-foreground mt-1">
                                  {step.notes}
                                </div>
                              )}
                              {step.completed_at && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Completed: {new Date(step.completed_at).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                          {step.status === 'PENDING' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                const notes = prompt('Enter notes for this step:');
                                if (notes !== null) {
                                  completeStep(selectedOrder.id, step.id, notes);
                                }
                              }}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Parts Used */}
                {selectedOrder.parts_used.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Parts Used</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedOrder.parts_used.map((part) => (
                          <div
                            key={part.id}
                            className="flex items-center justify-between text-sm p-2 border rounded"
                          >
                            <div>
                              <div className="font-medium">{part.part_name}</div>
                              <div className="text-muted-foreground">{part.part_sku}</div>
                            </div>
                            <div className="text-right">
                              <div>Qty: {part.quantity}</div>
                              <div className="text-muted-foreground">
                                ${part.cost.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
