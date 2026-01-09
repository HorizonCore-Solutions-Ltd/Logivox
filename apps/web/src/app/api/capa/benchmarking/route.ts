import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// ============================================
// CAPA SYSTEM 12: INDUSTRY BENCHMARKING
// ============================================
// Compare CAPA performance metrics against:
// - FDA/ISO industry standards
// - Peer company benchmarks (anonymized)
// - Best practice recommendations
// Identify gaps and improvement opportunities

// Benchmark Comparison Schema
const benchmarkSchema = z.object({
  metricType: z.enum([
    'CLOSURE_TIME',
    'RECURRENCE_RATE',
    'EFFECTIVENESS_SCORE',
    'CUSTOMER_IMPACT_RATE',
    'COPQ_PERCENTAGE',
    'TRAINING_COMPLETION_RATE',
    'SUPPLIER_QUALITY_SCORE'
  ]),
  timeframe: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
  industryType: z.string().optional(), // MEDICAL_DEVICE, PHARMA, AUTOMOTIVE, etc.
  companySize: z.enum(['SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']).optional(),
})

// ============================================
// Industry Standards Database (FDA/ISO)
// ============================================

const INDUSTRY_STANDARDS = {
  FDA_MEDICAL_DEVICE: {
    CLOSURE_TIME: {
      target: 30, // days
      acceptable: 60,
      unit: 'days',
      standard: 'FDA 21 CFR 820.100',
      description: 'CAPA closure within 30 days for medical devices'
    },
    RECURRENCE_RATE: {
      target: 5, // percentage
      acceptable: 10,
      unit: 'percentage',
      standard: 'FDA Quality System Regulation',
      description: 'Less than 5% recurrence of same root cause'
    },
    EFFECTIVENESS_SCORE: {
      target: 90, // percentage
      acceptable: 80,
      unit: 'percentage',
      standard: 'FDA 21 CFR 820.100(a)',
      description: 'CAPA effectiveness verification >90%'
    },
  },
  ISO_13485: {
    CLOSURE_TIME: {
      target: 45,
      acceptable: 90,
      unit: 'days',
      standard: 'ISO 13485:2016 Clause 8.5.2',
      description: 'Timely corrective action implementation'
    },
    EFFECTIVENESS_SCORE: {
      target: 85,
      acceptable: 75,
      unit: 'percentage',
      standard: 'ISO 13485:2016 Clause 8.5.3',
      description: 'Preventive action effectiveness'
    },
  },
  ISO_9001: {
    CLOSURE_TIME: {
      target: 60,
      acceptable: 120,
      unit: 'days',
      standard: 'ISO 9001:2015 Clause 10.2',
      description: 'Nonconformity and corrective action'
    },
    COPQ_PERCENTAGE: {
      target: 10, // % of sales
      acceptable: 25,
      unit: 'percentage',
      standard: 'ASQ Quality Cost Model',
      description: 'Total COPQ <10% of sales (world-class)'
    },
  }
}

// ============================================
// Peer Benchmarks (Anonymized Industry Data)
// ============================================

const PEER_BENCHMARKS = {
  MEDICAL_DEVICE: {
    SMALL: {
      CLOSURE_TIME: { p25: 45, p50: 60, p75: 90, p90: 120 },
      RECURRENCE_RATE: { p25: 8, p50: 12, p75: 18, p90: 25 },
      EFFECTIVENESS_SCORE: { p25: 75, p50: 82, p75: 88, p90: 92 },
    },
    MEDIUM: {
      CLOSURE_TIME: { p25: 35, p50: 50, p75: 75, p90: 100 },
      RECURRENCE_RATE: { p25: 6, p50: 10, p75: 15, p90: 22 },
      EFFECTIVENESS_SCORE: { p25: 78, p50: 85, p75: 90, p90: 94 },
    },
    LARGE: {
      CLOSURE_TIME: { p25: 30, p50: 45, p75: 65, p90: 85 },
      RECURRENCE_RATE: { p25: 4, p50: 8, p75: 12, p90: 18 },
      EFFECTIVENESS_SCORE: { p25: 82, p50: 88, p75: 92, p90: 96 },
    },
  },
  PHARMA: {
    MEDIUM: {
      CLOSURE_TIME: { p25: 40, p50: 55, p75: 80, p90: 110 },
      RECURRENCE_RATE: { p25: 5, p50: 9, p75: 14, p90: 20 },
      EFFECTIVENESS_SCORE: { p25: 80, p50: 86, p75: 91, p90: 95 },
    },
  },
  AUTOMOTIVE: {
    LARGE: {
      CLOSURE_TIME: { p25: 25, p50: 40, p75: 60, p90: 80 },
      RECURRENCE_RATE: { p25: 3, p50: 6, p75: 10, p90: 15 },
      EFFECTIVENESS_SCORE: { p25: 85, p50: 90, p75: 94, p90: 97 },
    },
  }
}

