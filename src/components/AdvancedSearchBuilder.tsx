import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X, Search, Loader2 } from 'lucide-react';
import { COLUMN_HEADERS } from '@/types';
import type { DrugData } from '@/types';

export interface SearchCondition {
  id: string;
  field: keyof DrugData;
  operator: 'contains' | 'equals' | 'greater_than' | 'less_than';
  value: string;
}

export interface AdvancedSearchConfig {
  includeConditions: SearchCondition[];
  includeLogic: 'AND' | 'OR';
  excludeConditions: SearchCondition[];
}

interface AdvancedSearchBuilderProps {
  config: AdvancedSearchConfig;
  onChange: (config: AdvancedSearchConfig) => void;
  onSearch: () => void;
  isSearching: boolean;
  uniqueValues: {
    dosageForms: string[];
    drugGroups: string[];
    concentrations: string[];
  };
}

const SEARCHABLE_FIELDS: Array<keyof DrugData> = [
  'drugName',
  'activeIngredient', 
  'concentration',
  'dosageForm',
  'drugGroup',
  'unitPrice',
  'manufacturer',
  'manufacturingCountry',
  'packaging',
  'investor',
  'tbmt'
];

const OPERATORS = [
  { value: 'contains', label: 'Chứa' },
  { value: 'equals', label: 'Bằng' },
  { value: 'greater_than', label: 'Lớn hơn' },
  { value: 'less_than', label: 'Nhỏ hơn' }
];

export default function AdvancedSearchBuilder({
  config,
  onChange,
  onSearch,
  isSearching,
  uniqueValues
}: AdvancedSearchBuilderProps) {
  const addCondition = (type: 'include' | 'exclude') => {
    const newCondition: SearchCondition = {
      id: Date.now().toString(),
      field: 'drugName',
      operator: 'contains',
      value: ''
    };

    if (type === 'include') {
      onChange({
        ...config,
        includeConditions: [...config.includeConditions, newCondition]
      });
    } else {
      onChange({
        ...config,
        excludeConditions: [...config.excludeConditions, newCondition]
      });
    }
  };

  const removeCondition = (type: 'include' | 'exclude', id: string) => {
    if (type === 'include') {
      onChange({
        ...config,
        includeConditions: config.includeConditions.filter(c => c.id !== id)
      });
    } else {
      onChange({
        ...config,
        excludeConditions: config.excludeConditions.filter(c => c.id !== id)
      });
    }
  };

  const updateCondition = (type: 'include' | 'exclude', id: string, updates: Partial<SearchCondition>) => {
    const conditions = type === 'include' ? config.includeConditions : config.excludeConditions;
    const updatedConditions = conditions.map(c => 
      c.id === id ? { ...c, ...updates } : c
    );

    if (type === 'include') {
      onChange({
        ...config,
        includeConditions: updatedConditions
      });
    } else {
      onChange({
        ...config,
        excludeConditions: updatedConditions
      });
    }
  };

  const clearAll = () => {
    onChange({
      includeConditions: [],
      includeLogic: 'AND',
      excludeConditions: []
    });
  };

  const renderConditionRow = (condition: SearchCondition, type: 'include' | 'exclude') => {

    return (
      <div key={condition.id} className="flex gap-2 items-center p-3 bg-secondary/20 rounded-md">
        {/* Thuộc tính */}
        <div className="flex-1 min-w-0">
          <Label className="text-xs text-muted-foreground">Thuộc tính</Label>
          <Select
            value={condition.field}
            onValueChange={(value) => updateCondition(type, condition.id, { field: value as keyof DrugData })}
          >
            <SelectTrigger className="w-full text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEARCHABLE_FIELDS.map(field => (
                <SelectItem key={field} value={field}>
                  {COLUMN_HEADERS[field]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Phép so sánh */}
        <div className="flex-1 min-w-0">
          <Label className="text-xs text-muted-foreground">Phép so sánh</Label>
          <Select
            value={condition.operator}
            onValueChange={(value) => updateCondition(type, condition.id, { operator: value as any })}
          >
            <SelectTrigger className="w-full text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERATORS.map(op => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Giá trị */}
        <div className="flex-1 min-w-0">
          <Label className="text-xs text-muted-foreground">Giá trị</Label>
          <Input
            type={condition.field === 'unitPrice' ? 'number' : 'text'}
            value={condition.value}
            onChange={(e) => updateCondition(type, condition.id, { value: e.target.value })}
            placeholder="Nhập giá trị..."
            className="w-full text-sm"
          />
        </div>

        {/* Nút xóa */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeCondition(type, condition.id)}
          className="text-destructive hover:text-destructive/80 p-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-4 border rounded-lg bg-card">
      {/* Điều kiện thỏa mãn */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary">Điều kiện thỏa mãn</h3>
          <div className="flex items-center gap-2">
            <Select
              value={config.includeLogic}
              onValueChange={(value) => onChange({ ...config, includeLogic: value as 'AND' | 'OR' })}
            >
              <SelectTrigger className="w-20 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AND">AND</SelectItem>
                <SelectItem value="OR">OR</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addCondition('include')}
              className="text-primary border-primary hover:bg-primary/10"
            >
              <Plus className="h-4 w-4 mr-1" />
              Thêm điều kiện
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {config.includeConditions.map(condition => 
            renderConditionRow(condition, 'include')
          )}
          {config.includeConditions.length === 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Chưa có điều kiện nào. Nhấn "Thêm điều kiện" để bắt đầu.
            </div>
          )}
        </div>
      </div>

      {/* Điều kiện loại trừ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-destructive">Điều kiện loại trừ</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">OR</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addCondition('exclude')}
              className="text-destructive border-destructive hover:bg-destructive/10"
            >
              <Plus className="h-4 w-4 mr-1" />
              Thêm điều kiện
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {config.excludeConditions.map(condition => 
            renderConditionRow(condition, 'exclude')
          )}
          {config.excludeConditions.length === 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Chưa có điều kiện loại trừ nào.
            </div>
          )}
        </div>
      </div>

      {/* Nút hành động */}
      <div className="flex justify-between items-center pt-4 border-t">
        <Button
          variant="ghost"
          onClick={clearAll}
          className="text-muted-foreground hover:text-destructive"
          disabled={config.includeConditions.length === 0 && config.excludeConditions.length === 0}
        >
          <X className="h-4 w-4 mr-1" />
          Xóa tất cả
        </Button>

        <Button
          onClick={onSearch}
          disabled={isSearching || (config.includeConditions.length === 0 && config.excludeConditions.length === 0)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Search className="h-4 w-4 mr-2" />
          )}
          Tìm kiếm nâng cao
        </Button>
      </div>
    </div>
  );
} 