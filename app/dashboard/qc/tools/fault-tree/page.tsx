'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Download, AlertTriangle, GitBranch } from 'lucide-react';

type GateType = 'AND' | 'OR' | 'XOR' | 'BASIC_EVENT';

interface FaultTreeNode {
  id: string;
  label: string;
  type: GateType;
  probability?: number;
  description?: string;
  children: FaultTreeNode[];
}

export default function FaultTreeAnalysisPage() {
  const [topEvent, setTopEvent] = useState('System Failure');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newNodeType, setNewNodeType] = useState<GateType>('BASIC_EVENT');
  const [newNodeProbability, setNewNodeProbability] = useState('');
  const [newNodeDescription, setNewNodeDescription] = useState('');

  const [tree, setTree] = useState<FaultTreeNode>({
    id: 'root',
    label: 'System Failure',
    type: 'OR',
    children: [
      {
        id: '1',
        label: 'Hardware Failure',
        type: 'AND',
        children: [
          { id: '1.1', label: 'Power Supply Fails', type: 'BASIC_EVENT', probability: 0.05, children: [] },
          { id: '1.2', label: 'Component Overheats', type: 'BASIC_EVENT', probability: 0.03, children: [] },
        ],
      },
      {
        id: '2',
        label: 'Software Failure',
        type: 'OR',
        children: [
          { id: '2.1', label: 'Bug in Code', type: 'BASIC_EVENT', probability: 0.10, children: [] },
          { id: '2.2', label: 'Memory Leak', type: 'BASIC_EVENT', probability: 0.07, children: [] },
        ],
      },
    ],
  });

  const findNode = (node: FaultTreeNode, id: string): FaultTreeNode | null => {
    if (node.id === id) return node;
    for (const child of node.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
    return null;
  };

  const calculateProbability = (node: FaultTreeNode): number => {
    if (node.type === 'BASIC_EVENT') {
      return node.probability || 0;
    }

    if (node.children.length === 0) return 0;

    const childProbs = node.children.map(child => calculateProbability(child));

    switch (node.type) {
      case 'AND':
        return childProbs.reduce((acc, prob) => acc * prob, 1);
      case 'OR':
        return 1 - childProbs.reduce((acc, prob) => acc * (1 - prob), 1);
      case 'XOR':
        // Simplified XOR: exactly one event occurs
        const allFail = childProbs.reduce((acc, prob) => acc * (1 - prob), 1);
        const anySucceed = 1 - allFail;
        return anySucceed * 0.5; // Simplified approximation
      default:
        return 0;
    }
  };

  const addNode = () => {
    if (!selectedNode || !newNodeLabel) return;

    const newNode: FaultTreeNode = {
      id: `${selectedNode}.${Date.now()}`,
      label: newNodeLabel,
      type: newNodeType,
      probability: newNodeProbability ? parseFloat(newNodeProbability) : undefined,
      description: newNodeDescription || undefined,
      children: [],
    };

    const addToNode = (node: FaultTreeNode): FaultTreeNode => {
      if (node.id === selectedNode) {
        return { ...node, children: [...node.children, newNode] };
      }
      return { ...node, children: node.children.map(addToNode) };
    };

    setTree(addToNode(tree));
    setNewNodeLabel('');
    setNewNodeProbability('');
    setNewNodeDescription('');
  };

  const removeNode = (nodeId: string) => {
    const removeFromNode = (node: FaultTreeNode): FaultTreeNode => {
      return {
        ...node,
        children: node.children
          .filter(child => child.id !== nodeId)
          .map(removeFromNode),
      };
    };

    setTree(removeFromNode(tree));
    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }
  };

  const renderNode = (node: FaultTreeNode, level: number = 0): JSX.Element => {
    const probability = calculateProbability(node);
    const isSelected = selectedNode === node.id;

    return (
      <div key={node.id} className="space-y-2">
        <div
          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
            isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'
          }`}
          style={{ marginLeft: `${level * 24}px` }}
          onClick={() => setSelectedNode(node.id)}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {node.type !== 'BASIC_EVENT' && <GitBranch className="h-4 w-4 text-gray-400" />}
              <span className="font-semibold">{node.label}</span>
              <Badge variant={node.type === 'BASIC_EVENT' ? 'secondary' : 'default'}>
                {node.type}
              </Badge>
            </div>
            {node.description && (
              <p className="text-xs text-muted-foreground mt-1">{node.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold">
                {(probability * 100).toFixed(2)}%
              </div>
              <div className="text-xs text-muted-foreground">Probability</div>
            </div>
            {node.id !== 'root' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  removeNode(node.id);
                }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>
        </div>
        {node.children.map(child => renderNode(child, level + 1))}
      </div>
    );
  };

  const exportToJson = () => {
    const json = JSON.stringify(tree, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fault-tree-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const topEventProbability = calculateProbability(tree);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fault Tree Analysis</h1>
          <p className="text-muted-foreground">
            Build and analyze logical fault trees to identify system failure modes
          </p>
        </div>
        <Button onClick={exportToJson}>
          <Download className="h-4 w-4 mr-2" />
          Export JSON
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tree View */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Event Summary */}
          <Card className="border-2 border-orange-200 bg-orange-50/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
                <div className="flex-1">
                  <CardTitle>Top Event: {tree.label}</CardTitle>
                  <CardDescription>Total system failure probability</CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-orange-600">
                    {(topEventProbability * 100).toFixed(3)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Failure Probability</div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Fault Tree */}
          <Card>
            <CardHeader>
              <CardTitle>Fault Tree Structure</CardTitle>
              <CardDescription>Click a node to select it, then add children</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {renderNode(tree)}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle>Gate Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-semibold">AND Gate</div>
                  <p className="text-sm text-muted-foreground">
                    All child events must occur (multiply probabilities)
                  </p>
                </div>
                <div>
                  <div className="font-semibold">OR Gate</div>
                  <p className="text-sm text-muted-foreground">
                    Any child event causes failure (1 - Π(1 - Pi))
                  </p>
                </div>
                <div>
                  <div className="font-semibold">XOR Gate</div>
                  <p className="text-sm text-muted-foreground">
                    Exactly one event occurs (simplified calculation)
                  </p>
                </div>
                <div>
                  <div className="font-semibold">Basic Event</div>
                  <p className="text-sm text-muted-foreground">
                    Leaf node with explicit probability value
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Add Node */}
          <Card>
            <CardHeader>
              <CardTitle>Add Node</CardTitle>
              <CardDescription>
                {selectedNode
                  ? `Adding to: ${findNode(tree, selectedNode)?.label}`
                  : 'Select a node to add children'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Event Label</Label>
                <Input
                  placeholder="e.g., Sensor Failure"
                  value={newNodeLabel}
                  onChange={(e) => setNewNodeLabel(e.target.value)}
                  disabled={!selectedNode}
                />
              </div>

              <div>
                <Label>Gate Type</Label>
                <Select value={newNodeType} onValueChange={(v) => setNewNodeType(v as GateType)} disabled={!selectedNode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">AND Gate</SelectItem>
                    <SelectItem value="OR">OR Gate</SelectItem>
                    <SelectItem value="XOR">XOR Gate</SelectItem>
                    <SelectItem value="BASIC_EVENT">Basic Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newNodeType === 'BASIC_EVENT' && (
                <div>
                  <Label>Probability (0-1)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    placeholder="e.g., 0.05"
                    value={newNodeProbability}
                    onChange={(e) => setNewNodeProbability(e.target.value)}
                    disabled={!selectedNode}
                  />
                </div>
              )}

              <div>
                <Label>Description (Optional)</Label>
                <Textarea
                  placeholder="Additional context..."
                  value={newNodeDescription}
                  onChange={(e) => setNewNodeDescription(e.target.value)}
                  disabled={!selectedNode}
                  rows={2}
                />
              </div>

              <Button
                onClick={addNode}
                className="w-full"
                disabled={!selectedNode || !newNodeLabel}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Node
              </Button>
            </CardContent>
          </Card>

          {/* Analysis Tips */}
          <Card>
            <CardHeader>
              <CardTitle>FTA Best Practices</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Start with a clearly defined top event</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Use AND gates when all events must occur</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Use OR gates when any event causes failure</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Basic events should have measurable probabilities</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Analyze minimal cut sets (combinations leading to failure)</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
