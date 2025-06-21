# Hướng dẫn cấu hình Supabase

## Các bước đã hoàn thành

1. ✅ Cài đặt `@supabase/supabase-js`
2. ✅ Tạo interface `SupabaseDrugData` để map với cấu trúc database
3. ✅ Tạo file `src/lib/supabase.ts` với các function:
   - `fetchAllDrugs()` - Lấy tất cả dữ liệu thuốc
   - `fetchDrugsWithPagination()` - Lấy dữ liệu có phân trang và tìm kiếm
   - `searchDrugs()` - Tìm kiếm thuốc
   - `upsertDrugs()` - Thêm/cập nhật thuốc
   - `deleteAllDrugs()` - Xóa tất cả dữ liệu
   - `getDrugStats()` - Lấy thống kê
4. ✅ Cập nhật `src/app/page.tsx` để sử dụng Supabase thay vì Firebase
5. ✅ Cập nhật types để hỗ trợ cả database và UI format

## Cấu hình cần thiết

### 1. File `.env.local`

Tạo file `.env.local` trong thư mục gốc với nội dung:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_anon_key_here
```

### 2. Lấy thông tin Supabase

1. Truy cập [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. Vào **Settings** > **API**
4. Copy **Project URL** và **Project API Key** (anon, public)

### 3. Cấu trúc Database

Table: `danh_muc_thuoc`

| Column | Type | Description |
|--------|------|-------------|
| id | int8 | Primary key |
| stt | int4 | Số thứ tự |
| ten_thuoc | text | Tên thuốc |
| ten_hoat_chat | text | Tên hoạt chất |
| nong_do | text | Nồng độ |
| gdk_lh | text | GĐKLH |
| duong_dung | text | Đường dùng |
| dang_bao_che | text | Dạng bào chế |
| han_dung | text | Hạn dùng |
| ten_cssx | text | Tên cơ sở sản xuất |
| nuoc_san_xuat | text | Nước sản xuất |
| quy_cach | text | Quy cách |
| don_vi_tinh | text | Đơn vị tính |
| so_luong | int4 | Số lượng |
| don_gia | numeric | Đơn giá |
| nhom_thuoc | text | Nhóm thuốc |
| ma_tbmt | text | Mã TBMT |
| chu_dau_tu | text | Chủ đầu tư |
| hinh_thuc_lcnt | text | Hình thức LCNT |
| ngay_dang_tai | text | Ngày đăng tải |
| so_quyet_dinh | text | Số quyết định |
| ngay_ban_hanh | text | Ngày ban hành |
| so_nha_thau | text | Số nhà thầu |
| dia_diem | text | Địa điểm |
| created_at | timestamptz | Ngày tạo |

## Chạy ứng dụng

```bash
npm run dev
```

Ứng dụng sẽ chạy tại: http://localhost:9002

## Tính năng

- ✅ Hiển thị dữ liệu từ Supabase
- ✅ Tìm kiếm theo tên thuốc, hoạt chất, nhóm thuốc
- ✅ Sắp xếp theo các cột
- ✅ Phân trang
- ✅ Bộ lọc nâng cao
- ✅ Upload Excel để cập nhật dữ liệu
- ✅ Xóa tất cả dữ liệu
- ✅ Thống kê

## Troubleshooting

### Lỗi kết nối Supabase
- Kiểm tra `.env.local` có đúng URL và API key không
- Kiểm tra RLS (Row Level Security) trong Supabase
- Kiểm tra table name có đúng là `danh_muc_thuoc` không

### Lỗi import dữ liệu
- Kiểm tra cấu trúc cột trong Excel có khớp với database không
- Kiểm tra quyền insert/update trong Supabase

### Hiệu suất
- Database 201k rows có thể chậm, đã optimize với pagination
- Sử dụng indexing trong Supabase để tăng tốc search 