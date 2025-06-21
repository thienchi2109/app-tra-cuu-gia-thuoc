
// Database interface matching Supabase table structure
export interface SupabaseDrugData {
  id: number;
  stt: number;
  ten_thuoc: string;
  ten_hoat_chat: string;
  nong_do: string;
  gdk_lh: string;
  duong_dung: string;
  dang_bao_che: string;
  han_dung: string;
  ten_cssx: string;
  nuoc_san_xuat: string;
  quy_cach: string;
  don_vi_tinh: string;
  so_luong: number;
  don_gia: number;
  nhom_thuoc: string;
  ma_tbmt: string;
  chu_dau_tu: string;
  hinh_thuc_lcnt: string;
  ngay_dang_tai: string;
  so_quyet_dinh: string;
  ngay_ban_hanh: string;
  so_nha_thau: string;
  dia_diem: string;
  created_at?: string;
}

// UI interface for display
export interface DrugData {
  id: number; // STT
  drugName: string; // Tên thuốc
  activeIngredient: string; // Tên hoạt chất
  concentration: string; // Nồng độ
  gdklh: string; // GĐKLH
  routeOfAdministration: string; // đường dùng
  dosageForm: string; // dạng bào chế
  expiryDate: string; // Hạn dùng
  manufacturer: string; // tên cơ sở sản xuất
  manufacturingCountry: string; // nước sản xuất
  packaging: string; // quy cách đóng gói
  unit: string; // Đơn vị tính
  quantity: number; // Số lượng
  unitPrice: number; // Đơn giá
  drugGroup: string; // Nhóm thuốc
  tbmt: string; // TBMT
  investor: string; // chủ đầu tư
  contractorSelectionMethod: string; // hình thức lựa chọn nhà thầu
  kqlcntUploadDate: string; // Ngày đăng tải KQLCNT
  decisionNumber: string; // Số quyết định
  decisionDate: string; // Ngày ban hành quyết định
  contractorNumber: string; // Số nhà thầu
  location: string; // Địa điểm
}

export const COLUMN_HEADERS: Record<keyof DrugData, string> = {
  id: "STT",
  drugName: "Tên thuốc",
  activeIngredient: "Tên hoạt chất",
  concentration: "Nồng độ",
  gdklh: "GĐKLH",
  routeOfAdministration: "Đường dùng",
  dosageForm: "Dạng bào chế",
  expiryDate: "Hạn dùng",
  manufacturer: "Tên cơ sở sản xuất",
  manufacturingCountry: "Nước sản xuất",
  packaging: "Quy cách đóng gói",
  unit: "Đơn vị tính",
  quantity: "Số lượng",
  unitPrice: "Đơn giá",
  drugGroup: "Nhóm thuốc",
  tbmt: "TBMT",
  investor: "Chủ đầu tư",
  contractorSelectionMethod: "Hình thức lựa chọn nhà thầu",
  kqlcntUploadDate: "Ngày đăng tải KQLCNT",
  decisionNumber: "Số quyết định",
  decisionDate: "Ngày ban hành quyết định",
  contractorNumber: "Số nhà thầu",
  location: "Địa điểm",
};

export type SortConfig = {
  key: keyof DrugData;
  direction: "ascending" | "descending";
} | null;

export type AISuggestion = {
  relatedDrugs: string[];
  reasoning: string;
};
