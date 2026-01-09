import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// ============================================
// CAPA SYSTEM 14: MOBILE CAPA APP
// ============================================
// Mobile-first CAPA creation and management
// Photo capture, voice notes, offline mode
// Progressive Web App (PWA) capabilities
// Optimized for QC inspectors in the field

// Mobile CAPA Creation Schema
const mobileCapaSchema = z.object({
  title: z.string(),
  description: z.string(),
  ncrId: z.string().optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  capaType: z.enum(['CORRECTIVE', 'PREVENTIVE', 'BOTH']),
  
  // Mobile-specific fields
  photoUrls: z.array(z.string()).optional(),
  voiceNoteUrl: z.string().optional(),
  voiceTranscript: z.string().optional(),
  gpsLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number(),
  }).optional(),
  deviceInfo: z.object({
    deviceType: z.string(),
    os: z.string(),
    appVersion: z.string(),
  }).optional(),
  
  // Offline sync metadata
  offlineCreatedAt: z.string().optional(),
  syncedAt: z.string().optional(),
})

// Quick Status Update Schema
const quickUpdateSchema = z.object({
  capaId: z.string(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'UNDER_REVIEW', 'CLOSED', 'REJECTED']),
  notes: z.string().optional(),
  photoUrls: z.array(z.string()).optional(),
})

// Mobile Activity Log Schema
const mobileActivitySchema = z.object({
  capaId: z.string(),
  activityType: z.enum([
    'VIEWED',
    'STATUS_CHANGED',
    'PHOTO_ADDED',
    'VOICE_NOTE_ADDED',
    'COMMENT_ADDED',
    'OFFLINE_EDIT',
    'SYNCED'
  ]),
  details: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

// ============================================
// GET: Retrieve mobile-optimized CAPA data
// ============================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const capaId = searchParams.get('capaId')
    const assignedToMe = searchParams.get('assignedToMe') === 'true'
    const status = searchParams.get('status')
    const includePhotos = searchParams.get('includePhotos') === 'true'
    const lightweight = searchParams.get('lightweight') === 'true' // Minimal data for offline sync
    const activityLogId = searchParams.get('activityLogId')

    // Get specific activity log
    if (activityLogId) {
      const activity = await prisma.mobileActivityLog.findUnique({
        where: { id: activityLogId },
        include: {
          capa: {
            select: {
              capaNumber: true,
              title: true,
            }
          }
        }
      })

      return NextResponse.json({ activity })
    }

    // Get specific CAPA (mobile-optimized)
    if (capaId) {
      const capa = await prisma.correctivePreventiveAction.findFirst({
        where: {
          id: capaId,
          organizationId: session.user.organizationId,
        },
        include: {
          ncr: true,
          mobileMetadata: true,
          mobileActivities: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        }
      })

      if (!capa) {
        return NextResponse.json({ error: 'CAPA not found' }, { status: 404 })
      }

      return NextResponse.json({ capa })
    }

    // Build query for list
    const where: any = {
      organizationId: session.user.organizationId,
    }

    if (assignedToMe) {
      where.assignedTo = session.user.id
    }

    if (status) {
      where.status = status
    }

    // Get CAPAs (lightweight for mobile)
    const select = lightweight ? {
      id: true,
      capaNumber: true,
      title: true,
      status: true,
      priority: true,
      severity: true,
      targetCompletionDate: true,
      updatedAt: true,
    } : undefined

    const capas = await prisma.correctivePreventiveAction.findMany({
      where,
      select,
      include: !lightweight ? {
        mobileMetadata: includePhotos,
        ncr: {
          select: {
            ncrNumber: true,
            defectType: true,
          }
        }
      } : undefined,
      orderBy: [
        { priority: 'desc' },
        { targetCompletionDate: 'asc' }
      ],
      take: 50, // Limit for mobile performance
    })

    // Mobile stats
    const stats = {
      totalAssigned: assignedToMe ? capas.length : 
        await prisma.correctivePreventiveAction.count({
          where: {
            organizationId: session.user.organizationId,
            assignedTo: session.user.id,
          }
        }),
      openCAPAs: await prisma.correctivePreventiveAction.count({
        where: {
          organizationId: session.user.organizationId,
          assignedTo: assignedToMe ? session.user.id : undefined,
          status: 'OPEN',
        }
      }),
      overdueCAPAs: await prisma.correctivePreventiveAction.count({
        where: {
          organizationId: session.user.organizationId,
          assignedTo: assignedToMe ? session.user.id : undefined,
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          targetCompletionDate: { lt: new Date() },
        }
      }),
      pendingSync: await prisma.mobileActivityLog.count({
        where: {
          userId: session.user.id,
          activityType: 'OFFLINE_EDIT',
          metadata: { path: ['synced'], equals: false },
        }
      }),
    }

    return NextResponse.json({ capas, stats })

  } catch (error) {
    console.error('Mobile CAPA GET error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve mobile CAPA data' },
      { status: 500 }
    )
  }
}

