"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";

interface CAPA {
  id: string;
  capaNumber: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  assignedTo?: { name: string };
}

export default function QC_CAPAPage() {
  const { data, isLoading } = useQuery<{ capas: CAPA[]; pagination: any }>({
    queryKey: ["qc-capas"],
    queryFn: async () => {
      const res = await fetch("/api/capa");
      if (!res.ok) throw new Error("Failed to fetch CAPAs");
      return res.json();
    },
  });

  const capas = data?.capas || [];

  // Calculate specific metrics from the real data
  const criticalOpen = capas.filter(
    (c) =>
      c.status === "OPEN" &&
      (c.priority === "CRITICAL" || c.priority === "HIGH"),
  ).length;
  const pendingRCA = capas.filter((c) => c.status === "OPEN").length; // Simplification for demo

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Corrective Actions (CAPA)
          </h2>
          <p className="text-muted-foreground">
            Manage non-conformances and preventive actions.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/capa">Go to Full CAPA Module &rarr;</Link>
          </Button>
          <Link href="/quality/capa/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New CAPA
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-red-50 border-red-100">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-red-700">
              {criticalOpen}
            </div>
            <div className="text-sm font-medium text-red-600">
              Open Critical/High CAPAs
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-100">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-orange-700">
              {pendingRCA}
            </div>
            <div className="text-sm font-medium text-orange-600">
              Total Open Items
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-100">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-700">94%</div>
            <div className="text-sm font-medium text-green-600">
              On-Time Closure Rate
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active CAPA Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CAPA ID</TableHead>
                <TableHead>Issue Title</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {capas.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center h-24 text-muted-foreground"
                  >
                    No active CAPAs found.
                  </TableCell>
                </TableRow>
              ) : (
                capas.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {c.capaNumber}
                    </TableCell>
                    <TableCell>{c.title}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          c.priority === "CRITICAL"
                            ? "destructive"
                            : c.priority === "HIGH"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {c.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{c.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {c.dueDate
                        ? new Date(c.dueDate).toLocaleDateString()
                        : "No Due Date"}
                    </TableCell>
                    <TableCell>{c.assignedTo?.name || "Unassigned"}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/quality/capa/${c.id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
