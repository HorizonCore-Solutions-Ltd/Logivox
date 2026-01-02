'use client';

/**
 * Report Builder Component for LogiVox
 * 
 * Drag-and-drop interface for building custom reports.
 * Supports field selection, filtering, sorting, grouping, and chart configuration.
 */

import React, { useState, useCallback } from 'react';
import {
  ReportConfig,
  ReportCategory,
  ReportField,
  ReportFilter,
  ReportSort,
  ReportGrouping,
  FilterOperator,
  ChartType,
  getFieldsByCategory,
  getFilterableFields,
  getSortableFields,
  getGroupableFields,
  getAggregatableFields,
  getOperatorsForFieldType,
  getOperatorLabel,
  AggregationType,
} from '@/lib/reports/report-types';
import { getReportTemplatesByCategory } from '@/lib/reports/report-templates';

// ============================================================================
// Types
// ============================================================================

interface ReportBuilderProps {
  initialConfig?: Partial<ReportConfig>;
  onSave?: (config: ReportConfig) => void;
  onCancel?: () => void;
}

interface FieldSelection {
  fieldId: string;
  field: ReportField;
  selected: boolean;
}

// ============================================================================
// Report Builder Component
// ============================================================================

export function ReportBuilder({
  initialConfig,
  onSave,
  onCancel,
}: ReportBuilderProps) {
  // State
  const [category, setCategory] = useState<ReportCategory>(
    initialConfig?.category || ReportCategory.INVENTORY
  );
  const [name, setName] = useState(initialConfig?.name || '');
  const [description, setDescription] = useState(initialConfig?.description || '');
  const [selectedFields, setSelectedFields] = useState<string[]>(
    initialConfig?.fields || []
  );
  const [filters, setFilters] = useState<ReportFilter[]>(
    initialConfig?.filters || []
  );
  const [sorts, setSorts] = useState<ReportSort[]>(initialConfig?.sorts || []);
  const [grouping, setGrouping] = useState<ReportGrouping | undefined>(
    initialConfig?.grouping
  );
  const [limit, setLimit] = useState<number | undefined>(initialConfig?.limit);
  const [chartType, setChartType] = useState<ChartType>(
    initialConfig?.chartType || ChartType.TABLE
  );

  // Get available fields for selected category
  const availableFields = getFieldsByCategory(category);
  const filterableFields = getFilterableFields(category);
  const sortableFields = getSortableFields(category);
  const groupableFields = getGroupableFields(category);

  // ========================================================================
  // Field Selection
  // ========================================================================

  const toggleField = useCallback((fieldId: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId)
        ? prev.filter((id) => id !== fieldId)
        : [...prev, fieldId]
    );
  }, []);

  const selectAllFields = useCallback(() => {
    setSelectedFields(availableFields.map((f) => f.id));
  }, [availableFields]);

  const clearFields = useCallback(() => {
    setSelectedFields([]);
  }, []);

  // ========================================================================
  // Filter Management
  // ========================================================================

  const addFilter = useCallback(() => {
    if (filterableFields.length === 0) return;

    const field = filterableFields[0];
    if (!field) return;
    
    const operators = getOperatorsForFieldType(field.type);
    if (!operators || operators.length === 0) return;
    
    const operator = operators[0];
    if (!operator) return;

    setFilters((prev) => [
      ...prev,
      {
        field: field.id,
        operator: operator,
        value: '',
      },
    ]);
  }, [filterableFields]);

  const updateFilter = useCallback(
    (index: number, updates: Partial<ReportFilter>) => {
      setFilters((prev) =>
        prev.map((filter, i) => (i === index ? { ...filter, ...updates } : filter))
      );
    },
    []
  );

  const removeFilter = useCallback((index: number) => {
    setFilters((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ========================================================================
  // Sort Management
  // ========================================================================

  const addSort = useCallback(() => {
    if (sortableFields.length === 0) return;
    const field = sortableFields[0];
    if (!field) return;

    setSorts((prev) => [
      ...prev,
      {
        field: field.id,
        direction: 'asc',
      },
    ]);
  }, [sortableFields]);

  const updateSort = useCallback(
    (index: number, updates: Partial<ReportSort>) => {
      setSorts((prev) =>
        prev.map((sort, i) => (i === index ? { ...sort, ...updates } : sort))
      );
    },
    []
  );

  const removeSort = useCallback((index: number) => {
    setSorts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ========================================================================
  // Grouping Management
  // ========================================================================

  const toggleGrouping = useCallback(() => {
    if (grouping) {
      setGrouping(undefined);
    } else if (groupableFields.length > 0) {
      const field = groupableFields[0];
      if (!field) return;
      
      setGrouping({
        field: field.id,
        aggregations: [],
      });
    }
  }, [grouping, groupableFields]);

  const updateGroupingField = useCallback((fieldId: string) => {
    setGrouping((prev) =>
      prev ? { ...prev, field: fieldId } : { field: fieldId, aggregations: [] }
    );
  }, []);

  const addAggregation = useCallback(() => {
    const aggregatableFields = getAggregatableFields(category);
    if (aggregatableFields.length === 0) return;
    const field = aggregatableFields[0];
    if (!field) return;

    setGrouping((prev) =>
      prev
        ? {
            ...prev,
            aggregations: [
              ...prev.aggregations,
              {
                field: field.id,
                type: AggregationType.SUM,
              },
            ],
          }
        : undefined
    );
  }, [category]);

  const removeAggregation = useCallback((index: number) => {
    setGrouping((prev) =>
      prev
        ? {
            ...prev,
            aggregations: prev.aggregations.filter((_, i) => i !== index),
          }
        : undefined
    );
  }, []);

  // ========================================================================
  // Template Loading
  // ========================================================================

  const loadTemplate = useCallback((templateId: string) => {
    const templates = getReportTemplatesByCategory(category);
    const template = templates.find((t) => t.id === templateId);

    if (template) {
      setName(template.name);
      setDescription(template.description || '');
      setSelectedFields(template.fields);
      setFilters(template.filters || []);
      setSorts(template.sorts || []);
      setGrouping(template.grouping);
      setLimit(template.limit);
      setChartType(template.chartType || ChartType.TABLE);
    }
  }, [category]);

  // ========================================================================
  // Save & Validation
  // ========================================================================

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      alert('Please enter a report name');
      return;
    }

    if (selectedFields.length === 0) {
      alert('Please select at least one field');
      return;
    }

    const config: ReportConfig = {
      id: initialConfig?.id || `custom-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      category,
      fields: selectedFields,
      filters: filters,
      sorts: sorts,
      grouping,
      limit,
      chartType,
    };

    onSave?.(config);
  }, [
    name,
    description,
    category,
    selectedFields,
    filters,
    sorts,
    grouping,
    limit,
    chartType,
    initialConfig,
    onSave,
  ]);

  // ========================================================================
  // Render
  // ========================================================================

  const templates = getReportTemplatesByCategory(category);

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Builder</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create custom reports with drag-and-drop field selection
          </p>
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Save Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Panel - Configuration */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Info */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Report Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  placeholder="e.g., Monthly Sales Report"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  placeholder="Describe what this report shows..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value as ReportCategory);
                    setSelectedFields([]);
                    setFilters([]);
                    setSorts([]);
                    setGrouping(undefined);
                  }}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value={ReportCategory.INVENTORY}>Inventory</option>
                  <option value={ReportCategory.SALES}>Sales</option>
                  <option value={ReportCategory.FINANCIAL}>Financial</option>
                  <option value={ReportCategory.CUSTOMERS}>Customers</option>
                  <option value={ReportCategory.OPERATIONS}>Operations</option>
                </select>
              </div>
            </div>
          </div>

          {/* Field Selection */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Fields ({selectedFields.length} selected)
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={selectAllFields}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Select All
                </button>
                <button
                  onClick={clearFields}
                  className="text-sm text-gray-600 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {availableFields.map((field) => (
                <label
                  key={field.id}
                  className="flex items-center gap-2 rounded-md border border-gray-200 p-3 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedFields.includes(field.id)}
                    onChange={() => toggleField(field.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {field.name}
                    </div>
                    {field.description && (
                      <div className="text-xs text-gray-500">{field.description}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              <button
                onClick={addFilter}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Add Filter
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {filters.length === 0 ? (
                <p className="text-sm text-gray-500">No filters added</p>
              ) : (
                filters.map((filter, index) => {
                  const field = filterableFields.find((f) => f.id === filter.field);
                  const operators = field
                    ? getOperatorsForFieldType(field.type)
                    : [];

                  return (
                    <div key={index} className="flex gap-2">
                      <select
                        value={filter.field}
                        onChange={(e) =>
                          updateFilter(index, { field: e.target.value })
                        }
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                      >
                        {filterableFields.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>

                      <select
                        value={filter.operator}
                        onChange={(e) =>
                          updateFilter(index, {
                            operator: e.target.value as FilterOperator,
                          })
                        }
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                      >
                        {operators.map((op) => (
                          <option key={op} value={op}>
                            {getOperatorLabel(op)}
                          </option>
                        ))}
                      </select>

                      {filter.operator !== FilterOperator.IS_NULL &&
                        filter.operator !== FilterOperator.IS_NOT_NULL && (
                          <input
                            type="text"
                            value={filter.value || ''}
                            onChange={(e) =>
                              updateFilter(index, { value: e.target.value })
                            }
                            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                            placeholder="Value..."
                          />
                        )}

                      <button
                        onClick={() => removeFilter(index)}
                        className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sorting */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Sorting</h2>
              <button
                onClick={addSort}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Add Sort
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {sorts.length === 0 ? (
                <p className="text-sm text-gray-500">No sorting added</p>
              ) : (
                sorts.map((sort, index) => (
                  <div key={index} className="flex gap-2">
                    <select
                      value={sort.field}
                      onChange={(e) => updateSort(index, { field: e.target.value })}
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      {sortableFields.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={sort.direction}
                      onChange={(e) =>
                        updateSort(index, {
                          direction: e.target.value as 'asc' | 'desc',
                        })
                      }
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>

                    <button
                      onClick={() => removeSort(index)}
                      className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Advanced Options */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Advanced Options</h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!grouping}
                    onChange={toggleGrouping}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Enable Grouping
                  </span>
                </label>

                {grouping && (
                  <div className="mt-3 space-y-3 rounded-md border border-gray-200 p-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Group By
                      </label>
                      <select
                        value={grouping.field}
                        onChange={(e) => updateGroupingField(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      >
                        {groupableFields.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">
                          Aggregations
                        </label>
                        <button
                          onClick={addAggregation}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          + Add
                        </button>
                      </div>
                      {grouping.aggregations.length === 0 ? (
                        <p className="mt-1 text-xs text-gray-500">
                          No aggregations added
                        </p>
                      ) : (
                        <div className="mt-2 space-y-2">
                          {grouping.aggregations.map((agg, index) => (
                            <div key={index} className="flex gap-2">
                              <select
                                value={agg.field}
                                className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-xs"
                              >
                                {getAggregatableFields(category).map((f) => (
                                  <option key={f.id} value={f.id}>
                                    {f.name}
                                  </option>
                                ))}
                              </select>
                              <select
                                value={agg.type}
                                className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                              >
                                <option value={AggregationType.SUM}>Sum</option>
                                <option value={AggregationType.AVG}>Average</option>
                                <option value={AggregationType.COUNT}>Count</option>
                                <option value={AggregationType.MIN}>Min</option>
                                <option value={AggregationType.MAX}>Max</option>
                              </select>
                              <button
                                onClick={() => removeAggregation(index)}
                                className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-600"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Limit Results
                </label>
                <input
                  type="number"
                  value={limit || ''}
                  onChange={(e) =>
                    setLimit(e.target.value ? parseInt(e.target.value) : undefined)
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="No limit"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Chart Type
                </label>
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value as ChartType)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value={ChartType.TABLE}>Table</option>
                  <option value={ChartType.BAR}>Bar Chart</option>
                  <option value={ChartType.LINE}>Line Chart</option>
                  <option value={ChartType.PIE}>Pie Chart</option>
                  <option value={ChartType.AREA}>Area Chart</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Templates & Preview */}
        <div className="space-y-6">
          {/* Templates */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Templates</h2>
            <p className="mt-1 text-sm text-gray-600">
              Start with a pre-built template
            </p>

            <div className="mt-4 space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => loadTemplate(template.id)}
                  className="w-full rounded-md border border-gray-200 p-3 text-left hover:bg-gray-50"
                >
                  <div className="text-sm font-medium text-gray-900">
                    {template.name}
                  </div>
                  {template.description && (
                    <div className="mt-1 text-xs text-gray-500">
                      {template.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Preview</h2>

            <div className="mt-4 space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Category:</span>{' '}
                <span className="text-gray-900">{category}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Fields:</span>{' '}
                <span className="text-gray-900">{selectedFields.length}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Filters:</span>{' '}
                <span className="text-gray-900">{filters.length}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Sorts:</span>{' '}
                <span className="text-gray-900">{sorts.length}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Grouping:</span>{' '}
                <span className="text-gray-900">{grouping ? 'Yes' : 'No'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Chart:</span>{' '}
                <span className="text-gray-900">{chartType}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
