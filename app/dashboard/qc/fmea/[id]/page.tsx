'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  FileText, 
  AlertTriangle, 
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Download
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

interface FailureMode {
  id: string;
  processStep: string;
  processFunction: string;
  failureMode: string;
  effectsOfFailure: string;
  potentialCauses: string;
  currentControls: string;
  severity: number;
  occurrence: number;
  detection: number;
  rpn: number;
  recommendedActions: string;
  responsiblePerson: string;
  targetDate?: string;
  actionsTaken?: string;
  residualSeverity?: number;
  residualOccurrence?: number;
  residualDetection?: number;
  residualRPN?: number;
  status: string;
  linkedCAPAIds?: string;
}

interface FMEA {
  id: string;
  fmeaNumber: string;
  title: string;
  type: string;
  status: string;
  scope: string;
  teamLead: string;
  teamMembers: string;
  startDate: string;
  lastReviewDate?: string;
  failureModes: FailureMode[];
  createdAt: string;
}

export default function FMEADetail() {
  const router = useRouter();
  const params = useParams();
  const [fmea, setFmea] = useState<FMEA | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingMode, setEditingMode] = useState<string | null>(null);
  const [showAddMode, setShowAddMode] = useState(false);

  const [newMode, setNewMode] = useState({
    processStep: '',
    failureMode: '',
    effects: '',
    causes: '',
    controls: '',
    severity: 5,
    occurrence: 5,
    detection: 5,
    actions: '',
    responsible: ''
  });

  useEffect(() => {
    fetchFMEA();
  }, [params.id]);

  const fetchFMEA = async () => {
    try {
      const response = await fetch(`/api/qc/fmea/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch FMEA');
      const data = await response.json();
      setFmea(data.data);
    } catch (error: any) {
      console.error('Error:', error.message);
      alert('Failed to load FMEA');
    } finally {
      setLoading(false);
    }
  };

  const addFailureMode = async () => {
    try {
      const response = await fetch(`/api/qc/fmea/${params.id}/failure-modes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          processStep: newMode.processStep,
          failureMode: newMode.failureMode,
          effectsOfFailure: newMode.effects,
          potentialCauses: newMode.causes,
          currentControls: newMode.controls,
          severity: newMode.severity,
          occurrence: newMode.occurrence,
          detection: newMode.detection,
          recommendedActions: newMode.actions,
          responsiblePerson: newMode.responsible
        })
      });

      if (!response.ok) throw new Error('Failed to add failure mode');

      setShowAddMode(false);
      setNewMode({
        processStep: '',
        failureMode: '',
        effects: '',
        causes: '',
        controls: '',
        severity: 5,
        occurrence: 5,
        detection: 5,
        actions: '',
        responsible: ''
      });
      fetchFMEA();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const updateFMEAStatus = async (status: string) => {
    try {
      const response = await fetch(`/api/qc/fmea/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, lastReviewDate: new Date() })
      });

      if (!response.ok) throw new Error('Failed to update status');
      fetchFMEA();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const getRPNColor = (rpn: number) => {
    if (rpn >= 200) return 'bg-red-100 text-red-800';
    if (rpn >= 125) return 'bg-orange-100 text-orange-800';
    if (rpn >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      OPEN: 'bg-red-100 text-red-800',
      ACTION_PLANNED: 'bg-yellow-100 text-yellow-800',
      ACTION_IN_PROGRESS: 'bg-blue-100 text-blue-800',
      ACTION_COMPLETED: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-100 text-gray-800'
    };
    return variants[status] || 'bg-gray-100 text-gray-800';
  };

  const calculateStats = () => {
    if (!fmea) return { total: 0, critical: 0, high: 0, open: 0, avgRPN: 0 };

    const total = fmea.failureModes.length;
    const critical = fmea.failureModes.filter(fm => fm.rpn >= 200).length;
    const high = fmea.failureModes.filter(fm => fm.rpn >= 125 && fm.rpn < 200).length;
    const open = fmea.failureModes.filter(fm => fm.status !== 'CLOSED').length;
    const avgRPN = total > 0 
      ? Math.round(fmea.failureModes.reduce((sum, fm) => sum + fm.rpn, 0) / total)
      : 0;

    return { total, critical, high, open, avgRPN };
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!fmea) return <div className="p-6">FMEA not found</div>;

  const stats = calculateStats();
  const teamMembers = fmea.teamMembers ? JSON.parse(fmea.teamMembers) : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <span className="font-mono text-xl font-bold">{fmea.fmeaNumber}</span>
            <Badge variant="outline">{fmea.type.replace('_', ' ')}</Badge>
          </div>
          <h1 className="text-3xl font-bold">{fmea.title}</h1>
        </div>

        <div className="flex items-center space-x-2">
          <Select value={fmea.status} onValueChange={updateFMEAStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Failure Modes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Critical (≥200)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.critical}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>High (≥125)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.high}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Open Actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.open}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Average RPN</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.avgRPN}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="failure-modes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="failure-modes">Failure Modes</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        {/* Failure Modes Tab */}
        <TabsContent value="failure-modes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Failure Modes ({fmea.failureModes.length})</CardTitle>
                <Button onClick={() => setShowAddMode(!showAddMode)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Failure Mode
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Mode Form */}
              {showAddMode && (
                <div className="border p-4 rounded-lg bg-gray-50 space-y-3">
                  <h4 className="font-semibold">New Failure Mode</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Process Step"
                      value={newMode.processStep}
                      onChange={(e) => setNewMode({ ...newMode, processStep: e.target.value })}
                    />
                    <Input
                      placeholder="Failure Mode"
                      value={newMode.failureMode}
                      onChange={(e) => setNewMode({ ...newMode, failureMode: e.target.value })}
                    />
                  </div>

                  <Textarea
                    placeholder="Effects of Failure"
                    value={newMode.effects}
                    onChange={(e) => setNewMode({ ...newMode, effects: e.target.value })}
                    rows={2}
                  />

                  <Textarea
                    placeholder="Potential Causes"
                    value={newMode.causes}
                    onChange={(e) => setNewMode({ ...newMode, causes: e.target.value })}
                    rows={2}
                  />

                  <Textarea
                    placeholder="Current Controls"
                    value={newMode.controls}
                    onChange={(e) => setNewMode({ ...newMode, controls: e.target.value })}
                    rows={2}
                  />

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Severity: {newMode.severity}</Label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={newMode.severity}
                        onChange={(e) => setNewMode({ ...newMode, severity: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label>Occurrence: {newMode.occurrence}</Label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={newMode.occurrence}
                        onChange={(e) => setNewMode({ ...newMode, occurrence: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label>Detection: {newMode.detection}</Label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={newMode.detection}
                        onChange={(e) => setNewMode({ ...newMode, detection: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="text-center p-3 bg-white rounded border">
                    <p className="text-sm text-muted-foreground">RPN</p>
                    <p className="text-3xl font-bold">
                      {newMode.severity * newMode.occurrence * newMode.detection}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Textarea
                      placeholder="Recommended Actions"
                      value={newMode.actions}
                      onChange={(e) => setNewMode({ ...newMode, actions: e.target.value })}
                      rows={2}
                    />
                    <Input
                      placeholder="Responsible Person"
                      value={newMode.responsible}
                      onChange={(e) => setNewMode({ ...newMode, responsible: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowAddMode(false)}>Cancel</Button>
                    <Button onClick={addFailureMode}>Add Failure Mode</Button>
                  </div>
                </div>
              )}

              {/* Failure Modes Table */}
              <div className="space-y-2">
                {fmea.failureModes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No failure modes added yet</p>
                ) : (
                  fmea.failureModes.map((fm) => (
                    <div key={fm.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={getRPNColor(fm.rpn)}>RPN: {fm.rpn}</Badge>
                            <Badge className={getStatusBadge(fm.status)}>{fm.status.replace(/_/g, ' ')}</Badge>
                            {fm.residualRPN && fm.residualRPN < fm.rpn && (
                              <Badge variant="outline" className="bg-green-50">
                                Residual: {fm.residualRPN}
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-semibold">{fm.processStep} - {fm.failureMode}</h4>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-muted-foreground">Effects</p>
                          <p>{fm.effectsOfFailure}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">Causes</p>
                          <p>{fm.potentialCauses}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">Controls</p>
                          <p>{fm.currentControls}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">Recommended Actions</p>
                          <p>{fm.recommendedActions}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-muted-foreground">S: {fm.severity} × O: {fm.occurrence} × D: {fm.detection}</span>
                          {fm.residualSeverity && (
                            <span className="ml-4 text-green-600">
                              → S: {fm.residualSeverity} × O: {fm.residualOccurrence} × D: {fm.residualDetection}
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Responsible: </span>
                          <span>{fm.responsiblePerson}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>FMEA Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Scope</Label>
                <p className="text-sm">{fmea.scope}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <p className="text-sm">{new Date(fmea.startDate).toLocaleDateString()}</p>
                </div>
                {fmea.lastReviewDate && (
                  <div>
                    <Label>Last Review</Label>
                    <p className="text-sm">{new Date(fmea.lastReviewDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>FMEA Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Team Lead</Label>
                <p className="text-lg font-semibold">{fmea.teamLead}</p>
              </div>

              <div>
                <Label>Team Members</Label>
                <div className="mt-2 space-y-2">
                  {teamMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No team members added</p>
                  ) : (
                    teamMembers.map((member: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{member}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
