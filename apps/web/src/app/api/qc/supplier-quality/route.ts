import { NextResponse } from "next/server";
import SupplierQualityService from "@/lib/services/qc/supplier-quality-service";
import { requireApiAuth } from "@/lib/api-guard";

export async function GET(request: Request) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get("supplierId");
    const action = searchParams.get("action");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId required" },
        { status: 400 },
      );
    }

    // Get single supplier quality
    if (supplierId && !action) {
      const quality = await SupplierQualityService.getSupplierQuality(
        supplierId,
        organizationId,
      );
      return NextResponse.json({ quality });
    }

    // Get trends
    if (supplierId && action === "trends") {
      const months = parseInt(searchParams.get("months") || "6");
      const trends = await SupplierQualityService.getQualityTrends(
        supplierId,
        organizationId,
        months,
      );
      return NextResponse.json({ trends });
    }

    // Compare suppliers
    if (action === "compare") {
      const supplierIds = searchParams.get("supplierIds")?.split(",") || [];
      const comparison = await SupplierQualityService.compareSuppliers(
        organizationId,
        supplierIds,
      );
      return NextResponse.json({ comparison });
    }

    // List all
    const status = searchParams.get("status") || undefined;
    const tier = searchParams.get("tier") || undefined;
    const suppliers = await SupplierQualityService.listSupplierQuality(
      organizationId,
      {
        status,
        tier,
      },
    );

    return NextResponse.json({ suppliers });
  } catch (error: any) {
    console.error("Error fetching supplier quality:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const body = await request.json();
    const { action, organizationId, supplierId } = body;

    if (action === "updateAll") {
      const results =
        await SupplierQualityService.updateAllSupplierQuality(organizationId);
      return NextResponse.json({ results });
    }

    if (supplierId) {
      const qualityScore = await SupplierQualityService.updateSupplierQuality(
        supplierId,
        organizationId,
      );
      return NextResponse.json({ qualityScore });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error: any) {
    console.error("Error updating supplier quality:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
