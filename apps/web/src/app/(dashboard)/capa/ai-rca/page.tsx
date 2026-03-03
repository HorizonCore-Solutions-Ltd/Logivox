"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Brain,
  Lightbulb,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
} from "lucide-react";

interface RCAResult {
  capaId?: string;
  problemStatement: string;
  fiveWhys: { question: string; answer: string; evidenceSource: string }[];
  fishbone: { category: string; factors: string[] }[];
  rootCause: {
    primary: string;
    contributing: string[];
    confidence: number;
    evidence: string[];
  };
  recommendations: {
    type: string;
    timeframe: string;
    action: string;
    priority: string;
  }[];
  similarCAPAs?: { capaNumber: string; similarity: number; resolution: string }[];
}

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-800 border-red-200",
  HIGH: "bg-orange-100 text-orange-800 border-orange-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
  LOW: "bg-green-100 text-green-800 border-green-200",
};

export default function AIRCAPage() {
  const [problemStatement, setProblemStatement] = useState("");
  const [department, setDepartment] = useState("");
  const [product, setProduct] = useState("");
  const [process, setProcess] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RCAResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    if (problemStatement.trim().length < 10) {
      setError("Please enter a problem statement of at least 10 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/capa/ai-rca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemStatement,
          problemContext: { department, product, process },
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Analysis failed");
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-purple-100">
          <Brain className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Root Cause Analysis</h1>
          <p className="text-sm text-muted-foreground">
            Automated 5-Whys, fishbone diagrams, and corrective action
            recommendations powered by historical pattern matching
          </p>
        </div>
      </div>

      {/* Input form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Problem Input</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Problem Statement *</Label>
            <Textarea
              placeholder="Describe the quality issue, defect, or non-conformance in detail…"
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Department (optional)</Label>
              <Input
                placeholder="e.g. Manufacturing"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Product (optional)</Label>
              <Input
                placeholder="e.g. SKU-12345"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Process (optional)</Label>
              <Input
                placeholder="e.g. Final inspection"
                value={process}
                onChange={(e) => setProcess(e.target.value)}
              />
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> {error}
            </p>
          )}
          <Button onClick={runAnalysis} disabled={loading} className="w-full md:w-auto">
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Analysing…
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" /> Run AI Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          {/* Root cause */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" /> Root Cause
                <Badge variant="outline" className="ml-auto">
                  {result.rootCause?.confidence ?? 0}% confidence
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-medium text-sm">{result.rootCause?.primary}</p>
              {result.rootCause?.contributing?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Contributing factors
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {result.rootCause.contributing.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 5 Whys */}
          {result.fiveWhys?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">5-Whys Chain</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.fiveWhys.map((step, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary font-bold text-xs">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">
                          {step.question}
                        </p>
                        <p className="text-sm">{step.answer}</p>
                        {step.evidenceSource && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Source: {step.evidenceSource}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {result.recommendations?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recommended Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.recommendations.map((r, i) => (
                    <div
                      key={i}
                      className={`flex gap-3 items-start border rounded-lg p-3 ${PRIORITY_COLORS[r.priority] ?? ""}`}
                    >
                      <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge variant="outline" className="text-xs">
                            {r.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {r.timeframe}
                          </span>
                        </div>
                        <p className="text-sm">{r.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fishbone */}
          {result.fishbone?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Fishbone Diagram — Cause Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {result.fishbone.map((bone, i) => (
                    <div
                      key={i}
                      className="border rounded-lg p-3 bg-muted/30"
                    >
                      <p className="font-semibold text-sm mb-2">
                        {bone.category}
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        {bone.factors.map((f, j) => (
                          <li key={j} className="text-xs text-muted-foreground">
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
