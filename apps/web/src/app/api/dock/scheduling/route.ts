import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const createAppointmentSchema = z.object({
  action: z.literal('create_appointment'),
  carrier: z.string().min(1),
  shipmentId: z.string().min(1),
  appointmentTime: z.string().datetime(),
  estimatedDuration: z.number().min(15).max(480), // 15 min to 8 hours
  priority: z.enum(['URGENT', 'HIGH', 'NORMAL', 'LOW']),
  shipmentType: z.enum(['LTL', 'FTL', 'PARCEL', 'INTERMODAL', 'SPECIAL']),
  requirements: z.array(z.enum(['LIFTGATE', 'DOCK_HIGH', 'REFRIGERATED', 'HAZMAT', 'OVERSIZED'])).optional(),
});

const assignDockSchema = z.object({
  action: z.literal('assign_dock'),
  appointmentId: z.string().min(1),
  dockId: z.string().min(1),
  assignmentReason: z.string().optional(),
});

const optimizeScheduleSchema = z.object({
  action: z.literal('optimize_schedule'),
  date: z.string(),
  constraints: z.object({
    minTurnaroundTime: z.number().min(15).optional(),
    maxAppointmentsPerDock: z.number().min(1).optional(),
    prioritizeCarriers: z.array(z.string()).optional(),
  }).optional(),
});

const resolveConflictSchema = z.object({
  action: z.literal('resolve_conflict'),
  conflictId: z.string().min(1),
  resolution: z.enum(['REASSIGN_DOCK', 'RESCHEDULE_TIME', 'SPLIT_APPOINTMENT', 'CANCEL']),
  newDockId: z.string().optional(),
  newTime: z.string().datetime().optional(),
});

// Types
interface DockAppointment {
  id: string;
  carrier: string;
  shipmentId: string;
  appointmentTime: Date;
  estimatedDuration: number;
  actualStartTime?: Date;
  actualEndTime?: Date;
  assignedDockId?: string;
  priority: string;
  shipmentType: string;
  status: string;
  requirements?: string[];
}

interface Dock {
  id: string;
  name: string;
  type: 'LOADING' | 'UNLOADING' | 'DUAL';
  capabilities: string[];
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
  currentAppointmentId?: string;
}

interface ScheduleConflict {
  id: string;
  type: 'TIME_OVERLAP' | 'DOCK_UNAVAILABLE' | 'CAPABILITY_MISMATCH' | 'OVERBOOKED';
  appointmentIds: string[];
  dockId?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  suggestedResolution?: string;
}

// Dock availability calculation
function calculateDockAvailability(
  docks: Dock[],
  appointments: DockAppointment[],
  targetTime: Date,
  duration: number
): Dock[] {
  const endTime = new Date(targetTime.getTime() + duration * 60000);
  
  return docks.filter(dock => {
    if (dock.status === 'MAINTENANCE') return false;
    
    // Check for overlapping appointments
    const overlapping = appointments.filter(apt => {
      if (apt.assignedDockId !== dock.id) return false;
      if (apt.status === 'CANCELLED' || apt.status === 'COMPLETED') return false;
      
      const aptStart = new Date(apt.appointmentTime);
      const aptEnd = new Date(aptStart.getTime() + apt.estimatedDuration * 60000);
      
      // Check if there's any overlap
      return !(endTime <= aptStart || targetTime >= aptEnd);
    });
    
    return overlapping.length === 0;
  });
}

// Smart dock assignment algorithm
function assignOptimalDock(
  appointment: DockAppointment,
  availableDocks: Dock[],
  requirements: string[]
): { dock: Dock; score: number; reason: string } | null {
  const scoredDocks = availableDocks
    .map(dock => {
      let score = 50; // Base score
      let reasons: string[] = [];
      
      // Capability matching (most important)
      const hasAllCapabilities = requirements.every(req => 
        dock.capabilities.includes(req)
      );
      if (!hasAllCapabilities) return null; // Disqualify if can't meet requirements
      
      score += 30;
      reasons.push('meets requirements');
      
      // Dock type matching
      if (appointment.shipmentType === 'FTL' && dock.type === 'LOADING') {
        score += 10;
        reasons.push('FTL-optimized');
      }
      if (appointment.shipmentType === 'PARCEL' && dock.type === 'DUAL') {
        score += 5;
        reasons.push('flexible dock');
      }
      
      // Priority boost
      if (appointment.priority === 'URGENT') {
        score += 15;
        reasons.push('urgent priority');
      }
      
      // Prefer available over reserved
      if (dock.status === 'AVAILABLE') {
        score += 10;
        reasons.push('immediately available');
      }
      
      return {
        dock,
        score,
        reason: reasons.join(', '),
      };
    })
    .filter(Boolean) as { dock: Dock; score: number; reason: string }[];
  
  if (scoredDocks.length === 0) return null;
  
  // Return highest scoring dock
  return scoredDocks.sort((a, b) => b.score - a.score)[0];
}

