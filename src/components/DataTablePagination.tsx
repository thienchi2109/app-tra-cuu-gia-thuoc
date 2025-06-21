
"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";

interface DataTablePaginationProps {
  pageCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  itemCount: number;
  pageSize?: number;
}

export function DataTablePagination({
  pageCount,
  currentPage,
  onPageChange,
  itemCount,
  pageSize,
}: DataTablePaginationProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-card rounded-lg border shadow-sm">
      <div className="flex-1 text-sm text-muted-foreground">
        {pageSize ? (
          <>Hiển thị {((currentPage - 1) * pageSize + 1).toLocaleString('vi-VN')} - {Math.min(currentPage * pageSize, itemCount).toLocaleString('vi-VN')} trong tổng số {itemCount.toLocaleString('vi-VN')} dòng</>
        ) : (
          <>Tổng cộng {itemCount.toLocaleString('vi-VN')} dòng.</>
        )}
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center justify-center text-sm font-medium">
          Trang {currentPage} của {pageCount}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
          >
            <span className="sr-only">Về trang đầu</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <span className="sr-only">Trang trước</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= pageCount}
          >
            <span className="sr-only">Trang sau</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => onPageChange(pageCount)}
            disabled={currentPage >= pageCount}
          >
            <span className="sr-only">Tới trang cuối</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
