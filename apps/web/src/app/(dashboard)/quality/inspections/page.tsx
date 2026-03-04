"use client";

import { useQuery } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Play, Filter, Loader2 } from "lucide-react";
import Link from 'next/link';

interface QCInspection {
  id: string;
  inspectionNumber: string;
  category: string;
  status: string;
  result?: string;
  poId?: string;
  rmaId?: string;
  salesOrderId?: string;
  // schema says inspectedBy, relation to User.
  inspectedBy?: { name: string; email: string };
  template?: { name: string; code: string };
  createdAt: string;
  // Priority is not directly on QCInspection in schema, but we can display if API adds it or omit.
  // I will omit priority column if not available or just show '-'
}

export default function InspectionsPage() {
  const { data, isLoading, isError } = useQuery<{ inspections: QCInspection[] }>({
    queryKey: ['qc-inspections'],
    queryFn: async () => {
      const res = await fetch('/api/qc/inspections');
      if (!res.ok) throw new Error('Failed to fetch inspections');
      return res.json();
    }
  });

  const inspections = data?.inspections || [];

  if (isLoading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (isError) {
    return <div className="text-red-500">Failed to load inspections. Please try again.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold tracking-tight">Inspections Queue</h2>
           <p className="text-muted-foreground">Manage active and historical quality inspections.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Inspection ID</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Template / Ref</TableHead>
                <TableHead>Inspector</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No inspections found.
                  </TableCell>
                </TableRow>
              ) : (
                inspections.map((ins) => (
                <TableRow key={ins.id}>
                  <TableCell className="font-medium">
                     {ins.inspectionNumber || ins.id.substring(0, 8)}
                     <div className="text-xs text-muted-foreground">{new Date(ins.createdAt).toLocaleDateString()}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{ins.category}</Badge>
                  </TableCell>
                  <TableCell>
                     {ins.status === 'COMPLETED' ? (
                       <Badge variant={ins.result === 'PASS' ? 'default' : 'destructive'}>
                         {ins.result || 'COMPLETED'}
                       </Badge>
                     ) : (
                       <Badge variant="secondary">{ins.status}</Badge>
                     )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-xs">{ins.template?.name || "Ad-hoc"}</span>
                      <span className="text-xs text-muted-foreground">
                        {ins.poId ? `PO: ${ins.poId}` : ins.rmaId ? `RMA: ${ins.rmaId}` : ins.salesOrderId}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                     {ins.inspectedBy?.name || "Unassigned"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {ins.status !== 'COMPLETED' && (
                         <Button size="sm" variant="default" className="h-8" asChild>
                           <Link href={`/quality/inspections/${ins.id}`}>
                             <Play className="h-3 w-3 mr-1" /> Start
                           </Link>
                         </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-8" asChild>
                        <Link href={`/quality/inspections/${ins.id}`}>
                          <Eye className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
