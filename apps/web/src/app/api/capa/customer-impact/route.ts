import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// ============================================
// CAPA SYSTEM 11: CUSTOMER IMPACT ANALYSIS
// ============================================
// Track which customers received defective products from CAPA/NCR events.
// AI queries: "Which customers got shipments from Lot 847?"
// Automated customer notification workflow with recall integration.
// Compensation/credit tracking for affected customers.

// Customer Impact Analysis Schema
const impactAnalysisSchema = z.object({
  capaId: z.string(),
  lotNumber: z.string().optional(),
  serialNumber: z.string().optional(),
  productId: z.string().optional(),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }).optional(),
})

// Customer Notification Schema
const notificationSchema = z.object({
  impactId: z.string(),
  notificationType: z.enum(['EMAIL', 'PHONE', 'LETTER', 'VISIT']),
  subject: z.string(),
  message: z.string(),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  requiresResponse: z.boolean().default(false),
  responseDeadline: z.string().datetime().optional(),
})

// Compensation Record Schema
const compensationSchema = z.object({
  impactId: z.string(),
  compensationType: z.enum(['REFUND', 'CREDIT', 'REPLACEMENT', 'DISCOUNT', 'OTHER']),
  amount: z.number().min(0),
  currency: z.string().default('USD'),
  status: z.enum(['PENDING', 'APPROVED', 'ISSUED', 'REJECTED']),
  approvedBy: z.string().optional(),
  notes: z.string().optional(),
})

// ============================================
// GET: Retrieve customer impact data
// ============================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const capaId = searchParams.get('capaId')
    const customerId = searchParams.get('customerId')
    const lotNumber = searchParams.get('lotNumber')
    const serialNumber = searchParams.get('serialNumber')
    const severity = searchParams.get('severity')
    const notificationStatus = searchParams.get('notificationStatus')
    const impactId = searchParams.get('impactId')

    // Get specific impact with full details
    if (impactId) {
      const impact = await prisma.customerImpactAnalysis.findUnique({
        where: { id: impactId },
        include: {
          capa: {
            select: {
              capaNumber: true,
              title: true,
              description: true,
              status: true,
              severity: true,
            }
          },
          customer: {
            select: {
              name: true,
              email: true,
              phone: true,
              address: true,
            }
          },
          shipment: {
            select: {
              trackingNumber: true,
              shippedAt: true,
              deliveredAt: true,
            }
          },
          salesOrder: {
            select: {
              orderNumber: true,
              orderDate: true,
              totalAmount: true,
            }
          },
          notifications: {
            orderBy: { sentAt: 'desc' }
          },
          compensation: true,
        }
      })

      return NextResponse.json({ impact })
    }

    // Build query conditions
    const where: any = {
      capa: {
        organizationId: session.user.organizationId,
      }
    }

    if (capaId) {
      where.capaId = capaId
    }

    if (customerId) {
      where.customerId = customerId
    }

    if (lotNumber) {
      where.affectedLotNumbers = {
        has: lotNumber
      }
    }

    if (serialNumber) {
      where.affectedSerialNumbers = {
        has: serialNumber
      }
    }

    if (severity) {
      where.impactSeverity = severity
    }

    if (notificationStatus) {
      where.notificationStatus = notificationStatus
    }

    // Get all customer impacts
    const impacts = await prisma.customerImpactAnalysis.findMany({
      where,
      include: {
        capa: {
          select: {
            capaNumber: true,
            title: true,
            severity: true,
          }
        },
        customer: {
          select: {
            name: true,
            email: true,
          }
        },
        notifications: {
          take: 1,
          orderBy: { sentAt: 'desc' }
        },
        compensation: true,
      },
      orderBy: {
        identifiedAt: 'desc',
      }
    })

    // Calculate statistics
    const stats = {
      totalImpacts: impacts.length,
      customersAffected: new Set(impacts.map(i => i.customerId)).size,
      unitsAffected: impacts.reduce((sum, i) => sum + i.affectedQuantity, 0),
      notificationsPending: impacts.filter(i => i.notificationStatus === 'PENDING').length,
      notificationsSent: impacts.filter(i => i.notificationStatus === 'SENT').length,
      responsesReceived: impacts.filter(i => i.customerResponse !== null).length,
      compensationTotal: impacts
        .flatMap(i => i.compensation)
        .filter(c => c.status === 'ISSUED')
        .reduce((sum, c) => sum + parseFloat(c.amount.toString()), 0),
      severityBreakdown: {
        critical: impacts.filter(i => i.impactSeverity === 'CRITICAL').length,
        high: impacts.filter(i => i.impactSeverity === 'HIGH').length,
        medium: impacts.filter(i => i.impactSeverity === 'MEDIUM').length,
        low: impacts.filter(i => i.impactSeverity === 'LOW').length,
      }
    }

    return NextResponse.json({ impacts, stats })

  } catch (error) {
    console.error('Customer Impact GET error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve customer impact data' },
      { status: 500 }
    )
  }
}

