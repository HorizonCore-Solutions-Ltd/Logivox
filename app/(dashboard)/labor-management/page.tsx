/**
 * Labor Management Dashboard
 * Comprehensive UI for time tracking, productivity monitoring, and labor cost analysis
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Clock, 
  TrendingUp, 
  DollarSign,
  Activity,
  CheckCircle,
  AlertCircle,
  CalendarDays,
  Timer,
  BarChart3
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

interface TimeEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  clockIn: string;
  clockOut?: string;
  hoursWorked: number;
  regularHours: number;
  overtimeHours: number;
  status: 'CLOCKED_IN' | 'CLOCKED_OUT' | 'BREAK';
  shift: string;
  department: string;
}

interface ActivityLog {
  id: string;
  employeeId: string;
  employeeName: string;
  activity: string;
  duration: number;
  unitsProcessed: number;
  productivity: number;
  timestamp: string;
  zone: string;
}

interface EmployeePerformance {
  employeeId: string;
  employeeName: string;
  department: string;
  hoursToday: number;
  unitsProcessed: number;
  productivity: number;
  efficiency: number;
  attendance: number;
  status: 'ACTIVE' | 'IDLE' | 'BREAK' | 'OFFLINE';
}

interface LaborStats {
  totalEmployees: number;
  clockedIn: number;
  onBreak: number;
  avgHoursPerEmployee: number;
  totalLaborCost: number;
  avgLaborCost: number;
  productivityRate: number;
  utilizationRate: number;
  overtimeHours: number;
  attendanceRate: number;
}

interface LaborCostBreakdown {
  department: string;
  employees: number;
  hours: number;
  regularCost: number;
  overtimeCost: number;
  totalCost: number;
}

export default function LaborManagementDashboard() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [employees, setEmployees] = useState<EmployeePerformance[]>([]);
  const [stats, setStats] = useState<LaborStats | null>(null);
  const [costBreakdown, setCostBreakdown] = useState<LaborCostBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
    // Poll for updates every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load time entries
      const entriesResponse = await fetch('/api/labor-management?action=time-entries');
      const entriesData = await entriesResponse.json();
      setTimeEntries(entriesData.entries || []);

      // Load statistics
      const statsResponse = await fetch('/api/labor-management?action=statistics');
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Load activities
      const activitiesResponse = await fetch('/api/labor-management?action=activities');
      const activitiesData = await activitiesResponse.json();
      setActivities(activitiesData.activities || []);

      // Load productivity
      const productivityResponse = await fetch('/api/labor-management?action=productivity');
      const productivityData = await productivityResponse.json();
      setEmployees(productivityData.employees || []);

      // Load labor cost
      const costResponse = await fetch('/api/labor-management?action=labor-cost');
      const costData = await costResponse.json();
      setCostBreakdown(costData.breakdown || []);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const clockIn = async (employeeId: string) => {
    try {
      const response = await fetch('/api/labor-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clock-in',
          employeeId,
          warehouseId: 'default-warehouse'
        })
      });

      if (response.ok) {
        loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to clock in:', error);
    }
  };

  const clockOut = async (employeeId: string) => {
    try {
      const response = await fetch('/api/labor-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clock-out',
          employeeId
        })
      });

      if (response.ok) {
        loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to clock out:', error);
    }
  };

  const recordActivity = async (employeeId: string, activity: string, units: number) => {
    try {
      const response = await fetch('/api/labor-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record-activity',
          employeeId,
          activityType: activity,
          unitsProcessed: units,
          duration: 60 // minutes
        })
      });

      if (response.ok) {
        loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to record activity:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { variant: 'success' as const, icon: CheckCircle },
      CLOCKED_IN: { variant: 'success' as const, icon: CheckCircle },
      IDLE: { variant: 'warning' as const, icon: Clock },
      BREAK: { variant: 'warning' as const, icon: Timer },
      CLOCKED_OUT: { variant: 'secondary' as const, icon: AlertCircle },
      OFFLINE: { variant: 'destructive' as const, icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.OFFLINE;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading labor management dashboard...</p>
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
            <Users className="h-8 w-8" />
            Labor Management
          </h1>
          <p className="text-muted-foreground">
            Track time, monitor productivity, and analyze labor costs
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clocked In</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.clockedIn}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalEmployees} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Productivity</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.productivityRate}</div>
              <p className="text-xs text-muted-foreground">
                units/hour average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilization</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.utilizationRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Overall utilization
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Labor Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalLaborCost.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground">
                ${stats.avgLaborCost.toFixed(2)}/employee
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overtime</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overtimeHours.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                hours today
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="time-clock">Time Clock</TabsTrigger>
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="cost">Labor Cost</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Currently Clocked In</CardTitle>
                <CardDescription>Active employees</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeEntries.filter(e => e.status === 'CLOCKED_IN').slice(0, 5).map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.employeeName}</TableCell>
                        <TableCell>{entry.department}</TableCell>
                        <TableCell>{entry.hoursWorked.toFixed(1)}h</TableCell>
                        <TableCell>{getStatusBadge(entry.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Highest productivity today</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Units</TableHead>
                      <TableHead>Productivity</TableHead>
                      <TableHead>Efficiency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.sort((a, b) => b.productivity - a.productivity).slice(0, 5).map((emp) => (
                      <TableRow key={emp.employeeId}>
                        <TableCell className="font-medium">{emp.employeeName}</TableCell>
                        <TableCell>{emp.unitsProcessed}</TableCell>
                        <TableCell className="font-bold">{emp.productivity.toFixed(0)}</TableCell>
                        <TableCell>
                          <Progress value={emp.efficiency} className="h-2 w-16" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="time-clock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Time Entries</CardTitle>
              <CardDescription>All employee time records</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Regular Hours</TableHead>
                    <TableHead>Overtime</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.employeeName}</TableCell>
                      <TableCell>{entry.department}</TableCell>
                      <TableCell>{entry.shift}</TableCell>
                      <TableCell>{new Date(entry.clockIn).toLocaleTimeString()}</TableCell>
                      <TableCell>
                        {entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString() : '-'}
                      </TableCell>
                      <TableCell>{entry.regularHours.toFixed(1)}h</TableCell>
                      <TableCell>{entry.overtimeHours.toFixed(1)}h</TableCell>
                      <TableCell>{getStatusBadge(entry.status)}</TableCell>
                      <TableCell>
                        {entry.status === 'CLOCKED_IN' && (
                          <Button size="sm" onClick={() => clockOut(entry.employeeId)}>
                            Clock Out
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

        <TabsContent value="productivity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employee Productivity</CardTitle>
              <CardDescription>Performance metrics and efficiency</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Productivity</TableHead>
                    <TableHead>Efficiency</TableHead>
                    <TableHead>Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.employeeId}>
                      <TableCell className="font-medium">{emp.employeeName}</TableCell>
                      <TableCell>{emp.department}</TableCell>
                      <TableCell>{getStatusBadge(emp.status)}</TableCell>
                      <TableCell>{emp.hoursToday.toFixed(1)}h</TableCell>
                      <TableCell>{emp.unitsProcessed}</TableCell>
                      <TableCell className="text-lg font-bold">
                        {emp.productivity.toFixed(0)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={emp.efficiency} className="h-2 w-16" />
                          <span className="text-sm">{emp.efficiency.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={emp.attendance} className="h-2 w-16" />
                          <span className="text-sm">{emp.attendance.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>Detailed activity tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Productivity</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">{activity.employeeName}</TableCell>
                      <TableCell>{activity.activity}</TableCell>
                      <TableCell>{activity.zone}</TableCell>
                      <TableCell>{formatDuration(activity.duration)}</TableCell>
                      <TableCell>{activity.unitsProcessed}</TableCell>
                      <TableCell className="font-bold">
                        {activity.productivity.toFixed(0)}
                      </TableCell>
                      <TableCell>
                        {new Date(activity.timestamp).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cost" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Labor Cost Breakdown</CardTitle>
              <CardDescription>Department-wise labor cost analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Regular Cost</TableHead>
                    <TableHead>Overtime Cost</TableHead>
                    <TableHead>Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costBreakdown.map((dept, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{dept.department}</TableCell>
                      <TableCell>{dept.employees}</TableCell>
                      <TableCell>{dept.hours.toFixed(1)}h</TableCell>
                      <TableCell>${dept.regularCost.toFixed(2)}</TableCell>
                      <TableCell>${dept.overtimeCost.toFixed(2)}</TableCell>
                      <TableCell className="text-lg font-bold">
                        ${dept.totalCost.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>TOTAL</TableCell>
                    <TableCell>
                      {costBreakdown.reduce((sum, d) => sum + d.employees, 0)}
                    </TableCell>
                    <TableCell>
                      {costBreakdown.reduce((sum, d) => sum + d.hours, 0).toFixed(1)}h
                    </TableCell>
                    <TableCell>
                      ${costBreakdown.reduce((sum, d) => sum + d.regularCost, 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      ${costBreakdown.reduce((sum, d) => sum + d.overtimeCost, 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      ${costBreakdown.reduce((sum, d) => sum + d.totalCost, 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Overview</CardTitle>
              <CardDescription>Employee attendance tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-4xl font-bold">{stats?.attendanceRate.toFixed(1)}%</div>
                <p className="text-sm text-muted-foreground">Overall attendance rate</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {stats?.clockedIn} of {stats?.totalEmployees} employees present
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
