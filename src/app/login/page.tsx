"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, User } from "lucide-react";
import { authenticateUser } from "@/lib/supabase-optimized";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await authenticateUser(username.trim(), password);
      
      if (result.success && result.user) {
        // Lưu thông tin đăng nhập vào localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("username", result.user.username);
          localStorage.setItem("userDisplayName", result.user.name); // Lưu tên tiếng Việt có dấu
        }
        
        // Chuyển hướng về trang chính
        router.push("/");
      } else {
        setError(result.message || "Đăng nhập thất bại");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Lỗi hệ thống, vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <img 
                src="https://i.postimg.cc/zf1GTF8B/noimage.png" 
                alt="Logo" 
                className="w-32 h-32 object-contain rounded-xl shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100 p-3 border border-blue-200 transition-transform hover:scale-105"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10"></div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">
            PHẦN MỀM THAM KHẢO GIÁ THUỐC TRÚNG THẦU
          </h1>
          <p className="text-gray-600 mt-2">Đăng nhập để tiếp tục</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Lock className="h-5 w-5" />
              Đăng nhập
            </CardTitle>
            <CardDescription className="text-center">
              Nhập thông tin đăng nhập của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Tên đăng nhập</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Nhập tên đăng nhập"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !username.trim() || !password.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  "Đăng nhập"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>Phần mềm được phát triển bởi DS CK1. Nguyễn Thành Long và KS Nguyễn Thiện Chí</p>
          <p>Phiên bản 06.2025 • Email: thanhlongnguyen2013@gmail.com</p>
        </div>
      </div>
    </div>
  );
} 