// ============================================
// POST: Mobile CAPA operations
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
    // ACTION: CREATE_MOBILE_CAPA
    // ==========================================
    if (action === 'CREATE_MOBILE_CAPA') {
      const data = mobileCapaSchema.parse(body)

      // Generate CAPA number
      const count = await prisma.correctivePreventiveAction.count({
        where: { organizationId: session.user.organizationId }
      })
      const capaNumber = `CAPA-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

      // Create CAPA
      const capa = await prisma.correctivePreventiveAction.create({
        data: {
          organizationId: session.user.organizationId,
          capaNumber,
          title: data.title,
          description: data.description,
          ncrId: data.ncrId,
          priority: data.priority,
          severity: data.severity,
          capaType: data.capaType,
          status: 'OPEN',
          createdBy: session.user.id,
          assignedTo: session.user.id,
          targetCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        }
      })

      // Create mobile metadata
      const metadata = await prisma.mobileCAPAMetadata.create({
        data: {
          capaId: capa.id,
          photoUrls: data.photoUrls || [],
          voiceNoteUrl: data.voiceNoteUrl,
          voiceTranscript: data.voiceTranscript,
          gpsLocation: data.gpsLocation ? JSON.stringify(data.gpsLocation) : null,
          deviceInfo: data.deviceInfo ? JSON.stringify(data.deviceInfo) : null,
          createdViaApp: true,
          offlineCreatedAt: data.offlineCreatedAt ? new Date(data.offlineCreatedAt) : null,
          syncedAt: new Date(),
        }
      })

      // Log activity
      await prisma.mobileActivityLog.create({
        data: {
          capaId: capa.id,
          userId: session.user.id,
          activityType: 'OFFLINE_EDIT',
          details: 'Created CAPA via mobile app',
          metadata: {
            createdViaApp: true,
            hasPhotos: (data.photoUrls?.length || 0) > 0,
            hasVoiceNote: !!data.voiceNoteUrl,
            synced: true,
          },
        }
      })

      return NextResponse.json({
        success: true,
        capa,
        metadata,
        capaNumber,
        message: 'CAPA created successfully via mobile app',
      })
    }

    // ==========================================
    // ACTION: QUICK_UPDATE_STATUS
    // ==========================================
    if (action === 'QUICK_UPDATE_STATUS') {
      const data = quickUpdateSchema.parse(body)

      // Validate CAPA exists and user has access
      const capa = await prisma.correctivePreventiveAction.findFirst({
        where: {
          id: data.capaId,
          organizationId: session.user.organizationId,
        }
      })

      if (!capa) {
        return NextResponse.json({ error: 'CAPA not found' }, { status: 404 })
      }

      // Update status
      const updated = await prisma.correctivePreventiveAction.update({
        where: { id: data.capaId },
        data: {
          status: data.status,
          ...(data.status === 'CLOSED' && { closedDate: new Date(), closedBy: session.user.id }),
        }
      })

      // Update metadata if photos added
      if (data.photoUrls && data.photoUrls.length > 0) {
        const existing = await prisma.mobileCAPAMetadata.findUnique({
          where: { capaId: data.capaId }
        })

        if (existing) {
          await prisma.mobileCAPAMetadata.update({
            where: { capaId: data.capaId },
            data: {
              photoUrls: [...(existing.photoUrls || []), ...data.photoUrls],
            }
          })
        } else {
          await prisma.mobileCAPAMetadata.create({
            data: {
              capaId: data.capaId,
              photoUrls: data.photoUrls,
              createdViaApp: true,
            }
          })
        }
      }

      // Log activity
      await prisma.mobileActivityLog.create({
        data: {
          capaId: data.capaId,
          userId: session.user.id,
          activityType: 'STATUS_CHANGED',
          details: `Status changed to ${data.status}${data.notes ? ': ' + data.notes : ''}`,
          metadata: {
            oldStatus: capa.status,
            newStatus: data.status,
            photosAdded: data.photoUrls?.length || 0,
          },
        }
      })

      return NextResponse.json({
        success: true,
        capa: updated,
        message: `Status updated to ${data.status}`,
      })
    }

    // ==========================================
    // ACTION: ADD_PHOTO
    // ==========================================
    if (action === 'ADD_PHOTO') {
      const { capaId, photoUrl, description } = body

      if (!capaId || !photoUrl) {
        return NextResponse.json({ error: 'Missing capaId or photoUrl' }, { status: 400 })
      }

      // Validate CAPA access
      const capa = await prisma.correctivePreventiveAction.findFirst({
        where: {
          id: capaId,
          organizationId: session.user.organizationId,
        }
      })

      if (!capa) {
        return NextResponse.json({ error: 'CAPA not found' }, { status: 404 })
      }

      // Update or create metadata
      const existing = await prisma.mobileCAPAMetadata.findUnique({
        where: { capaId }
      })

      let metadata
      if (existing) {
        metadata = await prisma.mobileCAPAMetadata.update({
          where: { capaId },
          data: {
            photoUrls: [...(existing.photoUrls || []), photoUrl],
          }
        })
      } else {
        metadata = await prisma.mobileCAPAMetadata.create({
          data: {
            capaId,
            photoUrls: [photoUrl],
            createdViaApp: true,
          }
        })
      }

      // Log activity
      await prisma.mobileActivityLog.create({
        data: {
          capaId,
          userId: session.user.id,
          activityType: 'PHOTO_ADDED',
          details: description || 'Photo added via mobile app',
          metadata: {
            photoUrl,
            totalPhotos: metadata.photoUrls.length,
          },
        }
      })

      return NextResponse.json({
        success: true,
        metadata,
        message: 'Photo added successfully',
      })
    }

    // ==========================================
    // ACTION: ADD_VOICE_NOTE
    // ==========================================
    if (action === 'ADD_VOICE_NOTE') {
      const { capaId, voiceNoteUrl, voiceTranscript } = body

      if (!capaId || !voiceNoteUrl) {
        return NextResponse.json({ error: 'Missing capaId or voiceNoteUrl' }, { status: 400 })
      }

      // Validate CAPA access
      const capa = await prisma.correctivePreventiveAction.findFirst({
        where: {
          id: capaId,
          organizationId: session.user.organizationId,
        }
      })

      if (!capa) {
        return NextResponse.json({ error: 'CAPA not found' }, { status: 404 })
      }

      // Update or create metadata
      const existing = await prisma.mobileCAPAMetadata.findUnique({
        where: { capaId }
      })

      let metadata
      if (existing) {
        metadata = await prisma.mobileCAPAMetadata.update({
          where: { capaId },
          data: {
            voiceNoteUrl,
            voiceTranscript,
          }
        })
      } else {
        metadata = await prisma.mobileCAPAMetadata.create({
          data: {
            capaId,
            voiceNoteUrl,
            voiceTranscript,
            createdViaApp: true,
          }
        })
      }

      // Auto-append transcript to CAPA description if available
      if (voiceTranscript) {
        await prisma.correctivePreventiveAction.update({
          where: { id: capaId },
          data: {
            description: `${capa.description}\n\n[Voice Note]: ${voiceTranscript}`,
          }
        })
      }

      // Log activity
      await prisma.mobileActivityLog.create({
        data: {
          capaId,
          userId: session.user.id,
          activityType: 'VOICE_NOTE_ADDED',
          details: voiceTranscript || 'Voice note added via mobile app',
          metadata: {
            voiceNoteUrl,
            hasTranscript: !!voiceTranscript,
          },
        }
      })

      return NextResponse.json({
        success: true,
        metadata,
        message: 'Voice note added successfully',
      })
    }

    // ==========================================
    // ACTION: LOG_MOBILE_ACTIVITY
    // ==========================================
    if (action === 'LOG_MOBILE_ACTIVITY') {
      const data = mobileActivitySchema.parse(body)

      const activity = await prisma.mobileActivityLog.create({
        data: {
          capaId: data.capaId,
          userId: session.user.id,
          activityType: data.activityType,
          details: data.details,
          metadata: data.metadata || {},
        }
      })

      return NextResponse.json({
        success: true,
        activity,
      })
    }

    // ==========================================
    // ACTION: SYNC_OFFLINE_CHANGES
    // ==========================================
    if (action === 'SYNC_OFFLINE_CHANGES') {
      const { changes } = body // Array of offline changes

      if (!Array.isArray(changes)) {
        return NextResponse.json({ error: 'Invalid changes format' }, { status: 400 })
      }

      const results = {
        succeeded: 0,
        failed: 0,
        errors: [] as any[],
      }

      // Process each change
      for (const change of changes) {
        try {
          if (change.type === 'CREATE_CAPA') {
            await POST(new NextRequest(request.url, {
              method: 'POST',
              body: JSON.stringify({
                action: 'CREATE_MOBILE_CAPA',
                ...change.data,
              }),
            }))
          } else if (change.type === 'UPDATE_STATUS') {
            await POST(new NextRequest(request.url, {
              method: 'POST',
              body: JSON.stringify({
                action: 'QUICK_UPDATE_STATUS',
                ...change.data,
              }),
            }))
          }
          results.succeeded++
        } catch (error) {
          results.failed++
          results.errors.push({
            change,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      return NextResponse.json({
        success: true,
        message: `Synced ${results.succeeded} of ${changes.length} changes`,
        results,
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Mobile CAPA POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process mobile CAPA action' },
      { status: 500 }
    )
  }
}
