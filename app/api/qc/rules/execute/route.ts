import { NextResponse } from 'next/server';
import EscalationEngine from '@/lib/engines/escalation.engine';

/**
 * POST /api/qc/rules/execute
 * Manually trigger escalation rules
 */
export async function POST(request: Request) {
  try {
    await EscalationEngine.runAllRules();

    return NextResponse.json({
      success: true,
      message: 'Escalation rules executed successfully'
    });

  } catch (error: any) {
    console.error('Escalation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute rules' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/qc/rules/execute
 * Get escalation rule status
 */
export async function GET(request: Request) {
  return NextResponse.json({
    success: true,
    data: {
      rules: [
        {
          id: 'rule-1',
          name: 'Critical NCR CAPA Requirement',
          description: 'Auto-create CAPA if critical NCR has no CAPA within 24h',
          enabled: true
        },
        {
          id: 'rule-2',
          name: 'Repeat Failure Quality Hold',
          description: 'Create quality hold if 3 NCRs within 7 days',
          enabled: true
        },
        {
          id: 'rule-3',
          name: 'High RPN Management Approval',
          description: 'Escalate CAPA to management if RPN > 200',
          enabled: true
        },
        {
          id: 'rule-4',
          name: 'Overdue CAPA Escalation',
          description: 'Notify management of CAPAs overdue by 7+ days',
          enabled: true
        },
        {
          id: 'rule-5',
          name: 'Sampling Plan Adjustment',
          description: 'Tighten inspection if 3+ failures in 7 days',
          enabled: true
        },
        {
          id: 'rule-6',
          name: 'Supplier Audit Trigger',
          description: 'Schedule audit if 2+ critical or 5+ total NCRs in 90 days',
          enabled: true
        }
      ]
    }
  });
}
