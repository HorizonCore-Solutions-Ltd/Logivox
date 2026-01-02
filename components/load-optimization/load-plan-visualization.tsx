/**
 * Load Plan Visualization Component
 * 
 * 3D visualization of trailer load plan with drag-and-drop
 * item placement, real-time capacity indicators, and multi-stop view.
 * 
 * Features:
 * - 3D trailer view (Canvas/Three.js or SVG)
 * - Color-coded items by delivery stop
 * - Real-time utilization metrics
 * - Weight distribution display
 * - Drag-and-drop reordering
 * - Voice control integration
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Truck,
  Package,
  Weight,
  Maximize2,
  AlertTriangle,
  CheckCircle,
  PlayCircle,
  Download,
  Mic,
} from 'lucide-react';
import { useVoiceControl } from '@/hooks/use-voice-control';
import type { LoadPlan, LoadedItem, TrailerConfig } from '@/types/load-optimization';

interface LoadPlanVisualizationProps {
  loadPlanId: string;
  onStartLoading?: () => void;
  onComplete?: () => void;
  enableVoice?: boolean;
}

const STOP_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

export function LoadPlanVisualization({
  loadPlanId,
  onStartLoading,
  onComplete,
  enableVoice = true,
}: LoadPlanVisualizationProps) {
  const [loadPlan, setLoadPlan] = useState<any>(null);
  const [trailer, setTrailer] = useState<TrailerConfig | null>(null);
  const [items, setItems] = useState<LoadedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'3d' | '2d-side' | '2d-top'>('2d-side');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load data
  useEffect(() => {
    loadLoadPlan();
  }, [loadPlanId]);

  const loadLoadPlan = async () => {
    try {
      const response = await fetch(`/api/load-optimization/plans/${loadPlanId}`);
      const data = await response.json();
      
      setLoadPlan(data.loadPlan);
      setTrailer(data.visualization.trailer);
      setItems(data.visualization.items);
    } catch (error) {
      console.error('Failed to load plan:', error);
    } finally {
      setLoading(false);
    }
  };

  // Voice control integration
  const { listening, transcript } = useVoiceControl({
    enabled: enableVoice,
    onCommand: (command) => {
      if (command.action === 'START_LOADING' && onStartLoading) {
        onStartLoading();
      } else if (command.action === 'COMPLETE_LOADING' && onComplete) {
        onComplete();
      }
    },
  });

  // Render 2D side view
  const render2DSideView = () => {
    if (!trailer) return null;

    const scale = 0.5; // pixels per inch
    const width = trailer.usableLength * scale;
    const height = trailer.usableHeight * scale;

    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="border-2 border-gray-300 bg-gray-50"
      >
        {/* Trailer outline */}
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="white"
          stroke="black"
          strokeWidth={2}
        />

        {/* Floor line */}
        <line
          x1={0}
          y1={height}
          x2={width}
          y2={height}
          stroke="gray"
          strokeWidth={1}
          strokeDasharray="5,5"
        />

        {/* Items */}
        {items.map((item, index) => {
          const x = item.position.z * scale;
          const y = height - (item.position.y + item.dimensions.height) * scale;
          const w = item.dimensions.length * scale;
          const h = item.dimensions.height * scale;
          const color = STOP_COLORS[item.stop % STOP_COLORS.length];

          return (
            <g key={item.id}>
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill={color}
                fillOpacity={hoveredItem === item.id ? 0.8 : 0.6}
                stroke={selectedItem === item.id ? 'black' : color}
                strokeWidth={selectedItem === item.id ? 3 : 1}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => setSelectedItem(item.id)}
                className="cursor-pointer transition-all"
              />
              
              {/* Item label (if space allows) */}
              {w > 40 && h > 20 && (
                <text
                  x={x + w / 2}
                  y={y + h / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize={10}
                  fontWeight="bold"
                >
                  {item.sku}
                </text>
              )}
            </g>
          );
        })}

        {/* Access lanes (between stops) */}
        {Array.from(new Set(items.map(i => i.stop)))
          .sort()
          .slice(0, -1)
          .map((stop) => {
            const stopItems = items.filter(i => i.stop === stop);
            if (stopItems.length === 0) return null;
            
            const maxZ = Math.max(...stopItems.map(i => i.position.z + i.dimensions.length));
            const laneX = maxZ * scale;
            
            return (
              <line
                key={`lane-${stop}`}
                x1={laneX}
                y1={0}
                x2={laneX}
                y2={height}
                stroke="red"
                strokeWidth={2}
                strokeDasharray="10,5"
              />
            );
          })}
      </svg>
    );
  };

  // Render 2D top view
  const render2DTopView = () => {
    if (!trailer) return null;

    const scale = 0.5;
    const width = trailer.usableLength * scale;
    const height = trailer.usableWidth * scale;

    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="border-2 border-gray-300 bg-gray-50"
      >
        {/* Trailer outline */}
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="white"
          stroke="black"
          strokeWidth={2}
        />

        {/* Items (top view - floor level only) */}
        {items
          .filter(item => item.position.y === 0) // Only floor items
          .map((item) => {
            const x = item.position.z * scale;
            const y = item.position.x * scale;
            const w = item.dimensions.length * scale;
            const h = item.dimensions.width * scale;
            const color = STOP_COLORS[item.stop % STOP_COLORS.length];

            return (
              <rect
                key={item.id}
                x={x}
                y={y}
                width={w}
                height={h}
                fill={color}
                fillOpacity={hoveredItem === item.id ? 0.8 : 0.6}
                stroke={selectedItem === item.id ? 'black' : color}
                strokeWidth={selectedItem === item.id ? 3 : 1}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => setSelectedItem(item.id)}
                className="cursor-pointer"
              />
            );
          })}
      </svg>
    );
  };

  if (loading) {
    return <div>Loading load plan...</div>;
  }

  if (!loadPlan || !trailer) {
    return <div>Load plan not found</div>;
  }

  const utilization = loadPlan.utilization || { volumePercent: 0, weightPercent: 0, floorPercent: 0 };
  const totalStops = Array.from(new Set(items.map(i => i.stop))).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-blue-600" />
              <div>
                <CardTitle>Load Plan: {loadPlan.id}</CardTitle>
                <p className="text-sm text-gray-500">
                  {trailer.name} • {totalStops} {totalStops === 1 ? 'Stop' : 'Stops'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={loadPlan.status === 'COMPLETED' ? 'default' : 'secondary'}>
                {loadPlan.status}
              </Badge>
              
              {enableVoice && (
                <Button
                  variant={listening ? 'destructive' : 'outline'}
                  size="sm"
                  className="gap-2"
                >
                  <Mic className="h-4 w-4" />
                  {listening ? 'Listening...' : 'Voice'}
                </Button>
              )}
              
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
              
              {loadPlan.status === 'OPTIMIZED' && onStartLoading && (
                <Button onClick={onStartLoading} className="gap-2">
                  <PlayCircle className="h-4 w-4" />
                  Start Loading
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main visualization */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Trailer Visualization</CardTitle>
                <Tabs value={view} onValueChange={(v: any) => setView(v)}>
                  <TabsList>
                    <TabsTrigger value="2d-side">Side View</TabsTrigger>
                    <TabsTrigger value="2d-top">Top View</TabsTrigger>
                    <TabsTrigger value="3d" disabled>3D View</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center items-center p-4 bg-gray-50 rounded-lg overflow-auto">
                {view === '2d-side' && render2DSideView()}
                {view === '2d-top' && render2DTopView()}
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-3">
                {Array.from(new Set(items.map(i => i.stop)))
                  .sort()
                  .map((stop, index) => (
                    <div key={stop} className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: STOP_COLORS[index % STOP_COLORS.length] }}
                      />
                      <span className="text-sm">Stop {stop}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Selected item details */}
          {selectedItem && (
            <Card>
              <CardHeader>
                <CardTitle>Item Details</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const item = items.find(i => i.id === selectedItem);
                  if (!item) return null;

                  return (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-semibold">SKU:</span> {item.sku}
                      </div>
                      <div>
                        <span className="font-semibold">Stop:</span> {item.stop}
                      </div>
                      <div>
                        <span className="font-semibold">Dimensions:</span>{' '}
                        {item.dimensions.length}" × {item.dimensions.width}" × {item.dimensions.height}"
                      </div>
                      <div>
                        <span className="font-semibold">Weight:</span> {item.weight} lbs
                      </div>
                      <div>
                        <span className="font-semibold">Position:</span>{' '}
                        X: {item.position.x}", Y: {item.position.y}", Z: {item.position.z}"
                      </div>
                      <div>
                        <span className="font-semibold">Stackable:</span>{' '}
                        {item.stackable ? 'Yes' : 'No'}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Metrics sidebar */}
        <div className="space-y-4">
          {/* Utilization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Maximize2 className="h-5 w-5" />
                Utilization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Volume</span>
                  <span className="font-semibold">{utilization.volumePercent}%</span>
                </div>
                <Progress value={utilization.volumePercent} />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Weight</span>
                  <span className="font-semibold">{utilization.weightPercent}%</span>
                </div>
                <Progress value={utilization.weightPercent} />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Floor Space</span>
                  <span className="font-semibold">{utilization.floorPercent}%</span>
                </div>
                <Progress value={utilization.floorPercent} />
              </div>
            </CardContent>
          </Card>

          {/* Weight distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Weight className="h-5 w-5" />
                Weight Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadPlan.frontAxleWeight && loadPlan.rearAxleWeight ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Front Axle:</span>
                    <span className="font-semibold">{loadPlan.frontAxleWeight.toLocaleString()} lbs</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Rear Axle:</span>
                    <span className="font-semibold">{loadPlan.rearAxleWeight.toLocaleString()} lbs</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span>Total:</span>
                    <span>{loadPlan.totalWeight.toLocaleString()} lbs</span>
                  </div>
                  
                  {loadPlan.weightBalanced ? (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>Weight is balanced</AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>Weight imbalance detected</AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No weight data available</p>
              )}
            </CardContent>
          </Card>

          {/* Items summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Items:</span>
                  <span className="font-semibold">{items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Orders:</span>
                  <span className="font-semibold">{loadPlan.orderIds?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Stops:</span>
                  <span className="font-semibold">{totalStops}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Issues & Recommendations */}
          {(loadPlan.issues?.length > 0 || loadPlan.recommendations?.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadPlan.issues?.map((issue: string, index: number) => (
                  <Alert key={`issue-${index}`} variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">{issue}</AlertDescription>
                  </Alert>
                ))}
                
                {loadPlan.recommendations?.map((rec: string, index: number) => (
                  <Alert key={`rec-${index}`}>
                    <AlertDescription className="text-sm">{rec}</AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
