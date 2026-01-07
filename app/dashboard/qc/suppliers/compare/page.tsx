'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  qualityScore: number;
  deliveryScore: number;
  costScore: number;
  responsiveScore: number;
  complianceScore: number;
  overallScore: number;
  onTimeDelivery: number;
  defectRate: number;
  avgLeadTime: number;
  priceVariance: number;
  activeNCRs: number;
  resolvedNCRs: number;
  certifications: string[];
}

const mockSuppliers: Supplier[] = [
  {
    id: 'SUP001',
    name: 'Acme Manufacturing Co.',
    qualityScore: 95,
    deliveryScore: 92,
    costScore: 88,
    responsiveScore: 90,
    complianceScore: 94,
    overallScore: 91.8,
    onTimeDelivery: 97.5,
    defectRate: 0.8,
    avgLeadTime: 14,
    priceVariance: -2.1,
    activeNCRs: 1,
    resolvedNCRs: 12,
    certifications: ['ISO 9001', 'ISO 14001', 'AS9100'],
  },
  {
    id: 'SUP002',
    name: 'Global Parts Ltd.',
    qualityScore: 88,
    deliveryScore: 94,
    costScore: 92,
    responsiveScore: 87,
    complianceScore: 90,
    overallScore: 90.2,
    onTimeDelivery: 96.0,
    defectRate: 1.2,
    avgLeadTime: 12,
    priceVariance: 1.5,
    activeNCRs: 2,
    resolvedNCRs: 18,
    certifications: ['ISO 9001'],
  },
  {
    id: 'SUP003',
    name: 'Precision Components Inc.',
    qualityScore: 92,
    deliveryScore: 85,
    costScore: 90,
    responsiveScore: 88,
    complianceScore: 91,
    overallScore: 89.2,
    onTimeDelivery: 89.5,
    defectRate: 0.9,
    avgLeadTime: 18,
    priceVariance: -1.2,
    activeNCRs: 4,
    resolvedNCRs: 15,
    certifications: ['ISO 9001', 'IATF 16949'],
  },
  {
    id: 'SUP004',
    name: 'Tech Solutions Corp.',
    qualityScore: 85,
    deliveryScore: 88,
    costScore: 85,
    responsiveScore: 92,
    complianceScore: 87,
    overallScore: 87.4,
    onTimeDelivery: 91.0,
    defectRate: 1.5,
    avgLeadTime: 16,
    priceVariance: 3.2,
    activeNCRs: 3,
    resolvedNCRs: 10,
    certifications: ['ISO 9001'],
  },
];

