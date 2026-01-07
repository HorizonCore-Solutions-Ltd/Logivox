'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Upload, AlertTriangle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PhotoUpload } from '@/components/qc/PhotoUpload';
import { SignatureCapture } from '@/components/qc/SignatureCapture';

interface NCRDetails {
  id: string;
  ncrNumber: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  reportDate: string;
  productSku?: string;
  lotNumber?: string;
  quantityAffected: number;
  nonConformanceType: string;
  disposition: string;
}

export default function SupplierNCRResponse({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [ncr, setNcr] = useState<NCRDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // 8D Form Fields
  const [d1Team, setD1Team] = useState('');
  const [d2Problem, setD2Problem] = useState('');
  const [d3Containment, setD3Containment] = useState('');
  const [d4RootCause, setD4RootCause] = useState('');
  const [d5Corrective, setD5Corrective] = useState('');
  const [d6Implementation, setD6Implementation] = useState('');
  const [d7Prevention, setD7Prevention] = useState('');
  const [d8Congratulate, setD8Congratulate] = useState('');
  
  const [photos, setPhotos] = useState<string[]>([]);
  const [signature, setSignature] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    loadNCR();
  }, [params.id]);

  const loadNCR = async () => {
    try {
      const token = localStorage.getItem('supplier_token');
      const response = await fetch(`/api/supplier/ncr/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to load NCR');

      const result = await response.json();
      setNcr(result.data);
    } catch (error) {
      console.error('Load NCR error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('supplier_token');
      
      // Prepare 8D response
      const eightD = {
        d1_team: d1Team,
        d2_problem: d2Problem,
        d3_containment: d3Containment,
        d4_root_cause: d4RootCause,
        d5_corrective: d5Corrective,
        d6_implementation: d6Implementation,
        d7_prevention: d7Prevention,
        d8_congratulate: d8Congratulate
      };

      const response = await fetch('/api/supplier/response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ncrId: params.id,
          eightD,
          rootCause: d4RootCause,
          correctiveAction: d5Corrective,
          preventiveAction: d7Prevention,
          photos,
          signature
        })
      });

      if (!response.ok) throw new Error('Failed to submit response');

      setSuccess(true);
      setTimeout(() => router.push('/supplier/ncr'), 2000);

    } catch (error: any) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading NCR...</p>
        </div>
      </div>
    );
  }

  if (!ncr) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive">
          <AlertDescription>NCR not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Response Submitted!</h2>
            <p className="text-muted-foreground">
              Your 8D response has been submitted for review.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Badge className={
            ncr.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
            ncr.severity === 'MAJOR' ? 'bg-orange-100 text-orange-800' :
            'bg-yellow-100 text-yellow-800'
          }>
            {ncr.severity}
          </Badge>
        </div>

        {/* NCR Details */}
        <Card>
          <CardHeader>
            <CardTitle>{ncr.ncrNumber} - {ncr.title}</CardTitle>
            <CardDescription>
              Reported: {new Date(ncr.reportDate).toLocaleDateString()} | 
              Status: {ncr.status}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Product SKU</Label>
                <p className="font-medium">{ncr.productSku || 'N/A'}</p>
              </div>
              <div>
                <Label>Lot Number</Label>
                <p className="font-medium">{ncr.lotNumber || 'N/A'}</p>
              </div>
              <div>
                <Label>Quantity Affected</Label>
                <p className="font-medium">{ncr.quantityAffected}</p>
              </div>
              <div>
                <Label>Defect Type</Label>
                <p className="font-medium">{ncr.nonConformanceType}</p>
              </div>
            </div>

            <div>
              <Label>Problem Description</Label>
              <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm">{ncr.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 8D Response Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>8D Problem Solving Response</CardTitle>
              <CardDescription>
                Complete all 8 disciplines of structured problem solving
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* D1: Team */}
              <div>
                <Label className="text-lg font-semibold">
                  D1: Establish the Team
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  List team members responsible for solving this issue
                </p>
                <Textarea
                  placeholder="e.g., John Smith (Quality Manager), Jane Doe (Production Lead), ..."
                  value={d1Team}
                  onChange={(e) => setD1Team(e.target.value)}
                  required
                  rows={2}
                />
              </div>

              {/* D2: Problem Description */}
              <div>
                <Label className="text-lg font-semibold">
                  D2: Describe the Problem
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Detailed description of the problem using 5W2H (What, Where, When, Why, Who, How, How Many)
                </p>
                <Textarea
                  placeholder="Provide detailed problem description..."
                  value={d2Problem}
                  onChange={(e) => setD2Problem(e.target.value)}
                  required
                  rows={4}
                />
              </div>

              {/* D3: Containment */}
              <div>
                <Label className="text-lg font-semibold">
                  D3: Develop Interim Containment Actions
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Immediate actions taken to contain the problem and protect customers
                </p>
                <Textarea
                  placeholder="What actions have been taken to prevent further defects reaching customers?"
                  value={d3Containment}
                  onChange={(e) => setD3Containment(e.target.value)}
                  required
                  rows={3}
                />
              </div>

              {/* D4: Root Cause */}
              <div>
                <Label className="text-lg font-semibold">
                  D4: Determine Root Cause
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Identify and verify the root cause using appropriate analysis methods
                </p>
                <Textarea
                  placeholder="What is the verified root cause? (Use 5-Why, Fishbone, etc.)"
                  value={d4RootCause}
                  onChange={(e) => setD4RootCause(e.target.value)}
                  required
                  rows={4}
                />
              </div>

              {/* D5: Corrective Actions */}
              <div>
                <Label className="text-lg font-semibold">
                  D5: Choose and Verify Permanent Corrective Actions
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Permanent solutions to eliminate the root cause
                </p>
                <Textarea
                  placeholder="What permanent corrective actions will eliminate the root cause?"
                  value={d5Corrective}
                  onChange={(e) => setD5Corrective(e.target.value)}
                  required
                  rows={4}
                />
              </div>

              {/* D6: Implementation */}
              <div>
                <Label className="text-lg font-semibold">
                  D6: Implement and Validate Corrective Actions
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Implementation plan and validation of effectiveness
                </p>
                <Textarea
                  placeholder="Implementation timeline and validation plan..."
                  value={d6Implementation}
                  onChange={(e) => setD6Implementation(e.target.value)}
                  required
                  rows={3}
                />
              </div>

              {/* D7: Prevention */}
              <div>
                <Label className="text-lg font-semibold">
                  D7: Prevent Recurrence
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Systemic changes to prevent similar problems in the future
                </p>
                <Textarea
                  placeholder="What preventive actions will be taken? (SOP updates, training, process changes, etc.)"
                  value={d7Prevention}
                  onChange={(e) => setD7Prevention(e.target.value)}
                  required
                  rows={4}
                />
              </div>

              {/* D8: Recognition */}
              <div>
                <Label className="text-lg font-semibold">
                  D8: Congratulate the Team
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Acknowledge team efforts and document lessons learned
                </p>
                <Textarea
                  placeholder="Team recognition and lessons learned..."
                  value={d8Congratulate}
                  onChange={(e) => setD8Congratulate(e.target.value)}
                  required
                  rows={2}
                />
              </div>

              {/* Evidence Upload */}
              <div>
                <Label className="text-lg font-semibold">Supporting Evidence</Label>
                <div className="mt-2">
                  <PhotoUpload
                    value={photos}
                    onChange={setPhotos}
                    maxPhotos={10}
                  />
                </div>
              </div>

              {/* Digital Signature */}
              <div>
                <Label className="text-lg font-semibold">Digital Signature</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Sign to certify the accuracy of this response
                </p>
                <SignatureCapture
                  value={signature}
                  onChange={setSignature}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit 8D Response
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
