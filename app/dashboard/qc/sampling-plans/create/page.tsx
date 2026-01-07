'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function CreateSamplingPlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    aqlLevel: '2.5',
    inspectionLevel: 'II',
    lotSizeMin: '',
    lotSizeMax: '',
    sampleSize: '',
    acceptNumber: '',
    rejectNumber: '',
    description: '',
    applicableProducts: '',
  });

  // AQL lookup table (simplified)
  const calculateSampleSize = () => {
    const lotSize = parseInt(formData.lotSizeMax) || 0;
    const level = formData.inspectionLevel;
    const aql = parseFloat(formData.aqlLevel);

    let code = '';
    let sampleSize = 0;
    let accept = 0;
    let reject = 0;

    // Simplified AQL table - in production, use full ANSI/ASQ Z1.4 tables
    if (level === 'II') {
      if (lotSize <= 90) {
        code = 'E';
        sampleSize = 13;
      } else if (lotSize <= 150) {
        code = 'F';
        sampleSize = 20;
      } else if (lotSize <= 280) {
        code = 'G';
        sampleSize = 32;
      } else if (lotSize <= 500) {
        code = 'H';
        sampleSize = 50;
      } else if (lotSize <= 1200) {
        code = 'J';
        sampleSize = 80;
      } else if (lotSize <= 3200) {
        code = 'K';
        sampleSize = 125;
      } else {
        code = 'L';
        sampleSize = 200;
      }
    }

    // Acceptance numbers based on AQL (simplified)
    if (aql === 0.65) {
      accept = 0;
      reject = 1;
    } else if (aql === 1.0) {
      accept = 0;
      reject = 1;
    } else if (aql === 1.5) {
      accept = 0;
      reject = 1;
    } else if (aql === 2.5) {
      accept = 1;
      reject = 2;
    } else if (aql === 4.0) {
      accept = 2;
      reject = 3;
    } else if (aql === 6.5) {
      accept = 3;
      reject = 4;
    }

    setFormData({
      ...formData,
      sampleSize: sampleSize.toString(),
      acceptNumber: accept.toString(),
      rejectNumber: reject.toString(),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/qc/sampling-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          lotSizeMin: parseInt(formData.lotSizeMin) || 0,
          lotSizeMax: parseInt(formData.lotSizeMax) || 0,
          sampleSize: parseInt(formData.sampleSize) || 0,
          acceptNumber: parseInt(formData.acceptNumber) || 0,
          rejectNumber: parseInt(formData.rejectNumber) || 0,
        }),
      });

      if (!response.ok) throw new Error('Failed to create sampling plan');

      const data = await response.json();
      router.push(`/dashboard/qc/sampling-plans/${data.id}`);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create sampling plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Sampling Plan</h1>
          <p className="text-muted-foreground">
            Define AQL-based statistical sampling for inspections
          </p>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Based on ANSI/ASQ Z1.4 acceptance sampling standard
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Plan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Electronics Components - General"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="When and how to use this plan..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="applicableProducts">Applicable Products</Label>
                <Input
                  id="applicableProducts"
                  value={formData.applicableProducts}
                  onChange={(e) => setFormData({ ...formData, applicableProducts: e.target.value })}
                  placeholder="Product categories or SKUs (comma-separated)"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AQL Parameters</CardTitle>
              <CardDescription>
                Define Acceptable Quality Level and inspection parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="aqlLevel">AQL Level * (%)</Label>
                  <Select
                    value={formData.aqlLevel}
                    onValueChange={(value) => setFormData({ ...formData, aqlLevel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.065">0.065% - Critical defects</SelectItem>
                      <SelectItem value="0.10">0.10% - Critical defects</SelectItem>
                      <SelectItem value="0.15">0.15% - Critical defects</SelectItem>
                      <SelectItem value="0.25">0.25% - Critical defects</SelectItem>
                      <SelectItem value="0.40">0.40% - Major defects</SelectItem>
                      <SelectItem value="0.65">0.65% - Major defects</SelectItem>
                      <SelectItem value="1.0">1.0% - Major defects</SelectItem>
                      <SelectItem value="1.5">1.5% - Major defects</SelectItem>
                      <SelectItem value="2.5">2.5% - Major defects (standard)</SelectItem>
                      <SelectItem value="4.0">4.0% - Minor defects</SelectItem>
                      <SelectItem value="6.5">6.5% - Minor defects</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inspectionLevel">Inspection Level *</Label>
                  <Select
                    value={formData.inspectionLevel}
                    onValueChange={(value) => setFormData({ ...formData, inspectionLevel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="S1">S-1 (Smallest sample)</SelectItem>
                      <SelectItem value="S2">S-2 (Smaller sample)</SelectItem>
                      <SelectItem value="S3">S-3 (Small sample)</SelectItem>
                      <SelectItem value="S4">S-4 (Reduced sample)</SelectItem>
                      <SelectItem value="I">I (Less discrimination)</SelectItem>
                      <SelectItem value="II">II (Normal - standard)</SelectItem>
                      <SelectItem value="III">III (More discrimination)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lotSizeMin">Lot Size Min *</Label>
                  <Input
                    id="lotSizeMin"
                    type="number"
                    required
                    value={formData.lotSizeMin}
                    onChange={(e) => setFormData({ ...formData, lotSizeMin: e.target.value })}
                    placeholder="e.g., 91"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lotSizeMax">Lot Size Max *</Label>
                  <Input
                    id="lotSizeMax"
                    type="number"
                    required
                    value={formData.lotSizeMax}
                    onChange={(e) => setFormData({ ...formData, lotSizeMax: e.target.value })}
                    onBlur={calculateSampleSize}
                    placeholder="e.g., 150"
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={calculateSampleSize}
                className="w-full"
              >
                Calculate Sample Size
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sample Parameters</CardTitle>
              <CardDescription>
                Sample size and acceptance criteria (calculated from AQL)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="sampleSize">Sample Size *</Label>
                  <Input
                    id="sampleSize"
                    type="number"
                    required
                    value={formData.sampleSize}
                    onChange={(e) => setFormData({ ...formData, sampleSize: e.target.value })}
                    placeholder="Auto-calculated"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="acceptNumber">Accept Number (Ac) *</Label>
                  <Input
                    id="acceptNumber"
                    type="number"
                    required
                    value={formData.acceptNumber}
                    onChange={(e) => setFormData({ ...formData, acceptNumber: e.target.value })}
                    placeholder="Max defects to accept"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rejectNumber">Reject Number (Re) *</Label>
                  <Input
                    id="rejectNumber"
                    type="number"
                    required
                    value={formData.rejectNumber}
                    onChange={(e) => setFormData({ ...formData, rejectNumber: e.target.value })}
                    placeholder="Min defects to reject"
                  />
                </div>
              </div>

              {formData.sampleSize && formData.acceptNumber && (
                <Alert>
                  <AlertDescription>
                    <strong>Decision Rule:</strong> Inspect {formData.sampleSize} units.
                    Accept lot if ≤ {formData.acceptNumber} defects found.
                    Reject lot if ≥ {formData.rejectNumber} defects found.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Creating...' : 'Create Sampling Plan'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
