
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Load Sheet History & KPIs...');

  const org = await prisma.organization.findFirst();
  if (!org) {
      console.log("No organization found. Run basic seed first.");
      return;
  }

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  // 1. Create a "Perfect" Departed Load Sheet (Yesterday)
  await prisma.loadSheet.create({
    data: {
        organizationId: org.id,
        loadSheetNumber: `LS-HIST-${Math.floor(Math.random() * 10000)}`,
        status: "DEPARTED",
        carrierName: "FedEx Freight",
        shipmentDate: yesterday,
        scheduledDeparture: new Date(yesterday.setHours(14, 0, 0, 0)),
        startedLoadingAt: new Date(yesterday.setHours(13, 0, 0, 0)),
        finishedLoadingAt: new Date(yesterday.setHours(13, 45, 0, 0)), // 45m load time
        actualDeparture: new Date(yesterday.setHours(13, 55, 0, 0)), // 5m early
        totalWeight: 12500,
        totalContainers: 22,
        metadata: { stagingLane: "S1" }
    }
  });

  // 2. Create a "Late" Load Sheet (2 Days Ago)
  await prisma.loadSheet.create({
    data: {
        organizationId: org.id,
        loadSheetNumber: `LS-HIST-${Math.floor(Math.random() * 10000)}`,
        status: "DEPARTED",
        carrierName: "DHL Express",
        shipmentDate: twoDaysAgo,
        scheduledDeparture: new Date(twoDaysAgo.setHours(10, 0, 0, 0)),
        startedLoadingAt: new Date(twoDaysAgo.setHours(9, 30, 0, 0)),
        finishedLoadingAt: new Date(twoDaysAgo.setHours(10, 15, 0, 0)), // Finished late
        actualDeparture: new Date(twoDaysAgo.setHours(10, 45, 0, 0)), // Departed 45m late
        delayReason: "Paperwork Issue",
        detentionMinutes: 45,
        totalWeight: 8400,
        totalContainers: 14,
        metadata: { stagingLane: "S2" }
    }
  });
  
  // 3. Create a "Loading Right Now" Sheet
  await prisma.loadSheet.create({
    data: {
        organizationId: org.id,
        loadSheetNumber: `LS-ACTIVE-${Math.floor(Math.random() * 10000)}`,
        status: "LOADING",
        carrierName: "Internal Fleet",
        shipmentDate: now,
        scheduledDeparture: new Date(new Date().setHours(now.getHours() + 1)), // Due in 1 hour
        startedLoadingAt: new Date(new Date().setHours(now.getHours() - 1)), // Started 1 hour ago
        totalWeight: 5000,
        totalContainers: 10,
        metadata: { stagingLane: "S3" }
    }
  });

  console.log("Load Sheet History seeded!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
