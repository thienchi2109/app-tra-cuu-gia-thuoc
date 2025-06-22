"use client";

import type { DrugData, SortConfig } from "@/types";
import { COLUMN_HEADERS } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Pin, PinOff } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { cn, formatDateToVietnamese, formatNumberWithThousandSeparator } from "@/lib/utils";
import ColumnVisibilityManager from "./ColumnVisibilityManager";

interface DrugDataTableProps {
  data: DrugData[];
  sortConfig: SortConfig;
  handleSort: (key: keyof DrugData) => void;
  // Selection props
  selectionMode?: 'view' | 'select';
  selectedIds?: Set<number>;
  onRowSelect?: (id: number) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  isCurrentPageFullySelected?: boolean;
  isCurrentPagePartiallySelected?: boolean;
}

// Columns that can have their content wrapped
const WRAPPABLE_COLUMNS: Array<keyof DrugData> = [
  "drugName",
  "activeIngredient",
  "concentration",
  "gdklh",
  "dosageForm",
  "manufacturer",
  "manufacturingCountry",
  "packaging",
  "investor",
  "tbmt",
];

// Default visible columns - thông tin cơ bản
const DEFAULT_VISIBLE_COLUMNS = new Set<keyof DrugData>([
  'id', 'drugName', 'activeIngredient', 'concentration', 'dosageForm', 'manufacturer', 'unitPrice'
]);

// Cột quan trọng có thể được pin
const PINNABLE_COLUMNS: Array<keyof DrugData> = ['id', 'drugName', 'activeIngredient', 'manufacturer'];

// Cột chứa ngày tháng cần format
const DATE_COLUMNS: Array<keyof DrugData> = ['kqlcntUploadDate', 'decisionDate', 'expiryDate'];

