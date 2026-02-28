/**
 * ENDPOINT TENANT SCOPING SCANNER
 * Analyzes which API routes use tenant-scoped models and their current scoping status
 */

import * as fs from "fs";
import * as path from "path";

// Models that require organizationId scoping
const TENANT_SCOPED_MODELS = [
  "InventoryItem",
  "SalesOrder",
  "PurchaseOrder",
  "Customer",
  "Supplier",
  "Warehouse",
  "PickingRoute",
  "PickingTask",
  "WavePick",
  "GoodsReceiptNote",
  "Invoice",
  "CycleCount",
  "Category",
  "Employee",
  "DeliveryRoute",
  "Pack",
  "PickList",
  "DockAppointment",
  "VelocityClassification",
  "DemandForecast",
  "AutonomousDecision",
  "AutonomousConfig",
  "WeatherData",
  "EnvironmentalReading",
  "IoTDevice",
  "IoTAlert",
  "SerialNumber",
  "BillOfMaterials",
  "AssemblyOrder",
  "Booking",
  "Document",
  "ApiKey",
  "AuditLog",
  "ActivityLog",
  "IntegrationConnection",
  "ExternalIntegration",
  "Dashboard",
  "Alert",
  "AlertRule",
  "QCReceivingInspection",
];

interface QueryUsage {
  model: string;
  operation:
    | "findMany"
    | "findFirst"
    | "findUnique"
    | "create"
    | "update"
    | "delete"
    | "upsert";
  line: number;
  hasOrganizationId: boolean;
  context: string;
}

interface EndpointAnalysis {
  file: string;
  route: string;
  method: string;
  queries: QueryUsage[];
  tenantScoped: boolean;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

function analyzeFile(filePath: string): EndpointAnalysis | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    // Extract method from filename pattern
    const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
    let method = "UNKNOWN";
    for (const m of methods) {
      if (content.includes(`export (const |async function) ${m}`)) {
        method = m;
        break;
      }
    }

    // Extract route from file path
    const routeMatch = filePath.match(/\/api\/([^/]+)/);
    const route = routeMatch ? `/api/${routeMatch[1]}` : "unknown";

    const queries: QueryUsage[] = [];
    let hasUnscoped = false;

    lines.forEach((line, idx) => {
      for (const model of TENANT_SCOPED_MODELS) {
        const patterns = [
          new RegExp(
            `prisma\\.${model.charAt(0).toLowerCase() + model.slice(1)}\\.findMany\\s*\\(`,
            "i",
          ),
          new RegExp(
            `prisma\\.${model.charAt(0).toLowerCase() + model.slice(1)}\\.findFirst\\s*\\(`,
            "i",
          ),
          new RegExp(
            `prisma\\.${model.charAt(0).toLowerCase() + model.slice(1)}\\.findUnique\\s*\\(`,
            "i",
          ),
          new RegExp(
            `prisma\\.${model.charAt(0).toLowerCase() + model.slice(1)}\\.create\\s*\\(`,
            "i",
          ),
          new RegExp(
            `prisma\\.${model.charAt(0).toLowerCase() + model.slice(1)}\\.update\\s*\\(`,
            "i",
          ),
          new RegExp(
            `prisma\\.${model.charAt(0).toLowerCase() + model.slice(1)}\\.delete\\s*\\(`,
            "i",
          ),
        ];

        for (const pattern of patterns) {
          if (pattern.test(line)) {
            let op: QueryUsage["operation"] = "findMany";
            if (line.includes("findFirst")) op = "findFirst";
            if (line.includes("findUnique")) op = "findUnique";
            if (line.includes("create")) op = "create";
            if (line.includes("update")) op = "update";
            if (line.includes("delete")) op = "delete";
            if (line.includes("upsert")) op = "upsert";

            // Check if this operation is properly scoped
            // Method 1: organizationId in WHERE clause (single or multiline)
            const whereMatch = content.indexOf("where:");
            const nextOpMatch = content.indexOf(
              "select:",
              whereMatch > -1 ? whereMatch : 0,
            );
            const whereBlock =
              whereMatch > -1
                ? content.substring(
                    whereMatch,
                    nextOpMatch > whereMatch
                      ? nextOpMatch
                      : Math.min(whereMatch + 500, content.length),
                  )
                : "";

            // Method 2: organizationId in data payload
            const dataMatch = content.indexOf("data:");
            const nextFieldMatch = content.indexOf(
              "}",
              dataMatch > -1 ? dataMatch : 0,
            );
            const dataBlock =
              dataMatch > -1
                ? content.substring(
                    dataMatch,
                    Math.min(dataMatch + 300, content.length),
                  )
                : "";

            // Method 3: Using tenant context helpers (withTenantContext, resolveTenantFromRequest, validateOrganizationAccess)
            const usesTenantContext =
              /withTenantContext|resolveTenantFromRequest|validateOrganizationAccess/.test(
                content,
              );

            const hasOrgId =
              /organizationId/.test(whereBlock) ||
              /organizationId/.test(dataBlock) ||
              usesTenantContext;

            queries.push({
              model,
              operation: op,
              line: idx + 1,
              hasOrganizationId: hasOrgId,
              context: line.trim().substring(0, 80),
            });

            if (
              !hasOrgId &&
              (op === "findMany" ||
                op === "create" ||
                op === "update" ||
                op === "delete")
            ) {
              hasUnscoped = true;
            }
          }
        }
      }
    });

