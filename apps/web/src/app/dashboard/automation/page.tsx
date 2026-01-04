'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Bot, 
  Zap, 
  AlertCircle, 
  CheckCircle, 
  Activity,
  TrendingUp,
  Clock,
  Package,
  MapPin,
  RefreshCw,
  Power,
  PauseCircle,
  PlayCircle
} from 'lucide-react';

interface AutomationDevice {
  id: string;
  name: string;
  deviceType: 'AGV' | 'AMR' | 'ROBOT_ARM' | 'CONVEYOR' | 'SORTER' | 'AS_RS';
  status: 'ACTIVE' | 'IDLE' | 'CHARGING' | 'MAINTENANCE' | 'ERROR';
  currentTask?: string;
  batteryLevel?: number;
  location?: string;
  utilizationRate: number;
  tasksCompleted: number;
  uptime: number;
  lastMaintenance?: string;
}

interface Task {
  id: string;
  taskType: string;
  deviceId: string;
  deviceName: string;
  status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  startTime?: string;
  completedTime?: string;
  estimatedDuration: number;
  actualDuration?: number;
}

export default function AutomationDashboard() {
  const [devices, setDevices] = useState<AutomationDevice[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    fetchData();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchData, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [devicesRes, tasksRes] = await Promise.all([
        fetch('/api/automation/devices'),
        fetch('/api/automation/tasks'),
      ]);

      if (devicesRes.ok) setDevices(await devicesRes.json());
      if (tasksRes.ok) setTasks(await tasksRes.json());
    } catch (error) {
      console.error('Error fetching automation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceControl = async (deviceId: string, action: 'START' | 'STOP' | 'PAUSE') => {
    try {
      await fetch(`/api/automation/devices/${deviceId}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      fetchData();
    } catch (error) {
      console.error('Error controlling device:', error);
    }
  };

  // Metrics
  const activeDevices = devices.filter(d => d.status === 'ACTIVE').length;
  const idleDevices = devices.filter(d => d.status === 'IDLE').length;
  const errorDevices = devices.filter(d => d.status === 'ERROR').length;
  const chargingDevices = devices.filter(d => d.status === 'CHARGING').length;

  const avgUtilization = devices.reduce((sum, d) => sum + d.utilizationRate, 0) / devices.length || 0;
  const totalTasksCompleted = devices.reduce((sum, d) => sum + d.tasksCompleted, 0);
  const queuedTasks = tasks.filter(t => t.status === 'QUEUED').length;
  const failedTasks = tasks.filter(t => t.status === 'FAILED').length;

  const filteredDevices = selectedType === 'ALL' 
    ? devices 
    : devices.filter(d => d.deviceType === selectedType);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-300';
      case 'IDLE': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'CHARGING': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'ERROR': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'destructive';
      case 'HIGH': return 'default';
      case 'MEDIUM': return 'secondary';
      case 'LOW': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Automation & Robotics</h1>
          <p className="text-gray-600 mt-1">
            Real-time monitoring and control of automated warehouse equipment
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? 'default' : 'outline'}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Fleet Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Devices
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{activeDevices}</div>
            <p className="text-xs text-gray-500 mt-1">Currently working</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Idle/Charging
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {idleDevices + chargingDevices}
            </div>
            <p className="text-xs text-gray-500 mt-1">{chargingDevices} charging</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Fleet Utilization
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {avgUtilization.toFixed(0)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Average across fleet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tasks Completed
            </CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {totalTasksCompleted.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Issues
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {errorDevices}
            </div>
            <p className="text-xs text-gray-500 mt-1">{failedTasks} failed tasks</p>
          </CardContent>
        </Card>
      </div>

      {/* Device Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Devices</SelectItem>
                <SelectItem value="AGV">AGV (Automated Guided Vehicles)</SelectItem>
                <SelectItem value="AMR">AMR (Autonomous Mobile Robots)</SelectItem>
                <SelectItem value="ROBOT_ARM">Robot Arms</SelectItem>
                <SelectItem value="CONVEYOR">Conveyors</SelectItem>
                <SelectItem value="SORTER">Sorters</SelectItem>
                <SelectItem value="AS_RS">AS/RS Systems</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-600">
              Showing {filteredDevices.length} of {devices.length} devices
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device Fleet */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDevices.map((device) => (
          <Card key={device.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-gray-600" />
                  <div>
                    <CardTitle className="text-lg">{device.name}</CardTitle>
                    <p className="text-xs text-gray-500 mt-1">{device.deviceType.replace('_', ' ')}</p>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={getStatusColor(device.status)}
                >
                  {device.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Task */}
              {device.currentTask && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Current Task</div>
                  <div className="text-sm font-medium text-gray-900">{device.currentTask}</div>
                </div>
              )}

              {/* Location */}
              {device.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{device.location}</span>
                </div>
              )}

              {/* Battery Level */}
              {device.batteryLevel !== undefined && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Battery</span>
                    <span className="font-medium">{device.batteryLevel}%</span>
                  </div>
                  <Progress 
                    value={device.batteryLevel} 
                    className={
                      device.batteryLevel < 20 ? 'bg-red-100 [&>div]:bg-red-500' :
                      device.batteryLevel < 40 ? 'bg-yellow-100 [&>div]:bg-yellow-500' :
                      'bg-green-100 [&>div]:bg-green-500'
                    }
                  />
                </div>
              )}

              {/* Utilization */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Utilization</span>
                  <span className="font-medium">{device.utilizationRate}%</span>
                </div>
                <Progress 
                  value={device.utilizationRate} 
                  className="bg-purple-100 [&>div]:bg-purple-500"
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div>
                  <div className="text-xs text-gray-600">Tasks Today</div>
                  <div className="text-lg font-bold text-gray-900">{device.tasksCompleted}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Uptime</div>
                  <div className="text-lg font-bold text-gray-900">{device.uptime.toFixed(1)}h</div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-2 pt-2">
                {device.status === 'IDLE' && (
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleDeviceControl(device.id, 'START')}
                  >
                    <PlayCircle className="h-4 w-4 mr-1" />
                    Start
                  </Button>
                )}
                {device.status === 'ACTIVE' && (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleDeviceControl(device.id, 'PAUSE')}
                    >
                      <PauseCircle className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      className="flex-1"
                      onClick={() => handleDeviceControl(device.id, 'STOP')}
                    >
                      <Power className="h-4 w-4 mr-1" />
                      Stop
                    </Button>
                  </>
                )}
                {device.status === 'ERROR' && (
                  <Button 
                    size="sm" 
                    variant="default" 
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Diagnose
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Task Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Task Queue</CardTitle>
          <CardDescription>
            Upcoming and in-progress automation tasks ({queuedTasks} queued)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasks.slice(0, 15).map((task) => (
              <div 
                key={task.id}
                className="flex items-center justify-between border-b pb-3 last:border-0"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    <span className="font-medium text-gray-900">{task.taskType}</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Assigned to: {task.deviceName}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xs text-gray-600">Duration</div>
                    <div className="text-sm font-medium">
                      {task.actualDuration 
                        ? `${task.actualDuration}min` 
                        : `Est. ${task.estimatedDuration}min`
                      }
                    </div>
                  </div>
                  <Badge
                    variant={
                      task.status === 'COMPLETED' ? 'default' :
                      task.status === 'FAILED' ? 'destructive' :
                      task.status === 'IN_PROGRESS' ? 'secondary' :
                      'outline'
                    }
                  >
                    {task.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
