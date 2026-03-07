import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
config();

const prisma = new PrismaClient();

async function main() {
  console.log("Dropping conflicting tables...");
  try {
    await prisma.$executeRawUnsafe(
      `DROP TABLE IF EXISTS autonomous_robots CASCADE;`,
    );
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS robots CASCADE;`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS robot_tasks CASCADE;`);
    await prisma.$executeRawUnsafe(
      `DROP TYPE IF EXISTS "RobotStatus" CASCADE;`,
    );
    await prisma.$executeRawUnsafe(
      `DROP TYPE IF EXISTS "RobotTaskStatus" CASCADE;`,
    );
    console.log("Done.");
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
