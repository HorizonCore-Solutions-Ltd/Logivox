import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting Advanced Intelligence Simulation...");

  // 1. Get Context
  const org = await prisma.organization.findFirst();
  if (!org) throw new Error("No Org found");
  const warehouse = await prisma.warehouse.findFirst({
    where: { organizationId: org.id },
  });
  if (!warehouse) throw new Error("No Warehouse found");

  // 2. Simulate AI: Predictive Stockout Analysis
  console.log("🧠 Analyzing Demand Patterns (AI Simulation)...");

  const items = await prisma.inventoryItem.findMany({
    where: { organizationId: org.id },
    take: 5,
  });

  for (const item of items) {
    // Simple Heuristic: Assume high velocity based on name length (mock logic)
    // Or fetch actual orders if they exist.
    // Let's create a *fake* forecast entry.

    const velocity = Math.random() * 100; // Random Daily Sales
    const currentStock = item.availableQty || 0;
    const daysToEmpty = currentStock / (velocity || 1);

    if (daysToEmpty < 7) {
      console.log(
        `   ⚠️ Prediction: ${item.sku} will stock out in ${daysToEmpty.toFixed(1)} days.`,
      );

      // Create Cache Entry
      await prisma.replenishmentForecastCache.create({
        data: {
          organizationId: org.id,
          inventoryItemId: item.id,
          warehouseId: warehouse.id,
          forecastDate: new Date(),
          horizonDays: 7,
          predictedDemand: Math.ceil(velocity * 7),
          confidenceScore: 0.85 + Math.random() * 0.1, // High confidence
          actionRecommended: "INCREASE_SafetyStock",
          reasoning: `High velocity detected (${velocity.toFixed(1)} units/day). Current stock insufficient for horizon.`,
        },
      });
    }
  }

  // 3. Simulate IoT: "Smart Shelf" Trigger
  console.log("📡 Simulating IoT Sensor Event...");

  // Find a location to attach a 'virtual' sensor to
  const loc = await prisma.location.findFirst({
    where: { organizationId: org.id, type: "PICKING" },
  });
  if (loc && items[0]) {
    // Simulate a "Weight Sensor" dropping to zero
    await prisma.replenishmentIoTTrigger.create({
      data: {
        organizationId: org.id,
        warehouseId: warehouse.id,
        deviceId: `SENSOR-WGT-${loc.locationCode}`,
        deviceType: "WEIGHT_SCALE",
        triggerType: "EMPTY_BIN",
        triggerValue: 0.05, // 5% weight remaining
        triggerTime: new Date(),
        inventoryItemId: items[0].id,
        locationId: loc.id,
        status: "PENDING_ACTION",
        metadata: { confidence: 0.99, batteryLevel: 85 },
      },
    });
    console.log(
      `   ✅ Real-time Alert: Sensor at ${loc.locationCode} reported EMPTY_BIN for ${items[0].sku}`,
    );
  }

  console.log(
    "🎯 Advanced Simulation Complete. Dashboard should now show AI & IoT data.",
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