// Detect scheduling conflicts
function detectConflicts(
  appointments: DockAppointment[],
  docks: Dock[]
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  
  // Check for time overlaps
  for (let i = 0; i < appointments.length; i++) {
    const apt1 = appointments[i];
    if (apt1.status === 'CANCELLED' || !apt1.assignedDockId) continue;
    
    for (let j = i + 1; j < appointments.length; j++) {
      const apt2 = appointments[j];
      if (apt2.status === 'CANCELLED' || !apt2.assignedDockId) continue;
      if (apt1.assignedDockId !== apt2.assignedDockId) continue;
      
      const apt1Start = new Date(apt1.appointmentTime);
      const apt1End = new Date(apt1Start.getTime() + apt1.estimatedDuration * 60000);
      const apt2Start = new Date(apt2.appointmentTime);
      const apt2End = new Date(apt2Start.getTime() + apt2.estimatedDuration * 60000);
      
      // Check overlap
      if (!(apt1End <= apt2Start || apt1Start >= apt2End)) {
        conflicts.push({
          id: `conflict_${apt1.id}_${apt2.id}`,
          type: 'TIME_OVERLAP',
          appointmentIds: [apt1.id, apt2.id],
          dockId: apt1.assignedDockId,
          severity: 'CRITICAL',
          description: `Appointments ${apt1.id} and ${apt2.id} overlap at dock ${apt1.assignedDockId}`,
          suggestedResolution: 'Reassign one appointment to different dock or time',
        });
      }
    }
  }
  
  // Check for capability mismatches
  appointments.forEach(apt => {
    if (!apt.assignedDockId || !apt.requirements) return;
    
    const dock = docks.find(d => d.id === apt.assignedDockId);
    if (!dock) return;
    
    const missingCapabilities = apt.requirements.filter(
      req => !dock.capabilities.includes(req)
    );
    
    if (missingCapabilities.length > 0) {
      conflicts.push({
        id: `capability_${apt.id}`,
        type: 'CAPABILITY_MISMATCH',
        appointmentIds: [apt.id],
        dockId: dock.id,
        severity: 'HIGH',
        description: `Dock ${dock.id} missing capabilities: ${missingCapabilities.join(', ')}`,
        suggestedResolution: 'Reassign to dock with required capabilities',
      });
    }
  });
  
  return conflicts;
}

// Optimize schedule using greedy algorithm
function optimizeSchedule(
  appointments: DockAppointment[],
  docks: Dock[],
  constraints: {
    minTurnaroundTime?: number;
    maxAppointmentsPerDock?: number;
  }
): {
  optimizedAppointments: DockAppointment[];
  improvements: string[];
  conflictsResolved: number;
} {
  const minTurnaround = constraints.minTurnaroundTime || 30;
  const sortedAppointments = [...appointments].sort((a, b) => {
    // Sort by priority first, then time
    const priorityOrder = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
    const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - 
                        priorityOrder[b.priority as keyof typeof priorityOrder];
    if (priorityDiff !== 0) return priorityDiff;
    
    return new Date(a.appointmentTime).getTime() - new Date(b.appointmentTime).getTime();
  });
  
  const optimized: DockAppointment[] = [];
  const improvements: string[] = [];
  let conflictsResolved = 0;
  
  sortedAppointments.forEach(apt => {
    const availableDocks = calculateDockAvailability(
      docks,
      optimized,
      new Date(apt.appointmentTime),
      apt.estimatedDuration + minTurnaround
    );
    
    const assignment = assignOptimalDock(apt, availableDocks, apt.requirements || []);
    
    if (assignment) {
      optimized.push({
        ...apt,
        assignedDockId: assignment.dock.id,
      });
      
      if (!apt.assignedDockId) {
        improvements.push(`Assigned ${apt.id} to ${assignment.dock.id}`);
      } else if (apt.assignedDockId !== assignment.dock.id) {
        improvements.push(`Reassigned ${apt.id} from ${apt.assignedDockId} to ${assignment.dock.id}`);
        conflictsResolved++;
      }
    } else {
      // Keep original assignment if no better option
      optimized.push(apt);
      improvements.push(`No better assignment found for ${apt.id}`);
    }
  });
  
  return {
    optimizedAppointments: optimized,
    improvements,
    conflictsResolved,
  };
}

