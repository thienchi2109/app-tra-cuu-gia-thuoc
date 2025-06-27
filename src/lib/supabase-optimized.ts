import { createClient } from '@supabase/supabase-js';
import type { SupabaseDrugData, DrugData } from '@/types';
import type { AdvancedSearchConfig, SearchCondition } from '@/components/AdvancedSearchBuilder';

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

// Advanced search with complex conditions
export async function searchWithAdvancedConditions(
  searchTerm: string = '',
  advancedConfig: AdvancedSearchConfig,
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

    // Map UI field names to database column names
    const fieldMap: Record<keyof DrugData, keyof SupabaseDrugData> = {
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
      location: 'dia_diem'
    };

    // Helper function to build condition string
    const buildCondition = (condition: SearchCondition): string => {
      const dbField = fieldMap[condition.field];
      const value = condition.value.trim();
      
      if (!value) return '';

      switch (condition.operator) {
        case 'contains':
          return `${dbField}.ilike.%${value}%`;
        case 'equals':
          if (condition.field === 'unitPrice') {
            return `${dbField}.eq.${value}`;
          }
          return `${dbField}.eq.${value}`;
        case 'greater_than':
          return `${dbField}.gt.${value}`;
        case 'less_than':
          return `${dbField}.lt.${value}`;
        default:
          return `${dbField}.ilike.%${value}%`;
      }
    };

    // Build include conditions
    if (advancedConfig.includeConditions.length > 0) {
      const includeConditions = advancedConfig.includeConditions
        .map(buildCondition)
        .filter(c => c !== '');
      
      if (advancedConfig.includeLogic === 'AND') {
        // For AND logic, we need to chain multiple filters
        includeConditions.forEach(condition => {
          const [field, operator, value] = condition.split('.');
          switch (operator) {
            case 'ilike':
              query = query.ilike(field, value);
              break;
            case 'eq':
              query = query.eq(field, value);
              break;
            case 'gt':
              query = query.gt(field, value);
              break;
            case 'lt':
              query = query.lt(field, value);
              break;
          }
        });
      } else {
        // For OR logic, use the or() method
        query = query.or(includeConditions.join(','));
      }
    }

    // Build exclude conditions (always OR logic)
    if (advancedConfig.excludeConditions.length > 0) {
      const excludeConditions = advancedConfig.excludeConditions
        .map(buildCondition)
        .filter(c => c !== '');
      
      if (excludeConditions.length > 0) {
        // Use not() with or() for exclusions - need to negate the OR condition
        excludeConditions.forEach(condition => {
          const [field, operator, value] = condition.split('.');
          switch (operator) {
            case 'ilike':
              query = query.not(field, 'ilike', value);
              break;
            case 'eq':
              query = query.not(field, 'eq', value);
              break;
            case 'gt':
              query = query.not(field, 'gt', value);
              break;
            case 'lt':
              query = query.not(field, 'lt', value);
              break;
          }
        });
      }
    }

    // Add basic search if provided and no advanced conditions
    if (searchTerm && searchTerm.trim() !== '' && 
        advancedConfig.includeConditions.length === 0 && 
        advancedConfig.excludeConditions.length === 0) {
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
      console.error('Advanced conditions search error:', error);
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
    console.error('Error in advanced conditions search:', error);
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
// Export all search results (max 1000 for performance)
export async function exportSearchResults(
  searchTerm: string = '',
  advancedConfig: AdvancedSearchConfig,
  sortBy?: keyof SupabaseDrugData,
  sortOrder: 'asc' | 'desc' = 'asc',
  maxLimit: number = 1000,
  offset: number = 0
): Promise<{
  data: DrugData[];
  count: number;
  limited: boolean;
  actualStart: number;
  actualEnd: number;
}> {
  try {
    let query = supabase
      .from('danh_muc_thuoc')
      .select('*', { count: 'exact' });

    // Add basic search
    if (searchTerm && searchTerm.trim() !== '') {
      const term = searchTerm.trim();
      query = query.or(`ten_thuoc.ilike.%${term}%,ten_hoat_chat.ilike.%${term}%,nhom_thuoc.ilike.%${term}%,ten_cssx.ilike.%${term}%,ma_tbmt.ilike.%${term}%`);
    }

    // Build advanced conditions similar to searchWithAdvancedConditions
    const columnMap: Record<string, keyof SupabaseDrugData> = {
      drugName: 'ten_thuoc',
      activeIngredient: 'ten_hoat_chat',
      concentration: 'nong_do',
      dosageForm: 'dang_bao_che',
      drugGroup: 'nhom_thuoc',
      unitPrice: 'don_gia',
      tbmt: 'ma_tbmt',
      investor: 'chu_dau_tu',
    };

    const buildCondition = (condition: any): string => {
      const dbColumn = columnMap[condition.field as keyof typeof columnMap];
      if (!dbColumn) return '';

      const value = condition.value?.toString().trim();
      if (!value) return '';

      switch (condition.operator) {
        case 'contains':
          return `${dbColumn}.ilike.%${value}%`;
        case 'equals':
          return condition.field === 'unitPrice' ? `${dbColumn}.eq.${value}` : `${dbColumn}.eq.${value}`;
        case 'starts_with':
          return `${dbColumn}.ilike.${value}%`;
        case 'ends_with':
          return `${dbColumn}.ilike.%${value}`;
        case 'greater_than':
          return `${dbColumn}.gt.${value}`;
        case 'less_than':
          return `${dbColumn}.lt.${value}`;
        case 'greater_equal':
          return `${dbColumn}.gte.${value}`;
        case 'less_equal':
          return `${dbColumn}.lte.${value}`;
        default:
          return `${dbColumn}.ilike.%${value}%`;
      }
    };

    // Add include conditions (AND logic)
    if (advancedConfig.includeConditions?.length > 0) {
      const includeConditions = advancedConfig.includeConditions
        .map(buildCondition)
        .filter(Boolean);
      
      includeConditions.forEach(condition => {
        if (condition.includes('.ilike.')) {
          const [column, value] = condition.split('.ilike.');
          query = query.ilike(column, value);
        } else if (condition.includes('.eq.')) {
          const [column, value] = condition.split('.eq.');
          query = query.eq(column, value);
        } else if (condition.includes('.gt.')) {
          const [column, value] = condition.split('.gt.');
          query = query.gt(column, parseFloat(value));
        } else if (condition.includes('.lt.')) {
          const [column, value] = condition.split('.lt.');
          query = query.lt(column, parseFloat(value));
        } else if (condition.includes('.gte.')) {
          const [column, value] = condition.split('.gte.');
          query = query.gte(column, parseFloat(value));
        } else if (condition.includes('.lte.')) {
          const [column, value] = condition.split('.lte.');
          query = query.lte(column, parseFloat(value));
        }
      });
    }

    // Add exclude conditions (NOT logic)
    if (advancedConfig.excludeConditions?.length > 0) {
      const excludeConditions = advancedConfig.excludeConditions
        .map(buildCondition)
        .filter(Boolean);

      excludeConditions.forEach(condition => {
        if (condition.includes('.ilike.')) {
          const [column, value] = condition.split('.ilike.');
          query = query.not(column, 'ilike', value);
        } else if (condition.includes('.eq.')) {
          const [column, value] = condition.split('.eq.');
          query = query.not(column, 'eq', value);
        }
      });
    }

    // Add sorting
    const sortColumn = sortBy || 'id';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    // Add offset and limit
    query = query.range(offset, offset + maxLimit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Export search error:', error);
      throw error;
    }

    const totalCount = count || 0;
    const limited = totalCount > (offset + maxLimit);
    const actualStart = offset + 1;
    const actualEnd = Math.min(offset + maxLimit, totalCount);

    return {
      data: data?.map(transformSupabaseToUI) || [],
      count: totalCount,
      limited,
      actualStart,
      actualEnd
    };
  } catch (error) {
    console.error('Error exporting search results:', error);
    throw error;
  }
}

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

// Authentication functions
export async function authenticateUser(username: string, password: string): Promise<{ success: boolean; user?: any; message?: string }> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, name, created_at') // Chỉ select các field cần thiết, không lấy password
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, message: 'Sai tên đăng nhập hoặc mật khẩu' };
      }
      console.error('Authentication error:', error);
      return { success: false, message: 'Lỗi hệ thống' };
    }

    return { 
      success: true, 
      user: {
        id: data.id,
        username: data.username,
        name: data.name, // Tên tiếng Việt có dấu
        created_at: data.created_at
      }
    };
  } catch (error) {
    console.error('Authentication exception:', error);
    return { success: false, message: 'Lỗi hệ thống' };
  }
}

