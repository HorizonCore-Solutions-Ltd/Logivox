#!/usr/bin/env node

/**
 * FlowStock WMS - System Health Monitor
 *
 * Monitors system health and sends alerts when issues are detected.
 *
 * Usage:
 *   node scripts/health-monitor.js
 *   node scripts/health-monitor.js --interval 60
 */

const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
const os = require("os");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

const config = {
  apiBaseUrl: process.env.API_BASE_URL || "http://localhost:3000",
  checkInterval: parseInt(process.env.CHECK_INTERVAL) || 300, // 5 minutes
  alertWebhook: process.env.ALERT_WEBHOOK_URL,
  alertEmail: process.env.ALERT_EMAIL,
  logDir: process.env.LOG_DIR || path.join(process.cwd(), "logs"),
};

const thresholds = {
  cpu: 80, // CPU usage percentage
  memory: 80, // Memory usage percentage
  disk: 90, // Disk usage percentage
  responseTime: 1000, // API response time in ms
  errorRate: 5, // Error rate percentage
  databaseConnections: 50, // Max database connections
};

let alertHistory = [];
const ALERT_COOLDOWN = 3600000; // 1 hour in milliseconds

/**
 * Main monitoring loop
 */
async function startMonitoring() {
  console.log("\n🏥 FlowStock WMS Health Monitor Started\n");
  console.log(`Configuration:`);
  console.log(`  API Base URL: ${config.apiBaseUrl}`);
  console.log(`  Check Interval: ${config.checkInterval} seconds`);
  console.log(
    `  Alert Webhook: ${config.alertWebhook ? "Configured" : "Not configured"}`,
  );
  console.log(`  Alert Email: ${config.alertEmail || "Not configured"}\n`);

  // Ensure log directory exists
  if (!fs.existsSync(config.logDir)) {
    fs.mkdirSync(config.logDir, { recursive: true });
  }

  // Run initial check immediately
  await runHealthCheck();

  // Schedule periodic checks
  setInterval(async () => {
    await runHealthCheck();
  }, config.checkInterval * 1000);
}

/**
 * Run complete health check
 */
async function runHealthCheck() {
  const timestamp = new Date().toISOString();
  const results = {
    timestamp,
    status: "HEALTHY",
    checks: {},
    alerts: [],
  };

  console.log(`\n[${timestamp}] Running health check...`);

  try {
    // System checks
    results.checks.system = await checkSystemHealth();

    // API checks
    results.checks.api = await checkAPIHealth();

    // Database checks
    results.checks.database = await checkDatabaseHealth();

    // Application checks
    results.checks.application = await checkApplicationHealth();

    // Determine overall status
    const allChecks = [
      results.checks.system,
      results.checks.api,
      results.checks.database,
      results.checks.application,
    ];

    if (allChecks.some((check) => check.status === "CRITICAL")) {
      results.status = "CRITICAL";
    } else if (allChecks.some((check) => check.status === "WARNING")) {
      results.status = "WARNING";
    }

    // Collect alerts
    allChecks.forEach((check) => {
      if (check.alerts && check.alerts.length > 0) {
        results.alerts.push(...check.alerts);
      }
    });

    // Send alerts if needed
    if (results.alerts.length > 0) {
      await sendAlerts(results);
    }

    // Log results
    await logResults(results);

    // Display summary
    displaySummary(results);
  } catch (error) {
    console.error(`❌ Health check failed: ${error.message}`);
    results.status = "ERROR";
    results.error = error.message;
  }
}

/**
 * Check system health (CPU, memory, disk)
 */
