"use client";

import { Component, Suspense, useEffect, useState, useCallback, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import UserDashboard from "@/components/user/UserDashboard";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean}> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(e: Error) { console.warn("ErrorBoundary caught:", e.message); }
  render() { return this.state.hasError ? null : this.props.children; }
}

function ImpersonateInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [user, setUser] = useState<any>(null);
  const [userStores, setUserStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const headers: any = { ...options.headers };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (!headers["Content-Type"] && options.body) headers["Content-Type"] = "application/json";
    return fetch(url, { ...options, headers });
  }, [token]);

  useEffect(() => {
    if (!token) {
      setError("Token no proporcionado");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const meRes = await apiFetch("/api/auth/me");
        if (!meRes.ok) {
          setError("Token inválido o expirado");
          setLoading(false);
          return;
        }
        const meData = await meRes.json();
        const userData = meData.user || meData;
        setUser(userData);

        const email = userData.email;
        if (email) {
          const storesRes = await apiFetch(`/api/stores?email=${encodeURIComponent(email)}`);
          if (storesRes.ok) {
            const storesData = await storesRes.json();
            const list = storesData.stores ?? storesData.userStores ?? storesData;
            setUserStores(Array.isArray(list) ? list : []);
          }
        }
      } catch {
        setError("Error cargando datos del usuario");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token, apiFetch]);

  const handleCreateStore = async (storeData: any) => {
    const res = await apiFetch("/api/stores", { method: "POST", body: JSON.stringify(storeData) });
    if (res.ok) {
      const data = await res.json();
      setUserStores((prev) => [...prev, data.store || data]);
    }
  };

  const handleEditStore = async (storeId: string | number, data: any) => {
    const res = await apiFetch(`/api/stores/${storeId}`, { method: "PUT", body: JSON.stringify(data) });
    if (res.ok) setUserStores((prev) => prev.map((s) => (s._id === storeId ? { ...s, ...data } : s)));
  };

  const handleDeleteStore = async (storeId: string | number) => {
    const res = await apiFetch(`/api/stores/${storeId}`, { method: "DELETE" });
    if (res.ok) setUserStores((prev) => prev.filter((s) => s._id !== storeId));
  };

  if (!token) {
    return <div className="min-h-screen bg-white flex items-center justify-center"><p className="text-zinc-400 italic font-black text-sm">Token no proporcionado</p></div>;
  }

  if (error) {
    return <div className="min-h-screen bg-white flex items-center justify-center"><p className="text-red-500 italic font-black text-sm">{error}</p></div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3 px-6 py-4 bg-zinc-50 rounded-2xl text-zinc-400 italic font-black text-sm">
          <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
          Cargando vista del usuario...
        </div>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-white">
        {user && (
          <ErrorBoundary>
            <UserDashboard
              user={{
                email: user.email,
                subscription: user.subscription,
                subscriptionExpiry: user.subscriptionExpiry,
                isSuspended: user.isSuspended,
                emailVerified: user.emailVerified,
              }}
              userStores={userStores}
              transactions={[]}
              onNavigate={() => {}}
              onCreateStore={handleCreateStore}
              onEditStore={handleEditStore}
              onDeleteStore={handleDeleteStore}
            />
          </ErrorBoundary>
        )}
      </div>
    </LanguageProvider>
  );
}

export default function ImpersonatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3 px-6 py-4 bg-zinc-50 rounded-2xl text-zinc-400 italic font-black text-sm">
          <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
          Cargando...
        </div>
      </div>
    }>
      <ImpersonateInner />
    </Suspense>
  );
}
