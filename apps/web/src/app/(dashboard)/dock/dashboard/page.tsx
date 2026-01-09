'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DockDashboard() {
  const [loading, setLoading] = useState(true);
  const [realTimeData, setRealTimeData] = useState<any>(null);

  useEffect(() => {
    // Simulate real-time data loading
    const fetchData = () => {
      setRealTimeData({
        activeDocks: 5,
        activeLoads: 8,
        completedToday: 23,
        avgLoadTime: 42,
        docks: [
          { id: 'DOCK-01', status: 'LOADING', shipment: 'SHIP-001', progress: 65, startTime: '08:15', carrier: 'UPS' },
          { id: 'DOCK-02', status: 'LOADING', shipment: 'SHIP-002', progress: 30, startTime: '09:00', carrier: 'FedEx' },
          { id: 'DOCK-03', status: 'AVAILABLE', shipment: null, progress: 0, startTime: null, carrier: null },
          { id: 'DOCK-04', status: 'LOADING', shipment: 'SHIP-003', progress: 85, startTime: '07:30', carrier: 'XPO' },
          { id: 'DOCK-05', status: 'CHECKING', shipment: 'SHIP-004', progress: 100, startTime: '08:00', carrier: 'Swift' },
          { id: 'DOCK-06', status: 'AVAILABLE', shipment: null, progress: 0, startTime: null, carrier: null },
        ],
      });
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">📊 Real-time Dock Dashboard</h1>
        <p className="text-gray-600">Live monitoring and performance analytics</p>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Docks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{realTimeData.activeDocks}</div>
            <div className="text-sm text-gray-600 mt-1">of 6 docks</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Loads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{realTimeData.activeLoads}</div>
            <div className="text-sm text-gray-600 mt-1">in progress</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{realTimeData.completedToday}</div>
            <div className="text-sm text-gray-600 mt-1">shipments</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Load Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{realTimeData.avgLoadTime}m</div>
            <div className="text-sm text-gray-600 mt-1">per load</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="live" className="space-y-4">
        <TabsList>
          <TabsTrigger value="live">📡 Live Status</TabsTrigger>
          <TabsTrigger value="analytics">📈 Analytics</TabsTrigger>
          <TabsTrigger value="mobile">📱 Mobile App</TabsTrigger>
          <TabsTrigger value="roi">💰 Combined ROI</TabsTrigger>
        </TabsList>

        {/* Live Status */}
        <TabsContent value="live" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {realTimeData.docks.map((dock: any) => (
              <Card key={dock.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-lg font-bold">{dock.id}</div>
                      <div className={`text-sm px-2 py-1 rounded inline-block mt-1 ${
                        dock.status === 'LOADING' ? 'bg-blue-100 text-blue-800' :
                        dock.status === 'CHECKING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {dock.status}
                      </div>
                    </div>
                    {dock.status !== 'AVAILABLE' && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{dock.progress}%</div>
                        <div className="text-xs text-gray-600">Complete</div>
                      </div>
                    )}
                  </div>

                  {dock.shipment && (
                    <>
                      <div className="space-y-2 text-sm mb-3">
                        <div><span className="text-gray-600">Shipment:</span> <span className="font-medium">{dock.shipment}</span></div>
                        <div><span className="text-gray-600">Carrier:</span> <span className="font-medium">{dock.carrier}</span></div>
                        <div><span className="text-gray-600">Started:</span> <span className="font-medium">{dock.startTime}</span></div>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${dock.progress}%` }}
                        />
                      </div>
                    </>
                  )}

                  {dock.status === 'AVAILABLE' && (
                    <div className="text-center text-gray-500 py-4">Ready for loading</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>📊 Dock Performance Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded">
                    <div className="text-2xl font-bold text-green-600">92%</div>
                    <div className="text-sm text-gray-600">Dock Utilization</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">45min</div>
                    <div className="text-sm text-gray-600">Avg Turnaround Time</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded">
                    <div className="text-2xl font-bold text-purple-600">98.5%</div>
                    <div className="text-sm text-gray-600">On-time Performance</div>
                  </div>
                  <div className="p-4 bg-orange-50 rounded">
                    <div className="text-2xl font-bold text-orange-600">156</div>
                    <div className="text-sm text-gray-600">Loads This Week</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🎯 Key Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Throughput Efficiency</span>
                      <span className="font-medium">94%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Load Accuracy</span>
                      <span className="font-medium">97%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '97%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Safety Compliance</span>
                      <span className="font-medium">100%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Documentation Complete</span>
                      <span className="font-medium">96%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: '96%' }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>📈 Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-green-600">↑ 12%</div>
                  <div className="text-sm text-gray-600 mt-1">Throughput vs Last Month</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-blue-600">↓ 18%</div>
                  <div className="text-sm text-gray-600 mt-1">Load Time Reduction</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-purple-600">↑ 8%</div>
                  <div className="text-sm text-gray-600 mt-1">Accuracy Improvement</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-orange-600">↓ 65%</div>
                  <div className="text-sm text-gray-600 mt-1">Error Rate Decrease</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mobile App */}
        <TabsContent value="mobile" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>📱 Mobile Operations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded">
                    <div className="font-medium mb-2">Driver Mobile App</div>
                    <ul className="text-sm space-y-1 text-gray-700">
                      <li>• Self-check-in at kiosk</li>
                      <li>• Real-time dock assignment</li>
                      <li>• Loading progress updates</li>
                      <li>• Digital document signing</li>
                      <li>• Instant BOL delivery</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-green-50 rounded">
                    <div className="font-medium mb-2">Warehouse Staff App</div>
                    <ul className="text-sm space-y-1 text-gray-700">
                      <li>• Mobile scanning & verification</li>
                      <li>• Loading task assignments</li>
                      <li>• Quality control checks</li>
                      <li>• Issue reporting</li>
                      <li>• Real-time dashboard</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-purple-50 rounded">
                    <div className="font-medium mb-2">Supervisor App</div>
                    <ul className="text-sm space-y-1 text-gray-700">
                      <li>• Live dock monitoring</li>
                      <li>• Staff assignment</li>
                      <li>• Performance analytics</li>
                      <li>• Issue resolution</li>
                      <li>• Reporting & insights</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>📊 Mobile App Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-green-50 rounded">
                    <div className="text-3xl font-bold text-green-600">87%</div>
                    <div className="text-sm text-gray-600 mt-1">Driver App Adoption</div>
                  </div>

                  <div className="text-center p-4 bg-blue-50 rounded">
                    <div className="text-3xl font-bold text-blue-600">100%</div>
                    <div className="text-sm text-gray-600 mt-1">Staff Using Mobile</div>
                  </div>

                  <div className="text-center p-4 bg-purple-50 rounded">
                    <div className="text-3xl font-bold text-purple-600">4.8★</div>
                    <div className="text-sm text-gray-600 mt-1">App Store Rating</div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded">
                    <div className="font-medium mb-3">App Benefits</div>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span><strong>75% faster check-in</strong> - Self-service kiosk</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span><strong>100% paperless</strong> - Digital documents</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span><strong>Real-time visibility</strong> - Live updates</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Combined ROI */}
        <TabsContent value="roi" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Combined Investment (Systems 8-10)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Real-time Dashboard Development</span>
                    <span className="font-medium">$32,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Analytics Platform</span>
                    <span className="font-medium">$28,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Mobile App Development</span>
                    <span className="font-medium">$45,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Monitoring Hardware</span>
                    <span className="font-medium">$18,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Training & Rollout</span>
                    <span className="font-medium">$7,000</span>
                  </div>
                  <div className="flex justify-between py-3 bg-blue-50 -mx-4 px-4">
                    <span className="font-bold">Total Investment</span>
                    <span className="font-bold text-lg">$130,000</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Combined Annual Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Improved Throughput</span>
                    <span className="font-medium text-green-600">$185,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Labor Optimization</span>
                    <span className="font-medium text-green-600">$145,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Error Reduction</span>
                    <span className="font-medium text-green-600">$98,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Mobile Efficiency</span>
                    <span className="font-medium text-green-600">$82,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Data-Driven Decisions</span>
                    <span className="font-medium text-green-600">$65,000</span>
                  </div>
                  <div className="flex justify-between py-3 bg-green-50 -mx-4 px-4">
                    <span className="font-bold">Total Annual Savings</span>
                    <span className="font-bold text-lg text-green-600">$575,000</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>🎉 Complete Dock Module ROI Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded">
                  <div className="text-3xl font-bold text-green-600">442%</div>
                  <div className="text-sm text-gray-600 mt-1">ROI (Systems 8-10)</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded">
                  <div className="text-3xl font-bold text-blue-600">2.7</div>
                  <div className="text-sm text-gray-600 mt-1">Payback (months)</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded">
                  <div className="text-3xl font-bold text-purple-600">100%</div>
                  <div className="text-sm text-gray-600 mt-1">Digital Operations</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded">
                  <div className="text-3xl font-bold text-orange-600">95%</div>
                  <div className="text-sm text-gray-600 mt-1">Staff Satisfaction</div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-300">
                <h3 className="font-bold text-lg mb-3 text-green-800">🎊 COMPLETE DOCK MODULE TOTALS</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">$600K</div>
                    <div className="text-sm text-gray-600">Total Investment</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">$2.9M</div>
                    <div className="text-sm text-gray-600">Annual Savings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">483%</div>
                    <div className="text-sm text-gray-600">Average ROI</div>
                  </div>
                </div>
                
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 text-lg">✓</span>
                    <span><strong>10 Complete Systems</strong> - Scheduling, Planning, Staging, Verification, Carrier Mgmt, Labels, BOL, Dashboard, Analytics, Mobile</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 text-lg">✓</span>
                    <span><strong>100% Digital Transformation</strong> - Paperless operations across all dock processes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 text-lg">✓</span>
                    <span><strong>Real-time Visibility</strong> - Live monitoring and mobile access for all stakeholders</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 text-lg">✓</span>
                    <span><strong>Data-Driven Decisions</strong> - Advanced analytics and performance tracking</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