async function checkSystemHealth() {
  const result = {
    status: "HEALTHY",
    metrics: {},
    alerts: [],
  };

  // CPU usage
  const cpus = os.cpus();
  const cpuUsage =
    cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;

  result.metrics.cpu = Math.round(cpuUsage);

  if (cpuUsage > thresholds.cpu) {
    result.status = "WARNING";
    result.alerts.push({
      severity: "WARNING",
      message: `High CPU usage: ${result.metrics.cpu}% (threshold: ${thresholds.cpu}%)`,
    });
  }

  // Memory usage
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;

  result.metrics.memory = {
    used: Math.round(usedMemory / 1024 / 1024), // MB
    total: Math.round(totalMemory / 1024 / 1024), // MB
    percentage: Math.round(memoryUsage),
  };

  if (memoryUsage > thresholds.memory) {
    result.status = "WARNING";
    result.alerts.push({
      severity: "WARNING",
      message: `High memory usage: ${result.metrics.memory.percentage}% (threshold: ${thresholds.memory}%)`,
    });
  }

  // Disk usage (for main drive)
  try {
    const diskUsage = await getDiskUsage();
    result.metrics.disk = diskUsage;

    if (diskUsage.percentage > thresholds.disk) {
      result.status = "CRITICAL";
      result.alerts.push({
        severity: "CRITICAL",
        message: `Critical disk usage: ${diskUsage.percentage}% (threshold: ${thresholds.disk}%)`,
      });
    }
  } catch (error) {
    result.metrics.disk = { error: error.message };
  }

  // Load average
  const loadAvg = os.loadavg();
  result.metrics.loadAverage = {
    "1min": loadAvg[0].toFixed(2),
    "5min": loadAvg[1].toFixed(2),
    "15min": loadAvg[2].toFixed(2),
  };

  // Uptime
  result.metrics.uptime = Math.floor(os.uptime() / 60); // minutes

  return result;
}

/**
 * Check API health
 */
async function checkAPIHealth() {
  const result = {
    status: "HEALTHY",
    metrics: {},
    alerts: [],
  };

  const endpoints = [
    { name: "Health", path: "/api/health" },
    { name: "Products", path: "/api/products" },
    { name: "Inventory", path: "/api/inventory" },
  ];

  const responseTimes = [];
  let errorCount = 0;

  for (const endpoint of endpoints) {
    try {
      const start = Date.now();
      const response = await axios.get(`${config.apiBaseUrl}${endpoint.path}`, {
        timeout: 10000,
      });
      const responseTime = Date.now() - start;

      responseTimes.push(responseTime);

      if (response.status !== 200) {
        errorCount++;
      }

      if (responseTime > thresholds.responseTime) {
        result.status = "WARNING";
        result.alerts.push({
          severity: "WARNING",
          message: `Slow response from ${endpoint.name}: ${responseTime}ms (threshold: ${thresholds.responseTime}ms)`,
        });
      }
    } catch (error) {
      errorCount++;
      result.status = "CRITICAL";
      result.alerts.push({
        severity: "CRITICAL",
        message: `API endpoint ${endpoint.name} failed: ${error.message}`,
      });
    }
  }

  result.metrics.avgResponseTime = Math.round(
    responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
  );
  result.metrics.errorRate = Math.round((errorCount / endpoints.length) * 100);

  if (result.metrics.errorRate > thresholds.errorRate) {
    result.status = "CRITICAL";
    result.alerts.push({
      severity: "CRITICAL",
      message: `High API error rate: ${result.metrics.errorRate}% (threshold: ${thresholds.errorRate}%)`,
    });
  }

  return result;
}

/**
 * Check database health
 */
async function checkDatabaseHealth() {
  const result = {
    status: "HEALTHY",
    metrics: {},
    alerts: [],
  };

  try {
    // Test database connection
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - start;

    result.metrics.connectionTime = responseTime;

    if (responseTime > 1000) {
      result.status = "WARNING";
      result.alerts.push({
        severity: "WARNING",
        message: `Slow database connection: ${responseTime}ms`,
      });
    }

    // Check database size
    const dbSize = await prisma.$queryRaw`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `;
    result.metrics.databaseSize = dbSize[0].size;

    // Check table counts
    const productCount = await prisma.product.count();
    const orderCount = await prisma.salesOrder.count();
    const customerCount = await prisma.customer.count();

    result.metrics.records = {
      products: productCount,
      orders: orderCount,
      customers: customerCount,
    };

    // Check for long-running queries
    const longQueries = await prisma.$queryRaw`
      SELECT pid, now() - pg_stat_activity.query_start AS duration, query
      FROM pg_stat_activity
      WHERE state = 'active'
        AND now() - pg_stat_activity.query_start > interval '5 minutes'
    `;

    if (longQueries.length > 0) {
      result.status = "WARNING";
      result.alerts.push({
        severity: "WARNING",
        message: `${longQueries.length} long-running queries detected`,
      });
    }
  } catch (error) {
    result.status = "CRITICAL";
    result.alerts.push({
      severity: "CRITICAL",
      message: `Database check failed: ${error.message}`,
    });
  }

  return result;
}

