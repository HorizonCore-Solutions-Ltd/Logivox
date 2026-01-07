import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Mobile API - Authentication
 * Optimized for mobile app usage with token refresh
 */

// POST /api/mobile/auth/login - Mobile login
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, deviceId, deviceName, fcmToken } = body;

    // TODO: Implement actual authentication
    // For now, return mock response

    const accessToken = "mock_access_token";
    const refreshToken = "mock_refresh_token";

    return NextResponse.json(
      {
        success: true,
        data: {
          accessToken,
          refreshToken,
          expiresIn: 3600,
          user: {
            id: "user_123",
            email,
            name: "Mock User",
            role: "WAREHOUSE_STAFF",
          },
          device: {
            id: deviceId,
            registered: true,
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Mobile login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "LOGIN_FAILED",
          message: "Failed to authenticate",
        },
      },
      { status: 401 },
    );
  }
}
