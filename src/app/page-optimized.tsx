"use client";

import React, { useState, useEffect } from "react";
import type { DrugData } from "@/types";
import { COLUMN_HEADERS } from "@/types";
import DrugDataTable from "@/components/DrugDataTable";
import AIDrugSuggester from "@/components/AIDrugSuggester";
import PharmaLogo from "@/components/PharmaLogo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTablePagination } from "@/components/DataTablePagination";
import { Search, Lightbulb, Filter, X, FileText, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getDatabaseStats, getUniqueValues } from "@/lib/supabase-optimized";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";

const ADVANCED_FILTER_COLUMNS: Array<keyof DrugData> = [
  "drugName",
  "activeIngredient",
  "concentration",
  "dosageForm",
  "drugGroup",
  "unitPrice",
  "tbmt",
  "investor",
];

export default function OptimizedHome() {
  const [isAISuggesterOpen, setIsAISuggesterOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dbStats, setDbStats] = useState({ totalDrugs: 0, maxPrice: 0, minPrice: 0 });
  const [uniqueValues, setUniqueValues] = useState({
    dosageForms: [] as string[],
    drugGroups: [] as string[],
    concentrations: [] as string[]
  });
  
  const { toast } = useToast();
  
  // Use the optimized search hook
  const {
    searchState,
    searchTerm,
    currentPage,
    sortConfig,
    advancedFilters,
    handleSearch,
    handlePageChange,
    handleSort,
    handleAdvancedFilter,
    clearAdvancedFilters,
    clearSearch,
    isSearching,
    hasResults,
    hasError,
    hasFilters
  } = useDebouncedSearch({
    debounceMs: 300,
    initialPageSize: 100
  });

  // Load initial data and setup
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log("🚀 Loading initial data and stats...");
        
        // Load database stats
        const stats = await getDatabaseStats();
        setDbStats(stats);
        
        // Load unique values for filters
        const [dosageForms, drugGroups, concentrations] = await Promise.all([
          getUniqueValues('dang_bao_che', 50),
          getUniqueValues('nhom_thuoc', 50),
          getUniqueValues('nong_do', 50)
        ]);
        
        setUniqueValues({
          dosageForms,
          drugGroups,
          concentrations
        });

        console.log(`✅ Initial setup complete. Total drugs: ${stats.totalDrugs}`);
        
        toast({
          title: "Kết nối thành công",
          description: `Đã kết nối database với ${stats.totalDrugs.toLocaleString('vi-VN')} thuốc. Bắt đầu tìm kiếm!`,
        });
      } catch (error) {
        console.error("❌ Error loading initial data:", error);
        toast({ 
          title: "Lỗi", 
          description: "Không thể tải dữ liệu ban đầu", 
          variant: "destructive" 
        });
      }
    };
    
    loadInitialData();
  }, [toast]);

  const toggleAdvancedFilters = () => {
    setShowAdvancedFilters(prev => !prev);
  };

  const formatNumberWithThousandSeparator = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return "N/A";
    }
    const num = Number(value);
    if (isNaN(num)) {
      return "N/A";
    }
    return num.toLocaleString('vi-VN');
  };

  const displayedData = searchState.data;
  const totalResults = searchState.count;
  const totalPages = searchState.totalPages;

  // Calculate min/max prices from current results
  const { minPrice, maxPrice, tbmtOfMaxPriceDrug } = React.useMemo(() => {
    if (displayedData.length === 0) {
      return { minPrice: null, maxPrice: null, tbmtOfMaxPriceDrug: null };
    }
    let min = Infinity;
    let max = -Infinity;
    let maxDrugTbmt: string | null = null;
    
    displayedData.forEach(drug => {
      if (drug.unitPrice < min) {
        min = drug.unitPrice;
      }
      if (drug.unitPrice > max) {
        max = drug.unitPrice;
        maxDrugTbmt = drug.tbmt;
      }
    });

    return { 
      minPrice: min === Infinity ? null : min, 
      maxPrice: max === -Infinity ? null : max,
      tbmtOfMaxPriceDrug: maxDrugTbmt
    };
  }, [displayedData]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="mb-8 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start mb-2">
          <PharmaLogo className="h-10 w-10 text-primary mr-3" />
          <h1 className="text-4xl font-headline font-bold text-primary">
            PharmaPrice Navigator
          </h1>
        </div>
        <p className="text-lg text-muted-foreground font-body">
          Tìm kiếm real-time trong {dbStats.totalDrugs.toLocaleString('vi-VN')} thuốc từ Supabase
        </p>
      </header>

      <div className="mb-6 flex flex-col gap-4 p-4 bg-card shadow-md rounded-lg border">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm kiếm theo tên thuốc, hoạt chất, nhóm thuốc, nhà sản xuất..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 w-full text-sm rounded-md shadow-sm focus:ring-primary focus:border-primary"
              disabled={isSearching}
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <Button
              onClick={toggleAdvancedFilters}
              variant="outline"
              className="flex-1 md:flex-none shadow-sm border-primary text-primary hover:bg-primary/10"
              disabled={isSearching}
            >
              <Filter className="mr-2 h-5 w-5" />
              Bộ lọc {hasFilters && '●'}
            </Button>

            {(searchTerm || hasFilters) && (
              <Button
                onClick={() => {
                  clearSearch();
                  clearAdvancedFilters();
                }}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                disabled={isSearching}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {showAdvancedFilters && (
          <div className="mt-4 p-4 border-t border-border">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-primary">Bộ lọc chi tiết theo cột</h3>
              <Button
                onClick={clearAdvancedFilters}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                disabled={isSearching || !hasFilters}
              >
                <X className="mr-1 h-4 w-4" />
                Xóa bộ lọc
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
              {ADVANCED_FILTER_COLUMNS.map((key) => (
                <div key={key} className="space-y-1">
                  <Label htmlFor={`filter-${key}`} className="text-sm font-medium text-muted-foreground">
                    {COLUMN_HEADERS[key]}
                  </Label>
                  {key === 'dosageForm' ? (
                    <Select
                      value={advancedFilters[key] || ""}
                      onValueChange={(value) => handleAdvancedFilter(key, value === "all" ? "" : value)}
                      disabled={isSearching}
                    >
                      <SelectTrigger className="w-full text-sm">
                        <SelectValue placeholder={`Lọc theo ${COLUMN_HEADERS[key]}...`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả dạng bào chế</SelectItem>
                        {uniqueValues.dosageForms.map(form => (
                          <SelectItem key={form} value={form}>{form}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : key === 'drugGroup' ? (
                    <Select
                      value={advancedFilters[key] || ""}
                      onValueChange={(value) => handleAdvancedFilter(key, value === "all" ? "" : value)}
                      disabled={isSearching}
                    >
                      <SelectTrigger className="w-full text-sm">
                        <SelectValue placeholder={`Lọc theo ${COLUMN_HEADERS[key]}...`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả nhóm thuốc</SelectItem>
                        {uniqueValues.drugGroups.map(group => (
                          <SelectItem key={group} value={group}>{group}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : key === 'concentration' ? (
                    <Select
                      value={advancedFilters[key] || ""}
                      onValueChange={(value) => handleAdvancedFilter(key, value === "all" ? "" : value)}
                      disabled={isSearching}
                    >
                      <SelectTrigger className="w-full text-sm">
                        <SelectValue placeholder={`Lọc theo ${COLUMN_HEADERS[key]}...`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả nồng độ</SelectItem>
                        {uniqueValues.concentrations.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={`filter-${key}`}
                      type={key === 'unitPrice' ? 'number' : 'search'}
                      placeholder={`Lọc theo ${COLUMN_HEADERS[key]}...`}
                      value={advancedFilters[key] || ""}
                      onChange={(e) => handleAdvancedFilter(key, e.target.value)}
                      className="w-full text-sm"
                      disabled={isSearching}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-col md:flex-row gap-2 items-center">
          <Button
            onClick={() => setIsAISuggesterOpen(true)}
            variant="outline"
            className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground border-accent hover:border-accent/90 shadow-sm"
            disabled={isSearching}
          >
            <Lightbulb className="mr-2 h-5 w-5" />
            Gợi ý thuốc AI
          </Button>
        </div>
      </div>
      
      <main>
        {isSearching && (
          <div className="flex justify-center items-center my-10">
            <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Đang tìm kiếm...</p>
          </div>
        )}

        {hasError && (
          <div className="text-center my-10">
            <p className="text-destructive">{searchState.error}</p>
          </div>
        )}

        {!isSearching && !hasError && (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              {searchTerm || hasFilters ? (
                <>Tìm thấy {totalResults.toLocaleString('vi-VN')} kết quả</>
              ) : (
                <>Hiển thị 100 thuốc đầu tiên từ {dbStats.totalDrugs.toLocaleString('vi-VN')} thuốc</>
              )}
              {searchTerm && (
                <> cho "<strong>{searchTerm}</strong>"</>
              )}
            </div>

            {hasResults && (
              <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-card shadow-md rounded-lg border">
                <div className="flex items-center gap-2 p-3 rounded-md bg-secondary/30">
                  <TrendingDown className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Đơn giá nhỏ nhất (trang hiện tại)</p>
                    <p className="text-xl font-bold text-primary">
                      {formatNumberWithThousandSeparator(minPrice)} VNĐ
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-md bg-secondary/30">
                  <TrendingUp className="h-6 w-6 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">Đơn giá lớn nhất (trang hiện tại)</p>
                    <p className="text-xl font-bold text-accent">
                      {formatNumberWithThousandSeparator(maxPrice)} VNĐ
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-md bg-secondary/30">
                  <FileText className="h-6 w-6 text-chart-4" />
                  <div>
                    <p className="text-sm text-muted-foreground">TBMT (Giá Cao Nhất)</p>
                    <p className="text-xl font-bold text-chart-4 truncate max-w-xs" title={tbmtOfMaxPriceDrug || undefined}>
                      {tbmtOfMaxPriceDrug || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DrugDataTable
              data={displayedData}
              sortConfig={sortConfig}
              handleSort={handleSort}
            />

            {totalPages > 1 && (
              <div className="mt-4">
                <DataTablePagination
                  pageCount={totalPages}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                  itemCount={totalResults}
                />
              </div>
            )}

            {!hasResults && !isSearching && (searchTerm || hasFilters) && (
              <div className="text-center my-10">
                <p className="text-lg text-muted-foreground">Không tìm thấy kết quả nào</p>
                <p className="text-sm text-muted-foreground mt-2">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
              </div>
            )}
          </>
        )}
      </main>

      <AIDrugSuggester
        open={isAISuggesterOpen}
        onOpenChange={setIsAISuggesterOpen}
      />

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} PharmaPrice Navigator. Optimized with Real-time Search.</p>
      </footer>
    </div>
  );
} 