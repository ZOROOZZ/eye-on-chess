"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../stores/auth";
import AdminLayout from "../../components/AdminLayout";
import Toast from "../../components/Toast";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading, fetchMe } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "ADMIN")) {
      router.push("/play");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") return null;

  return (
    <AdminLayout>
      <Toast />
      {children}
    </AdminLayout>
  );
}
