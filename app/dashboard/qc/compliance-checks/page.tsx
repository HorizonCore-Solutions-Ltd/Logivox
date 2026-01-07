'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ShieldCheck,
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  TrendingUp,
  Award,
} from 'lucide-react';
import Link from 'next/link';

interface ComplianceCheck {
  id: string;
  checkNumber: string;
  vendor: { id: string; name: string };
  checkType: string;
  standardReference: string;
  scheduledDate: string;
  completedDate: string | null;
  status: string;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  complianceRate: number;
  criticalViolations: number;
  minorViolations: number;
}

export default function ComplianceChecksPage() {
  const [loading, setLoading] = useState(true);
  const [checks, setChecks] = useState<ComplianceCheck[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const organizationId = 'org_123';

  useEffect(() => {
    fetchChecks();
    fetchStats();
  }, [filterStatus]);

  const fetchChecks = async () => {
    try {
      setLoading(true);
      // Mock data - Replace with actual API call
      const mockChecks: ComplianceCheck[] = [
        {
          id: '1',
          checkNumber: 'CC-202601-0001',
          vendor: { id: 'v1', name: 'Acme Suppliers Inc.' },
          checkType: 'ISO_9001',
          standardReference: 'ISO 9001:2015 Quality Management',
          scheduledDate: '2026-01-10',
          completedDate: null,
          status: 'SCHEDULED',
          totalChecks: 45,
          passedChecks: 0,
          failedChecks: 0,
          complianceRate: 0,
          criticalViolations: 0,
          minorViolations: 0,
        },
        {
          id: '2',
          checkNumber: 'CC-202601-0002',
          vendor: { id: 'v2', name: 'Global Trade Co.' },
          checkType: 'FDA_COMPLIANCE',
          standardReference: 'FDA 21 CFR Part 820',
          scheduledDate: '2026-01-05',
          completedDate: null,
          status: 'IN_PROGRESS',
          totalChecks: 62,
          passedChecks: 48,
          failedChecks: 3,
          complianceRate: 77,
          criticalViolations: 1,
          minorViolations: 2,
        },
        {
          id: '3',
          checkNumber: 'CC-202512-0048',
          vendor: { id: 'v3', name: 'Best Products Ltd.' },
          checkType: 'ISO_14001',
          standardReference: 'ISO 14001:2015 Environmental Management',
          scheduledDate: '2025-12-20',
          completedDate: '2025-12-28',
          status: 'PASSED',
          totalChecks: 38,
          passedChecks: 37,
          failedChecks: 1,
          complianceRate: 97,
          criticalViolations: 0,
          minorViolations: 1,
        },
        {
          id: '4',
          checkNumber: 'CC-202512-0045',
          vendor: { id: 'v4', name: 'Quality Imports LLC' },
          checkType: 'GMP',
          standardReference: 'Good Manufacturing Practices',
          scheduledDate: '2025-12-15',
          completedDate: '2025-12-22',
          status: 'FAILED',
          totalChecks: 54,
          passedChecks: 42,
          failedChecks: 12,
          complianceRate: 78,
          criticalViolations: 3,
          minorViolations: 9,
        },
        {
          id: '5',
          checkNumber: 'CC-202512-0042',
          vendor: { id: 'v5', name: 'Premium Goods Corp.' },
          checkType: 'CUSTOM',
          standardReference: 'Internal Quality Standards v3.2',
          scheduledDate: '2025-12-10',
          completedDate: '2025-12-18',
          status: 'PASSED',
          totalChecks: 28,
          passedChecks: 28,
          failedChecks: 0,
          complianceRate: 100,
          criticalViolations: 0,
          minorViolations: 0,
        },
      ];

      setChecks(mockChecks);
    } catch (error) {
      console.error('Error fetching compliance checks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Mock stats - Replace with actual API call
      setStats({
        totalChecks: 238,
        avgComplianceRate: 87.4,
        passedChecks: 186,
        failedChecks: 32,
        scheduled: 20,
        criticalViolations: 48,
        minorViolations: 142,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: any; text: string }> = {
      SCHEDULED: { color: 'bg-gray-500', icon: Clock, text: 'Scheduled' },
      IN_PROGRESS: { color: 'bg-blue-500', icon: Clock, text: 'In Progress' },
      PASSED: { color: 'bg-green-500', icon: CheckCircle, text: 'Passed' },
      FAILED: { color: 'bg-red-500', icon: XCircle, text: 'Failed' },
      CONDITIONAL_PASS: { color: 'bg-yellow-500', icon: AlertTriangle, text: 'Conditional Pass' },
    };

    const { color, icon: Icon, text } = config[status] || config.SCHEDULED;
    return (
      <Badge className={`${color} text-white flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {text}
      </Badge>
    );
  };

  const getCheckTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ISO_9001: 'ISO 9001',
      ISO_14001: 'ISO 14001',
      ISO_45001: 'ISO 45001',
      FDA_COMPLIANCE: 'FDA Compliance',
      GMP: 'Good Manufacturing Practices',
      HACCP: 'HACCP',
      FSSC_22000: 'FSSC 22000',
      CUSTOM: 'Custom Standards',
    };
    return labels[type] || type;
  };

  const getComplianceColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 85) return 'text-blue-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredChecks = checks.filter(check => {
    const matchesStatus = filterStatus === 'ALL' || check.status === filterStatus;
    const matchesSearch = check.checkNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         check.vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         check.checkType.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-cyan-600" />
            Vendor Compliance Checks
          </h1>
          <p className="text-muted-foreground">
            Standards audits and compliance verification tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchChecks} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Link href="/dashboard/qc/compliance-checks/create">
            <Button>
              <FileText className="w-4 h-4 mr-2" />
              Schedule Check
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Compliance</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgComplianceRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalChecks} checks completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Passed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.passedChecks}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((stats.passedChecks / stats.totalChecks) * 100)}% pass rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Violations</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.criticalViolations}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Immediate action required
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.scheduled}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Upcoming audits
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search by check #, vendor, or standard..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <div className="flex gap-2">
          {['ALL', 'SCHEDULED', 'IN_PROGRESS', 'PASSED', 'FAILED', 'CONDITIONAL_PASS'].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(status)}
            >
              {status.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Compliance Checks List */}
      <div className="space-y-4">
        {filteredChecks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShieldCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No compliance checks found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterStatus !== 'ALL'
                  ? 'Try adjusting your filters'
                  : 'Schedule your first compliance check to audit vendor standards'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredChecks.map((check) => (
            <Card key={check.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{check.checkNumber}</h3>
                      {getStatusBadge(check.status)}
                      <Badge variant="outline">
                        {getCheckTypeLabel(check.checkType)}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-1">
                      <strong>Vendor:</strong> {check.vendor.name}
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">
                      <strong>Standard:</strong> {check.standardReference}
                    </p>

                    {/* Compliance Progress Bar */}
                    {check.status !== 'SCHEDULED' && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Compliance Rate</span>
                          <span className={`text-lg font-bold ${getComplianceColor(check.complianceRate)}`}>
                            {check.complianceRate}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full ${
                              check.complianceRate >= 95 ? 'bg-green-600' :
                              check.complianceRate >= 85 ? 'bg-blue-600' :
                              check.complianceRate >= 75 ? 'bg-yellow-600' : 'bg-red-600'
                            }`}
                            style={{ width: `${check.complianceRate}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Checks</p>
                        <p className="font-medium text-lg">{check.totalChecks}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Passed</p>
                        <p className="font-medium text-green-600">{check.passedChecks}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Failed</p>
                        <p className="font-medium text-red-600">{check.failedChecks}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">
                          {check.completedDate ? 'Completed' : 'Scheduled'}
                        </p>
                        <p className="font-medium">
                          {new Date(check.completedDate || check.scheduledDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Violations */}
                    {(check.criticalViolations > 0 || check.minorViolations > 0) && (
                      <div className="mt-3 flex gap-3">
                        {check.criticalViolations > 0 && (
                          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded px-3 py-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="text-sm">
                              <strong className="text-red-900">{check.criticalViolations}</strong>
                              <span className="text-red-700"> Critical</span>
                            </span>
                          </div>
                        )}
                        {check.minorViolations > 0 && (
                          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm">
                              <strong className="text-yellow-900">{check.minorViolations}</strong>
                              <span className="text-yellow-700"> Minor</span>
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {check.complianceRate === 100 && check.status === 'PASSED' && (
                      <div className="mt-3 flex items-center gap-2 text-green-600">
                        <Award className="w-5 h-5 fill-green-600" />
                        <span className="text-sm font-semibold">100% Compliance - Excellent!</span>
                      </div>
                    )}
                  </div>
                  <Link href={`/dashboard/qc/compliance-checks/${check.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Info Card */}
      <Card className="bg-cyan-50 border-cyan-200">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <ShieldCheck className="w-8 h-8 text-cyan-600" />
            </div>
            <div>
              <h3 className="font-semibold text-cyan-900 mb-2">About Compliance Checks</h3>
              <p className="text-sm text-cyan-800 mb-3">
                Compliance checks are systematic audits to verify that vendors meet required standards and regulations.
                These can include ISO certifications, FDA requirements, Good Manufacturing Practices (GMP), HACCP,
                or custom internal quality standards. Regular compliance auditing helps maintain quality consistency
                and reduces risk.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="bg-white/50 p-2 rounded">
                  <strong>Checklist-Based:</strong> Systematic verification
                </div>
                <div className="bg-white/50 p-2 rounded">
                  <strong>Violation Tracking:</strong> Critical vs minor
                </div>
                <div className="bg-white/50 p-2 rounded">
                  <strong>Corrective Actions:</strong> Required for failures
                </div>
                <div className="bg-white/50 p-2 rounded">
                  <strong>Trend Analysis:</strong> Monitor improvements
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
