import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Settings, Eye, EyeOff } from 'lucide-react';
import { COLUMN_HEADERS, DrugData } from '@/types';

interface ColumnVisibilityManagerProps {
  visibleColumns: Set<keyof DrugData>;
  onVisibilityChange: (columns: Set<keyof DrugData>) => void;
}

// Định nghĩa các preset phổ biến
const COLUMN_PRESETS = {
  essential: {
    name: 'Thông tin cơ bản',
    columns: ['drugName', 'activeIngredient', 'concentration', 'dosageForm', 'manufacturer', 'unitPrice'] as Array<keyof DrugData>
  },
  pricing: {
    name: 'Thông tin giá',
    columns: ['drugName', 'activeIngredient', 'manufacturer', 'quantity', 'unitPrice', 'unit', 'packaging'] as Array<keyof DrugData>
  },
  detailed: {
    name: 'Chi tiết thuốc',
    columns: ['drugName', 'activeIngredient', 'concentration', 'dosageForm', 'routeOfAdministration', 'expiryDate', 'manufacturer', 'manufacturingCountry'] as Array<keyof DrugData>
  },
  procurement: {
    name: 'Thông tin đấu thầu',
    columns: ['drugName', 'investor', 'contractorSelectionMethod', 'decisionNumber', 'decisionDate', 'location', 'tbmt'] as Array<keyof DrugData>
  },
  all: {
    name: 'Tất cả cột',
    columns: Object.keys(COLUMN_HEADERS) as Array<keyof DrugData>
  }
};

// Cột luôn được hiển thị (không thể ẩn)
const ALWAYS_VISIBLE_COLUMNS: Array<keyof DrugData> = ['id', 'drugName'];

const ColumnVisibilityManager: React.FC<ColumnVisibilityManagerProps> = ({
  visibleColumns,
  onVisibilityChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleColumn = (column: keyof DrugData) => {
    // Không cho phép ẩn cột luôn hiển thị
    if (ALWAYS_VISIBLE_COLUMNS.includes(column)) return;

    const newColumns = new Set(visibleColumns);
    if (newColumns.has(column)) {
      newColumns.delete(column);
    } else {
      newColumns.add(column);
    }
    onVisibilityChange(newColumns);
  };

  const applyPreset = (preset: typeof COLUMN_PRESETS[keyof typeof COLUMN_PRESETS]) => {
    const newColumns = new Set(preset.columns);
    onVisibilityChange(newColumns);
    setIsOpen(false);
  };

  const visibleCount = visibleColumns.size;
  const totalCount = Object.keys(COLUMN_HEADERS).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Cột hiển thị
          <Badge variant="secondary" className="ml-1">
            {visibleCount}/{totalCount}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-3">Chọn nhanh</h4>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(COLUMN_PRESETS).map(([key, preset]) => (
                <Button
                  key={key}
                  variant="ghost"
                  size="sm"
                  onClick={() => applyPreset(preset)}
                  className="justify-start"
                >
                  {preset.name}
                  <Badge variant="outline" className="ml-auto">
                    {preset.columns.length}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium text-sm mb-3">Tùy chỉnh cột</h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {Object.entries(COLUMN_HEADERS).map(([key, label]) => {
                const columnKey = key as keyof DrugData;
                const isAlwaysVisible = ALWAYS_VISIBLE_COLUMNS.includes(columnKey);
                const isVisible = visibleColumns.has(columnKey);

                return (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={isVisible}
                      onCheckedChange={() => toggleColumn(columnKey)}
                      disabled={isAlwaysVisible}
                    />
                    <label
                      htmlFor={key}
                      className={`text-sm flex-1 cursor-pointer ${
                        isAlwaysVisible ? 'text-muted-foreground' : ''
                      }`}
                    >
                      {label}
                      {isAlwaysVisible && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Bắt buộc
                        </Badge>
                      )}
                    </label>
                    {isVisible ? (
                      <Eye className="h-3 w-3 text-green-600" />
                    ) : (
                      <EyeOff className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t pt-4 text-xs text-muted-foreground">
            Mẹo: Chọn ít cột hơn để xem dễ dàng hơn trên màn hình nhỏ
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ColumnVisibilityManager; 