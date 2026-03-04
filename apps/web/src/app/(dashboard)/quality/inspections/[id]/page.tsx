"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Save, ArrowLeft, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import Link from 'next/link';
import { toast } from "sonner";

export default function ExecuteInspectionPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  // Local state for checkpoints progress
  const [results, setResults] = useState<Record<string, any>>({});
  const [notes, setNotes] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ['inspection', id],
    queryFn: async () => {
      const res = await fetch(`/api/qc/inspections/${id}`);
      if (!res.ok) throw new Error('Failed to fetch inspection');
      return res.json();
    }
  });

  const inspection = data?.inspection;

  useEffect(() => {
    if (inspection?.checkpoints) {
      const initialResults: any = {};
      inspection.checkpoints.forEach((cp: any) => {
        initialResults[cp.id] = {
           status: cp.status,
           value: cp.actualValue
        };
      });
      setResults(initialResults);
    }
  }, [inspection]);

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
       const res = await fetch(`/api/qc/inspections/${id}`, {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload)
       });
       if (!res.ok) throw new Error("Failed to save");
       return res.json();
    },
    onSuccess: () => {
       toast.success("Progress Saved");
       queryClient.invalidateQueries({ queryKey: ['inspection', id] });
    }
  });

  const handleComplete = async (result: 'PASS' | 'FAIL') => {
      // 1. Save all checkpoint statuses
      // 2. Set Overall Inspection Result
      // 3. Set Status to COMPLETED
      
      const updates = Object.keys(results).map(cpId => ({
          where: { id: cpId },
          data: { 
              status: results[cpId].status === 'PASS' || results[cpId].status === 'FAIL' ? results[cpId].status : 'COMPLETED',
              actualValue: results[cpId].value
          }
      }));

      // Since the standard PATCH might not handle complex nested array updates easily without custom logic in route,
      // we might need to rely on the server effectively handling `checkpoints: { update: [...] }`.
      // Let's try sending the nested update.
      
      const payload = {
          status: 'COMPLETED',
          result,
          completedDate: new Date(),
          checkpoints: {
              update: updates
          }
      };

      try {
          await updateMutation.mutateAsync(payload);
          toast.success(`Inspection Completed: ${result}`);
          router.push('/quality/inspections');
      } catch (err) {
          toast.error("Failed to complete inspection");
      }
  };

  if (isLoading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!inspection) return <div className="p-6 text-red-500">Inspection not found</div>;

  const handleCheck = (cpId: string, checked: boolean) => {
      setResults(prev => ({
          ...prev,
          [cpId]: { ...prev[cpId], status: checked ? 'PASS' : 'PENDING' }
      }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
                <Link href="/quality/inspections"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    Inspection {inspection.inspectionNumber}
                    <Badge variant="outline">{inspection.status}</Badge>
                </h1>
                <p className="text-muted-foreground">
                    {inspection.category} • Qty: {inspection.quantity} • {new Date(inspection.createdAt).toLocaleDateString()}
                </p>
            </div>
         </div>
         <div className="flex gap-2">
             <Button variant="outline" onClick={() => updateMutation.mutate({})}>
                 <Save className="mr-2 h-4 w-4" /> Save Draft
             </Button>
         </div>
       </div>

       <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
             <Card>
                 <CardHeader>
                     <CardTitle>Checklist</CardTitle>
                     <CardDescription>Verify all required points.</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-4">
                     {inspection.checkpoints?.length === 0 && <div className="text-muted-foreground italic">No checkpoints defined for this inspection.</div>}
                     
                     {inspection.checkpoints?.map((cp: any) => (
                         <div key={cp.id} className="flex items-start gap-4 p-4 border rounded-md">
                             <Checkbox 
                                id={cp.id} 
                                checked={results[cp.id]?.status === 'PASS'}
                                onCheckedChange={(c) => handleCheck(cp.id, c as boolean)}
                             />
                             <div className="flex-1 space-y-1">
                                 <label htmlFor={cp.id} className="font-medium cursor-pointer leading-none">
                                     {cp.name}
                                     {cp.isRequired && <span className="text-red-500 ml-1">*</span>}
                                 </label>
                                 <p className="text-sm text-muted-foreground">{cp.description}</p>
                                 
                                 {/* Input for value if needed */}
                                 {cp.type === 'MEASUREMENT' && (
                                     <Input 
                                        className="w-32 mt-2 h-8" 
                                        placeholder="Value" 
                                        value={results[cp.id]?.value || ''}
                                        onChange={(e) => setResults(prev => ({ ...prev, [cp.id]: { ...prev[cp.id], value: e.target.value } }))}
                                     />
                                 )}
                             </div>
                             <Badge variant={results[cp.id]?.status === 'PASS' ? 'default' : 'secondary'}>
                                 {results[cp.id]?.status || 'PENDING'}
                             </Badge>
                         </div>
                     ))}
                 </CardContent>
             </Card>

             <Card>
                 <CardHeader>
                     <CardTitle>Decision</CardTitle>
                 </CardHeader>
                 <CardContent>
                     {inspection.status === 'COMPLETED' ? (
                       <div className="space-y-4">
                         <div className={`p-4 rounded-lg text-center font-bold text-xl ${inspection.result === 'PASS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                           Inspection {inspection.result}ED
                         </div>
                         {inspection.result === 'FAIL' && (
                           <Link href={`/quality/capa/new?sourceType=INSPECTION&sourceId=${inspection.id}`} className="block">
                             <Button className="w-full" variant="destructive">
                               <AlertTriangle className="mr-2 h-4 w-4" />
                               Create Corrective Action (CAPA)
                             </Button>
                           </Link>
                         )}
                       </div>
                     ) : (
                       <div className="flex gap-4">
                         <Button 
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12 text-lg"
                            onClick={() => handleComplete('PASS')}
                         >
                             <CheckCircle className="mr-2 h-5 w-5" /> Mark PASSED
                         </Button>
                         <Button 
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white h-12 text-lg"
                            onClick={() => handleComplete('FAIL')}
                         >
                             <XCircle className="mr-2 h-5 w-5" /> Mark FAILED
                         </Button>
                       </div>
                     )}
                 </CardContent>
             </Card>
          </div>

          <div className="space-y-6">
              <Card>
                  <CardHeader><CardTitle>Details</CardTitle></CardHeader>
                  <CardContent className="space-y-4 text-sm">
                      <div>
                          <span className="font-medium">Inventory ID:</span>
                          <div className="text-muted-foreground truncate">{inspection.inventoryId}</div>
                      </div>
                      <div>
                          <span className="font-medium">Reference:</span>
                          <div className="text-muted-foreground">{inspection.referenceType} {inspection.referenceId || "N/A"}</div>
                      </div>
                      <div>
                          <span className="font-medium">Template:</span>
                          <div className="text-muted-foreground">{inspection.templateId}</div>
                      </div>
                  </CardContent>
              </Card>
              
              <Card>
                  <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
                  <CardContent>
                      <Textarea 
                        placeholder="General inspection notes..." 
                        className="min-h-[150px]"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                  </CardContent>
              </Card>
          </div>
       </div>
    </div>
  );
}
