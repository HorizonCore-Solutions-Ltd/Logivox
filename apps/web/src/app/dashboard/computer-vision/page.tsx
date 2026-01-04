'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Camera, 
  Eye, 
  CheckCircle2, 
  AlertTriangle,
  Package,
  Scan,
  TrendingUp,
  Zap,
  Image as ImageIcon,
  Upload,
  RefreshCw,
  Download,
  Play,
  Square,
  Maximize2
} from 'lucide-react';

interface CVScanResult {
  id: string;
  timestamp: string;
  scanType: 'CYCLE_COUNT' | 'DAMAGE_DETECTION' | 'PACKAGE_VERIFY' | 'DIMENSION' | 'LABEL_READ';
  location: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
  confidence: number;
  detectedItems: {
    sku: string;
    quantity: number;
    condition: 'GOOD' | 'DAMAGED' | 'UNKNOWN';
    confidence: number;
    boundingBox?: { x: number; y: number; w: number; h: number };
  }[];
  systemQuantity?: number;
  variance?: number;
  imageUrl: string;
  processingTime: number;
}

interface CVStats {
  totalScans: number;
  accuracyRate: number;
  avgConfidence: number;
  avgProcessingTime: number;
  variances: number;
  damagesDetected: number;
}

export default function ComputerVisionDashboard() {
  const [scans, setScans] = useState<CVScanResult[]>([]);
  const [stats, setStats] = useState<CVStats>({
    totalScans: 0,
    accuracyRate: 0,
    avgConfidence: 0,
    avgProcessingTime: 0,
    variances: 0,
    damagesDetected: 0,
  });
  const [loading, setLoading] = useState(false);
  const [activeCamera, setActiveCamera] = useState(false);
  const [selectedScanType, setSelectedScanType] = useState<string>('CYCLE_COUNT');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchScans();
    fetchStats();
  }, []);

  const fetchScans = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/computer-vision/scans');
      if (res.ok) {
        const data = await res.json();
        setScans(data);
      }
    } catch (error) {
      console.error('Error fetching CV scans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/computer-vision/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching CV stats:', error);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setActiveCamera(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Camera access denied. Please enable camera permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setActiveCamera(false);
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg');

    // Send to CV API for analysis
    try {
      setLoading(true);
      const res = await fetch('/api/computer-vision/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageData,
          scanType: selectedScanType,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setScans([result, ...scans]);
        fetchStats();
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'bg-green-100 text-green-800';
      case 'WARNING': return 'bg-yellow-100 text-yellow-800';
      case 'ERROR': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScanTypeLabel = (type: string) => {
    const labels = {
      CYCLE_COUNT: 'Cycle Count',
      DAMAGE_DETECTION: 'Damage Detection',
      PACKAGE_VERIFY: 'Package Verification',
      DIMENSION: 'Dimensioning',
      LABEL_READ: 'Label Reading',
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Computer Vision Intelligence</h1>
          <p className="text-gray-600 mt-1">
            AI-powered visual verification and automated inventory scanning
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchScans} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Scans
            </CardTitle>
            <Eye className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.totalScans.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Accuracy Rate
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {(stats.accuracyRate * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">AI confidence avg</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avg Confidence
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {(stats.avgConfidence * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Detection quality</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Processing Time
            </CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {stats.avgProcessingTime.toFixed(0)}ms
            </div>
            <p className="text-xs text-gray-500 mt-1">Avg per scan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Variances Found
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {stats.variances}
            </div>
            <p className="text-xs text-gray-500 mt-1">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Damages Detected
            </CardTitle>
            <Package className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {stats.damagesDetected}
            </div>
            <p className="text-xs text-gray-500 mt-1">Quality issues</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="live" className="space-y-4">
        <TabsList>
          <TabsTrigger value="live">
            <Camera className="h-4 w-4 mr-2" />
            Live Scanning
          </TabsTrigger>
          <TabsTrigger value="history">
            <ImageIcon className="h-4 w-4 mr-2" />
            Scan History
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Live Scanning Tab */}
        <TabsContent value="live" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Camera Feed */}
            <Card>
              <CardHeader>
                <CardTitle>Camera Feed</CardTitle>
                <CardDescription>Point camera at inventory to scan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  {activeCamera ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      {/* Scanning Overlay */}
                      <div className="absolute inset-0 border-4 border-green-500 opacity-50 pointer-events-none animate-pulse" />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Camera className="h-16 w-16 text-gray-600" />
                    </div>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                <div className="space-y-3">
                  <Select value={selectedScanType} onValueChange={setSelectedScanType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CYCLE_COUNT">Cycle Count</SelectItem>
                      <SelectItem value="DAMAGE_DETECTION">Damage Detection</SelectItem>
                      <SelectItem value="PACKAGE_VERIFY">Package Verification</SelectItem>
                      <SelectItem value="DIMENSION">Dimensioning</SelectItem>
                      <SelectItem value="LABEL_READ">Label Reading</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex gap-2">
                    {!activeCamera ? (
                      <Button onClick={startCamera} className="flex-1">
                        <Play className="h-4 w-4 mr-2" />
                        Start Camera
                      </Button>
                    ) : (
                      <>
                        <Button 
                          onClick={captureAndAnalyze} 
                          className="flex-1"
                          disabled={loading}
                        >
                          <Scan className="h-4 w-4 mr-2" />
                          {loading ? 'Analyzing...' : 'Capture & Analyze'}
                        </Button>
                        <Button onClick={stopCamera} variant="destructive">
                          <Square className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Latest Results */}
            <Card>
              <CardHeader>
                <CardTitle>Latest Scan Results</CardTitle>
                <CardDescription>Real-time AI analysis</CardDescription>
              </CardHeader>
              <CardContent>
                {scans.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No scans yet. Start camera to begin scanning.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scans.slice(0, 5).map((scan) => (
                      <div 
                        key={scan.id}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className={getStatusColor(scan.status)}>
                            {scan.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(scan.timestamp).toLocaleTimeString()}
                          </span>
                        </div>

                        <div>
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {getScanTypeLabel(scan.scanType)} - {scan.location}
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              Confidence: {(scan.confidence * 100).toFixed(0)}%
                            </span>
                            <span className="text-gray-600">
                              {scan.processingTime}ms
                            </span>
                          </div>
                        </div>

                        {scan.detectedItems.length > 0 && (
                          <div className="space-y-2">
                            {scan.detectedItems.map((item, idx) => (
                              <div 
                                key={idx}
                                className="flex items-center justify-between bg-gray-50 p-2 rounded"
                              >
                                <div>
                                  <div className="text-sm font-medium">{item.sku}</div>
                                  <div className="text-xs text-gray-600">
                                    Qty: {item.quantity} • {item.condition}
                                  </div>
                                </div>
                                <Progress 
                                  value={item.confidence * 100} 
                                  className="w-20"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {scan.variance !== undefined && scan.variance !== 0 && (
                          <div className="bg-yellow-50 border border-yellow-200 p-2 rounded">
                            <div className="flex items-center gap-2 text-sm text-yellow-800">
                              <AlertTriangle className="h-4 w-4" />
                              <span>
                                Variance: {scan.variance > 0 ? '+' : ''}{scan.variance} units
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Scan History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Scans</CardTitle>
              <CardDescription>Complete history of computer vision scans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scans.map((scan) => (
                  <div 
                    key={scan.id}
                    className="flex items-center gap-4 border-b pb-3 last:border-0"
                  >
                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {scan.imageUrl ? (
                        <img 
                          src={scan.imageUrl} 
                          alt="Scan" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {getScanTypeLabel(scan.scanType)}
                        </span>
                        <Badge variant="outline" className={getStatusColor(scan.status)}>
                          {scan.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {scan.location} • {scan.detectedItems.length} items • {(scan.confidence * 100).toFixed(0)}% confidence
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(scan.timestamp).toLocaleString()} • {scan.processingTime}ms
                      </div>
                    </div>

                    <Button variant="ghost" size="sm">
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Scan Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['CYCLE_COUNT', 'DAMAGE_DETECTION', 'PACKAGE_VERIFY', 'DIMENSION', 'LABEL_READ'].map(type => {
                    const count = scans.filter(s => s.scanType === type).length;
                    const percentage = scans.length > 0 ? (count / scans.length) * 100 : 0;
                    return (
                      <div key={type}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{getScanTypeLabel(type)}</span>
                          <span className="font-medium">{count} ({percentage.toFixed(0)}%)</span>
                        </div>
                        <Progress value={percentage} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['SUCCESS', 'WARNING', 'ERROR'].map(status => {
                    const count = scans.filter(s => s.status === status).length;
                    const percentage = scans.length > 0 ? (count / scans.length) * 100 : 0;
                    return (
                      <div key={status}>
                        <div className="flex justify-between text-sm mb-1">
                          <Badge variant="outline" className={getStatusColor(status)}>
                            {status}
                          </Badge>
                          <span className="font-medium">{count} ({percentage.toFixed(0)}%)</span>
                        </div>
                        <Progress value={percentage} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
