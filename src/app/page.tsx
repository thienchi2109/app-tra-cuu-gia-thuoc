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
import AuthGuard from "@/components/AuthGuard";
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
import { Search, Lightbulb, Filter, X, FileText, Loader2, TrendingUp, TrendingDown, Clock, LogOut, Download } from "lucide-react";
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";
import { getDatabaseStats, getUniqueValues, exportSearchResults } from "@/lib/supabase-optimized";
import { useAdvancedSearch } from "@/hooks/use-advanced-search";
import AdvancedSearchBuilder, { AdvancedSearchConfig } from "@/components/AdvancedSearchBuilder";
import { useRouter } from "next/navigation";

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
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [dbStats, setDbStats] = useState({ totalDrugs: 0, maxPrice: 0, minPrice: 0 });
  const [uniqueValues, setUniqueValues] = useState({
    dosageForms: [] as string[],
    drugGroups: [] as string[],
    concentrations: [] as string[]
  });
  const [userDisplayName, setUserDisplayName] = useState<string>("");
  
  const { toast } = useToast();
  const router = useRouter();

  // Load user display name from localStorage on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedDisplayName = localStorage.getItem("userDisplayName");
      const storedUsername = localStorage.getItem("username");
      // Ưu tiên hiển thị tên tiếng Việt, nếu không có thì hiển thị username
      setUserDisplayName(storedDisplayName || storedUsername || "Người dùng");
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("username");
      localStorage.removeItem("userDisplayName");
    }
    router.push("/login");
  };
  
  // Use the advanced search hook
  const {
    searchState,
    searchTerm,
    currentPage,
    pageSize,
    sortConfig,
    advancedConfig,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleAdvancedConfigChange,
    clearAdvancedConfig,
    clearSearch,
    triggerImmediateSearch,
    isSearching,
    hasResults,
    hasError,
    hasAdvancedConditions,
    isTyping,
    isPending,
    isActuallySearching
  } = useAdvancedSearch({
    debounceMs: 0, // Không debounce - chỉ tìm kiếm thủ công
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

  const toggleAdvancedSearch = () => {
    setShowAdvancedSearch(prev => !prev);
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      
      // Show loading toast
      toast({
        title: "Đang xuất Excel...",
        description: "Vui lòng chờ trong giây lát",
      });

      // Get all search results (max 1000)
      const sortColumn = sortConfig?.key ? 
        (() => {
          const columnMap: Record<keyof DrugData, string> = {
            id: 'id',
            drugName: 'ten_thuoc',
            activeIngredient: 'ten_hoat_chat',
            concentration: 'nong_do',
            gdklh: 'gdk_lh',
            routeOfAdministration: 'duong_dung',
            dosageForm: 'dang_bao_che',
            expiryDate: 'han_dung',
            manufacturer: 'ten_cssx',
            manufacturingCountry: 'nuoc_san_xuat',
            packaging: 'quy_cach',
            unit: 'don_vi_tinh',
            quantity: 'so_luong',
            unitPrice: 'don_gia',
            drugGroup: 'nhom_thuoc',
            tbmt: 'ma_tbmt',
            investor: 'chu_dau_tu',
            contractorSelectionMethod: 'hinh_thuc_lcnt',
            kqlcntUploadDate: 'ngay_dang_tai',
            decisionNumber: 'so_quyet_dinh',
            decisionDate: 'ngay_ban_hanh',
            contractorNumber: 'so_nha_thau',
            location: 'dia_diem',
          };
          return columnMap[sortConfig.key] as any;
        })() : 'id';

      const sortOrder = sortConfig?.direction === 'ascending' ? 'asc' : 'desc';

      const exportResult = await exportSearchResults(
        searchTerm,
        advancedConfig,
        sortColumn,
        sortOrder,
        1000 // Max 1000 records
      );

      if (exportResult.data.length === 0) {
        toast({
          title: "Không có dữ liệu",
          description: "Không có dữ liệu để xuất Excel",
          variant: "destructive"
        });
        return;
      }

      // Tạo worksheet với header tiếng Việt
      const worksheetData = [
        // Header row
        Object.keys(COLUMN_HEADERS).map(key => COLUMN_HEADERS[key as keyof DrugData]),
        // Data rows
        ...exportResult.data.map(drug => [
          drug.id,
          drug.drugName,
          drug.activeIngredient,
          drug.concentration,
          drug.gdklh,
          drug.routeOfAdministration,
          drug.dosageForm,
          drug.expiryDate,
          drug.manufacturer,
          drug.manufacturingCountry,
          drug.packaging,
          drug.unit,
          drug.quantity,
          drug.unitPrice,
          drug.drugGroup,
          drug.tbmt,
          drug.investor,
          drug.contractorSelectionMethod,
          drug.kqlcntUploadDate,
          drug.decisionNumber,
          drug.decisionDate,
          drug.contractorNumber,
          drug.location
        ])
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Set column widths
      const columnWidths = [
        { wch: 5 },   // STT
        { wch: 30 },  // Tên thuốc
        { wch: 25 },  // Tên hoạt chất
        { wch: 15 },  // Nồng độ
        { wch: 10 },  // GĐKLH
        { wch: 15 },  // Đường dùng
        { wch: 15 },  // Dạng bào chế
        { wch: 12 },  // Hạn dùng
        { wch: 25 },  // Tên cơ sở sản xuất
        { wch: 15 },  // Nước sản xuất
        { wch: 20 },  // Quy cách đóng gói
        { wch: 10 },  // Đơn vị tính
        { wch: 10 },  // Số lượng
        { wch: 15 },  // Đơn giá
        { wch: 20 },  // Nhóm thuốc
        { wch: 15 },  // TBMT
        { wch: 25 },  // Chủ đầu tư
        { wch: 20 },  // Hình thức lựa chọn nhà thầu
        { wch: 15 },  // Ngày đăng tải KQLCNT
        { wch: 15 },  // Số quyết định
        { wch: 15 },  // Ngày ban hành quyết định
        { wch: 12 },  // Số nhà thầu
        { wch: 20 }   // Địa điểm
      ];
      worksheet['!cols'] = columnWidths;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách thuốc");

      // Generate filename với format TraCuuGiaThuoc_X-Y
      const firstId = exportResult.data[0]?.id || 1;
      const lastId = exportResult.data[exportResult.data.length - 1]?.id || 1;
      const filename = `TraCuuGiaThuoc_${firstId}-${lastId}.xlsx`;

      // Export file
      XLSX.writeFile(workbook, filename);

      // Success message with detailed info
      const limitedMessage = exportResult.limited 
        ? ` (Giới hạn 1000 dòng đầu tiên từ ${exportResult.count.toLocaleString('vi-VN')} kết quả)`
        : '';

      toast({
        title: "Xuất Excel thành công",
        description: `Đã xuất ${exportResult.data.length.toLocaleString('vi-VN')} thuốc vào file ${filename}${limitedMessage}`,
      });

    } catch (error) {
      console.error("Error exporting Excel:", error);
      toast({
        title: "Lỗi xuất Excel",
        description: "Không thể xuất file Excel",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
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

  // Calculate min/max/average/median prices from current results
  const { minPrice, maxPrice, averagePrice, medianPrice, tbmtOfMaxPriceDrug } = React.useMemo(() => {
    if (displayedData.length === 0) {
      return { minPrice: null, maxPrice: null, averagePrice: null, medianPrice: null, tbmtOfMaxPriceDrug: null };
    }
    let min = Infinity;
    let max = -Infinity;
    let maxDrugTbmt: string | null = null;
    let sum = 0;
    const prices: number[] = [];
    
    displayedData.forEach(drug => {
      const price = drug.unitPrice;
      prices.push(price);
      sum += price;
      
      if (price < min) {
        min = price;
      }
      if (price > max) {
        max = price;
        maxDrugTbmt = drug.tbmt;
      }
    });

    // Calculate average
    const average = sum / displayedData.length;
    
    // Calculate median
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const median = sortedPrices.length % 2 === 0
      ? (sortedPrices[sortedPrices.length / 2 - 1] + sortedPrices[sortedPrices.length / 2]) / 2
      : sortedPrices[Math.floor(sortedPrices.length / 2)];

    return { 
      minPrice: min === Infinity ? null : min, 
      maxPrice: max === -Infinity ? null : max,
      averagePrice: average,
      medianPrice: median,
      tbmtOfMaxPriceDrug: maxDrugTbmt
    };
  }, [displayedData]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
        <header className="mb-8 text-center md:text-left">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <PharmaLogo className="h-10 w-10 text-primary mr-3" />
              <h1 className="text-4xl font-headline font-bold text-primary">
                PHẦN MỀM THAM KHẢO GIÁ THUỐC TRÚNG THẦU
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Xin chào, {userDisplayName}
              </span>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </Button>
            </div>
          </div>
       
        
                 {/* Hướng dẫn sử dụng */}
         <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
           <div className="flex items-start gap-2 text-sm text-blue-700">
             <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
             <div>
               <p className="font-medium">Cách tìm kiếm:</p>
               <ul className="mt-1 space-y-1 text-xs">
                 <li>• <span className="font-medium">Chủ động:</span> Nhấn nút 🔍 hoặc Enter để tìm kiếm</li>
                 <li>• <span className="font-medium">Tìm kiếm nâng cao:</span> Thiết lập điều kiện → Nhấn "Tìm kiếm nâng cao"</li>
                 <li>• <span className="font-medium">Trạng thái:</span> 🟢 Sẵn sàng | 🔵 Đang tìm kiếm</li>
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
              {!isActuallySearching && (searchTerm || hasAdvancedConditions) && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-green-500" />
              )}
            </div>
            
            {/* Nút tìm kiếm chủ động */}
            <Button
              onClick={triggerImmediateSearch}
              disabled={isActuallySearching || (!searchTerm.trim() && !hasAdvancedConditions)}
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
              onClick={toggleAdvancedSearch}
              variant="outline"
              className="flex-1 md:flex-none shadow-sm border-primary text-primary hover:bg-primary/10"
              disabled={false} // Không disable
            >
              <Filter className="mr-2 h-5 w-5" />
              Tìm kiếm nâng cao {(advancedConfig.includeConditions.length > 0 || advancedConfig.excludeConditions.length > 0) && '●'}
            </Button>

            {(searchTerm || advancedConfig.includeConditions.length > 0 || advancedConfig.excludeConditions.length > 0) && (
              <Button
                onClick={() => {
                  clearSearch();
                  clearAdvancedConfig();
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

        {showAdvancedSearch && (
          <div className="mt-4">
            <AdvancedSearchBuilder
              config={advancedConfig}
              onChange={handleAdvancedConfigChange}
              onSearch={triggerImmediateSearch}
              isSearching={isActuallySearching}
              uniqueValues={uniqueValues}
            />
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col md:flex-row gap-2 items-center">
            <Button
              onClick={() => setIsAISuggesterOpen(true)}
              variant="outline"
              className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground border-accent hover:border-accent/90 shadow-sm"
              disabled={isSearching}
            >
              <Lightbulb className="mr-2 h-5 w-5" />
              Gợi ý thuốc AI
            </Button>
            
            <Button
              onClick={handleExportExcel}
              variant="outline"
              className="w-full md:w-auto bg-green-50 hover:bg-green-100 text-green-700 border-green-200 hover:border-green-300 shadow-sm"
              disabled={isSearching || isExporting || (!hasResults && !searchTerm && !hasAdvancedConditions)}
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Download className="mr-2 h-5 w-5" />
              )}
              {isExporting ? "Đang xuất..." : "Xuất Excel"}
            </Button>
          </div>
          
          {/* Thông tin xuất Excel */}
          <div className="text-xs text-muted-foreground bg-green-50 p-2 rounded border border-green-200">
            <strong>💡 Lưu ý xuất Excel:</strong>
            <ul className="mt-1 space-y-1">
              <li>• Xuất toàn bộ kết quả tìm kiếm hiện tại (không chỉ trang này)</li>
              <li>• Giới hạn tối đa 1.000 dòng để bảo vệ tài nguyên hệ thống</li>
              <li>• Header tiếng Việt có dấu, file format: TraCuuGiaThuoc_X-Y.xlsx</li>
            </ul>
          </div>
        </div>
      </div>
      
      <main>
        {/* Hiển thị trạng thái tìm kiếm */}
        {!isActuallySearching && (searchTerm || hasAdvancedConditions) && (
          <div className="flex justify-center items-center my-4">
            <div className="h-4 w-4 rounded-full bg-green-500 mr-2"></div>
            <p className="text-sm text-muted-foreground">Sẵn sàng tìm kiếm - Nhấn Enter hoặc nút tìm kiếm</p>
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
              {searchTerm || advancedConfig.includeConditions.length > 0 || advancedConfig.excludeConditions.length > 0 ? (
                <>Tìm thấy {totalResults.toLocaleString('vi-VN')} kết quả</>
              ) : (
                <>Hiển thị {pageSize} thuốc đầu tiên từ {dbStats.totalDrugs.toLocaleString('vi-VN')} thuốc</>
              )}
              {searchTerm && (
                <> cho "<strong>{searchTerm}</strong>"</>
              )}
              {advancedConfig.includeConditions.length > 0 && (
                <> với {advancedConfig.includeConditions.length} điều kiện thỏa mãn</>
              )}
              {advancedConfig.excludeConditions.length > 0 && (
                <> và {advancedConfig.excludeConditions.length} điều kiện loại trừ</>
              )}
            </div>

            {hasResults && (
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 p-4 bg-card shadow-md rounded-lg border">
                <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/30">
                  <TrendingDown className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Giá nhỏ nhất</p>
                    <p className="text-lg font-bold text-primary truncate">
                      {formatNumberWithThousandSeparator(minPrice)} VNĐ
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/30">
                  <TrendingUp className="h-5 w-5 text-accent flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Giá lớn nhất</p>
                    <p className="text-lg font-bold text-accent truncate">
                      {formatNumberWithThousandSeparator(maxPrice)} VNĐ
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/30">
                  <div className="h-5 w-5 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center">
                    <span className="text-xs text-white font-bold">TB</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Giá trung bình</p>
                    <p className="text-lg font-bold text-blue-600 truncate">
                      {formatNumberWithThousandSeparator(Math.round(averagePrice || 0))} VNĐ
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/30">
                  <div className="h-5 w-5 rounded-full bg-green-500 flex-shrink-0 flex items-center justify-center">
                    <span className="text-xs text-white font-bold">TV</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Giá trung vị</p>
                    <p className="text-lg font-bold text-green-600 truncate">
                      {formatNumberWithThousandSeparator(Math.round(medianPrice || 0))} VNĐ
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/30">
                  <FileText className="h-5 w-5 text-chart-4 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">TBMT (Giá Cao)</p>
                    <p className="text-lg font-bold text-chart-4 truncate" title={tbmtOfMaxPriceDrug || undefined}>
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

            {!hasResults && !isActuallySearching && (searchTerm || advancedConfig.includeConditions.length > 0 || advancedConfig.excludeConditions.length > 0) && (
              <div className="text-center my-10">
                <p className="text-lg text-muted-foreground">Không tìm thấy kết quả nào</p>
                <p className="text-sm text-muted-foreground mt-2">Thử thay đổi từ khóa tìm kiếm hoặc điều kiện tìm kiếm nâng cao</p>
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
        <div className="space-y-1">
          <p>Phần mềm được phát triển bởi DS CK1. Nguyễn Thành Long và KS Nguyễn Thiện Chí</p>
          <p>Phiên bản 06.2025</p>
          <p>Email: thanhlongnguyen2013@gmail.com</p>
        </div>
      </footer>
    </div>
    </AuthGuard>
  );
} 