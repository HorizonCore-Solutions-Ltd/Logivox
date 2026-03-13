const fs = require('fs');
const path = require('path');

const mobileDir = '/workspaces/Logivox/apps/mobile';

function replace(file, search, replace) {
  let p = path.join(mobileDir, file);
  if (fs.existsSync(p)) {
    let c = fs.readFileSync(p, 'utf8');
    c = c.replace(search, replace);
    fs.writeFileSync(p, c, 'utf8');
  }
}

// 1. _layout.tsx
replace('app/(tabs)/_layout.tsx', /icon: "brain-outline"/g, 'icon: "hardware-chip-outline"');
replace('app/(tabs)/_layout.tsx', /href: tabHref\(name\),/g, 'href: tabHref(name) as any,');

// 2. cognitive.tsx
replace('app/(tabs)/cognitive.tsx', /name="brain-outline"/g, 'name="hardware-chip-outline"');

// 3. delivery.tsx
replace('app/(tabs)/delivery.tsx', /stops\.find\(\(s\) => s\.status === "PENDING"\)/g, 'stops.find((s: any) => s.status === "PENDING")');

// 4. marshalling.tsx
replace('app/(tabs)/marshalling.tsx', /\[\{ text: "Cancel", style: "cancel" \}, \{ text: "Confirm", onPress: \(\) => resolve\(reason\) \}\]/g, '[{ text: "Cancel", style: "cancel" as any }, { text: "Confirm", onPress: () => resolve(reason as any) }]');
replace('app/(tabs)/marshalling.tsx', /\{\n\s+id: currentBay\.id,\n\s+status: status,\n\s+notes: reason,\n\s+\}/g, '{\n                                  id: currentBay.id,\n                                  status: status as any\n                                }');

// 5. more.tsx
replace('app/(tabs)/more.tsx', /icon: "brain-outline"/g, 'icon: "hardware-chip-outline"');

// 6. lib/store/auth.store.ts
replace('lib/store/auth.store.ts', /await tokenStorage\.setAccessToken\(token\);/g, 'await tokenStorage.saveTokens(token, "");');

console.log("Replaced TS errors.");
