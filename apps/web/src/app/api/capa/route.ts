/**
 * CAPA Root API
 * GET  /api/capa  — list CAPAs (with filters)
 * POST /api/capa  — create a new CAPA
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createCAPASchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description required"),
  category: z.string().default("QUALITY"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  sourceType: z.string().optional(),
  sourceId: z.string().optional(),
  assignedToId: z.string().optional(),
  dueDate: z.string().optional(),
  warehouseId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const assignedToId = searchParams.get("assignedToId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "20"));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      organizationId: session.user.organizationId,
    };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (assignedToId) where.assignedToId = assignedToId;

    const [capas, total] = await Promise.all([
      prisma.correctivePreventiveAction.findMany({
        where,
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.correctivePreventiveAction.count({ where }),
    ]);

    return NextResponse.json({
      capas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/capa error:", error);
    return NextResponse.json(
      { error: "Failed to fetch CAPAs" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createCAPASchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten() },
        { status: 400 },
      );
    }

    const data = validated.data;

    // Generate CAPA number
    const count = await prisma.correctivePreventiveAction.count({
      where: { organizationId: session.user.organizationId },
    });
    const capaNumber = `CAPA-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const capa = await prisma.correctivePreventiveAction.create({
      data: {
        capaNumber,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: "OPEN",
        sourceType: data.sourceType || "MANUAL",
        sourceId: data.sourceId,
        assignedToId: data.assignedToId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        organizationId: session.user.organizationId,
        createdById: session.user.id,
        warehouseId: data.warehouseId,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(capa, { status: 201 });
  } catch (error) {
    console.error("POST /api/capa error:", error);
    return NextResponse.json(
      { error: "Failed to create CAPA" },
      { status: 500 },
    );
  }
}