export default function SupplierComparisonPage() {
  const [supplier1Id, setSupplier1Id] = useState<string>(mockSuppliers[0].id);
  const [supplier2Id, setSupplier2Id] = useState<string>(mockSuppliers[1].id);

  const supplier1 = mockSuppliers.find(s => s.id === supplier1Id)!;
  const supplier2 = mockSuppliers.find(s => s.id === supplier2Id)!;

  const radarData = [
    {
      metric: 'Quality',
      [supplier1.name]: supplier1.qualityScore,
      [supplier2.name]: supplier2.qualityScore,
    },
    {
      metric: 'Delivery',
      [supplier1.name]: supplier1.deliveryScore,
      [supplier2.name]: supplier2.deliveryScore,
    },
    {
      metric: 'Cost',
      [supplier1.name]: supplier1.costScore,
      [supplier2.name]: supplier2.costScore,
    },
    {
      metric: 'Responsive',
      [supplier1.name]: supplier1.responsiveScore,
      [supplier2.name]: supplier2.responsiveScore,
    },
    {
      metric: 'Compliance',
      [supplier1.name]: supplier1.complianceScore,
      [supplier2.name]: supplier2.complianceScore,
    },
  ];

  const barData = [
    {
      metric: 'On-Time Delivery %',
      [supplier1.name]: supplier1.onTimeDelivery,
      [supplier2.name]: supplier2.onTimeDelivery,
    },
    {
      metric: 'Defect Rate %',
      [supplier1.name]: supplier1.defectRate,
      [supplier2.name]: supplier2.defectRate,
    },
    {
      metric: 'Avg Lead Time (days)',
      [supplier1.name]: supplier1.avgLeadTime,
      [supplier2.name]: supplier2.avgLeadTime,
    },
    {
      metric: 'Active NCRs',
      [supplier1.name]: supplier1.activeNCRs,
      [supplier2.name]: supplier2.activeNCRs,
    },
  ];

  const ComparisonRow = ({
    label,
    value1,
    value2,
    format = 'number',
    inverse = false,
  }: {
    label: string;
    value1: number;
    value2: number;
    format?: 'number' | 'percent' | 'days';
    inverse?: boolean;
  }) => {
    const better = inverse ? value1 < value2 : value1 > value2;
    const worse = inverse ? value1 > value2 : value1 < value2;

    const formatValue = (val: number) => {
      if (format === 'percent') return `${val}%`;
      if (format === 'days') return `${val} days`;
      return val;
    };

    return (
      <div className="grid grid-cols-3 gap-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <span className={better ? 'font-semibold text-green-600' : worse ? 'text-red-600' : ''}>
            {formatValue(value1)}
          </span>
          {better && <CheckCircle2 className="h-4 w-4 text-green-600" />}
          {worse && <AlertCircle className="h-4 w-4 text-red-600" />}
        </div>
        <div className="text-center font-medium text-muted-foreground">{label}</div>
        <div className="flex items-center justify-end gap-2">
          {value2 > value1 && !inverse && <CheckCircle2 className="h-4 w-4 text-green-600" />}
          {value2 < value1 && inverse && <CheckCircle2 className="h-4 w-4 text-green-600" />}
          {value2 > value1 && inverse && <AlertCircle className="h-4 w-4 text-red-600" />}
          {value2 < value1 && !inverse && <AlertCircle className="h-4 w-4 text-red-600" />}
          <span
            className={
              (!inverse && value2 > value1) || (inverse && value2 < value1)
                ? 'font-semibold text-green-600'
                : (!inverse && value2 < value1) || (inverse && value2 > value1)
                ? 'text-red-600'
                : ''
            }
          >
            {formatValue(value2)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Supplier Comparison</h1>
        <p className="text-muted-foreground">
          Side-by-side comparison of supplier performance metrics
        </p>
      </div>

      {/* Supplier Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Suppliers to Compare</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Supplier 1</label>
            <Select value={supplier1Id} onValueChange={setSupplier1Id}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mockSuppliers
                  .filter(s => s.id !== supplier2Id)
                  .map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Supplier 2</label>
            <Select value={supplier2Id} onValueChange={setSupplier2Id}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mockSuppliers
                  .filter(s => s.id !== supplier1Id)
                  .map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Overall Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{supplier1.name}</CardTitle>
            <CardDescription>{supplier1.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600">{supplier1.overallScore}</div>
              <div className="text-sm text-muted-foreground">Overall Score</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center flex-wrap gap-1">
                {supplier1.certifications.map(cert => (
                  <Badge key={cert} variant="outline">
                    {cert}
                  </Badge>
                ))}
                {supplier1.certifications.length === 0 && (
                  <span className="text-sm text-muted-foreground">No certifications</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{supplier2.name}</CardTitle>
            <CardDescription>{supplier2.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-5xl font-bold text-purple-600">{supplier2.overallScore}</div>
              <div className="text-sm text-muted-foreground">Overall Score</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center flex-wrap gap-1">
                {supplier2.certifications.map(cert => (
                  <Badge key={cert} variant="outline">
                    {cert}
                  </Badge>
                ))}
                {supplier2.certifications.length === 0 && (
                  <span className="text-sm text-muted-foreground">No certifications</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Radar</CardTitle>
          <CardDescription>Multi-dimensional performance comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name={supplier1.name}
                dataKey={supplier1.name}
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
              />
              <Radar
                name={supplier2.name}
                dataKey={supplier2.name}
                stroke="#a855f7"
                fill="#a855f7"
                fillOpacity={0.3}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Metrics Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 pb-3 border-b font-semibold">
            <div className="text-blue-600">{supplier1.name}</div>
            <div className="text-center text-muted-foreground">Metric</div>
            <div className="text-right text-purple-600">{supplier2.name}</div>
          </div>

          <ComparisonRow
            label="Overall Score"
            value1={supplier1.overallScore}
            value2={supplier2.overallScore}
          />
          <ComparisonRow
            label="Quality Score"
            value1={supplier1.qualityScore}
            value2={supplier2.qualityScore}
          />
          <ComparisonRow
            label="Delivery Score"
            value1={supplier1.deliveryScore}
            value2={supplier2.deliveryScore}
          />
          <ComparisonRow
            label="Cost Score"
            value1={supplier1.costScore}
            value2={supplier2.costScore}
          />
          <ComparisonRow
            label="Responsive Score"
            value1={supplier1.responsiveScore}
            value2={supplier2.responsiveScore}
          />
          <ComparisonRow
            label="On-Time Delivery"
            value1={supplier1.onTimeDelivery}
            value2={supplier2.onTimeDelivery}
            format="percent"
          />
          <ComparisonRow
            label="Defect Rate"
            value1={supplier1.defectRate}
            value2={supplier2.defectRate}
            format="percent"
            inverse
          />
          <ComparisonRow
            label="Avg Lead Time"
            value1={supplier1.avgLeadTime}
            value2={supplier2.avgLeadTime}
            format="days"
            inverse
          />
          <ComparisonRow
            label="Active NCRs"
            value1={supplier1.activeNCRs}
            value2={supplier2.activeNCRs}
            inverse
          />
          <ComparisonRow
            label="Resolved NCRs"
            value1={supplier1.resolvedNCRs}
            value2={supplier2.resolvedNCRs}
          />
        </CardContent>
      </Card>

      {/* Winner Card */}
      <Card className="border-2 border-green-200 bg-green-50/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-green-900">
                {supplier1.overallScore > supplier2.overallScore
                  ? supplier1.name
                  : supplier2.name}
              </h3>
              <p className="text-green-700">
                Leads with an overall score of{' '}
                {Math.max(supplier1.overallScore, supplier2.overallScore)} vs{' '}
                {Math.min(supplier1.overallScore, supplier2.overallScore)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">
                +{Math.abs(supplier1.overallScore - supplier2.overallScore).toFixed(1)}
              </div>
              <div className="text-sm text-green-700">Point Advantage</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
