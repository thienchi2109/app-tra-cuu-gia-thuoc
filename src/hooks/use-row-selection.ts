import { useState, useCallback, useMemo } from 'react';
import { DrugData } from '@/types';

interface UseRowSelectionProps {
  data: DrugData[];
  currentPage: number;
  totalResults: number;
}

export function useRowSelection({ data, currentPage, totalResults }: UseRowSelectionProps) {
  // Selection state - chỉ lưu IDs để tối ưu memory
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectionMode, setSelectionMode] = useState<'view' | 'select'>('view');

  // Toggle selection mode
  const toggleSelectionMode = useCallback(() => {
    setSelectionMode(prev => {
      const newMode = prev === 'view' ? 'select' : 'view';
      // Clear selections when exiting selection mode
      if (newMode === 'view') {
        setSelectedIds(new Set());
      }
      return newMode;
    });
  }, []);

  // Toggle single row selection
  const toggleRowSelection = useCallback((id: number) => {
    setSelectedIds(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }, []);

  // Select all visible rows on current page
  const selectAllCurrentPage = useCallback(() => {
    setSelectedIds(prev => {
      const newSelected = new Set(prev);
      data.forEach(row => newSelected.add(row.id));
      return newSelected;
    });
  }, [data]);

  // Deselect all visible rows on current page
  const deselectAllCurrentPage = useCallback(() => {
    setSelectedIds(prev => {
      const newSelected = new Set(prev);
      data.forEach(row => newSelected.delete(row.id));
      return newSelected;
    });
  }, [data]);

  // Clear all selections
  const clearAllSelections = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Check if current page is fully selected
  const isCurrentPageFullySelected = useMemo(() => {
    return data.length > 0 && data.every(row => selectedIds.has(row.id));
  }, [data, selectedIds]);

  // Check if current page is partially selected
  const isCurrentPagePartiallySelected = useMemo(() => {
    return data.some(row => selectedIds.has(row.id)) && !isCurrentPageFullySelected;
  }, [data, selectedIds, isCurrentPageFullySelected]);

  // Get selected rows from current page data
  const selectedRowsCurrentPage = useMemo(() => {
    return data.filter(row => selectedIds.has(row.id));
  }, [data, selectedIds]);

  // Statistics
  const selectionStats = useMemo(() => ({
    selectedCount: selectedIds.size,
    selectedOnCurrentPage: selectedRowsCurrentPage.length,
    totalOnCurrentPage: data.length,
    totalRows: totalResults,
    selectionPercentage: totalResults > 0 ? (selectedIds.size / totalResults) * 100 : 0
  }), [selectedIds.size, selectedRowsCurrentPage.length, data.length, totalResults]);

  return {
    // State
    selectedIds,
    selectionMode,
    
    // Actions
    toggleSelectionMode,
    toggleRowSelection,
    selectAllCurrentPage,
    deselectAllCurrentPage,
    clearAllSelections,
    
    // Computed
    isCurrentPageFullySelected,
    isCurrentPagePartiallySelected,
    selectedRowsCurrentPage,
    selectionStats,
    
    // Utils
    isRowSelected: (id: number) => selectedIds.has(id),
    hasSelections: selectedIds.size > 0,
  };
} 