"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  FileText,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface FMEA {
  id: string;
  fmeaNumber: string;
  title: string;
  type: string;
  status: string;
  scope: string;
  teamLead: string;
  teamMembers: string[];
  startDate: string;
  lastReviewDate?: string;
  failureModes: {
    id: string;
    rpn: number;
    status: string;
  }[];
  createdAt: string;
}

export default function FMEAList() {
  const router = useRouter();
  const [fmeas, setFmeas] = useState<FMEA[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchFMEAs();
  }, []);

  const fetchFMEAs = async () => {
    try {
      const response = await fetch("/api/qc/fmea");
      if (!response.ok) throw new Error("Failed to fetch FMEAs");
      const data = await response.json();
      setFmeas(data.data);
    } catch (error: any) {
      console.error("Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      PROCESS_FMEA: "Process",
      DESIGN_FMEA: "Design",
      SYSTEM_FMEA: "System",
    };
    return types[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        icon: any;
      }
    > = {
      IN_PROGRESS: { variant: "default", icon: Clock },
      UNDER_REVIEW: { variant: "secondary", icon: AlertTriangle },
      APPROVED: { variant: "outline", icon: CheckCircle2 },
      COMPLETED: { variant: "outline", icon: CheckCircle2 },
    };
    const config = variants[status] || { variant: "default", icon: FileText };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  const getHighestRPN = (fmea: FMEA) => {
    if (!fmea.failureModes.length) return 0;
    return Math.max(...fmea.failureModes.map((fm) => fm.rpn));
  };

  const getRPNColor = (rpn: number) => {
    if (rpn >= 200) return "text-red-600";
    if (rpn >= 125) return "text-orange-600";
    if (rpn >= 50) return "text-yellow-600";
    return "text-green-600";
  };

  const getOpenActions = (fmea: FMEA) => {
    return fmea.failureModes.filter(
      (fm) => fm.status !== "CLOSED" && fm.status !== "ACTION_COMPLETED",
    ).length;
  };

  const filteredFMEAs = fmeas.filter((fmea) => {
    const matchesType = filterType === "all" || fmea.type === filterType;
    const matchesStatus =
      filterStatus === "all" || fmea.status === filterStatus;
    const matchesSearch =
      fmea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fmea.fmeaNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const totalFailureModes = fmeas.reduce(
    (sum, fmea) => sum + fmea.failureModes.length,
    0,
  );
  const totalOpenActions = fmeas.reduce(
    (sum, fmea) => sum + getOpenActions(fmea),
    0,
  );
  const inProgress = fmeas.filter((f) => f.status === "IN_PROGRESS").length;
  const approved = fmeas.filter((f) => f.status === "APPROVED").length;

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">FMEA Management</h1>
          <p className="text-muted-foreground">
            Failure Mode and Effects Analysis
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/qc/fmea/create")}>
          <Plus className="w-4 h-4 mr-2" />
          New FMEA
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total FMEAs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{fmeas.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Failure Modes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalFailureModes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Open Actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {totalOpenActions}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Approved FMEAs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{approved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter FMEAs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Search by title or number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="PROCESS_FMEA">Process FMEA</SelectItem>
                  <SelectItem value="DESIGN_FMEA">Design FMEA</SelectItem>
                  <SelectItem value="SYSTEM_FMEA">System FMEA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FMEA List */}
      <Card>
        <CardHeader>
          <CardTitle>FMEAs ({filteredFMEAs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredFMEAs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No FMEAs found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push("/dashboard/qc/fmea/create")}
              >
                Create Your First FMEA
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFMEAs.map((fmea) => (
                <div
                  key={fmea.id}
                  className="border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => router.push(`/dashboard/qc/fmea/${fmea.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-mono text-sm font-bold">
                          {fmea.fmeaNumber}
                        </span>
                        <Badge variant="outline">
                          {getTypeLabel(fmea.type)}
                        </Badge>
                        {getStatusBadge(fmea.status)}
                      </div>

                      <h3 className="text-lg font-semibold mb-2">
                        {fmea.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {fmea.scope}
                      </p>

                      <div className="flex items-center space-x-6 text-sm">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{fmea.teamLead}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span>{fmea.failureModes.length} Failure Modes</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                          <span>{getOpenActions(fmea)} Open Actions</span>
                        </div>

                        <div>
                          <span className="text-muted-foreground">
                            Highest RPN:{" "}
                          </span>
                          <span
                            className={`font-bold ${getRPNColor(getHighestRPN(fmea))}`}
                          >
                            {getHighestRPN(fmea)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-muted-foreground">
                        Created: {new Date(fmea.createdAt).toLocaleDateString()}
                        {fmea.lastReviewDate && (
                          <span className="ml-4">
                            Last Review:{" "}
                            {new Date(fmea.lastReviewDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
