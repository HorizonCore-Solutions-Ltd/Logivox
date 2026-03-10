const fs = require('fs');
const lines = fs.readFileSync('prisma/schema.prisma', 'utf8').split('\n');

let inModel = false;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.startsWith('model ') || line.startsWith('enum ') || line.startsWith('generator ') || line.startsWith('datasource ')) {
    inModel = true;
  }
  if (line === '}') {
    inModel = false;
  }
  
  if (!inModel && line.length > 0 && !line.startsWith('//') && line !== '}') {
    // Check if this looks like a valid variable declaration outside a block
    if (/^[a-zA-Z_]+\s+[a-zA-Z_]+/.test(line)) {
        console.log(`Line ${i + 1}: ${line}`);
        // skip printing consecutive errors
        inModel = true; // pretend we are inside just to suppress
    }
  }
}
