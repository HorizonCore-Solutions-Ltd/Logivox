#!/usr/bin/env node

/**
 * FlowStock WMS - Performance Benchmark Tool
 * 
 * Runs performance benchmarks and generates reports.
 * 
 * Usage:
 *   node scripts/performance-benchmark.js --suite api
 *   node scripts/performance-benchmark.js --suite database
 *   node scripts/performance-benchmark.js --suite all
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const results = {
  api: [],
  database: [],
  summary: {},
};

const config = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  iterations: parseInt(process.env.BENCHMARK_ITERATIONS) || 100,
  concurrency: parseInt(process.env.BENCHMARK_CONCURRENCY) || 10,
};

/**
 * Main benchmark function
 */
async function runBenchmarks(suite) {
  console.log('\n⚡ FlowStock WMS Performance Benchmark Tool\n');
  console.log(`Configuration:`);
  console.log(`  Base URL: ${config.baseUrl}`);
  console.log(`  Iterations: ${config.iterations}`);
  console.log(`  Concurrency: ${config.concurrency}\n`);

  const startTime = performance.now();

  try {
    switch (suite) {
      case 'all':
        await benchmarkAPI();
        await benchmarkDatabase();
        break;
      case 'api':
        await benchmarkAPI();
        break;
      case 'database':
        await benchmarkDatabase();
        break;
      default:
        console.error(`❌ Unknown suite: ${suite}`);
        process.exit(1);
    }

    const endTime = performance.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(2);

    results.summary.totalTime = totalTime;
    results.summary.timestamp = new Date().toISOString();

    // Display results
    displayResults();

    // Save results to file
    await saveResults();

  } catch (error) {
    console.error(`\n❌ Benchmark failed: ${error.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Benchmark API endpoints
 */
async function benchmarkAPI() {
  console.log('🌐 Benchmarking API Endpoints...\n');

  const endpoints = [
    { name: 'Health Check', method: 'GET', path: '/api/health' },
    { name: 'List Products', method: 'GET', path: '/api/products' },
    { name: 'Get Product', method: 'GET', path: '/api/products/1' },
    { name: 'List Inventory', method: 'GET', path: '/api/inventory' },
    { name: 'List Orders', method: 'GET', path: '/api/orders' },
    { name: 'Get Order', method: 'GET', path: '/api/orders/1' },
    { name: 'List Customers', method: 'GET', path: '/api/customers' },
  ];

  for (const endpoint of endpoints) {
    console.log(`Testing: ${endpoint.name}...`);
    const stats = await benchmarkEndpoint(endpoint);
    results.api.push({ endpoint: endpoint.name, ...stats });
    displayEndpointStats(endpoint.name, stats);
  }

  console.log('✅ API benchmarks complete\n');
}

/**
 * Benchmark a single endpoint
 */
async function benchmarkEndpoint(endpoint) {
  const times = [];
  const errors = [];

  for (let i = 0; i < config.iterations; i++) {
    const start = performance.now();

    try {
      const response = await axios({
        method: endpoint.method,
        url: `${config.baseUrl}${endpoint.path}`,
        timeout: 30000,
      });

      const end = performance.now();
      times.push(end - start);

      if (response.status !== 200) {
        errors.push(`Status ${response.status}`);
      }
    } catch (error) {
      const end = performance.now();
      times.push(end - start);
      errors.push(error.message);
    }
  }

  return calculateStats(times, errors);
}

/**
 * Benchmark database queries
 */
async function benchmarkDatabase() {
  console.log('💾 Benchmarking Database Queries...\n');

  const queries = [
    {
      name: 'Count Products',
      fn: () => prisma.product.count(),
    },
    {
      name: 'Find First Product',
      fn: () => prisma.product.findFirst(),
    },
    {
      name: 'List Products (10)',
      fn: () => prisma.product.findMany({ take: 10 }),
    },
    {
      name: 'List Products with Relations',
      fn: () => prisma.product.findMany({
        take: 10,
        include: {
          category: true,
          inventoryLevels: true,
        },
      }),
    },
    {
      name: 'Count Inventory Levels',
      fn: () => prisma.inventoryLevel.count(),
    },
    {
      name: 'List Inventory Levels (10)',
      fn: () => prisma.inventoryLevel.findMany({ take: 10 }),
    },
    {
      name: 'Complex Query - Low Stock',
      fn: () => prisma.inventoryLevel.findMany({
        where: {
          quantity: { lte: 10 },
        },
        include: {
          product: true,
          warehouse: true,
        },
        take: 10,
      }),
    },
    {
      name: 'Count Orders',
      fn: () => prisma.salesOrder.count(),
    },
    {
      name: 'List Orders (10)',
      fn: () => prisma.salesOrder.findMany({ take: 10 }),
    },
    {
      name: 'List Orders with Relations',
      fn: () => prisma.salesOrder.findMany({
        take: 10,
        include: {
          customer: true,
          lineItems: {
            include: {
              product: true,
            },
          },
        },
      }),
    },
  ];

  for (const query of queries) {
    console.log(`Testing: ${query.name}...`);
    const stats = await benchmarkQuery(query.fn);
    results.database.push({ query: query.name, ...stats });
    displayQueryStats(query.name, stats);
  }

  console.log('✅ Database benchmarks complete\n');
}

/**
 * Benchmark a single query
 */
async function benchmarkQuery(queryFn) {
  const times = [];
  const errors = [];

  for (let i = 0; i < config.iterations; i++) {
    const start = performance.now();

    try {
      await queryFn();
      const end = performance.now();
      times.push(end - start);
    } catch (error) {
      const end = performance.now();
      times.push(end - start);
      errors.push(error.message);
    }
  }

  return calculateStats(times, errors);
}

/**
 * Calculate statistics from timing data
 */
function calculateStats(times, errors) {
  const sorted = times.sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);

  return {
    count: times.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: sum / times.length,
    median: sorted[Math.floor(times.length / 2)],
    p95: sorted[Math.floor(times.length * 0.95)],
    p99: sorted[Math.floor(times.length * 0.99)],
    errorRate: (errors.length / times.length) * 100,
    errors: errors.length,
  };
}

/**
 * Display endpoint statistics
 */
function displayEndpointStats(name, stats) {
  console.log(`  Min: ${stats.min.toFixed(2)}ms`);
  console.log(`  Max: ${stats.max.toFixed(2)}ms`);
  console.log(`  Mean: ${stats.mean.toFixed(2)}ms`);
  console.log(`  Median: ${stats.median.toFixed(2)}ms`);
  console.log(`  P95: ${stats.p95.toFixed(2)}ms`);
  console.log(`  P99: ${stats.p99.toFixed(2)}ms`);
  console.log(`  Error Rate: ${stats.errorRate.toFixed(2)}%`);
  console.log(``);
}

/**
 * Display query statistics
 */
function displayQueryStats(name, stats) {
  console.log(`  Min: ${stats.min.toFixed(2)}ms`);
  console.log(`  Max: ${stats.max.toFixed(2)}ms`);
  console.log(`  Mean: ${stats.mean.toFixed(2)}ms`);
  console.log(`  Median: ${stats.median.toFixed(2)}ms`);
  console.log(`  P95: ${stats.p95.toFixed(2)}ms`);
  console.log(`  P99: ${stats.p99.toFixed(2)}ms`);
  console.log(`  Error Rate: ${stats.errorRate.toFixed(2)}%`);
  console.log(``);
}

/**
 * Display overall results
 */
function displayResults() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 Benchmark Results');
  console.log('='.repeat(60));

  if (results.api.length > 0) {
    console.log('\n🌐 API Endpoints:\n');
    console.log('Endpoint'.padEnd(30) + 'Mean'.padEnd(12) + 'P95'.padEnd(12) + 'Errors');
    console.log('-'.repeat(60));

    results.api.forEach(result => {
      console.log(
        result.endpoint.padEnd(30) +
        `${result.mean.toFixed(2)}ms`.padEnd(12) +
        `${result.p95.toFixed(2)}ms`.padEnd(12) +
        `${result.errors}`
      );
    });
  }

  if (results.database.length > 0) {
    console.log('\n💾 Database Queries:\n');
    console.log('Query'.padEnd(35) + 'Mean'.padEnd(12) + 'P95'.padEnd(12) + 'Errors');
    console.log('-'.repeat(60));

    results.database.forEach(result => {
      console.log(
        result.query.padEnd(35) +
        `${result.mean.toFixed(2)}ms`.padEnd(12) +
        `${result.p95.toFixed(2)}ms`.padEnd(12) +
        `${result.errors}`
      );
    });
  }

  console.log(`\n⏱️  Total Time: ${results.summary.totalTime}s`);
  console.log('='.repeat(60) + '\n');
}

/**
 * Save results to file
 */
async function saveResults() {
  const outputDir = path.join(process.cwd(), 'benchmark-results');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `benchmark-${timestamp}.json`;
  const filepath = path.join(outputDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(results, null, 2));

  console.log(`📁 Results saved to: ${filepath}\n`);

  // Generate HTML report
  await generateHTMLReport(outputDir, timestamp);
}

/**
 * Generate HTML report
 */
async function generateHTMLReport(outputDir, timestamp) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FlowStock WMS - Performance Benchmark Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    h1 {
      color: #2c3e50;
      margin-bottom: 10px;
      font-size: 32px;
    }

    .meta {
      color: #7f8c8d;
      margin-bottom: 30px;
      font-size: 14px;
    }

    h2 {
      color: #34495e;
      margin-top: 40px;
      margin-bottom: 20px;
      font-size: 24px;
      border-bottom: 2px solid #3498db;
      padding-bottom: 10px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }

    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ecf0f1;
    }

    th {
      background: #34495e;
      color: white;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 0.5px;
    }

    tr:hover {
      background: #f8f9fa;
    }

    .metric {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
    }

    .metric.fast {
      background: #d4edda;
      color: #155724;
    }

    .metric.medium {
      background: #fff3cd;
      color: #856404;
    }

    .metric.slow {
      background: #f8d7da;
      color: #721c24;
    }

    .summary {
      background: #ecf0f1;
      padding: 20px;
      border-radius: 6px;
      margin-bottom: 30px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }

    .summary-item {
      background: white;
      padding: 15px;
      border-radius: 4px;
    }

    .summary-label {
      font-size: 12px;
      color: #7f8c8d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }

    .summary-value {
      font-size: 24px;
      font-weight: 600;
      color: #2c3e50;
    }

    .chart {
      height: 300px;
      margin: 20px 0;
      background: #f8f9fa;
      border-radius: 4px;
      padding: 20px;
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
    }

    .bar {
      flex: 1;
      margin: 0 5px;
      background: #3498db;
      border-radius: 4px 4px 0 0;
      position: relative;
      transition: background 0.3s;
    }

    .bar:hover {
      background: #2980b9;
    }

    .bar-label {
      position: absolute;
      bottom: -25px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 10px;
      white-space: nowrap;
    }

    .bar-value {
      position: absolute;
      top: -20px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 12px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚡ FlowStock WMS Performance Benchmark Report</h1>
    <div class="meta">
      Generated: ${new Date(results.summary.timestamp).toLocaleString()}<br>
      Total Time: ${results.summary.totalTime}s<br>
      Iterations: ${config.iterations} | Concurrency: ${config.concurrency}
    </div>

    <div class="summary">
      <h3>Summary</h3>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-label">API Tests</div>
          <div class="summary-value">${results.api.length}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Database Tests</div>
          <div class="summary-value">${results.database.length}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total Requests</div>
          <div class="summary-value">${(results.api.length + results.database.length) * config.iterations}</div>
        </div>
      </div>
    </div>

    ${results.api.length > 0 ? `
    <h2>🌐 API Endpoint Benchmarks</h2>
    <table>
      <thead>
        <tr>
          <th>Endpoint</th>
          <th>Min (ms)</th>
          <th>Mean (ms)</th>
          <th>Median (ms)</th>
          <th>P95 (ms)</th>
          <th>P99 (ms)</th>
          <th>Max (ms)</th>
          <th>Errors</th>
        </tr>
      </thead>
      <tbody>
        ${results.api.map(result => `
        <tr>
          <td><strong>${result.endpoint}</strong></td>
          <td>${result.min.toFixed(2)}</td>
          <td><span class="metric ${getPerformanceClass(result.mean)}">${result.mean.toFixed(2)}</span></td>
          <td>${result.median.toFixed(2)}</td>
          <td><span class="metric ${getPerformanceClass(result.p95)}">${result.p95.toFixed(2)}</span></td>
          <td>${result.p99.toFixed(2)}</td>
          <td>${result.max.toFixed(2)}</td>
          <td>${result.errors}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : ''}

    ${results.database.length > 0 ? `
    <h2>💾 Database Query Benchmarks</h2>
    <table>
      <thead>
        <tr>
          <th>Query</th>
          <th>Min (ms)</th>
          <th>Mean (ms)</th>
          <th>Median (ms)</th>
          <th>P95 (ms)</th>
          <th>P99 (ms)</th>
          <th>Max (ms)</th>
          <th>Errors</th>
        </tr>
      </thead>
      <tbody>
        ${results.database.map(result => `
        <tr>
          <td><strong>${result.query}</strong></td>
          <td>${result.min.toFixed(2)}</td>
          <td><span class="metric ${getPerformanceClass(result.mean)}">${result.mean.toFixed(2)}</span></td>
          <td>${result.median.toFixed(2)}</td>
          <td><span class="metric ${getPerformanceClass(result.p95)}">${result.p95.toFixed(2)}</span></td>
          <td>${result.p99.toFixed(2)}</td>
          <td>${result.max.toFixed(2)}</td>
          <td>${result.errors}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : ''}

  </div>

  <script>
    function getPerformanceClass(value) {
      if (value < 100) return 'fast';
      if (value < 500) return 'medium';
      return 'slow';
    }
  </script>
</body>
</html>
  `;

  const filename = `benchmark-report-${timestamp}.html`;
  const filepath = path.join(outputDir, filename);

  fs.writeFileSync(filepath, html);

  console.log(`📄 HTML report saved to: ${filepath}\n`);
}

/**
 * Get performance class for styling
 */
function getPerformanceClass(value) {
  if (value < 100) return 'fast';
  if (value < 500) return 'medium';
  return 'slow';
}

/**
 * Parse command-line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  let suite = 'all';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--suite' && args[i + 1]) {
      suite = args[i + 1];
      i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
      displayHelp();
      process.exit(0);
    }
  }

  return suite;
}

/**
 * Display help
 */
function displayHelp() {
  console.log(`
FlowStock WMS - Performance Benchmark Tool

Usage:
  node scripts/performance-benchmark.js --suite <type>

Suite Options:
  all         Run all benchmarks
  api         Benchmark API endpoints only
  database    Benchmark database queries only

Environment Variables:
  API_BASE_URL              Base URL for API (default: http://localhost:3000)
  BENCHMARK_ITERATIONS      Number of iterations (default: 100)
  BENCHMARK_CONCURRENCY     Concurrent requests (default: 10)

Examples:
  # Run all benchmarks
  node scripts/performance-benchmark.js --suite all

  # Benchmark API only
  node scripts/performance-benchmark.js --suite api

  # Benchmark with custom iterations
  BENCHMARK_ITERATIONS=200 node scripts/performance-benchmark.js --suite all
  `);
}

// Run benchmarks
if (require.main === module) {
  const suite = parseArgs();
  runBenchmarks(suite).catch((error) => {
    console.error(`\n❌ Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runBenchmarks };
