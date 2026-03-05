import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚛 Seeding Fleet Vehicle Types...");

  const org = await prisma.organization.findFirst();
  if (!org) {
      console.error("No organization found. Run main seed first.");
      return;
  }

  const vehicles = [
    {
      name: "53ft Dry Van",
      description: "Standard 53ft Trailer",
      length: 53, // feet
      width: 8.5,
      height: 9,
      maxWeight: 20000, // kg approx
      maxVolume: 100, // m3 approx
    },
    {
      name: "26ft Box Truck",
      description: "Local Delivery Truck",
      length: 26,
      width: 8,
      height: 8,
      maxWeight: 8000,
      maxVolume: 40,
    },
    {
      name: "Sprinter Van",
      description: "Express Courier Van",
      length: 14,
      width: 6,
      height: 6,
      maxWeight: 1500,
      maxVolume: 10,
    }
  ];

  for (const v of vehicles) {
    await prisma.fleetVehicleType.upsert({
      where: {
        organizationId_name: {
          organizationId: org.id,
          name: v.name
        }
      },
      update: {},
      create: {
        organizationId: org.id,
        ...v
      }
    });
  }

  console.log("✅ Vehicle Types Seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
