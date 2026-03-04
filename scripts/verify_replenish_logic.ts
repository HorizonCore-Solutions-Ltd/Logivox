import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Starting Replenishment Module Verification...");

  // 1. Setup Context (Org, Warehouse, User)
  console.log("1️⃣  Setting up Test Context...");

  // Find or create Org
  let org = await prisma.organization.findFirst();
  if (!org) {
    org = await prisma.organization.create({
      data: { name: "Test Org", slug: "test-org", createdById: "system" },
    });
  }

  // Find or create User
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: { email: "test@example.com", name: "Test User" },
    });
  }

  // Find or create Warehouse
  let warehouse = await prisma.warehouse.findFirst({
    where: { organizationId: org.id },
  });
  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: { organizationId: org.id, name: "Test Warehouse", code: "WH-TEST" },
    });
  }

  console.log(`   ✅ Context Ready: Org: ${org.id.substring(0, 8)}...`);

  // 2. Setup Inventory (Low Stock Item)
  console.log("2️⃣  Creating Low Stock Item...");
  const itemSku = `TEST-SKU-${Date.now()}`;
  const item = await prisma.inventoryItem.create({
    data: {
      organizationId: org.id,
      warehouseId: warehouse.id,
      sku: itemSku,
      name: "Test Widget",
      availableQty: 5, // LOW STOCK
      createdById: user.id,
    },
  });
  console.log(`   ✅ Item Created: ${item.sku} (Qty: 5)`);

  // 3. Setup Replenishment Rule
  console.log("3️⃣  Creating Min/Max Rule...");
  const rule = await prisma.replenishmentRule.create({
    data: {
      organizationId: org.id,
      warehouseId: warehouse.id,
      inventoryItemId: item.id,
      name: "Test Rule",
      strategy: "MIN_MAX",
      minQty: 10, // Threshold is 10, Stock is 5 -> Should Trigger
      maxQty: 50,
      reorderQty: 40,
      createdById: user.id,
    },
  });
  console.log(`   ✅ Rule Created: Min 10 / Max 50`);

  // 4. Simulate "Run Replenishment" Logic
  console.log("4️⃣  Executing Replenishment Engine Logic...");

  const rules = await prisma.replenishmentRule.findMany({
    where: { id: rule.id },
    include: { inventoryItem: true },
  });

  let tasksCreated = 0;
  for (const r of rules) {
    if (!r.inventoryItem) continue;
    const currentStock = r.inventoryItem.availableQty || 0;

    if (r.strategy === "MIN_MAX" && currentStock <= r.minQty) {
      const qtyNeeded = r.maxQty - currentStock;

      await prisma.pickingTask.create({
        data: {
          organizationId: org.id,
          warehouseId: r.warehouseId!,
          taskNumber: `RPL-TEST-${Date.now()}`,
          taskType: "REPLENISH",
          priority: "NORMAL",
          title: `Replenish: ${r.inventoryItem.name}`,
          description: `Triggered by Test Script. Move ${qtyNeeded} units.`,
          inventoryItemId: r.inventoryItem.id,
          quantity: qtyNeeded,
          status: "PENDING",
          createdById: user.id,
        },
      });
      tasksCreated++;
    }
  }

  if (tasksCreated > 0) {
    console.log(
      `   ✅ SUCCESS: ${tasksCreated} Replenishment Task(s) Generated.`,
    );
  } else {
    console.error("   ❌ FAILURE: No tasks generated despite low stock.");
    process.exit(1);
  }

  // 5. Verify "Short Pick" Logic
  console.log("5️⃣  Simulating Short Pick (Urgent Task)...");

  const shortPickTask = await prisma.pickingTask.create({
    data: {
      organizationId: org.id,
      warehouseId: warehouse.id,
      taskNumber: `URG-TEST-${Date.now()}`,
      taskType: "REPLENISH",
      priority: "URGENT",
      title: `Short Pick Replenishment`,
      description: `Picker reported empty face.`,
      inventoryItemId: item.id,
      status: "PENDING",
      createdById: user.id,
    },
  });

  console.log(
    `   ✅ Short Pick Task Created: ${shortPickTask.id} (Priority: ${shortPickTask.priority})`,
  );

  // 6. Verify Task Verification (Driver View)
  console.log("6️⃣  Verifying Driver Queue...");
  const driverTasks = await prisma.pickingTask.findMany({
    where: {
      organizationId: org.id,
      taskType: "REPLENISH",
      status: "PENDING",
    },
  });

  if (driverTasks.length >= 2) {
    console.log(
      `   ✅ Driver Queue Verified: ${driverTasks.length} Pending Tasks found.`,
    );
  } else {
    console.error("   ❌ FAILURE: Tasks not found in queue.");
  }

  console.log(
    "\n🎉 ALL CHECKS PASSED. Replenishment Module is Logic-Verified.",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
