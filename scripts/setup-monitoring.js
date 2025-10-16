#!/usr/bin/env node

/**
 * FlowStock WMS - Monitoring Dashboard Setup
 * 
 * Sets up monitoring dashboards and alerts for production deployment.
 * 
 * Usage:
 *   node scripts/setup-monitoring.js --platform grafana
 *   node scripts/setup-monitoring.js --platform datadog
 */

const fs = require('fs');
const path = require('path');

/**
 * Main setup function
 */
async function setupMonitoring(platform) {
  console.log('\n📊 FlowStock WMS Monitoring Dashboard Setup\n');
  console.log(`Setting up for platform: ${platform}\n`);

  try {
    switch (platform) {
      case 'grafana':
        await setupGrafana();
        break;
      case 'datadog':
        await setupDatadog();
        break;
      case 'cloudwatch':
        await setupCloudWatch();
        break;
      case 'prometheus':
        await setupPrometheus();
        break;
      default:
        console.error(`❌ Unknown platform: ${platform}`);
        process.exit(1);
    }

    console.log('\n✅ Monitoring setup complete!');
    console.log('\nNext steps:');
    console.log('1. Review generated configuration files');
    console.log('2. Apply configurations to your monitoring platform');
    console.log('3. Configure alert webhooks and notification channels');
    console.log('4. Test alerts by triggering threshold violations');
    console.log('5. Document dashboard access for team members\n');

  } catch (error) {
    console.error(`\n❌ Setup failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Setup Grafana dashboards
 */
async function setupGrafana() {
  console.log('📈 Setting up Grafana dashboards...\n');

  const dashboards = {
    'system-overview': createSystemOverviewDashboard(),
    'api-performance': createAPIPerformanceDashboard(),
    'database-metrics': createDatabaseMetricsDashboard(),
    'business-metrics': createBusinessMetricsDashboard(),
    'alerts': createAlertsDashboard(),
  };

  const outputDir = path.join(process.cwd(), 'monitoring', 'grafana');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const [name, dashboard] of Object.entries(dashboards)) {
    const filename = `${name}-dashboard.json`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(dashboard, null, 2));
    console.log(`✅ Created: ${filename}`);
  }

  // Create Prometheus scrape config
  const prometheusConfig = createPrometheusConfig();
  const prometheusConfigPath = path.join(outputDir, 'prometheus.yml');
  fs.writeFileSync(prometheusConfigPath, prometheusConfig);
  console.log(`✅ Created: prometheus.yml`);

  // Create alerts config
  const alertsConfig = createGrafanaAlertsConfig();
  const alertsConfigPath = path.join(outputDir, 'alerts.yml');
  fs.writeFileSync(alertsConfigPath, alertsConfig);
  console.log(`✅ Created: alerts.yml`);

  console.log(`\n📁 Files created in: ${outputDir}`);
}

/**
 * Create System Overview Dashboard
 */
function createSystemOverviewDashboard() {
  return {
    dashboard: {
      title: 'FlowStock WMS - System Overview',
      tags: ['flowstock', 'system', 'overview'],
      timezone: 'browser',
      panels: [
        {
          id: 1,
          title: 'CPU Usage',
          type: 'graph',
          targets: [
            {
              expr: '100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)',
              legendFormat: 'CPU Usage %',
            },
          ],
          yaxes: [
            { format: 'percent', max: 100, min: 0 },
          ],
        },
        {
          id: 2,
          title: 'Memory Usage',
          type: 'graph',
          targets: [
            {
              expr: '(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100',
              legendFormat: 'Memory Usage %',
            },
          ],
          yaxes: [
            { format: 'percent', max: 100, min: 0 },
          ],
        },
        {
          id: 3,
          title: 'Disk Usage',
          type: 'graph',
          targets: [
            {
              expr: '(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100',
              legendFormat: 'Disk Usage %',
            },
          ],
          yaxes: [
            { format: 'percent', max: 100, min: 0 },
          ],
        },
        {
          id: 4,
          title: 'Network Traffic',
          type: 'graph',
          targets: [
            {
              expr: 'rate(node_network_receive_bytes_total[5m])',
              legendFormat: 'Inbound',
            },
            {
              expr: 'rate(node_network_transmit_bytes_total[5m])',
              legendFormat: 'Outbound',
            },
          ],
          yaxes: [
            { format: 'bytes', min: 0 },
          ],
        },
      ],
    },
  };
}

/**
 * Create API Performance Dashboard
 */
function createAPIPerformanceDashboard() {
  return {
    dashboard: {
      title: 'FlowStock WMS - API Performance',
      tags: ['flowstock', 'api', 'performance'],
      timezone: 'browser',
      panels: [
        {
          id: 1,
          title: 'Request Rate',
          type: 'graph',
          targets: [
            {
              expr: 'rate(http_requests_total[5m])',
              legendFormat: '{{method}} {{endpoint}}',
            },
          ],
        },
        {
          id: 2,
          title: 'Response Time (P95)',
          type: 'graph',
          targets: [
            {
              expr: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))',
              legendFormat: '{{endpoint}}',
            },
          ],
          yaxes: [
            { format: 'ms', min: 0 },
          ],
        },
        {
          id: 3,
          title: 'Error Rate',
          type: 'graph',
          targets: [
            {
              expr: 'rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100',
              legendFormat: 'Error Rate %',
            },
          ],
          yaxes: [
            { format: 'percent', max: 100, min: 0 },
          ],
        },
        {
          id: 4,
          title: 'Status Code Distribution',
          type: 'piechart',
          targets: [
            {
              expr: 'sum by (status) (rate(http_requests_total[5m]))',
              legendFormat: '{{status}}',
            },
          ],
        },
      ],
    },
  };
}

/**
 * Create Database Metrics Dashboard
 */
function createDatabaseMetricsDashboard() {
  return {
    dashboard: {
      title: 'FlowStock WMS - Database Metrics',
      tags: ['flowstock', 'database', 'postgres'],
      timezone: 'browser',
      panels: [
        {
          id: 1,
          title: 'Active Connections',
          type: 'graph',
          targets: [
            {
              expr: 'pg_stat_database_numbackends',
              legendFormat: 'Connections',
            },
          ],
        },
        {
          id: 2,
          title: 'Query Duration (P95)',
          type: 'graph',
          targets: [
            {
              expr: 'histogram_quantile(0.95, rate(pg_stat_statements_total_time_bucket[5m]))',
              legendFormat: '{{query}}',
            },
          ],
          yaxes: [
            { format: 'ms', min: 0 },
          ],
        },
        {
          id: 3,
          title: 'Transactions Per Second',
          type: 'graph',
          targets: [
            {
              expr: 'rate(pg_stat_database_xact_commit[5m]) + rate(pg_stat_database_xact_rollback[5m])',
              legendFormat: 'TPS',
            },
          ],
        },
        {
          id: 4,
          title: 'Cache Hit Ratio',
          type: 'graph',
          targets: [
            {
              expr: 'pg_stat_database_blks_hit / (pg_stat_database_blks_hit + pg_stat_database_blks_read) * 100',
              legendFormat: 'Cache Hit %',
            },
          ],
          yaxes: [
            { format: 'percent', max: 100, min: 0 },
          ],
        },
        {
          id: 5,
          title: 'Database Size',
          type: 'graph',
          targets: [
            {
              expr: 'pg_database_size_bytes',
              legendFormat: 'Size',
            },
          ],
          yaxes: [
            { format: 'bytes', min: 0 },
          ],
        },
      ],
    },
  };
}

/**
 * Create Business Metrics Dashboard
 */
function createBusinessMetricsDashboard() {
  return {
    dashboard: {
      title: 'FlowStock WMS - Business Metrics',
      tags: ['flowstock', 'business', 'kpi'],
      timezone: 'browser',
      panels: [
        {
          id: 1,
          title: 'Active Users',
          type: 'stat',
          targets: [
            {
              expr: 'count(count by (user_id) (rate(user_activity[5m])))',
              legendFormat: 'Active Users',
            },
          ],
        },
        {
          id: 2,
          title: 'Orders Created (Today)',
          type: 'stat',
          targets: [
            {
              expr: 'sum(increase(orders_created_total[1d]))',
              legendFormat: 'Orders',
            },
          ],
        },
        {
          id: 3,
          title: 'Inventory Transactions',
          type: 'graph',
          targets: [
            {
              expr: 'rate(inventory_transactions_total[5m])',
              legendFormat: '{{type}}',
            },
          ],
        },
        {
          id: 4,
          title: 'Order Status Distribution',
          type: 'piechart',
          targets: [
            {
              expr: 'sum by (status) (orders_by_status)',
              legendFormat: '{{status}}',
            },
          ],
        },
        {
          id: 5,
          title: 'Low Stock Alerts',
          type: 'stat',
          targets: [
            {
              expr: 'count(inventory_levels{quantity<reorder_point})',
              legendFormat: 'Low Stock Items',
            },
          ],
        },
        {
          id: 6,
          title: 'Revenue (Today)',
          type: 'stat',
          targets: [
            {
              expr: 'sum(increase(order_value_total[1d]))',
              legendFormat: 'Revenue',
            },
          ],
          fieldConfig: {
            defaults: {
              unit: 'currencyUSD',
            },
          },
        },
      ],
    },
  };
}

/**
 * Create Alerts Dashboard
 */
function createAlertsDashboard() {
  return {
    dashboard: {
      title: 'FlowStock WMS - Alerts',
      tags: ['flowstock', 'alerts'],
      timezone: 'browser',
      panels: [
        {
          id: 1,
          title: 'Active Alerts',
          type: 'table',
          targets: [
            {
              expr: 'ALERTS{alertstate="firing"}',
            },
          ],
        },
        {
          id: 2,
          title: 'Alert History',
          type: 'graph',
          targets: [
            {
              expr: 'sum by (alertname) (rate(alerts_total[5m]))',
              legendFormat: '{{alertname}}',
            },
          ],
        },
      ],
    },
  };
}

/**
 * Create Prometheus scrape config
 */
function createPrometheusConfig() {
  return `# FlowStock WMS - Prometheus Configuration

global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  # FlowStock API
  - job_name: 'flowstock-api'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'

  # Node Exporter (System Metrics)
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  # PostgreSQL Exporter
  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['localhost:9187']

  # Redis Exporter
  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['localhost:9121']

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['localhost:9093']

rule_files:
  - 'alerts.yml'
`;
}

/**
 * Create Grafana alerts config
 */
function createGrafanaAlertsConfig() {
  return `# FlowStock WMS - Alert Rules

groups:
  - name: system_alerts
    interval: 30s
    rules:
      - alert: HighCPUUsage
        expr: 100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage detected"
          description: "CPU usage is above 80% for 5 minutes"

      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is above 80% for 5 minutes"

      - alert: DiskSpaceLow
        expr: (1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100 > 90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Disk space critically low"
          description: "Disk usage is above 90%"

  - name: api_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100 > 5
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High API error rate"
          description: "Error rate is above 5% for 5 minutes"

      - alert: SlowAPIResponse
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow API response time"
          description: "P95 response time is above 1 second"

      - alert: APIDown
        expr: up{job="flowstock-api"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "API is down"
          description: "FlowStock API is not responding"

  - name: database_alerts
    interval: 30s
    rules:
      - alert: DatabaseDown
        expr: up{job="postgres-exporter"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database is down"
          description: "PostgreSQL database is not responding"

      - alert: HighDatabaseConnections
        expr: pg_stat_database_numbackends > 50
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High number of database connections"
          description: "Database has more than 50 active connections"

      - alert: LowCacheHitRatio
        expr: pg_stat_database_blks_hit / (pg_stat_database_blks_hit + pg_stat_database_blks_read) * 100 < 80
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Low database cache hit ratio"
          description: "Cache hit ratio is below 80%"

  - name: business_alerts
    interval: 60s
    rules:
      - alert: NoOrdersCreated
        expr: increase(orders_created_total[1h]) == 0
        for: 2h
        labels:
          severity: warning
        annotations:
          summary: "No orders created"
          description: "No orders have been created in the last 2 hours"

      - alert: HighStockOutRate
        expr: count(inventory_levels{quantity=0}) / count(inventory_levels) * 100 > 10
        for: 30m
        labels:
          severity: warning
        annotations:
          summary: "High stock-out rate"
          description: "More than 10% of products are out of stock"

      - alert: NegativeStockDetected
        expr: count(inventory_levels{quantity<0}) > 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Negative stock levels detected"
          description: "One or more products have negative stock levels"
`;
}

/**
 * Setup DataDog
 */
async function setupDatadog() {
  console.log('📈 Setting up DataDog dashboards...\n');
  console.log('Please follow these steps:');
  console.log('1. Install DataDog agent on your server');
  console.log('2. Configure APM tracing in your application');
  console.log('3. Import pre-built dashboards from DataDog marketplace');
  console.log('4. Configure alert monitors');
  console.log('\nSee DataDog documentation for details.');
}

/**
 * Setup CloudWatch
 */
async function setupCloudWatch() {
  console.log('📈 Setting up CloudWatch dashboards...\n');
  console.log('Please follow these steps:');
  console.log('1. Enable CloudWatch agent on EC2 instances');
  console.log('2. Configure custom metrics from your application');
  console.log('3. Create dashboards in CloudWatch console');
  console.log('4. Set up CloudWatch alarms');
  console.log('\nSee AWS CloudWatch documentation for details.');
}

/**
 * Setup Prometheus
 */
async function setupPrometheus() {
  console.log('📈 Setting up Prometheus...\n');
  
  const outputDir = path.join(process.cwd(), 'monitoring', 'prometheus');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const prometheusConfig = createPrometheusConfig();
  const prometheusConfigPath = path.join(outputDir, 'prometheus.yml');
  fs.writeFileSync(prometheusConfigPath, prometheusConfig);
  console.log(`✅ Created: prometheus.yml`);

  const alertsConfig = createGrafanaAlertsConfig();
  const alertsConfigPath = path.join(outputDir, 'alerts.yml');
  fs.writeFileSync(alertsConfigPath, alertsConfig);
  console.log(`✅ Created: alerts.yml`);

  console.log(`\n📁 Files created in: ${outputDir}`);
}

/**
 * Parse command-line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  let platform = 'grafana';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--platform' && args[i + 1]) {
      platform = args[i + 1];
      i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
      displayHelp();
      process.exit(0);
    }
  }

  return platform;
}

/**
 * Display help
 */
function displayHelp() {
  console.log(`
FlowStock WMS - Monitoring Dashboard Setup

Usage:
  node scripts/setup-monitoring.js --platform <platform>

Platform Options:
  grafana       Setup Grafana dashboards (default)
  datadog       Setup DataDog dashboards
  cloudwatch    Setup AWS CloudWatch dashboards
  prometheus    Setup Prometheus configuration

Examples:
  # Setup Grafana dashboards
  node scripts/setup-monitoring.js --platform grafana

  # Setup Prometheus
  node scripts/setup-monitoring.js --platform prometheus
  `);
}

// Run setup
if (require.main === module) {
  const platform = parseArgs();
  setupMonitoring(platform).catch((error) => {
    console.error(`\n❌ Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { setupMonitoring };
