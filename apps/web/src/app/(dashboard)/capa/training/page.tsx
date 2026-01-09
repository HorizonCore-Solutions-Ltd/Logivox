'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  BookOpen, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Award,
  Calendar,
  Filter,
  Search
} from 'lucide-react'

// ============================================
// CAPA SYSTEM 10: TRAINING MANAGEMENT INTEGRATION
// ============================================

interface TrainingEnrollment {
  id: string
  status: string
  enrolledAt: string
  completedAt?: string
  verifiedAt?: string
  autoEnrolled: boolean
  requirement: {
    id: string
    capaId: string
    trainingType: string
    trainingTopic: string
    dueDate: string
    minimumScore: number
    competencyRequired: boolean
    capa: {
      capaNumber: string
      title: string
      status: string
    }
  }
  user: {
    name: string
    email: string
    role: string
  }
  completion?: {
    completionDate: string
    score?: number
    passingStatus: string
    notes?: string
  }
  effectivenessCheck?: {
    checkDate: string
    performanceRating: string
    observations: string
    actionRequired: boolean
  }
}

interface TrainingStats {
  total: number
  pending: number
  enrolled: number
  completed: number
  verified: number
  overdue: number
  requiresVerification: number
}

export default function TrainingManagementPage() {
  const { data: session } = useSession()
  const [enrollments, setEnrollments] = useState<TrainingEnrollment[]>([])
  const [stats, setStats] = useState<TrainingStats>({
    total: 0,
    pending: 0,
    enrolled: 0,
    completed: 0,
    verified: 0,
    overdue: 0,
    requiresVerification: 0,
  })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchTrainingData()
  }, [statusFilter])

  const fetchTrainingData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter.toUpperCase())
      }

      const response = await fetch(`/api/capa/training?${params}`)
      const data = await response.json()

      setEnrollments(data.enrollments || [])
      setStats(data.stats || {})
    } catch (error) {
      console.error('Failed to fetch training data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-gray-600 bg-gray-100'
      case 'ENROLLED': return 'text-blue-600 bg-blue-100'
      case 'COMPLETED': return 'text-yellow-600 bg-yellow-100'
      case 'VERIFIED': return 'text-green-600 bg-green-100'
      case 'OVERDUE': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPerformanceColor = (rating: string) => {
    switch (rating) {
      case 'EXCELLENT': return 'text-green-700'
      case 'SATISFACTORY': return 'text-blue-700'
      case 'NEEDS_IMPROVEMENT': return 'text-yellow-700'
      case 'UNSATISFACTORY': return 'text-red-700'
      default: return 'text-gray-700'
    }
  }

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const getUrgencyBadge = (daysUntilDue: number) => {
    if (daysUntilDue < 0) {
      return <span className="text-xs font-semibold text-red-600">OVERDUE</span>
    } else if (daysUntilDue <= 7) {
      return <span className="text-xs font-semibold text-orange-600">URGENT</span>
    } else if (daysUntilDue <= 14) {
      return <span className="text-xs font-semibold text-yellow-600">SOON</span>
    }
    return null
  }

  const filteredEnrollments = enrollments.filter(enrollment => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      enrollment.user.name.toLowerCase().includes(searchLower) ||
      enrollment.requirement.trainingTopic.toLowerCase().includes(searchLower) ||
      enrollment.requirement.capa.capaNumber.toLowerCase().includes(searchLower)
    )
  })

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-500">Loading training data...</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            CAPA-triggered training workflows with competency verification
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTrainingData}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Total</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
            <Clock className="w-4 h-4" />
            <span>Pending</span>
          </div>
          <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-blue-600 text-sm mb-1">
            <Users className="w-4 h-4" />
            <span>Enrolled</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.enrolled}</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-yellow-600 text-sm mb-1">
            <CheckCircle className="w-4 h-4" />
            <span>Completed</span>
          </div>
          <div className="text-2xl font-bold text-yellow-600">{stats.completed}</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
            <Award className="w-4 h-4" />
            <span>Verified</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
        </div>

        <div className="bg-white rounded-lg border border-red-200 p-4">
          <div className="flex items-center gap-2 text-red-600 text-sm mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>Overdue</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
        </div>

        <div className="bg-white rounded-lg border border-yellow-200 p-4">
          <div className="flex items-center gap-2 text-yellow-700 text-sm mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Verify</span>
          </div>
          <div className="text-2xl font-bold text-yellow-700">{stats.requiresVerification}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by employee, topic, or CAPA number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="enrolled">Enrolled</option>
              <option value="completed">Completed</option>
              <option value="verified">Verified</option>
            </select>
          </div>
        </div>
      </div>

      {/* Training Enrollments Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Training Topic
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CAPA
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEnrollments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No training enrollments found
                  </td>
                </tr>
              ) : (
                filteredEnrollments.map((enrollment) => {
                  const daysUntilDue = getDaysUntilDue(enrollment.requirement.dueDate)
                  const isOverdue = daysUntilDue < 0

                  return (
                    <tr
                      key={enrollment.id}
                      className={`hover:bg-gray-50 ${isOverdue && enrollment.status !== 'VERIFIED' ? 'bg-red-50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {enrollment.user.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {enrollment.user.email}
                          </div>
                          {enrollment.autoEnrolled && (
                            <span className="text-xs text-blue-600">Auto-enrolled</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">
                          {enrollment.requirement.trainingTopic}
                        </div>
                        {enrollment.requirement.competencyRequired && (
                          <div className="text-xs text-gray-500">
                            Min score: {enrollment.requirement.minimumScore}%
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-mono text-blue-600">
                          {enrollment.requirement.capa.capaNumber}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {enrollment.requirement.capa.title}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                          {enrollment.requirement.trainingType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(enrollment.status)}`}>
                          {enrollment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">
                          {new Date(enrollment.requirement.dueDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {isOverdue ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days left`}
                          </span>
                          {getUrgencyBadge(daysUntilDue)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {enrollment.completion?.score !== undefined ? (
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {enrollment.completion.score}%
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              enrollment.completion.passingStatus === 'PASSED' 
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {enrollment.completion.passingStatus}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Not completed</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {enrollment.effectivenessCheck ? (
                          <div className={getPerformanceColor(enrollment.effectivenessCheck.performanceRating)}>
                            <div className="text-sm font-medium">
                              {enrollment.effectivenessCheck.performanceRating.replace('_', ' ')}
                            </div>
                            <div className="text-xs">
                              {new Date(enrollment.effectivenessCheck.checkDate).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Not verified</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          onClick={() => {
                            // Open detail modal (to be implemented)
                            alert('View enrollment details')
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Information Panel */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          Training Management Workflow
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">4-Step Process</h4>
            <ol className="space-y-1 text-gray-700">
              <li>1. <strong>Create Requirement:</strong> CAPA identifies training need</li>
              <li>2. <strong>Auto-Enroll:</strong> System enrolls target audience</li>
              <li>3. <strong>Complete Training:</strong> Employee attends and passes</li>
              <li>4. <strong>Verify Effectiveness:</strong> 30-day on-job observation</li>
            </ol>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">CAPA Closure Rules</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• Training must be <strong>COMPLETED</strong> (score ≥ minimum)</li>
              <li>• Effectiveness must be <strong>VERIFIED</strong> on the job</li>
              <li>• All enrollees must reach VERIFIED status</li>
              <li>• <strong>Cannot close CAPA</strong> until training complete</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-blue-200">
          <h4 className="font-semibold text-gray-900 mb-2">Performance Ratings</h4>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700">
              EXCELLENT: Consistently exceeds expectations
            </span>
            <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">
              SATISFACTORY: Meets all requirements
            </span>
            <span className="text-xs px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
              NEEDS IMPROVEMENT: Minor gaps, re-training recommended
            </span>
            <span className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-700">
              UNSATISFACTORY: Must repeat training immediately
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
