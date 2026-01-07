import { NextRequest, NextResponse } from 'next/server';
import { SamplingPlanService } from '@/lib/services/qc/sampling-plan-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const plan = await SamplingPlanService.getPlanById(params.id);
    
    if (!plan) {
      return NextResponse.json(
        { error: 'Sampling plan not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(plan);
  } catch (error: any) {
    console.error('Error fetching sampling plan:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sampling plan' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    let result;

    switch (action) {
      case 'recordUsage':
        result = await SamplingPlanService.recordUsage(params.id);
        break;

      case 'supersede':
        if (!data.newPlanId) {
          return NextResponse.json(
            { error: 'newPlanId is required' },
            { status: 400 }
          );
        }
        result = await SamplingPlanService.supersedePlan(params.id, data.newPlanId);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error updating sampling plan:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update sampling plan' },
      { status: 500 }
    );
  }
}
