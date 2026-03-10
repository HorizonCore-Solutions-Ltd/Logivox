const fs = require("fs");
const file = "apps/web/src/components/layout/DashboardSidebar.tsx";
let content = fs.readFileSync(file, "utf8");

// Replace John Doe with session name
content = content.replace(
  '<p className="text-sm font-medium truncate">John Doe</p>',
  '<p className="text-sm font-medium truncate" data-testid="user-name">{session?.user?.name || "User"}</p>',
);

// Add Logout button next to theme toggle
const themeBtn = `              {theme === "dark" ? (\n                <Sun className="h-4 w-4" />\n              ) : (\n                <Moon className="h-4 w-4" />\n              )}\n            </Button>`;

const logoutBtn = `${themeBtn}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 ml-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              onClick={() => signOut({ callbackUrl: '/' })}
              data-testid="logout-button"
            >
              <LogOut className="h-4 w-4" />
            </Button>`;

content = content.replace(themeBtn, logoutBtn);

// Clean up the duplicate data-testid="user-menu" error we introduced earlier
content = content.replace(
  /data-testid="user-menu"\s+data-testid="user-menu"\s+data-testid="user-menu"/g,
  'data-testid="user-menu"',
);

fs.writeFileSync(file, content);
console.log("Desktop sidebar patched!");
