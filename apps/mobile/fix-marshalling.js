const fs = require('fs');
const path = require('path');
const file = '/workspaces/Logivox/apps/mobile/app/(tabs)/marshalling.tsx';
let c = fs.readFileSync(file, 'utf8');

// Fix notes
c = c.replace(/notes: reason as any,/g, '');

// Fix cancel style in the concat array
c = c.replace(/style: "cancel" as any,/g, '/* style */');

fs.writeFileSync(file, c, 'utf8');
console.log("Fixed");
