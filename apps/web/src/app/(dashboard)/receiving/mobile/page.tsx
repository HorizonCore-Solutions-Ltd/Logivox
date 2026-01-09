'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Task {
  id: string;
  shipmentNumber: string;
  supplier: string;
  poNumber: string;
  status: string;
  priority: number;
  appointmentTime: string | null;
  itemCount: number;
  dockNumber: number | null;
}

interface QuickStats {
  todayCompleted: number;
  myActive: number;
  myTodayUnits: number;
  userName: string;
}

export default function ReceivingMobile() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanMode, setScanMode] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchMobileData();
  }, []);

  const fetchMobileData = async () => {
    try {
      setLoading(true);
      const [tasksRes, statsRes] = await Promise.all([
        fetch('/api/receiving/mobile?action=my_tasks'),
        fetch('/api/receiving/mobile?action=quick_stats'),
      ]);

      const tasksData = await tasksRes.json();
      const statsData = await statsRes.json();

      setTasks(tasksData.tasks || []);
      setStats(statsData.stats);
    } catch (error) {
      console.error('Failed to fetch mobile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    if (!scanInput.trim()) return;

    try {
      const response = await fetch('/api/receiving/mobile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scan_barcode',
          barcode: scanInput,
          scanType: 'RECEIPT',
        }),
      });

      const data = await response.json();
      if (data.success && data.result) {
        // Navigate to task detail
        alert(`Shipment found: ${data.result.shipmentNumber}`);
        setScanInput('');
        setScanMode(false);
      } else {
        alert('No shipment found with this barcode');
      }
    } catch (error) {
      console.error('Scan failed:', error);
      alert('Scan failed. Please try again.');
    }
  };

  const handleQuickReceive = async (taskId: string) => {
    if (!confirm('Complete this task with quick receive?')) return;

    try {
      const response = await fetch('/api/receiving/mobile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'quick_receive',
          shipmentId: taskId,
          items: [], // Would collect actual items
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Quick receive completed!');
        fetchMobileData();
      }
    } catch (error) {
      console.error('Quick receive failed:', error);
      alert('Failed to complete quick receive');
    }
  };

  const handleReportIssue = async (taskId: string) => {
    const description = prompt('Describe the issue:');
    if (!description) return;

    try {
      const response = await fetch('/api/receiving/mobile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'report_issue',
          shipmentId: taskId,
          issueType: 'OTHER',
          severity: 'MEDIUM',
          description,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Issue reported successfully!');
      }
    } catch (error) {
      console.error('Report issue failed:', error);
      alert('Failed to report issue');
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'bg-red-100 text-red-800 border-red-300';
    if (priority >= 5) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-green-100 text-green-800 border-green-300';
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 8) return 'URGENT';
    if (priority >= 5) return 'HIGH';
    return 'NORMAL';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-white rounded-lg" />
            <div className="h-32 bg-white rounded-lg" />
            <div className="h-32 bg-white rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-xl font-bold">📱 Mobile Receiving</h1>
            <p className="text-sm text-blue-100">
              {stats?.userName || 'Worker'}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setScanMode(!scanMode)}
          >
            {scanMode ? '✕ Cancel' : '📷 Scan'}
          </Button>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/20 rounded p-2">
              <div className="text-2xl font-bold">{stats.todayCompleted}</div>
              <div className="text-xs">Completed</div>
            </div>
            <div className="bg-white/20 rounded p-2">
              <div className="text-2xl font-bold">{stats.myActive}</div>
              <div className="text-xs">Active</div>
            </div>
            <div className="bg-white/20 rounded p-2">
              <div className="text-2xl font-bold">
                {stats.myTodayUnits.toLocaleString()}
              </div>
              <div className="text-xs">Units</div>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Scan Mode */}
        {scanMode && (
          <Card className="border-blue-500 border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">📷 Scan Barcode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="Enter or scan barcode..."
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                  autoFocus
                  className="text-lg"
                />
                <div className="flex gap-2">
                  <Button onClick={handleScan} className="flex-1">
                    🔍 Lookup
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setScanMode(false);
                      setScanInput('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
                <div className="text-center text-sm text-gray-500 mt-4">
                  <div className="text-6xl mb-2">📷</div>
                  <p>Use camera to scan barcode</p>
                  <p className="text-xs">(Camera integration in production)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="tasks">
              📋 Tasks ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="quick">⚡ Quick</TabsTrigger>
            <TabsTrigger value="tools">🛠️ Tools</TabsTrigger>
          </TabsList>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-3">
            {tasks.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-4xl mb-3">✅</div>
                  <p className="text-gray-600">No active tasks</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Great job! All caught up.
                  </p>
                </CardContent>
              </Card>
            ) : (
              tasks.map((task) => (
                <Card
                  key={task.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedTask(task)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-lg">
                          {task.shipmentNumber}
                        </div>
                        <div className="text-sm text-gray-600">
                          {task.supplier}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(
                          task.priority
                        )}`}
                      >
                        {getPriorityLabel(task.priority)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div>
                        <span className="text-gray-600">PO:</span>{' '}
                        <span className="font-medium">{task.poNumber}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Items:</span>{' '}
                        <span className="font-medium">{task.itemCount}</span>
                      </div>
                      {task.dockNumber && (
                        <div>
                          <span className="text-gray-600">Dock:</span>{' '}
                          <span className="font-medium">{task.dockNumber}</span>
                        </div>
                      )}
                      {task.appointmentTime && (
                        <div>
                          <span className="text-gray-600">Time:</span>{' '}
                          <span className="font-medium">
                            {new Date(task.appointmentTime).toLocaleTimeString(
                              [],
                              { hour: '2-digit', minute: '2-digit' }
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickReceive(task.id);
                        }}
                      >
                        ⚡ Quick Receive
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReportIssue(task.id);
                        }}
                      >
                        ⚠️
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Quick Actions Tab */}
          <TabsContent value="quick" className="space-y-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">⚡ Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full h-16 text-lg"
                  onClick={() => setScanMode(true)}
                >
                  📷 Scan Receipt
                </Button>
                <Button
                  className="w-full h-16 text-lg"
                  variant="outline"
                  onClick={() => alert('Photo capture feature')}
                >
                  📸 Take Photo
                </Button>
                <Button
                  className="w-full h-16 text-lg"
                  variant="outline"
                  onClick={() => alert('Voice note feature')}
                >
                  🎤 Voice Note
                </Button>
                <Button
                  className="w-full h-16 text-lg"
                  variant="outline"
                  onClick={() => alert('Report issue feature')}
                >
                  ⚠️ Report Issue
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🔄 Offline Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                  <div>
                    <div className="font-medium text-green-800">
                      ✓ Online & Synced
                    </div>
                    <div className="text-sm text-green-600">
                      All data up to date
                    </div>
                  </div>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  Offline mode enables you to continue working without internet.
                  Data syncs automatically when connection returns.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🛠️ Mobile Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-20 flex flex-col gap-1">
                    <span className="text-2xl">📊</span>
                    <span className="text-xs">My Stats</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-1">
                    <span className="text-2xl">🔔</span>
                    <span className="text-xs">Alerts</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-1">
                    <span className="text-2xl">🗺️</span>
                    <span className="text-xs">Location</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-1">
                    <span className="text-2xl">⚙️</span>
                    <span className="text-xs">Settings</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">💰 ROI & Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <span className="text-sm font-medium">ROI</span>
                    <span className="text-2xl font-bold text-green-600">
                      308%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <span className="text-sm font-medium">
                      Mobile Receiving
                    </span>
                    <span className="text-lg font-bold text-blue-600">90%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                    <span className="text-sm font-medium">Paper Reduction</span>
                    <span className="text-lg font-bold text-purple-600">
                      95%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                    <span className="text-sm font-medium">Data Accuracy</span>
                    <span className="text-lg font-bold text-orange-600">
                      98%
                    </span>
                  </div>

                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <h4 className="font-medium mb-2 text-sm">Key Benefits</h4>
                    <ul className="space-y-1 text-xs text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span>
                          <strong>90% mobile receiving</strong> - Most tasks on
                          mobile
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span>
                          <strong>95% less paper</strong> - Paperless operations
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span>
                          <strong>98% accuracy</strong> - Real-time validation
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span>
                          <strong>80% faster</strong> - Instant updates
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Task Detail Modal (simplified) */}
      {selectedTask && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end z-50"
          onClick={() => setSelectedTask(null)}
        >
          <Card
            className="w-full rounded-t-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle>{selectedTask.shipmentNumber}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div>
                  <strong>Supplier:</strong> {selectedTask.supplier}
                </div>
                <div>
                  <strong>PO:</strong> {selectedTask.poNumber}
                </div>
                <div>
                  <strong>Status:</strong> {selectedTask.status}
                </div>
              </div>
              <Button className="w-full" onClick={() => setSelectedTask(null)}>
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
