const fs = require('fs');
const file = 'apps/web/src/components/layout/DashboardSidebar.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}',
  'onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}\n                data-testid="user-menu"'
);

content = content.replace(
  '<p className="text-sm font-medium">John Doe</p>',
  '<p className="text-sm font-medium" data-testid="user-name">John Doe</p>'
);

content = content.replace(
  '<button className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-muted">',
  '<button data-testid="logout-button" className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-muted" onClick={() => signOut({ callbackUrl: "/" })}>'
);

fs.writeFileSync(file, content);
console.log("Patched!");