/**
 * Check application-specific health
 */
async function checkApplicationHealth() {
  const result = {
    status: "HEALTHY",
    metrics: {},
    alerts: [],
  };

  try {
    // Check for negative stock levels
    const negativeStock = await prisma.inventoryLevel.count({
      where: { quantity: { lt: 0 } },
    });

    if (negativeStock > 0) {
      result.status = "WARNING";
      result.alerts.push({
        severity: "WARNING",
        message: `${negativeStock} products have negative stock levels`,
      });
    }

    result.metrics.negativeStock = negativeStock;

    // Check for pending orders
    const pendingOrders = await prisma.salesOrder.count({
      where: { status: "PENDING" },
    });

    result.metrics.pendingOrders = pendingOrders;

    // Check for low stock items
    const lowStock = await prisma.inventoryLevel.count({
      where: { quantity: { lte: 10 } },
    });

    result.metrics.lowStockItems = lowStock;

    // Check for failed transactions in last hour
    const oneHourAgo = new Date(Date.now() - 3600000);
    const recentErrors = await prisma.inventoryTransaction.count({
      where: {
        createdAt: { gte: oneHourAgo },
        status: "FAILED",
      },
    });

    if (recentErrors > 10) {
      result.status = "WARNING";
      result.alerts.push({
        severity: "WARNING",
        message: `High number of failed transactions: ${recentErrors} in last hour`,
      });
    }

    result.metrics.recentErrors = recentErrors;
  } catch (error) {
    result.status = "WARNING";
    result.alerts.push({
      severity: "WARNING",
      message: `Application check failed: ${error.message}`,
    });
  }

  return result;
}

/**
 * Get disk usage
 */
async function getDiskUsage() {
  // This is a simplified version. In production, use a proper disk usage library
  return {
    used: 50, // GB
    total: 100, // GB
    percentage: 50,
  };
}

/**
 * Send alerts
 */
async function sendAlerts(results) {
  const criticalAlerts = results.alerts.filter(
    (a) => a.severity === "CRITICAL",
  );
  const warningAlerts = results.alerts.filter((a) => a.severity === "WARNING");

  if (criticalAlerts.length === 0 && warningAlerts.length === 0) {
    return;
  }

  // Check cooldown
  const alertKey = results.alerts.map((a) => a.message).join("|");
  const lastAlert = alertHistory.find((h) => h.key === alertKey);

  if (lastAlert && Date.now() - lastAlert.timestamp < ALERT_COOLDOWN) {
    console.log("⏰ Alert cooldown active, skipping notification");
    return;
  }

  // Record alert
  alertHistory.push({
    key: alertKey,
    timestamp: Date.now(),
  });

  // Clean old alert history
  alertHistory = alertHistory.filter(
    (h) => Date.now() - h.timestamp < ALERT_COOLDOWN,
  );

  const message = formatAlertMessage(results);

  // Send webhook alert
  if (config.alertWebhook) {
    try {
      await axios.post(config.alertWebhook, {
        text: message,
        status: results.status,
        timestamp: results.timestamp,
      });
      console.log("✅ Alert sent via webhook");
    } catch (error) {
      console.error(`❌ Failed to send webhook alert: ${error.message}`);
    }
  }

  // Log alert
  console.log("\n🚨 ALERT:\n");
  console.log(message);
}

/**
 * Format alert message
 */
function formatAlertMessage(results) {
  let message = `🚨 FlowStock WMS Health Alert\n\n`;
  message += `Status: ${results.status}\n`;
  message += `Time: ${results.timestamp}\n\n`;

  const criticalAlerts = results.alerts.filter(
    (a) => a.severity === "CRITICAL",
  );
  const warningAlerts = results.alerts.filter((a) => a.severity === "WARNING");

  if (criticalAlerts.length > 0) {
    message += `CRITICAL Issues (${criticalAlerts.length}):\n`;
    criticalAlerts.forEach((alert) => {
      message += `  ❌ ${alert.message}\n`;
    });
    message += `\n`;
  }

  if (warningAlerts.length > 0) {
    message += `Warnings (${warningAlerts.length}):\n`;
    warningAlerts.forEach((alert) => {
      message += `  ⚠️  ${alert.message}\n`;
    });
  }

  return message;
}

