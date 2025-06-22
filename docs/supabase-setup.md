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
6. ✅ Tạo hệ thống đăng nhập với bảng `users`

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

#### Bảng thuốc: `danh_muc_thuoc`

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

#### Bảng người dùng: `users`

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| username | text | Tên đăng nhập (unique) |
| password | text | Mật khẩu (plain text) |
| name | text | Tên tiếng Việt có dấu |
| created_at | timestamptz | Ngày tạo |

### 4. Tạo bảng users

#### Tạo bảng mới (nếu chưa có):
Chạy script SQL trong **SQL Editor** của Supabase:

```sql
-- Tạo bảng users cho hệ thống đăng nhập
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL, -- Tên tiếng Việt có dấu
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thêm dữ liệu mẫu
INSERT INTO users (username, password, name) VALUES
('admin', 'admin123', 'Quản trị viên'),
('user1', 'password123', 'Người dùng 1'),
('thanhlongnguyen', 'matkhau123', 'DS CK1. Nguyễn Thành Long');

-- Tạo policy cho RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy cho phép đọc tất cả users (cần cho authentication)
CREATE POLICY "Allow read access to all users" ON users
FOR SELECT USING (true);
```

#### Cập nhật bảng hiện có (nếu đã tồn tại):
Nếu bảng users đã tồn tại, chạy script từ file `update-users-add-name.sql`:

```sql
-- Thêm cột name vào bảng users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Cập nhật dữ liệu mẫu với tên tiếng Việt có dấu
UPDATE users SET name = 'Quản trị viên' WHERE username = 'admin';
UPDATE users SET name = 'Người dùng 1' WHERE username = 'user1';  
UPDATE users SET name = 'DS CK1. Nguyễn Thành Long' WHERE username = 'thanhlongnguyen';

-- Đặt NOT NULL constraint sau khi đã có dữ liệu
UPDATE users SET name = 'Người dùng' WHERE name IS NULL OR name = '';
ALTER TABLE users ALTER COLUMN name SET NOT NULL;
```

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
- ✅ **Hệ thống đăng nhập**
  - Trang đăng nhập: `/login`
  - Bảo vệ trang chính với AuthGuard
  - Đăng xuất với localStorage
  - Tài khoản mẫu: `admin` / `admin123`

## Hướng dẫn sử dụng đăng nhập

1. **Truy cập ứng dụng**: Khi vào trang chính, sẽ tự động chuyển đến `/login`
2. **Đăng nhập**: 
   - Username: `admin`
   - Password: `admin123`
   - Hoặc sử dụng tài khoản khác đã tạo
3. **Sử dụng ứng dụng**: Sau khi đăng nhập thành công, có thể sử dụng tất cả tính năng
4. **Đăng xuất**: Nhấn nút "Đăng xuất" ở góc phải header

## Troubleshooting

### Lỗi kết nối Supabase
- Kiểm tra `.env.local` có đúng URL và API key không
- Kiểm tra RLS (Row Level Security) trong Supabase
- Kiểm tra table name có đúng là `danh_muc_thuoc` không

### Lỗi đăng nhập
- Kiểm tra bảng `users` đã được tạo chưa
- Kiểm tra RLS policy cho bảng `users`
- Kiểm tra username/password có đúng không

### Lỗi import dữ liệu
- Kiểm tra cấu trúc cột trong Excel có khớp với database không
- Kiểm tra quyền insert/update trong Supabase

### Hiệu suất
- Database 201k rows có thể chậm, đã optimize với pagination
- Sử dụng indexing trong Supabase để tăng tốc search 