/**
 * Wave Picking Dashboard
 * Comprehensive UI for wave management, pick optimization, and execution tracking
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Waves, 
  Package, 
  TrendingUp, 
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  MapPin,
  Target
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

interface Wave {
  id: string;
  waveNumber: string;
  type: 'DISCRETE' | 'BATCH' | 'ZONE' | 'CLUSTER';
  status: 'CREATED' | 'RELEASED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  totalOrders: number;
  totalLines: number;
  totalUnits: number;
  pickedLines: number;
  pickedUnits: number;
  assignedPickers: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  releasedAt?: string;
  completedAt?: string;
  estimatedDuration: number;
}

interface PickTask {
  id: string;
  waveNumber: string;
  orderNumber: string;
  productSku: string;
  productName: string;
  locationCode: string;
  quantityToPick: number;
  quantityPicked: number;
  pickerId: string;
  pickerName: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SHORT_PICKED';
  pickSequence: number;
  zone: string;
}

interface PickerPerformance {
  pickerId: string;
  pickerName: string;
  assignedTasks: number;
  completedTasks: number;
  unitsPerHour: number;
  accuracy: number;
  activeWave: string;
  status: 'ACTIVE' | 'IDLE' | 'BREAK';
}

interface WaveStats {
  totalWaves: number;
  activeWaves: number;
  completedToday: number;
  avgPickRate: number;
  avgAccuracy: number;
  avgWaveTime: number;
  totalPickers: number;
  activePickers: number;
}

export default function WavePickingDashboard() {
  const [waves, setWaves] = useState<Wave[]>([]);
  const [pickTasks, setPickTasks] = useState<PickTask[]>([]);
  const [pickers, setPickers] = useState<PickerPerformance[]>([]);
  const [stats, setStats] = useState<WaveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Form states
  const [newWaveType, setNewWaveType] = useState('BATCH');
  const [newWavePriority, setNewWavePriority] = useState('MEDIUM');
  const [newWaveOrders, setNewWaveOrders] = useState('');

  useEffect(() => {
    loadDashboardData();
    // Poll for updates every 10 seconds
    const interval = setInterval(loadDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load waves
      const wavesResponse = await fetch('/api/wave-picking?action=list-waves');
      const wavesData = await wavesResponse.json();
      setWaves(wavesData.waves || []);

      // Load statistics
      const statsResponse = await fetch('/api/wave-picking?action=statistics');
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Load pick tasks
      const tasksResponse = await fetch('/api/wave-picking?action=pick-tasks');
      const tasksData = await tasksResponse.json();
      setPickTasks(tasksData.tasks || []);

      // Load picker performance
      const pickersResponse = await fetch('/api/wave-picking?action=picker-performance');
      const pickersData = await pickersResponse.json();
      setPickers(pickersData.pickers || []);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWave = async () => {
    try {
      const orderIds = newWaveOrders.split(',').map(o => o.trim());
      
      const response = await fetch('/api/wave-picking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-wave',
          waveType: newWaveType,
          orderIds,
          priority: newWavePriority,
          warehouseId: 'default-warehouse'
        })
      });

      if (response.ok) {
        setNewWaveOrders('');
        loadDashboardData();
        setActiveTab('waves');
      }
    } catch (error) {
      console.error('Failed to create wave:', error);
    }
  };

  const releaseWave = async (waveId: string) => {
    try {
      const response = await fetch('/api/wave-picking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'release-wave',
          waveId
        })
      });

      if (response.ok) {
        loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to release wave:', error);
    }
  };

  const optimizeSequence = async (waveId: string) => {
    try {
      const response = await fetch('/api/wave-picking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'optimize-sequence',
          waveId,
          strategy: 'ZONE_BASED'
        })
      });

      if (response.ok) {
        loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to optimize wave:', error);
    }
  };

  const recordPick = async (taskId: string, quantity: number) => {
    try {
      const response = await fetch('/api/wave-picking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record-pick',
          taskId,
          quantityPicked: quantity
        })
      });

      if (response.ok) {
        loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to record pick:', error);
    }
  };

  const completeWave = async (waveId: string) => {
    try {
      const response = await fetch('/api/wave-picking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete-wave',
          waveId
        })
      });

      if (response.ok) {
        loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to complete wave:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      CREATED: { variant: 'secondary' as const, icon: Clock },
      RELEASED: { variant: 'default' as const, icon: TrendingUp },
      IN_PROGRESS: { variant: 'default' as const, icon: Package },
      COMPLETED: { variant: 'success' as const, icon: CheckCircle },
      CANCELLED: { variant: 'destructive' as const, icon: AlertCircle },
      PENDING: { variant: 'secondary' as const, icon: Clock },
      SHORT_PICKED: { variant: 'warning' as const, icon: AlertCircle },
      ACTIVE: { variant: 'success' as const, icon: CheckCircle },
      IDLE: { variant: 'secondary' as const, icon: Clock },
      BREAK: { variant: 'warning' as const, icon: Clock },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      LOW: { variant: 'secondary' as const },
      MEDIUM: { variant: 'default' as const },
      HIGH: { variant: 'warning' as const },
      URGENT: { variant: 'destructive' as const },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.MEDIUM;

    return (
      <Badge variant={config.variant}>
        {priority}
      </Badge>
    );
  };

  const calculateProgress = (wave: Wave) => {
    if (wave.totalLines === 0) return 0;
    return (wave.pickedLines / wave.totalLines) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading wave picking dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Waves className="h-8 w-8" />
            Wave Picking Operations
          </h1>
          <p className="text-muted-foreground">
            Manage wave creation, optimization, and pick execution
          </p>
        </div>
        <Button onClick={() => setActiveTab('create-wave')}>
          <Waves className="mr-2 h-4 w-4" />
          Create Wave
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Waves</CardTitle>
              <Waves className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeWaves}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalWaves} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pick Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgPickRate}</div>
              <p className="text-xs text-muted-foreground">
                units/hour average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgAccuracy.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Overall pick accuracy
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Pickers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activePickers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalPickers} total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="waves">Waves</TabsTrigger>
          <TabsTrigger value="pick-tasks">Pick Tasks</TabsTrigger>
          <TabsTrigger value="pickers">Pickers</TabsTrigger>
          <TabsTrigger value="create-wave">Create Wave</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Waves</CardTitle>
                <CardDescription>Waves currently in progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {waves.filter(w => w.status === 'IN_PROGRESS' || w.status === 'RELEASED').slice(0, 5).map((wave) => (
                  <div key={wave.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{wave.waveNumber}</span>
                        {getStatusBadge(wave.status)}
                        {getPriorityBadge(wave.priority)}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {wave.pickedLines}/{wave.totalLines} lines
                      </span>
                    </div>
                    <Progress value={calculateProgress(wave)} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{wave.assignedPickers} pickers</span>
                      <span>{wave.totalOrders} orders</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Picker Status</CardTitle>
                <CardDescription>Current picker activity</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Picker</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tasks</TableHead>
                      <TableHead>UPH</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pickers.slice(0, 5).map((picker) => (
                      <TableRow key={picker.pickerId}>
                        <TableCell className="font-medium">{picker.pickerName}</TableCell>
                        <TableCell>{getStatusBadge(picker.status)}</TableCell>
                        <TableCell>{picker.completedTasks}/{picker.assignedTasks}</TableCell>
                        <TableCell>{picker.unitsPerHour.toFixed(0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="waves" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Waves</CardTitle>
              <CardDescription>Manage all picking waves</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Wave #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Pickers</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {waves.map((wave) => (
                    <TableRow key={wave.id}>
                      <TableCell className="font-medium">{wave.waveNumber}</TableCell>
                      <TableCell>{wave.type}</TableCell>
                      <TableCell>{getPriorityBadge(wave.priority)}</TableCell>
                      <TableCell>{getStatusBadge(wave.status)}</TableCell>
                      <TableCell>{wave.totalOrders}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress value={calculateProgress(wave)} className="h-2" />
                          <span className="text-xs text-muted-foreground">
                            {wave.pickedLines}/{wave.totalLines}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{wave.assignedPickers}</TableCell>
                      <TableCell>
                        {new Date(wave.createdAt).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {wave.status === 'CREATED' && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => optimizeSequence(wave.id)}>
                                Optimize
                              </Button>
                              <Button size="sm" onClick={() => releaseWave(wave.id)}>
                                Release
                              </Button>
                            </>
                          )}
                          {wave.status === 'IN_PROGRESS' && (
                            <Button size="sm" onClick={() => completeWave(wave.id)}>
                              Complete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pick-tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pick Tasks</CardTitle>
              <CardDescription>Active picking tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seq</TableHead>
                    <TableHead>Wave</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Picker</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pickTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>{task.pickSequence}</TableCell>
                      <TableCell className="font-medium">{task.waveNumber}</TableCell>
                      <TableCell>{task.orderNumber}</TableCell>
                      <TableCell className="font-mono text-xs">{task.productSku}</TableCell>
                      <TableCell>{task.productName}</TableCell>
                      <TableCell className="font-mono">{task.locationCode}</TableCell>
                      <TableCell>{task.zone}</TableCell>
                      <TableCell>
                        {task.quantityPicked}/{task.quantityToPick}
                      </TableCell>
                      <TableCell>{task.pickerName}</TableCell>
                      <TableCell>{getStatusBadge(task.status)}</TableCell>
                      <TableCell>
                        {task.status === 'IN_PROGRESS' && (
                          <Button 
                            size="sm" 
                            onClick={() => recordPick(task.id, task.quantityToPick)}
                          >
                            Complete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pickers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Picker Performance</CardTitle>
              <CardDescription>Real-time picker productivity and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Picker</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Active Wave</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>UPH</TableHead>
                    <TableHead>Accuracy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pickers.map((picker) => (
                    <TableRow key={picker.pickerId}>
                      <TableCell className="font-medium">{picker.pickerName}</TableCell>
                      <TableCell>{getStatusBadge(picker.status)}</TableCell>
                      <TableCell>{picker.activeWave || '-'}</TableCell>
                      <TableCell>{picker.assignedTasks}</TableCell>
                      <TableCell>{picker.completedTasks}</TableCell>
                      <TableCell className="text-lg font-bold">
                        {picker.unitsPerHour.toFixed(0)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={picker.accuracy} className="h-2 w-16" />
                          <span className="text-sm">{picker.accuracy.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create-wave" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Wave</CardTitle>
              <CardDescription>Configure and create a new picking wave</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="wave-type">Wave Type</Label>
                  <Select value={newWaveType} onValueChange={setNewWaveType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DISCRETE">Discrete (One order per picker)</SelectItem>
                      <SelectItem value="BATCH">Batch (Multiple orders)</SelectItem>
                      <SelectItem value="ZONE">Zone (Zone-based)</SelectItem>
                      <SelectItem value="CLUSTER">Cluster (Multi-order cart)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newWavePriority} onValueChange={setNewWavePriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="orders">Order IDs (comma-separated)</Label>
                <Input
                  id="orders"
                  placeholder="ORD-001, ORD-002, ORD-003"
                  value={newWaveOrders}
                  onChange={(e) => setNewWaveOrders(e.target.value)}
                />
              </div>
              <Button onClick={createWave} disabled={!newWaveOrders}>
                Create Wave
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Wave Performance</CardTitle>
                <CardDescription>Completed waves today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold">{stats?.completedToday}</div>
                  <p className="text-sm text-muted-foreground">
                    Average time: {stats?.avgWaveTime.toFixed(0)} minutes
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Productivity Metrics</CardTitle>
                <CardDescription>Overall picking efficiency</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Pick Rate</span>
                    <span className="text-sm">{stats?.avgPickRate} UPH</span>
                  </div>
                  <Progress value={Math.min((stats?.avgPickRate || 0) / 150 * 100, 100)} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Accuracy</span>
                    <span className="text-sm">{stats?.avgAccuracy.toFixed(1)}%</span>
                  </div>
                  <Progress value={stats?.avgAccuracy || 0} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
