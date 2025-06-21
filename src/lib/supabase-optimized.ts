import { createClient } from '@supabase/supabase-js';
import type { SupabaseDrugData, DrugData } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Convert Supabase data to UI data format
export function transformSupabaseToUI(data: SupabaseDrugData): DrugData {
  return {
    id: data.id,
    drugName: data.ten_thuoc || '',
    activeIngredient: data.ten_hoat_chat || '',
    concentration: data.nong_do || '',
    gdklh: data.gdk_lh || '',
    routeOfAdministration: data.duong_dung || '',
    dosageForm: data.dang_bao_che || '',
    expiryDate: data.han_dung || '',
    manufacturer: data.ten_cssx || '',
    manufacturingCountry: data.nuoc_san_xuat || '',
    packaging: data.quy_cach || '',
    unit: data.don_vi_tinh || '',
    quantity: data.so_luong || 0,
    unitPrice: data.don_gia || 0,
    drugGroup: data.nhom_thuoc || '',
    tbmt: data.ma_tbmt || '',
    investor: data.chu_dau_tu || '',
    contractorSelectionMethod: data.hinh_thuc_lcnt || '',
    kqlcntUploadDate: data.ngay_dang_tai || '',
    decisionNumber: data.so_quyet_dinh || '',
    decisionDate: data.ngay_ban_hanh || '',
    contractorNumber: data.so_nha_thau || '',
    location: data.dia_diem || '',
  };
}

// Fast initial load - just get first page
export async function fetchInitialDrugs(limit: number = 100): Promise<{
  data: DrugData[];
  count: number;
}> {
  try {
    const { data, error, count } = await supabase
      .from('danh_muc_thuoc')
      .select('*', { count: 'exact' })
      .order('id', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return {
      data: data?.map(transformSupabaseToUI) || [],
      count: count || 0
    };
  } catch (error) {
    console.error('Error fetching initial drugs:', error);
    throw error;
  }
}

// Real-time search with server-side filtering
export async function searchDrugsRealtime(
  searchTerm: string,
  page: number = 1,
  limit: number = 100,
  sortBy?: keyof SupabaseDrugData,
  sortOrder: 'asc' | 'desc' = 'asc'
): Promise<{
  data: DrugData[];
  count: number;
  page: number;
  totalPages: number;
}> {
  try {
    let query = supabase
      .from('danh_muc_thuoc')
      .select('*', { count: 'exact' });

    // Add search filter if provided
    if (searchTerm && searchTerm.trim() !== '') {
      const term = searchTerm.trim();
      query = query.or(`ten_thuoc.ilike.%${term}%,ten_hoat_chat.ilike.%${term}%,nhom_thuoc.ilike.%${term}%,ten_cssx.ilike.%${term}%,ma_tbmt.ilike.%${term}%`);
    }

    // Add sorting
    const sortColumn = sortBy || 'id';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    // Add pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Search error:', error);
      throw error;
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return {
      data: data?.map(transformSupabaseToUI) || [],
      count: count || 0,
      page,
      totalPages
    };
  } catch (error) {
    console.error('Error searching drugs:', error);
    throw error;
  }
}

// Advanced filter search
export async function searchWithAdvancedFilters(
  searchTerm: string = '',
  filters: Record<string, string> = {},
  page: number = 1,
  limit: number = 100,
  sortBy?: keyof SupabaseDrugData,
  sortOrder: 'asc' | 'desc' = 'asc'
): Promise<{
  data: DrugData[];
  count: number;
  page: number;
  totalPages: number;
}> {
  try {
    let query = supabase
      .from('danh_muc_thuoc')
      .select('*', { count: 'exact' });

    // Add basic search
    if (searchTerm && searchTerm.trim() !== '') {
      const term = searchTerm.trim();
      query = query.or(`ten_thuoc.ilike.%${term}%,ten_hoat_chat.ilike.%${term}%,nhom_thuoc.ilike.%${term}%,ten_cssx.ilike.%${term}%`);
    }

    // Add advanced filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        // Map UI filter keys to database column names
        const columnMap: Record<string, keyof SupabaseDrugData> = {
          drugName: 'ten_thuoc',
          activeIngredient: 'ten_hoat_chat',
          concentration: 'nong_do',
          dosageForm: 'dang_bao_che',
          drugGroup: 'nhom_thuoc',
          tbmt: 'ma_tbmt',
          investor: 'chu_dau_tu',
          unitPrice: 'don_gia'
        };

        const dbColumn = columnMap[key as keyof typeof columnMap];
        if (dbColumn) {
          if (key === 'unitPrice') {
            // Handle numeric filters
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              query = query.eq(dbColumn, numValue);
            }
          } else {
            // Handle text filters
            query = query.ilike(dbColumn, `%${value.trim()}%`);
          }
        }
      }
    });

    // Add sorting
    const sortColumn = sortBy || 'id';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    // Add pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Advanced search error:', error);
      throw error;
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return {
      data: data?.map(transformSupabaseToUI) || [],
      count: count || 0,
      page,
      totalPages
    };
  } catch (error) {
    console.error('Error in advanced search:', error);
    throw error;
  }
}

// Get unique values for filter dropdowns (with limit to avoid slowness)
export async function getUniqueValues(column: keyof SupabaseDrugData, limit: number = 50): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('danh_muc_thuoc')
      .select(column)
      .not(column, 'is', null)
      .not(column, 'eq', '')
      .order(column, { ascending: true })
      .limit(limit);

    if (error) {
      console.error(`Error fetching unique ${column}:`, error);
      return [];
    }

    const unique = [...new Set(data?.map(item => (item as any)[column]?.toString().trim()).filter(Boolean))];
    return unique.slice(0, limit);
  } catch (error) {
    console.error(`Error getting unique values for ${column}:`, error);
    return [];
  }
}

// Get database statistics (fast query)
export async function getDatabaseStats(): Promise<{
  totalDrugs: number;
  avgPrice: number;
  maxPrice: number;
  minPrice: number;
}> {
  try {
    // Get count
    const { count } = await supabase
      .from('danh_muc_thuoc')
      .select('*', { count: 'exact', head: true });

    // Get price statistics with aggregation
    const { data: priceStats } = await supabase
      .from('danh_muc_thuoc')
      .select('don_gia')
      .not('don_gia', 'is', null)
      .order('don_gia', { ascending: false })
      .limit(1);

    const { data: minPriceData } = await supabase
      .from('danh_muc_thuoc')
      .select('don_gia')
      .not('don_gia', 'is', null)
      .order('don_gia', { ascending: true })
      .limit(1);

    return {
      totalDrugs: count || 0,
      avgPrice: 0, // Could implement if needed
      maxPrice: priceStats?.[0]?.don_gia || 0,
      minPrice: minPriceData?.[0]?.don_gia || 0,
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return {
      totalDrugs: 0,
      avgPrice: 0,
      maxPrice: 0,
      minPrice: 0,
    };
  }
}

// Cache for search results (simple in-memory cache)
const searchCache = new Map<string, any>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function getCachedSearch(key: string): any | null {
  const cached = searchCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

export function setCachedSearch(key: string, data: any): void {
  searchCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// Debounced search function
export function createDebouncedSearch(delay: number = 300) {
  let timeoutId: NodeJS.Timeout;
  
  return function<T extends any[]>(
    func: (...args: T) => Promise<any>,
    ...args: T
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        try {
          const result = await func(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
} 