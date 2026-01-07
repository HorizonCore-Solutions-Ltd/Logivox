#!/usr/bin/env ts-node

/**
 * Database Seed Script for Phase 2 Testing
 * Creates minimal required data for integration tests
 */

import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database for Phase 2 testing...\n");

  try {
    // 1. Create User
    console.log("Creating test user...");
    let user = await prisma.user.findFirst({
      where: { email: "test@flowstock.com" },
    });

    if (!user) {
      const hashedPassword = await bcrypt.hash("test123", 10);
      user = await prisma.user.create({
        data: {
          email: "test@flowstock.com",
          name: "Test User",
          password: hashedPassword,
          role: "ADMIN",
        },
      });
      console.log("✓ User created:", user.email);
    } else {
      console.log("✓ User exists:", user.email);
    }

    // 2. Create Organization
    console.log("Creating test organization...");
    let org = await prisma.organization.findFirst({
      where: { slug: "test-org" },
    });

    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: "Test Organization",
          slug: "test-org",
          createdById: user.id,
        },
      });
      console.log("✓ Organization created:", org.name);
    } else {
      console.log("✓ Organization exists:", org.name);
    }

    // 3. Create Warehouse
    console.log("Creating test warehouse...");
    let warehouse = await prisma.warehouse.findFirst({
      where: { code: "WH-TEST" },
    });

    if (!warehouse) {
      warehouse = await prisma.warehouse.create({
        data: {
          name: "Test Warehouse",
          code: "WH-TEST",
          organizationId: org.id,
          address: "123 Test Street",
          city: "Test City",
          country: "US",
        },
      });
      console.log("✓ Warehouse created:", warehouse.name);
    } else {
      console.log("✓ Warehouse exists:", warehouse.name);
    }

    // 4. Create Supplier
    console.log("Creating test supplier...");
    let supplier = await prisma.supplier.findFirst({
      where: { code: "SUP-TEST" },
    });

    if (!supplier) {
      supplier = await prisma.supplier.create({
        data: {
          name: "Test Supplier Co.",
          code: "SUP-TEST",
          email: "supplier@test.com",
          phone: "555-0100",
          address: "456 Supplier Ave",
          organizationId: org.id,
        },
      });
      console.log("✓ Supplier created:", supplier.name);
    } else {
      console.log("✓ Supplier exists:", supplier.name);
    }

    // 5. Create Test NCR for integration testing
    console.log("Creating test NCR...");
    let ncr = await prisma.nonConformanceReport.findFirst({
      where: { ncrNumber: "NCR-TEST-001" },
    });

    if (!ncr) {
      ncr = await prisma.nonConformanceReport.create({
        data: {
          ncrNumber: "NCR-TEST-001",
          title: "Test NCR",
          description: "Test non-conformance for integration testing",
          discoveredBy: user.id,
          discoveryLocation: "Test Warehouse",
          sourceType: "RECEIVING",
          quantityAffected: 10,
          nonConformanceType: "MATERIAL_DEFECT",
          severity: "MINOR",
          status: "OPEN",
          category: "QUALITY",
          disposition: "PENDING",
          createdBy: user.id,
          organizationId: org.id,
          supplierId: supplier.id,
        },
      });
      console.log("✓ NCR created:", ncr.ncrNumber);
    } else {
      console.log("✓ NCR exists:", ncr.ncrNumber);
    }

    console.log("\n✅ Database seeded successfully!\n");
    console.log("Test data summary:");
    console.log(`  User ID: ${user.id}`);
    console.log(`  Organization ID: ${org.id}`);
    console.log(`  Warehouse ID: ${warehouse.id}`);
    console.log(`  Supplier ID: ${supplier.id}`);
    console.log(`  NCR ID: ${ncr.id}\n`);

    return {
      userId: user.id,
      orgId: org.id,
      warehouseId: warehouse.id,
      supplierId: supplier.id,
      ncrId: ncr.id,
    };
  } catch (error: any) {
    console.error("❌ Error seeding database:", error.message);
    throw error;
  }
}

main()
  .then(() => {
    console.log("Seed completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
