'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ChevronRight, Save, FileText, Trash2 } from 'lucide-react';

interface WhyStep {
  question: string;
  answer: string;
}

interface FiveWhysAnalysis {
  problem: string;
  why1: WhyStep;
  why2: WhyStep;
  why3: WhyStep;
  why4: WhyStep;
  why5: WhyStep;
  rootCause: string;
  category: string;
}

export default function FiveWhyToolPage() {
  const [analysis, setAnalysis] = useState<FiveWhysAnalysis>({
    problem: '',
    why1: { question: 'Why did this problem occur?', answer: '' },
    why2: { question: 'Why did that happen?', answer: '' },
    why3: { question: 'Why did that happen?', answer: '' },
    why4: { question: 'Why did that happen?', answer: '' },
    why5: { question: 'Why did that happen?', answer: '' },
    rootCause: '',
    category: '',
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const steps = ['why1', 'why2', 'why3', 'why4', 'why5'] as const;

  const handleAnswerChange = (step: typeof steps[number], answer: string) => {
    setAnalysis(prev => ({
      ...prev,
      [step]: { ...prev[step], answer },
    }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      // Auto-populate root cause from why5
      setAnalysis(prev => ({
        ...prev,
        rootCause: prev.why5.answer || 'Root cause identified from 5 Why analysis',
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/qc/root-cause-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueTitle: analysis.problem,
          issueDescription: `5 Why Analysis: ${analysis.problem}`,
          issueType: 'QUALITY_DEFECT',
          severity: 'MEDIUM',
          fiveWhys: {
            problem: analysis.problem,
            why1: analysis.why1,
            why2: analysis.why2,
            why3: analysis.why3,
            why4: analysis.why4,
            why5: analysis.why5,
            rootCause: analysis.rootCause,
          },
          rootCause: analysis.rootCause,
          rootCauseCategory: analysis.category || 'OTHER',
        }),
      });

      if (response.ok) {
        alert('5 Why analysis saved successfully!');
        // Reset form
        setAnalysis({
          problem: '',
          why1: { question: 'Why did this problem occur?', answer: '' },
          why2: { question: 'Why did that happen?', answer: '' },
          why3: { question: 'Why did that happen?', answer: '' },
          why4: { question: 'Why did that happen?', answer: '' },
          why5: { question: 'Why did that happen?', answer: '' },
          rootCause: '',
          category: '',
        });
        setCurrentStep(0);
      }
    } catch (error) {
      console.error('Error saving analysis:', error);
      alert('Failed to save analysis');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the analysis?')) {
      setAnalysis({
        problem: '',
        why1: { question: 'Why did this problem occur?', answer: '' },
        why2: { question: 'Why did that happen?', answer: '' },
        why3: { question: 'Why did that happen?', answer: '' },
        why4: { question: 'Why did that happen?', answer: '' },
        why5: { question: 'Why did that happen?', answer: '' },
        rootCause: '',
        category: '',
      });
      setCurrentStep(0);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">5 Why Analysis Tool</h1>
          <p className="text-muted-foreground">
            Systematic root cause analysis using the 5 Why methodology
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <Trash2 className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={!analysis.rootCause || saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Analysis'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Analysis Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Problem Statement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Problem Statement
              </CardTitle>
              <CardDescription>
                Clearly describe the problem you're investigating
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Example: Customer received defective products in shipment #12345"
                value={analysis.problem}
                onChange={(e) => setAnalysis({ ...analysis, problem: e.target.value })}
                rows={3}
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* 5 Why Questions */}
          <Card>
            <CardHeader>
              <CardTitle>5 Why Analysis</CardTitle>
              <CardDescription>
                Ask "Why?" five times to drill down to the root cause
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className={`space-y-3 p-4 rounded-lg border-2 transition-all ${
                    index === currentStep
                      ? 'border-primary bg-primary/5'
                      : index < currentStep
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold flex items-center gap-2">
                      <Badge variant={index <= currentStep ? 'default' : 'outline'}>
                        Why {index + 1}
                      </Badge>
                      {analysis[step].question}
                    </Label>
                    {index < currentStep && (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Completed
                      </Badge>
                    )}
                  </div>
                  <Textarea
                    placeholder={`Answer why ${index > 0 ? 'that happened' : 'the problem occurred'}...`}
                    value={analysis[step].answer}
                    onChange={(e) => handleAnswerChange(step, e.target.value)}
                    disabled={index > currentStep}
                    rows={2}
                    className="resize-none"
                  />
                  {index === currentStep && analysis[step].answer && (
                    <Button onClick={handleNext} className="w-full" size="sm">
                      {index < 4 ? 'Next Why' : 'Identify Root Cause'}
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Root Cause Identification */}
          {currentStep === 5 || analysis.rootCause ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Root Cause Identified</CardTitle>
                <CardDescription>
                  The fundamental reason behind the problem
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Root Cause</Label>
                  <Textarea
                    placeholder="Summarize the root cause..."
                    value={analysis.rootCause}
                    onChange={(e) => setAnalysis({ ...analysis, rootCause: e.target.value })}
                    rows={3}
                    className="resize-none"
                  />
                </div>
                <div>
                  <Label>Root Cause Category</Label>
                  <Select
                    value={analysis.category}
                    onValueChange={(value) => setAnalysis({ ...analysis, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SUPPLIER_PROCESS">Supplier Process</SelectItem>
                      <SelectItem value="MATERIAL_DEFECT">Material Defect</SelectItem>
                      <SelectItem value="TRANSPORTATION">Transportation</SelectItem>
                      <SelectItem value="COMMUNICATION">Communication</SelectItem>
                      <SelectItem value="DESIGN">Design</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Progress Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div
                    key={step}
                    className={`flex items-center gap-3 p-2 rounded ${
                      index < currentStep
                        ? 'text-green-600'
                        : index === currentStep
                        ? 'text-primary font-semibold'
                        : 'text-gray-400'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index < currentStep
                          ? 'bg-green-100 text-green-600'
                          : index === currentStep
                          ? 'bg-primary text-white'
                          : 'bg-gray-100'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span>Why {index + 1}</span>
                  </div>
                ))}
                <div
                  className={`flex items-center gap-3 p-2 rounded ${
                    analysis.rootCause ? 'text-green-600 font-semibold' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      analysis.rootCause ? 'bg-green-100 text-green-600' : 'bg-gray-100'
                    }`}
                  >
                    ✓
                  </div>
                  <span>Root Cause</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tips for Effective Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-2">
                <div className="text-primary font-bold">1.</div>
                <p>Be specific and factual in your answers</p>
              </div>
              <div className="flex gap-2">
                <div className="text-primary font-bold">2.</div>
                <p>Focus on process failures, not people</p>
              </div>
              <div className="flex gap-2">
                <div className="text-primary font-bold">3.</div>
                <p>Stop when you reach the root cause (might be before 5 whys)</p>
              </div>
              <div className="flex gap-2">
                <div className="text-primary font-bold">4.</div>
                <p>Verify root cause with data when possible</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
