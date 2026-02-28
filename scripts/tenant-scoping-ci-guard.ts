/**
 * TENANT SCOPING CI GUARD
 * Detects anti-patterns in test files that would violate tenant isolation
 * Run in CI to prevent unscoped queries from being committed
 */

import * as fs from "fs";
import * as path from "path";

const ANTI_PATTERNS = [
  // Unscoped queries - missing organizationId
  {
    pattern: /prisma\.(\w+)\.findMany\s*\(\s*{[^}]*}\s*\)/g,
    check: (match: string) => !match.includes("organizationId"),
    message: "Unscoped findMany query - must include organizationId in where",
  },
  {
    pattern: /prisma\.(\w+)\.findUnique\s*\(\s*{[^}]*}\s*\)/g,
    check: (match: string) =>
      !match.includes("organizationId") && !isSystemModel(match),
    message:
      "Potentially unscoped findUnique - verify organizationId is present",
  },
  {
    pattern: /prisma\.(\w+)\.update\s*\(\s*{[^}]*}\s*\)/g,
    check: (match: string) => !match.includes("organizationId"),
    message: "Unscoped update query - must include organizationId in where",
  },
  {
    pattern: /prisma\.(\w+)\.delete\s*\(\s*{[^}]*}\s*\)/g,
    check: (match: string) => !match.includes("organizationId"),
    message: "Unscoped delete query - must include organizationId in where",
  },
  {
    pattern: /prisma\.(\w+)\.create\s*\(\s*{[^}]*}\s*\)/g,
    check: (match: string) =>
      !match.includes("organizationId") && !isSystemModel(match),
    message: "Create without organizationId - must scope to organization",
  },
];

const SYSTEM_MODELS = new Set([
  "User",
  "Account",
  "Session",
  "Organization",
  "OrganizationMember",
  "SecurityProfile",
  "VerificationToken",
]);

function isSystemModel(query: string): boolean {
  for (const model of SYSTEM_MODELS) {
    if (
      query.includes(`prisma.${model.charAt(0).toLowerCase() + model.slice(1)}`)
    ) {
      return true;
    }
  }
  return false;
}

interface Violation {
  file: string;
  line: number;
  pattern: string;
  message: string;
  code: string;
}

export function scanForTenantViolations(testDir: string): Violation[] {
  const violations: Violation[] = [];

  function walkDir(dir: string) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        if (!file.startsWith("node_modules") && !file.startsWith(".")) {
          walkDir(filePath);
        }
      } else if (
        file.endsWith(".test.ts") ||
        file.endsWith(".spec.ts") ||
        file.endsWith("test.ts")
      ) {
        const content = fs.readFileSync(filePath, "utf-8");
        const lines = content.split("\n");

        lines.forEach((line, idx) => {
          for (const antiPattern of ANTI_PATTERNS) {
            const matches = line.match(antiPattern.pattern);
            if (matches) {
              for (const match of matches) {
                if (antiPattern.check(match)) {
                  violations.push({
                    file: filePath,
                    line: idx + 1,
                    pattern: antiPattern.pattern.toString(),
                    message: antiPattern.message,
                    code: `TENANT_${idx}`,
                  });
                }
              }
            }
          }
        });
      }
    }
  }

  walkDir(testDir);
  return violations;
}

export function formatViolations(violations: Violation[]): string {
  if (violations.length === 0) {
    return "✅ No tenant scoping violations detected!";
  }

  let output = `❌ TENANT ISOLATION VIOLATIONS DETECTED (${violations.length})\n\n`;

  const grouped = violations.reduce(
    (acc, v) => {
      if (!acc[v.file]) acc[v.file] = [];
      acc[v.file].push(v);
      return acc;
    },
    {} as Record<string, Violation[]>,
  );

  for (const [file, viols] of Object.entries(grouped)) {
    output += `📄 ${file}\n`;
    for (const v of viols) {
      output += `   Line ${v.line}: ${v.message}\n`;
    }
    output += "\n";
  }

  output += `\n⚠️  TENANT SCOPING GUIDE:\n`;
  output += `  1. All queries on tenant-scoped models (InventoryItem, Customer, etc.) must include organizationId\n`;
  output += `  2. Use: { where: { organizationId, ...filters }, ... }\n`;
  output += `  3. For creates: { data: { organizationId, ...fields }, ... }\n`;
  output += `  4. Get organizationId from session: session.user.organizationId\n`;
  output += `  5. Or from tenant context: resolveTenantFromRequest(request)\n`;

  return output;
}

// Run if invoked directly (ESM compatible)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const testDir = process.argv[2] || "__tests__";
  console.log(`Scanning ${testDir} for tenant isolation violations...\n`);

  const violations = scanForTenantViolations(testDir);
  console.log(formatViolations(violations));

  process.exit(violations.length > 0 ? 1 : 0);
}

export default { scanForTenantViolations, formatViolations };
