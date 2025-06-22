import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date from yyyy-mm-dd to dd/mm/yyyy (Vietnamese format)
 * @param dateString - Date string in format yyyy-mm-dd or yyyy/mm/dd
 * @returns Formatted date string in dd/mm/yyyy format, or original string if invalid
 */
export function formatDateToVietnamese(dateString: string): string {
  if (!dateString) return dateString;
  
  // Try to parse the date string
  // Handle both yyyy-mm-dd and yyyy/mm/dd formats
  const cleanDateString = dateString.replace(/\//g, '-');
  
  // Check if it matches yyyy-mm-dd pattern
  const dateMatch = cleanDateString.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    // Pad month and day with leading zeros if needed
    const paddedMonth = month.padStart(2, '0');
    const paddedDay = day.padStart(2, '0');
    return `${paddedDay}/${paddedMonth}/${year}`;
  }
  
  // If already in dd/mm/yyyy format or other format, return as is
  return dateString;
}

/**
 * Format number with Vietnamese thousand separators
 * @param value - Number or string to format
 * @returns Formatted string with Vietnamese locale
 */
export function formatNumberWithThousandSeparator(value: number | string): string {
  const num = Number(value);
  if (isNaN(num)) {
    return String(value);
  }
  return num.toLocaleString('vi-VN');
}
