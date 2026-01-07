'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, Activity, BarChart3 } from 'lucide-react';

interface SPCData {
  dataPoints: Array<{
    id: string;
    value: number;
    timestamp: string;
    sampleNumber: number;
  }>;
  controlLimits: {
    centerLine: number;
    ucl: number;
    lcl: number;
    sigma: number;
  };
  cpk: number;
  ppk: number;
  outOfControlPoints: string[];
  westernElectricViolations: Array<{
    rule: number;
    description: string;
    pointIds: string[];
    severity: 'WARNING' | 'CRITICAL';
  }>;
  inControl: boolean;
}

export default function SPCDashboard() {
  const [measurementType, setMeasurementType] = useState('');
  const [productId, setProductId] = useState('');
  const [dateRange, setDateRange] = useState('30');
  const [spcData, setSpcData] = useState<SPCData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadSPCData = async () => {
    if (!measurementType) {
      setError('Please select a measurement type');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const params = new URLSearchParams({
        measurementType,
        ...(productId && { productId }),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const response = await fetch(`/api/qc/spc/calculate?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load SPC data');
      }

      setSpcData(result.data);
    } catch (err: any) {
      setError(err.message);
      setSpcData(null);
    } finally {
      setLoading(false);
    }
  };

  // Transform data for charting
  const chartData = spcData?.dataPoints.map(point => ({
    sampleNumber: point.sampleNumber,
    value: point.value,
    ucl: spcData.controlLimits.ucl,
    lcl: spcData.controlLimits.lcl,
    centerLine: spcData.controlLimits.centerLine,
    isOutOfControl: spcData.outOfControlPoints.includes(point.id)
  })) || [];

  // Get CPK interpretation
  const getCPKInterpretation = (cpk: number) => {
    if (cpk >= 1.67) return { text: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' };
    if (cpk >= 1.33) return { text: 'Good', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (cpk >= 1.00) return { text: 'Adequate', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { text: 'Poor', color: 'text-red-600', bg: 'bg-red-50' };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Statistical Process Control (SPC)</h1>
          <p className="text-muted-foreground">Monitor process stability and capability</p>
        </div>
        <Button onClick={() => window.location.href = '/dashboard/qc'}>
          Back to QC Dashboard
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Control Chart Parameters</CardTitle>
          <CardDescription>Select measurement type and date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Measurement Type</Label>
              <Select value={measurementType} onValueChange={setMeasurementType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIMENSION">Dimension</SelectItem>
                  <SelectItem value="WEIGHT">Weight</SelectItem>
                  <SelectItem value="TEMPERATURE">Temperature</SelectItem>
                  <SelectItem value="PRESSURE">Pressure</SelectItem>
                  <SelectItem value="TORQUE">Torque</SelectItem>
                  <SelectItem value="HARDNESS">Hardness</SelectItem>
                  <SelectItem value="THICKNESS">Thickness</SelectItem>
                  <SelectItem value="VISUAL">Visual (Count)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Product ID (Optional)</Label>
              <Input
                placeholder="Enter product ID"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              />
            </div>

            <div>
              <Label>Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="180">Last 6 months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={loadSPCData} disabled={loading} className="w-full">
                {loading ? 'Loading...' : 'Generate Chart'}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* SPC Results */}
      {spcData && (
        <>
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Process Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {spcData.inControl ? (
                    <>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                      <div>
                        <div className="text-2xl font-bold text-green-600">In Control</div>
                        <p className="text-xs text-muted-foreground">Stable process</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-8 h-8 text-red-600" />
                      <div>
                        <div className="text-2xl font-bold text-red-600">Out of Control</div>
                        <p className="text-xs text-muted-foreground">Action required</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">CPK (Capability)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getCPKInterpretation(spcData.cpk).color}`}>
                  {spcData.cpk.toFixed(2)}
                </div>
                <p className={`text-sm ${getCPKInterpretation(spcData.cpk).color}`}>
                  {getCPKInterpretation(spcData.cpk).text}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PPK: {spcData.ppk.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Sample Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{spcData.dataPoints.length}</div>
                <p className="text-xs text-muted-foreground">
                  Out of control: {spcData.outOfControlPoints.length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Rule Violations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {spcData.westernElectricViolations.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Critical: {spcData.westernElectricViolations.filter(v => v.severity === 'CRITICAL').length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Control Chart */}
          <Card>
            <CardHeader>
              <CardTitle>X-bar Control Chart</CardTitle>
              <CardDescription>
                UCL: {spcData.controlLimits.ucl.toFixed(2)} | 
                Mean: {spcData.controlLimits.centerLine.toFixed(2)} | 
                LCL: {spcData.controlLimits.lcl.toFixed(2)} | 
                σ: {spcData.controlLimits.sigma.toFixed(2)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="sampleNumber" 
                    label={{ value: 'Sample Number', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    label={{ value: 'Measurement Value', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip />
                  <Legend />
                  
                  {/* Control limits */}
                  <ReferenceLine 
                    y={spcData.controlLimits.ucl} 
                    stroke="red" 
                    strokeDasharray="5 5" 
                    label="UCL"
                  />
                  <ReferenceLine 
                    y={spcData.controlLimits.centerLine} 
                    stroke="green" 
                    strokeDasharray="5 5" 
                    label="Mean"
                  />
                  <ReferenceLine 
                    y={spcData.controlLimits.lcl} 
                    stroke="red" 
                    strokeDasharray="5 5" 
                    label="LCL"
                  />
                  
                  {/* Data line */}
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#2563eb" 
                    strokeWidth={2}
                    dot={(props: any) => {
                      const isOutOfControl = chartData[props.index]?.isOutOfControl;
                      return (
                        <circle 
                          cx={props.cx} 
                          cy={props.cy} 
                          r={isOutOfControl ? 6 : 4} 
                          fill={isOutOfControl ? 'red' : '#2563eb'} 
                          stroke="white"
                          strokeWidth={2}
                        />
                      );
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Western Electric Violations */}
          {spcData.westernElectricViolations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                  Western Electric Rule Violations
                </CardTitle>
                <CardDescription>
                  Process anomalies detected by statistical rules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {spcData.westernElectricViolations.map((violation, idx) => (
                    <Alert 
                      key={idx} 
                      variant={violation.severity === 'CRITICAL' ? 'destructive' : 'default'}
                    >
                      <AlertDescription>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-semibold">Rule {violation.rule}:</span>{' '}
                            {violation.description}
                            <p className="text-xs mt-1 text-muted-foreground">
                              Affected points: {violation.pointIds.length}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            violation.severity === 'CRITICAL' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {violation.severity}
                          </span>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Process Capability Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Process Capability Analysis</CardTitle>
              <CardDescription>Short-term vs Long-term capability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">CPK (Short-term Capability)</h3>
                  <div className={`p-4 rounded-lg ${getCPKInterpretation(spcData.cpk).bg}`}>
                    <div className={`text-3xl font-bold ${getCPKInterpretation(spcData.cpk).color}`}>
                      {spcData.cpk.toFixed(3)}
                    </div>
                    <p className={`text-sm font-medium ${getCPKInterpretation(spcData.cpk).color}`}>
                      {getCPKInterpretation(spcData.cpk).text} Process
                    </p>
                    <div className="mt-3 space-y-1 text-xs">
                      <p>• ≥ 1.67: Excellent (6σ quality)</p>
                      <p>• ≥ 1.33: Good (4σ quality)</p>
                      <p>• ≥ 1.00: Adequate (3σ quality)</p>
                      <p>• &lt; 1.00: Poor (improvement needed)</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">PPK (Long-term Performance)</h3>
                  <div className={`p-4 rounded-lg ${getCPKInterpretation(spcData.ppk).bg}`}>
                    <div className={`text-3xl font-bold ${getCPKInterpretation(spcData.ppk).color}`}>
                      {spcData.ppk.toFixed(3)}
                    </div>
                    <p className={`text-sm font-medium ${getCPKInterpretation(spcData.ppk).color}`}>
                      {getCPKInterpretation(spcData.ppk).text} Performance
                    </p>
                    <div className="mt-3 text-xs space-y-1">
                      <p>CPK vs PPK Ratio: {(spcData.cpk / spcData.ppk).toFixed(2)}</p>
                      <p className="text-muted-foreground">
                        {spcData.cpk < spcData.ppk * 0.9 
                          ? '⚠️ Process may have shifted over time'
                          : '✓ Process is stable'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
