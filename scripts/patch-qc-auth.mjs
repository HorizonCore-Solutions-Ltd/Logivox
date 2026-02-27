#!/usr/bin/env node
/**
 * patch-qc-auth.mjs
 * Inserts requireApiAuth() call at the start of every try block inside
 * each exported HTTP handler in the 16 QC [id] dynamic routes.
 * The import already exists — we only add the runtime call.
 */
import { readFileSync, writeFileSync } from "fs";

const AUTH_CALL = `    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;
`;

const FILES = [
  "apps/web/src/app/api/qc/audits/[id]/findings/route.ts",
  "apps/web/src/app/api/qc/audits/[id]/route.ts",
  "apps/web/src/app/api/qc/capa/[id]/route.ts",
  "apps/web/src/app/api/qc/debit-memos/[id]/approve/route.ts",
  "apps/web/src/app/api/qc/documents/[id]/approve/route.ts",
  "apps/web/src/app/api/qc/documents/[id]/training/route.ts",
  "apps/web/src/app/api/qc/export/[id]/route.ts",
  "apps/web/src/app/api/qc/fmea/[id]/failure-modes/route.ts",
  "apps/web/src/app/api/qc/fmea/[id]/route.ts",
  "apps/web/src/app/api/qc/fmea/failure-modes/[fmId]/route.ts",
  "apps/web/src/app/api/qc/inspections/[id]/route.ts",
  "apps/web/src/app/api/qc/ncr/[id]/route.ts",
  "apps/web/src/app/api/qc/quality-holds/[id]/route.ts",
  "apps/web/src/app/api/qc/reports/[id]/route.ts",
  "apps/web/src/app/api/qc/rtv/[id]/route.ts",
  "apps/web/src/app/api/qc/sampling-plans/[id]/route.ts",
];

// Matches the opening try { of an exported handler,
// but only when auth hasn't already been inserted.
// Strategy: split on exported function boundaries,
// then inject into the first try block of each handler.
const EXPORT_RE = /^(export async function (?:GET|POST|PATCH|PUT|DELETE)[^)]+\)\s*\{)\s*\n(\s*try\s*\{)/m;

let patched = 0;
let skipped = 0;

for (const relPath of FILES) {
  const src = readFileSync(relPath, "utf8");

  // Already patched?
  if (src.includes("const auth = await requireApiAuth()")) {
    console.log(`SKIP (already patched): ${relPath}`);
    skipped++;
    continue;
  }

  // Replace ALL occurrences: every handler that has a try { block
  // Insert auth call right after the opening `try {` of each exported handler
  let result = src;
  let insertions = 0;

  // We walk through all exported HTTP handlers.
  // Pattern: exported handler opening, then try {
  // Insert after `try {\n` — but only inside exported handlers (not nested try blocks)
  // Simple heuristic: replace the FIRST try { after each export async function
  const handlerRe = /(export async function (?:GET|POST|PATCH|PUT|DELETE)\b[\s\S]*?\btry\s*\{)(\s*\n)/g;
  result = result.replace(handlerRe, (match, before, after) => {
    // Don't double-insert
    if (match.includes("requireApiAuth()")) return match;
    insertions++;
    return `${before}\n${AUTH_CALL}`;
  });

  if (insertions === 0) {
    // Fallback: some routes may not use try {} — just insert after first handler open brace
    console.log(`WARN: no try block found in ${relPath} — skipping`);
    skipped++;
    continue;
  }

  writeFileSync(relPath, result, "utf8");
  console.log(`PATCHED (${insertions} handlers): ${relPath}`);
  patched++;
}

console.log(`\nDone. Patched: ${patched}, Skipped: ${skipped}`);
