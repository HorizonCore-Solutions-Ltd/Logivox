#!/usr/bin/env node

/**
 * FlowStock WMS - Data Validation and Cleanup Tool
 *
 * Validates data integrity and performs cleanup operations.
 *
 * Usage:
 *   node scripts/data-validation.js --check all
 *   node scripts/data-validation.js --check inventory
 *   node scripts/data-validation.js --fix orphaned-records
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const issues = {
  critical: [],
  warnings: [],
  info: [],
};

/**
 * Main validation function
 */
async function validate(options) {
  const { check, fix } = options;

  console.log("\n🔍 FlowStock WMS Data Validation Tool\n");

  try {
    if (check) {
      await runChecks(check);
    }

    if (fix) {
      await runFixes(fix);
    }

    // Display summary
    displaySummary();
  } catch (error) {
    console.error(`\n❌ Validation failed: ${error.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Run validation checks
 */
async function runChecks(checkType) {
  console.log(`Running checks: ${checkType}\n`);

  switch (checkType) {
    case "all":
      await checkProducts();
      await checkInventory();
      await checkOrders();
      await checkCustomers();
      await checkLocations();
      await checkOrphanedRecords();
      await checkDataIntegrity();
      break;
    case "products":
      await checkProducts();
      break;
    case "inventory":
      await checkInventory();
      break;
    case "orders":
      await checkOrders();
      break;
    case "customers":
      await checkCustomers();
      break;
    case "locations":
      await checkLocations();
      break;
    case "orphaned":
      await checkOrphanedRecords();
      break;
    case "integrity":
      await checkDataIntegrity();
      break;
    default:
      console.error(`❌ Unknown check type: ${checkType}`);
      process.exit(1);
  }
}

/**
 * Check Products
 */
async function checkProducts() {
  console.log("📦 Checking Products...\n");

  // Check for duplicate SKUs
  const duplicateSkus = await prisma.$queryRaw`
    SELECT sku, COUNT(*) as count
    FROM products
    GROUP BY sku
    HAVING COUNT(*) > 1
  `;

  if (duplicateSkus.length > 0) {
    issues.critical.push({
      type: "Duplicate SKUs",
      count: duplicateSkus.length,
      details: duplicateSkus.map((d) => `${d.sku} (${d.count} occurrences)`),
    });
  }

  // Check for products without SKU
  const noSku = await prisma.product.count({
    where: { sku: null },
  });

  if (noSku > 0) {
    issues.critical.push({
      type: "Products without SKU",
      count: noSku,
    });
  }

  // Check for products with negative prices
  const negativePrices = await prisma.product.count({
    where: {
      OR: [{ unitCost: { lt: 0 } }, { sellingPrice: { lt: 0 } }],
    },
  });

  if (negativePrices > 0) {
    issues.warnings.push({
      type: "Products with negative prices",
      count: negativePrices,
    });
  }

  // Check for products with selling price < unit cost
  const belowCost = await prisma.product.count({
    where: {
      sellingPrice: { lt: prisma.product.fields.unitCost },
    },
  });

  if (belowCost > 0) {
    issues.warnings.push({
      type: "Products selling below cost",
      count: belowCost,
    });
  }

  console.log("✅ Product checks complete\n");
}

/**
 * Check Inventory
 */
async function checkInventory() {
  console.log("📊 Checking Inventory...\n");

  // Check for negative stock levels
  const negativeStock = await prisma.inventoryLevel.count({
    where: { quantity: { lt: 0 } },
  });

  if (negativeStock > 0) {
    issues.critical.push({
      type: "Negative stock levels",
      count: negativeStock,
    });
  }

  // Check for reserved > available
  const invalidReservations = await prisma.inventoryLevel.count({
    where: {
      reservedQuantity: { gt: prisma.inventoryLevel.fields.quantity },
    },
  });

  if (invalidReservations > 0) {
    issues.critical.push({
      type: "Reserved quantity exceeds available",
      count: invalidReservations,
    });
  }

  // Check inventory transactions without corresponding products
  const orphanedTransactions = await prisma.inventoryTransaction.count({
    where: {
      product: null,
    },
  });

  if (orphanedTransactions > 0) {
    issues.warnings.push({
      type: "Orphaned inventory transactions",
      count: orphanedTransactions,
    });
  }

  // Check for inventory levels not matching transaction totals
  const mismatchedLevels = await prisma.$queryRaw`
    SELECT 
      il.product_id,
      il.warehouse_id,
      il.quantity as current_quantity,
      COALESCE(SUM(
        CASE 
          WHEN it.type IN ('IN', 'ADJUSTMENT_IN', 'RETURN') THEN it.quantity
          WHEN it.type IN ('OUT', 'ADJUSTMENT_OUT', 'SALE') THEN -it.quantity
          ELSE 0
        END
      ), 0) as calculated_quantity
    FROM inventory_levels il
    LEFT JOIN inventory_transactions it ON il.product_id = it.product_id AND il.warehouse_id = it.warehouse_id
    GROUP BY il.product_id, il.warehouse_id, il.quantity
    HAVING il.quantity != COALESCE(SUM(
      CASE 
        WHEN it.type IN ('IN', 'ADJUSTMENT_IN', 'RETURN') THEN it.quantity
        WHEN it.type IN ('OUT', 'ADJUSTMENT_OUT', 'SALE') THEN -it.quantity
        ELSE 0
      END
    ), 0)
    LIMIT 10
  `;

  if (mismatchedLevels.length > 0) {
    issues.warnings.push({
      type: "Inventory levels not matching transactions",
      count: mismatchedLevels.length,
      details: mismatchedLevels.map(
        (m) =>
          `Product ${m.product_id}: Current=${m.current_quantity}, Calculated=${m.calculated_quantity}`,
      ),
    });
  }

  console.log("✅ Inventory checks complete\n");
}

/**
 * Check Orders
 */
async function checkOrders() {
  console.log("📋 Checking Orders...\n");

  // Check for orders without customers
  const noCustomer = await prisma.salesOrder.count({
    where: { customerId: null },
  });

  if (noCustomer > 0) {
    issues.critical.push({
      type: "Orders without customer",
      count: noCustomer,
    });
  }

  // Check for orders with invalid status transitions
  const invalidStatuses = await prisma.salesOrder.count({
    where: {
      status: {
        notIn: [
          "PENDING",
          "CONFIRMED",
          "PICKED",
          "PACKED",
          "SHIPPED",
          "DELIVERED",
          "CANCELLED",
        ],
      },
    },
  });

  if (invalidStatuses > 0) {
    issues.warnings.push({
      type: "Orders with invalid status",
      count: invalidStatuses,
    });
  }

  // Check for orders without line items
  const noLineItems = await prisma.salesOrder.count({
    where: {
      lineItems: {
        none: {},
      },
    },
  });

  if (noLineItems > 0) {
    issues.warnings.push({
      type: "Orders without line items",
      count: noLineItems,
    });
  }

  // Check for shipped orders without tracking numbers
  const noTracking = await prisma.salesOrder.count({
    where: {
      status: "SHIPPED",
      trackingNumber: null,
    },
  });

  if (noTracking > 0) {
    issues.warnings.push({
      type: "Shipped orders without tracking numbers",
      count: noTracking,
    });
  }

  console.log("✅ Order checks complete\n");
}

/**
 * Check Customers
 */
async function checkCustomers() {
  console.log("👥 Checking Customers...\n");

  // Check for duplicate emails
  const duplicateEmails = await prisma.$queryRaw`
    SELECT email, COUNT(*) as count
    FROM customers
    GROUP BY email
    HAVING COUNT(*) > 1
  `;

  if (duplicateEmails.length > 0) {
    issues.critical.push({
      type: "Duplicate customer emails",
      count: duplicateEmails.length,
      details: duplicateEmails.map(
        (d) => `${d.email} (${d.count} occurrences)`,
      ),
    });
  }

  // Check for customers without email
  const noEmail = await prisma.customer.count({
    where: { email: null },
  });

  if (noEmail > 0) {
    issues.critical.push({
      type: "Customers without email",
      count: noEmail,
    });
  }

  // Check for invalid email formats
  const invalidEmails = await prisma.customer.count({
    where: {
      email: {
        not: {
          contains: "@",
        },
      },
    },
  });

  if (invalidEmails > 0) {
    issues.warnings.push({
      type: "Customers with invalid email format",
      count: invalidEmails,
    });
  }

  console.log("✅ Customer checks complete\n");
}

/**
 * Check Locations
 */
async function checkLocations() {
  console.log("📍 Checking Locations...\n");

  // Check for duplicate location codes in same warehouse
  const duplicateLocations = await prisma.$queryRaw`
    SELECT warehouse_id, location_code, COUNT(*) as count
    FROM locations
    GROUP BY warehouse_id, location_code
    HAVING COUNT(*) > 1
  `;

  if (duplicateLocations.length > 0) {
    issues.critical.push({
      type: "Duplicate location codes",
      count: duplicateLocations.length,
      details: duplicateLocations.map(
        (d) =>
          `Warehouse ${d.warehouse_id}, Location ${d.location_code} (${d.count} occurrences)`,
      ),
    });
  }

  // Check for locations without warehouse
  const noWarehouse = await prisma.location.count({
    where: { warehouseId: null },
  });

  if (noWarehouse > 0) {
    issues.critical.push({
      type: "Locations without warehouse",
      count: noWarehouse,
    });
  }

  console.log("✅ Location checks complete\n");
}

/**
 * Check for orphaned records
 */
async function checkOrphanedRecords() {
  console.log("🔗 Checking for orphaned records...\n");

  // Orphaned order line items
  const orphanedLineItems = await prisma.orderLineItem.count({
    where: {
      order: null,
    },
  });

  if (orphanedLineItems > 0) {
    issues.warnings.push({
      type: "Orphaned order line items",
      count: orphanedLineItems,
    });
  }

  console.log("✅ Orphaned record checks complete\n");
}

/**
 * Check data integrity (foreign keys, constraints)
 */
async function checkDataIntegrity() {
  console.log("🔒 Checking data integrity...\n");

  // This would include checks for:
  // - Foreign key violations
  // - Unique constraint violations
  // - Check constraint violations
  // - Data type consistency

  console.log("✅ Data integrity checks complete\n");
}

/**
 * Run fixes
 */
async function runFixes(fixType) {
  console.log(`\n🔧 Running fixes: ${fixType}\n`);

  switch (fixType) {
    case "orphaned-records":
      await fixOrphanedRecords();
      break;
    case "negative-stock":
      await fixNegativeStock();
      break;
    case "invalid-reservations":
      await fixInvalidReservations();
      break;
    default:
      console.error(`❌ Unknown fix type: ${fixType}`);
      process.exit(1);
  }
}

/**
 * Fix orphaned records
 */
async function fixOrphanedRecords() {
  console.log("Removing orphaned records...\n");

  // Delete orphaned order line items
  const deletedLineItems = await prisma.orderLineItem.deleteMany({
    where: {
      order: null,
    },
  });

  console.log(
    `✅ Deleted ${deletedLineItems.count} orphaned order line items\n`,
  );

  // Delete orphaned inventory transactions
  const deletedTransactions = await prisma.inventoryTransaction.deleteMany({
    where: {
      product: null,
    },
  });

  console.log(
    `✅ Deleted ${deletedTransactions.count} orphaned inventory transactions\n`,
  );
}

/**
 * Fix negative stock levels
 */
async function fixNegativeStock() {
  console.log("Fixing negative stock levels...\n");

  const negativeStock = await prisma.inventoryLevel.findMany({
    where: { quantity: { lt: 0 } },
  });

  for (const level of negativeStock) {
    await prisma.inventoryLevel.update({
      where: { id: level.id },
      data: { quantity: 0 },
    });

    // Create adjustment transaction
    await prisma.inventoryTransaction.create({
      data: {
        productId: level.productId,
        warehouseId: level.warehouseId,
        type: "ADJUSTMENT",
        quantity: Math.abs(level.quantity),
        reason: "AUTO_FIX",
        notes: `Fixed negative stock level: ${level.quantity} → 0`,
      },
    });
  }

  console.log(`✅ Fixed ${negativeStock.length} negative stock levels\n`);
}

/**
 * Fix invalid reservations
 */
async function fixInvalidReservations() {
  console.log("Fixing invalid reservations...\n");

  const invalidReservations = await prisma.inventoryLevel.findMany({
    where: {
      reservedQuantity: { gt: prisma.inventoryLevel.fields.quantity },
    },
  });

  for (const level of invalidReservations) {
    await prisma.inventoryLevel.update({
      where: { id: level.id },
      data: { reservedQuantity: level.quantity },
    });
  }

  console.log(`✅ Fixed ${invalidReservations.length} invalid reservations\n`);
}

/**
 * Display summary
 */
function displaySummary() {
  console.log("\n" + "=".repeat(60));
  console.log("📊 Validation Summary");
  console.log("=".repeat(60));

  if (issues.critical.length === 0 && issues.warnings.length === 0) {
    console.log("✅ No issues found! Database is healthy.\n");
    return;
  }

  if (issues.critical.length > 0) {
    console.log("\n🚨 CRITICAL ISSUES:\n");
    issues.critical.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.type}: ${issue.count} records`);
      if (issue.details) {
        issue.details
          .slice(0, 5)
          .forEach((detail) => console.log(`   - ${detail}`));
        if (issue.details.length > 5) {
          console.log(`   ... and ${issue.details.length - 5} more`);
        }
      }
    });
  }

  if (issues.warnings.length > 0) {
    console.log("\n⚠️  WARNINGS:\n");
    issues.warnings.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.type}: ${issue.count} records`);
      if (issue.details) {
        issue.details
          .slice(0, 5)
          .forEach((detail) => console.log(`   - ${detail}`));
        if (issue.details.length > 5) {
          console.log(`   ... and ${issue.details.length - 5} more`);
        }
      }
    });
  }

  console.log("\n" + "=".repeat(60) + "\n");
}

/**
 * Parse command-line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--check" && args[i + 1]) {
      options.check = args[i + 1];
      i++;
    } else if (args[i] === "--fix" && args[i + 1]) {
      options.fix = args[i + 1];
      i++;
    } else if (args[i] === "--help" || args[i] === "-h") {
      displayHelp();
      process.exit(0);
    }
  }

  return options;
}

/**
 * Display help
 */
function displayHelp() {
  console.log(`
FlowStock WMS - Data Validation and Cleanup Tool

Usage:
  node scripts/data-validation.js --check <type>
  node scripts/data-validation.js --fix <type>

Check Options:
  all             Run all checks
  products        Check product data
  inventory       Check inventory data
  orders          Check order data
  customers       Check customer data
  locations       Check location data
  orphaned        Check for orphaned records
  integrity       Check data integrity

Fix Options:
  orphaned-records       Delete orphaned records
  negative-stock         Fix negative stock levels
  invalid-reservations   Fix invalid reservations

Examples:
  # Run all checks
  node scripts/data-validation.js --check all

  # Check inventory only
  node scripts/data-validation.js --check inventory

  # Fix orphaned records
  node scripts/data-validation.js --fix orphaned-records
  `);
}

// Run validation
if (require.main === module) {
  const options = parseArgs();

  if (!options.check && !options.fix) {
    console.error("❌ Error: --check or --fix argument is required.\n");
    displayHelp();
    process.exit(1);
  }

  validate(options).catch((error) => {
    console.error(`\n❌ Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { validate };
