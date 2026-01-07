"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, ArrowLeft, Save } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export default function CreateAudit() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [type, setType] = useState("");
  const [scope, setScope] = useState("");
  const [standard, setStandard] = useState("");
  const [auditDate, setAuditDate] = useState<Date>();
  const [location, setLocation] = useState("");
  const [auditorName, setAuditorName] = useState("");
  const [auditorOrg, setAuditorOrg] = useState("");
  const [auditeeName, setAuditeeName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/qc/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          scope,
          standard,
          auditDate,
          location,
          auditorName,
          auditorOrg,
          auditeeName,
          organizationId: "org-1",
          createdBy: "current-user",
        }),
      });

      if (!response.ok) throw new Error("Failed to create audit");

      const result = await response.json();
      router.push(`/dashboard/qc/audits/${result.data.id}`);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Schedule New Audit</h1>
          <p className="text-muted-foreground">
            Plan internal, supplier, or regulatory audit
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Audit Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Audit Type *</Label>
                <Select value={type} onValueChange={setType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INTERNAL">Internal Audit</SelectItem>
                    <SelectItem value="SUPPLIER">Supplier Audit</SelectItem>
                    <SelectItem value="CUSTOMER">Customer Audit</SelectItem>
                    <SelectItem value="REGULATORY">Regulatory Audit</SelectItem>
                    <SelectItem value="CERTIFICATION">
                      Certification Audit
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Standard</Label>
                <Select value={standard} onValueChange={setStandard}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select standard" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ISO_9001">ISO 9001:2015</SelectItem>
                    <SelectItem value="ISO_13485">ISO 13485</SelectItem>
                    <SelectItem value="AS9100">AS9100</SelectItem>
                    <SelectItem value="IATF_16949">IATF 16949</SelectItem>
                    <SelectItem value="FDA_21_CFR_820">
                      FDA 21 CFR Part 820
                    </SelectItem>
                    <SelectItem value="GMP">GMP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Audit Scope *</Label>
              <Textarea
                placeholder="Define what processes, departments, or areas will be audited..."
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                required
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Audit Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {auditDate ? format(auditDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Calendar
                      mode="single"
                      selected={auditDate}
                      onSelect={setAuditDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Location</Label>
                <Input
                  placeholder="e.g., Main Warehouse"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Auditor Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Auditor Name *</Label>
                  <Input
                    placeholder="Lead auditor name"
                    value={auditorName}
                    onChange={(e) => setAuditorName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label>Auditor Organization</Label>
                  <Input
                    placeholder="For external audits"
                    value={auditorOrg}
                    onChange={(e) => setAuditorOrg(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Auditee Information</h3>
              <div>
                <Label>Auditee Name</Label>
                <Input
                  placeholder="Person/department being audited"
                  value={auditeeName}
                  onChange={(e) => setAuditeeName(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              "Creating..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Schedule Audit
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
