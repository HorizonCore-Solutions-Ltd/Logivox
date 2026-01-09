'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  TrendingUp, 
  Award, 
  Target,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Info,
  FileText
} from 'lucide-react'

// ============================================
// CAPA SYSTEM 12: INDUSTRY BENCHMARKING
// ============================================

interface BenchmarkData {
  organizationMetrics: any
  industryStandards: any
  peerBenchmarks: any
  gaps: any[]
  recommendations: any[]
  comparisonSummary: {
    meetsStandards: number
    totalMetrics: number
    percentile: number
    performanceLevel: string
  }
}

export default function BenchmarkingPage() {
  const { data: session } = useSession()
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('QUARTERLY')
  const [industryType, setIndustryType] = useState('MEDICAL_DEVICE')
  const [companySize, setCompanySize] = useState('MEDIUM')

  useEffect(() => {
    fetchBenchmarkData()
  }, [timeframe, industryType, companySize])

  const fetchBenchmarkData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        timeframe,
        industryType,
        companySize,
      })

      const response = await fetch(`/api/capa/benchmarking?${params}`)
      const data = await response.json()

      setBenchmarkData(data)
    } catch (error) {
      console.error('Failed to fetch benchmark data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPerformanceLevelColor = (level: string) => {
    switch (level) {
      case 'WORLD_CLASS': return 'bg-green-100 text-green-800 border-green-300'
      case 'ABOVE_AVERAGE': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'AVERAGE': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'NEEDS_IMPROVEMENT': return 'bg-red-100 text-red-800 border-red-300'
      case 'EXCELLENT': return 'bg-green-100 text-green-700'
      case 'GOOD': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 75) return 'text-green-600'
    if (percentile >= 50) return 'text-blue-600'
    if (percentile >= 25) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatMetricName = (metric: string) => {
    return metric.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-500">Loading benchmark data...</div>
      </div>
    )
  }

  if (!benchmarkData) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-500">No benchmark data available</div>
      </div>
    )
  }

  const { organizationMetrics, gaps, recommendations, comparisonSummary } = benchmarkData

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Industry Benchmarking</h1>
          <p className="text-sm text-gray-600 mt-1">
            Compare your CAPA performance against FDA/ISO standards and peer companies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchBenchmarkData}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timeframe
            </label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="MONTHLY">Last Month</option>
              <option value="QUARTERLY">Last Quarter</option>
              <option value="YEARLY">Last Year</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Industry
            </label>
            <select
              value={industryType}
              onChange={(e) => setIndustryType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="MEDICAL_DEVICE">Medical Device</option>
              <option value="PHARMA">Pharmaceutical</option>
              <option value="AUTOMOTIVE">Automotive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Size
            </label>
            <select
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="SMALL">Small (1-50 employees)</option>
              <option value="MEDIUM">Medium (51-250)</option>
              <option value="LARGE">Large (251-1000)</option>
              <option value="ENTERPRISE">Enterprise (1000+)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Award className="w-8 h-8 text-blue-600" />
            </div>
            <div className={`text-3xl font-bold mb-1 ${getPercentileColor(comparisonSummary.percentile)}`}>
              {comparisonSummary.percentile}th
            </div>
            <div className="text-sm text-gray-600">Percentile</div>
            <div className="text-xs text-gray-500 mt-1">vs. Industry Peers</div>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Target className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {comparisonSummary.meetsStandards}/{comparisonSummary.totalMetrics}
            </div>
            <div className="text-sm text-gray-600">Meets Standards</div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.round((comparisonSummary.meetsStandards / comparisonSummary.totalMetrics) * 100)}% Compliance
            </div>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-2">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <div className={`text-xl font-bold mb-1 px-3 py-1 rounded-lg border-2 inline-block ${getPerformanceLevelColor(comparisonSummary.performanceLevel)}`}>
              {comparisonSummary.performanceLevel.replace(/_/g, ' ')}
            </div>
            <div className="text-sm text-gray-600 mt-2">Overall Rating</div>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-2">
              <BarChart3 className="w-8 h-8 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {organizationMetrics.TOTAL_CAPAS}
            </div>
            <div className="text-sm text-gray-600">Total CAPAs</div>
            <div className="text-xs text-gray-500 mt-1">
              {organizationMetrics.CLOSED_CAPAS} Closed
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Comparison Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Performance vs. Standards</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metric
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Your Value
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Peer Median
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gap
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {gaps.map((gap, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">
                      {formatMetricName(gap.metric)}
                    </div>
                    {gap.standardSource && (
                      <div className="text-xs text-gray-500">{gap.standardSource}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold text-gray-900">
                      {gap.organizationValue}
                      {gap.metric.includes('RATE') || gap.metric.includes('SCORE') ? '%' : 
                       gap.metric === 'CLOSURE_TIME' ? ' days' : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {gap.standardTarget && (
                      <div className="text-sm text-gray-700">
                        {gap.standardTarget}
                        {gap.metric.includes('RATE') || gap.metric.includes('SCORE') ? '%' : 
                         gap.metric === 'CLOSURE_TIME' ? ' days' : ''}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {gap.peerP50 && (
                      <div className="text-sm text-gray-700">
                        {gap.peerP50}
                        {gap.metric.includes('RATE') || gap.metric.includes('SCORE') ? '%' : 
                         gap.metric === 'CLOSURE_TIME' ? ' days' : ''}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getPerformanceLevelColor(gap.performanceLevel)}`}>
                      {gap.performanceLevel.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {gap.gap !== undefined && (
                      <div className={`text-sm font-semibold ${gap.gap > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {gap.gap > 0 ? '+' : ''}{gap.gap}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {gap.meetsStandard ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              Improvement Recommendations
            </h2>
          </div>
          <div className="p-4 space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-yellow-700">{index + 1}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        {formatMetricName(rec.metric)}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        rec.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {rec.priority} PRIORITY
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Issue: </span>
                        <span className="text-gray-600">{rec.issue}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Action: </span>
                        <span className="text-gray-600">{rec.action}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Expected Impact: </span>
                        <span className="text-green-600 font-semibold">{rec.expectedImpact}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Industry Standards Reference */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-green-600" />
          Industry Standards Reference
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">FDA Medical Device (21 CFR 820.100)</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• CAPA closure: <strong>≤30 days</strong> (target), ≤60 days (acceptable)</li>
              <li>• Recurrence rate: <strong>≤5%</strong> (target), ≤10% (acceptable)</li>
              <li>• Effectiveness: <strong>≥90%</strong> (target), ≥80% (acceptable)</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">ISO 13485:2016</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• Clause 8.5.2: Timely corrective action (<strong>45 days</strong>)</li>
              <li>• Clause 8.5.3: Preventive action effectiveness (<strong>≥85%</strong>)</li>
              <li>• Medical device quality management systems</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">ISO 9001:2015</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• Clause 10.2: Nonconformity and corrective action</li>
              <li>• CAPA closure: <strong>≤60 days</strong> (typical)</li>
              <li>• Quality management system standard</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">ASQ Quality Cost Model</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• Total COPQ: <strong>&lt;10% of sales</strong> (world-class)</li>
              <li>• 10-25% of sales (typical), &gt;25% (poor)</li>
              <li>• Prevention + Appraisal = 40-50% of COPQ</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-green-200">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> Benchmarks are based on anonymized industry data from peer companies. 
              Your organization's data remains confidential and is never shared. Percentiles indicate your 
              ranking within your industry and company size category.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
