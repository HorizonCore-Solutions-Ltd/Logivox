const fs = require("fs");
const path = require("path");

const SCHEMA_PATH = path.join(__dirname, "../prisma/schema.prisma");
let schemaContent = fs.readFileSync(SCHEMA_PATH, "utf-8");

console.log("Analyzing schema for Zero-Tolerance Data Integrity...");
let lines = schemaContent.split("\n");
let modified = false;

let inModel = false;
let currentModelName = "";
let currentModelLines = [];
let modelStartIdx = 0;

function flushModel() {
  if (!inModel) return;
  // Analyze currentModelLines for missing indexes on *Id fields
  let idsToIndx = [];
  currentModelLines.forEach((line) => {
    let match = line.match(/^\s+([a-zA-Z0-9_]+Id)\s+(String|Int)[\s\?]/);
    if (match) {
      idsToIndx.push(match[1]);
    }
  });

  // Check if they are already indexed
  idsToIndx.forEach((idField) => {
    let hasIndex = currentModelLines.some((line) =>
      line.includes(`@@index([${idField}])`),
    );
    let isId = currentModelLines.some(
      (line) => line.includes(`@id`) && line.includes(idField),
    );
    let partOfCompound = currentModelLines.some((line) =>
      line.match(new RegExp(`@@(unique|id|index)\\(\\[.*${idField}.*\\]\\)`)),
    );

    if (!hasIndex && !isId && !partOfCompound) {
      // We need to add it before the closing brace
      let closeBraceIdx = currentModelLines.findIndex(
        (line) => line.trim() === "}",
      );
      if (closeBraceIdx !== -1) {
        currentModelLines.splice(closeBraceIdx, 0, `  @@index([${idField}])`);
        modified = true;
      }
    }
  });

  // Replace original lines
  lines.splice(modelStartIdx, currentModelLines.length, ...currentModelLines);
}

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  if (line.startsWith("model ")) {
    if (inModel) flushModel();
    inModel = true;
    currentModelName = line.split(" ")[1];
    currentModelLines = [line];
    modelStartIdx = i;
  } else if (inModel) {
    currentModelLines.push(line);
    if (line.trim() === "}") {
      flushModel();
      inModel = false;
      // Adjust i because flushModel might have added lines
      i = modelStartIdx + currentModelLines.length - 1;
    }
  }
}

if (modified) {
  fs.writeFileSync(SCHEMA_PATH, lines.join("\n"));
  console.log(
    "✅ Zero-Tolerance Schema Patched: Injected missing foreign key indexes.",
  );
} else {
  console.log("✅ All foreign keys already indexed.");
}
