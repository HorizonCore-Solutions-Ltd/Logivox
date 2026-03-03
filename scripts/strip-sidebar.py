#!/usr/bin/env python3
"""Strip DashboardSidebar wrapper from individual pages now that it's in layout.tsx"""
import re
import subprocess
import sys

result = subprocess.run(
    ["grep", "-rl", "DashboardSidebar",
     "/workspaces/Flowstock/apps/web/src/app"],
    capture_output=True, text=True
)

files = [f.strip() for f in result.stdout.strip().split("\n") if f.strip()]
# Exclude layout.tsx itself
files = [f for f in files if not f.endswith("layout.tsx")]

print(f"Processing {len(files)} files...")

for fpath in sorted(files):
    with open(fpath, "r") as f:
        original = f.read()

    content = original

    # 1. Remove import line(s) for DashboardSidebar
    content = re.sub(
        r'import\s+\{[^}]*DashboardSidebar[^}]*\}\s+from\s+["\']@/components/layout/DashboardSidebar["\'];\s*\n',
        "",
        content
    )

    # 2. Replace <DashboardSidebar> with <> (React fragment open)
    content = content.replace("<DashboardSidebar>", "<>")

    # 3. Replace </DashboardSidebar> with </> (React fragment close)
    content = content.replace("</DashboardSidebar>", "</>")

    if content != original:
        with open(fpath, "w") as f:
            f.write(content)
        print(f"  ✓  {fpath.replace('/workspaces/Flowstock/apps/web/src/', '')}")
    else:
        print(f"  ~  {fpath.replace('/workspaces/Flowstock/apps/web/src/', '')} (no change)")

print(f"\nDone — processed {len(files)} files.")
