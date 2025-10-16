import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Kubernetes/Docker liveness probe endpoint
 * Returns 200 if the application is running and can handle requests
 * Does NOT check dependencies (database, redis, etc.)
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    { status: 200 }
  );
}