    if (queries.length === 0) {
      return null; // Not a tenant-scoped endpoint
    }

    // Determine risk level
    let riskLevel: EndpointAnalysis["riskLevel"] = "LOW";
    if (hasUnscoped) {
      riskLevel = "CRITICAL";
    } else if (queries.length > 5) {
      riskLevel = "HIGH";
    } else if (queries.length > 2) {
      riskLevel = "MEDIUM";
    }

    return {
      file: filePath,
      route,
      method,
      queries,
      tenantScoped: !hasUnscoped,
      riskLevel,
    };
  } catch {
    return null;
  }
}

function scanDirectory(dir: string): EndpointAnalysis[] {
  const results: EndpointAnalysis[] = [];

  function walk(currentPath: string) {
    const files = fs.readdirSync(currentPath);

    for (const file of files) {
      const filePath = path.join(currentPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        if (!file.startsWith(".") && file !== "node_modules") {
          walk(filePath);
        }
      } else if (file === "route.ts") {
        const analysis = analyzeFile(filePath);
        if (analysis) {
          results.push(analysis);
        }
      }
    }
  }

  walk(dir);
  return results;
}

function formatReport(analyses: EndpointAnalysis[]): string {
  const riskCounts = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };

  let report = "# TENANT SCOPING ENDPOINT ANALYSIS\n\n";
  report += `**Total endpoints scanned:** ${analyses.length}\n\n`;

  // Count by risk
  for (const analysis of analyses) {
    riskCounts[analysis.riskLevel]++;
  }

  report += `## 🔴 CRITICAL (${riskCounts.CRITICAL}) - Fix immediately\n`;
  report += `## 🟠 HIGH (${riskCounts.HIGH}) - Fix this week\n`;
  report += `## 🟡 MEDIUM (${riskCounts.MEDIUM}) - Fix next week\n`;
  report += `## 🟢 LOW (${riskCounts.LOW}) - Already scoped\n\n`;

  const grouped = {
    CRITICAL: analyses.filter((a) => a.riskLevel === "CRITICAL"),
    HIGH: analyses.filter((a) => a.riskLevel === "HIGH"),
    MEDIUM: analyses.filter((a) => a.riskLevel === "MEDIUM"),
    LOW: analyses.filter((a) => a.riskLevel === "LOW"),
  };

  for (const [level, items] of Object.entries(grouped)) {
    if (items.length === 0) continue;

    report += `\n### ${level} Priority\n\n`;
    for (const item of items) {
      report += `- **${item.route}** (${item.method})\n`;
      report += `  - Queries: ${item.queries.length}\n`;
      report += `  - Unscoped: ${item.queries.filter((q) => !q.hasOrganizationId).length}\n`;
    }
  }

  return report;
}

// Run if invoked directly
const scanDir = process.argv[2] || "apps/web/src/app/api";
console.log(`Scanning ${scanDir}...\n`);

const analyses = scanDirectory(scanDir).sort((a, b) => {
  const riskOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  return (riskOrder[a.riskLevel] || 4) - (riskOrder[b.riskLevel] || 4);
});

console.log(formatReport(analyses));

console.log("\n## Summary Statistics\n");
console.log(`Total endpoints: ${analyses.length}`);
console.log(
  `Queries found: ${analyses.reduce((sum, a) => sum + a.queries.length, 0)}`,
);
console.log(
  `With organizationId: ${analyses.reduce((sum, a) => sum + a.queries.filter((q) => q.hasOrganizationId).length, 0)}`,
);
console.log(
  `Missing organizationId: ${analyses.reduce((sum, a) => sum + a.queries.filter((q) => !q.hasOrganizationId).length, 0)}`,
);

process.exit(analyses.some((a) => a.riskLevel === "CRITICAL") ? 1 : 0);