// ============================================
// GET: Retrieve benchmarking data
// ============================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const metricType = searchParams.get('metricType')
    const timeframe = searchParams.get('timeframe') || 'QUARTERLY'
    const industryType = searchParams.get('industryType') || 'MEDICAL_DEVICE'
    const companySize = searchParams.get('companySize') || 'MEDIUM'

    // Calculate organization's actual metrics
    const orgMetrics = await calculateOrganizationMetrics(
      session.user.organizationId,
      timeframe as any
    )

    // Get industry standards
    const standards = getIndustryStandards(industryType)

    // Get peer benchmarks
    const peerBenchmarks = getPeerBenchmarks(industryType, companySize as any)

    // Calculate performance gaps
    const gaps = calculateGaps(orgMetrics, standards, peerBenchmarks)

    // Generate recommendations
    const recommendations = generateRecommendations(gaps, orgMetrics)

    return NextResponse.json({
      organizationMetrics: orgMetrics,
      industryStandards: standards,
      peerBenchmarks,
      gaps,
      recommendations,
      comparisonSummary: {
        meetsStandards: gaps.filter((g: any) => g.meetsStandard).length,
        totalMetrics: gaps.length,
        percentile: calculatePercentile(orgMetrics, peerBenchmarks),
        performanceLevel: getPerformanceLevel(gaps),
      }
    })

  } catch (error) {
    console.error('Benchmarking GET error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve benchmarking data' },
      { status: 500 }
    )
  }
}

// ============================================
// POST: Save custom benchmarks, request peer data
// ============================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    // ==========================================
    // ACTION: SAVE_CUSTOM_BENCHMARK
    // ==========================================
    if (action === 'SAVE_CUSTOM_BENCHMARK') {
      const { metricName, targetValue, benchmarkSource, notes } = body

      const benchmark = await prisma.customBenchmark.create({
        data: {
          organizationId: session.user.organizationId,
          metricName,
          targetValue,
          benchmarkSource,
          notes,
          createdBy: session.user.id,
        }
      })

      return NextResponse.json({ success: true, benchmark })
    }

    // ==========================================
    // ACTION: GENERATE_BENCHMARK_REPORT
    // ==========================================
    if (action === 'GENERATE_BENCHMARK_REPORT') {
      const { timeframe, includeRecommendations } = body

      const metrics = await calculateOrganizationMetrics(
        session.user.organizationId,
        timeframe
      )

      const report = await prisma.benchmarkReport.create({
        data: {
          organizationId: session.user.organizationId,
          reportDate: new Date(),
          timeframe,
          metricsData: metrics as any,
          generatedBy: session.user.id,
        }
      })

      return NextResponse.json({ success: true, report, metrics })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Benchmarking POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process benchmarking action' },
      { status: 500 }
    )
  }
}

// ============================================
// Helper Functions
// ============================================

