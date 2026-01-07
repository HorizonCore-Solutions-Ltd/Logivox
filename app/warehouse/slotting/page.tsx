/**
 * ML-Based Slotting Optimization Dashboard
 * Intelligent warehouse location assignment
 */

'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, MapPin, Zap, Package, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface Recommendation {
  itemId: string;
  itemNumber: string;
  itemName: string;
  currentLocation: string;
  currentZone: string;
  recommendedLocation: string;
  recommendedZone: string;
  velocity: number;
  velocityClass: string;
  currentScore: number;
  optimalScore: number;
  improvement: number;
  reason: string;
  priority: string;
}

interface Analysis {
  overallEfficiency: number;
  totalItems: number;
  zoneDistribution: Record<string, { count: number; avgVelocity: number }>;
  recommendation: string;
}

export default function SlottingOptimizationDashboard() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [activeTab, setActiveTab] = useState<'recommendations' | 'analysis' | 'heatmap'>('recommendations');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let action = '';
      switch (activeTab) {
        case 'recommendations':
          action = 'recommendations';
          break;
        case 'analysis':
          action = 'analysis';
          break;
        case 'heatmap':
          action = 'heatmap';
          break;
      }

      const response = await fetch(`/api/slotting-optimization?action=${action}`);
      const data = await response.json();

      if (activeTab === 'recommendations') {
        setRecommendations(data.recommendations?.recommendations || []);
      } else if (activeTab === 'analysis') {
        setAnalysis(data.analysis);
      } else if (activeTab === 'heatmap') {
        setHeatmap(data.heatmap || []);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const runOptimization = async () => {
    setOptimizing(true);
    try {
      const response = await fetch('/api/slotting-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'optimize',
          params: {},
        }),
      });

      const data = await response.json();
      if (data.success) {
        setRecommendations(data.result.recommendations || []);
        alert(`Optimization complete! ${data.result.itemsToRelocate} items to relocate. Avg improvement: ${data.result.avgImprovement.toFixed(1)}%`);
      }
    } catch (error) {
      console.error('Optimization error:', error);
      alert('Optimization failed');
    } finally {
      setOptimizing(false);
    }
  };

  const applyRecommendations = async () => {
    if (!confirm(`Apply ${recommendations.length} slotting recommendations?`)) return;

    try {
      const response = await fetch('/api/slotting-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'applyRecommendations',
          recommendations,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`${data.result.applied} transfer tasks created!`);
        fetchData();
      }
    } catch (error) {
      console.error('Apply error:', error);
      alert('Failed to apply recommendations');
    }
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'HIGH') return 'bg-red-100 text-red-800 border-red-300';
    if (priority === 'MEDIUM') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  const getHeatColor = (level: string) => {
    if (level === 'VERY_HOT') return 'bg-red-600';
    if (level === 'HOT') return 'bg-orange-500';
    if (level === 'WARM') return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ML-Based Slotting Optimization</h1>
            <p className="text-gray-600 mt-2">Intelligent warehouse location assignment using machine learning</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={runOptimization}
              disabled={optimizing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              {optimizing ? 'Optimizing...' : 'Run Optimization'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
            activeTab === 'recommendations'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Package className="w-5 h-5" />
          Recommendations
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
            activeTab === 'analysis'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          Efficiency Analysis
        </button>
        <button
          onClick={() => setActiveTab('heatmap')}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
            activeTab === 'heatmap'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <MapPin className="w-5 h-5" />
          Warehouse Heatmap
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading data...</p>
          </div>
        ) : (
          <>
            {/* Recommendations Tab */}
            {activeTab === 'recommendations' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Slotting Recommendations ({recommendations.length})
                  </h2>
                  {recommendations.length > 0 && (
                    <button
                      onClick={applyRecommendations}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Apply All Recommendations
                    </button>
                  )}
                </div>

                {recommendations.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No recommendations. Current slotting is optimal!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Item</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Current</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Recommended</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Velocity</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Improvement</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Priority</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recommendations.map((rec, idx) => (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="font-medium text-gray-900">{rec.itemNumber}</div>
                              <div className="text-sm text-gray-600">{rec.itemName}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm text-gray-900">{rec.currentLocation}</div>
                              <div className="text-xs text-gray-500">Zone {rec.currentZone}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm font-medium text-blue-600">{rec.recommendedLocation}</div>
                              <div className="text-xs text-gray-500">Zone {rec.recommendedZone}</div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="text-sm font-medium text-gray-900">{rec.velocity}</div>
                              <div className="text-xs text-gray-500">picks/mo</div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="text-lg font-bold text-green-600">+{rec.improvement}%</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(rec.priority)}`}>
                                {rec.priority}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Analysis Tab */}
            {activeTab === 'analysis' && analysis && (
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Slotting Efficiency Analysis</h2>

                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{analysis.overallEfficiency}%</div>
                    <div className="text-sm text-gray-600 mt-2">Overall Efficiency</div>
                  </div>
                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">{analysis.totalItems}</div>
                    <div className="text-sm text-gray-600 mt-2">Total Items</div>
                  </div>
                  <div className="text-center p-6 bg-purple-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">
                      {Object.keys(analysis.zoneDistribution).length}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">Active Zones</div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Zone Distribution</h3>
                  <div className="space-y-4">
                    {Object.entries(analysis.zoneDistribution).map(([zone, data]) => (
                      <div key={zone} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-lg text-gray-900">Zone {zone}</h4>
                          <span className="text-sm text-gray-600">{data.count} items</span>
                        </div>
                        <div className="text-sm text-gray-700">
                          Average Velocity: <span className="font-medium">{data.avgVelocity} picks/month</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-6 mt-6">
                  <div className={`p-4 rounded-lg flex items-center gap-3 ${
                    analysis.overallEfficiency > 70 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <AlertCircle className={`w-6 h-6 ${
                      analysis.overallEfficiency > 70 ? 'text-green-600' : 'text-yellow-600'
                    }`} />
                    <div>
                      <div className="font-semibold text-gray-900">Recommendation</div>
                      <div className="text-sm text-gray-700">{analysis.recommendation}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Heatmap Tab */}
            {activeTab === 'heatmap' && (
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Warehouse Activity Heatmap</h2>

                {heatmap.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No heatmap data available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-6 gap-2">
                    {heatmap.map((loc, idx) => (
                      <div
                        key={idx}
                        className={`${getHeatColor(loc.heatLevel)} text-white p-4 rounded text-center`}
                      >
                        <div className="text-xs font-medium">{loc.locationName}</div>
                        <div className="text-xl font-bold">{loc.velocity}</div>
                        <div className="text-xs">{loc.heatLevel}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-600 rounded"></div>
                    <span className="text-gray-700">Very Hot (500+)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-500 rounded"></div>
                    <span className="text-gray-700">Hot (100-500)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span className="text-gray-700">Warm (20-100)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="text-gray-700">Cold (&lt;20)</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