export async function createUsersTable(): Promise<{ success: boolean; message: string }> {
  try {
    // Note: This would typically be done via Supabase SQL editor
    // We'll just return instructions for manual creation
    return {
      success: false,
      message: 'Vui lòng tạo bảng users trong Supabase SQL Editor với câu lệnh: CREATE TABLE users (id SERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW());'
    };
  } catch (error) {
    console.error('Error creating users table:', error);
    return { success: false, message: 'Lỗi tạo bảng users' };
  }
}

/**
 * Export selected rows by their IDs
 * @param selectedIds - Array of selected row IDs
 * @param sortColumn - Column to sort by (optional)
 * @param sortDirection - Sort direction (optional)
 * @returns Promise with selected data
 */
export async function exportSelectedRows(
  selectedIds: number[],
  sortColumn?: string,
  sortDirection: 'asc' | 'desc' = 'asc'
) {
  try {
    console.log(`🔍 Exporting ${selectedIds.length} selected rows...`);
    
    if (selectedIds.length === 0) {
      throw new Error('Không có dòng nào được chọn để xuất');
    }

    // Build query for selected IDs
    let query = supabase
      .from('danh_muc_thuoc')
      .select('*')
      .in('id', selectedIds);

    // Apply sorting if specified
    if (sortColumn) {
      query = query.order(sortColumn, { ascending: sortDirection === 'asc' });
    } else {
      // Default sort by ID to maintain consistent order
      query = query.order('id', { ascending: true });
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error exporting selected rows:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('Không tìm thấy dữ liệu cho các dòng đã chọn');
    }

    console.log(`✅ Successfully exported ${data.length} selected rows`);

    // Transform data to match UI interface
    const transformedData = data.map(transformSupabaseToUI);

    return {
      data: transformedData,
      count: transformedData.length,
      selectedIds,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Export selected rows failed:', error);
    throw error;
  }
}



// Get statistics for search results (all matching records, not just current page)
export async function getSearchResultsStatistics(
  searchTerm: string = '',
  advancedConfig: AdvancedSearchConfig,
  sortBy?: keyof SupabaseDrugData,
  sortOrder: 'asc' | 'desc' = 'asc'
): Promise<{
  minPrice: number | null;
  maxPrice: number | null;
  averagePrice: number | null;
  medianPrice: number | null;
  tbmtOfMaxPriceDrug: string | null;
  totalCount: number;
}> {
  try {
    // Safety check for advancedConfig
    if (!advancedConfig) {
      console.warn('⚠️ advancedConfig is null/undefined, using default empty config');
      advancedConfig = { includeConditions: [], excludeConditions: [], includeLogic: 'AND' };
    }

    console.log('🔍 getSearchResultsStatistics called with:', {
      searchTerm,
      includeConditions: advancedConfig.includeConditions?.length || 0,
      excludeConditions: advancedConfig.excludeConditions?.length || 0,
      sortBy,
      sortOrder
    });

    // Build query - start simple and add conditions
    let query = supabase
      .from('danh_muc_thuoc')
      .select('don_gia, ma_tbmt', { count: 'exact' })
      .not('don_gia', 'is', null); // Filter out null prices

    // Add basic search - targeting multiple relevant fields
    if (searchTerm && searchTerm.trim() !== '') {
      const term = searchTerm.trim();
      console.log('🔍 Adding basic search for term for statistics:', term);
      query = query.or(
        `ten_thuoc.ilike.%${term}%,` +
        `ten_hoat_chat.ilike.%${term}%,` +
        `nhom_thuoc.ilike.%${term}%,` +
        `ten_cssx.ilike.%${term}%,` + // Manufacturer
        `ma_tbmt.ilike.%${term}%`     // TBMT code
      );
    }

    // Build advanced conditions
    const columnMap: Record<string, keyof SupabaseDrugData> = {
      drugName: 'ten_thuoc',
      activeIngredient: 'ten_hoat_chat',
      concentration: 'nong_do',
      dosageForm: 'dang_bao_che',
      drugGroup: 'nhom_thuoc',
      unitPrice: 'don_gia',
      tbmt: 'ma_tbmt',
      investor: 'chu_dau_tu',
      manufacturer: 'ten_cssx'
    };

    // Add include conditions
    if (advancedConfig.includeConditions && Array.isArray(advancedConfig.includeConditions) && advancedConfig.includeConditions.length > 0) {
      console.log('🔍 Adding include conditions:', advancedConfig.includeConditions.length);
      advancedConfig.includeConditions.forEach((condition, index) => {
        console.log(`  Include condition ${index}:`, condition);
        const column = columnMap[condition.field];
        if (column) {
          switch (condition.operator) {
            case 'contains':
              query = query.ilike(column, `%${condition.value}%`);
              break;
            case 'equals':
              if (condition.field === 'unitPrice') {
                query = query.eq(column, parseFloat(condition.value));
              } else {
                query = query.eq(column, condition.value);
              }
              break;
            case 'greater_than':
              query = query.gt(column, parseFloat(condition.value));
              break;
            case 'less_than':
              query = query.lt(column, parseFloat(condition.value));
              break;
          }
        }
      });
    }

    // Add exclude conditions
    if (advancedConfig.excludeConditions && Array.isArray(advancedConfig.excludeConditions) && advancedConfig.excludeConditions.length > 0) {
      console.log('🔍 Adding exclude conditions:', advancedConfig.excludeConditions.length);
      advancedConfig.excludeConditions.forEach((condition, index) => {
        console.log(`  Exclude condition ${index}:`, condition);
        const column = columnMap[condition.field];
        if (column) {
          switch (condition.operator) {
            case 'contains':
              query = query.not(column, 'ilike', `%${condition.value}%`);
              break;
            case 'equals':
              if (condition.field === 'unitPrice') {
                query = query.neq(column, parseFloat(condition.value));
              } else {
                query = query.neq(column, condition.value);
              }
              break;
            case 'greater_than':
              query = query.lte(column, parseFloat(condition.value));
              break;
            case 'less_than':
              query = query.gte(column, parseFloat(condition.value));
              break;
          }
        }
      });
    }

    // Apply sorting if specified (for consistency, though not needed for statistics)
    if (sortBy) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    // Check if we have search conditions
    const hasSearchConditions = (searchTerm && searchTerm.trim() !== '') || 
                                (advancedConfig.includeConditions?.length > 0) || 
                                (advancedConfig.excludeConditions?.length > 0);
    
    if (!hasSearchConditions) {
      console.log('⚠️ No search conditions, limiting to 1000 records for performance');
      query = query.limit(1000);
    }

    // Execute query to get ALL matching records (for accurate statistics)
    console.log('📊 Executing statistics query for', hasSearchConditions ? 'filtered results' : 'sample data');
    const { data, count, error } = await query;

    console.log('📊 Query result:', {
      dataLength: data?.length || 0,
      totalCount: count,
      hasError: !!error,
      errorMessage: error?.message || null,
      errorDetails: error?.details || null,
      errorHint: error?.hint || null,
      samplePrices: data?.slice(0, 3)?.map(r => r.don_gia)
    });

    if (error) {
      console.error('❌ Supabase query error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`Database query failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.log('📊 No data found for statistics');
      return {
        minPrice: null,
        maxPrice: null,
        averagePrice: null,
        medianPrice: null,
        tbmtOfMaxPriceDrug: null,
        totalCount: count || 0
      };
    }

    console.log('📊 Calculating statistics from', data.length, 'records out of', count, 'total matches');

    // Calculate statistics from ALL matching records
    const prices = data.map(row => row.don_gia).filter(price => price !== null && price !== undefined);
    
    if (prices.length === 0) {
      console.log('⚠️ No valid prices found');
      return {
        minPrice: null,
        maxPrice: null,
        averagePrice: null,
        medianPrice: null,
        tbmtOfMaxPriceDrug: null,
        totalCount: count || 0
      };
    }

    let min = Math.min(...prices);
    let max = Math.max(...prices);
    let sum = prices.reduce((acc, price) => acc + price, 0);
    let average = sum / prices.length;

    // Find TBMT of max price drug
    const maxPriceRow = data.find(row => row.don_gia === max);
    let tbmtOfMaxPriceDrug = maxPriceRow?.ma_tbmt || null;

    // Calculate median
    const sortedPrices = [...prices].sort((a, b) => a - b);
    let median = sortedPrices.length % 2 === 0
      ? (sortedPrices[sortedPrices.length / 2 - 1] + sortedPrices[sortedPrices.length / 2]) / 2
      : sortedPrices[Math.floor(sortedPrices.length / 2)];

    const result = {
      minPrice: min,
      maxPrice: max,
      averagePrice: average,
      medianPrice: median,
      tbmtOfMaxPriceDrug,
      totalCount: count || 0
    };

    console.log('✅ Statistics calculated successfully:', {
      ...result,
      source: hasSearchConditions ? 'filtered_results' : 'sample_data',
      recordsUsed: prices.length
    });
    return result;

  } catch (error) {
    console.error('❌ Error getting search results statistics:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      searchTerm,
      advancedConfigType: typeof advancedConfig
    });
    return {
      minPrice: null,
      maxPrice: null,
      averagePrice: null,
      medianPrice: null,
      tbmtOfMaxPriceDrug: null,
      totalCount: 0
    };
  }
} 