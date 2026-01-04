/**
 * AI Supervisor Dashboard
 * Real-time worker monitoring and performance tracking
 */

'use client';

import { useState, useEffect } from 'react';
import { Users, Activity, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Eye, Target, Award, Clock } from 'lucide-react';

interface SupervisionSession {
  id: string;
  status: string;
  startTime: string;
  endTime?: string;
  productivityScore?: number;
  accuracyScore?: number;
  safetyScore?: number;
  attentionScore?: number;
  itemsProcessed?: number;
  errorsDetected?: number;
  warningsIssued?: number;
  worker: {
    id: string;
    name: string;
    email: string;
  };
  warehouse: {
    id: string;
    name: string;
  };
  _count: {
    interventions: number;
    performanceMetrics: number;
  };
}

interface Intervention {
  id: string;
  interventionType: string;
  severity: string;
  reason: string;
  recommendation?: string;
  acknowledged: boolean;
  resolved: boolean;
  timestamp: string;
  session: {
    worker: {
      name: string;
    };
  };
}

export default function AISupervisorDashboard() {
  const [sessions, setSessions] = useState<SupervisionSession[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [selectedSession, setSelectedSession] = useState<SupervisionSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ACTIVE' | 'ALL'>('ACTIVE');

  useEffect(() => {
    fetchSessions();
    fetchRecentInterventions();
    
    // Refresh every 5 seconds for real-time monitoring
    const interval = setInterval(() => {
      fetchSessions();
      fetchRecentInterventions();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [filter]);

  const fetchSessions = async () => {
    try {
      const activeParam = filter === 'ACTIVE' ? '?active=true' : '';
      const response = await fetch(`/api/ai-supervision${activeParam}`);
      const data = await response.json();
      
      if (data.sessions) {
        setSessions(data.sessions);
      }
      setLoading(false);
    } catch (error) {
      console.error('Fetch error:', error);
      setLoading(false);
    }
  };

  const fetchRecentInterventions = async () => {
    try {
      const response = await fetch('/api/ai-intervention');
      const data = await response.json();
      
      if (data.interventions) {
        setInterventions(data.interventions.slice(0, 10));
      }
    } catch (error) {
      console.error('Fetch interventions error:', error);
    }
  };

  const acknowledgeIntervention = async (interventionId: string) => {
    try {
      const response = await fetch('/api/ai-intervention', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interventionId,
          action: 'acknowledge',
        }),
      });

      if (response.ok) {
        fetchRecentInterventions();
      }
    } catch (error) {
      console.error('Acknowledge error:', error);
    }
  };

  const resolveIntervention = async (interventionId: string, resolution: string) => {
    try {
      const response = await fetch('/api/ai-intervention', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interventionId,
          action: 'resolve',
          resolution,
        }),
      });

      if (response.ok) {
        fetchRecentInterventions();
      }
    } catch (error) {
      console.error('Resolve error:', error);
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score?: number) => {
    if (!score) return null;
    if (score >= 75) return <TrendingUp className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-blue-100 text-blue-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800',
      CRITICAL: 'bg-red-100 text-red-800',
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  const avgProductivity = sessions.length
    ? sessions.reduce((sum, s) => sum + (s.productivityScore || 0), 0) / sessions.length
    : 0;
  
  const avgAccuracy = sessions.length
    ? sessions.reduce((sum, s) => sum + (s.accuracyScore || 0), 0) / sessions.length
    : 0;
  
  const activeWorkers = sessions.filter((s) => s.status === 'ACTIVE').length;
  const totalInterventions = interventions.length;
  const criticalInterventions = interventions.filter((i) => i.severity === 'CRITICAL' && !i.resolved).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Supervisor</h1>
              <p className="text-sm text-gray-600 mt-1">Real-time worker monitoring and performance tracking</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter('ACTIVE')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                  filter === 'ACTIVE'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('ALL')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                  filter === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Sessions
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{activeWorkers}</div>
            <div className="text-sm text-gray-600">Active Workers</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-green-600" />
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(avgProductivity)}`}>
              {avgProductivity.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">Avg Productivity</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 text-purple-600" />
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(avgAccuracy)}`}>
              {avgAccuracy.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">Avg Accuracy</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{totalInterventions}</div>
            <div className="text-sm text-gray-600">Interventions</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <div className="text-3xl font-bold text-red-600">{criticalInterventions}</div>
            <div className="text-sm text-gray-600">Critical Alerts</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Active Sessions */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900">Worker Sessions</h2>
            </div>
            
            <div className="p-6 space-y-3 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No sessions found</p>
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => setSelectedSession(session)}
                    className="border rounded-lg p-4 hover:border-blue-500 transition cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{session.worker.name}</h3>
                        <p className="text-xs text-gray-500">{session.warehouse.name}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          session.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {session.status}
                      </span>
                    </div>

                    {/* Performance Scores */}
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      <div className="text-center">
                        <div className={`text-lg font-bold ${getScoreColor(session.productivityScore)}`}>
                          {session.productivityScore?.toFixed(0) || '-'}
                        </div>
                        <div className="text-xs text-gray-500">Prod</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${getScoreColor(session.accuracyScore)}`}>
                          {session.accuracyScore?.toFixed(0) || '-'}
                        </div>
                        <div className="text-xs text-gray-500">Acc</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${getScoreColor(session.safetyScore)}`}>
                          {session.safetyScore?.toFixed(0) || '-'}
                        </div>
                        <div className="text-xs text-gray-500">Safety</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${getScoreColor(session.attentionScore)}`}>
                          {session.attentionScore?.toFixed(0) || '-'}
                        </div>
                        <div className="text-xs text-gray-500">Attn</div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <div>Items: {session.itemsProcessed || 0}</div>
                      <div>Errors: {session.errorsDetected || 0}</div>
                      <div>Warnings: {session.warningsIssued || 0}</div>
                      <div>
                        <Clock className="w-3 h-3 inline mr-1" />
                        {new Date(session.startTime).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Interventions */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900">Recent Interventions</h2>
            </div>
            
            <div className="p-6 space-y-3 max-h-[600px] overflow-y-auto">
              {interventions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No interventions recorded</p>
                </div>
              ) : (
                interventions.map((intervention) => (
                  <div
                    key={intervention.id}
                    className={`border-l-4 rounded-r-lg p-4 ${
                      intervention.severity === 'CRITICAL'
                        ? 'border-red-500 bg-red-50'
                        : intervention.severity === 'HIGH'
                        ? 'border-orange-500 bg-orange-50'
                        : intervention.severity === 'MEDIUM'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getSeverityColor(intervention.severity)}`}>
                            {intervention.severity}
                          </span>
                          <span className="text-xs text-gray-500 uppercase">
                            {intervention.interventionType.replace('_', ' ')}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900">
                          {intervention.session.worker.name}
                        </h4>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(intervention.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 mb-2">{intervention.reason}</p>

                    {intervention.recommendation && (
                      <p className="text-sm text-gray-600 italic mb-3">
                        💡 {intervention.recommendation}
                      </p>
                    )}

                    {/* Actions */}
                    {!intervention.resolved && (
                      <div className="flex gap-2">
                        {!intervention.acknowledged && (
                          <button
                            onClick={() => acknowledgeIntervention(intervention.id)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition"
                          >
                            Acknowledge
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const resolution = prompt('Enter resolution notes:');
                            if (resolution) {
                              resolveIntervention(intervention.id, resolution);
                            }
                          }}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition"
                        >
                          Resolve
                        </button>
                      </div>
                    )}

                    {intervention.resolved && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        Resolved
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
