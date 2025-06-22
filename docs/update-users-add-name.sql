-- Script để cập nhật bảng users hiện có - thêm cột name
-- Chạy script này trong Supabase SQL Editor nếu bảng users đã tồn tại

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

-- Kiểm tra kết quả
SELECT id, username, name, created_at FROM users; 