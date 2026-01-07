'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Download } from 'lucide-react';

interface Cause {
  id: string;
  text: string;
  category: string;
}

const FISHBONE_CATEGORIES = [
  { name: 'Man (People)', color: '#3b82f6' },
  { name: 'Machine (Equipment)', color: '#10b981' },
  { name: 'Material', color: '#f59e0b' },
  { name: 'Method (Process)', color: '#8b5cf6' },
  { name: 'Measurement', color: '#ec4899' },
  { name: 'Environment (Mother Nature)', color: '#14b8a6' }
];

export default function FishboneDiagram() {
  const [problem, setProblem] = useState('');
  const [causes, setCauses] = useState<Cause[]>([]);
  const [newCause, setNewCause] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const addCause = () => {
    if (newCause.trim() && selectedCategory) {
      const cause: Cause = {
        id: Date.now().toString(),
        text: newCause,
        category: selectedCategory
      };
      setCauses([...causes, cause]);
      setNewCause('');
    }
  };

  const removeCause = (id: string) => {
    setCauses(causes.filter(c => c.id !== id));
  };

  const getCausesByCategory = (category: string) => {
    return causes.filter(c => c.category === category);
  };

  const exportDiagram = () => {
    const data = {
      problem,
      causes: causes.map(c => ({
        category: c.category,
        cause: c.text
      })),
      createdAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fishbone-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Fishbone Diagram (Ishikawa)</h1>
        <p className="text-muted-foreground">Root cause analysis using 6M method</p>
      </div>

      {/* Problem Statement */}
      <Card>
        <CardHeader>
          <CardTitle>Problem Statement</CardTitle>
          <CardDescription>Define the effect/problem you're investigating</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="e.g., Increased defect rate in product assembly"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            className="text-lg"
          />
        </CardContent>
      </Card>

      {/* Add Cause */}
      <Card>
        <CardHeader>
          <CardTitle>Add Root Cause</CardTitle>
          <CardDescription>Identify contributing factors in each category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5">
              <Label>Cause Description</Label>
              <Input
                placeholder="Describe the root cause..."
                value={newCause}
                onChange={(e) => setNewCause(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCause()}
              />
            </div>
            <div className="md:col-span-5">
              <Label>Category (6M)</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {FISHBONE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.name} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 flex items-end">
              <Button onClick={addCause} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fishbone Visualization */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fishbone Diagram</CardTitle>
              <CardDescription>Visual representation of root causes</CardDescription>
            </div>
            <Button variant="outline" onClick={exportDiagram} disabled={!problem || causes.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative bg-gray-50 rounded-lg p-8 min-h-[600px]">
            {/* Main Spine */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-800 transform -translate-y-1/2" />

            {/* Problem (Fish Head) */}
            <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
              <div className="bg-blue-600 text-white px-6 py-4 rounded-lg shadow-lg max-w-xs">
                <p className="font-bold text-center">
                  {problem || 'Define Problem Statement'}
                </p>
              </div>
            </div>

            {/* Categories (Bones) - Top */}
            <div className="absolute top-0 left-0 right-20 h-1/2 flex justify-around items-end">
              {FISHBONE_CATEGORIES.slice(0, 3).map((category, idx) => (
                <div key={category.name} className="relative" style={{ width: '30%' }}>
                  {/* Bone line */}
                  <div 
                    className="absolute bottom-0 left-1/2 w-0.5 h-32 origin-bottom transform -rotate-45"
                    style={{ backgroundColor: category.color }}
                  />
                  
                  {/* Category label */}
                  <div 
                    className="absolute -top-2 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded text-white text-sm font-semibold whitespace-nowrap"
                    style={{ backgroundColor: category.color }}
                  >
                    {category.name}
                  </div>

                  {/* Causes */}
                  <div className="absolute -top-20 left-0 right-0 space-y-2">
                    {getCausesByCategory(category.name).map((cause) => (
                      <div
                        key={cause.id}
                        className="bg-white p-2 rounded shadow-sm border text-xs flex items-center justify-between group"
                      >
                        <span className="flex-1">{cause.text}</span>
                        <button
                          onClick={() => removeCause(cause.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 ml-2"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Categories (Bones) - Bottom */}
            <div className="absolute bottom-0 left-0 right-20 h-1/2 flex justify-around items-start">
              {FISHBONE_CATEGORIES.slice(3, 6).map((category, idx) => (
                <div key={category.name} className="relative" style={{ width: '30%' }}>
                  {/* Bone line */}
                  <div 
                    className="absolute top-0 left-1/2 w-0.5 h-32 origin-top transform rotate-45"
                    style={{ backgroundColor: category.color }}
                  />
                  
                  {/* Category label */}
                  <div 
                    className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded text-white text-sm font-semibold whitespace-nowrap"
                    style={{ backgroundColor: category.color }}
                  >
                    {category.name}
                  </div>

                  {/* Causes */}
                  <div className="absolute top-8 left-0 right-0 space-y-2">
                    {getCausesByCategory(category.name).map((cause) => (
                      <div
                        key={cause.id}
                        className="bg-white p-2 rounded shadow-sm border text-xs flex items-center justify-between group"
                      >
                        <span className="flex-1">{cause.text}</span>
                        <button
                          onClick={() => removeCause(cause.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 ml-2"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cause Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Root Cause Summary</CardTitle>
          <CardDescription>All identified causes by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {FISHBONE_CATEGORIES.map((category) => {
              const categoryCauses = getCausesByCategory(category.name);
              if (categoryCauses.length === 0) return null;

              return (
                <div key={category.name}>
                  <Badge style={{ backgroundColor: category.color }} className="text-white mb-2">
                    {category.name} ({categoryCauses.length})
                  </Badge>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {categoryCauses.map((cause) => (
                      <li key={cause.id} className="text-sm">{cause.text}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {causes.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No causes added yet. Start adding root causes above.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