const DrugDataTable: React.FC<DrugDataTableProps> = ({
  data,
  sortConfig,
  handleSort,
  selectionMode = 'view',
  selectedIds = new Set(),
  onRowSelect,
  onSelectAll,
  onDeselectAll,
  isCurrentPageFullySelected = false,
  isCurrentPagePartiallySelected = false,
}) => {
  const [visibleColumns, setVisibleColumns] = useState<Set<keyof DrugData>>(DEFAULT_VISIBLE_COLUMNS);
  const [pinnedColumns, setPinnedColumns] = useState<Set<keyof DrugData>>(new Set(['id', 'drugName']));
  const [showScrollHint, setShowScrollHint] = useState(true);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Chia cột thành pinned và unpinned
  const visibleColumnArray = Array.from(visibleColumns);
  const pinnedColumnArray = visibleColumnArray.filter(col => pinnedColumns.has(col));
  const unpinnedColumnArray = visibleColumnArray.filter(col => !pinnedColumns.has(col));

  const togglePinColumn = (column: keyof DrugData) => {
    if (!PINNABLE_COLUMNS.includes(column)) return;
    
    const newPinned = new Set(pinnedColumns);
    if (newPinned.has(column)) {
      newPinned.delete(column);
    } else {
      newPinned.add(column);
    }
    setPinnedColumns(newPinned);
  };

  // Kiểm tra xem có cần cuộn ngang không
  useEffect(() => {
    const container = tableContainerRef.current;
    if (container) {
      const hasHorizontalScroll = container.scrollWidth > container.clientWidth;
      setShowScrollHint(hasHorizontalScroll);
    }
  }, [visibleColumns, data]);

  const handleScroll = () => {
    setShowScrollHint(false);
  };

  // Selection checkbox header
  const renderSelectionHeader = () => (
    <TableHead className="w-12 px-2 py-3 sticky left-0 z-20 bg-primary/10 border-r-2 border-primary/30">
      <Checkbox
        checked={isCurrentPageFullySelected}
        onCheckedChange={(checked) => {
          if (checked) {
            onSelectAll?.();
          } else {
            onDeselectAll?.();
          }
        }}
        aria-label="Chọn tất cả dòng hiện tại"
        className={isCurrentPagePartiallySelected ? "data-[state=checked]:bg-primary/50" : ""}
      />
    </TableHead>
  );

  const renderTableHead = (key: keyof DrugData, isPinned: boolean = false) => {
    const leftOffset = selectionMode === 'select' 
      ? (isPinned ? pinnedColumnArray.indexOf(key) * 120 + 48 : 0) // +48px for checkbox column
      : (isPinned ? pinnedColumnArray.indexOf(key) * 120 : 0);

    return (
      <TableHead 
        key={`${key}-${isPinned ? 'pinned' : 'normal'}`}
        className={cn(
          "px-4 py-3 text-sm font-medium text-primary border-b border-primary/20 relative",
          !WRAPPABLE_COLUMNS.includes(key) && "whitespace-nowrap",
          isPinned && "sticky z-20 bg-primary/10 border-r-2 border-primary/30"
        )}
        style={isPinned ? { left: leftOffset + 'px' } : undefined}
      >
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => handleSort(key)}
            className="px-2 py-1 h-auto hover:bg-accent/50 font-bold flex-1"
            aria-label={`Sắp xếp theo ${COLUMN_HEADERS[key]}`}
          >
            <span className="font-bold">{COLUMN_HEADERS[key]}</span>
            {sortConfig?.key === key && (
              <ArrowUpDown className={`ml-2 h-4 w-4 ${sortConfig.direction === "ascending" ? "" : "transform rotate-180"}`} />
            )}
            {sortConfig?.key !== key && (
               <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />
            )}
          </Button>
          
          {PINNABLE_COLUMNS.includes(key) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => togglePinColumn(key)}
              className="p-1 h-6 w-6 ml-1 opacity-60 hover:opacity-100"
              title={pinnedColumns.has(key) ? "Bỏ ghim cột" : "Ghim cột"}
            >
              {pinnedColumns.has(key) ? (
                <PinOff className="h-3 w-3" />
              ) : (
                <Pin className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </TableHead>
    );
  };

  // Selection checkbox cell
  const renderSelectionCell = (row: DrugData) => (
    <TableCell className="w-12 px-2 py-3 sticky left-0 z-10 bg-background border-r border-border">
      <Checkbox
        checked={selectedIds.has(row.id)}
        onCheckedChange={() => onRowSelect?.(row.id)}
        aria-label={`Chọn dòng ${row.id}`}
      />
    </TableCell>
  );

  const renderTableCell = (row: DrugData, key: keyof DrugData, isPinned: boolean = false) => {
    let cellValue: string;
    
    if (key === 'quantity' || key === 'unitPrice') {
      cellValue = formatNumberWithThousandSeparator(row[key]);
    } else if (DATE_COLUMNS.includes(key)) {
      cellValue = formatDateToVietnamese(String(row[key]));
    } else {
      cellValue = String(row[key]);
    }

    const leftOffset = selectionMode === 'select' 
      ? (isPinned ? pinnedColumnArray.indexOf(key) * 120 + 48 : 0) // +48px for checkbox column
      : (isPinned ? pinnedColumnArray.indexOf(key) * 120 : 0);

    return (
      <TableCell 
        key={`${row.id}-${key}-${isPinned ? 'pinned' : 'normal'}`}
        className={cn(
          "px-4 py-3 text-sm text-card-foreground align-top",
          WRAPPABLE_COLUMNS.includes(key) 
            ? "whitespace-normal max-w-64"
            : "whitespace-nowrap",
          isPinned && "sticky z-10 bg-background border-r border-border",
          selectionMode === 'select' && selectedIds.has(row.id) && "bg-primary/5"
        )}
        style={isPinned ? { left: leftOffset + 'px' } : undefined}
      >
        {cellValue}
      </TableCell>
    );
  };

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ColumnVisibilityManager
            visibleColumns={visibleColumns}
            onVisibilityChange={setVisibleColumns}
          />
          {pinnedColumns.size > 0 && (
            <div className="text-sm text-muted-foreground">
              Đã ghim: {pinnedColumnArray.map(col => COLUMN_HEADERS[col]).join(', ')}
            </div>
          )}
        </div>
        
        {showScrollHint && visibleColumns.size > 6 && (
          <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-md border border-amber-200">
            💡 Mẹo: Cuộn ngang để xem thêm cột hoặc ghim cột quan trọng
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border shadow-md overflow-hidden bg-card">
        <div 
          ref={tableContainerRef}
          className="overflow-x-auto relative"
          onScroll={handleScroll}
        >
          <Table className="relative">
            <TableHeader>
              <TableRow className="bg-primary/10 hover:bg-primary/15">
                {/* Selection checkbox header */}
                {selectionMode === 'select' && renderSelectionHeader()}
                
                {/* Pinned columns */}
                {pinnedColumnArray.map((key) => renderTableHead(key, true))}
                
                {/* Regular columns */}
                {unpinnedColumnArray.map((key) => renderTableHead(key, false))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length > 0 ? (
                data.map((row) => (
                  <TableRow 
                    key={row.id} 
                    className={cn(
                      "hover:bg-muted/50",
                      selectionMode === 'select' && selectedIds.has(row.id) && "bg-primary/5"
                    )}
                  >
                    {/* Selection checkbox cell */}
                    {selectionMode === 'select' && renderSelectionCell(row)}
                    
                    {/* Pinned cells */}
                    {pinnedColumnArray.map((key) => renderTableCell(row, key, true))}
                    
                    {/* Regular cells */}
                    {unpinnedColumnArray.map((key) => renderTableCell(row, key, false))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell 
                    colSpan={visibleColumns.size + (selectionMode === 'select' ? 1 : 0)} 
                    className="h-24 text-center text-card-foreground"
                  >
                    Không tìm thấy kết quả nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Scroll Indicator */}
        {visibleColumns.size > 6 && (
          <div className="px-4 py-2 bg-muted/30 border-t text-xs text-muted-foreground text-center">
            Hiển thị {visibleColumns.size} cột • Cuộn ngang để xem thêm
          </div>
        )}
      </div>
    </div>
  );
};

export default DrugDataTable;
