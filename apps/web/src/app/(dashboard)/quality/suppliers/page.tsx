"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

interface SupplierQuality {
  id: string;
  name: string;
  code: string;
  risk: string;
  score: number;
  defectRate: string;
  lastAudit: string;
}

export default function QC_SuppliersPage() {
  const { data: suppliers, isLoading } = useQuery<SupplierQuality[]>({
    queryKey: ['qc-suppliers'],
    queryFn: async () => {
      const res = await fetch('/api/qc/suppliers');
      if (!res.ok) throw new Error('Failed to fetch supplier quality specific data');
      return res.json();
    }
  });

  if (isLoading) {
      return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }
  
  const highRiskSuppliers = suppliers?.filter(s => s.risk === 'HIGH') || [];

  return (
    <div className="space-y-4">
       <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold tracking-tight">Supplier Quality Assurance</h2>
           <p className="text-muted-foreground">Monitor vendor performance and defect rates.</p>
        </div>
      </div>

       <div className="grid gap-4 md:grid-cols-2">
         {highRiskSuppliers.length > 0 ? (
           highRiskSuppliers.map(s => (
             <Card key={s.id} className="border-red-200 bg-red-50/50">
               <CardHeader className="pb-2">
                 <div className="flex justify-between">
                    <CardTitle className="text-lg">{s.name}</CardTitle>
                    <Badge variant="destructive">High Risk</Badge>
                 </div>
                 <CardDescription>Consistently failing inbound inspections</CardDescription>
               </CardHeader>
               <CardContent>
                   <div className="space-y-2">
                       <div className="flex justify-between text-sm">
                          <span>Quality Score</span>
                          <span className="font-bold">{s.score}/100</span>
                       </div>
                       <Progress value={s.score} className="h-2 bg-red-200" indicatorClassName="bg-red-600" />
                   </div>
               </CardContent>
             </Card>
           ))
         ) : (
           <Card className="col-span-2 bg-green-50 border-green-100">
              <CardContent className="p-6 text-green-800 text-center">
                 No high-risk suppliers identified at this moment. Good job!
              </CardContent>
           </Card>
         )}
       </div>

       <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier Name</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Quality Score</TableHead>
                <TableHead>Defect Rate</TableHead>
                <TableHead>Last Audit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers?.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No suppliers found.</TableCell>
                 </TableRow>
              ) : (
                suppliers?.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>
                    <Badge variant={s.risk === 'HIGH' ? 'destructive' : s.risk === 'MEDIUM' ? 'secondary' : 'outline'}>
                      {s.risk}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="w-8">{s.score}</span>
                      <Progress value={s.score} className="w-24 h-2" />
                    </div>
                  </TableCell>
                  <TableCell>{s.defectRate}</TableCell>
                  <TableCell>{s.lastAudit}</TableCell>
                </TableRow>
              )))}
            </TableBody>
          </Table>
        </CardContent>
       </Card>
    </div>
  );
}
