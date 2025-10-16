'use client';

/**
 * Reports Dashboard Page for FlowStock
 * 
 * Browse, search, and execute reports.
 * Access 50+ pre-built templates and custom reports.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ReportCategory,
  ReportConfig,
} from '@/lib/reports/report-types';
import {
  getReportTemplatesByCategory,
  getReportTemplateCount,
  getReportCategoryCounts,
  searchReportTemplates,
} from '@/lib/reports/report-templates';

// ============================================================================
// Reports Dashboard Page
// ============================================================================

export default function ReportsPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | 'all'>(
    'all'
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Get report data
  const categoryCounts = getReportCategoryCounts();
  const totalReports = getReportTemplateCount();

  // Get filtered reports
  const getFilteredReports = (): ReportConfig[] => {
    if (searchQuery.trim()) {
      return searchReportTemplates(searchQuery);
    }

    if (selectedCategory === 'all') {
      // Return all reports from all categories
      return [
        ...getReportTemplatesByCategory(ReportCategory.INVENTORY),
        ...getReportTemplatesByCategory(ReportCategory.SALES),
        ...getReportTemplatesByCategory(ReportCategory.FINANCIAL),
        ...getReportTemplatesByCategory(ReportCategory.CUSTOMERS),
        ...getReportTemplatesByCategory(ReportCategory.OPERATIONS),
      ];
    }

    return getReportTemplatesByCategory(selectedCategory);
  };

  const filteredReports = getFilteredReports();

  // Category icons
  const getCategoryIcon = (category: ReportCategory): string => {
    switch (category) {
      case ReportCategory.INVENTORY:
        return '📦';
      case ReportCategory.SALES:
        return '💰';
      case ReportCategory.FINANCIAL:
        return '📊';
      case ReportCategory.CUSTOMERS:
        return '👥';
      case ReportCategory.OPERATIONS:
        return '⚙️';
      default:
        return '📄';
    }
  };

  // Handle report execution
  const handleRunReport = (reportId: string) => {
    router.push(`/dashboard/reports/view?id=${reportId}`);
  };

  const handleCreateCustomReport = () => {
    router.push('/dashboard/reports/builder');
  };

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="mt-1 text-sm text-gray-600">
              Access {totalReports}+ pre-built reports or create your own
            </p>
          </div>

          <button
            onClick={handleCreateCustomReport}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <span>+</span>
            <span>Create Custom Report</span>
          </button>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`rounded-lg border p-4 transition-colors ${
              selectedCategory === 'all'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="text-2xl">📄</div>
            <div className="mt-2 text-sm font-medium text-gray-900">All Reports</div>
            <div className="mt-1 text-2xl font-bold text-blue-600">
              {totalReports}
            </div>
          </button>

          {Object.entries(categoryCounts).map(([category, count]) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category as ReportCategory)}
              className={`rounded-lg border p-4 transition-colors ${
                selectedCategory === category
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl">
                {getCategoryIcon(category as ReportCategory)}
              </div>
              <div className="mt-2 text-sm font-medium capitalize text-gray-900">
                {category}
              </div>
              <div className="mt-1 text-2xl font-bold text-blue-600">{count}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reports..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredReports.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <div className="text-4xl">🔍</div>
              <p className="mt-2 text-sm font-medium text-gray-900">No reports found</p>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filters
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="group rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
              >
                {/* Report Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {getCategoryIcon(report.category)}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium capitalize text-gray-600">
                        {report.category}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-gray-900">
                      {report.name}
                    </h3>
                    {report.description && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {report.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Report Details */}
                <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{report.fields.length} fields</span>
                  </div>
                  {report.filters && report.filters.length > 0 && (
                    <div className="flex items-center gap-1">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      <span>{report.filters.length} filters</span>
                    </div>
                  )}
                  {report.chartType && (
                    <div className="flex items-center gap-1">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span className="capitalize">{report.chartType}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleRunReport(report.id)}
                    className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Run Report
                  </button>
                  <button
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    title="Schedule Report"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    title="Export Report"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
