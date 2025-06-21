"use client";

import React, { useState, useEffect } from "react";
import type { DrugData } from "@/types";
import { COLUMN_HEADERS } from "@/types";
import DrugDataTable from "@/components/DrugDataTable";
// Conditional import for AI components to avoid build issues
const AIDrugSuggester = React.lazy(() => 
  import("@/components/AIDrugSuggester").catch(() => ({ 
    default: () => <div>AI features not available</div> 
  }))
);
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
import { Search, Lightbulb, Filter, X, FileText, Loader2, TrendingUp, TrendingDown, Clock } from "lucide-react";
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

export default function Home() {
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
    pageSize,
    sortConfig,
    advancedFilters,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleAdvancedFilter,
    clearAdvancedFilters,
    clearSearch,
    triggerImmediateSearch,
    isSearching,
    hasResults,
    hasError,
    hasFilters,
    isTyping,
    isPending,
    isActuallySearching
  } = useDebouncedSearch({
    debounceMs: 3000, // 3 giây sau khi ngưng gõ mới search  
    initialPageSize: 20
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
          Tìm kiếm real-time trong {dbStats.totalDrugs.toLocaleString('vi-VN')} thuốc từ Supabase ⚡
        </p>
        
                 {/* Hướng dẫn sử dụng */}
         <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
           <div className="flex items-start gap-2 text-sm text-blue-700">
             <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
             <div>
               <p className="font-medium">Cách tìm kiếm:</p>
               <ul className="mt-1 space-y-1 text-xs">
                 <li>• <span className="font-medium">Tự động:</span> Gõ xong → Chờ 3 giây → Tự tìm kiếm</li>
                 <li>• <span className="font-medium">Chủ động:</span> Nhấn nút 🔍 hoặc Enter → Tìm ngay lập tức</li>
                 <li>• <span className="font-medium">Trạng thái:</span> 🟢 Gõ | 🟡 Chờ | 🔵 Tìm kiếm</li>
               </ul>
             </div>
           </div>
         </div>
      </header>

      <div className="mb-6 flex flex-col gap-4 p-4 bg-card shadow-md rounded-lg border">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full flex gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm kiếm theo tên thuốc, hoạt chất, nhóm thuốc, nhà sản xuất..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    triggerImmediateSearch();
                  }
                }}
                className="pl-10 pr-10 w-full text-sm rounded-md shadow-sm focus:ring-primary focus:border-primary"
                disabled={false} // Không bao giờ disable input
              />
              {isActuallySearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
              )}
              {isPending && !isActuallySearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-yellow-500 animate-pulse" />
              )}
              {isTyping && !isPending && !isActuallySearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-green-500" />
              )}
            </div>
            
            {/* Nút tìm kiếm chủ động */}
            <Button
              onClick={triggerImmediateSearch}
              disabled={isActuallySearching || (!searchTerm.trim() && !hasFilters)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm px-4"
              title="Nhấn để tìm kiếm ngay (hoặc nhấn Enter)"
            >
              {isActuallySearching ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
              <span className="sr-only">Tìm kiếm</span>
            </Button>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <Button
              onClick={toggleAdvancedFilters}
              variant="outline"
              className="flex-1 md:flex-none shadow-sm border-primary text-primary hover:bg-primary/10"
              disabled={false} // Không disable
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
                disabled={false} // Không disable
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
                              <div className="flex gap-2">
                  <Button
                    onClick={triggerImmediateSearch}
                    disabled={isActuallySearching}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isActuallySearching ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="mr-1 h-4 w-4" />
                    )}
                    Áp dụng lọc
                  </Button>
                  <Button
                    onClick={clearAdvancedFilters}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    disabled={isActuallySearching || !hasFilters}
                  >
                    <X className="mr-1 h-4 w-4" />
                    Xóa bộ lọc
                  </Button>
                </div>
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
                      onValueChange={(value) => {
                        handleAdvancedFilter(key, value === "all" ? "" : value);
                        // Trigger search after a short delay to allow state to update
                        setTimeout(() => triggerImmediateSearch(), 100);
                      }}
                      disabled={false}
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
                      onValueChange={(value) => {
                        handleAdvancedFilter(key, value === "all" ? "" : value);
                        setTimeout(() => triggerImmediateSearch(), 100);
                      }}
                      disabled={false}
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
                      onValueChange={(value) => {
                        handleAdvancedFilter(key, value === "all" ? "" : value);
                        setTimeout(() => triggerImmediateSearch(), 100);
                      }}
                      disabled={false}
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
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          triggerImmediateSearch();
                        }
                      }}
                      className="w-full text-sm"
                      disabled={false}
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
        {/* Hiển thị trạng thái gõ và tìm kiếm */}
        {isTyping && !isPending && !isActuallySearching && (
          <div className="flex justify-center items-center my-4">
            <div className="h-4 w-4 rounded-full bg-green-500 mr-2"></div>
            <p className="text-sm text-muted-foreground">Đang nhập...</p>
          </div>
        )}
        
        {isPending && !isActuallySearching && (
          <div className="flex justify-center items-center my-4">
            <div className="h-4 w-4 rounded-full bg-yellow-500 animate-pulse mr-2"></div>
            <p className="text-sm text-muted-foreground">Chuẩn bị tìm kiếm...</p>
          </div>
        )}

        {isActuallySearching && (
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

        {!isActuallySearching && !hasError && (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              {searchTerm || hasFilters ? (
                <>Tìm thấy {totalResults.toLocaleString('vi-VN')} kết quả</>
              ) : (
                <>Hiển thị {pageSize} thuốc đầu tiên từ {dbStats.totalDrugs.toLocaleString('vi-VN')} thuốc</>
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

            {/* Pagination controls trước bảng */}
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Hiển thị:</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => handlePageSizeChange(Number(value))}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span>mục mỗi trang</span>
              </div>
              
              {totalPages > 1 && (
                <div className="text-sm text-muted-foreground">
                  Trang {currentPage} / {totalPages} 
                  ({((currentPage - 1) * pageSize + 1).toLocaleString('vi-VN')} - {Math.min(currentPage * pageSize, totalResults).toLocaleString('vi-VN')} 
                  trong tổng số {totalResults.toLocaleString('vi-VN')} kết quả)
                </div>
              )}
            </div>

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
                  pageSize={pageSize}
                />
              </div>
            )}

            {!hasResults && !isActuallySearching && (searchTerm || hasFilters) && (
              <div className="text-center my-10">
                <p className="text-lg text-muted-foreground">Không tìm thấy kết quả nào</p>
                <p className="text-sm text-muted-foreground mt-2">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
              </div>
            )}
          </>
        )}
      </main>

      <React.Suspense fallback={<div>Loading AI features...</div>}>
        <AIDrugSuggester
          open={isAISuggesterOpen}
          onOpenChange={setIsAISuggesterOpen}
        />
      </React.Suspense>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} PharmaPrice Navigator. Optimized with Real-time Search ⚡</p>
      </footer>
    </div>
  );
} 