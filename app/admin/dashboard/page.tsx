"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminView from "@/components/admin/Admin";

const ADMIN_SESSION_KEY = "jandosession-admin";
const SESS_DURATION = 7 * 24 * 60 * 60 * 1000;

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    const saved = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!saved) {
      router.push("/admin");
      return;
    }
    try {
      const session = JSON.parse(saved);
      if (!session.isAdmin || Date.now() - session.loggedAt > SESS_DURATION) {
        localStorage.removeItem(ADMIN_SESSION_KEY);
        router.push("/admin");
        return;
      }
      setAuthorized(true);
    } catch {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      router.push("/admin");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    router.push("/admin");
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3 px-6 py-4 bg-zinc-50 rounded-2xl text-zinc-400 italic font-black text-sm">
          <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
          VERIFICANDO ACCESO...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <AdminView
        currency={currency}
        setCurrency={setCurrency}
        onLogout={handleLogout}
      />
    </div>
  );
}
