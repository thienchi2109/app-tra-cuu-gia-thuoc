
"use client";

import type { DrugData, SortConfig } from "@/types";
import { COLUMN_HEADERS } from "@/types";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

interface DrugDataTableProps {
  data: DrugData[];
  sortConfig: SortConfig;
  handleSort: (key: keyof DrugData) => void;
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

const DrugDataTable: React.FC<DrugDataTableProps> = ({
  data,
  sortConfig,
  handleSort,
}) => {
  const formatNumberWithThousandSeparator = (value: number | string) => {
    const num = Number(value);
    if (isNaN(num)) {
      return String(value); // Return original if not a valid number
    }
    return num.toLocaleString('vi-VN'); // Uses dot as thousand separator for Vietnamese locale
  };

  const displayedColumnHeaders = Object.keys(COLUMN_HEADERS) as Array<keyof DrugData>;

  return (
    <div className="rounded-lg border shadow-md overflow-hidden bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {displayedColumnHeaders.map((key) => (
                <TableHead 
                  key={key} 
                  className={cn(
                    "px-4 py-3 text-sm font-medium text-card-foreground",
                    !WRAPPABLE_COLUMNS.includes(key) && "whitespace-nowrap"
                  )}
                >
                  <Button
                    variant="ghost"
                    onClick={() => handleSort(key)}
                    className="px-2 py-1 h-auto hover:bg-accent/50"
                    aria-label={`Sắp xếp theo ${COLUMN_HEADERS[key]}`}
                  >
                    {COLUMN_HEADERS[key]}
                    {sortConfig?.key === key && (
                      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortConfig.direction === "ascending" ? "" : "transform rotate-180"}`} />
                    )}
                    {sortConfig?.key !== key && (
                       <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />
                    )}
                  </Button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/50">
                  {displayedColumnHeaders.map((key) => (
                    <TableCell 
                      key={`${row.id}-${key}`} 
                      className={cn(
                        "px-4 py-3 text-sm text-card-foreground align-top",
                        WRAPPABLE_COLUMNS.includes(key) 
                          ? "whitespace-normal max-w-64"
                          : "whitespace-nowrap"
                      )}
                    >
                      {key === 'quantity' || key === 'unitPrice'
                        ? formatNumberWithThousandSeparator(row[key])
                        : String(row[key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={displayedColumnHeaders.length} className="h-24 text-center text-card-foreground">
                  Không tìm thấy kết quả nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DrugDataTable;