async function calculateOrganizationMetrics(organizationId: string, timeframe: string) {
  const now = new Date()
  let startDate = new Date()

  switch (timeframe) {
    case 'MONTHLY':
      startDate.setMonth(now.getMonth() - 1)
      break
    case 'QUARTERLY':
      startDate.setMonth(now.getMonth() - 3)
      break
    case 'YEARLY':
      startDate.setFullYear(now.getFullYear() - 1)
      break
  }

  // Get CAPAs in timeframe
  const capas = await prisma.correctivePreventiveAction.findMany({
    where: {
      organizationId,
      createdAt: {
        gte: startDate,
        lte: now,
      }
    },
    include: {
      ncr: true,
    }
  })

  // Calculate CLOSURE_TIME (average days to close)
  const closedCapas = capas.filter(c => c.status === 'CLOSED')
  const closureTimes = closedCapas.map(c => {
    if (!c.closedDate) return 0
    return Math.ceil((c.closedDate.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24))
  })
  const avgClosureTime = closureTimes.length > 0
    ? closureTimes.reduce((a, b) => a + b, 0) / closureTimes.length
    : 0

  // Calculate RECURRENCE_RATE
  const totalNCRs = await prisma.nonConformanceReport.count({
    where: {
      organizationId,
      createdAt: { gte: startDate, lte: now }
    }
  })
  const recurringNCRs = await prisma.nonConformanceReport.count({
    where: {
      organizationId,
      createdAt: { gte: startDate, lte: now },
      isRecurring: true,
    }
  })
  const recurrenceRate = totalNCRs > 0 ? (recurringNCRs / totalNCRs) * 100 : 0

  // Calculate EFFECTIVENESS_SCORE (CAPAs with verified effectiveness)
  const verifiedCapas = capas.filter(c => 
    c.effectivenessVerified === true && c.effectivenessScore && c.effectivenessScore >= 80
  )
  const effectivenessScore = capas.length > 0
    ? (verifiedCapas.length / capas.length) * 100
    : 0

  // Calculate CUSTOMER_IMPACT_RATE
  const customerImpacts = await prisma.customerImpactAnalysis.count({
    where: {
      capa: {
        organizationId,
        createdAt: { gte: startDate, lte: now }
      }
    }
  })
  const customerImpactRate = capas.length > 0
    ? (customerImpacts / capas.length) * 100
    : 0

  // Calculate TRAINING_COMPLETION_RATE
  const trainingEnrollments = await prisma.capaTrainingEnrollment.count({
    where: {
      requirement: {
        capa: {
          organizationId,
          createdAt: { gte: startDate, lte: now }
        }
      }
    }
  })
  const completedTraining = await prisma.capaTrainingEnrollment.count({
    where: {
      requirement: {
        capa: {
          organizationId,
          createdAt: { gte: startDate, lte: now }
        }
      },
      status: 'VERIFIED'
    }
  })
  const trainingCompletionRate = trainingEnrollments > 0
    ? (completedTraining / trainingEnrollments) * 100
    : 0

  return {
    CLOSURE_TIME: Math.round(avgClosureTime),
    RECURRENCE_RATE: Math.round(recurrenceRate * 10) / 10,
    EFFECTIVENESS_SCORE: Math.round(effectivenessScore * 10) / 10,
    CUSTOMER_IMPACT_RATE: Math.round(customerImpactRate * 10) / 10,
    TRAINING_COMPLETION_RATE: Math.round(trainingCompletionRate * 10) / 10,
    TOTAL_CAPAS: capas.length,
    CLOSED_CAPAS: closedCapas.length,
    timeframe,
    calculatedAt: now,
  }
}

function getIndustryStandards(industryType: string) {
  const standards: any = {}
  
  // Always include ISO 9001 as baseline
  Object.assign(standards, INDUSTRY_STANDARDS.ISO_9001)

  // Add industry-specific standards
  if (industryType === 'MEDICAL_DEVICE') {
    Object.assign(standards, INDUSTRY_STANDARDS.FDA_MEDICAL_DEVICE)
    Object.assign(standards, INDUSTRY_STANDARDS.ISO_13485)
  } else if (industryType === 'PHARMA') {
    Object.assign(standards, INDUSTRY_STANDARDS.FDA_MEDICAL_DEVICE)
  }

  return standards
}

function getPeerBenchmarks(industryType: string, companySize: string) {
  const industry = PEER_BENCHMARKS[industryType as keyof typeof PEER_BENCHMARKS]
  if (!industry) return null

  const size = industry[companySize as keyof typeof industry]
  return size || null
}

function calculateGaps(orgMetrics: any, standards: any, peerBenchmarks: any) {
  const gaps = []

  for (const [metric, value] of Object.entries(orgMetrics)) {
    if (typeof value !== 'number') continue

    const standard = standards[metric]
    const peer = peerBenchmarks?.[metric]

    if (standard || peer) {
      const gap: any = {
        metric,
        organizationValue: value,
        meetsStandard: true,
        performanceLevel: 'GOOD',
      }

      if (standard) {
        gap.standardTarget = standard.target
        gap.standardAcceptable = standard.acceptable
        gap.standardSource = standard.standard
        gap.meetsStandard = value <= standard.acceptable || value >= standard.acceptable
        
        // For metrics where lower is better (closure time, recurrence)
        if (metric === 'CLOSURE_TIME' || metric === 'RECURRENCE_RATE') {
          gap.meetsStandard = value <= standard.acceptable
          gap.gap = value - standard.target
        } else {
          gap.meetsStandard = value >= standard.acceptable
          gap.gap = standard.target - value
        }
      }

      if (peer) {
        gap.peerP50 = peer.p50
        gap.peerP75 = peer.p75
        gap.peerP90 = peer.p90

        // Determine performance level vs peers
        if (metric === 'CLOSURE_TIME' || metric === 'RECURRENCE_RATE') {
          if (value <= peer.p25) gap.performanceLevel = 'EXCELLENT'
          else if (value <= peer.p50) gap.performanceLevel = 'GOOD'
          else if (value <= peer.p75) gap.performanceLevel = 'AVERAGE'
          else gap.performanceLevel = 'NEEDS_IMPROVEMENT'
        } else {
          if (value >= peer.p90) gap.performanceLevel = 'EXCELLENT'
          else if (value >= peer.p75) gap.performanceLevel = 'GOOD'
          else if (value >= peer.p50) gap.performanceLevel = 'AVERAGE'
          else gap.performanceLevel = 'NEEDS_IMPROVEMENT'
        }
      }

      gaps.push(gap)
    }
  }

  return gaps
}

