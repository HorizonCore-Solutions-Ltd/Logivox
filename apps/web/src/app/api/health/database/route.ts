import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test database connectivity
    await prisma.$queryRaw`SELECT 1`
    
    const dbHealth = {
      database: 'connected',
      timestamp: new Date().toISOString(),
      pool_status: 'active',
    }

    return NextResponse.json(dbHealth, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { 
        database: 'disconnected',
        error: 'Database connection failed',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}