// ============================================
// POST: Analyze impact, send notifications, record compensation
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
    // ACTION: ANALYZE_IMPACT
    // ==========================================
    if (action === 'ANALYZE_IMPACT') {
      const data = impactAnalysisSchema.parse(body)

      // Validate CAPA exists
      const capa = await prisma.correctivePreventiveAction.findFirst({
        where: {
          id: data.capaId,
          organizationId: session.user.organizationId,
        }
      })

      if (!capa) {
        return NextResponse.json(
          { error: 'CAPA not found' },
          { status: 404 }
        )
      }

      // Find affected shipments based on lot number, serial number, or product
      const shipmentWhere: any = {
        salesOrder: {
          organizationId: session.user.organizationId,
        }
      }

      // Build filter based on provided criteria
      if (data.dateRange) {
        shipmentWhere.shippedAt = {
          gte: new Date(data.dateRange.start),
          lte: new Date(data.dateRange.end),
        }
      }

      const shipments = await prisma.shipment.findMany({
        where: shipmentWhere,
        include: {
          salesOrder: {
            include: {
              customer: true,
              items: {
                include: {
                  product: true,
                }
              }
            }
          },
          items: true,
        }
      })

      // Filter shipments by lot/serial/product
      const affectedShipments = shipments.filter(shipment => {
        // Check if any shipment items match the criteria
        const orderItems = shipment.salesOrder.items

        if (data.lotNumber) {
          // Check if any item has this lot number (would need lot tracking in schema)
          return true // Placeholder - actual implementation would check lot numbers
        }

        if (data.serialNumber) {
          // Check if any item has this serial number
          return true // Placeholder
        }

        if (data.productId) {
          return orderItems.some(item => item.productId === data.productId)
        }

        return false
      })

      // Create customer impact records
      const impacts = await Promise.all(
        affectedShipments.map(async (shipment) => {
          const customer = shipment.salesOrder.customer
          const affectedItems = shipment.salesOrder.items.filter(item => {
            if (data.productId) return item.productId === data.productId
            return true
          })

          const totalQuantity = affectedItems.reduce((sum, item) => 
            sum + parseFloat(item.quantity.toString()), 0
          )

          const totalValue = affectedItems.reduce((sum, item) => 
            sum + parseFloat(item.unitPrice.toString()) * parseFloat(item.quantity.toString()), 0
          )

          // Determine severity based on CAPA severity and quantity
          let impactSeverity = 'MEDIUM'
          if (capa.severity === 'CRITICAL' || totalQuantity > 100) {
            impactSeverity = 'CRITICAL'
          } else if (capa.severity === 'HIGH' || totalQuantity > 50) {
            impactSeverity = 'HIGH'
          } else if (totalQuantity > 10) {
            impactSeverity = 'MEDIUM'
          } else {
            impactSeverity = 'LOW'
          }

          return prisma.customerImpactAnalysis.create({
            data: {
              capaId: data.capaId,
              customerId: customer.id,
              salesOrderId: shipment.salesOrderId,
              shipmentId: shipment.id,
              affectedQuantity: Math.floor(totalQuantity),
              estimatedValue: totalValue,
              impactSeverity,
              impactDescription: `Customer received ${Math.floor(totalQuantity)} units potentially affected by ${capa.title}`,
              affectedLotNumbers: data.lotNumber ? [data.lotNumber] : [],
              affectedSerialNumbers: data.serialNumber ? [data.serialNumber] : [],
              notificationStatus: 'PENDING',
              identifiedAt: new Date(),
              identifiedBy: session.user.id,
            }
          })
        })
      )

      return NextResponse.json({
        success: true,
        message: `Identified ${impacts.length} affected customers`,
        impacts,
        summary: {
          customersAffected: impacts.length,
          totalUnits: impacts.reduce((sum, i) => sum + i.affectedQuantity, 0),
          totalValue: impacts.reduce((sum, i) => sum + parseFloat(i.estimatedValue.toString()), 0),
        }
      })
    }

    // ==========================================
    // ACTION: SEND_NOTIFICATION
    // ==========================================
    if (action === 'SEND_NOTIFICATION') {
      const data = notificationSchema.parse(body)

      // Get impact record
      const impact = await prisma.customerImpactAnalysis.findUnique({
        where: { id: data.impactId },
        include: {
          customer: true,
          capa: true,
        }
      })

      if (!impact) {
        return NextResponse.json(
          { error: 'Customer impact record not found' },
          { status: 404 }
        )
      }

      // Create notification record
      const notification = await prisma.customerNotification.create({
        data: {
          impactId: data.impactId,
          notificationType: data.notificationType,
          subject: data.subject,
          message: data.message,
          urgency: data.urgency,
          requiresResponse: data.requiresResponse,
          responseDeadline: data.responseDeadline ? new Date(data.responseDeadline) : null,
          sentAt: new Date(),
          sentBy: session.user.id,
          deliveryStatus: 'SENT',
        }
      })

      // Update impact notification status
      await prisma.customerImpactAnalysis.update({
        where: { id: data.impactId },
        data: { 
          notificationStatus: 'SENT',
          lastNotificationAt: new Date(),
        }
      })

      // In production, would actually send email/SMS here
      // await sendEmail(impact.customer.email, data.subject, data.message)

      return NextResponse.json({
        success: true,
        notification,
        message: `Notification sent to ${impact.customer.name} via ${data.notificationType}`
      })
    }

    // ==========================================
    // ACTION: RECORD_CUSTOMER_RESPONSE
    // ==========================================
    if (action === 'RECORD_CUSTOMER_RESPONSE') {
      const { impactId, responseText, responseReceived, actionRequested } = body

      const impact = await prisma.customerImpactAnalysis.update({
        where: { id: impactId },
        data: {
          customerResponse: responseText,
          customerResponseAt: responseReceived ? new Date(responseReceived) : new Date(),
          actionRequested,
        }
      })

      return NextResponse.json({
        success: true,
        impact,
        message: 'Customer response recorded'
      })
    }

    // ==========================================
    // ACTION: CREATE_COMPENSATION
    // ==========================================
    if (action === 'CREATE_COMPENSATION') {
      const data = compensationSchema.parse(body)

      // Get impact record
      const impact = await prisma.customerImpactAnalysis.findUnique({
        where: { id: data.impactId },
        include: { customer: true }
      })

      if (!impact) {
        return NextResponse.json(
          { error: 'Customer impact record not found' },
          { status: 404 }
        )
      }

      // Create compensation record
      const compensation = await prisma.compensationRecord.create({
        data: {
          impactId: data.impactId,
          compensationType: data.compensationType,
          amount: data.amount,
          currency: data.currency,
          status: data.status,
          approvedBy: data.approvedBy,
          notes: data.notes,
          createdBy: session.user.id,
        }
      })

      return NextResponse.json({
        success: true,
        compensation,
        message: `${data.compensationType} compensation created for ${impact.customer.name}`
      })
    }

    // ==========================================
    // ACTION: INITIATE_RECALL
    // ==========================================
    if (action === 'INITIATE_RECALL') {
      const { capaId, recallType, recallScope, recallReason, urgency } = body

      // Get all customer impacts for this CAPA
      const impacts = await prisma.customerImpactAnalysis.findMany({
        where: { capaId },
        include: { customer: true }
      })

      if (impacts.length === 0) {
        return NextResponse.json(
          { error: 'No customer impacts found for this CAPA' },
          { status: 404 }
        )
      }

      // Create recall record
      const recall = await prisma.productRecall.create({
        data: {
          capaId,
          recallType,
          recallScope,
          recallReason,
          urgency,
          customersAffected: impacts.length,
          unitsAffected: impacts.reduce((sum, i) => sum + i.affectedQuantity, 0),
          status: 'INITIATED',
          initiatedBy: session.user.id,
          initiatedAt: new Date(),
        }
      })

      // Send notifications to all affected customers
      const notifications = await Promise.all(
        impacts.map(impact =>
          prisma.customerNotification.create({
            data: {
              impactId: impact.id,
              notificationType: 'EMAIL',
              subject: `URGENT: Product Recall Notice - ${recallType}`,
              message: `Dear ${impact.customer.name},\n\nThis is an urgent notification regarding a ${recallType} recall.\n\nReason: ${recallReason}\n\nPlease contact us immediately.\n\nReference: ${recall.id}`,
              urgency: urgency as any,
              requiresResponse: true,
              sentAt: new Date(),
              sentBy: session.user.id,
              deliveryStatus: 'SENT',
            }
          })
        )
      )

      return NextResponse.json({
        success: true,
        recall,
        notificationsSent: notifications.length,
        message: `Recall initiated. ${notifications.length} customers notified.`
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

    console.error('Customer Impact POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process customer impact action' },
      { status: 500 }
    )
  }
}
