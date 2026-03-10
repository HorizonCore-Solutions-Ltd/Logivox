const fs = require("fs");
const path = "apps/web/src/app/api/gate-entries/route.ts";
let code = fs.readFileSync(path, "utf8");

// replace imports
code = code.replace(
  'import { authOptions } from "@/lib/auth";',
  'import { authOptions } from "@/lib/auth";\nimport { logAudit } from "../../../../../../../lib/audit-service";\nimport { publishEvent } from "../../../../../../../lib/event-service";\nimport { z } from "zod";\nimport { validateContract } from "../../../../../../../lib/api-middleware";',
);

// We need to inject the zod schema and update the POST method
const schemaStr = `
const gateEntrySchema = z.object({
  entryType: z.string(),
  direction: z.string(),
  vehicleType: z.string().optional(),
  vehicleNumber: z.string().optional(),
  licensePlate: z.string().optional(),
  trailerNumber: z.string().optional(),
  driverName: z.string().optional(),
  driverLicense: z.string().optional(),
  driverPhone: z.string().optional(),
  carrierName: z.string().optional(),
  appointmentId: z.string().optional(),
  referenceNumber: z.string().optional(),
  gateNumber: z.string().optional(),
  securityCheckPassed: z.boolean().optional(),
  notes: z.string().optional(),
});
`;

code = code.replace(
  "export async function GET(request: Request) {",
  schemaStr + "\nexport async function GET(request: Request) {",
);

const oldPostStr = `export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const orgId = session.user.organizationId;

    const body = await request.json();
    const {
      entryType,
      direction,
      vehicleType,
      vehicleNumber,
      licensePlate,
      trailerNumber,
      driverName,
      driverLicense,
      driverPhone,
      carrierName,
      appointmentId,
      referenceNumber,
      gateNumber,
      securityCheckPassed,
      notes,
    } = body;

    if (!entryType || !direction) {
      return NextResponse.json(
        { error: "entryType and direction are required" },
        { status: 400 },
      );
    }`;

const newPostStr = `export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const orgId = session.user.organizationId;
    const userId = session.user.id;

    const { data: body, errorResponse } = await validateContract(request, gateEntrySchema);
    if (errorResponse) return errorResponse;

    const {
      entryType,
      direction,
      vehicleType,
      vehicleNumber,
      licensePlate,
      trailerNumber,
      driverName,
      driverLicense,
      driverPhone,
      carrierName,
      appointmentId,
      referenceNumber,
      gateNumber,
      securityCheckPassed,
      notes,
    } = body!;
`;

code = code.replace(oldPostStr, newPostStr);

const oldCreateStr = `    const entry = await prisma.gateEntry.create({
      data: {
        organizationId: orgId,
        entryNumber,
        entryType,
        direction,
        vehicleType,
        vehicleNumber,
        licensePlate,
        trailerNumber,
        driverName,
        driverLicense,
        driverPhone,
        carrierName,
        appointmentId,
        referenceNumber,
        gateNumber,
        securityCheckPassed: securityCheckPassed ?? false,
        notes,
        entryTime: new Date(),
        status: "CHECKED_IN",
      },
    });

    return NextResponse.json({ success: true, entry }, { status: 201 });`;

const newCreateStr = `    const entry = await prisma.gateEntry.create({
      data: {
        organizationId: orgId,
        entryNumber,
        entryType,
        direction,
        vehicleType,
        vehicleNumber,
        licensePlate,
        trailerNumber,
        driverName,
        driverLicense,
        driverPhone,
        carrierName,
        appointmentId,
        referenceNumber,
        gateNumber,
        securityCheckPassed: securityCheckPassed ?? false,
        notes,
        entryTime: new Date(),
        status: "CHECKED_IN",
      },
    });

    // Zero-trust Traceability: Log the Action
    await logAudit({
      eventType: "GATE_ENTRY_CREATED",
      userId,
      resource: "GateEntry",
      resourceId: entry.id,
      action: \`Driver \${driverName || "Unknown"} checked in at gate \${gateNumber || "Unknown"}\`,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      success: true,
      changes: { direction, entryType, vehicleNumber, driverName }
    });

    // Indempotency/Eventing: Write to Outbox
    await publishEvent({
      eventType: "gate_entry.checked_in",
      payload: { entryId: entry.id, organizationId: orgId, driverName, entryNumber },
      aggregateId: entry.id,
      aggregateType: "GateEntry"
    });

    return NextResponse.json({ success: true, entry }, { status: 201 });`;

code = code.replace(oldCreateStr, newCreateStr);

fs.writeFileSync(path, code);
console.log("Done pitching");
