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

-- Hiển thị dữ liệu để kiểm tra
SELECT * FROM users; 