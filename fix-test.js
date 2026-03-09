const fs = require('fs');
const file = 'e2e/auth.spec.ts';
let content = fs.readFileSync(file, 'utf8');

// remove user-menu click
content = content.replace("await page.locator('[data-testid=\"user-menu\"]').first().click({ force: true });", "// UI has direct logout button on desktop");
fs.writeFileSync(file, content);
