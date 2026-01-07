'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Plus,
  RefreshCw,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

interface NCRStats {
  total: number;
  open: number;
  inInvestigation: number;
  inProgress: number;
  closed: number;
  totalClaimAmount: number;
  approvedClaimAmount: number;
  avgResolutionDays: number;
  closureRate: number;
}

interface NCR {
  id: string;
  ncrNumber: string;
  reportDate: string;
  sourceType: string;
  description: string;
  severity: string;
  status: string;
  claimAmount: number | null;
  claimStatus: string | null;
  supplier?: { name: string };
}

export default function NCRDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<NCRStats | null>(null);
  const [ncrs, setNCRs] = useState<NCR[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const organizationId = 'org_123'; // TODO: Get from auth context

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({ organizationId });
      if (statusFilter) params.append('status', statusFilter);

      const [statsRes, ncrsRes] = await Promise.all([
        fetch(`/api/qc/ncr/stats?organizationId=${organizationId}`),
        fetch(`/api/qc/ncr?${params.toString()}`),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (ncrsRes.ok) setNCRs(await ncrsRes.json());
    } catch (error) {
      console.error('Error fetching NCR data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNCRs = ncrs.filter(ncr =>
    ncr.ncrNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ncr.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSeverityBadge = (severity: string) => {
    const config: Record<string, string> = {
      CRITICAL: 'bg-red-600',
      MAJOR: 'bg-orange-500',
      MINOR: 'bg-yellow-500',
    };
    return <Badge className={`${config[severity]} text-white`}>{severity}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      OPEN: 'bg-blue-500',
      IN_INVESTIGATION: 'bg-purple-500',
      IN_PROGRESS: 'bg-yellow-500',
      CLOSED: 'bg-green-600',
      CANCELLED: 'bg-gray-500',
    };
    return <Badge className={`${config[status]} text-white`}>{status.replace(/_/g, ' ')}</Badge>;
  };

  const getClaimStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">No Claim</Badge>;
    
    const config: Record<string, string> = {
      PENDING: 'bg-gray-500',
      SUBMITTED: 'bg-blue-500',
      APPROVED: 'bg-green-600',
      REJECTED: 'bg-red-600',
      PAID: 'bg-emerald-700',
    };
    return <Badge className={`${config[status]} text-white`}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Non-Conformance Reports</h1>
          <p className="text-muted-foreground">Manage NCRs and supplier claims</p>
        </div>
        <Link href="/dashboard/qc/ncr/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create NCR
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total NCRs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.open} open, {stats.closed} closed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalClaimAmount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                ${stats.approvedClaimAmount.toLocaleString()} approved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgResolutionDays.toFixed(1)} days</div>
              <p className="text-xs text-muted-foreground">
                {stats.closureRate.toFixed(1)}% closure rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground">
                {stats.inInvestigation} under investigation
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>NCR List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search by NCR number or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_INVESTIGATION">In Investigation</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NCR Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Claim</TableHead>
                  <TableHead>Claim Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNCRs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground">
                      No NCRs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNCRs.map((ncr) => (
                    <TableRow key={ncr.id}>
                      <TableCell className="font-medium">{ncr.ncrNumber}</TableCell>
                      <TableCell>{new Date(ncr.reportDate).toLocaleDateString()}</TableCell>
                      <TableCell>{ncr.sourceType.replace(/_/g, ' ')}</TableCell>
                      <TableCell className="max-w-xs truncate">{ncr.description}</TableCell>
                      <TableCell>{ncr.supplier?.name || 'N/A'}</TableCell>
                      <TableCell>{getSeverityBadge(ncr.severity)}</TableCell>
                      <TableCell>{getStatusBadge(ncr.status)}</TableCell>
                      <TableCell>
                        {ncr.claimAmount ? `$${ncr.claimAmount.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell>{getClaimStatusBadge(ncr.claimStatus)}</TableCell>
                      <TableCell>
                        <Link href={`/dashboard/qc/ncr/${ncr.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