function calculatePercentile(orgMetrics: any, peerBenchmarks: any) {
  if (!peerBenchmarks) return 50

  const percentiles = []

  for (const [metric, value] of Object.entries(orgMetrics)) {
    if (typeof value !== 'number') continue
    const peer = peerBenchmarks[metric]
    if (!peer) continue

    let percentile = 50
    if (metric === 'CLOSURE_TIME' || metric === 'RECURRENCE_RATE') {
      if (value <= peer.p25) percentile = 90
      else if (value <= peer.p50) percentile = 70
      else if (value <= peer.p75) percentile = 50
      else percentile = 25
    } else {
      if (value >= peer.p90) percentile = 90
      else if (value >= peer.p75) percentile = 75
      else if (value >= peer.p50) percentile = 50
      else percentile = 25
    }

    percentiles.push(percentile)
  }

  return percentiles.length > 0
    ? Math.round(percentiles.reduce((a, b) => a + b) / percentiles.length)
    : 50
}

function getPerformanceLevel(gaps: any[]) {
  const excellentCount = gaps.filter(g => g.performanceLevel === 'EXCELLENT').length
  const goodCount = gaps.filter(g => g.performanceLevel === 'GOOD').length
  const avgCount = gaps.filter(g => g.performanceLevel === 'AVERAGE').length

  const total = gaps.length
  if (excellentCount / total >= 0.6) return 'WORLD_CLASS'
  if ((excellentCount + goodCount) / total >= 0.7) return 'ABOVE_AVERAGE'
  if (avgCount / total >= 0.5) return 'AVERAGE'
  return 'NEEDS_IMPROVEMENT'
}

function generateRecommendations(gaps: any[], orgMetrics: any) {
  const recommendations = []

  for (const gap of gaps) {
    if (gap.performanceLevel === 'NEEDS_IMPROVEMENT' || !gap.meetsStandard) {
      let recommendation = {
        metric: gap.metric,
        priority: 'HIGH',
        issue: '',
        action: '',
        expectedImpact: '',
      }

      switch (gap.metric) {
        case 'CLOSURE_TIME':
          recommendation.issue = `Average closure time (${gap.organizationValue} days) exceeds industry target (${gap.standardTarget} days)`
          recommendation.action = 'Implement automated workflow reminders, assign dedicated CAPA owners, use root cause templates'
          recommendation.expectedImpact = 'Reduce closure time by 30-40%'
          break

        case 'RECURRENCE_RATE':
          recommendation.issue = `Recurrence rate (${gap.organizationValue}%) above acceptable threshold`
          recommendation.action = 'Strengthen root cause analysis, improve preventive action verification, increase training'
          recommendation.expectedImpact = 'Reduce recurrence by 50%'
          break

        case 'EFFECTIVENESS_SCORE':
          recommendation.issue = `Effectiveness verification score (${gap.organizationValue}%) below target`
          recommendation.action = 'Enhance effectiveness check procedures, extend observation periods, use data-driven metrics'
          recommendation.expectedImpact = 'Improve effectiveness score to >85%'
          break

        case 'TRAINING_COMPLETION_RATE':
          recommendation.issue = `Training completion rate (${gap.organizationValue}%) needs improvement`
          recommendation.action = 'Auto-enroll employees, send reminder notifications, block CAPA closure until training complete'
          recommendation.expectedImpact = 'Achieve >95% training completion'
          break
      }

      recommendations.push(recommendation)
    }
  }

  return recommendations
}
