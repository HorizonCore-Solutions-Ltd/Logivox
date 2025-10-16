'use client';

/**
 * Report Builder Page for FlowStock
 * 
 * Create custom reports with drag-and-drop interface.
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { ReportBuilder } from '@/components/reports/report-builder';
import { ReportConfig } from '@/lib/reports/report-types';

export default function ReportBuilderPage() {
  const router = useRouter();

  const handleSave = (config: ReportConfig) => {
    // In production, save to database
    console.log('Saving report:', config);
    
    // Navigate to view the report
    router.push(`/dashboard/reports/view?id=${config.id}`);
  };

  const handleCancel = () => {
    router.push('/dashboard/reports');
  };

  return (
    <ReportBuilder
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}
