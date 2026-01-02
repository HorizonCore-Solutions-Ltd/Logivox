'use client';

/**
 * Chart Components for LogiVox Reports
 * 
 * Data visualization using Recharts library.
 * Supports: Bar, Line, Pie, Area, and Combo charts.
 */

import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ChartType } from '@/lib/reports/report-types';

// ============================================================================
// Types
// ============================================================================

export interface ChartData {
  [key: string]: any;
}

export interface ReportChartProps {
  data: ChartData[];
  type: ChartType;
  xAxisKey?: string;
  yAxisKeys?: string[];
  width?: number | string;
  height?: number;
  title?: string;
}

// ============================================================================
// Chart Colors
// ============================================================================

const CHART_COLORS = [
  '#0066cc', // Primary blue
  '#00b894', // Green
  '#6c5ce7', // Purple
  '#fdcb6e', // Yellow
  '#e17055', // Orange
  '#74b9ff', // Light blue
  '#a29bfe', // Light purple
  '#ffeaa7', // Light yellow
  '#fab1a0', // Light orange
  '#81ecec', // Cyan
];

// ============================================================================
// Main Chart Component
// ============================================================================

export function ReportChart({
  data,
  type,
  xAxisKey,
  yAxisKeys = [],
  width = '100%',
  height = 400,
  title,
}: ReportChartProps) {
  // Auto-detect keys if not provided
  const firstRow = data.length > 0 ? data[0] : undefined;
  const autoXAxisKey = xAxisKey || (firstRow ? Object.keys(firstRow)[0] || '' : '');
  const autoYAxisKeys =
    yAxisKeys.length > 0
      ? yAxisKeys
      : firstRow
      ? Object.keys(firstRow).filter((key) => key !== autoXAxisKey)
      : [];

  // Render appropriate chart type
  const renderChart = () => {
    switch (type) {
      case ChartType.BAR:
        return (
          <BarChartComponent
            data={data}
            xAxisKey={autoXAxisKey}
            yAxisKeys={autoYAxisKeys}
            height={height}
          />
        );

      case ChartType.LINE:
        return (
          <LineChartComponent
            data={data}
            xAxisKey={autoXAxisKey}
            yAxisKeys={autoYAxisKeys}
            height={height}
          />
        );

      case ChartType.PIE:
        return (
          <PieChartComponent
            data={data}
            nameKey={autoXAxisKey}
            valueKey={autoYAxisKeys[0] || ''}
            height={height}
          />
        );

      case ChartType.AREA:
        return (
          <AreaChartComponent
            data={data}
            xAxisKey={autoXAxisKey}
            yAxisKeys={autoYAxisKeys}
            height={height}
          />
        );

      case ChartType.COMBO:
        return (
          <ComboChartComponent
            data={data}
            xAxisKey={autoXAxisKey}
            yAxisKeys={autoYAxisKeys}
            height={height}
          />
        );

      default:
        return (
          <div className="flex h-full items-center justify-center text-gray-500">
            Chart type not supported
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      {title && <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>}
      {renderChart()}
    </div>
  );
}

// ============================================================================
// Bar Chart Component
// ============================================================================

interface BarChartProps {
  data: ChartData[];
  xAxisKey: string;
  yAxisKeys: string[];
  height: number;
}

function BarChartComponent({ data, xAxisKey, yAxisKeys, height }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey={xAxisKey}
          stroke="#6b7280"
          tick={{ fill: '#6b7280', fontSize: 12 }}
        />
        <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
          }}
        />
        <Legend />
        {yAxisKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={CHART_COLORS[index % CHART_COLORS.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// Line Chart Component
// ============================================================================

interface LineChartProps {
  data: ChartData[];
  xAxisKey: string;
  yAxisKeys: string[];
  height: number;
}

function LineChartComponent({ data, xAxisKey, yAxisKeys, height }: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey={xAxisKey}
          stroke="#6b7280"
          tick={{ fill: '#6b7280', fontSize: 12 }}
        />
        <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
          }}
        />
        <Legend />
        {yAxisKeys.map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={CHART_COLORS[index % CHART_COLORS.length]}
            strokeWidth={2}
            dot={{ fill: CHART_COLORS[index % CHART_COLORS.length], r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// Pie Chart Component
// ============================================================================

interface PieChartProps {
  data: ChartData[];
  nameKey: string;
  valueKey: string;
  height: number;
}

function PieChartComponent({ data, nameKey, valueKey, height }: PieChartProps) {
  const RADIAN = Math.PI / 180;

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={Math.min(height * 0.35, 150)}
          fill="#8884d8"
          dataKey={valueKey}
          nameKey={nameKey}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// Area Chart Component
// ============================================================================

interface AreaChartProps {
  data: ChartData[];
  xAxisKey: string;
  yAxisKeys: string[];
  height: number;
}

function AreaChartComponent({ data, xAxisKey, yAxisKeys, height }: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <defs>
          {yAxisKeys.map((key, index) => (
            <linearGradient key={key} id={`color${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={CHART_COLORS[index % CHART_COLORS.length]}
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor={CHART_COLORS[index % CHART_COLORS.length]}
                stopOpacity={0}
              />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey={xAxisKey}
          stroke="#6b7280"
          tick={{ fill: '#6b7280', fontSize: 12 }}
        />
        <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
          }}
        />
        <Legend />
        {yAxisKeys.map((key, index) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stroke={CHART_COLORS[index % CHART_COLORS.length]}
            fillOpacity={1}
            fill={`url(#color${index})`}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// Combo Chart Component (Bar + Line)
// ============================================================================

interface ComboChartProps {
  data: ChartData[];
  xAxisKey: string;
  yAxisKeys: string[];
  height: number;
}

function ComboChartComponent({ data, xAxisKey, yAxisKeys, height }: ComboChartProps) {
  // Split keys: first half as bars, second half as lines
  const midPoint = Math.ceil(yAxisKeys.length / 2);
  const barKeys = yAxisKeys.slice(0, midPoint);
  const lineKeys = yAxisKeys.slice(midPoint);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey={xAxisKey}
          stroke="#6b7280"
          tick={{ fill: '#6b7280', fontSize: 12 }}
        />
        <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
          }}
        />
        <Legend />
        {barKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={CHART_COLORS[index % CHART_COLORS.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
        {lineKeys.map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={CHART_COLORS[(index + barKeys.length) % CHART_COLORS.length]}
            strokeWidth={2}
            dot={{ fill: CHART_COLORS[(index + barKeys.length) % CHART_COLORS.length], r: 4 }}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// Export Chart as Image
// ============================================================================

export function exportChartAsImage(chartElement: HTMLElement, filename: string): void {
  // In production, use html2canvas or similar library
  console.log('Export chart as image:', filename);
  alert('Chart export coming soon!');
}
