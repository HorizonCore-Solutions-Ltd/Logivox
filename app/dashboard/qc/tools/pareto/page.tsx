'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { Plus, Trash2, Download, TrendingUp } from 'lucide-react';

interface DataItem {
  category: string;
  value: number;
}

export default function ParetoChartPage() {
  const [data, setData] = useState<DataItem[]>([
    { category: 'Defect Type A', value: 45 },
    { category: 'Defect Type B', value: 30 },
    { category: 'Defect Type C', value: 15 },
    { category: 'Defect Type D', value: 7 },
    { category: 'Defect Type E', value: 3 },
  ]);

  const [newCategory, setNewCategory] = useState('');
  const [newValue, setNewValue] = useState('');

  // Calculate Pareto data
  const paretoData = useMemo(() => {
    // Sort by value descending
    const sorted = [...data].sort((a, b) => b.value - a.value);
    
    // Calculate cumulative percentage
    const total = sorted.reduce((sum, item) => sum + item.value, 0);
    let cumulative = 0;
    
    return sorted.map(item => {
      cumulative += item.value;
      const cumulativePercent = (cumulative / total) * 100;
      const percentage = (item.value / total) * 100;
      
      return {
        category: item.category,
        value: item.value,
        percentage: Math.round(percentage * 10) / 10,
        cumulative: Math.round(cumulativePercent * 10) / 10,
      };
    });
  }, [data]);

  // Find 80% threshold
  const eightyPercentIndex = paretoData.findIndex(item => item.cumulative >= 80);

  const handleAdd = () => {
    if (newCategory && newValue && !isNaN(parseFloat(newValue))) {
      setData([...data, { category: newCategory, value: parseFloat(newValue) }]);
      setNewCategory('');
      setNewValue('');
    }
  };

  const handleRemove = (category: string) => {
    setData(data.filter(item => item.category !== category));
  };

  const handleExport = () => {
    const csv = [
      ['Category', 'Value', 'Percentage', 'Cumulative %'].join(','),
      ...paretoData.map(item =>
        [item.category, item.value, item.percentage, item.cumulative].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pareto-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const vitalFew = paretoData.slice(0, eightyPercentIndex + 1);
  const trivialMany = paretoData.slice(eightyPercentIndex + 1);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pareto Chart Analysis</h1>
          <p className="text-muted-foreground">
            Identify the vital few causes that contribute to most problems (80/20 rule)
          </p>
        </div>
        <Button onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pareto Chart</CardTitle>
              <CardDescription>
                Bars show frequency, line shows cumulative percentage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={paretoData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="category"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                  />
                  <YAxis yAxisId="left" label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} label={{ value: 'Cumulative %', angle: 90, position: 'insideRight' }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="value" fill="#3b82f6" name="Frequency" />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#ef4444"
                    strokeWidth={3}
                    name="Cumulative %"
                    dot={{ r: 5 }}
                  />
                  {/* 80% reference line */}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    data={paretoData.map(d => ({ ...d, eightyPercent: 80 }))}
                    dataKey="eightyPercent"
                    stroke="#16a34a"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="80% Threshold"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left font-semibold">Category</th>
                      <th className="p-3 text-right font-semibold">Count</th>
                      <th className="p-3 text-right font-semibold">%</th>
                      <th className="p-3 text-right font-semibold">Cumulative %</th>
                      <th className="p-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paretoData.map((item, index) => (
                      <tr
                        key={item.category}
                        className={`border-b ${
                          index <= eightyPercentIndex ? 'bg-green-50' : ''
                        }`}
                      >
                        <td className="p-3">
                          {item.category}
                          {index <= eightyPercentIndex && (
                            <span className="ml-2 text-xs font-semibold text-green-600">
                              VITAL FEW
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">{item.value}</td>
                        <td className="p-3 text-right">{item.percentage}%</td>
                        <td className="p-3 text-right font-semibold">{item.cumulative}%</td>
                        <td className="p-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemove(item.category)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Add Data */}
          <Card>
            <CardHeader>
              <CardTitle>Add Data Point</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Category Name</Label>
                <Input
                  placeholder="e.g., Defect Type F"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
              </div>
              <div>
                <Label>Count/Value</Label>
                <Input
                  type="number"
                  placeholder="e.g., 10"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                />
              </div>
              <Button onClick={handleAdd} className="w-full" disabled={!newCategory || !newValue}>
                <Plus className="h-4 w-4 mr-2" />
                Add Data Point
              </Button>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Pareto Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-green-600 mb-2">Vital Few (80% Impact)</h4>
                <div className="space-y-1 text-sm">
                  {vitalFew.map(item => (
                    <div key={item.category} className="flex justify-between">
                      <span>{item.category}</span>
                      <span className="font-semibold">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Focus on these {vitalFew.length} categories for maximum impact
                </p>
              </div>

              {trivialMany.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-600 mb-2">Trivial Many</h4>
                  <p className="text-xs text-muted-foreground">
                    {trivialMany.length} categories contribute only{' '}
                    {Math.round((100 - (vitalFew[vitalFew.length - 1]?.cumulative || 0)) * 10) / 10}%
                    of the total impact
                  </p>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Recommendations</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Prioritize improvement efforts on the vital few categories</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Investigate root causes of top contributors</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Set aggressive reduction targets for vital few</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
