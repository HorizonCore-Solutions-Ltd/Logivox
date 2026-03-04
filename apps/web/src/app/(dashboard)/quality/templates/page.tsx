"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Plus, Edit, Trash, Copy, Loader2 } from "lucide-react";

interface InspectionTemplate {
  id: string;
  name: string;
  code: string;
  category: string;
  isActive: boolean;
  checkpoints: any[];
}

export default function QC_TemplatesPage() {
  const { data: templates = [], isLoading, isError } = useQuery<InspectionTemplate[]>({
    queryKey: ['qc-templates'],
    queryFn: async () => {
      const res = await fetch('/api/qc/templates');
      if (!res.ok) throw new Error('Failed to fetch templates');
      return res.json();
    }
  });

  if (isLoading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
       <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold tracking-tight">Inspection Templates</h2>
           <p className="text-muted-foreground">Define and manage QC rules and workflows.</p>
        </div>
        <Link href="/quality/templates/new">
          <Button>
             <Plus className="mr-2 h-4 w-4" /> Create Template
          </Button>
        </Link>
      </div>

       <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Checkpoints</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No templates found.
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((tmp) => (
                <TableRow key={tmp.id}>
                  <TableCell className="font-medium">{tmp.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{tmp.code}</TableCell>
                  <TableCell><Badge variant="outline">{tmp.category}</Badge></TableCell>
                  <TableCell>{tmp.checkpoints?.length || 0} Steps</TableCell>
                  <TableCell>
                    <Badge variant={tmp.isActive ? "default" : "secondary"}>
                      {tmp.isActive ? "Active" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                       <Button size="icon" variant="ghost"><Edit className="h-4 w-4 text-muted-foreground" /></Button>
                       <Button size="icon" variant="ghost"><Copy className="h-4 w-4 text-muted-foreground" /></Button>
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
