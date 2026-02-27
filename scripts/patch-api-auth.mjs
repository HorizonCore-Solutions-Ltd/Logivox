#!/usr/bin/env node
/**
 * Bulk API auth guard patcher — production-safe
 * Adds requireApiAuth() to every genuinely unscoped API route handler.
 * Run: node scripts/patch-api-auth.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_ROOT = path.join(__dirname, "../apps/web/src/app/api");

// Legitimately public — never add auth
const SKIP_KEYS = new Set([
  "auth/register", "auth/[...nextauth]",
  "customer/track", "customer/download-pod",
  "health", "health/live", "health/ready", "health/detailed", "health/database",
  "metrics", "errors/log",
  "mobile/auth/login",
  "public/bookings", "public/customers",
  "public/inventory", "public/inventory/[id]",
  "supplier/auth",
  "v1/inventory", "v1/inventory/[id]",
]);

const GUARD_IMPORT = `import { requireApiAuth } from "@/lib/api-guard";`;
const AUTH_GUARD_BLOCK = `    const auth = await requireApiAuth();\n    if ("error" in auth) return auth.error;\n    const { organizationId } = auth;\n`;

let patched = 0, skipped = 0, alreadyDone = 0;

function relKey(fp) {
  return path.relative(API_ROOT, path.dirname(fp)).replace(/\\/g, "/");
}

function addImport(src) {
  if (src.includes(GUARD_IMPORT)) return src;
  const lines = src.split("\n");
  let last = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s/.test(lines[i])) last = i;
  }
  lines.splice(last + 1, 0, GUARD_IMPORT);
  return lines.join("\n");
}

function removeUnsafeOrgLines(src) {
  // Remove: const organizationId = searchParams.get("organizationId") || "org-1";
  // Remove: const organizationId = searchParams.get("organizationId");
  // auth block now provides: const { organizationId } = auth;
  src = src.replace(
    /^\s*const organizationId\s*=\s*(?:searchParams\.get\(["']organizationId["']\)|params\.organizationId)\s*(?:\|\|[^;\n]*)?\s*;\n/gm,
    ""
  );
  // Remove naive guard: if (!organizationId) { return NextResponse.json(...400) }
  src = src.replace(
    /\n[ \t]*if\s*\(\s*!organizationId\s*\)\s*\{[^\}]*\}\n/g,
    "\n"
  );
  return src;
}

function injectGuards(src) {
  return src.replace(
    /(export\s+async\s+function\s+(?:GET|POST|PUT|PATCH|DELETE|HEAD)\s*\([^{]*\)\s*(?::\s*\S+\s*)?\{)(\s*\n\s*try\s*\{)?/g,
    (match, fnOpen, tryBlock) => {
      if (tryBlock && tryBlock.includes("try")) {
        return `${fnOpen}\n  try {\n${AUTH_GUARD_BLOCK}`;
      }
      return `${fnOpen}\n${AUTH_GUARD_BLOCK}`;
    }
  );
}

function processFile(fp) {
  const key = relKey(fp);
  if (SKIP_KEYS.has(key)) { skipped++; return; }

  let src = fs.readFileSync(fp, "utf8");

  if (
    src.includes("getServerSession") ||
    src.includes("resolveTenantFromRequest") ||
    src.includes("requireApiAuth") ||
    src.includes("verifyToken") ||
    src.includes("jwt.verify") ||
    src.includes("authOptions") ||
    src.includes("NextAuth")
  ) { alreadyDone++; return; }

  src = addImport(src);
  src = removeUnsafeOrgLines(src);
  src = injectGuards(src);

  fs.writeFileSync(fp, src, "utf8");
  patched++;
  console.log(`  patched: ${key}`);
}

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name === "route.ts") processFile(full);
  }
}

console.log("Patching unscoped API routes...\n");
walk(API_ROOT);
console.log(`\nPatched: ${patched}  |  Already safe: ${alreadyDone}  |  Public (skipped): ${skipped}`);
