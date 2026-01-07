'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ArrowLeft, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CreateRisk() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [processArea, setProcessArea] = useState('');
  const [severity, setSeverity] = useState(5);
  const [occurrence, setOccurrence] = useState(5);
  const [detection, setDetection] = useState(5);
  const [owner, setOwner] = useState('');

  // Calculate RPN
  const rpn = severity * occurrence * detection;

  const getRPNColor = (rpn: number) => {
    if (rpn >= 200) return 'text-red-600 bg-red-50';
    if (rpn >= 125) return 'text-orange-600 bg-orange-50';
    if (rpn >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getRPNLevel = (rpn: number) => {
    if (rpn >= 200) return 'CRITICAL';
    if (rpn >= 125) return 'HIGH';
    if (rpn >= 50) return 'MEDIUM';
    return 'LOW';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/qc/risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          processArea,
          severity,
          occurrence,
          detection,
          owner,
          organizationId: 'org-1', // Would come from session
          createdBy: 'current-user' // Would come from session
        })
      });

      if (!response.ok) throw new Error('Failed to create risk');

      router.push('/dashboard/qc/risk');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">New Risk Assessment</h1>
          <p className="text-muted-foreground">ISO 9001:2015 Risk-Based Thinking</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Details</CardTitle>
            <CardDescription>Identify and describe the risk</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Risk Title *</Label>
              <Input
                placeholder="e.g., Supplier quality degradation"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Description *</Label>
              <Textarea
                placeholder="Detailed description of the risk..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROCESS">Process</SelectItem>
                    <SelectItem value="PRODUCT">Product</SelectItem>
                    <SelectItem value="SUPPLIER">Supplier</SelectItem>
                    <SelectItem value="REGULATORY">Regulatory</SelectItem>
                    <SelectItem value="SAFETY">Safety</SelectItem>
                    <SelectItem value="ENVIRONMENTAL">Environmental</SelectItem>
                    <SelectItem value="FINANCIAL">Financial</SelectItem>
                    <SelectItem value="OPERATIONAL">Operational</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Process Area</Label>
                <Input
                  placeholder="e.g., Receiving Inspection"
                  value={processArea}
                  onChange={(e) => setProcessArea(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Risk Owner *</Label>
              <Input
                placeholder="Person responsible for monitoring this risk"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Risk Assessment (RPN Calculation) */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Risk Assessment (RPN Calculator)</CardTitle>
            <CardDescription>
              Rate each factor from 1 (low) to 10 (high)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Severity */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Severity (Impact if risk occurs)</Label>
                <span className="text-2xl font-bold">{severity}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={severity}
                onChange={(e) => setSeverity(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1: Minor inconvenience</span>
                <span>10: Catastrophic impact</span>
              </div>
            </div>

            {/* Occurrence */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Occurrence (Likelihood of happening)</Label>
                <span className="text-2xl font-bold">{occurrence}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={occurrence}
                onChange={(e) => setOccurrence(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1: Very unlikely</span>
                <span>10: Almost certain</span>
              </div>
            </div>

            {/* Detection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Detection (Difficulty of detecting)</Label>
                <span className="text-2xl font-bold">{detection}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={detection}
                onChange={(e) => setDetection(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1: Easy to detect</span>
                <span>10: Cannot detect until failure</span>
              </div>
            </div>

            {/* RPN Result */}
            <div className={`p-6 rounded-lg ${getRPNColor(rpn)} border-2`}>
              <div className="text-center">
                <p className="text-sm font-medium mb-2">Risk Priority Number (RPN)</p>
                <div className="text-5xl font-bold mb-2">{rpn}</div>
                <div className="text-xl font-semibold mb-2">{getRPNLevel(rpn)} RISK</div>
                <p className="text-sm">
                  {rpn >= 200 && 'Immediate action required. Stop process if necessary.'}
                  {rpn >= 125 && rpn < 200 && 'Priority mitigation required within 30 days.'}
                  {rpn >= 50 && rpn < 125 && 'Mitigation recommended within 90 days.'}
                  {rpn < 50 && 'Monitor and review periodically.'}
                </p>
                <p className="text-xs mt-2 opacity-75">
                  Formula: Severity ({severity}) × Occurrence ({occurrence}) × Detection ({detection}) = {rpn}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end space-x-3 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              'Saving...'
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Risk Assessment
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