/**
 * Log results
 */
async function logResults(results) {
  const logFile = path.join(
    config.logDir,
    `health-${new Date().toISOString().split("T")[0]}.log`,
  );

  const logEntry = `[${results.timestamp}] ${results.status}\n${JSON.stringify(results, null, 2)}\n\n`;

  fs.appendFileSync(logFile, logEntry);
}

/**
 * Display summary
 */
function displaySummary(results) {
  console.log(`\nStatus: ${getStatusEmoji(results.status)} ${results.status}`);

  if (results.checks.system) {
    console.log(`\nSystem:`);
    console.log(`  CPU: ${results.checks.system.metrics.cpu}%`);
    console.log(
      `  Memory: ${results.checks.system.metrics.memory.percentage}%`,
    );
    console.log(`  Disk: ${results.checks.system.metrics.disk.percentage}%`);
    console.log(`  Uptime: ${results.checks.system.metrics.uptime} minutes`);
  }

  if (results.checks.api) {
    console.log(`\nAPI:`);
    console.log(
      `  Avg Response Time: ${results.checks.api.metrics.avgResponseTime}ms`,
    );
    console.log(`  Error Rate: ${results.checks.api.metrics.errorRate}%`);
  }

  if (results.checks.database) {
    console.log(`\nDatabase:`);
    console.log(
      `  Connection Time: ${results.checks.database.metrics.connectionTime}ms`,
    );
    console.log(`  Size: ${results.checks.database.metrics.databaseSize}`);
  }

  if (results.checks.application) {
    console.log(`\nApplication:`);
    console.log(
      `  Pending Orders: ${results.checks.application.metrics.pendingOrders}`,
    );
    console.log(
      `  Low Stock Items: ${results.checks.application.metrics.lowStockItems}`,
    );
    console.log(
      `  Negative Stock: ${results.checks.application.metrics.negativeStock}`,
    );
  }

  if (results.alerts.length > 0) {
    console.log(`\n⚠️  ${results.alerts.length} alert(s) detected`);
  } else {
    console.log(`\n✅ All checks passed`);
  }
}

/**
 * Get status emoji
 */
function getStatusEmoji(status) {
  switch (status) {
    case "HEALTHY":
      return "✅";
    case "WARNING":
      return "⚠️";
    case "CRITICAL":
      return "🚨";
    default:
      return "❓";
  }
}

/**
 * Parse command-line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--interval" && args[i + 1]) {
      config.checkInterval = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === "--help" || args[i] === "-h") {
      displayHelp();
      process.exit(0);
    }
  }
}

/**
 * Display help
 */
function displayHelp() {
  console.log(`
FlowStock WMS - System Health Monitor

Usage:
  node scripts/health-monitor.js [options]

Options:
  --interval <seconds>    Check interval in seconds (default: 300)
  --help, -h             Display this help message

Environment Variables:
  API_BASE_URL           Base URL for API (default: http://localhost:3000)
  CHECK_INTERVAL         Check interval in seconds (default: 300)
  ALERT_WEBHOOK_URL      Webhook URL for alerts
  ALERT_EMAIL            Email address for alerts
  LOG_DIR                Directory for log files (default: ./logs)

Examples:
  # Start monitoring with default interval (5 minutes)
  node scripts/health-monitor.js

  # Start monitoring with 1-minute interval
  node scripts/health-monitor.js --interval 60

  # Start with custom API URL
  API_BASE_URL=https://api.example.com node scripts/health-monitor.js
  `);
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n\n👋 Shutting down health monitor...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n\n👋 Shutting down health monitor...");
  await prisma.$disconnect();
  process.exit(0);
});

// Start monitoring
if (require.main === module) {
  parseArgs();
  startMonitoring().catch((error) => {
    console.error(`\n❌ Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { startMonitoring };
