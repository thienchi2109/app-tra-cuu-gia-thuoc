import { createClient } from '@supabase/supabase-js';
import type { DrugData } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Possible table names to try
const POSSIBLE_TABLE_NAMES = [
  'danh_muc_thuoc',
  'drugs',
  'drug_data',
  'thuoc',
  'medicine',
  'drug_list'
];

// Try to find the correct table name
export async function findCorrectTableName(): Promise<string | null> {
  console.log('🔍 Searching for correct table name...');
  
  for (const tableName of POSSIBLE_TABLE_NAMES) {
    try {
      console.log(`Testing table: ${tableName}`);
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!error) {
        console.log(`✅ Found table: ${tableName}`);
        return tableName;
      } else {
        console.log(`❌ Table ${tableName} error:`, error.message);
      }
    } catch (error) {
      console.log(`❌ Table ${tableName} exception:`, error);
    }
  }
  
  console.log('❌ No valid table found');
  return null;
}

// Get sample data to understand the structure
export async function getSampleData(tableName: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(5);
    
    if (error) {
      console.error(`Error fetching sample from ${tableName}:`, error);
      return [];
    }
    
    console.log(`Sample data from ${tableName}:`, data);
    return data || [];
  } catch (error) {
    console.error(`Exception fetching sample from ${tableName}:`, error);
    return [];
  }
}

// Transform any row structure to our DrugData format
export function transformAnyRowToDrugData(row: any, index: number): DrugData {
  // Try to map common column names
  const getId = () => {
    return row.id || row.stt || row.ID || row.STT || index + 1;
  };
  
  const getDrugName = () => {
    return row.ten_thuoc || row.drugName || row.drug_name || row.name || row.ten || row.medicine_name || 'N/A';
  };
  
  const getActiveIngredient = () => {
    return row.ten_hoat_chat || row.activeIngredient || row.active_ingredient || row.hoat_chat || 'N/A';
  };
  
  const getConcentration = () => {
    return row.nong_do || row.concentration || row.strength || row.do_manh || 'N/A';
  };
  
  const getPrice = () => {
    const price = row.don_gia || row.unitPrice || row.price || row.gia || row.unit_price || 0;
    return typeof price === 'number' ? price : parseFloat(price) || 0;
  };
  
  const getQuantity = () => {
    const qty = row.so_luong || row.quantity || row.qty || row.amount || 0;
    return typeof qty === 'number' ? qty : parseFloat(qty) || 0;
  };
  
  return {
    id: getId(),
    drugName: getDrugName(),
    activeIngredient: getActiveIngredient(),
    concentration: getConcentration(),
    gdklh: row.gdk_lh || row.gdklh || 'N/A',
    routeOfAdministration: row.duong_dung || row.routeOfAdministration || row.route || 'N/A',
    dosageForm: row.dang_bao_che || row.dosageForm || row.form || 'N/A',
    expiryDate: row.han_dung || row.expiryDate || row.expiry || 'N/A',
    manufacturer: row.ten_cssx || row.manufacturer || row.nha_san_xuat || 'N/A',
    manufacturingCountry: row.nuoc_san_xuat || row.manufacturingCountry || row.country || 'N/A',
    packaging: row.quy_cach || row.packaging || row.package || 'N/A',
    unit: row.don_vi_tinh || row.unit || row.dvt || 'N/A',
    quantity: getQuantity(),
    unitPrice: getPrice(),
    drugGroup: row.nhom_thuoc || row.drugGroup || row.group || 'N/A',
    tbmt: row.ma_tbmt || row.tbmt || 'N/A',
    investor: row.chu_dau_tu || row.investor || 'N/A',
    contractorSelectionMethod: row.hinh_thuc_lcnt || row.contractorSelectionMethod || 'N/A',
    kqlcntUploadDate: row.ngay_dang_tai || row.kqlcntUploadDate || 'N/A',
    decisionNumber: row.so_quyet_dinh || row.decisionNumber || 'N/A',
    decisionDate: row.ngay_ban_hanh || row.decisionDate || 'N/A',
    contractorNumber: row.so_nha_thau || row.contractorNumber || 'N/A',
    location: row.dia_diem || row.location || 'N/A',
  };
}

// Flexible fetch function
export async function fetchDrugsFlexible(
  onProgress?: (current: number, total: number) => void
): Promise<DrugData[]> {
  console.log('🚀 Starting flexible drug fetch...');
  
  const tableName = await findCorrectTableName();
  if (!tableName) {
    throw new Error('No accessible table found. Please check your Supabase configuration and RLS policies.');
  }
  
  console.log(`📊 Fetching data from table: ${tableName}`);
  
  // Get sample data first to understand structure
  const sampleData = await getSampleData(tableName);
  if (sampleData.length > 0) {
    console.log('Sample row structure:', Object.keys(sampleData[0]));
  }
  
  // Fetch all data using pagination to get all 201k records
  try {
    console.log('📊 Fetching ALL data (this may take a moment for 201k records)...');
    
    let allData: any[] = [];
    let from = 0;
    const batchSize = 1000; // Supabase's default limit
    let hasMore = true;
    
    while (hasMore) {
      console.log(`📦 Fetching batch: ${from} - ${from + batchSize - 1}`);
      
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .range(from, from + batchSize - 1)
        .order('id', { ascending: true });
      
      if (error) {
        console.error(`Error fetching batch ${from}-${from + batchSize - 1}:`, error);
        throw error;
      }
      
      if (data && data.length > 0) {
        allData = allData.concat(data);
        console.log(`✅ Batch fetched: ${data.length} rows (Total so far: ${allData.length})`);
        
        // Log total count on first batch and setup progress tracking
        if (from === 0 && count) {
          console.log(`📊 Total records in database: ${count}`);
        }
        
        // Update progress if callback provided
        if (onProgress && count) {
          onProgress(allData.length, count);
        }
        
        from += batchSize;
        hasMore = data.length === batchSize; // Continue if we got a full batch
      } else {
        hasMore = false;
      }
    }
    
    console.log(`✅ All raw data fetched: ${allData.length} rows`);
    
    // Transform data
    const transformedData = allData.map((row, index) => transformAnyRowToDrugData(row, index));
    console.log(`✅ All transformed data: ${transformedData.length} rows`);
    
    return transformedData;
  } catch (error) {
    console.error('Exception fetching data:', error);
    throw error;
  }
} 