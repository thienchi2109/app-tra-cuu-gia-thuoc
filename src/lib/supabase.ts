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

// Convert UI data to Supabase data format
export function transformUIToSupabase(data: DrugData): Omit<SupabaseDrugData, 'created_at'> {
  return {
    id: data.id,
    stt: data.id, // Using id as stt for simplicity
    ten_thuoc: data.drugName,
    ten_hoat_chat: data.activeIngredient,
    nong_do: data.concentration,
    gdk_lh: data.gdklh,
    duong_dung: data.routeOfAdministration,
    dang_bao_che: data.dosageForm,
    han_dung: data.expiryDate,
    ten_cssx: data.manufacturer,
    nuoc_san_xuat: data.manufacturingCountry,
    quy_cach: data.packaging,
    don_vi_tinh: data.unit,
    so_luong: data.quantity,
    don_gia: data.unitPrice,
    nhom_thuoc: data.drugGroup,
    ma_tbmt: data.tbmt,
    chu_dau_tu: data.investor,
    hinh_thuc_lcnt: data.contractorSelectionMethod,
    ngay_dang_tai: data.kqlcntUploadDate,
    so_quyet_dinh: data.decisionNumber,
    ngay_ban_hanh: data.decisionDate,
    so_nha_thau: data.contractorNumber,
    dia_diem: data.location,
  };
}

// Fetch all drugs from Supabase (handles large datasets with pagination)
export async function fetchAllDrugs(): Promise<DrugData[]> {
  try {
    console.log('📊 Fetching ALL drugs (using pagination for large dataset)...');
    
    let allData: any[] = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;
    
    while (hasMore) {
      console.log(`📦 Fetching batch: ${from} - ${from + batchSize - 1}`);
      
      const { data, error, count } = await supabase
        .from('danh_muc_thuoc')
        .select('*', { count: 'exact' })
        .range(from, from + batchSize - 1)
        .order('id', { ascending: true });

      if (error) {
        console.error(`Supabase error in batch ${from}-${from + batchSize - 1}:`, error);
        throw error;
      }

      if (data && data.length > 0) {
        allData = allData.concat(data);
        console.log(`✅ Batch fetched: ${data.length} rows (Total: ${allData.length})`);
        
        if (from === 0 && count) {
          console.log(`📊 Total records in database: ${count}`);
        }
        
        from += batchSize;
        hasMore = data.length === batchSize;
      } else {
        hasMore = false;
      }
    }

    console.log(`✅ All data fetched: ${allData.length} rows`);
    const transformedData = allData.map(transformSupabaseToUI);
    console.log(`✅ All data transformed: ${transformedData.length} rows`);
    
    return transformedData;
  } catch (error) {
    console.error('Error fetching drugs:', error);
    throw error;
  }
}

// Fetch drugs with pagination
export async function fetchDrugsWithPagination(
  page: number = 1,
  limit: number = 100,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc'
): Promise<{ data: DrugData[]; count: number }> {
  try {
    let query = supabase
      .from('danh_muc_thuoc')
      .select('*', { count: 'exact' });

    // Add search filter if provided
    if (searchTerm) {
      query = query.or(`ten_thuoc.ilike.%${searchTerm}%,ten_hoat_chat.ilike.%${searchTerm}%,nhom_thuoc.ilike.%${searchTerm}%`);
    }

    // Add sorting if provided
    if (sortBy) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    } else {
      query = query.order('id', { ascending: true });
    }

    // Add pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return {
      data: data?.map(transformSupabaseToUI) || [],
      count: count || 0
    };
  } catch (error) {
    console.error('Error fetching drugs with pagination:', error);
    throw error;
  }
}

// Search drugs by term
export async function searchDrugs(searchTerm: string, limit: number = 100): Promise<DrugData[]> {
  try {
    const { data, error } = await supabase
      .from('danh_muc_thuoc')
      .select('*')
      .or(`ten_thuoc.ilike.%${searchTerm}%,ten_hoat_chat.ilike.%${searchTerm}%,nhom_thuoc.ilike.%${searchTerm}%`)
      .limit(limit)
      .order('id', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return data?.map(transformSupabaseToUI) || [];
  } catch (error) {
    console.error('Error searching drugs:', error);
    throw error;
  }
}

// Insert or update drugs (for file upload)
export async function upsertDrugs(drugs: DrugData[]): Promise<void> {
  try {
    const supabaseData = drugs.map(transformUIToSupabase);
    
    // Split into batches of 1000 (Supabase limit)
    const batchSize = 1000;
    for (let i = 0; i < supabaseData.length; i += batchSize) {
      const batch = supabaseData.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('danh_muc_thuoc')
        .upsert(batch, { onConflict: 'id' });

      if (error) {
        console.error('Supabase batch error:', error);
        throw error;
      }
    }
  } catch (error) {
    console.error('Error upserting drugs:', error);
    throw error;
  }
}

// Delete all drugs
export async function deleteAllDrugs(): Promise<void> {
  try {
    const { error } = await supabase
      .from('danh_muc_thuoc')
      .delete()
      .neq('id', 0); // Delete all records

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting drugs:', error);
    throw error;
  }
}

// Get drug statistics
export async function getDrugStats(): Promise<{
  totalDrugs: number;
  totalManufacturers: number;
  totalDrugGroups: number;
}> {
  try {
    // Get total count
    const { count: totalDrugs } = await supabase
      .from('danh_muc_thuoc')
      .select('*', { count: 'exact', head: true });

    // Get unique manufacturers count
    const { data: manufacturers } = await supabase
      .from('danh_muc_thuoc')
      .select('ten_cssx')
      .not('ten_cssx', 'is', null);

    // Get unique drug groups count
    const { data: drugGroups } = await supabase
      .from('danh_muc_thuoc')
      .select('nhom_thuoc')
      .not('nhom_thuoc', 'is', null);

    const uniqueManufacturers = new Set(manufacturers?.map(m => m.ten_cssx)).size;
    const uniqueDrugGroups = new Set(drugGroups?.map(g => g.nhom_thuoc)).size;

    return {
      totalDrugs: totalDrugs || 0,
      totalManufacturers: uniqueManufacturers,
      totalDrugGroups: uniqueDrugGroups,
    };
  } catch (error) {
    console.error('Error getting drug stats:', error);
    throw error;
  }
} 