// POST handler
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // CREATE APPOINTMENT
    if (action === 'create_appointment') {
      const data = createAppointmentSchema.parse(body);
      
      // Simulate appointment creation
      const appointment: DockAppointment = {
        id: `APT-${Date.now()}`,
        carrier: data.carrier,
        shipmentId: data.shipmentId,
        appointmentTime: new Date(data.appointmentTime),
        estimatedDuration: data.estimatedDuration,
        priority: data.priority,
        shipmentType: data.shipmentType,
        status: 'SCHEDULED',
        requirements: data.requirements,
      };
      
      // Get available docks
      const docks = await getAvailableDocks();
      const availableDocks = calculateDockAvailability(
        docks,
        [],
        appointment.appointmentTime,
        appointment.estimatedDuration
      );
      
      // Auto-assign optimal dock
      const assignment = assignOptimalDock(
        appointment,
        availableDocks,
        data.requirements || []
      );
      
      if (assignment) {
        appointment.assignedDockId = assignment.dock.id;
      }
      
      return NextResponse.json({
        success: true,
        appointment,
        assignedDock: assignment?.dock,
        assignmentReason: assignment?.reason,
        availableDocks: availableDocks.length,
      });
    }

    // ASSIGN DOCK
    if (action === 'assign_dock') {
      const data = assignDockSchema.parse(body);
      
      return NextResponse.json({
        success: true,
        appointmentId: data.appointmentId,
        assignedDockId: data.dockId,
        assignedAt: new Date(),
        reason: data.assignmentReason || 'Manual assignment',
      });
    }

    // OPTIMIZE SCHEDULE
    if (action === 'optimize_schedule') {
      const data = optimizeScheduleSchema.parse(body);
      
      // Get appointments for the date
      const appointments = await getAppointmentsForDate(data.date);
      const docks = await getAvailableDocks();
      
      const result = optimizeSchedule(
        appointments,
        docks,
        data.constraints || {}
      );
      
      return NextResponse.json({
        success: true,
        optimizedSchedule: result.optimizedAppointments,
        improvements: result.improvements,
        conflictsResolved: result.conflictsResolved,
        efficiency: `${((result.conflictsResolved / appointments.length) * 100).toFixed(1)}%`,
      });
    }

    // RESOLVE CONFLICT
    if (action === 'resolve_conflict') {
      const data = resolveConflictSchema.parse(body);
      
      let resolutionDetails = '';
      switch (data.resolution) {
        case 'REASSIGN_DOCK':
          resolutionDetails = `Reassigned to dock ${data.newDockId}`;
          break;
        case 'RESCHEDULE_TIME':
          resolutionDetails = `Rescheduled to ${data.newTime}`;
          break;
        case 'SPLIT_APPOINTMENT':
          resolutionDetails = 'Split into multiple smaller appointments';
          break;
        case 'CANCEL':
          resolutionDetails = 'Appointment cancelled';
          break;
      }
      
      return NextResponse.json({
        success: true,
        conflictId: data.conflictId,
        resolution: data.resolution,
        details: resolutionDetails,
        resolvedAt: new Date(),
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Dock scheduling error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET handler
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // GET SCHEDULE
    if (action === 'schedule') {
      const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
      const appointments = await getAppointmentsForDate(date);
      const docks = await getAvailableDocks();
      
      return NextResponse.json({
        date,
        appointments,
        docks,
        summary: {
          total: appointments.length,
          assigned: appointments.filter(a => a.assignedDockId).length,
          unassigned: appointments.filter(a => !a.assignedDockId).length,
          byStatus: {
            scheduled: appointments.filter(a => a.status === 'SCHEDULED').length,
            inProgress: appointments.filter(a => a.status === 'IN_PROGRESS').length,
            completed: appointments.filter(a => a.status === 'COMPLETED').length,
          },
        },
      });
    }

    // GET CONFLICTS
    if (action === 'conflicts') {
      const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
      const appointments = await getAppointmentsForDate(date);
      const docks = await getAvailableDocks();
      
      const conflicts = detectConflicts(appointments, docks);
      
      return NextResponse.json({
        conflicts,
        summary: {
          total: conflicts.length,
          critical: conflicts.filter(c => c.severity === 'CRITICAL').length,
          high: conflicts.filter(c => c.severity === 'HIGH').length,
          medium: conflicts.filter(c => c.severity === 'MEDIUM').length,
        },
      });
    }

    // GET DOCK AVAILABILITY
    if (action === 'dock_availability') {
      const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
      const docks = await getAvailableDocks();
      const appointments = await getAppointmentsForDate(date);
      
      const availability = docks.map(dock => {
        const dockAppointments = appointments.filter(a => a.assignedDockId === dock.id);
        const occupied = dockAppointments.filter(a => 
          a.status === 'IN_PROGRESS' || a.status === 'SCHEDULED'
        ).length;
        
        return {
          dock,
          appointmentsScheduled: dockAppointments.length,
          currentlyOccupied: occupied > 0,
          utilizationPercent: (dockAppointments.length / 8) * 100, // Assuming 8 appointments per day max
          nextAvailableSlot: dockAppointments.length > 0 
            ? new Date(Math.max(...dockAppointments.map(a => 
                new Date(a.appointmentTime).getTime() + a.estimatedDuration * 60000
              )))
            : new Date(),
        };
      });
      
      return NextResponse.json({ availability, date });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Dock scheduling GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions (simulated data for now)
async function getAvailableDocks(): Promise<Dock[]> {
  return [
    {
      id: 'DOCK-01',
      name: 'Dock 1',
      type: 'LOADING',
      capabilities: ['DOCK_HIGH', 'LIFTGATE'],
      status: 'AVAILABLE',
    },
    {
      id: 'DOCK-02',
      name: 'Dock 2',
      type: 'LOADING',
      capabilities: ['DOCK_HIGH', 'REFRIGERATED'],
      status: 'AVAILABLE',
    },
    {
      id: 'DOCK-03',
      name: 'Dock 3',
      type: 'DUAL',
      capabilities: ['DOCK_HIGH', 'LIFTGATE', 'OVERSIZED'],
      status: 'AVAILABLE',
    },
    {
      id: 'DOCK-04',
      name: 'Dock 4',
      type: 'LOADING',
      capabilities: ['DOCK_HIGH', 'HAZMAT'],
      status: 'AVAILABLE',
    },
    {
      id: 'DOCK-05',
      name: 'Dock 5',
      type: 'DUAL',
      capabilities: ['DOCK_HIGH', 'LIFTGATE'],
      status: 'AVAILABLE',
    },
    {
      id: 'DOCK-06',
      name: 'Dock 6',
      type: 'LOADING',
      capabilities: ['DOCK_HIGH'],
      status: 'MAINTENANCE',
    },
  ];
}

async function getAppointmentsForDate(date: string): Promise<DockAppointment[]> {
  const baseDate = new Date(date);
  
  return [
    {
      id: 'APT-001',
      carrier: 'FedEx Freight',
      shipmentId: 'SHP-2024-501',
      appointmentTime: new Date(baseDate.setHours(8, 0)),
      estimatedDuration: 60,
      priority: 'HIGH',
      shipmentType: 'FTL',
      status: 'SCHEDULED',
      assignedDockId: 'DOCK-01',
      requirements: ['DOCK_HIGH'],
    },
    {
      id: 'APT-002',
      carrier: 'XPO Logistics',
      shipmentId: 'SHP-2024-502',
      appointmentTime: new Date(baseDate.setHours(9, 30)),
      estimatedDuration: 90,
      priority: 'NORMAL',
      shipmentType: 'LTL',
      status: 'SCHEDULED',
      assignedDockId: 'DOCK-02',
      requirements: ['REFRIGERATED'],
    },
    {
      id: 'APT-003',
      carrier: 'UPS Freight',
      shipmentId: 'SHP-2024-503',
      appointmentTime: new Date(baseDate.setHours(11, 0)),
      estimatedDuration: 45,
      priority: 'URGENT',
      shipmentType: 'PARCEL',
      status: 'SCHEDULED',
      assignedDockId: 'DOCK-03',
    },
    {
      id: 'APT-004',
      carrier: 'Old Dominion',
      shipmentId: 'SHP-2024-504',
      appointmentTime: new Date(baseDate.setHours(13, 0)),
      estimatedDuration: 120,
      priority: 'NORMAL',
      shipmentType: 'FTL',
      status: 'SCHEDULED',
      assignedDockId: 'DOCK-04',
      requirements: ['HAZMAT'],
    },
    {
      id: 'APT-005',
      carrier: 'YRC Worldwide',
      shipmentId: 'SHP-2024-505',
      appointmentTime: new Date(baseDate.setHours(15, 0)),
      estimatedDuration: 60,
      priority: 'LOW',
      shipmentType: 'LTL',
      status: 'SCHEDULED',
      assignedDockId: 'DOCK-05',
    },
  ];
}
