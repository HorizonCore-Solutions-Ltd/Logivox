#!/usr/bin/env node

/**
 * FlowStock WMS - Data Migration Tool
 *
 * This tool helps migrate data from legacy systems to FlowStock WMS.
 * Supports CSV, Excel, and JSON formats.
 *
 * Usage:
 *   node scripts/migrate-data.js --type products --file data.csv
 *   node scripts/migrate-data.js --type orders --file orders.xlsx --dry-run
 *   node scripts/migrate-data.js --type customers --file customers.json
 */

const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const XLSX = require("xlsx");
const { PrismaClient } = require("@prisma/client");
const { createObjectCsvWriter } = require("csv-writer");

const prisma = new PrismaClient();

// Configuration
const config = {
  batchSize: 100,
  maxErrors: 50,
  outputDir: "./migration-output",
};

// Statistics
const stats = {
  total: 0,
  success: 0,
  failed: 0,
  skipped: 0,
  errors: [],
};

/**
 * Main migration function
 */
async function migrate(options) {
  const { type, file, dryRun = false } = options;

  console.log("\n🚀 FlowStock WMS Data Migration Tool\n");
  console.log(`Migration Type: ${type}`);
  console.log(`Source File: ${file}`);
  console.log(`Dry Run: ${dryRun ? "Yes" : "No"}\n`);

  // Validate inputs
  if (!fs.existsSync(file)) {
    console.error(`❌ Error: File not found: ${file}`);
    process.exit(1);
  }

  // Create output directory
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }

  try {
    // Load data based on file type
    const data = await loadData(file);
    console.log(`📊 Loaded ${data.length} records from source file\n`);

    stats.total = data.length;

    // Migrate based on type
    switch (type) {
      case "products":
        await migrateProducts(data, dryRun);
        break;
      case "customers":
        await migrateCustomers(data, dryRun);
        break;
      case "suppliers":
        await migrateSuppliers(data, dryRun);
        break;
      case "orders":
        await migrateOrders(data, dryRun);
        break;
      case "locations":
        await migrateLocations(data, dryRun);
        break;
      case "inventory":
        await migrateInventory(data, dryRun);
        break;
      default:
        console.error(`❌ Error: Unknown migration type: ${type}`);
        process.exit(1);
    }

    // Generate reports
    await generateReport(type);

    // Display summary
    displaySummary();
  } catch (error) {
    console.error(`\n❌ Migration failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Load data from file (CSV, Excel, or JSON)
 */
async function loadData(file) {
  const ext = path.extname(file).toLowerCase();

  if (ext === ".csv") {
    return loadCSV(file);
  } else if (ext === ".xlsx" || ext === ".xls") {
    return loadExcel(file);
  } else if (ext === ".json") {
    return loadJSON(file);
  } else {
    throw new Error(`Unsupported file format: ${ext}`);
  }
}

/**
 * Load CSV file
 */
function loadCSV(file) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(file)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", reject);
  });
}

/**
 * Load Excel file
 */
function loadExcel(file) {
  const workbook = XLSX.readFile(file);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet);
}

/**
 * Load JSON file
 */
function loadJSON(file) {
  const content = fs.readFileSync(file, "utf8");
  return JSON.parse(content);
}

/**
 * Migrate Products
 */
async function migrateProducts(data, dryRun) {
  console.log("📦 Migrating Products...\n");

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const progress = `[${i + 1}/${data.length}]`;

    try {
      // Validate required fields
      if (!row.sku || !row.name) {
        throw new Error("Missing required fields: sku, name");
      }

      // Check for duplicates
      if (!dryRun) {
        const existing = await prisma.product.findUnique({
          where: { sku: row.sku },
        });

        if (existing) {
          console.log(
            `${progress} ⚠️  Skipped: Product ${row.sku} already exists`,
          );
          stats.skipped++;
          continue;
        }
      }

      // Map legacy data to FlowStock schema
      const productData = {
        sku: row.sku.trim(),
        name: row.name.trim(),
        description: row.description || null,
        category: row.category || "GENERAL",
        uom: row.uom || "EA",
        unitCost: parseFloat(row.unitCost || row.cost || 0),
        sellingPrice: parseFloat(row.sellingPrice || row.price || 0),
        reorderLevel: parseInt(row.reorderLevel || row.reorderPoint || 0),
        reorderQuantity: parseInt(row.reorderQuantity || 100),
        barcode: row.barcode || null,
        weight: parseFloat(row.weight || 0),
        length: parseFloat(row.length || 0),
        width: parseFloat(row.width || 0),
        height: parseFloat(row.height || 0),
        status: row.status || "ACTIVE",
      };

      if (!dryRun) {
        await prisma.product.create({ data: productData });
      }

      console.log(
        `${progress} ✅ Migrated: ${productData.sku} - ${productData.name}`,
      );
      stats.success++;
    } catch (error) {
      console.log(`${progress} ❌ Failed: ${row.sku} - ${error.message}`);
      stats.failed++;
      stats.errors.push({
        row: i + 1,
        sku: row.sku,
        error: error.message,
      });

      if (stats.failed >= config.maxErrors) {
        throw new Error(
          `Max errors (${config.maxErrors}) reached. Stopping migration.`,
        );
      }
    }
  }
}

/**
 * Migrate Customers
 */
async function migrateCustomers(data, dryRun) {
  console.log("👥 Migrating Customers...\n");

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const progress = `[${i + 1}/${data.length}]`;

    try {
      // Validate required fields
      if (!row.name || !row.email) {
        throw new Error("Missing required fields: name, email");
      }

      // Check for duplicates
      if (!dryRun) {
        const existing = await prisma.customer.findUnique({
          where: { email: row.email },
        });

        if (existing) {
          console.log(
            `${progress} ⚠️  Skipped: Customer ${row.email} already exists`,
          );
          stats.skipped++;
          continue;
        }
      }

      // Map data
      const customerData = {
        name: row.name.trim(),
        email: row.email.trim().toLowerCase(),
        phone: row.phone || null,
        company: row.company || null,
        taxId: row.taxId || row.vatNumber || null,
        billingAddress: row.billingAddress || null,
        billingCity: row.billingCity || null,
        billingState: row.billingState || null,
        billingZip: row.billingZip || null,
        billingCountry: row.billingCountry || "US",
        shippingAddress: row.shippingAddress || row.billingAddress || null,
        shippingCity: row.shippingCity || row.billingCity || null,
        shippingState: row.shippingState || row.billingState || null,
        shippingZip: row.shippingZip || row.billingZip || null,
        shippingCountry: row.shippingCountry || row.billingCountry || "US",
        status: row.status || "ACTIVE",
      };

      if (!dryRun) {
        await prisma.customer.create({ data: customerData });
      }

      console.log(
        `${progress} ✅ Migrated: ${customerData.name} (${customerData.email})`,
      );
      stats.success++;
    } catch (error) {
      console.log(`${progress} ❌ Failed: ${row.email} - ${error.message}`);
      stats.failed++;
      stats.errors.push({
        row: i + 1,
        email: row.email,
        error: error.message,
      });

      if (stats.failed >= config.maxErrors) {
        throw new Error(
          `Max errors (${config.maxErrors}) reached. Stopping migration.`,
        );
      }
    }
  }
}

/**
 * Migrate Suppliers
 */
async function migrateSuppliers(data, dryRun) {
  console.log("🏭 Migrating Suppliers...\n");

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const progress = `[${i + 1}/${data.length}]`;

    try {
      if (!row.name || !row.email) {
        throw new Error("Missing required fields: name, email");
      }

      if (!dryRun) {
        const existing = await prisma.supplier.findUnique({
          where: { email: row.email },
        });

        if (existing) {
          console.log(
            `${progress} ⚠️  Skipped: Supplier ${row.email} already exists`,
          );
          stats.skipped++;
          continue;
        }
      }

      const supplierData = {
        name: row.name.trim(),
        email: row.email.trim().toLowerCase(),
        phone: row.phone || null,
        contactPerson: row.contactPerson || null,
        website: row.website || null,
        address: row.address || null,
        city: row.city || null,
        state: row.state || null,
        zip: row.zip || null,
        country: row.country || "US",
        leadTime: parseInt(row.leadTime || 7),
        rating: parseFloat(row.rating || 0),
        status: row.status || "ACTIVE",
      };

      if (!dryRun) {
        await prisma.supplier.create({ data: supplierData });
      }

      console.log(
        `${progress} ✅ Migrated: ${supplierData.name} (${supplierData.email})`,
      );
      stats.success++;
    } catch (error) {
      console.log(`${progress} ❌ Failed: ${row.email} - ${error.message}`);
      stats.failed++;
      stats.errors.push({
        row: i + 1,
        email: row.email,
        error: error.message,
      });

      if (stats.failed >= config.maxErrors) {
        throw new Error(`Max errors (${config.maxErrors}) reached.`);
      }
    }
  }
}

/**
 * Migrate Orders (Sales Orders)
 */
async function migrateOrders(data, dryRun) {
  console.log("📋 Migrating Orders...\n");

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const progress = `[${i + 1}/${data.length}]`;

    try {
      if (!row.orderNumber || !row.customerEmail) {
        throw new Error("Missing required fields: orderNumber, customerEmail");
      }

      // Find customer
      const customer = await prisma.customer.findUnique({
        where: { email: row.customerEmail },
      });

      if (!customer) {
        throw new Error(`Customer not found: ${row.customerEmail}`);
      }

      if (!dryRun) {
        const existing = await prisma.salesOrder.findUnique({
          where: { orderNumber: row.orderNumber },
        });

        if (existing) {
          console.log(
            `${progress} ⚠️  Skipped: Order ${row.orderNumber} already exists`,
          );
          stats.skipped++;
          continue;
        }
      }

      const orderData = {
        orderNumber: row.orderNumber.trim(),
        customerId: customer.id,
        orderDate: new Date(row.orderDate || Date.now()),
        status: row.status || "PENDING",
        totalAmount: parseFloat(row.totalAmount || 0),
        notes: row.notes || null,
        shippingMethod: row.shippingMethod || "STANDARD",
        shippingAddress: row.shippingAddress || customer.shippingAddress,
        shippingCity: row.shippingCity || customer.shippingCity,
        shippingState: row.shippingState || customer.shippingState,
        shippingZip: row.shippingZip || customer.shippingZip,
        shippingCountry: row.shippingCountry || customer.shippingCountry,
      };

      if (!dryRun) {
        await prisma.salesOrder.create({ data: orderData });
      }

      console.log(`${progress} ✅ Migrated: Order ${orderData.orderNumber}`);
      stats.success++;
    } catch (error) {
      console.log(
        `${progress} ❌ Failed: ${row.orderNumber} - ${error.message}`,
      );
      stats.failed++;
      stats.errors.push({
        row: i + 1,
        orderNumber: row.orderNumber,
        error: error.message,
      });

      if (stats.failed >= config.maxErrors) {
        throw new Error(`Max errors (${config.maxErrors}) reached.`);
      }
    }
  }
}

/**
 * Migrate Locations
 */
async function migrateLocations(data, dryRun) {
  console.log("📍 Migrating Locations...\n");

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const progress = `[${i + 1}/${data.length}]`;

    try {
      if (!row.locationCode || !row.warehouseId) {
        throw new Error("Missing required fields: locationCode, warehouseId");
      }

      if (!dryRun) {
        const existing = await prisma.location.findFirst({
          where: {
            locationCode: row.locationCode,
            warehouseId: row.warehouseId,
          },
        });

        if (existing) {
          console.log(
            `${progress} ⚠️  Skipped: Location ${row.locationCode} already exists`,
          );
          stats.skipped++;
          continue;
        }
      }

      const locationData = {
        locationCode: row.locationCode.trim(),
        warehouseId: row.warehouseId,
        zone: row.zone || null,
        aisle: row.aisle || null,
        rack: row.rack || null,
        shelf: row.shelf || null,
        bin: row.bin || null,
        locationType: row.locationType || "STORAGE",
        capacity: parseInt(row.capacity || 100),
        status: row.status || "ACTIVE",
      };

      if (!dryRun) {
        await prisma.location.create({ data: locationData });
      }

      console.log(
        `${progress} ✅ Migrated: Location ${locationData.locationCode}`,
      );
      stats.success++;
    } catch (error) {
      console.log(
        `${progress} ❌ Failed: ${row.locationCode} - ${error.message}`,
      );
      stats.failed++;
      stats.errors.push({
        row: i + 1,
        locationCode: row.locationCode,
        error: error.message,
      });

      if (stats.failed >= config.maxErrors) {
        throw new Error(`Max errors (${config.maxErrors}) reached.`);
      }
    }
  }
}

/**
 * Migrate Inventory Levels
 */
async function migrateInventory(data, dryRun) {
  console.log("📊 Migrating Inventory Levels...\n");

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const progress = `[${i + 1}/${data.length}]`;

    try {
      if (!row.sku || !row.warehouseId) {
        throw new Error("Missing required fields: sku, warehouseId");
      }

      // Find product
      const product = await prisma.product.findUnique({
        where: { sku: row.sku },
      });

      if (!product) {
        throw new Error(`Product not found: ${row.sku}`);
      }

      const quantity = parseInt(row.quantity || 0);

      if (!dryRun) {
        // Create or update inventory level
        await prisma.inventoryLevel.upsert({
          where: {
            productId_warehouseId: {
              productId: product.id,
              warehouseId: row.warehouseId,
            },
          },
          create: {
            productId: product.id,
            warehouseId: row.warehouseId,
            quantity,
            reservedQuantity: 0,
          },
          update: {
            quantity,
          },
        });

        // Create inventory transaction
        await prisma.inventoryTransaction.create({
          data: {
            productId: product.id,
            warehouseId: row.warehouseId,
            type: "ADJUSTMENT",
            quantity,
            reason: "DATA_MIGRATION",
            notes: `Migrated from legacy system on ${new Date().toISOString()}`,
          },
        });
      }

      console.log(`${progress} ✅ Migrated: ${row.sku} - Qty: ${quantity}`);
      stats.success++;
    } catch (error) {
      console.log(`${progress} ❌ Failed: ${row.sku} - ${error.message}`);
      stats.failed++;
      stats.errors.push({
        row: i + 1,
        sku: row.sku,
        error: error.message,
      });

      if (stats.failed >= config.maxErrors) {
        throw new Error(`Max errors (${config.maxErrors}) reached.`);
      }
    }
  }
}

/**
 * Generate migration report
 */
async function generateReport(type) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportFile = path.join(
    config.outputDir,
    `migration-report-${type}-${timestamp}.csv`,
  );

  if (stats.errors.length === 0) {
    console.log("\n✅ No errors to report.\n");
    return;
  }

  const csvWriter = createObjectCsvWriter({
    path: reportFile,
    header: [
      { id: "row", title: "Row Number" },
      { id: "identifier", title: "Identifier" },
      { id: "error", title: "Error Message" },
    ],
  });

  const records = stats.errors.map((err) => ({
    row: err.row,
    identifier:
      err.sku || err.email || err.orderNumber || err.locationCode || "N/A",
    error: err.error,
  }));

  await csvWriter.writeRecords(records);
  console.log(`\n📄 Error report saved: ${reportFile}\n`);
}

/**
 * Display migration summary
 */
function displaySummary() {
  console.log("\n" + "=".repeat(60));
  console.log("📊 Migration Summary");
  console.log("=".repeat(60));
  console.log(`Total Records:    ${stats.total}`);
  console.log(`✅ Successful:     ${stats.success}`);
  console.log(`⚠️  Skipped:        ${stats.skipped}`);
  console.log(`❌ Failed:         ${stats.failed}`);
  console.log(
    `Success Rate:     ${((stats.success / stats.total) * 100).toFixed(2)}%`,
  );
  console.log("=".repeat(60) + "\n");

  if (stats.failed > 0) {
    console.log(
      "⚠️  Some records failed to migrate. Check the error report for details.\n",
    );
  }
}

/**
 * Parse command-line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--type" && args[i + 1]) {
      options.type = args[i + 1];
      i++;
    } else if (args[i] === "--file" && args[i + 1]) {
      options.file = args[i + 1];
      i++;
    } else if (args[i] === "--dry-run") {
      options.dryRun = true;
    } else if (args[i] === "--help" || args[i] === "-h") {
      displayHelp();
      process.exit(0);
    }
  }

  return options;
}

/**
 * Display help information
 */
function displayHelp() {
  console.log(`
FlowStock WMS - Data Migration Tool

Usage:
  node scripts/migrate-data.js --type <type> --file <file> [--dry-run]

Options:
  --type <type>     Type of data to migrate:
                    - products
                    - customers
                    - suppliers
                    - orders
                    - locations
                    - inventory

  --file <file>     Source file path (CSV, Excel, or JSON)

  --dry-run         Perform a dry run without writing to database

  --help, -h        Display this help message

Examples:
  # Migrate products from CSV
  node scripts/migrate-data.js --type products --file data/products.csv

  # Dry run for customers
  node scripts/migrate-data.js --type customers --file data/customers.xlsx --dry-run

  # Migrate inventory levels
  node scripts/migrate-data.js --type inventory --file data/inventory.json
  `);
}

// Run migration
if (require.main === module) {
  const options = parseArgs();

  if (!options.type || !options.file) {
    console.error("❌ Error: --type and --file arguments are required.\n");
    displayHelp();
    process.exit(1);
  }

  migrate(options).catch((error) => {
    console.error(`\n❌ Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { migrate };
