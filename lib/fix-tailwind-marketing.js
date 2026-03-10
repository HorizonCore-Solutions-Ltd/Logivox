const fs = require("fs");

// We have seen that tailwind styles disappear precisely on marketing pages.
// Usually this is an issue with the content paths in tailwind.config.ts

const tailwindConfigPath = "apps/web/tailwind.config.ts";
if (fs.existsSync(tailwindConfigPath)) {
  let code = fs.readFileSync(tailwindConfigPath, "utf8");
  if (!code.includes('"src/app/(marketing)/**/*.{js,ts,jsx,tsx,mdx}"')) {
    code = code.replace(
      "content: [",
      'content: [\n    "src/app/(marketing)/**/*.{js,ts,jsx,tsx,mdx}",\n    "src/components/**/*.{js,ts,jsx,tsx,mdx}",',
    );
    fs.writeFileSync(tailwindConfigPath, code);
    console.log("Patched tailwind config");
  }
}
