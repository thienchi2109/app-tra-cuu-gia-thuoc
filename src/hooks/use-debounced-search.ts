import { useState, useEffect, useCallback, useRef } from 'react';
import { searchDrugsRealtime, searchWithAdvancedFilters } from '@/lib/supabase-optimized';
import type { DrugData, SortConfig } from '@/types';

interface SearchState {
  data: DrugData[];
  count: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

interface UseSearchOptions {
  debounceMs?: number;
  initialPageSize?: number;
}

interface SearchStatus {
  isTyping: boolean;
  isPending: boolean;
  isSearching: boolean;
}

export function useDebouncedSearch(options: UseSearchOptions = {}) {
  const { debounceMs = 300, initialPageSize = 20 } = options;
  
  const [searchState, setSearchState] = useState<SearchState>({
    data: [],
    count: 0,
    page: 1,
    totalPages: 0,
    isLoading: false,
    error: null
  });

  const [searchStatus, setSearchStatus] = useState<SearchStatus>({
    isTyping: false,
    isPending: false, 
    isSearching: false
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'id', direction: 'ascending' });
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, string>>({});

  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  // Map sort config to Supabase format
  const mapSortToSupabase = useCallback((sort: SortConfig) => {
    if (!sort) return { sortBy: 'id' as const, sortOrder: 'asc' as const };
    
    const columnMap: Record<string, string> = {
      id: 'id',
      drugName: 'ten_thuoc',
      activeIngredient: 'ten_hoat_chat',
      concentration: 'nong_do',
      unitPrice: 'don_gia',
      drugGroup: 'nhom_thuoc',
      manufacturer: 'ten_cssx'
    };

    return {
      sortBy: (columnMap[sort.key] || 'id') as any,
      sortOrder: sort.direction === 'ascending' ? 'asc' as const : 'desc' as const
    };
  }, []);

  // Perform search
  const performSearch = useCallback(async (
    term: string,
    page: number,
    sort: SortConfig,
    filters: Record<string, string>,
    signal?: AbortSignal
  ) => {
    try {
      setSearchStatus(prev => ({ ...prev, isSearching: true, isPending: false }));
      setSearchState(prev => ({ ...prev, isLoading: true, error: null }));

      const { sortBy, sortOrder } = mapSortToSupabase(sort);
      
      let result;
      if (Object.keys(filters).some(key => filters[key]?.trim())) {
        // Use advanced search if filters are active
        result = await searchWithAdvancedFilters(
          term,
          filters,
          page,
          pageSize,
          sortBy,
          sortOrder
        );
      } else {
        // Use simple search
        result = await searchDrugsRealtime(
          term,
          page,
          pageSize,
          sortBy,
          sortOrder
        );
      }

      if (!signal?.aborted) {
        setSearchState({
          data: result.data,
          count: result.count,
          page: result.page,
          totalPages: result.totalPages,
          isLoading: false,
          error: null
        });
        setSearchStatus(prev => ({ ...prev, isSearching: false }));
      }
    } catch (error: any) {
      if (!signal?.aborted) {
        console.error('Search error:', error);
        setSearchState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Lỗi tìm kiếm'
        }));
        setSearchStatus(prev => ({ ...prev, isSearching: false }));
      }
    }
  }, [mapSortToSupabase, initialPageSize]);

  // Debounced search effect
  useEffect(() => {
    // Show typing status immediately
    if (searchTerm !== '' || Object.keys(advancedFilters).some(key => advancedFilters[key]?.trim())) {
      setSearchStatus(prev => ({ ...prev, isTyping: true, isPending: false }));
    }

    // Cancel previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Set up debounced search
    debounceTimeoutRef.current = setTimeout(() => {
      setSearchStatus(prev => ({ ...prev, isTyping: false, isPending: true }));
      performSearch(searchTerm, currentPage, sortConfig, advancedFilters, signal);
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchTerm, currentPage, sortConfig, advancedFilters, performSearch, debounceMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Handlers
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page on new search
    
    // Reset status when clearing search
    if (term === '') {
      setSearchStatus({ isTyping: false, isPending: false, isSearching: false });
    }
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleSort = useCallback((key: keyof DrugData) => {
    setSortConfig(prevSort => {
      let direction: "ascending" | "descending" = "ascending";
      if (prevSort && prevSort.key === key && prevSort.direction === "ascending") {
        direction = "descending";
      }
      return { key, direction };
    });
    setCurrentPage(1); // Reset to first page on sort change
  }, []);

  const handleAdvancedFilter = useCallback((key: string, value: string) => {
    setAdvancedFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  }, []);

  const clearAdvancedFilters = useCallback(() => {
    setAdvancedFilters({});
    setCurrentPage(1);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setCurrentPage(1);
    setSearchStatus({ isTyping: false, isPending: false, isSearching: false });
  }, []);

  // Handle page size change
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  // Trigger immediate search without debounce
  const triggerImmediateSearch = useCallback(() => {
    // Cancel any pending debounced search
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller and search immediately
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    setSearchStatus(prev => ({ ...prev, isTyping: false, isPending: false }));
    performSearch(searchTerm, currentPage, sortConfig, advancedFilters, signal);
  }, [searchTerm, currentPage, pageSize, sortConfig, advancedFilters, performSearch]);

  return {
    // State
    searchState,
    searchTerm,
    currentPage,
    pageSize,
    sortConfig,
    advancedFilters,
    searchStatus,
    
    // Handlers
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleAdvancedFilter,
    clearAdvancedFilters,
    clearSearch,
    triggerImmediateSearch,
    
    // Utils
    isSearching: searchState.isLoading,
    hasResults: searchState.data.length > 0,
    hasError: !!searchState.error,
    hasFilters: Object.keys(advancedFilters).some(key => advancedFilters[key]?.trim()),
    
    // Extended status
    isTyping: searchStatus.isTyping,
    isPending: searchStatus.isPending,
    isActuallySearching: searchStatus.isSearching
  };
} 