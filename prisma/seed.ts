import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const now = new Date();
const days = (n: number) => new Date(now.getTime() + n * 86_400_000);

async function main() {
  console.log("🌱 Starting comprehensive database seed...\n");

  // ─── Users ────────────────────────────────────────────────────────────────
  const [adminHash, managerHash, operatorHash, driverHash, viewerHash] =
    await Promise.all([
      bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? "Admin@Logivox1!", 12),
      bcrypt.hash(process.env.SEED_MANAGER_PASSWORD ?? "Manager@Demo1!", 12),
      bcrypt.hash("Operator@Demo1!", 12),
      bcrypt.hash("Driver@Demo1!", 12),
      bcrypt.hash("Viewer@Demo1!", 12),
    ]);
  const admin = await prisma.user.upsert({
    where: { email: "admin@logivox.ai" },
    update: {},
    create: {
      email: "admin@logivox.ai",
      name: "System Admin",
      password: adminHash,
      role: "SUPER_ADMIN",
      emailVerified: now,
    },
  });
  const manager = await prisma.user.upsert({
    where: { email: "sarah.mason@democo.com" },
    update: {},
    create: {
      email: "sarah.mason@democo.com",
      name: "Sarah Mason",
      password: managerHash,
      role: "MANAGER",
      emailVerified: now,
    },
  });
  const operator = await prisma.user.upsert({
    where: { email: "james.walker@democo.com" },
    update: {},
    create: {
      email: "james.walker@democo.com",
      name: "James Walker",
      password: operatorHash,
      role: "USER",
      emailVerified: now,
    },
  });
  const driver = await prisma.user.upsert({
    where: { email: "tom.harris@democo.com" },
    update: {},
    create: {
      email: "tom.harris@democo.com",
      name: "Tom Harris",
      password: driverHash,
      role: "USER",
      emailVerified: now,
    },
  });
  await prisma.user.upsert({
    where: { email: "demo@logivox.ai" },
    update: {},
    create: {
      email: "demo@logivox.ai",
      name: "Demo Viewer",
      password: viewerHash,
      role: "USER",
      emailVerified: now,
    },
  });
  console.log("✅ Users (5)");

  // ─── Organisation ─────────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { slug: "demo-co" },
    update: {},
    create: {
      name: "DemoCo Logistics Ltd",
      slug: "demo-co",
      domain: "democo.com",
      primaryColor: "#3b82f6",
      subscriptionTier: "ENTERPRISE",
      timezone: "Europe/London",
      currency: "GBP",
      createdById: admin.id,
    },
  });
  for (const m of [
    { userId: admin.id, role: "OWNER" as const },
    { userId: manager.id, role: "MANAGER" as const },
    { userId: operator.id, role: "MEMBER" as const },
    { userId: driver.id, role: "MEMBER" as const },
  ]) {
    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: { organizationId: org.id, userId: m.userId },
      },
      update: {},
      create: {
        organizationId: org.id,
        userId: m.userId,
        role: m.role,
        permissions: {
          manage_inventory: true,
          view_analytics: true,
          export_data: m.role !== "MEMBER",
        },
      },
    });
  }
  console.log("✅ Organisation + memberships");

  // ─── Warehouse ────────────────────────────────────────────────────────────
  const wh = await prisma.warehouse.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "MDC-01" } },
    update: {},
    create: {
      name: "Midlands Distribution Centre",
      code: "MDC-01",
      address: "Unit 12, Logistics Park",
      city: "Birmingham",
      country: "United Kingdom",
      organizationId: org.id,
    },
  });

  // ─── CLEANUP transactional data from any previous seed run (FK order) ─────
  console.log("🧹 Cleaning previous transactional seed data...");
  await prisma.containerItem.deleteMany({
    where: { container: { organizationId: org.id } },
  });
  await prisma.container.deleteMany({ where: { organizationId: org.id } });
  await prisma.loadSheetEvent.deleteMany({ where: { organizationId: org.id } });
  await prisma.loadSheetDistribution.deleteMany({
    where: { organizationId: org.id },
  });
  await prisma.loadSheet.deleteMany({ where: { organizationId: org.id } });
  await prisma.loadPlanItem.deleteMany({
    where: { loadPlan: { organizationId: org.id } },
  });
  await prisma.loadPlan.deleteMany({ where: { organizationId: org.id } });
  await prisma.deliveryStop.deleteMany({
    where: { route: { organizationId: org.id } },
  });
  await prisma.deliveryRoute.deleteMany({ where: { organizationId: org.id } });
  await prisma.wavePickLine.deleteMany({
    where: { wavePick: { organizationId: org.id } },
  });
  await prisma.pickingTask.deleteMany({ where: { organizationId: org.id } });
  await prisma.wavePick.deleteMany({ where: { organizationId: org.id } });
  await prisma.rMAItem.deleteMany({
    where: { rma: { organizationId: org.id } },
  });
  await prisma.rMA.deleteMany({ where: { organizationId: org.id } });
  await prisma.purchaseOrderItem.deleteMany({
    where: { purchaseOrder: { organizationId: org.id } },
  });
  await prisma.purchaseOrder.deleteMany({ where: { organizationId: org.id } });
  await prisma.salesOrderItem.deleteMany({
    where: { salesOrder: { organizationId: org.id } },
  });
  await prisma.salesOrder.deleteMany({ where: { organizationId: org.id } });
  await prisma.kPIMetric.deleteMany({ where: { organizationId: org.id } });
  await prisma.correctivePreventiveAction.deleteMany({
    where: { organizationId: org.id },
  });
  await prisma.duty.deleteMany({ where: { organizationId: org.id } });
  await prisma.dutyType.deleteMany({ where: { organizationId: org.id } });
  await prisma.activityLog.deleteMany({ where: { organizationId: org.id } });
  console.log("✅ Clean slate");

  // ─── Warehouse Locations ──────────────────────────────────────────────────
  const locationDefs = [
    { code: "A-01-01", name: "Zone A – Bin 01", type: "BIN" as const },
    { code: "A-01-02", name: "Zone A – Bin 02", type: "BIN" as const },
    { code: "B-01-01", name: "Zone B – Bin 01", type: "BIN" as const },
    { code: "B-01-02", name: "Zone B – Bin 02", type: "BIN" as const },
    { code: "STAGING-IN", name: "Inbound Staging", type: "STAGING" as const },
    { code: "STAGING-OUT", name: "Outbound Staging", type: "STAGING" as const },
    { code: "RET-BAY-01", name: "Returns Bay 01", type: "STAGING" as const },
  ];
  const locations: Record<string, string> = {};
  for (const l of locationDefs) {
    const loc = await prisma.location.upsert({
      where: {
        organizationId_locationCode: {
          organizationId: org.id,
          locationCode: l.code,
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        warehouseId: wh.id,
        name: l.name,
        locationCode: l.code,
        type: l.type,
        isActive: true,
      },
    });
    locations[l.code] = loc.id;
  }
  console.log("✅ Warehouse + 7 locations");

  // ─── Bay Doors ────────────────────────────────────────────────────────────
  const bayDoors: { id: string }[] = [];
  for (let d = 1; d <= 6; d++) {
    const bd = await prisma.bayDoor.upsert({
      where: {
        organizationId_doorNumber: {
          organizationId: org.id,
          doorNumber: `D${String(d).padStart(2, "0")}`,
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        warehouseId: wh.id,
        doorNumber: `D${String(d).padStart(2, "0")}`,
        doorType: d <= 3 ? "INBOUND" : d <= 5 ? "OUTBOUND" : "CROSS_DOCK",
        status: d === 2 ? "OCCUPIED" : d === 4 ? "MAINTENANCE" : "AVAILABLE",
        isActive: true,
      },
    });
    bayDoors.push(bd);
  }
  console.log("✅ 6 Bay doors");

  // ─── Yard Locations + Dock Appointments ──────────────────────────────────
  const yardLocs: Record<string, string> = {};
  for (const y of [
    {
      code: "DOCK-01",
      name: "Loading Dock 1",
      type: "LOADING_DOCK" as const,
      occ: true,
    },
    {
      code: "DOCK-02",
      name: "Loading Dock 2",
      type: "LOADING_DOCK" as const,
      occ: false,
    },
    {
      code: "DOCK-03",
      name: "Unloading Dock 1",
      type: "UNLOADING_DOCK" as const,
      occ: true,
    },
    {
      code: "DOCK-04",
      name: "Unloading Dock 2",
      type: "UNLOADING_DOCK" as const,
      occ: false,
    },
    {
      code: "PARK-01",
      name: "Trailer Park A1",
      type: "PARKING_SPOT" as const,
      occ: true,
    },
    {
      code: "PARK-02",
      name: "Trailer Park A2",
      type: "PARKING_SPOT" as const,
      occ: false,
    },
    {
      code: "PARK-03",
      name: "Trailer Park B1",
      type: "PARKING_SPOT" as const,
      occ: false,
    },
    {
      code: "STAGE-01",
      name: "Staging Area Alpha",
      type: "STAGING_AREA" as const,
      occ: false,
    },
  ]) {
    const yl = await prisma.yardLocation.upsert({
      where: {
        organizationId_locationCode: {
          organizationId: org.id,
          locationCode: y.code,
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        warehouseId: wh.id,
        locationCode: y.code,
        locationName: y.name,
        locationType: y.type,
        isActive: true,
        isOccupied: y.occ,
      },
    });
    yardLocs[y.code] = yl.id;
  }
  const appts: Record<string, string> = {};
  for (const a of [
    {
      num: "APT-001",
      type: "INBOUND" as const,
      yard: "DOCK-03",
      carrier: "DHL Freight",
      trailer: "TR-1122",
      driver: "Mike Doyle",
      pallets: 24,
      status: "IN_PROGRESS" as const,
      start: days(-0.1),
      end: days(0.1),
    },
    {
      num: "APT-002",
      type: "OUTBOUND" as const,
      yard: "DOCK-01",
      carrier: "FedEx",
      trailer: "TR-3344",
      driver: "Kelly Shaw",
      pallets: 18,
      status: "CHECKED_IN" as const,
      start: days(0.05),
      end: days(0.15),
    },
    {
      num: "APT-003",
      type: "INBOUND" as const,
      yard: "PARK-01",
      carrier: "TNT Express",
      trailer: "TR-5566",
      driver: "Dan Green",
      pallets: 30,
      status: "SCHEDULED" as const,
      start: days(0.2),
      end: days(0.3),
    },
    {
      num: "APT-004",
      type: "OUTBOUND" as const,
      yard: "DOCK-02",
      carrier: "Royal Mail",
      trailer: "TR-7788",
      driver: "Amy Brooks",
      pallets: 12,
      status: "SCHEDULED" as const,
      start: days(0.4),
      end: days(0.5),
    },
    {
      num: "APT-005",
      type: "INBOUND" as const,
      yard: "PARK-02",
      carrier: "Parcelforce",
      trailer: "TR-9900",
      driver: "Rob Finch",
      pallets: 20,
      status: "SCHEDULED" as const,
      start: days(1),
      end: days(1.1),
    },
  ]) {
    const ap = await prisma.dockAppointment.upsert({
      where: {
        organizationId_appointmentNumber: {
          organizationId: org.id,
          appointmentNumber: a.num,
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        warehouseId: wh.id,
        appointmentNumber: a.num,
        appointmentType: a.type,
        yardLocationId: yardLocs[a.yard],
        scheduledDate: a.start,
        scheduledStart: a.start,
        scheduledEnd: a.end,
        duration: 1.0,
        carrierName: a.carrier,
        trailerNumber: a.trailer,
        driverName: a.driver,
        expectedPallets: a.pallets,
        status: a.status,
        checkedInAt: ["IN_PROGRESS", "CHECKED_IN"].includes(a.status)
          ? now
          : null,
      },
    });
    appts[a.num] = ap.id;
  }
  console.log("✅ 8 Yard locations + 5 dock appointments");

  // ─── Gate Entries ─────────────────────────────────────────────────────────
  for (const g of [
    {
      num: "GE-001",
      type: "DELIVERY" as const,
      dir: "INBOUND" as const,
      carrier: "DHL Freight",
      plate: "BD21 XYZ",
      trailer: "TR-1122",
      driver: "Mike Doyle",
      pallets: 24,
      status: "PROCESSING" as const,
      appt: "APT-001",
    },
    {
      num: "GE-002",
      type: "PICKUP" as const,
      dir: "OUTBOUND" as const,
      carrier: "FedEx",
      plate: "CE19 ABC",
      trailer: "TR-3344",
      driver: "Kelly Shaw",
      pallets: 18,
      status: "APPROVED" as const,
      appt: "APT-002",
    },
    {
      num: "GE-003",
      type: "DELIVERY" as const,
      dir: "INBOUND" as const,
      carrier: "Amazon Logistics",
      plate: "WN70 DEF",
      trailer: "TR-A100",
      driver: "Paul Reeves",
      pallets: 8,
      status: "CHECKED_IN" as const,
      appt: undefined,
    },
    {
      num: "GE-004",
      type: "VISITOR" as const,
      dir: "INBOUND" as const,
      carrier: undefined,
      plate: "LK18 VIS",
      trailer: undefined,
      driver: undefined,
      pallets: 0,
      status: "CHECKED_IN" as const,
      appt: undefined,
    },
    {
      num: "GE-005",
      type: "DELIVERY" as const,
      dir: "INBOUND" as const,
      carrier: "TNT Express",
      plate: "SG22 GHI",
      trailer: "TR-5566",
      driver: "Dan Green",
      pallets: 30,
      status: "CHECKED_OUT" as const,
      appt: undefined,
    },
    {
      num: "GE-006",
      type: "PICKUP" as const,
      dir: "OUTBOUND" as const,
      carrier: "DPD",
      plate: "MA20 JKL",
      trailer: "TR-D200",
      driver: "Sue Price",
      pallets: 15,
      status: "CHECKED_OUT" as const,
      appt: undefined,
    },
    {
      num: "GE-007",
      type: "DELIVERY" as const,
      dir: "INBOUND" as const,
      carrier: "Hermes",
      plate: "YR67 MNO",
      trailer: "TR-H300",
      driver: "Lee Chan",
      pallets: 6,
      status: "CHECKED_IN" as const,
      appt: undefined,
    },
    {
      num: "GE-008",
      type: "DELIVERY" as const,
      dir: "INBOUND" as const,
      carrier: "Yodel",
      plate: "OE16 PQR",
      trailer: "TR-Y400",
      driver: "Jane Fox",
      pallets: 10,
      status: "CHECKED_OUT" as const,
      appt: undefined,
    },
    {
      num: "GE-009",
      type: "PICKUP" as const,
      dir: "OUTBOUND" as const,
      carrier: "UPS",
      plate: "NK64 STU",
      trailer: "TR-U500",
      driver: "Barry Wood",
      pallets: 22,
      status: "CHECKED_OUT" as const,
      appt: undefined,
    },
    {
      num: "GE-010",
      type: "SERVICE_VEHICLE" as const,
      dir: "INBOUND" as const,
      carrier: undefined,
      plate: "CA21 SVC",
      trailer: undefined,
      driver: undefined,
      pallets: 0,
      status: "CHECKED_OUT" as const,
      appt: undefined,
    },
  ]) {
    await prisma.gateEntry.upsert({
      where: {
        organizationId_entryNumber: {
          organizationId: org.id,
          entryNumber: g.num,
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        warehouseId: wh.id,
        entryNumber: g.num,
        entryType: g.type,
        direction: g.dir,
        gateNumber: "GATE-MAIN",
        vehicleType: ["DELIVERY", "PICKUP"].includes(g.type) ? "TRUCK" : "CAR",
        licensePlate: g.plate,
        trailerNumber: g.trailer ?? undefined,
        driverName: g.driver ?? undefined,
        carrierName: g.carrier ?? undefined,
        visitorName: g.type === "VISITOR" ? "John Smith (Auditor)" : undefined,
        visitorCompany: g.type === "VISITOR" ? "External Audit Ltd" : undefined,
        appointmentId: g.appt ? appts[g.appt] : undefined,
        entryTime: new Date(now.getTime() - Math.random() * 8 * 3_600_000),
        exitTime:
          g.status === "CHECKED_OUT"
            ? new Date(now.getTime() - Math.random() * 2 * 3_600_000)
            : undefined,
        numberOfPallets: g.pallets || undefined,
        status: g.status,
        securityCheckPassed: true,
      },
    });
  }
  console.log("✅ 10 Gate entries");

  // ─── Categories ───────────────────────────────────────────────────────────
  const cats: Record<string, string> = {};
  for (const c of [
    "Consumer Electronics",
    "Industrial Equipment",
    "Perishables",
    "Apparel & Footwear",
    "Office Supplies",
    "Pharmaceuticals",
  ]) {
    const cat = await prisma.category.upsert({
      where: {
        organizationId_slug: {
          organizationId: org.id,
          slug: c.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        },
      },
      update: {},
      create: {
        name: c,
        slug: c.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: `${c} category`,
        organizationId: org.id,
      },
    });
    cats[c] = cat.id;
  }
  console.log("✅ 6 Categories");

  // ─── Suppliers ────────────────────────────────────────────────────────────
  const supplier1 = await prisma.supplier.upsert({
    where: {
      organizationId_code: { organizationId: org.id, code: "SUP-TV01" },
    },
    update: {},
    create: {
      name: "TechVenture Components",
      code: "SUP-TV01",
      email: "orders@techventure.co.uk",
      phone: "+44 121 000 1001",
      address: "5 Silicon Way",
      city: "Coventry",
      country: "United Kingdom",
      organizationId: org.id,
    },
  });
  const supplier2 = await prisma.supplier.upsert({
    where: {
      organizationId_code: { organizationId: org.id, code: "SUP-NA02" },
    },
    update: {},
    create: {
      name: "Northern Apparel Co.",
      code: "SUP-NA02",
      email: "sales@northernapparel.co.uk",
      phone: "+44 161 000 2002",
      address: "22 Textile Rd",
      city: "Manchester",
      country: "United Kingdom",
      organizationId: org.id,
    },
  });
  const supplier3 = await prisma.supplier.upsert({
    where: {
      organizationId_code: { organizationId: org.id, code: "SUP-PH03" },
    },
    update: {},
    create: {
      name: "PharmaSupply Direct",
      code: "SUP-PH03",
      email: "b2b@pharmasupply.com",
      phone: "+44 20 000 3003",
      address: "9 Health Park",
      city: "London",
      country: "United Kingdom",
      organizationId: org.id,
    },
  });
  console.log("✅ 3 Suppliers");

  // ─── Customers ────────────────────────────────────────────────────────────
  const customers: Record<string, string> = {};
  for (const c of [
    {
      name: "Apex Retail Group",
      code: "CUST-AR01",
      email: "ops@apexretail.co.uk",
      phone: "+44 207 100 0001",
      city: "London",
    },
    {
      name: "BlueSky Distribution",
      code: "CUST-BD02",
      email: "orders@bluesky-dist.com",
      phone: "+44 113 100 0002",
      city: "Leeds",
    },
    {
      name: "Greenfield Pharmacy",
      code: "CUST-GP03",
      email: "procurement@greenfield.co.uk",
      phone: "+44 191 100 0003",
      city: "Newcastle",
    },
    {
      name: "Metro Office Supplies",
      code: "CUST-MO04",
      email: "buying@metrooffice.co.uk",
      phone: "+44 117 100 0004",
      city: "Bristol",
    },
    {
      name: "NorthWest Fashion Ltd",
      code: "CUST-NF05",
      email: "logistics@nwfashion.co.uk",
      phone: "+44 161 100 0005",
      city: "Manchester",
    },
  ]) {
    const cust = await prisma.customer.upsert({
      where: { organizationId_code: { organizationId: org.id, code: c.code } },
      update: {},
      create: {
        name: c.name,
        code: c.code,
        email: c.email,
        phone: c.phone,
        address: "1 High Street",
        city: c.city,
        country: "United Kingdom",
        organizationId: org.id,
      },
    });
    customers[c.code] = cust.id;
  }
  console.log("✅ 5 Customers");

  // ─── Inventory Items ──────────────────────────────────────────────────────
  const itemDefs = [
    {
      sku: "ELEC-4K-TV-55",
      name: '55" 4K Smart TV',
      cat: "Consumer Electronics",
      sup: supplier1.id,
      cost: 380,
      sell: 549.99,
      qty: 120,
      res: 20,
      min: 20,
      reorder: 30,
    },
    {
      sku: "ELEC-LAPTOP-PRO",
      name: "ProBook 15 Laptop",
      cat: "Consumer Electronics",
      sup: supplier1.id,
      cost: 750,
      sell: 1099.99,
      qty: 65,
      res: 10,
      min: 10,
      reorder: 20,
    },
    {
      sku: "ELEC-TABLET-10",
      name: 'Tablet 10.5" HD',
      cat: "Consumer Electronics",
      sup: supplier1.id,
      cost: 190,
      sell: 299.99,
      qty: 90,
      res: 15,
      min: 15,
      reorder: 25,
    },
    {
      sku: "APP-JACKET-M",
      name: "Waterproof Jacket (M)",
      cat: "Apparel & Footwear",
      sup: supplier2.id,
      cost: 28,
      sell: 59.99,
      qty: 200,
      res: 30,
      min: 40,
      reorder: 60,
    },
    {
      sku: "APP-BOOTS-42",
      name: "Safety Boots Size 42",
      cat: "Apparel & Footwear",
      sup: supplier2.id,
      cost: 35,
      sell: 74.99,
      qty: 150,
      res: 20,
      min: 25,
      reorder: 40,
    },
    {
      sku: "APP-TSHIRT-L",
      name: "Polo Shirt (L) – Pack 5",
      cat: "Apparel & Footwear",
      sup: supplier2.id,
      cost: 18,
      sell: 39.99,
      qty: 300,
      res: 40,
      min: 50,
      reorder: 80,
    },
    {
      sku: "PHAR-PARACET-500",
      name: "Paracetamol 500mg x100",
      cat: "Pharmaceuticals",
      sup: supplier3.id,
      cost: 2.5,
      sell: 4.99,
      qty: 1500,
      res: 100,
      min: 200,
      reorder: 400,
    },
    {
      sku: "PHAR-IBUPRO-200",
      name: "Ibuprofen 200mg x48",
      cat: "Pharmaceuticals",
      sup: supplier3.id,
      cost: 1.8,
      sell: 3.49,
      qty: 1200,
      res: 80,
      min: 200,
      reorder: 350,
    },
    {
      sku: "OFFC-PAPER-A4",
      name: "A4 Copy Paper (Ream 500)",
      cat: "Office Supplies",
      sup: supplier1.id,
      cost: 2.2,
      sell: 5.49,
      qty: 800,
      res: 50,
      min: 100,
      reorder: 200,
    },
    {
      sku: "OFFC-CHAIR-ERG",
      name: "Ergonomic Office Chair",
      cat: "Office Supplies",
      sup: supplier1.id,
      cost: 120,
      sell: 229.99,
      qty: 40,
      res: 5,
      min: 5,
      reorder: 10,
    },
    {
      sku: "INDU-PALLET-STD",
      name: "Euro Pallet (Standard)",
      cat: "Industrial Equipment",
      sup: supplier1.id,
      cost: 8,
      sell: 14.5,
      qty: 500,
      res: 0,
      min: 50,
      reorder: 100,
    },
    {
      sku: "INDU-FORKLIFT-ATT",
      name: "Forklift Side-Shifter Kit",
      cat: "Industrial Equipment",
      sup: supplier1.id,
      cost: 680,
      sell: 1250.0,
      qty: 12,
      res: 2,
      min: 2,
      reorder: 5,
    },
  ];
  const items: Record<string, string> = {};
  for (const i of itemDefs) {
    const item = await prisma.inventoryItem.upsert({
      where: { organizationId_sku: { organizationId: org.id, sku: i.sku } },
      update: {},
      create: {
        name: i.name,
        sku: i.sku,
        description: `${i.name} – stocked at MDC`,
        quantity: i.qty,
        reservedQty: i.res,
        availableQty: i.qty - i.res,
        minStockLevel: i.min,
        reorderPoint: i.reorder,
        costPrice: i.cost,
        sellingPrice: i.sell,
        status: "ACTIVE",
        organizationId: org.id,
        warehouseId: wh.id,
        categoryId: cats[i.cat],
        supplierId: i.sup,
        createdById: admin.id,
      },
    });
    items[i.sku] = item.id;
  }
  console.log("✅ 12 Inventory items");

  // ─── Return Reasons ───────────────────────────────────────────────────────
  const returnReasons: Record<string, string> = {};
  for (const r of [
    { code: "RR-DEFECT", name: "Defective / Damaged", requiresQC: true },
    { code: "RR-WRONG", name: "Wrong Item Delivered", requiresQC: true },
    { code: "RR-NOTWANTED", name: "No Longer Required", requiresQC: false },
    { code: "RR-LATE", name: "Arrived Too Late", requiresQC: false },
    {
      code: "RR-OVERSHIPMENT",
      name: "Overshipment / Duplicate",
      requiresQC: true,
    },
  ]) {
    const rr = await prisma.returnReason.upsert({
      where: { organizationId_code: { organizationId: org.id, code: r.code } },
      update: {},
      create: {
        organizationId: org.id,
        code: r.code,
        name: r.name,
        description: r.name,
        requiresQC: r.requiresQC,
        isActive: true,
      },
    });
    returnReasons[r.code] = rr.id;
  }
  console.log("✅ 5 Return reasons");

  // ─── Sales Orders + Items ─────────────────────────────────────────────────
  const priceMap: Record<string, number> = {
    "ELEC-4K-TV-55": 549.99,
    "ELEC-LAPTOP-PRO": 1099.99,
    "ELEC-TABLET-10": 299.99,
    "APP-JACKET-M": 59.99,
    "APP-BOOTS-42": 74.99,
    "APP-TSHIRT-L": 39.99,
    "PHAR-PARACET-500": 4.99,
    "PHAR-IBUPRO-200": 3.49,
    "OFFC-PAPER-A4": 5.49,
    "OFFC-CHAIR-ERG": 229.99,
  };
  const soDefs = [
    {
      num: "SO-2026-0001",
      cust: "CUST-AR01",
      status: "DELIVERED" as const,
      priority: 2,
      ship: "EXPRESS" as const,
      subtotal: 5499.9,
      total: 6243.87,
      payStatus: "PAID" as const,
      daysAgo: -10,
    },
    {
      num: "SO-2026-0002",
      cust: "CUST-BD02",
      status: "SHIPPED" as const,
      priority: 1,
      ship: "STANDARD" as const,
      subtotal: 2249.92,
      total: 2556.9,
      payStatus: "UNPAID" as const,
      daysAgo: -3,
    },
    {
      num: "SO-2026-0003",
      cust: "CUST-GP03",
      status: "PICKING" as const,
      priority: 3,
      ship: "OVERNIGHT" as const,
      subtotal: 749.41,
      total: 851.28,
      payStatus: "PARTIAL" as const,
      daysAgo: -1,
    },
    {
      num: "SO-2026-0004",
      cust: "CUST-MO04",
      status: "APPROVED" as const,
      priority: 1,
      ship: "STANDARD" as const,
      subtotal: 1154.9,
      total: 1312.08,
      payStatus: "UNPAID" as const,
      daysAgo: 0,
    },
    {
      num: "SO-2026-0005",
      cust: "CUST-NF05",
      status: "PENDING_APPROVAL" as const,
      priority: 2,
      ship: "EXPRESS" as const,
      subtotal: 3599.94,
      total: 4091.93,
      payStatus: "UNPAID" as const,
      daysAgo: 0,
    },
    {
      num: "SO-2026-0006",
      cust: "CUST-AR01",
      status: "RELEASED" as const,
      priority: 2,
      ship: "STANDARD" as const,
      subtotal: 2199.96,
      total: 2499.95,
      payStatus: "UNPAID" as const,
      daysAgo: 0,
    },
    {
      num: "SO-2026-0007",
      cust: "CUST-BD02",
      status: "PACKED" as const,
      priority: 1,
      ship: "STANDARD" as const,
      subtotal: 459.88,
      total: 522.74,
      payStatus: "UNPAID" as const,
      daysAgo: -2,
    },
    {
      num: "SO-2026-0008",
      cust: "CUST-GP03",
      status: "INVOICED" as const,
      priority: 3,
      ship: "OVERNIGHT" as const,
      subtotal: 4979.51,
      total: 5652.94,
      payStatus: "PARTIAL" as const,
      daysAgo: -7,
    },
    {
      num: "SO-2026-0009",
      cust: "CUST-MO04",
      status: "DRAFT" as const,
      priority: 1,
      ship: "STANDARD" as const,
      subtotal: 689.95,
      total: 783.54,
      payStatus: "UNPAID" as const,
      daysAgo: 0,
    },
    {
      num: "SO-2026-0010",
      cust: "CUST-NF05",
      status: "CANCELLED" as const,
      priority: 0,
      ship: "STANDARD" as const,
      subtotal: 299.94,
      total: 340.93,
      payStatus: "UNPAID" as const,
      daysAgo: -5,
    },
  ];
  const salesOrders: Record<string, string> = {};
  const approvedSt = [
    "APPROVED",
    "RELEASED",
    "PICKING",
    "PICKED",
    "PACKING",
    "PACKED",
    "SHIPPED",
    "DELIVERED",
    "INVOICED",
    "CLOSED",
  ];
  const pickedSt = [
    "PICKING",
    "PICKED",
    "PACKING",
    "PACKED",
    "SHIPPED",
    "DELIVERED",
    "INVOICED",
  ];
  const packedSt = ["PACKED", "SHIPPED", "DELIVERED", "INVOICED"];
  const shippedSt = ["SHIPPED", "DELIVERED", "INVOICED"];
  for (const s of soDefs) {
    const so = await prisma.salesOrder.create({
      data: {
        organizationId: org.id,
        soNumber: s.num,
        customerId: customers[s.cust],
        status: s.status,
        priority: s.priority,
        orderDate: days(s.daysAgo),
        requestedDate: days(s.daysAgo + 3),
        promisedDate: days(s.daysAgo + 5),
        shippingMethod: s.ship,
        shippingAddress: "1 Customer Street",
        shippingCity: "Demo City",
        shippingCountry: "GB",
        subtotal: s.subtotal,
        taxAmount: s.subtotal * 0.2,
        shippingCost: 15.0,
        total: s.total,
        currency: "GBP",
        paymentStatus: s.payStatus,
        warehouseId: wh.id,
        createdById: manager.id,
        approvedById: approvedSt.includes(s.status) ? manager.id : undefined,
        approvedDate: approvedSt.includes(s.status)
          ? days(s.daysAgo + 1)
          : undefined,
        shippedDate: shippedSt.includes(s.status)
          ? days(s.daysAgo + 3)
          : undefined,
        deliveredDate:
          s.status === "DELIVERED" ? days(s.daysAgo + 4) : undefined,
      },
    });
    salesOrders[s.num] = so.id;
  }
  for (const [soNum, sku, qty] of [
    ["SO-2026-0001", "ELEC-4K-TV-55", 5],
    ["SO-2026-0001", "ELEC-LAPTOP-PRO", 3],
    ["SO-2026-0002", "APP-JACKET-M", 20],
    ["SO-2026-0002", "APP-TSHIRT-L", 15],
    ["SO-2026-0003", "PHAR-PARACET-500", 50],
    ["SO-2026-0003", "PHAR-IBUPRO-200", 30],
    ["SO-2026-0004", "OFFC-CHAIR-ERG", 5],
    ["SO-2026-0004", "OFFC-PAPER-A4", 10],
    ["SO-2026-0005", "ELEC-TABLET-10", 12],
    ["SO-2026-0006", "ELEC-4K-TV-55", 4],
    ["SO-2026-0007", "APP-BOOTS-42", 10],
    ["SO-2026-0008", "PHAR-PARACET-500", 300],
    ["SO-2026-0008", "PHAR-IBUPRO-200", 200],
  ] as [string, string, number][]) {
    const soStatus = soDefs.find((s) => s.num === soNum)!.status;
    await prisma.salesOrderItem.create({
      data: {
        salesOrderId: salesOrders[soNum],
        inventoryItemId: items[sku],
        quantity: qty,
        quantityPicked: pickedSt.includes(soStatus) ? qty : 0,
        quantityPacked: packedSt.includes(soStatus) ? qty : 0,
        quantityShipped: shippedSt.includes(soStatus) ? qty : 0,
        unitPrice: priceMap[sku] ?? 10,
        lineTotal: qty * (priceMap[sku] ?? 10),
        binLocation: "A-01-01",
      },
    });
  }
  console.log("✅ 10 Sales orders + 13 lines");

  // ─── RMAs + Items ─────────────────────────────────────────────────────────
  for (const r of [
    {
      num: "RMA-2026-001",
      so: "SO-2026-0001",
      cust: "CUST-AR01",
      reason: "RR-DEFECT",
      status: "PENDING" as const,
      sku: "ELEC-4K-TV-55",
      qty: 1,
      refund: 549.99,
    },
    {
      num: "RMA-2026-002",
      so: "SO-2026-0002",
      cust: "CUST-BD02",
      reason: "RR-WRONG",
      status: "APPROVED" as const,
      sku: "APP-JACKET-M",
      qty: 3,
      refund: 179.97,
    },
    {
      num: "RMA-2026-003",
      so: "SO-2026-0007",
      cust: "CUST-BD02",
      reason: "RR-NOTWANTED",
      status: "INSPECTING" as const,
      sku: "APP-BOOTS-42",
      qty: 2,
      refund: 149.98,
    },
    {
      num: "RMA-2026-004",
      so: "SO-2026-0008",
      cust: "CUST-GP03",
      reason: "RR-LATE",
      status: "RECEIVED" as const,
      sku: "PHAR-PARACET-500",
      qty: 10,
      refund: 49.9,
    },
    {
      num: "RMA-2026-005",
      so: "SO-2026-0001",
      cust: "CUST-AR01",
      reason: "RR-OVERSHIPMENT",
      status: "COMPLETED" as const,
      sku: "ELEC-LAPTOP-PRO",
      qty: 1,
      refund: 1099.99,
    },
  ]) {
    const rma = await prisma.rMA.create({
      data: {
        organizationId: org.id,
        rmaNumber: r.num,
        status: r.status,
        salesOrderId: salesOrders[r.so],
        customerId: customers[r.cust],
        returnReasonId: returnReasons[r.reason],
        customerNotes: `Return: ${r.reason}`,
        requestedDate: days(-4),
        approvedDate: [
          "APPROVED",
          "RECEIVED",
          "INSPECTING",
          "COMPLETED",
        ].includes(r.status)
          ? days(-3)
          : undefined,
        receivedDate: ["RECEIVED", "INSPECTING", "COMPLETED"].includes(r.status)
          ? days(-2)
          : undefined,
        completedDate: r.status === "COMPLETED" ? days(-1) : undefined,
        approvedById: [
          "APPROVED",
          "RECEIVED",
          "INSPECTING",
          "COMPLETED",
        ].includes(r.status)
          ? manager.id
          : undefined,
        totalRefundAmount: r.refund,
        requiresApproval: true,
        notifyCustomer: true,
      },
    });
    await prisma.rMAItem.create({
      data: {
        rmaId: rma.id,
        inventoryId: items[r.sku],
        quantityRequested: r.qty,
        quantityReceived: ["RECEIVED", "INSPECTING", "COMPLETED"].includes(
          r.status,
        )
          ? r.qty
          : undefined,
        quantityAccepted: r.status === "COMPLETED" ? r.qty : undefined,
        condition: r.status === "COMPLETED" ? ("GOOD" as const) : undefined,
        action: "REFUND",
        unitPrice: r.refund / r.qty,
        refundAmount: r.refund,
        isInspected: ["INSPECTING", "COMPLETED"].includes(r.status),
        isRestocked: r.status === "COMPLETED",
      },
    });
  }
  console.log("✅ 5 RMAs + items");

  // ─── Purchase Orders + Items ──────────────────────────────────────────────
  for (const p of [
    {
      num: "PO-2026-0001",
      sup: supplier1.id,
      status: "APPROVED" as const,
      subtotal: 15960,
      total: 19152,
    },
    {
      num: "PO-2026-0002",
      sup: supplier2.id,
      status: "RECEIVED" as const,
      subtotal: 6300,
      total: 7560,
    },
    {
      num: "PO-2026-0003",
      sup: supplier3.id,
      status: "SENT" as const,
      subtotal: 8750,
      total: 10500,
    },
    {
      num: "PO-2026-0004",
      sup: supplier1.id,
      status: "DRAFT" as const,
      subtotal: 3680,
      total: 4416,
    },
    {
      num: "PO-2026-0005",
      sup: supplier2.id,
      status: "PARTIALLY_RECEIVED" as const,
      subtotal: 4200,
      total: 5040,
    },
  ]) {
    const po = await prisma.purchaseOrder.create({
      data: {
        organizationId: org.id,
        poNumber: p.num,
        supplierId: p.sup,
        status: p.status,
        orderDate: days(-7),
        expectedDate: days(7),
        subtotal: p.subtotal,
        tax: p.subtotal * 0.2,
        totalAmount: p.total,
        currency: "GBP",
        createdById: manager.id,
        approvedById: ["APPROVED", "RECEIVED", "PARTIALLY_RECEIVED"].includes(
          p.status,
        )
          ? manager.id
          : undefined,
      },
    });
    await prisma.purchaseOrderItem.create({
      data: {
        purchaseOrderId: po.id,
        inventoryItemId: items["ELEC-4K-TV-55"],
        sku: "ELEC-4K-TV-55",
        description: '55" 4K Smart TV',
        quantityOrdered: 20,
        quantityReceived:
          p.status === "RECEIVED"
            ? 20
            : p.status === "PARTIALLY_RECEIVED"
              ? 10
              : 0,
        unitPrice: 380,
        totalPrice: 7600,
      },
    });
  }
  console.log("✅ 5 Purchase orders");

  // ─── Delivery Routes + Stops ──────────────────────────────────────────────
  const routeDefs = [
    {
      num: "DR-2026-001",
      name: "Birmingham City Route",
      status: "IN_PROGRESS" as const,
      driver: "Tom Harris",
      vehicle: "BX21 LGV",
      date: now,
    },
    {
      num: "DR-2026-002",
      name: "West Midlands Express",
      status: "PLANNED" as const,
      driver: "Amy Brooks",
      vehicle: "CV70 VAN",
      date: days(1),
    },
    {
      num: "DR-2026-003",
      name: "Coventry & Warwick",
      status: "COMPLETED" as const,
      driver: "Barry Wood",
      vehicle: "WG19 HGV",
      date: days(-1),
    },
  ];
  for (const rd of routeDefs) {
    const dr = await prisma.deliveryRoute.create({
      data: {
        organizationId: org.id,
        warehouseId: wh.id,
        routeNumber: rd.num,
        routeName: rd.name,
        deliveryDate: rd.date,
        driverName: rd.driver,
        vehicleId: rd.vehicle,
        status: rd.status,
        totalDistance: 42.5,
        estimatedDuration: 3.5,
        startTime:
          rd.status !== "PLANNED"
            ? new Date(now.getTime() - 2 * 3_600_000)
            : undefined,
        endTime:
          rd.status === "COMPLETED"
            ? new Date(now.getTime() - 0.5 * 3_600_000)
            : undefined,
        createdById: manager.id,
      },
    });
    const customerList = Object.entries(customers);
    for (let i = 0; i < 4; i++) {
      const [custCode] = customerList[i % customerList.length];
      const isFirst2 = rd.status === "IN_PROGRESS" && i < 2;
      const allDone = rd.status === "COMPLETED";
      await prisma.deliveryStop.create({
        data: {
          routeId: dr.id,
          stopSequence: i + 1,
          stopType: "DELIVERY",
          customerName: custCode,
          addressLine1: `${(i + 1) * 10} Delivery Street`,
          city: "Birmingham",
          postalCode: `B${i + 1} 1AA`,
          country: "GB",
          scheduledArrival: new Date(now.getTime() + (i - 1) * 60 * 60 * 1000),
          actualArrival:
            isFirst2 || allDone
              ? new Date(now.getTime() + (i - 1.1) * 60 * 60 * 1000)
              : undefined,
          deliveryStatus: allDone
            ? "DELIVERED"
            : isFirst2
              ? "ARRIVED"
              : "PENDING",
          signedBy: allDone ? "Customer Rep" : undefined,
          distanceFromPrevious: 8.5 + i,
        },
      });
    }
  }
  console.log("✅ 3 Delivery routes + 12 stops");

  // ─── Load Plan + Load Sheet + Containers ─────────────────────────────────
  const loadPlan = await prisma.loadPlan.create({
    data: {
      organizationId: org.id,
      warehouseId: wh.id,
      planNumber: "LP-2026-001",
      planName: "Today Outbound MDC",
      shipmentDate: days(1),
      vehicleType: "HGV",
      maxWeight: 24000,
      maxPallets: 26,
      totalWeight: 4800,
      totalPallets: 12,
      utilization: 46.2,
      status: "APPROVED",
      approvedBy: manager.id,
      approvedAt: now,
      createdById: manager.id,
    },
  });
  await prisma.loadPlanItem.create({
    data: {
      loadPlanId: loadPlan.id,
      salesOrderId: salesOrders["SO-2026-0006"],
      itemSKU: "ELEC-4K-TV-55",
      itemName: '55" 4K Smart TV',
      quantity: 4,
      weight: 60,
      volume: 0.4,
      palletNumber: 1,
      isLoaded: true,
      loadedAt: now,
    },
  });
  const loadSheet = await prisma.loadSheet.create({
    data: {
      organizationId: org.id,
      warehouseId: wh.id,
      loadSheetNumber: "LS-2026-001",
      status: "CONFIRMED",
      generationMethod: "MANUAL",
      shipmentDate: days(1),
      customerId: customers["CUST-AR01"],
      carrierName: "FedEx",
      trailerNumber: "TR-3344",
      driverName: "Kelly Shaw",
      driverPhone: "+44 7700 111111",
      bayDoorId: bayDoors[1].id,
      totalContainers: 3,
      totalPallets: 3,
      totalItems: 4,
      totalOrders: 1,
      approved: true,
      approvedBy: manager.id,
      approvedAt: now,
    },
  });
  for (let c = 1; c <= 3; c++) {
    const cont = await prisma.container.create({
      data: {
        organizationId: org.id,
        loadSheetId: loadSheet.id,
        containerNumber: `CTR-${String(c).padStart(3, "0")}`,
        containerType: "PALLET",
        status: "READY",
        weight: 420 + c * 10,
        volume: 1.8,
      },
    });
    await prisma.containerItem.create({
      data: {
        containerId: cont.id,
        salesOrderId: salesOrders["SO-2026-0006"],
        inventoryItemId: items["ELEC-4K-TV-55"],
        sku: "ELEC-4K-TV-55",
        description: '55" 4K Smart TV',
        quantity: c === 3 ? 2 : 1,
        weight: 15,
      },
    });
  }
  console.log("✅ Load plan + load sheet + 3 containers");

  // ─── Wave Pick + Picking Tasks ────────────────────────────────────────────
  const wave = await prisma.wavePick.create({
    data: {
      organizationId: org.id,
      warehouseId: wh.id,
      waveNumber: "WV-2026-001",
      name: "AM Wave – Zone A+B",
      status: "IN_PROGRESS",
      priority: "HIGH",
      waveType: "BATCH",
      strategy: "FIFO",
      groupingCriteria: {},
      totalLines: 5,
      pickedLines: 2,
      totalQuantity: 67,
      assignedToId: operator.id,
      assignedAt: now,
      startedAt: new Date(now.getTime() - 3_600_000),
      createdById: manager.id,
    },
  });
  for (const t of [
    {
      num: "PT-001",
      type: "PICK" as const,
      title: "Pick ELEC-4K-TV-55 x4",
      sku: "ELEC-4K-TV-55",
      qty: 4,
      from: "A-01-01",
      to: "STAGING-OUT",
      status: "COMPLETED" as const,
      prog: 100,
    },
    {
      num: "PT-002",
      type: "PICK" as const,
      title: "Pick ELEC-LAPTOP-PRO x3",
      sku: "ELEC-LAPTOP-PRO",
      qty: 3,
      from: "A-01-02",
      to: "STAGING-OUT",
      status: "COMPLETED" as const,
      prog: 100,
    },
    {
      num: "PT-003",
      type: "PICK" as const,
      title: "Pick APP-JACKET-M x20",
      sku: "APP-JACKET-M",
      qty: 20,
      from: "B-01-01",
      to: "STAGING-OUT",
      status: "IN_PROGRESS" as const,
      prog: 50,
    },
    {
      num: "PT-004",
      type: "PICK" as const,
      title: "Pick PHAR-PARACET-500 x50",
      sku: "PHAR-PARACET-500",
      qty: 50,
      from: "B-01-02",
      to: "STAGING-OUT",
      status: "PENDING" as const,
      prog: 0,
    },
    {
      num: "PT-005",
      type: "PUT" as const,
      title: "Putaway PHAR-IBUPRO-200 x200",
      sku: "PHAR-IBUPRO-200",
      qty: 200,
      from: "STAGING-IN",
      to: "B-01-02",
      status: "PENDING" as const,
      prog: 0,
    },
  ]) {
    await prisma.pickingTask.create({
      data: {
        organizationId: org.id,
        warehouseId: wh.id,
        taskNumber: t.num,
        taskType: t.type,
        priority: "HIGH",
        title: t.title,
        wavePickId: wave.id,
        fromLocationId: locations[t.from],
        toLocationId: locations[t.to],
        inventoryItemId: items[t.sku],
        quantity: t.qty,
        status: t.status,
        progress: t.prog,
        assignedToId: operator.id,
        assignedAt: now,
        scheduledFor: now,
        dueBy: days(1),
        startedAt:
          t.status !== "PENDING"
            ? new Date(now.getTime() - 2_000_000)
            : undefined,
        completedAt:
          t.status === "COMPLETED"
            ? new Date(now.getTime() - 500_000)
            : undefined,
        createdById: manager.id,
      },
    });
  }
  console.log("✅ Wave pick + 5 picking tasks");

  // ─── Employees ────────────────────────────────────────────────────────────
  for (const e of [
    {
      user: manager.id,
      num: "EMP-001",
      first: "Sarah",
      last: "Mason",
      dept: "Management",
      pos: "Warehouse Manager",
      skills: ["management", "quality_control", "inventory_audit"],
    },
    {
      user: operator.id,
      num: "EMP-002",
      first: "James",
      last: "Walker",
      dept: "Warehouse Floor",
      pos: "Senior Operator",
      skills: ["picking", "packing", "forklift", "voice_picking", "scanning"],
    },
    {
      user: driver.id,
      num: "EMP-003",
      first: "Tom",
      last: "Harris",
      dept: "Transport",
      pos: "Delivery Driver",
      skills: ["hgv", "route_planning"],
    },
  ]) {
    await prisma.employee.upsert({
      where: {
        organizationId_employeeNumber: {
          organizationId: org.id,
          employeeNumber: e.num,
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        userId: e.user,
        employeeNumber: e.num,
        firstName: e.first,
        lastName: e.last,
        email: `${e.first.toLowerCase()}.${e.last.toLowerCase()}@democo.com`,
        hireDate: days(-365),
        status: "ACTIVE",
        employmentType: "FULL_TIME",
        department: e.dept,
        position: e.pos,
        warehouseId: wh.id,
        skills: e.skills,
      },
    });
  }
  console.log("✅ 3 Employees");

  // ─── CAPA ─────────────────────────────────────────────────────────────────
  await prisma.correctivePreventiveAction.upsert({
    where: { capaNumber: "CAPA-2026-001" },
    update: {},
    create: {
      organizationId: org.id,
      capaNumber: "CAPA-2026-001",
      capaType: "CORRECTIVE",
      actionCategory: "PROCESS_IMPROVEMENT",
      sourceType: "CUSTOMER_COMPLAINT",
      problemStatement:
        "Recurring picking errors in Zone B causing wrong-item returns (RMA-2026-002, RMA-2026-003)",
      problemSeverity: "HIGH",
      status: "IN_PROGRESS",
      rootCauseMethod: "FISHBONE",
      rootCauseAnalysis: {
        method: "fishbone",
        categories: ["Man", "Machine", "Method", "Material"],
      },
      rootCause:
        "Zone B bin labels faded, leading to mis-identification during pick",
      immediateActions: [
        { action: "Re-label all Zone B bins", status: "COMPLETED" },
      ],
      correctiveActions: [
        {
          action: "Implement monthly label audit",
          owner: manager.id,
          dueDate: days(30).toISOString(),
        },
      ],
      preventiveActions: [
        {
          action: "Install barcode scanners at Zone B entry",
          owner: admin.id,
          dueDate: days(60).toISOString(),
        },
      ],
      responsiblePerson: manager.id,
      targetCompletionDate: days(45),
      createdBy: admin.id,
    },
  });
  console.log("✅ CAPA record");

  // ─── KPI Metrics ──────────────────────────────────────────────────────────
  for (const k of [
    {
      code: "FILL_RATE",
      name: "Order Fill Rate",
      cat: "OPERATIONAL" as const,
      curr: 97.4,
      tgt: 99.0,
      unit: "%",
    },
    {
      code: "OTD",
      name: "On-Time Delivery",
      cat: "OPERATIONAL" as const,
      curr: 94.1,
      tgt: 95.0,
      unit: "%",
    },
    {
      code: "INV_ACCURACY",
      name: "Inventory Accuracy",
      cat: "INVENTORY" as const,
      curr: 99.2,
      tgt: 99.5,
      unit: "%",
    },
    {
      code: "PICK_RATE",
      name: "Pick Rate",
      cat: "PRODUCTIVITY" as const,
      curr: 142,
      tgt: 150,
      unit: "lines/hr",
    },
    {
      code: "RETURN_RATE",
      name: "Return Rate",
      cat: "QUALITY" as const,
      curr: 2.8,
      tgt: 2.0,
      unit: "%",
    },
    {
      code: "DOCK_TO_STOCK",
      name: "Dock-to-Stock Time",
      cat: "WAREHOUSE" as const,
      curr: 3.2,
      tgt: 2.5,
      unit: "hrs",
    },
    {
      code: "COST_PER_ORD",
      name: "Cost per Order",
      cat: "FINANCIAL" as const,
      curr: 4.85,
      tgt: 4.5,
      unit: "GBP",
    },
    {
      code: "WH_UTIL",
      name: "Warehouse Utilisation",
      cat: "WAREHOUSE" as const,
      curr: 78.3,
      tgt: 85.0,
      unit: "%",
    },
  ]) {
    await prisma.kPIMetric.create({
      data: {
        organizationId: org.id,
        metricCode: k.code,
        metricName: k.name,
        category: k.cat,
        currentValue: k.curr,
        targetValue: k.tgt,
        unit: k.unit,
        periodType: "DAILY",
        periodStart: now,
        periodEnd: days(1),
        calculatedAt: now,
      },
    });
  }
  console.log("✅ 8 KPI metrics");

  // ─── Duty Types + Duties ──────────────────────────────────────────────────
  const dtPick = await prisma.dutyType.create({
    data: {
      organizationId: org.id,
      name: "Wave Pick",
      category: "PICKING",
      description: "Execute a wave pick run",
      requiredSkills: ["picking"],
      requiredCerts: [],
      defaultDuration: 120,
    },
  });
  const dtCount = await prisma.dutyType.create({
    data: {
      organizationId: org.id,
      name: "Cycle Count",
      category: "AUDIT",
      description: "Count inventory in assigned zone",
      requiredSkills: ["scanning"],
      requiredCerts: [],
      defaultDuration: 60,
    },
  });
  await prisma.duty.create({
    data: {
      organizationId: org.id,
      dutyTypeId: dtPick.id,
      employeeId: operator.id,
      assignedBy: manager.id,
      warehouseId: wh.id,
      title: "AM Wave Pick – Zone A+B",
      priority: "HIGH",
      status: "ACTIVE",
      scheduledStart: now,
    },
  });
  await prisma.duty.create({
    data: {
      organizationId: org.id,
      dutyTypeId: dtCount.id,
      employeeId: operator.id,
      assignedBy: manager.id,
      warehouseId: wh.id,
      title: "Daily Cycle Count – Zone B",
      priority: "MEDIUM",
      status: "PLANNED",
      scheduledStart: days(1),
    },
  });
  console.log("✅ 2 Duty types + 2 duties");

  // ─── QC Templates ──────────────────────────────────────────────────────────
  await prisma.inspectionTemplate.upsert({
    where: {
      organizationId_code: { organizationId: org.id, code: "TMP-INCOMING-STD" },
    },
    update: {},
    create: {
      organizationId: org.id,
      name: "Standard Incoming Inspection",
      code: "TMP-INCOMING-STD",
      description: "General inspection for non-perishable goods",
      category: "INCOMING", // Enum value
      samplingType: "STATISTICAL",
      isActive: true,
      checkpoints: [
        {
          name: "Visual Check - Packaging",
          type: "PASS_FAIL",
          description: "Is packaging intact?",
          required: true,
        },
        {
          name: "Label Verification",
          type: "PASS_FAIL",
          description: "Does label match PO?",
          required: true,
        },
        {
          name: "Unit Count Verification",
          type: "MEASUREMENT",
          description: "Count items in sample box",
          required: true,
        },
        {
          name: "Damage Check",
          type: "PASS_FAIL",
          description: "Any visible damage?",
          required: true,
        },
      ],
    },
  });
  console.log("✅ QC Template seeded");

  // ─── Activity Log ─────────────────────────────────────────────────────────
  await prisma.activityLog.create({
    data: {
      action: "DATABASE_SEEDED",
      entityType: "SYSTEM",
      metadata: { version: "3.0", modules: "all", seededAt: now.toISOString() },
      ipAddress: "127.0.0.1",
      userAgent: "Prisma Seed v3",
      organizationId: org.id,
      userId: admin.id,
    },
  });

  // ─── Operations Master Data (BayDoors & Zones) ────────────────────────────
  console.log("Creating Operations Data...");
  
  // Seed Bay Doors
  const bayDoors = [
    { num: "BD-01", type: "INBOUND", status: "AVAILABLE" },
    { num: "BD-02", type: "INBOUND", status: "OCCUPIED" },
    { num: "BD-03", type: "OUTBOUND", status: "AVAILABLE" },
    { num: "BD-04", type: "OUTBOUND", status: "MAINTENANCE" },
    { num: "BD-05", type: "CROSS_DOCK", status: "AVAILABLE" },
  ];

  for (const door of bayDoors) {
    await prisma.bayDoor.upsert({
      where: { organizationId_doorNumber: { organizationId: org.id, doorNumber: door.num } },
      update: { status: door.status },
      create: {
        organizationId: org.id,
        warehouseId: wh.id,
        doorNumber: door.num,
        doorType: door.type,
        status: door.status,
        isActive: true
      }
    });
  }
  console.log("✅ Bay Doors (5)");

  // Seed Zones / Locations
  const opsZones = [
    { code: "ZONE-A", name: "Picking Zone A", type: "ZONE" },
    { code: "ZONE-B", name: "Picking Zone B", type: "ZONE" },
    { code: "STAGING-IN", name: "Inbound Staging", type: "STAGING" },
    { code: "STAGING-OUT", name: "Outbound Staging", type: "STAGING" },
    { code: "PACK-01", name: "Packing Station 1", type: "SHIPPING" },
  ];

  for (const z of opsZones) {
    // We use barcode as unique handle
    const loc = await prisma.location.findFirst({ where: { barcode: z.code, organizationId: org.id } });
    if (!loc) {
        await prisma.location.create({
            data: {
                organizationId: org.id,
                warehouseId: wh.id,
                locationCode: z.code,
                name: z.name,
                type: z.type as any, // assuming valid enum
                barcode: z.code,
                isActive: true
            }
        });
    }
  }
  console.log("✅ Operation Zones");

  console.log("\n🎉 Seed complete!\n");
  console.log("━".repeat(55));
  console.log("📧 Credentials");
  console.log("━".repeat(55));
  console.log("Super Admin   admin@logivox.ai            Admin@Logivox1!");
  console.log("WH Manager    sarah.mason@democo.com      Manager@Demo1!");
  console.log("Operator      james.walker@democo.com     Operator@Demo1!");
  console.log("Driver        tom.harris@democo.com       Driver@Demo1!");
  console.log("Demo Viewer   demo@logivox.ai             Viewer@Demo1!");
  console.log("━".repeat(55));
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
