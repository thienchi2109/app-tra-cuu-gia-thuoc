"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      // Check if we're on client side
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      const isLoggedIn = localStorage.getItem("isLoggedIn");
      const username = localStorage.getItem("username");
      
      if (isLoggedIn === "true" && username) {
        setIsAuthenticated(true);
      } else {
        router.push("/login");
        return;
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
} 