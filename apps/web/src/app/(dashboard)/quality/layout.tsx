"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ClipboardCheck,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Activity,
  Users,
  Search,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function QualityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Determine active tab based on path
  const activeTab = pathname.split("/").pop() || "overview";
  const isRoot = pathname === "/quality";
  const currentTab = isRoot ? "overview" : activeTab;

  return (
    <div className="flex flex-col space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Quality Control & CAPA Logic
          </h1>
          <p className="text-muted-foreground">
            Orchestrate inspections, manage non-conformance, and drive
            continuous improvement.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Search className="mr-2 h-4 w-4" /> Find Record
          </Button>
          <Button asChild>
            <Link href="/quality/inspections/new">
              <Plus className="mr-2 h-4 w-4" /> New Inspection
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={currentTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" asChild>
            <Link href="/quality">Overview</Link>
          </TabsTrigger>
          <TabsTrigger value="inspections" asChild>
            <Link href="/quality/inspections">Inspections</Link>
          </TabsTrigger>
          <TabsTrigger value="templates" asChild>
            <Link href="/quality/templates">Templates & Rules</Link>
          </TabsTrigger>
          <TabsTrigger value="capa" asChild>
            <Link href="/quality/capa">CAPA & NCR</Link>
          </TabsTrigger>
          <TabsTrigger value="suppliers" asChild>
            <Link href="/quality/suppliers">Supplier Quality</Link>
          </TabsTrigger>
        </TabsList>

        {/* Render the page content below the tabs */}
        <div className="mt-6">{children}</div>
      </Tabs>
    </div>
  );
}
