import { useState, useCallback } from 'react';
import { DrugData, SortConfig, COLUMN_HEADERS } from '@/types';
import { exportSelectedRows } from '@/lib/supabase-optimized';
import { formatDateToVietnamese, formatNumberWithThousandSeparator } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface UseExportSelectedProps {
  sortConfig: SortConfig;
  onSuccess?: (count: number) => void;
  onError?: (error: string) => void;
}

export function useExportSelected({ sortConfig, onSuccess, onError }: UseExportSelectedProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportSelected = useCallback(async (selectedIds: Set<number>) => {
    if (selectedIds.size === 0) {
      onError?.('Vui lòng chọn ít nhất một dòng để xuất Excel');
      return;
    }

    setIsExporting(true);
    try {
      // Convert Set to Array
      const idsArray = Array.from(selectedIds);
      
      // Determine sort column and direction
      let sortColumn: string | undefined;
      let sortDirection: 'asc' | 'desc' = 'asc';
      
      if (sortConfig?.key) {
        // Map UI column names to database column names
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
        
        sortColumn = columnMap[sortConfig.key];
        sortDirection = sortConfig.direction === 'ascending' ? 'asc' : 'desc';
      }

      // Export selected rows
      const exportResult = await exportSelectedRows(idsArray, sortColumn, sortDirection);
      
      if (exportResult.data.length === 0) {
        onError?.('Không tìm thấy dữ liệu cho các dòng đã chọn');
        return;
      }

      // Prepare data for Excel with proper formatting
      const excelData = exportResult.data.map(row => {
        const formattedRow: any = {};
        
        // Map each field with proper formatting
        Object.keys(COLUMN_HEADERS).forEach(key => {
          const typedKey = key as keyof DrugData;
          let value = row[typedKey];
          
          // Apply formatting based on field type
          if (typedKey === 'quantity' || typedKey === 'unitPrice') {
            value = formatNumberWithThousandSeparator(value as number);
          } else if (typedKey === 'kqlcntUploadDate' || typedKey === 'decisionDate' || typedKey === 'expiryDate') {
            value = formatDateToVietnamese(String(value));
          }
          
          formattedRow[COLUMN_HEADERS[typedKey]] = value;
        });
        
        return formattedRow;
      });

      // Create Excel workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths for better readability
      const columnWidths = [
        { wch: 8 },   // STT
        { wch: 30 },  // Tên thuốc
        { wch: 25 },  // Tên hoạt chất
        { wch: 15 },  // Nồng độ
        { wch: 12 },  // GĐKLH
        { wch: 15 },  // Đường dùng
        { wch: 15 },  // Dạng bào chế
        { wch: 12 },  // Hạn dùng
        { wch: 25 },  // Tên cơ sở sản xuất
        { wch: 15 },  // Nước sản xuất
        { wch: 20 },  // Quy cách đóng gói
        { wch: 12 },  // Đơn vị tính
        { wch: 15 },  // Số lượng
        { wch: 15 },  // Đơn giá
        { wch: 15 },  // Nhóm thuốc
        { wch: 15 },  // TBMT
        { wch: 25 },  // Chủ đầu tư
        { wch: 20 },  // Hình thức lựa chọn nhà thầu
        { wch: 18 },  // Ngày đăng tải KQLCNT
        { wch: 15 },  // Số quyết định
        { wch: 15 },  // Ngày ban hành quyết định
        { wch: 12 },  // Số nhà thầu
        { wch: 15 },  // Địa điểm
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Dữ liệu đã chọn');

      // Generate filename with timestamp and count
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
      const filename = `TraCuuGiaThuoc_DaChon_${exportResult.data.length}dong_${timestamp}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filename);

      console.log(`✅ Export successful: ${exportResult.data.length} rows exported to ${filename}`);
      onSuccess?.(exportResult.data.length);

    } catch (error) {
      console.error('❌ Export selected rows error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi xuất Excel';
      onError?.(errorMessage);
    } finally {
      setIsExporting(false);
    }
  }, [sortConfig, onSuccess, onError]);

  return {
    exportSelected,
    isExporting,
  };
} 