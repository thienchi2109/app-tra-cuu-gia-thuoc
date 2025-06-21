
"use client";

import React, { useState, useMemo, useEffect } from "react";
import type { DrugData, SortConfig } from "@/types";
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
import { Search, Lightbulb, Upload, Loader2, Trash2, TrendingUp, TrendingDown, Filter, X, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as xlsx from "xlsx";
import { fetchInitialDrugs, getDatabaseStats, getUniqueValues } from "@/lib/supabase-optimized";
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

const ITEMS_PER_PAGE = 100;

export default function Home() {
  const [isAISuggesterOpen, setIsAISuggesterOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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

  const saveDrugsToSupabase = async (drugsToSave: DrugData[]) => {
    try {
      const validDrugs = drugsToSave.filter(drug => drug.id > 0);
      
      if (validDrugs.length === 0) {
        toast({
          title: "Thông báo",
          description: "Không có mục thuốc mới hoặc cập nhật nào hợp lệ để lưu.",
        });
        return;
      }

      await upsertDrugs(validDrugs);
      
      toast({
        title: "Đồng bộ thành công",
        description: `Đã lưu hoặc cập nhật ${validDrugs.length} mục thuốc vào cơ sở dữ liệu.`,
      });
    } catch (error) {
      console.error("Lỗi khi lưu dữ liệu vào Supabase:", error);
      toast({
        title: "Lỗi đồng bộ",
        description: "Không thể lưu dữ liệu. Vui lòng thử lại.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = xlsx.read(data, { type: "array", cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = xlsx.utils.sheet_to_json<any>(worksheet);

          const vietnameseToEnglishKeyMap: Record<string, keyof DrugData> = Object.entries(
            COLUMN_HEADERS
          ).reduce((acc, [key, value]) => {
            acc[value] = key as keyof DrugData;
            return acc;
          }, {} as Record<string, keyof DrugData>);

          const importedDrugs: DrugData[] = jsonData.map((row) => {
            const newDrug: Partial<DrugData> = {};
            for (const vietnameseHeader in row) {
              if (Object.prototype.hasOwnProperty.call(row, vietnameseHeader)) {
                const englishKey = vietnameseToEnglishKeyMap[vietnameseHeader.trim()];
                if (englishKey) {
                  let value = row[vietnameseHeader];
                  if (englishKey === 'id' || englishKey === 'quantity' || englishKey === 'unitPrice') {
                    const numValue = parseFloat(String(value));
                    newDrug[englishKey] = isNaN(numValue) ? 0 : numValue;
                  } else if (englishKey === 'expiryDate' || englishKey === 'kqlcntUploadDate' || englishKey === 'decisionDate') {
                    if (value instanceof Date) {
                      const day = String(value.getDate()).padStart(2, '0');
                      const month = String(value.getMonth() + 1).padStart(2, '0');
                      const year = value.getFullYear();
                      newDrug[englishKey] = `${day}/${month}/${year}`;
                    } else {
                      newDrug[englishKey] = String(value || ""); 
                    }
                  } 
                   else {
                    newDrug[englishKey] = String(value || ""); 
                  }
                }
              }
            }

            const completeDrug: DrugData = {
              id: Number(newDrug.id || 0),
              drugName: String(newDrug.drugName || ""),
              activeIngredient: String(newDrug.activeIngredient || ""),
              concentration: String(newDrug.concentration || ""),
              gdklh: String(newDrug.gdklh || ""),
              routeOfAdministration: String(newDrug.routeOfAdministration || ""),
              dosageForm: String(newDrug.dosageForm || ""),
              expiryDate: String(newDrug.expiryDate || ""),
              manufacturer: String(newDrug.manufacturer || ""),
              manufacturingCountry: String(newDrug.manufacturingCountry || ""),
              packaging: String(newDrug.packaging || ""),
              unit: String(newDrug.unit || ""),
              quantity: Number(newDrug.quantity || 0),
              unitPrice: Number(newDrug.unitPrice || 0),
              drugGroup: String(newDrug.drugGroup || ""),
              tbmt: String(newDrug.tbmt || ""),
              investor: String(newDrug.investor || ""),
              contractorSelectionMethod: String(newDrug.contractorSelectionMethod || ""),
              kqlcntUploadDate: String(newDrug.kqlcntUploadDate || ""),
              decisionNumber: String(newDrug.decisionNumber || ""),
              decisionDate: String(newDrug.decisionDate || ""),
              contractorNumber: String(newDrug.contractorNumber || ""),
              location: String(newDrug.location || ""),
            };
            return completeDrug;
          }).filter(drug => drug.id > 0);

          if (importedDrugs.length === 0) {
            toast({
              title: "Không có dữ liệu hợp lệ",
              description: "File Excel không chứa thuốc nào có STT (ID) hợp lệ. Vui lòng kiểm tra lại.",
              variant: "destructive"
            });
            setIsProcessing(false);
            return;
          }

          toast({
            title: "Đã xử lý file Excel",
            description: `Tìm thấy ${importedDrugs.length} mục thuốc hợp lệ. Bắt đầu đồng bộ cơ sở dữ liệu...`,
          });
          
          await saveDrugsToSupabase(importedDrugs);
          setAllDrugs(prevDrugs => {
            const drugsMap = new Map<number, DrugData>();
            prevDrugs.forEach(drug => drugsMap.set(drug.id, drug));
            importedDrugs.forEach(drug => drugsMap.set(drug.id, drug));
            return Array.from(drugsMap.values());
          });
          
        } catch (error) {
          console.error("Lỗi khi nhập file Excel:", error);
          toast({
            title: "Lỗi nhập Excel",
            description: "Không thể xử lý file Excel. Vui lòng kiểm tra định dạng và nội dung file.",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false); 
          setSearchTerm("");
          setAdvancedFilters({});
          setShowAdvancedFilters(false);
          setCurrentPage(1);
        }
      };
      reader.onerror = () => {
          console.error("Lỗi khi đọc file.");
          toast({
            title: "Lỗi đọc file",
            description: "Không thể đọc file đã chọn.",
            variant: "destructive",
          });
          setIsProcessing(false);
      };
      reader.readAsArrayBuffer(file);
      event.target.value = ''; 
    } else {
      setIsProcessing(false); 
    }
  };


  const handleDeleteAllData = async () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa TẤT CẢ dữ liệu thuốc không? Hành động này không thể hoàn tác.")) {
      setIsProcessing(true);
      try {
        if (allDrugs.length === 0) {
          toast({
            title: "Thông báo",
            description: "Không có dữ liệu để xóa.",
          });
          setIsProcessing(false);
          return;
        }

        await deleteAllDrugs();
        setAllDrugs([]);
        setSearchTerm("");
        setAdvancedFilters({});
        setShowAdvancedFilters(false);
        setCurrentPage(1);
        toast({
          title: "Thành công",
          description: "Đã xóa tất cả dữ liệu thuốc khỏi cơ sở dữ liệu.",
        });
      } catch (error) {
        console.error("Lỗi khi xóa dữ liệu từ Supabase:", error);
        toast({
          title: "Lỗi",
          description: "Không thể xóa dữ liệu từ Supabase. Vui lòng thử lại.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };


  const handleSort = (key: keyof DrugData) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const handleAdvancedFilterChange = (key: keyof DrugData, value: string) => {
    setAdvancedFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const toggleAdvancedFilters = () => {
    setShowAdvancedFilters(prev => !prev);
  };

  const clearAdvancedFilters = () => {
    setAdvancedFilters({});
    setCurrentPage(1);
  };

  const filteredAndSortedData = useMemo(() => {
    let data = [...allDrugs];

    // Lọc theo tìm kiếm chung
    if (searchTerm.trim() !== "") {
      data = data.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    // Lọc theo bộ lọc nâng cao
    const activeAdvancedFilters = Object.entries(advancedFilters).filter(([, value]) => value && value.trim() !== "");
    if (activeAdvancedFilters.length > 0) {
      data = data.filter((item) => {
        return activeAdvancedFilters.every(([key, filterValue]) => {
          const itemValue = item[key as keyof DrugData];
          if (filterValue === "" || filterValue === "all") return true; 
          
          if (typeof itemValue === 'number' && key === 'unitPrice') {
            return itemValue === Number(filterValue);
          }

          return String(itemValue).toLowerCase().includes(filterValue.toLowerCase().trim());
        });
      });
    }


    // Sắp xếp
    if (sortConfig !== null) {
      data.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return data;
  }, [allDrugs, searchTerm, sortConfig, advancedFilters]);

  const uniqueDosageForms = useMemo(() => {
    const forms = new Set(allDrugs.map(drug => drug.dosageForm).filter(form => form && form.trim() !== ""));
    return Array.from(forms).sort();
  }, [allDrugs]);
  
  const uniqueDrugGroups = useMemo(() => {
    const groups = new Set(allDrugs.map(drug => drug.drugGroup).filter(group => group && group.trim() !== ""));
    return Array.from(groups).sort();
  }, [allDrugs]);
  
  const uniqueConcentrations = useMemo(() => {
    const concentrations = new Set(allDrugs.map(drug => drug.concentration).filter(c => c && c.trim() !== ""));
    return Array.from(concentrations).sort();
  }, [allDrugs]);


  const pageCount = Math.ceil(filteredAndSortedData.length / ITEMS_PER_PAGE);
  const drugsOnPage = filteredAndSortedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
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
  
  const { minPrice, maxPrice, tbmtOfMaxPriceDrug } = useMemo(() => {
    if (filteredAndSortedData.length === 0) {
      return { minPrice: null, maxPrice: null, tbmtOfMaxPriceDrug: null };
    }
    let min = Infinity;
    let max = -Infinity;
    let maxDrugTbmt: string | null = null;
    
    filteredAndSortedData.forEach(drug => {
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
  }, [filteredAndSortedData]);


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
          Phần mềm tham khảo và tra cứu giá thuốc toàn diện.
        </p>
      </header>

      <div className="mb-6 flex flex-col gap-4 p-4 bg-card shadow-md rounded-lg border">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm kiếm nhanh trong bảng..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 w-full text-sm rounded-md shadow-sm focus:ring-primary focus:border-primary"
              aria-label="Tìm kiếm nhanh"
              disabled={isLoadingData || isProcessing}
            />
          </div>
          
          <Button
            onClick={toggleAdvancedFilters}
            variant="outline"
            className="w-full md:w-auto shadow-sm border-primary text-primary hover:bg-primary/10 flex-shrink-0"
            aria-label="Mở/Đóng bộ lọc nâng cao"
            disabled={isLoadingData || isProcessing}
          >
            <Filter className="mr-2 h-5 w-5" />
            Bộ lọc nâng cao
          </Button>
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
                disabled={isLoadingData || isProcessing || Object.keys(advancedFilters).length === 0}
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
                      onValueChange={(value) => handleAdvancedFilterChange(key, value === "all" ? "" : value)}
                      disabled={isLoadingData || isProcessing}
                    >
                      <SelectTrigger className="w-full text-sm rounded-md shadow-sm focus:ring-primary focus:border-primary">
                        <SelectValue placeholder={`Lọc theo ${COLUMN_HEADERS[key]}...`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả dạng bào chế</SelectItem>
                        {uniqueDosageForms.map(form => (
                          <SelectItem key={form} value={form}>{form}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : key === 'drugGroup' ? (
                     <Select
                      value={advancedFilters[key] || ""}
                      onValueChange={(value) => handleAdvancedFilterChange(key, value === "all" ? "" : value)}
                      disabled={isLoadingData || isProcessing}
                    >
                      <SelectTrigger className="w-full text-sm rounded-md shadow-sm focus:ring-primary focus:border-primary">
                        <SelectValue placeholder={`Lọc theo ${COLUMN_HEADERS[key]}...`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả nhóm thuốc</SelectItem>
                        {uniqueDrugGroups.map(group => (
                          <SelectItem key={group} value={group}>{group}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : key === 'concentration' ? (
                     <Select
                      value={advancedFilters[key] || ""}
                      onValueChange={(value) => handleAdvancedFilterChange(key, value === "all" ? "" : value)}
                      disabled={isLoadingData || isProcessing}
                    >
                      <SelectTrigger className="w-full text-sm rounded-md shadow-sm focus:ring-primary focus:border-primary">
                        <SelectValue placeholder={`Lọc theo ${COLUMN_HEADERS[key]}...`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả nồng độ</SelectItem>
                        {uniqueConcentrations.map(c => (
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
                      onChange={(e) => handleAdvancedFilterChange(key, e.target.value)}
                      className="w-full text-sm rounded-md shadow-sm focus:ring-primary focus:border-primary"
                      disabled={isLoadingData || isProcessing}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-4 flex flex-col md:flex-row gap-2 items-center">
           <Input
            id="excel-upload"
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="hidden" 
            aria-labelledby="excel-upload-label"
            disabled={isLoadingData || isProcessing}
          />
          <Button asChild variant="outline" className="shadow-sm w-full md:w-auto border-primary text-primary hover:bg-primary/10" disabled={isLoadingData || isProcessing}>
            <label htmlFor="excel-upload" id="excel-upload-label" className={`cursor-pointer flex items-center justify-center ${isLoadingData || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {isProcessing && !isLoadingData ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Upload className="mr-2 h-5 w-5" />}
              {isProcessing && !isLoadingData ? "Đang xử lý..." : "Nhập từ Excel"}
            </label>
          </Button>

          <Button
            onClick={() => setIsAISuggesterOpen(true)}
            variant="outline"
            className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground border-accent hover:border-accent/90 shadow-sm"
            aria-label="Mở công cụ gợi ý thuốc AI"
            disabled={isLoadingData || isProcessing}
          >
            <Lightbulb className="mr-2 h-5 w-5" />
            Gợi ý thuốc AI
          </Button>

          <Button
            onClick={handleDeleteAllData}
            variant="destructive"
            className="w-full md:w-auto shadow-sm"
            aria-label="Xóa tất cả dữ liệu"
            disabled={isLoadingData || isProcessing || allDrugs.length === 0}
          >
            {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Trash2 className="mr-2 h-5 w-5" />}
            Xóa tất cả dữ liệu
          </Button>
        </div>
      </div>
      
      <main>
        {isLoadingData && (
          <div className="flex flex-col justify-center items-center my-10 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-lg text-muted-foreground">Đang tải dữ liệu từ Supabase...</p>
              <p className="text-sm text-muted-foreground">
                Đang tải {loadingProgress}% dữ liệu (201,000 bản ghi)
              </p>
            </div>
            {loadingProgress > 0 && (
              <div className="w-full max-w-md bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
            )}
          </div>
        )}
        {!isLoadingData && (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              Tìm thấy {filteredAndSortedData.length} kết quả.
            </div>
            {filteredAndSortedData.length > 0 && (
              <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-card shadow-md rounded-lg border">
                <div className="flex items-center gap-2 p-3 rounded-md bg-secondary/30">
                  <TrendingDown className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Đơn giá nhỏ nhất (lọc hiện tại)</p>
                    <p className="text-xl font-bold text-primary">
                      {formatNumberWithThousandSeparator(minPrice)} VNĐ
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-md bg-secondary/30">
                  <TrendingUp className="h-6 w-6 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">Đơn giá lớn nhất (lọc hiện tại)</p>
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
              data={drugsOnPage}
              sortConfig={sortConfig}
              handleSort={handleSort}
            />
            {pageCount > 1 && (
                <div className="mt-4">
                    <DataTablePagination
                        pageCount={pageCount}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                        itemCount={filteredAndSortedData.length}
                    />
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
        <p>&copy; {new Date().getFullYear()} PharmaPrice Navigator. Phát triển bởi Firebase Studio.</p>
      </footer>
    </div>
  );
}
