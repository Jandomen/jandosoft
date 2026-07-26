"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getPlanLabel } from "@/lib/plans";
import { LanguageCarousel } from "@/components/ui/LanguageCarousel";
import {
  BarChart3, 
  Users, 
  Settings, 
  Plus, 
  TrendingUp, 
  Package, 
  Search, 
  LogOut, 
  Trash2, 
  FileText,
  Mail,
  Zap,
  ShoppingBag,
  ShieldCheck,
  Image as ImageIcon,
  ChevronRight,
  Download,
  DollarSign,
  Store,
  RefreshCw,
  Megaphone,
  Ban,
  Code2,
  CheckCircle,
  ExternalLink,
  Star,
  Check,
  Save,
  Edit3,
  X,
  Eye,
} from "lucide-react";
import { generateInvoicePDF } from "@/lib/pdf-utils";
import EmailAdminSection from "./EmailAdminSection";
import AffiliatesAdminSection from "./AffiliatesAdminSection";
import NotificationPanel from "@/components/ui/NotificationPanel";

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

interface AdminProps {
  currency: string;
}

export default function Admin({ currency, onLogout }: AdminProps & { onLogout?: () => void }) {
  const { t } = useLanguage();
  const [newProduct, setNewProduct] = useState<{ name: string; price: string; desc: string; images: string[] }>({ name: "", price: "", desc: "", images: [] });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [liveActivity, setLiveActivity] = useState<{ action: string; time: string; detail?: string; createdAt?: string }[]>([]);
  const [viewingActivity, setViewingActivity] = useState<{ action: string; time: string; detail?: string; createdAt?: string } | null>(null);

  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalStores: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    newUsersThisMonth: 0,
    activeUsersToday: 0,
  });
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allStores, setAllStores] = useState<any[]>([]);
  const [allInvoices, setAllInvoices] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [allAffiliates, setAllAffiliates] = useState<any[]>([]);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [totalPaymentsPages, setTotalPaymentsPages] = useState(1);
  const [totalPaymentsCount, setTotalPaymentsCount] = useState(0);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [userPaymentsModal, setUserPaymentsModal] = useState<{ email: string; name?: string } | null>(null);
  const [commercials, setCommercials] = useState<any[]>([]);
  const [searchStores, setSearchStores] = useState("");
  const [searchUsers, setSearchUsers] = useState("");
  const [newCommercial, setNewCommercial] = useState({ title: "", imageUrl: "", linkUrl: "" });
  const [suspendDuration, setSuspendDuration] = useState("permanent");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmingType, setConfirmingType] = useState<'user' | 'store'>('user');
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [viewingStore, setViewingStore] = useState<any>(null);
  const [showResetDb, setShowResetDb] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState<any>(null);
  const [filterPlan, setFilterPlan] = useState("");
  const [revenueData, setRevenueData] = useState<any>(null);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [paymentToast, setPaymentToast] = useState<{ message: string; amount: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const [usersPage, setUsersPage] = useState(1);
  const [storesPage, setStoresPage] = useState(1);
  const [invoicesPage, setInvoicesPage] = useState(1);
  const [totalUsersPages, setTotalUsersPages] = useState(1);
  const [totalStoresPages, setTotalStoresPages] = useState(1);
  const [totalInvoicesPages, setTotalInvoicesPages] = useState(1);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPaymentCount = useRef(0);
  const plansRef = useRef<HTMLDivElement>(null);

  const [planConfig, setPlanConfig] = useState<{ plans: any[]; freePlan: any } | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [savingPlans, setSavingPlans] = useState(false);
  const [syncingStripe, setSyncingStripe] = useState(false);
  const [planToast, setPlanToast] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [publishingProduct, setPublishingProduct] = useState(false);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  const [changingPlanUserId, setChangingPlanUserId] = useState<string | null>(null);
  const [changingPlanValue, setChangingPlanValue] = useState("");

  const [widgetStoreId, setWidgetStoreId] = useState("");
  const [widgetConfig, setWidgetConfig] = useState<any>(null);
  const [widgetStoreName, setWidgetStoreName] = useState("");
  const [widgetSlug, setWidgetSlug] = useState("");
  const [savingWidget, setSavingWidget] = useState(false);
  const [widgetToast, setWidgetToast] = useState("");
  const [widgetCopied, setWidgetCopied] = useState(false);

  const [impersonateToken, setImpersonateToken] = useState<string | null>(null);
  const [impersonateUser, setImpersonateUser] = useState<any>(null);
  const [impersonateLoading, setImpersonateLoading] = useState(false);

  const fetchDashboard = async (overrides?: {
    searchUsers?: string; usersPage?: number;
    searchStores?: string; storesPage?: number;
    invoicesPage?: number;
    paymentsPage?: number;
    paymentStatus?: string;
    paymentSearch?: string;
  }) => {
    try {
      const uSearch = overrides?.searchUsers ?? searchUsers;
      const uPage = overrides?.usersPage ?? usersPage;
      const sSearch = overrides?.searchStores ?? searchStores;
      const sPage = overrides?.storesPage ?? storesPage;
      const iPage = overrides?.invoicesPage ?? invoicesPage;
      const pPage = overrides?.paymentsPage ?? paymentsPage;
      const pStatus = overrides?.paymentStatus ?? paymentStatus;
      const pSearch = overrides?.paymentSearch ?? paymentSearch;

      const paymentsParams = new URLSearchParams({
        page: String(pPage),
        limit: "20",
      });
      if (pStatus && pStatus !== "all") paymentsParams.set("status", pStatus);
      if (pSearch) paymentsParams.set("search", pSearch);

      const [dashRes, usersRes, storesRes, invRes, commRes, payRes, affRes] = await Promise.all([
        fetch("/api/admin/dashboard", { credentials: "include" }),
        fetch(`/api/admin/users?search=${encodeURIComponent(uSearch)}&page=${uPage}&limit=20`, { credentials: "include" }),
        fetch(`/api/admin/stores?search=${encodeURIComponent(sSearch)}&page=${sPage}&limit=20`, { credentials: "include" }),
        fetch(`/api/invoices?page=${iPage}&limit=20`, { credentials: "include" }),
        fetch("/api/admin/commercials", { credentials: "include" }),
        fetch(`/api/stripe/payments?${paymentsParams.toString()}`, { credentials: "include" }),
        fetch("/api/admin/affiliates", { credentials: "include" }),
      ]);
      if (dashRes.ok) {
        const data = await dashRes.json();
        setDashboardStats(data.stats);
        setLiveActivity(data.activity || []);
      }
      if (usersRes.ok) {
        const data = await usersRes.json();
        setAllUsers(data.users || []);
        setTotalUsersPages(data.totalPages || 1);
      }
      if (storesRes.ok) {
        const data = await storesRes.json();
        setAllStores(data.stores || []);
        setTotalStoresPages(data.totalPages || 1);
      }
      if (invRes.ok) {
        const data = await invRes.json();
        setAllInvoices(data.invoices || []);
        setTotalInvoicesPages(data.totalPages || 1);
      }
      if (commRes.ok) {
        const data = await commRes.json();
        setCommercials(data.commercials || []);
      }
      if (affRes.ok) {
        const data = await affRes.json();
        const affiliates = data.affiliates || [];
        setAllAffiliates(affiliates);
        if (usersRes.ok) {
          const userData = await usersRes.json();
          const users = (userData.users || []).map((u: any) => {
            const aff = affiliates.find((a: any) => a.email === u.email);
            return {
              ...u,
              isAffiliate: !!aff,
              affiliateCode: aff?.code || null,
              affiliateStatus: aff?.status || null,
              affiliateEarnings: aff?.totalEarnings || 0,
            };
          });
          setAllUsers(users);
          setTotalUsersPages(userData.totalPages || 1);
        }
      }
      if (payRes.ok) {
        const data = await payRes.json();
        const newPayments = data.payments || [];
        if (prevPaymentCount.current > 0 && newPayments.length > prevPaymentCount.current) {
          const newest = newPayments[0];
          setPaymentToast({
            message: `${newest.customerName || newest.customerEmail || "Cliente"} pagó $${newest.amount} ${newest.displayCurrency || "MXN"}`,
            amount: newest.amount,
          });
          setTimeout(() => setPaymentToast(null), 5000);
        }
        prevPaymentCount.current = newPayments.length;
        setAllPayments(newPayments);
        setTotalPaymentsPages(data.totalPages || 1);
        setTotalPaymentsCount(data.total || 0);
      }
    } catch (e) {
      console.error("Error fetching admin data:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/plans", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setPlanConfig({ plans: data.plans, freePlan: data.freePlan });
      }
    } catch {}
  }, []);

  const handleSavePlans = async () => {
    if (!planConfig) return;
    setSavingPlans(true);
    try {
      const res = await fetch("/api/admin/plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planConfig),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        if (data.syncErrors && data.syncErrors.length > 0) {
          setPlanToast(`Guardado. ⚠️ ${data.syncErrors.join(" | ")}`);
        } else {
          setPlanToast("Planes guardados y sincronizados con Stripe ✓");
        }
        setEditingPlanId(null);
        setEditForm(null);
        fetchPlans();
      } else {
        setPlanToast(data.error || "Error al guardar planes");
      }
    } catch {
      setPlanToast("Error de conexión");
    } finally {
      setSavingPlans(false);
      setTimeout(() => setPlanToast(""), 6000);
    }
  };

  const handleSyncStripe = async () => {
    setSyncingStripe(true);
    try {
      const res = await fetch("/api/stripe/sync-prices", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (res.ok && data.success) {
        const synced = (data.results || []).map((r: any) => {
          const parts = [r.name || r.plan];
          if (r.priceId) parts.push("local ✓");
          if (r.priceIdUsd) parts.push("USD ✓");
          return parts.join(": ");
        });
        const errs = (data.errors || []).map((e: any) => `${e.name}: ✗ ${e.error}`);
        const lines = [...synced, ...errs];
        setPlanToast(lines.length > 0 ? `Stripe: ${lines.join(" | ")}` : "Sincronizado");
        fetchPlans();
      } else {
        setPlanToast(data.error || "Error al sincronizar");
      }
    } catch {
      setPlanToast("Error de conexión");
    } finally {
      setSyncingStripe(false);
      setTimeout(() => setPlanToast(""), 6000);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!planConfig) return;
    try {
      const res = await fetch("/api/admin/plans", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.success) {
        setPlanConfig({ ...planConfig, plans: planConfig.plans.filter((p: any) => p.id !== planId) });
        setPlanToast(`Plan eliminado. ${data.migratedUsers} usuario(s) movido(s) a ${data.fallbackPlan}.`);
      } else {
        setPlanToast("Error al eliminar plan");
      }
    } catch {
      setPlanToast("Error de red al eliminar plan");
    }
    setDeletingPlanId(null);
    setEditingPlanId(null);
    setEditForm(null);
    setTimeout(() => setPlanToast(""), 4000);
  };

  const handleImpersonate = async (userId: string, userName: string) => {
    setImpersonateLoading(true);
    setImpersonateUser({ name: userName });
    try {
      const res = await fetch(`/api/admin/impersonate/${userId}`, { method: "POST", credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setImpersonateToken(data.token);
        setImpersonateUser({ name: userName, email: data.user?.email });
      } else {
        setImpersonateLoading(false);
        setImpersonateUser(null);
      }
    } catch {
      setImpersonateLoading(false);
      setImpersonateUser(null);
    }
  };

  const handleResetDatabase = async () => {
    if (resetConfirmText !== "ELIMINAR") return;
    setResetting(true);
    setResetResult(null);
    try {
      const res = await fetch("/api/admin/reset-database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ confirmation: "ELIMINAR" }),
      });
      const data = await res.json();
      if (data.success) {
        setResetResult(data);
        setAllUsers([]);
        setAllStores([]);
        setAllPayments([]);
        setAllInvoices([]);
        fetchDashboard();
      } else {
        setResetResult({ error: data.error });
      }
    } catch {
      setResetResult({ error: "Error de red" });
    }
    setResetting(false);
  };

  const fetchStoreProducts = async (storeId: string) => {
    if (!storeId) return;
    setLoadingProducts(true);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/products`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setStoreProducts(data.products || []);
      }
    } catch {
      console.error("Error fetching store products");
    } finally {
      setLoadingProducts(false);
    }
  };

  const handlePublishProduct = async () => {
    if (!newProduct.name || !newProduct.price || !selectedStoreId) return;
    setPublishingProduct(true);
    try {
      const product = {
        id: Date.now(),
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        stock: 0,
      };
      const updatedProducts = [...storeProducts, product];
      const res = await fetch(`/api/admin/stores/${selectedStoreId}/products`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: updatedProducts }),
        credentials: "include",
      });
      if (res.ok) {
        setStoreProducts(updatedProducts);
        setNewProduct({ name: "", price: "", desc: "", images: [] });
        setImageUrlInput("");
      }
    } catch {
      console.error("Error publishing product");
    } finally {
      setPublishingProduct(false);
    }
  };

  const handleDeleteStoreProduct = async (productId: number) => {
    if (!selectedStoreId) return;
    const updatedProducts = storeProducts.filter((p: any) => p.id !== productId);
    try {
      const res = await fetch(`/api/admin/stores/${selectedStoreId}/products`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: updatedProducts }),
        credentials: "include",
      });
      if (res.ok) {
        setStoreProducts(updatedProducts);
      }
    } catch {
      console.error("Error deleting product");
    }
  };

  const handleChangeUserPlan = async (userId: string, plan: string) => {
    try {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
      const res = await fetch(`/api/admin/users/${userId}/plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: plan, subscriptionExpiry: expiry.toISOString() }),
        credentials: "include",
      });
      if (res.ok) {
        fetchDashboard();
        if (viewingUser?._id === userId) {
          setViewingUser({ ...viewingUser, subscription: plan });
        }
      }
    } catch {}
    setChangingPlanUserId(null);
    setChangingPlanValue("");
  };

  const handleToggleSuspend = async (storeId: string, reason?: string, duration?: string) => {
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/toggle-suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || "", duration: duration || suspendDuration }),
        credentials: "include",
      });
      if (res.ok) {
        fetchDashboard();
      }
    } catch (e) {
      console.error("Error toggling suspend:", e);
    }
  };

  const handleToggleUserSuspend = async (userId: string, duration?: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration: duration || suspendDuration }),
        credentials: "include",
      });
      if (res.ok) {
        fetchDashboard();
      }
    } catch (e) {
      console.error("Error toggling user suspend:", e);
    }
  };

  const handleCreateCommercial = async () => {
    if (!newCommercial.title || !newCommercial.imageUrl) return;
    try {
      const res = await fetch("/api/admin/commercials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCommercial),
        credentials: "include",
      });
      if (res.ok) {
        setNewCommercial({ title: "", imageUrl: "", linkUrl: "" });
        fetchDashboard();
      }
    } catch (e) {
      console.error("Error creating commercial:", e);
    }
  };

  const handleDeleteCommercial = async (id: string) => {
    try {
      const res = await fetch("/api/admin/commercials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
        credentials: "include",
      });
      if (res.ok) fetchDashboard();
    } catch (e) {
      console.error("Error deleting commercial:", e);
    }
  };

  const handleSearchUsers = (value: string) => {
    setSearchUsers(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setUsersPage(1);
      fetchDashboard({ searchUsers: value, usersPage: 1 });
    }, 300);
  };

  const handleSearchStores = (value: string) => {
    setSearchStores(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setStoresPage(1);
      fetchDashboard({ searchStores: value, storesPage: 1 });
    }, 300);
  };

  const fetchRevenue = async () => {
    try {
      setRevenueLoading(true);
      const res = await fetch("/api/stripe/platform-revenue", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setRevenueData(data);
      }
    } catch {} finally {
      setRevenueLoading(false);
    }
  };

  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(","),
      ...data.map(row => headers.map(h => `"${String(row[h] || "").replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredUsers = filterPlan ? allUsers.filter((u: any) => (u.subscription || "free") === filterPlan || u.originalPlan === filterPlan) : allUsers;

  useEffect(() => {
    fetchDashboard();
    fetchPlans();
    fetchRevenue();
  }, []);

  const [imageUrlInput, setImageUrlInput] = useState("");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 10 - newProduct.images.length;
    const toUpload = files.slice(0, remaining);
    for (const file of toUpload) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.url) setNewProduct(prev => ({ ...prev, images: [...prev.images, data.url] }));
      } catch {}
    }
  };

  const addImageUrl = () => {
    if (imageUrlInput && newProduct.images.length < 10) {
      setNewProduct(prev => ({ ...prev, images: [...prev.images, imageUrlInput] }));
      setImageUrlInput("");
    }
  };

  return (
    <div className="flex flex-col min-h-[600px] md:h-[800px] w-full max-w-7xl mx-auto border-0 md:border border-zinc-200 rounded-none md:rounded-[3rem] overflow-hidden shadow-2xl bg-white">
      <header className="max-[340px]:px-2 max-[400px]:px-3 px-4 md:px-10 max-[340px]:py-2 max-[400px]:py-3 py-4 md:py-6 bg-white border-b border-zinc-100 flex items-center justify-between gap-1 md:gap-2">
         <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <div className="p-2 md:p-3 bg-red-600 rounded-xl md:rounded-2xl shadow-xl shadow-red-100 text-white shrink-0">
               <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
               <h2 className="max-[400px]:text-base text-lg md:text-xl font-black italic tracking-tighter text-zinc-950 truncate"><span className="font-wallpoet tracking-[0.2em] text-red-600">JANDOSOFT</span> {t("admin.title")}</h2>
               <p className="text-[8px] md:text-[10px] font-wallpoet text-zinc-400 uppercase tracking-[0.2em] italic truncate">{t("admin.subtitle")}</p>
            </div>
         </div>
          <div className="hidden md:flex items-center gap-6">
              <LanguageCarousel />
              <NotificationPanel token={null} />
              <button onClick={() => fetchDashboard()} className="p-2.5 hover:bg-zinc-50 rounded-xl transition-all" title="Actualizar datos">
                <RefreshCw className={cn("w-5 h-5 text-zinc-400", loading ? "animate-spin" : "")} />
              </button>
             <button onClick={onLogout} className="p-2.5 hover:bg-rose-50 rounded-xl transition-all" title="Cerrar sesión">
               <LogOut className="w-5 h-5 text-zinc-400 hover:text-rose-600" />
             </button>
             <div className="flex items-center gap-3">
               <div className="text-right">
                  <p className="text-xs font-wallpoet text-zinc-950 italic">Admin@Jandosoft</p>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase">Superuser</p>
               </div>
               <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-lg">AD</div>
            </div>
         </div>
          <div className="flex md:hidden items-center gap-1">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => fetchDashboard()} className="p-1.5 hover:bg-zinc-50 rounded-xl transition-all" title="Actualizar datos">
               <RefreshCw className={cn("w-4 h-4 text-zinc-400", loading ? "animate-spin" : "")} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setActiveTab("settings")} className="p-1.5 hover:bg-zinc-50 rounded-xl transition-all">
              <Settings className="w-4 h-4 text-zinc-400" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={onLogout} className="p-1.5 hover:bg-rose-50 rounded-xl transition-all" title="Cerrar sesión">
              <LogOut className="w-4 h-4 text-zinc-400" />
            </motion.button>
          </div>
      </header>

      <AnimatePresence>
        {paymentToast && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-4 right-4 z-[200] bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 max-w-sm"
          >
            <DollarSign className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-xs font-black italic">Nuevo pago recibido</p>
              <p className="text-[10px] font-bold opacity-80">{paymentToast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="md:hidden flex overflow-x-auto gap-1 px-2 py-2 bg-zinc-50 border-b border-zinc-100 sticky top-0 z-10">
        {[
          { id: "dashboard", icon: <BarChart3 className="w-3.5 h-3.5" />, label: t("nav.dashboard") },
          { id: "users", icon: <Users className="w-3.5 h-3.5" />, label: t("admin.users") },
          { id: "stores", icon: <Store className="w-3.5 h-3.5" />, label: t("admin.stores") },
          { id: "store-admin", icon: <ShoppingBag className="w-3.5 h-3.5" />, label: t("section.products") },
          { id: "analytics", icon: <BarChart3 className="w-3.5 h-3.5" />, label: t("nav.analytics") },
          { id: "revenue", icon: <DollarSign className="w-3.5 h-3.5" />, label: t("admin.revenue") },
          { id: "history", icon: <FileText className="w-3.5 h-3.5" />, label: t("admin.history") },
          { id: "payments", icon: <DollarSign className="w-3.5 h-3.5" />, label: "Pagos" },
          { id: "widget", icon: <Code2 className="w-3.5 h-3.5" />, label: "Widget" },
          { id: "commercials", icon: <Megaphone className="w-3.5 h-3.5" />, label: t("admin.commercials") },
          { id: "plans", icon: <Star className="w-3.5 h-3.5" />, label: t("admin.plans") },
          { id: "settings", icon: <Settings className="w-3.5 h-3.5" />, label: t("admin.settings_label") },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[8px] font-black italic whitespace-nowrap transition-all shrink-0", activeTab === tab.id ? "bg-red-600 text-white shadow-sm" : "text-zinc-500 hover:bg-zinc-100")}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden relative">
         <aside className="hidden md:flex flex-col w-56 lg:w-64 bg-zinc-50 border-r border-zinc-100 p-4 lg:p-6 gap-6 lg:gap-8 overflow-y-auto shrink-0">
           <div className="space-y-1">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 lg:mb-4 italic">{t("admin.general")}</h3>
              <MenuItem icon={<BarChart3 />} label={t("nav.dashboard")} active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
              <MenuItem icon={<Users />} label={t("admin.users")} active={activeTab === "users"} onClick={() => setActiveTab("users")} />
              <MenuItem icon={<Store />} label={t("admin.stores")} active={activeTab === "stores"} onClick={() => setActiveTab("stores")} />
              <MenuItem icon={<ShoppingBag />} label={t("section.products")} active={activeTab === "store-admin"} onClick={() => setActiveTab("store-admin")} />
           </div>
           <div className="space-y-1">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 lg:mb-4 italic">{t("admin.management")}</h3>
              <MenuItem icon={<BarChart3 />} label={t("nav.analytics")} active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
              <MenuItem icon={<DollarSign />} label={t("admin.revenue")} active={activeTab === 'revenue'} onClick={() => setActiveTab('revenue')} />
              <MenuItem icon={<FileText />} label={t("admin.history")} active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
              <MenuItem icon={<DollarSign />} label={"Pagos"} active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} />
                <MenuItem icon={<Megaphone />} label={t("admin.commercials")} active={activeTab === 'commercials'} onClick={() => setActiveTab('commercials')} />
                <MenuItem icon={<Code2 />} label={"Widget"} active={activeTab === 'widget'} onClick={() => setActiveTab('widget')} />
                <MenuItem icon={<Mail />} label={t("admin.email")} active={activeTab === 'email'} onClick={() => setActiveTab('email')} />
                <MenuItem icon={<Star />} label={t("admin.plans")} active={activeTab === 'plans'} onClick={() => setActiveTab('plans')} />
                <MenuItem icon={<Users />} label={"Afiliados"} active={activeTab === 'affiliates'} onClick={() => setActiveTab('affiliates')} />
                <MenuItem icon={<Settings />} label={t("admin.settings_label")} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
           </div>
         </aside>

         <main className="flex-1 overflow-y-auto max-[340px]:p-2 max-[400px]:p-3 p-4 md:p-10 bg-white relative">
            <AnimatePresence mode="wait">
               {activeTab === "dashboard" && (
                  <motion.div key="dashboard" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10">
                     {loading ? (
                       <div className="flex items-center justify-center py-20">
                         <div className="flex items-center gap-3 px-6 py-4 bg-zinc-50 rounded-2xl text-zinc-400 italic font-black text-sm">
                           <Loader className="w-5 h-5 animate-spin" /> {t("admin.loading")}
                         </div>
                       </div>
                     ) : (
                       <>
                       <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-6">
                          <StatCard icon={<Users className="text-red-500" />} label={t("admin.user_total")} value={dashboardStats.totalUsers.toString()} change={t("admin.this_month").replace("{n}", String(dashboardStats.newUsersThisMonth))} />
                          <StatCard icon={<Store className="text-emerald-500" />} label={t("admin.stores_title")} value={dashboardStats.totalStores.toString()} change={`${dashboardStats.totalProducts} ${t("admin.productos")}`} />
                           <StatCard icon={<ShoppingBag className="text-amber-500" />} label="Pagos Recibidos" value={totalPaymentsCount.toString()} change={`$${(revenueData?.totalProcessed || 0).toLocaleString()}`} />
                          <StatCard icon={<TrendingUp className="text-blue-500" />} label={t("admin.today")} value={dashboardStats.activeUsersToday.toString()} change={t("admin.new_today")} />
                          <StatCard icon={<DollarSign className="text-purple-500" />} label="Stripe Connect" value={allStores.filter((s: any) => s.stripeConnectStatus === "active").length.toString()} change={`${allStores.filter((s: any) => s.stripeConnectStatus === "pending").length} pendientes`} />
                        </div>

                        {revenueData && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
                            <div className="bg-zinc-50/50 max-[400px]:p-5 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-zinc-100 space-y-4 md:space-y-6 shadow-sm">
                              <h3 className="max-[400px]:text-lg text-xl font-black italic text-zinc-950">Top Tiendas por Ingresos</h3>
                              <div className="space-y-3">
                                {Object.entries(revenueData.byStore || {}).sort(([,a]: any, [,b]: any) => b.revenue - a.revenue).slice(0, 5).map(([name, data]: any, i: number) => (
                                  <div key={name} className="flex items-center justify-between p-3 bg-white rounded-xl border border-zinc-100">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[9px] font-black text-zinc-400">#{i + 1}</span>
                                      <span className="text-[10px] font-black italic text-zinc-950 truncate max-w-[150px]">{name}</span>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[10px] font-black text-emerald-600">${data.revenue.toLocaleString()}</p>
                                      <p className="text-[8px] text-zinc-400">{data.count} pagos</p>
                                    </div>
                                  </div>
                                ))}
                                {Object.keys(revenueData.byStore || {}).length === 0 && (
                                  <p className="text-center text-zinc-300 italic text-xs py-4">Sin datos de ingresos aún</p>
                                )}
                              </div>
                            </div>
                            <div className="bg-zinc-50/50 max-[400px]:p-5 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-zinc-100 space-y-4 md:space-y-6 shadow-sm">
                              <h3 className="max-[400px]:text-lg text-xl font-black italic text-zinc-950">Resumen de Ingresos</h3>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white rounded-xl p-4 border border-zinc-100">
                                  <p className="text-[8px] font-black text-zinc-400 uppercase italic mb-1">Total Procesado</p>
                                  <p className="text-lg font-black italic text-zinc-950">${(revenueData.totalProcessed || 0).toLocaleString()}</p>
                                </div>
                                <div className="bg-white rounded-xl p-4 border border-zinc-100">
                                  <p className="text-[8px] font-black text-zinc-400 uppercase italic mb-1">Comisión Plataforma</p>
                                  <p className="text-lg font-black italic text-emerald-600">${(revenueData.totalPlatformRevenue || 0).toLocaleString()}</p>
                                </div>
                                <div className="bg-white rounded-xl p-4 border border-zinc-100">
                                  <p className="text-[8px] font-black text-zinc-400 uppercase italic mb-1">Total Pagos</p>
                                  <p className="text-lg font-black italic text-zinc-950">{revenueData.totalPayments || 0}</p>
                                </div>
                                <div className="bg-white rounded-xl p-4 border border-zinc-100">
                                  <p className="text-[8px] font-black text-zinc-400 uppercase italic mb-1">Tiendas Activas</p>
                                  <p className="text-lg font-black italic text-zinc-950">{Object.keys(revenueData.byStore || {}).length}</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <p className="text-[9px] font-black text-zinc-400 uppercase italic">Distribución por Tienda</p>
                                {Object.entries(revenueData.byStore || {}).sort(([,a]: any, [,b]: any) => b.fees - a.fees).slice(0, 5).map(([name, data]: any) => {
                                  const pct = revenueData.totalProcessed > 0 ? ((data.revenue / revenueData.totalProcessed) * 100) : 0;
                                  return (
                                    <div key={name} className="space-y-1">
                                      <div className="flex justify-between">
                                        <span className="text-[9px] font-bold text-zinc-600 truncate max-w-[120px]">{name}</span>
                                        <span className="text-[9px] font-black text-zinc-400">{pct.toFixed(1)}%</span>
                                      </div>
                                      <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
 
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
                          <div className="bg-zinc-50/50 max-[400px]:p-5 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-zinc-100 space-y-4 md:space-y-6 shadow-sm">
                             <h3 className="max-[400px]:text-lg text-xl font-black italic text-zinc-950">{t("admin.recent_activity")}</h3>
                             <div className="space-y-3 md:space-y-4">
                                 {liveActivity.map((act, i) => (
                                    <motion.div
                                      key={i}
                                      initial={{ x: 20, opacity: 0 }}
                                      animate={{ x: 0, opacity: 1 }}
                                      onClick={() => setViewingActivity(act)}
                                      className="flex items-center justify-between max-[400px]:p-3 p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm italic font-black text-[10px] md:text-xs group hover:border-red-600 hover:bg-red-50/30 transition-all cursor-pointer"
                                    >
                                       <div className="flex items-center gap-2 md:gap-3 min-w-0">
                                          <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-red-600 rounded-full animate-pulse shrink-0" />
                                          <span className="truncate">{act.action}</span>
                                       </div>
                                       <span className="text-[8px] md:text-[9px] text-zinc-400 shrink-0">{act.time}</span>
                                    </motion.div>
                                 ))}
                                {liveActivity.length === 0 && (
                                  <div className="py-6 md:py-8 text-center italic font-black text-zinc-200 text-[10px] md:text-xs">{t("admin.no_activity")}</div>
                                )}
                             </div>
                          </div>
                          <div className="bg-red-600 max-[400px]:p-6 p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] text-white space-y-6 md:space-y-8 relative overflow-hidden group shadow-2xl shadow-red-200">
                             <Zap className="absolute top-6 md:top-10 right-6 md:right-10 w-20 h-20 md:w-32 md:h-32 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
                             <div className="relative z-10 space-y-3 md:space-y-4">
                                <h3 className="max-[400px]:text-2xl text-3xl md:text-4xl font-black italic leading-none">{t("admin.scalability")}</h3>
                                <p className="text-red-100 font-medium max-[400px]:text-sm">{t("admin.cloud_desc")}</p>
                             </div>
                              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setActiveTab("settings")} className="relative z-10 px-6 md:px-8 py-3 md:py-4 bg-white text-red-600 rounded-2xl font-black italic shadow-xl hover:scale-105 transition-all text-[10px] md:text-sm">{t("admin.manage_cluster")}</motion.button>
                          </div>
                          <motion.button whileTap={{ scale: 0.95 }} onClick={() => exportCSV(allStores.map((s: any) => ({ nombre: s.name, email: s.ownerEmail, tipo: s.typeLabel || s.type, stripe: s.stripeConnectStatus || "no", productos: s.productCount || 0, clientes: s.customerCount || 0, estado: s.isSuspended ? "Suspendida" : "Activa" })), "tiendas")} className="px-3 py-1.5 bg-zinc-50 border border-zinc-100 rounded-xl text-[8px] md:text-[9px] font-black italic text-zinc-600 hover:bg-zinc-100 transition-all">
                            CSV ↓
                          </motion.button>
                       </div>
                      </>
                     )}
                  </motion.div>
               )}

                {activeTab === "users" && (
                  <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-8">
                     <div className="flex items-center justify-between flex-wrap gap-3">
                        <h3 className="max-[340px]:text-xl max-[400px]:text-2xl text-3xl font-black italic text-zinc-950 uppercase">{t("admin.users_title")} <span className="text-red-600">({filterPlan ? filteredUsers.length : allUsers.length})</span></h3>
                       <div className="flex items-center gap-2 flex-wrap">
                         <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)} className="px-2 py-1.5 bg-zinc-50 border border-zinc-100 rounded-xl text-[8px] md:text-[9px] font-black italic text-zinc-600 outline-none cursor-pointer">
                            <option value="">Todos los planes</option>
                            <option value="free">Free</option>
                            {planConfig?.plans.map((p: any) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                                                   <motion.button whileTap={{ scale: 0.95 }} onClick={() => exportCSV(filteredUsers.map((u: any) => ({ nombre: u.name, email: u.email, plan: u.subscription || "free", planOriginal: u.originalPlanName || "", precioOriginal: u.originalPlanPrice || "", estado: u.isSuspended ? "Suspendido" : "Activo", tiendas: u.storeCount || 0 })), "usuarios")} className="px-3 py-1.5 bg-zinc-50 border border-zinc-100 rounded-xl text-[8px] md:text-[9px] font-black italic text-zinc-600 hover:bg-zinc-100 transition-all">
                           CSV ↓
                         </motion.button>
                         <div className="flex items-center gap-1 px-2 py-1.5 bg-zinc-50 border border-zinc-100 rounded-xl">
                           <span className="text-[7px] md:text-[8px] font-black text-zinc-400 uppercase italic hidden sm:inline">{t("admin.duration")}</span>
                           <select
                             value={suspendDuration}
                             onChange={(e) => setSuspendDuration(e.target.value)}
                             className="bg-transparent text-[8px] md:text-[9px] font-black italic text-red-600 outline-none cursor-pointer"
                           >
                             <option value="24h">{t("admin.hours_24")}</option>
                             <option value="7d">{t("admin.days_7")}</option>
                             <option value="30d">{t("admin.days_30")}</option>
                             <option value="permanent">{t("admin.permanent")}</option>
                           </select>
                         </div>
                         <div className="relative w-full max-w-[160px] md:max-w-none">
                           <Search className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3 h-3.5 md:w-3.5 md:h-3.5 text-zinc-400" />
                           <input
                             type="text"
                             value={searchUsers}
                              onChange={(e) => handleSearchUsers(e.target.value)}
                              placeholder={t("biz.search_users")}
                             className="w-full pl-8 md:pl-9 pr-2.5 md:pr-3 py-1.5 md:py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-[9px] md:text-xs font-medium outline-none focus:ring-2 focus:ring-red-600/50"
                           />
                         </div>
                       </div>
                     </div>
                    <div className="space-y-2 md:space-y-3">
                       {filteredUsers.map((u: any) => (
                        <div key={u._id} onClick={() => setViewingUser(u)} className={cn("flex items-center justify-between max-[340px]:p-2.5 max-[400px]:p-3.5 p-5 rounded-2xl border transition-all cursor-pointer", u.isSuspended ? "bg-rose-50 border-rose-200" : "bg-zinc-50 border-zinc-100 hover:border-red-200")}>
                          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                            <div className={cn("w-7 h-7 md:w-12 md:h-12 rounded-lg md:rounded-2xl flex items-center justify-center shadow-sm font-black italic text-[9px] md:text-base shrink-0", u.isSuspended ? "bg-rose-100 text-rose-600" : "bg-white text-red-600")}>
                              {u.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 md:gap-2">
                                <p className={cn("font-black italic text-[10px] md:text-base truncate", u.isSuspended ? "text-rose-700" : "text-zinc-950")}>{u.name}</p>
                                {u.isSuspended && (
                                  <span className="px-1 py-0.5 bg-rose-200 text-rose-700 rounded-full text-[6px] md:text-[7px] font-black uppercase italic leading-none">{t("biz.suspended_user")}</span>
                                )}
                                {u.isAffiliate && (
                                  <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-[6px] md:text-[7px] font-black uppercase italic leading-none border border-red-200">AFILIADO</span>
                                )}
                              </div>
                              <p className="text-[8px] md:text-[10px] text-zinc-400 font-bold italic truncate">{u.email}</p>
                              {u.isAffiliate && (
                                <p className="text-[7px] md:text-[8px] text-red-500 font-bold italic">Afiliado — Ganancias: ${u.affiliateEarnings?.toFixed(2) || "0.00"}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 md:gap-4 shrink-0">
                            <div className="text-right hidden md:block">
                              <p className="text-[9px] md:text-[10px] font-black italic text-zinc-950">                              {t("biz.total_stores").replace("{n}", String(u.storeCount || 0))}</p>
                               {changingPlanUserId === u._id ? (
                                <div className="flex items-center gap-1 mt-1">
                                   <select
                                     value={changingPlanValue || u.subscription || "free"}
                                     onChange={(e) => setChangingPlanValue(e.target.value)}
                                     className="text-[9px] font-black italic bg-white border border-zinc-200 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-red-600 min-w-[120px]"
                                   >
                                     <option value="free">Free (Gratis)</option>
                                     {planConfig?.plans.map((p: any) => (
                                       <option key={p.id} value={p.id}>{p.name} — ${p.price || 0}</option>
                                     ))}
                                   </select>
                                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleChangeUserPlan(u._id, changingPlanValue)} className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-all"><Check className="w-3 h-3" /></motion.button>
                                  <button onClick={() => { setChangingPlanUserId(null); setChangingPlanValue(""); }} className="p-1.5 bg-zinc-100 text-zinc-400 rounded-lg hover:bg-zinc-200 hover:text-zinc-600 transition-all"><X className="w-3 h-3" /></button>
                                </div>
                              ) : (
                                <button onClick={() => { setChangingPlanUserId(u._id); setChangingPlanValue(u.subscription || "free"); }} className={cn("text-[8px] md:text-[9px] font-bold uppercase italic hover:text-red-600 transition-colors", u.subscription ? "text-emerald-600" : "text-zinc-400")}>
                                  {getPlanLabel(u.subscription)} <Edit3 className="w-2.5 h-2.5 inline ml-0.5 opacity-40" />
                                  {u.originalPlan && <span className="text-[7px] bg-amber-100 text-amber-600 px-1 py-0.5 rounded-full font-black ml-1">↑{u.originalPlanName || getPlanLabel(u.originalPlan)}</span>}
                                </button>
                              )}
                            </div>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => { e.stopPropagation(); handleImpersonate(u._id, u.name || u.email); }}
                              className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-blue-50 text-blue-500 hover:bg-blue-100 transition-all"
                              title="Ver como usuario"
                            >
                              <Eye className="w-3 h-3 md:w-3.5 md:h-3.5" />
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                if (u.isSuspended) {
                                  handleToggleUserSuspend(u._id);
                                } else {
                                  setConfirmingId(u._id);
                                  setConfirmingType('user');
                                }
                              }}
                              className={cn("p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all", u.isSuspended ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200" : "bg-rose-100 text-rose-500 hover:bg-rose-200")}
                              title={u.isSuspended ? t("biz.activate") : t("biz.suspend")}
                            >
                              {u.isSuspended ? <CheckCircle className="w-3 h-3 md:w-3.5 md:h-3.5" /> : <Ban className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                            </motion.button>
                          </div>
                        </div>
                      ))}
                      {allUsers.length === 0 && (
                        <div className="py-12 md:py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">{searchUsers ? t("status.noresults") : t("biz.no_customers")}</div>
                      )}
                    </div>
                    {totalUsersPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-4">
                        <motion.button whileTap={{ scale: 0.9 }}
                          onClick={() => { const p = Math.max(1, usersPage - 1); setUsersPage(p); fetchDashboard({ usersPage: p }); }}
                          disabled={usersPage <= 1}
                          className="px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-[9px] font-black italic text-zinc-500 hover:bg-zinc-100 transition-all disabled:opacity-30"
                        >{t("admin.previous")}</motion.button>
                        <span className="text-[9px] font-black italic text-zinc-400 px-2">{usersPage} / {totalUsersPages}</span>
                        <motion.button whileTap={{ scale: 0.9 }}
                          onClick={() => { const p = Math.min(totalUsersPages, usersPage + 1); setUsersPage(p); fetchDashboard({ usersPage: p }); }}
                          disabled={usersPage >= totalUsersPages}
                          className="px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-[9px] font-black italic text-zinc-500 hover:bg-zinc-100 transition-all disabled:opacity-30"
                        >{t("admin.next")}</motion.button>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "stores" && (
                  <motion.div key="stores" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-8">
                     <div className="flex items-center justify-between flex-wrap gap-3">
                        <h3 className="max-[340px]:text-xl max-[400px]:text-2xl text-3xl font-black italic text-zinc-950 uppercase">{t("admin.stores_title")} <span className="text-red-600">({allStores.length})</span></h3>
                       <div className="flex items-center gap-2 flex-wrap">
                         <div className="flex items-center gap-1 px-2 py-1.5 bg-zinc-50 border border-zinc-100 rounded-xl">
                           <span className="text-[7px] md:text-[8px] font-black text-zinc-400 uppercase italic hidden sm:inline">Dur:</span>
                           <select
                             value={suspendDuration}
                             onChange={(e) => setSuspendDuration(e.target.value)}
                             className="bg-transparent text-[8px] md:text-[9px] font-black italic text-red-600 outline-none cursor-pointer"
                           >
                             <option value="24h">{t("admin.hours_24")}</option>
                             <option value="7d">{t("admin.days_7")}</option>
                             <option value="30d">{t("admin.days_30")}</option>
                             <option value="permanent">{t("admin.permanent")}</option>
                           </select>
                         </div>
                         <div className="relative w-full max-w-[160px] md:max-w-none">
                           <Search className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3 h-3.5 md:w-3.5 md:h-3.5 text-zinc-400" />
                           <input
                             type="text"
                             value={searchStores}
                              onChange={(e) => handleSearchStores(e.target.value)}
                              placeholder={t("biz.search_stores")}
                             className="w-full pl-8 md:pl-9 pr-2.5 md:pr-3 py-1.5 md:py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-[9px] md:text-xs font-medium outline-none focus:ring-2 focus:ring-red-600/50"
                           />
                         </div>
                       </div>
                     </div>
                    <div className="space-y-2 md:space-y-3">
                       {allStores.map((s: any) => (
                        <div key={s._id} onClick={() => setViewingStore(s)} className={cn("flex items-center justify-between max-[340px]:p-2.5 max-[400px]:p-3.5 p-5 rounded-2xl border transition-all cursor-pointer", s.isSuspended ? "bg-rose-50 border-rose-200" : "bg-zinc-50 border-zinc-100 hover:border-red-200")}>
                          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                            <div className={cn("w-7 h-7 md:w-12 md:h-12 rounded-lg md:rounded-2xl flex items-center justify-center shadow-sm shrink-0", s.isSuspended ? "bg-rose-100 text-rose-600" : "bg-white text-red-600")}>
                              <Store className="w-3.5 h-3.5 md:w-6 md:h-6" />
                            </div>
                            <div className="min-w-0">
                               <div className="flex items-center gap-1.5 md:gap-2">
                                <p className={cn("font-black italic text-[10px] md:text-base truncate", s.isSuspended ? "text-rose-700" : "text-zinc-950")}>{s.name}</p>
                                {s.isSuspended && (
                                  <span className="px-1 py-0.5 bg-rose-200 text-rose-700 rounded-full text-[6px] md:text-[7px] font-black uppercase italic leading-none">{t("biz.suspended")}</span>
                                )}
                                {s.stripeConnectStatus === "active" && (
                                  <span className="px-1 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[6px] md:text-[7px] font-black uppercase italic leading-none">Stripe ✓</span>
                                )}
                                {s.stripeConnectStatus === "pending" && (
                                  <span className="px-1 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-[6px] md:text-[7px] font-black uppercase italic leading-none">Stripe ⏳</span>
                                )}
                              </div>
                              <p className="text-[8px] md:text-[10px] text-zinc-400 font-bold italic truncate">{s.ownerEmail} · {s.typeLabel || s.type}{s.stripeAccountEmail ? ` · ${s.stripeAccountEmail}` : ""}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
                            <div className="flex gap-1.5 md:gap-4 text-[7px] md:text-[10px] font-black italic text-zinc-500">
                              <span>{t("biz.products_count").replace("{n}", String(s.productCount))}</span>
                              <span className="hidden md:inline">{t("biz.customers_count").replace("{n}", String(s.customerCount))}</span>
                              <span className="max-[340px]:hidden">{t("biz.orders_count").replace("{n}", String(s.orderCount))}</span>
                            </div>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                if (s.isSuspended) {
                                  handleToggleSuspend(s._id);
                                } else {
                                  setConfirmingId(s._id);
                                  setConfirmingType('store');
                                }
                              }}
                              className={cn("p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all", s.isSuspended ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200" : "bg-rose-100 text-rose-500 hover:bg-rose-200")}
                              title={s.isSuspended ? t("biz.activate") : t("biz.suspend")}
                            >
                              {s.isSuspended ? <CheckCircle className="w-3 h-3 md:w-3.5 md:h-3.5" /> : <Ban className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                            </motion.button>
                          </div>
                        </div>
                      ))}
                      {allStores.length === 0 && (
                        <div className="py-12 md:py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">{searchStores ? t("status.noresults") : "No hay empresas creadas"}</div>
                      )}
                    </div>
                    {totalStoresPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-4">
                        <motion.button whileTap={{ scale: 0.9 }}
                          onClick={() => { const p = Math.max(1, storesPage - 1); setStoresPage(p); fetchDashboard({ storesPage: p }); }}
                          disabled={storesPage <= 1}
                          className="px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-[9px] font-black italic text-zinc-500 hover:bg-zinc-100 transition-all disabled:opacity-30"
                        >ANTERIOR</motion.button>
                        <span className="text-[9px] font-black italic text-zinc-400 px-2">{storesPage} / {totalStoresPages}</span>
                        <motion.button whileTap={{ scale: 0.9 }}
                          onClick={() => { const p = Math.min(totalStoresPages, storesPage + 1); setStoresPage(p); fetchDashboard({ storesPage: p }); }}
                          disabled={storesPage >= totalStoresPages}
                          className="px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-[9px] font-black italic text-zinc-500 hover:bg-zinc-100 transition-all disabled:opacity-30"
                        >SIGUIENTE</motion.button>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "store-admin" && (
                   <motion.div key="store" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 md:space-y-10">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                         <h3 className="max-[400px]:text-2xl text-3xl font-black italic text-zinc-950 uppercase">{t("admin.products_title")}</h3>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Empresa</label>
                        <select
                          value={selectedStoreId}
                          onChange={(e) => {
                            setSelectedStoreId(e.target.value);
                            setStoreProducts([]);
                            setNewProduct({ name: "", price: "", desc: "", images: [] });
                            if (e.target.value) fetchStoreProducts(e.target.value);
                          }}
                          className="w-full h-12 bg-white border border-zinc-100 rounded-xl px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-red-600/50 italic"
                        >
                          <option value="">Seleccionar empresa...</option>
                          {allStores.map((s: any) => (
                            <option key={s._id} value={s._id}>{s.name} ({s.ownerEmail})</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
                         <div className="bg-zinc-50 max-[400px]:p-5 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-zinc-100 space-y-5 md:space-y-6 shadow-sm">
                            <div className="space-y-3 md:space-y-4">
                               <div className="grid grid-cols-2 gap-3 md:gap-4">
                                  <AdminInput label={t("admin.product_name")} placeholder="Ej. Plan Avanzado" value={newProduct.name} onChange={(v: string) => setNewProduct({...newProduct, name: v})} />
                                  <AdminInput label={t("admin.investment").replace("{currency}", currency)} placeholder="Ej. 299" type="number" value={newProduct.price} onChange={(v: string) => setNewProduct({...newProduct, price: v})} />
                               </div>
                               
                               <motion.button whileTap={{ scale: 0.95 }}
                                 onClick={handlePublishProduct}
                                 disabled={!selectedStoreId || publishingProduct || !newProduct.name || !newProduct.price}
                                 className="w-full py-4 md:py-5 bg-red-600 text-white rounded-2xl font-black italic shadow-xl shadow-red-100 hover:bg-red-700 transition-all flex items-center justify-center gap-3 uppercase text-xs md:text-sm disabled:opacity-50"
                               >
                                 {publishingProduct ? "PUBLICANDO..." : (t("admin.publish_product") + " ")} <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                               </motion.button>
                            </div>
                         </div>

                         <div className="space-y-3 md:space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">
                                {selectedStoreId ? `Productos (${storeProducts.length})` : "Selecciona una empresa"}
                              </h4>
                              {selectedStoreId && (
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => fetchStoreProducts(selectedStoreId)} className="p-1.5 hover:bg-zinc-50 rounded-lg transition-all">
                                  <RefreshCw className={cn("w-3.5 h-3.5 text-zinc-400", loadingProducts ? "animate-spin" : "")} />
                                </motion.button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 gap-3 md:gap-4">
                               {loadingProducts ? (
                                 <div className="py-8 text-center italic font-black text-zinc-200 text-[10px]">Cargando...</div>
                               ) : storeProducts.length === 0 ? (
                                 <div className="py-8 text-center italic font-black text-zinc-200 text-[10px]">Sin productos</div>
                               ) : (storeProducts.map((p: any) => (
                                  <div key={p.id} className="bg-white max-[400px]:p-3 p-4 rounded-2xl md:rounded-3xl border border-zinc-100 shadow-sm flex items-center justify-between group hover:border-red-600/20 transition-all">
                                     <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                                        <div className="w-8 h-8 md:w-12 md:h-12 bg-zinc-50 rounded-xl md:rounded-2xl flex items-center justify-center text-red-600 shadow-inner shrink-0">
                                           <Package className="w-4 h-4 md:w-6 md:h-6" />
                                        </div>
                                        <div className="min-w-0">
                                           <p className="font-black italic text-xs md:text-sm text-zinc-950 truncate">{p.name}</p>
                                           <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 italic">{currency} {p.price}</p>
                                        </div>
                                     </div>
                                     <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDeleteStoreProduct(p.id)} className="p-2 md:p-3 text-zinc-300 hover:text-rose-500 transition-colors shrink-0">
                                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                     </motion.button>
                                  </div>
                               )))}
                            </div>
                         </div>
                      </div>
                   </motion.div>
                )}

               
                {activeTab === "settings" && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 md:space-y-10">
                      <h3 className="max-[400px]:text-2xl text-3xl font-black italic text-zinc-950 uppercase">{t("admin.config_title")}</h3>
                      <div className="max-w-md space-y-4">
                        <div className="bg-zinc-50 p-6 md:p-8 rounded-[2rem] border border-zinc-100 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl shadow-sm"><ShieldCheck className="w-5 h-5 text-red-600" /></div>
                            <div>
                              <p className="text-xs font-wallpoet italic text-zinc-950 uppercase">Jandosoft Admin</p>
                              <p className="text-[9px] font-bold text-zinc-400">Versión 1.0.0</p>
                            </div>
                          </div>
                          <div className="w-full h-px bg-zinc-200" />
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={onLogout}
                            className="w-full py-3 md:py-4 bg-rose-600 text-white rounded-2xl font-black italic text-[10px] md:text-xs hover:bg-rose-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-100"
                          >
                            <LogOut className="w-4 h-4" /> CERRAR SESIÓN
                          </motion.button>
                        </div>

                        <div className="bg-rose-50 p-6 md:p-8 rounded-[2rem] border border-rose-100 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl shadow-sm"><Trash2 className="w-5 h-5 text-rose-600" /></div>
                            <div>
                              <p className="text-xs font-wallpoet italic text-zinc-950 uppercase">Zona de Peligro</p>
                              <p className="text-[9px] font-bold text-zinc-400">Acciones irreversibles</p>
                            </div>
                          </div>
                          <div className="w-full h-px bg-rose-200" />
                          <button
                            onClick={() => { setShowResetDb(true); setResetConfirmText(""); setResetResult(null); }}
                            className="w-full py-3 md:py-4 bg-white border-2 border-rose-200 text-rose-600 rounded-2xl font-black italic text-[10px] md:text-xs hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" /> RESETEAR BASE DE DATOS
                          </button>
                          <p className="text-[9px] text-rose-400 text-center">Elimina todos los datos excepto este administrador</p>
                        </div>
                      </div>
                   </motion.div>
                )}

                {showResetDb && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowResetDb(false)}>
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-[2rem] p-6 md:p-8 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                      {!resetResult ? (
                        <>
                          <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                              <Trash2 className="w-8 h-8 text-rose-600" />
                            </div>
                            <h3 className="text-lg font-black italic text-zinc-950 uppercase">Reseteo de Base de Datos</h3>
                            <p className="text-xs text-zinc-500 mt-2">Esta acción eliminará TODOS los datos de la plataforma. No se puede deshacer.</p>
                          </div>
                          <div className="space-y-2 mb-6">
                            <p className="text-[10px] font-bold text-zinc-500">Se eliminarán:</p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {["Tiendas", "Productos", "Clientes", "Citas", "Pagos", "Facturas", "Mensajes", "Conversaciones", "Notificaciones", "Integraciones", "Widget Config", "Email Logs"].map(item => (
                                <div key={item} className="flex items-center gap-1.5 text-[10px] text-rose-600">
                                  <span className="w-1 h-1 bg-rose-400 rounded-full" />
                                  {item}
                                </div>
                              ))}
                            </div>
                            <p className="text-[10px] font-bold text-emerald-600 mt-2">Se conservará: Administrador</p>
                          </div>
                          <div className="space-y-3">
                            <p className="text-[10px] font-bold text-zinc-500 text-center">Escribe <span className="font-black text-rose-600">ELIMINAR</span> para confirmar:</p>
                            <input
                              type="text"
                              value={resetConfirmText}
                              onChange={e => setResetConfirmText(e.target.value)}
                              placeholder="ELIMINAR"
                              className="w-full p-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl text-center font-mono text-sm font-bold focus:border-rose-400 outline-none transition-colors"
                            />
                            <div className="flex gap-2">
                              <button onClick={() => setShowResetDb(false)} className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-black italic text-[10px] hover:bg-zinc-200 transition-all">
                                Cancelar
                              </button>
                              <button
                                onClick={handleResetDatabase}
                                disabled={resetConfirmText !== "ELIMINAR" || resetting}
                                className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-black italic text-[10px] hover:bg-rose-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                {resetting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                {resetting ? "Eliminando..." : "ELIMINAR TODO"}
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center">
                          {resetResult.error ? (
                            <>
                              <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-8 h-8 text-rose-600" />
                              </div>
                              <h3 className="text-lg font-black italic text-zinc-950 uppercase">Error</h3>
                              <p className="text-xs text-zinc-500 mt-2">{resetResult.error}</p>
                            </>
                          ) : (
                            <>
                              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-emerald-600" />
                              </div>
                              <h3 className="text-lg font-black italic text-zinc-950 uppercase">Base de datos reiniciada</h3>
                              <p className="text-xs text-zinc-500 mt-2 mb-4">{resetResult.message}</p>
                              <div className="bg-zinc-50 rounded-xl p-3 text-left max-h-48 overflow-y-auto">
                                {Object.entries(resetResult.results || {}).map(([name, count]) => (
                                  <div key={name} className="flex items-center justify-between py-1 border-b border-zinc-100 last:border-0">
                                    <span className="text-[10px] font-medium text-zinc-600">{name}</span>
                                    <span className="text-[10px] font-bold text-zinc-400">{String(count)} docs</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                          <button onClick={() => { setShowResetDb(false); setResetResult(null); setResetConfirmText(""); }}
                            className="mt-4 w-full py-3 bg-zinc-100 text-zinc-600 rounded-xl font-black italic text-[10px] hover:bg-zinc-200 transition-all">
                            Cerrar
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                )}

                {activeTab === "history" && (
                   <motion.div key="history" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 md:space-y-8">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                         <h3 className="max-[400px]:text-2xl text-3xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("admin.history_title")}</h3>
                         <div className="px-3 md:px-4 py-1.5 md:py-2 bg-zinc-950 text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase italic">{allInvoices.length} Facturas</div>
                      </div>

                      <div className="bg-white border border-zinc-100 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-xl overflow-x-auto">
                         <table className="w-full text-left min-w-[500px]">
                            <thead className="bg-zinc-50 border-b border-zinc-100">
                               <tr>
                                  <th className="max-[400px]:px-4 px-5 md:px-8 max-[400px]:py-3 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Factura</th>
                                  <th className="max-[400px]:px-4 px-5 md:px-8 max-[400px]:py-3 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Cliente</th>
                                  <th className="max-[400px]:px-4 px-5 md:px-8 max-[400px]:py-3 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Monto</th>
                                  <th className="max-[400px]:px-4 px-5 md:px-8 max-[400px]:py-3 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Comprobante</th>
                               </tr>
                            </thead>
                            <tbody>
                               {allInvoices.map((inv) => (
                                  <tr key={inv._id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                                     <td className="max-[400px]:px-4 px-5 md:px-8 max-[400px]:py-4 py-5 md:py-6">
                                        <p className="text-[10px] md:text-xs font-black text-zinc-950 italic">{inv.invoiceNumber}</p>
                                        <p className="text-[9px] md:text-[10px] text-zinc-400 font-bold">{new Date(inv.createdAt).toLocaleDateString()}</p>
                                     </td>
                                     <td className="max-[400px]:px-4 px-5 md:px-8 max-[400px]:py-4 py-5 md:py-6">
                                        <p className="text-[10px] md:text-xs font-bold text-zinc-600 italic truncate max-w-[120px] md:max-w-none">{inv.userEmail}</p>
                                     </td>
                                     <td className="max-[400px]:px-4 px-5 md:px-8 max-[400px]:py-4 py-5 md:py-6">
                                        <p className="text-xs md:text-sm font-black text-red-600 italic">{inv.currency} ${inv.amount}</p>
                                     </td>
                                     <td className="max-[400px]:px-4 px-5 md:px-8 max-[400px]:py-4 py-5 md:py-6 text-right">
                                        <motion.button whileTap={{ scale: 0.9 }}
                                           onClick={() => generateInvoicePDF(inv)}
                                           className="p-2 md:p-3 bg-zinc-50 text-zinc-400 hover:text-red-600 hover:bg-white hover:shadow-lg rounded-xl transition-all"
                                        >
                                           <Download className="w-4 h-4 md:w-5 md:h-5" />
                                        </motion.button>
                                     </td>
                                  </tr>
                               ))}
                               {allInvoices.length === 0 && (
                                  <tr>
                                     <td colSpan={4} className="max-[400px]:px-4 px-5 md:px-8 max-[400px]:py-12 py-16 md:py-20 text-center italic font-black uppercase text-zinc-200 tracking-widest text-xs md:text-sm">No hay facturas registradas</td>
                                  </tr>
                               )}
                            </tbody>
                          </table>
                       </div>
                    {totalInvoicesPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-4">
                        <motion.button whileTap={{ scale: 0.9 }}
                          onClick={() => { const p = Math.max(1, invoicesPage - 1); setInvoicesPage(p); fetchDashboard({ invoicesPage: p }); }}
                          disabled={invoicesPage <= 1}
                          className="px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-[9px] font-black italic text-zinc-500 hover:bg-zinc-100 transition-all disabled:opacity-30"
                        >ANTERIOR</motion.button>
                        <span className="text-[9px] font-black italic text-zinc-400 px-2">{invoicesPage} / {totalInvoicesPages}</span>
                        <motion.button whileTap={{ scale: 0.9 }}
                          onClick={() => { const p = Math.min(totalInvoicesPages, invoicesPage + 1); setInvoicesPage(p); fetchDashboard({ invoicesPage: p }); }}
                          disabled={invoicesPage >= totalInvoicesPages}
                          className="px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-[9px] font-black italic text-zinc-500 hover:bg-zinc-100 transition-all disabled:opacity-30"
                        >SIGUIENTE</motion.button>
                      </div>
                    )}
                    </motion.div>
                   )}

                {activeTab === "payments" && (
                   <motion.div key="payments" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 md:space-y-8">
                       <div className="flex items-center justify-between flex-wrap gap-3">
                          <h3 className="max-[400px]:text-2xl text-3xl font-black italic text-zinc-950 uppercase tracking-tighter">Pagos Recibidos</h3>
                          <div className="flex items-center gap-2">
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => exportCSV(allPayments.map((p: any) => ({ cliente: p.customerName || p.customerEmail, monto: p.amount, moneda: p.displayCurrency, estado: p.status || p.paymentStatus, fecha: p.createdAt, tienda: p.storeName })), "pagos")} className="px-3 py-1.5 bg-zinc-50 border border-zinc-100 rounded-xl text-[9px] font-black italic text-zinc-600 hover:bg-zinc-100 transition-all">
                              CSV ↓
                            </motion.button>
                            <div className="px-3 md:px-4 py-1.5 md:py-2 bg-zinc-950 text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase italic">{totalPaymentsCount} Pagos</div>
                          </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: "all", label: "Todos" },
                          { value: "completed", label: "Aprobados" },
                          { value: "pending", label: "Pendientes" },
                          { value: "failed", label: "Fallidos" },
                        ].map(opt => (
                          <motion.button key={opt.value} whileTap={{ scale: 0.95 }}
                            onClick={() => { setPaymentStatus(opt.value); setPaymentsPage(1); fetchDashboard({ paymentStatus: opt.value, paymentsPage: 1 }); }}
                            className={`px-4 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase italic transition-all border ${paymentStatus === opt.value ? "bg-zinc-950 text-white border-zinc-950" : "bg-zinc-50 text-zinc-500 border-zinc-100 hover:bg-zinc-100"}`}
                          >{opt.label}</motion.button>
                        ))}
                      </div>

                      <div className="relative">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                         <input
                           type="text"
                           value={paymentSearch}
                           onChange={e => setPaymentSearch(e.target.value)}
                           onKeyDown={e => { if (e.key === "Enter") { setPaymentsPage(1); fetchDashboard({ paymentSearch, paymentsPage: 1 }); } }}
                           placeholder="Buscar por email, descripción, recibo..."
                           className="w-full bg-zinc-50 pl-11 pr-4 py-3 rounded-2xl border border-zinc-100 outline-none font-bold text-sm focus:bg-white focus:border-red-200 transition-all italic"
                         />
                      </div>

                      <div className="bg-white border border-zinc-100 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-xl overflow-x-auto">
                         <table className="w-full text-left min-w-[600px]">
                            <thead className="bg-zinc-50 border-b border-zinc-100">
                               <tr>
                                  <th className="px-5 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Fecha</th>
                                  <th className="px-5 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Cliente</th>
                                  <th className="px-5 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Descripción</th>
                                  <th className="px-5 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Monto</th>
                                  <th className="px-5 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Estado</th>
                                  <th className="px-5 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Método</th>
                                  <th className="px-5 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Recibo</th>
                               </tr>
                            </thead>
                            <tbody>
                               {allPayments.map((p: any) => {
                                  const status = p.status || p.paymentStatus || "unknown";
                                  const statusColor = status === "completed" || status === "finished" || status === "confirmed" || status === "succeeded"
                                    ? "bg-emerald-50 text-emerald-600"
                                    : status === "pending" || status === "waiting" || status === "confirming"
                                    ? "bg-amber-50 text-amber-600"
                                    : "bg-red-50 text-red-600";
                                  return (
                                   <tr key={p._id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                                      <td className="px-5 md:px-8 py-4 md:py-5">
                                         <p className="text-[10px] md:text-xs font-black text-zinc-950 italic">{new Date(p.createdAt).toLocaleDateString()}</p>
                                         <p className="text-[9px] md:text-[10px] text-zinc-400 font-bold">{p.receiptNumber || `#${p._id?.slice(-6)}`}</p>
                                      </td>
                                      <td className="px-5 md:px-8 py-4 md:py-5">
                                         <button onClick={() => p.customerEmail && setUserPaymentsModal({ email: p.customerEmail, name: p.customerName })} className="text-left hover:underline">
                                           <p className="text-[10px] md:text-xs font-bold text-zinc-600 italic truncate max-w-[120px] md:max-w-none">{p.customerName || p.customerEmail || "—"}</p>
                                           {p.customerEmail && <p className="text-[9px] md:text-[10px] text-zinc-400 italic truncate max-w-[120px] md:max-w-none">{p.customerEmail}</p>}
                                         </button>
                                      </td>
                                      <td className="px-5 md:px-8 py-4 md:py-5">
                                         <p className="text-[10px] md:text-xs font-bold text-zinc-600 italic truncate max-w-[120px] md:max-w-none">{p.displayDescription || p.description || "—"}</p>
                                      </td>
                                      <td className="px-5 md:px-8 py-4 md:py-5">
                                         <p className="text-xs md:text-sm font-black text-red-600 italic">{p.displayCurrency || (p.currency || "USD").toUpperCase()} ${p.displayAmount?.toFixed(2) || p.amount?.toFixed(2)}</p>
                                      </td>
                                      <td className="px-5 md:px-8 py-4 md:py-5">
                                         <span className={`px-2 py-0.5 rounded-full text-[8px] md:text-[9px] font-black italic uppercase ${statusColor}`}>{status}</span>
                                      </td>
                                      <td className="px-5 md:px-8 py-4 md:py-5">
                                         <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded-full text-[8px] md:text-[9px] font-black italic uppercase">{p.displayPaymentMethod}</span>
                                      </td>
                                      <td className="px-5 md:px-8 py-4 md:py-5 text-right">
                                         <motion.button whileTap={{ scale: 0.9 }}
                                            onClick={async () => {
                                              try {
                                                const res = await fetch(`/api/receipts/${p._id}`);
                                                if (!res.ok) return;
                                                const blob = await res.blob();
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement("a");
                                                a.href = url;
                                                a.download = `Recibo_${p.receiptNumber || p._id?.slice(-8)}.pdf`;
                                                a.click();
                                                URL.revokeObjectURL(url);
                                              } catch {}
                                            }}
                                            className="p-2 md:p-3 bg-zinc-50 text-zinc-400 hover:text-red-600 hover:bg-white hover:shadow-lg rounded-xl transition-all"
                                         >
                                            <Download className="w-4 h-4 md:w-5 md:h-5" />
                                         </motion.button>
                                      </td>
                                   </tr>
                                  );
                               })}
                               {allPayments.length === 0 && (
                                   <tr>
                                      <td colSpan={7} className="px-5 md:px-8 py-12 md:py-16 text-center italic font-black uppercase text-zinc-200 tracking-widest text-xs md:text-sm">No hay pagos registrados</td>
                                   </tr>
                               )}
                            </tbody>
                          </table>
                       </div>

                       {totalPaymentsPages > 1 && (
                         <div className="flex items-center justify-center gap-3 pt-2">
                           <motion.button whileTap={{ scale: 0.95 }} disabled={paymentsPage <= 1}
                             onClick={() => { setPaymentsPage(p => p - 1); fetchDashboard({ paymentsPage: paymentsPage - 1 }); }}
                             className="px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-[9px] font-black italic text-zinc-500 hover:bg-zinc-100 transition-all disabled:opacity-30"
                           >ANTERIOR</motion.button>
                           <span className="text-[10px] font-black text-zinc-400 italic">{paymentsPage} / {totalPaymentsPages}</span>
                           <motion.button whileTap={{ scale: 0.95 }} disabled={paymentsPage >= totalPaymentsPages}
                             onClick={() => { setPaymentsPage(p => p + 1); fetchDashboard({ paymentsPage: paymentsPage + 1 }); }}
                             className="px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-[9px] font-black italic text-zinc-500 hover:bg-zinc-100 transition-all disabled:opacity-30"
                           >SIGUIENTE</motion.button>
                         </div>
                       )}
                    </motion.div>
                )}

                 {activeTab === "analytics" && (
                   <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 md:space-y-8">
                     <h3 className="max-[400px]:text-2xl text-3xl font-black italic text-zinc-950 uppercase">Analytics</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                       <div className="bg-zinc-50 max-[400px]:p-5 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-zinc-100 space-y-2 md:space-y-4">
                         <p className="text-[8px] md:text-[10px] font-black text-zinc-400 uppercase italic">Total Usuarios</p>
                         <p className="max-[400px]:text-3xl text-4xl md:text-5xl font-black italic text-zinc-950">{dashboardStats.totalUsers}</p>
                       </div>
                       <div className="bg-zinc-50 max-[400px]:p-5 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-zinc-100 space-y-2 md:space-y-4">
                         <p className="text-[8px] md:text-[10px] font-black text-zinc-400 uppercase italic">Total Empresas</p>
                         <p className="max-[400px]:text-3xl text-4xl md:text-5xl font-black italic text-zinc-950">{dashboardStats.totalStores}</p>
                       </div>
                       <div className="bg-zinc-50 max-[400px]:p-5 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-zinc-100 space-y-2 md:space-y-4">
                         <p className="text-[8px] md:text-[10px] font-black text-zinc-400 uppercase italic">Ingresos Totales</p>
                          <p className="max-[400px]:text-3xl text-4xl md:text-5xl font-black italic text-zinc-950">${(revenueData?.totalProcessed || 0).toLocaleString()}</p>
                       </div>
                     </div>
                   </motion.div>
                )}

                {activeTab === "revenue" && (
                  <AdminRevenuePanel revenueData={revenueData} loading={revenueLoading} onRefresh={() => { fetchRevenue(); fetchDashboard(); }} payments={allPayments} />
                )}

                {activeTab === "commercials" && (
                  <motion.div key="commercials" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 md:space-y-10">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <h3 className="max-[340px]:text-xl max-[400px]:text-2xl text-3xl font-black italic text-zinc-950 uppercase">Comerciales <span className="text-red-600">({commercials.length})</span></h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
                      <div className="bg-zinc-50 max-[400px]:p-5 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-zinc-100 space-y-5 md:space-y-6 shadow-sm">
                        <h4 className="text-[10px] font-black text-zinc-400 uppercase italic tracking-widest">Nuevo Comercial</h4>
                        <div className="space-y-3 md:space-y-4">
                          <AdminInput label="Título" placeholder="Ej. Nueva Promoción" value={newCommercial.title} onChange={(v: string) => setNewCommercial({...newCommercial, title: v})} />
                          <AdminInput label="URL de Imagen" placeholder="https://ejemplo.com/imagen.jpg" value={newCommercial.imageUrl} onChange={(v: string) => setNewCommercial({...newCommercial, imageUrl: v})} />
                          <AdminInput label="URL de Destino (opcional)" placeholder="https://ejemplo.com" value={newCommercial.linkUrl} onChange={(v: string) => setNewCommercial({...newCommercial, linkUrl: v})} />
                          <motion.button whileTap={{ scale: 0.95 }}
                            onClick={handleCreateCommercial}
                            className="w-full py-4 md:py-5 bg-red-600 text-white rounded-2xl font-black italic shadow-xl shadow-red-100 hover:bg-red-700 transition-all flex items-center justify-center gap-3 uppercase text-xs md:text-sm"
                          >
                            PUBLICAR COMERCIAL <Megaphone className="w-4 h-4 md:w-5 md:h-5" />
                          </motion.button>
                        </div>
                      </div>

                      <div className="space-y-3 md:space-y-4">
                        <h4 className="text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">Comerciales Activos</h4>
                        <div className="grid grid-cols-1 gap-3 md:gap-4">
                          {commercials.map((c: any) => (
                            <div key={c._id} className="bg-white max-[400px]:p-3 p-4 rounded-2xl md:rounded-3xl border border-zinc-100 shadow-sm flex items-center justify-between group hover:border-red-600/20 transition-all">
                              <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                                <div className="w-10 h-10 md:w-14 md:h-14 bg-zinc-50 rounded-xl md:rounded-2xl overflow-hidden shadow-inner shrink-0">
                                  {c.imageUrl ? (
                                    <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-300"><ImageIcon className="w-4 h-4" /></div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-black italic text-xs md:text-sm text-zinc-950 truncate">{c.title}</p>
                                  {c.linkUrl && (
                                    <p className="text-[8px] md:text-[9px] text-zinc-400 font-bold italic truncate flex items-center gap-1">
                                      <ExternalLink className="w-2.5 h-2.5" /> {c.linkUrl}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <motion.button whileTap={{ scale: 0.9 }}
                                onClick={() => handleDeleteCommercial(c._id)}
                                className="p-2 md:p-3 text-zinc-300 hover:text-rose-500 transition-colors shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </motion.button>
                            </div>
                          ))}
                          {commercials.length === 0 && (
                            <div className="py-12 text-center italic font-black uppercase tracking-widest text-zinc-200 text-[10px]">Sin comerciales publicados</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "plans" && (
                  <motion.div key="plans" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 md:space-y-10">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <h3 className="max-[400px]:text-2xl text-3xl font-black italic text-zinc-950 uppercase tracking-tighter">Gestión de <span className="text-red-600">Planes</span></h3>
                      <div className="flex items-center gap-2">
                        {planToast && (
                          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-[9px] font-black italic">{planToast}</span>
                        )}
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={handleSavePlans}
                          disabled={savingPlans}
                          className="px-4 md:px-6 py-2 md:py-3 bg-red-600 text-white rounded-xl font-black italic text-[10px] md:text-xs hover:bg-red-700 transition-all shadow-lg shadow-red-100 flex items-center gap-2 disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5" /> {savingPlans ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={handleSyncStripe}
                          disabled={syncingStripe}
                          className="px-4 md:px-6 py-2 md:py-3 bg-emerald-600 text-white rounded-xl font-black italic text-[10px] md:text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2 disabled:opacity-50"
                        >
                          <Zap className="w-3.5 h-3.5" /> {syncingStripe ? "SINCRONIZANDO..." : "SINCRONIZAR CON STRIPE"}
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            const current = planConfig || { plans: [], freePlan: { id: "free", name: "Gratis", features: [], limits: { maxStores: 1, maxProductsPerStore: 10, maxMessages: 10, maxAutomations: 2 } } };
                            const newId = `plan_${Date.now()}`;
                            const newPlan = { id: newId, name: "Nuevo Plan", price: 0, currency: "usd", desc: "", popular: false, features: [], limits: { maxStores: 1, maxProductsPerStore: 10, maxMessages: 10, maxAutomations: 2 } };
                            setPlanConfig({ ...current, plans: [newPlan, ...current.plans] });
                            setEditingPlanId(newId);
                            setEditForm(newPlan);
                            setTimeout(() => plansRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
                          }}
                          className="px-4 md:px-6 py-2 md:py-3 bg-zinc-950 text-white rounded-xl font-black italic text-[10px] md:text-xs hover:bg-zinc-800 transition-all shadow-lg flex items-center gap-2"
                        >
                          <Plus className="w-3.5 h-3.5" /> AÑADIR PLAN
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={fetchPlans}
                          className="p-2 md:p-2.5 hover:bg-zinc-50 rounded-xl transition-all"
                        >
                          <RefreshCw className="w-4 h-4 text-zinc-400" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Free Plan */}
                    {planConfig && (
                      <div id="plan-free" className="bg-zinc-50 max-[400px]:p-5 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-zinc-100 space-y-5 md:space-y-6 shadow-sm scroll-mt-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm md:text-base font-black italic text-zinc-950 uppercase tracking-tighter">
                            <span className="text-zinc-400">Plan</span> {planConfig.freePlan.name}
                          </h4>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              if (editingPlanId === "free") {
                                setEditingPlanId(null);
                                setEditForm(null);
                              } else {
                                setEditingPlanId("free");
                                setEditForm({ ...planConfig.freePlan });
                                setTimeout(() => document.getElementById("plan-free")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
                              }
                            }}
                            className="p-2 hover:bg-white rounded-xl transition-all"
                          >
                            <Edit3 className="w-4 h-4 text-zinc-400 hover:text-red-600" />
                          </motion.button>
                        </div>
                        {editingPlanId === "free" && editForm ? (
                          <div className="space-y-4 bg-white rounded-2xl p-5 border border-zinc-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <AdminInput label="Nombre" value={editForm.name || ""} onChange={(v: string) => setEditForm({...editForm, name: v})} />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest">Límites</label>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <AdminInput label="Empresas" type="number" value={editForm.limits?.maxStores?.toString() || "1"} onChange={(v: string) => setEditForm({...editForm, limits: {...editForm.limits, maxStores: parseInt(v) || 0}})} />
                                <AdminInput label="Productos" type="number" value={editForm.limits?.maxProductsPerStore?.toString() || "10"} onChange={(v: string) => setEditForm({...editForm, limits: {...editForm.limits, maxProductsPerStore: parseInt(v) || 0}})} />
                                <AdminInput label="Mensajes IA" type="number" value={editForm.limits?.maxMessages?.toString() || "10"} onChange={(v: string) => setEditForm({...editForm, limits: {...editForm.limits, maxMessages: parseInt(v) || 0}})} />
                                <AdminInput label="Automations" type="number" value={editForm.limits?.maxAutomations?.toString() || "2"} onChange={(v: string) => setEditForm({...editForm, limits: {...editForm.limits, maxAutomations: parseInt(v) || 0}})} />
                              </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setEditingPlanId(null); setEditForm(null); }} className="px-5 py-2.5 bg-zinc-50 text-zinc-500 rounded-xl font-black italic text-[10px] hover:bg-zinc-100 transition-all">CANCELAR</motion.button>
                              <motion.button whileTap={{ scale: 0.95 }} onClick={() => { if (planConfig) { setPlanConfig({...planConfig, freePlan: editForm}); setEditingPlanId(null); setEditForm(null); }} } className="px-5 py-2.5 bg-zinc-950 text-white rounded-xl font-black italic text-[10px] hover:bg-zinc-800 transition-all">APLICAR</motion.button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-white rounded-xl p-3 md:p-4 border border-zinc-100">
                              <p className="text-[8px] font-black text-zinc-400 uppercase italic">Empresas</p>
                              <p className="text-lg md:text-xl font-black italic text-zinc-950">{planConfig.freePlan.limits?.maxStores || 1}</p>
                            </div>
                            <div className="bg-white rounded-xl p-3 md:p-4 border border-zinc-100">
                              <p className="text-[8px] font-black text-zinc-400 uppercase italic">Productos</p>
                              <p className="text-lg md:text-xl font-black italic text-zinc-950">{planConfig.freePlan.limits?.maxProductsPerStore || 10}</p>
                            </div>
                            <div className="bg-white rounded-xl p-3 md:p-4 border border-zinc-100">
                              <p className="text-[8px] font-black text-zinc-400 uppercase italic">Mensajes IA</p>
                              <p className="text-lg md:text-xl font-black italic text-zinc-950">{planConfig.freePlan.limits?.maxMessages || 10}</p>
                            </div>
                            <div className="bg-white rounded-xl p-3 md:p-4 border border-zinc-100">
                              <p className="text-[8px] font-black text-zinc-400 uppercase italic">Automations</p>
                              <p className="text-lg md:text-xl font-black italic text-zinc-950">{planConfig.freePlan.limits?.maxAutomations || 2}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Paid Plans */}
                    <div ref={plansRef} className="grid grid-cols-1 gap-6 scroll-mt-4">
                      {planConfig?.plans.map((plan: any) => (
                        <div id={`plan-${plan.id}`} key={plan.id} className={cn("bg-white rounded-[2rem] md:rounded-[2.5rem] border-2 p-5 md:p-8 space-y-5 transition-all scroll-mt-4", plan.popular ? "border-red-600 shadow-2xl shadow-red-600/5" : "border-zinc-100")}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-3">
                                <h4 className="text-xl md:text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{plan.name}</h4>
                                {plan.popular && (
                                  <span className="px-2.5 py-1 bg-red-600 text-white rounded-full text-[7px] font-black uppercase tracking-widest italic leading-none flex items-center gap-1">
                                    <Star className="w-2.5 h-2.5 fill-current" /> POPULAR
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-zinc-400 font-medium italic">{plan.desc}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  if (editingPlanId === plan.id) {
                                    setEditingPlanId(null);
                                    setEditForm(null);
                                  } else {
                                    setEditingPlanId(plan.id);
                                    setEditForm({ ...plan });
                                    setTimeout(() => document.getElementById(`plan-${plan.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
                                  }
                                }}
                                className="p-2 hover:bg-zinc-50 rounded-xl transition-all shrink-0"
                              >
                                <Edit3 className={cn("w-4 h-4", editingPlanId === plan.id ? "text-red-600" : "text-zinc-400")} />
                              </motion.button>
                              {deletingPlanId === plan.id ? (
                                <div className="flex items-center gap-1">
                                  <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleDeletePlan(plan.id)}
                                    className="px-2.5 py-1.5 bg-rose-600 text-white rounded-lg text-[8px] font-black italic hover:bg-rose-700 transition-all"
                                  >
                                    SÍ, ELIMINAR
                                  </motion.button>
                                  <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setDeletingPlanId(null)}
                                    className="px-2.5 py-1.5 bg-zinc-100 text-zinc-500 rounded-lg text-[8px] font-black italic hover:bg-zinc-200 transition-all"
                                  >
                                    CANCELAR
                                  </motion.button>
                                </div>
                              ) : (
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setDeletingPlanId(plan.id)}
                                  className="p-2 hover:bg-rose-50 rounded-xl transition-all shrink-0"
                                >
                                  <Trash2 className="w-4 h-4 text-zinc-400 hover:text-rose-500" />
                                </motion.button>
                              )}
                            </div>
                          </div>

                           {editingPlanId === plan.id && editForm ? (
                            <div className="space-y-4 bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <AdminInput label="Nombre" value={editForm.name || ""} onChange={(v: string) => setEditForm({...editForm, name: v})} />
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Descripción</label>
                                  <input type="text" value={editForm.desc || ""} onChange={(e) => setEditForm({...editForm, desc: e.target.value})} className="w-full h-12 bg-white border border-zinc-100 rounded-xl px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-red-600/50 italic" />
                                </div>
                              </div>

                              <div className="space-y-1.5">
                               <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Precio (USD/mes)</label>
                                <input type="number" step="0.01" value={(editForm.price || 0).toString()} onChange={(e) => {
                                  const price = parseFloat(e.target.value) || 0;
                                  setEditForm({...editForm, price, priceUsd: price});
                                }} className="w-full h-12 bg-white border border-zinc-100 rounded-xl px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-red-600/50 italic" />
                                <p className="text-[8px] text-zinc-400 font-medium italic ml-1">El display muestra el equivalente en la moneda del usuario automáticamente.</p>
                              </div>

                              <div className="space-y-2">
                                <label className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest">Features (uno por línea)</label>
                                <textarea
                                  value={(editForm.features || []).join("\n")}
                                  onChange={(e) => setEditForm({...editForm, features: e.target.value.split("\n").filter((f: string) => f.trim())})}
                                  className="w-full bg-white border border-zinc-100 rounded-xl p-3 md:p-4 text-[11px] font-medium outline-none focus:ring-2 focus:ring-red-600/50 italic h-28"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest">Límites</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <AdminInput label="Empresas" type="number" value={editForm.limits?.maxStores?.toString() || "3"} onChange={(v: string) => setEditForm({...editForm, limits: {...editForm.limits, maxStores: parseInt(v) || 0}})} />
                                  <AdminInput label="Productos/empresa" type="number" value={editForm.limits?.maxProductsPerStore?.toString() || "50"} onChange={(v: string) => setEditForm({...editForm, limits: {...editForm.limits, maxProductsPerStore: parseInt(v) || 0}})} />
                                  <AdminInput label="Mensajes IA" type="number" value={editForm.limits?.maxMessages?.toString() || "50"} onChange={(v: string) => setEditForm({...editForm, limits: {...editForm.limits, maxMessages: parseInt(v) || 0}})} />
                                  <AdminInput label="Automations" type="number" value={editForm.limits?.maxAutomations?.toString() || "10"} onChange={(v: string) => setEditForm({...editForm, limits: {...editForm.limits, maxAutomations: parseInt(v) || 0}})} />
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" checked={editForm.popular || false} onChange={(e) => setEditForm({...editForm, popular: e.target.checked})} className="w-4 h-4 rounded accent-red-600" />
                                  <span className="text-[10px] font-black italic text-zinc-600 uppercase">Marcar como "Más Popular"</span>
                                </label>
                              </div>

                              <div className="flex gap-2 pt-2">
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setEditingPlanId(null); setEditForm(null); }} className="px-5 py-2.5 bg-zinc-50 text-zinc-500 rounded-xl font-black italic text-[10px] hover:bg-zinc-100 transition-all">CANCELAR</motion.button>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => { if (!planConfig) return; const exists = planConfig.plans.some((p: any) => p.id === editForm.id); setPlanConfig({...planConfig, plans: exists ? planConfig.plans.map((p: any) => p.id === editForm.id ? editForm : p) : [...planConfig.plans, editForm]}); setEditingPlanId(null); setEditForm(null); }} className="px-5 py-2.5 bg-zinc-950 text-white rounded-xl font-black italic text-[10px] hover:bg-zinc-800 transition-all">APLICAR</motion.button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl md:text-4xl font-black italic text-zinc-950 tracking-tighter">{plan.currency === "eur" ? "€" : plan.currency === "gbp" ? "£" : plan.currency === "brl" ? "R$" : plan.currency === "pen" ? "S/" : plan.currency === "gtq" ? "Q" : plan.currency === "crc" ? "₡" : plan.currency === "hnl" ? "L" : plan.currency === "pyg" ? "₲" : plan.currency === "bob" ? "Bs" : "$"}{plan.price}</span>
                              <span className="text-zinc-400 font-black text-xs italic uppercase">/mes</span>
                            </div>
                          )}

                          {editingPlanId !== plan.id && (
                            <div className="flex flex-wrap gap-2">
                              {(plan.features || []).map((f: string) => (
                                <span key={f} className="px-3 py-1.5 bg-zinc-50 text-zinc-600 rounded-lg text-[9px] md:text-[10px] font-bold italic border border-zinc-100">
                                  <Check className="w-2.5 h-2.5 inline mr-1 text-emerald-500" />{f}
                                </span>
                              ))}
                            </div>
                          )}

                          {editingPlanId !== plan.id && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                              <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                                <p className="text-[8px] font-black text-zinc-400 uppercase italic">Empresas</p>
                                <p className="text-sm md:text-base font-black italic text-zinc-950">{plan.limits?.maxStores || 3}</p>
                              </div>
                              <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                                <p className="text-[8px] font-black text-zinc-400 uppercase italic">Productos</p>
                                <p className="text-sm md:text-base font-black italic text-zinc-950">{plan.limits?.maxProductsPerStore || 50}</p>
                              </div>
                              <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                                <p className="text-[8px] font-black text-zinc-400 uppercase italic">Mensajes IA</p>
                                <p className="text-sm md:text-base font-black italic text-zinc-950">{plan.limits?.maxMessages || 50}</p>
                              </div>
                              <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                                <p className="text-[8px] font-black text-zinc-400 uppercase italic">Automations</p>
                                <p className="text-sm md:text-base font-black italic text-zinc-950">{plan.limits?.maxAutomations || 10}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === "widget" && (
                  <motion.div key="widget" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 md:space-y-10">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <h3 className="max-[400px]:text-2xl text-3xl font-black italic text-zinc-950 uppercase tracking-tighter">
                        Widget <span className="text-red-600">IA</span>
                      </h3>
                      {widgetToast && (
                        <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-[9px] font-black italic">{widgetToast}</span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Empresa</label>
                      <select
                        value={widgetStoreId}
                        onChange={async (e) => {
                          setWidgetStoreId(e.target.value);
                          setWidgetConfig(null);
                          if (e.target.value) {
                            try {
                              const res = await fetch(`/api/admin/widget?storeId=${e.target.value}`);
                              if (res.ok) {
                                const data = await res.json();
                                setWidgetConfig(data.config);
                                setWidgetStoreName(data.storeName);
                                setWidgetSlug(data.slug);
                              }
                            } catch {}
                          }
                        }}
                        className="w-full h-12 bg-white border border-zinc-100 rounded-xl px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-red-600/50 italic"
                      >
                        <option value="">Seleccionar empresa...</option>
                        {allStores.map((s: any) => (
                          <option key={s._id} value={s._id}>{s.name} ({s.ownerEmail})</option>
                        ))}
                      </select>
                    </div>

                    {widgetConfig && (
                      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 md:gap-10">
                        <div className="xl:col-span-3 space-y-5 md:space-y-6">
                          <div className="bg-zinc-50 max-[400px]:p-5 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-zinc-100 shadow-sm space-y-5 md:space-y-6">
                            <h4 className="text-[10px] font-black text-zinc-400 uppercase italic tracking-widest">Configuración del Widget</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <AdminInput
                                label="Título del widget"
                                placeholder="Asistente IA"
                                value={widgetConfig.title || ""}
                                onChange={(v: string) => setWidgetConfig({...widgetConfig, title: v})}
                              />
                              <AdminInput
                                label="Texto del header"
                                placeholder="¿En qué puedo ayudarte?"
                                value={widgetConfig.headerText || ""}
                              onChange={(v: string) => setWidgetConfig({...widgetConfig, headerText: v})}
                            />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Mensaje de bienvenida</label>
                              <textarea
                                value={widgetConfig.welcomeMessage || ""}
                                onChange={(e) => setWidgetConfig({...widgetConfig, welcomeMessage: e.target.value})}
                                className="w-full bg-white border border-zinc-100 rounded-xl p-3 md:p-4 text-[11px] font-medium outline-none focus:ring-2 focus:ring-red-600/50 italic h-20 resize-none"
                                placeholder="¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte?"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Placeholder del input</label>
                              <input
                                type="text"
                                value={widgetConfig.placeholder || ""}
                                onChange={(e) => setWidgetConfig({...widgetConfig, placeholder: e.target.value})}
                                className="w-full h-12 bg-white border border-zinc-100 rounded-xl px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-red-600/50 italic"
                                placeholder="Escribe tu mensaje..."
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Color primario</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={widgetConfig.primaryColor || "#dc2626"}
                                    onChange={(e) => setWidgetConfig({...widgetConfig, primaryColor: e.target.value})}
                                    className="w-12 h-12 rounded-xl border border-zinc-100 cursor-pointer bg-white"
                                  />
                                  <input
                                    type="text"
                                    value={widgetConfig.primaryColor || "#dc2626"}
                                    onChange={(e) => setWidgetConfig({...widgetConfig, primaryColor: e.target.value})}
                                    className="flex-1 h-12 bg-white border border-zinc-100 rounded-xl px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-red-600/50 italic font-mono"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Color secundario</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={widgetConfig.secondaryColor || "#f5f5f5"}
                                    onChange={(e) => setWidgetConfig({...widgetConfig, secondaryColor: e.target.value})}
                                    className="w-12 h-12 rounded-xl border border-zinc-100 cursor-pointer bg-white"
                                  />
                                  <input
                                    type="text"
                                    value={widgetConfig.secondaryColor || "#f5f5f5"}
                                    onChange={(e) => setWidgetConfig({...widgetConfig, secondaryColor: e.target.value})}
                                    className="flex-1 h-12 bg-white border border-zinc-100 rounded-xl px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-red-600/50 italic font-mono"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Color texto</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={widgetConfig.textColor || "#1a1a1a"}
                                    onChange={(e) => setWidgetConfig({...widgetConfig, textColor: e.target.value})}
                                    className="w-12 h-12 rounded-xl border border-zinc-100 cursor-pointer bg-white"
                                  />
                                  <input
                                    type="text"
                                    value={widgetConfig.textColor || "#1a1a1a"}
                                    onChange={(e) => setWidgetConfig({...widgetConfig, textColor: e.target.value})}
                                    className="flex-1 h-12 bg-white border border-zinc-100 rounded-xl px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-red-600/50 italic font-mono"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Posición</label>
                                <select
                                  value={widgetConfig.position || "bottom-right"}
                                  onChange={(e) => setWidgetConfig({...widgetConfig, position: e.target.value})}
                                  className="w-full h-12 bg-white border border-zinc-100 rounded-xl px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-red-600/50 italic"
                                >
                                  <option value="bottom-right">Abajo derecha</option>
                                  <option value="bottom-left">Abajo izquierda</option>
                                  <option value="top-right">Arriba derecha</option>
                                  <option value="top-left">Arriba izquierda</option>
                                </select>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">URL del logo</label>
                                <input
                                  type="text"
                                  value={widgetConfig.logo || ""}
                                  onChange={(e) => setWidgetConfig({...widgetConfig, logo: e.target.value})}
                                  className="w-full h-12 bg-white border border-zinc-100 rounded-xl px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-red-600/50 italic"
                                  placeholder="https://ejemplo.com/logo.png"
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <label className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest">Widget activo</label>
                                <button
                                  onClick={() => setWidgetConfig({...widgetConfig, enabled: !widgetConfig.enabled})}
                                  className={`relative w-11 h-6 rounded-full transition-all ${widgetConfig.enabled ? 'bg-red-600' : 'bg-zinc-200'}`}
                                >
                                  <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all shadow-sm ${widgetConfig.enabled ? 'left-[22px]' : 'left-0.5'}`} />
                                </button>
                              </div>
                            </div>

                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={async () => {
                                if (!widgetStoreId || !widgetConfig) return;
                                setSavingWidget(true);
                                try {
                                   const res = await fetch("/api/admin/widget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
                                    body: JSON.stringify({ storeId: widgetStoreId, ...widgetConfig }),
                                  });
                                  if (res.ok) {
                                    setWidgetToast("Configuración guardada correctamente");
                                  } else {
                                    setWidgetToast("Error al guardar configuración");
                                  }
                                } catch {
                                  setWidgetToast("Error de conexión");
                                } finally {
                                  setSavingWidget(false);
                                  setTimeout(() => setWidgetToast(""), 3000);
                                }
                              }}
                              disabled={savingWidget}
                              className="w-full py-4 md:py-5 bg-red-600 text-white rounded-2xl font-black italic shadow-xl shadow-red-100 hover:bg-red-700 transition-all flex items-center justify-center gap-3 uppercase text-xs md:text-sm disabled:opacity-50"
                            >
                              {savingWidget ? "GUARDANDO..." : "GUARDAR CONFIGURACIÓN"} <Save className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>

                        <div className="xl:col-span-2 space-y-5 md:space-y-6">
                          <div className="bg-zinc-50 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-zinc-100 shadow-sm space-y-5">
                            <h4 className="text-[10px] font-black text-zinc-400 uppercase italic tracking-widest">Código de inserción</h4>
                            <p className="text-[9px] md:text-[10px] text-zinc-500 font-medium italic">
                              Copia este código y pégalo justo antes de <code className="bg-zinc-200 px-1.5 py-0.5 rounded text-[9px] font-mono">&lt;/body&gt;</code> en tu sitio web.
                            </p>
                            <div className="relative">
                              <pre className="bg-zinc-950 text-zinc-100 rounded-2xl p-4 md:p-5 text-[9px] md:text-[10px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
{`<!-- Jandosoft AI Chat Widget -->
<script src="${widgetConfig.baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://jandosoft.vercel.app')}/widget.js"><\/script>
<script>
  window.Jandosoft.init({
    slug: "${widgetSlug}",
    baseUrl: "${widgetConfig.baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://jandosoft.vercel.app')}",
    position: "${widgetConfig.position || 'bottom-right'}",
    primaryColor: "${widgetConfig.primaryColor || '#dc2626'}",
    buttonBgOpacity: ${widgetConfig.buttonBgOpacity ?? 100},${widgetConfig.logo ? `\n    logo: "${widgetConfig.logo}",` : ''}
    title: "${widgetConfig.title || 'Asistente IA'}"
  });
<\/script>`}
                              </pre>
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={async () => {
                                  const code = `<!-- Jandosoft AI Chat Widget -->\n<script src="${widgetConfig.baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://jandosoft.vercel.app')}/widget.js"><\/script>\n<script>\n  window.Jandosoft.init({\n    slug: "${widgetSlug}",\n    baseUrl: "${widgetConfig.baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://jandosoft.vercel.app')}",\n    position: "${widgetConfig.position || 'bottom-right'}",\n    primaryColor: "${widgetConfig.primaryColor || '#dc2626'}",\n    buttonBgOpacity: ${widgetConfig.buttonBgOpacity ?? 100},${widgetConfig.logo ? `\n    logo: "${widgetConfig.logo}",` : ''}\n    title: "${widgetConfig.title || 'Asistente IA'}"\n  });\n<\/script>`;
                                  await navigator.clipboard.writeText(code);
                                  setWidgetCopied(true);
                                  setTimeout(() => setWidgetCopied(false), 2000);
                                }}
                                className="absolute top-3 right-3 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[8px] font-black italic transition-all backdrop-blur-sm"
                              >
                                {widgetCopied ? "COPIADO" : "COPIAR"}
                              </motion.button>
                            </div>
                          </div>

                          <div className="bg-zinc-50 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-zinc-100 shadow-sm space-y-4">
                            <h4 className="text-[10px] font-black text-zinc-400 uppercase italic tracking-widest">Instalación por plataforma</h4>
                            <div className="space-y-3">
                              <details className="group">
                                <summary className="flex items-center gap-2 cursor-pointer text-xs font-black italic text-zinc-700 hover:text-red-600 transition-colors p-2 rounded-xl hover:bg-white">
                                  <ChevronRight className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" />
                                  WordPress
                                </summary>
                                <div className="mt-2 ml-5 p-3 bg-white rounded-xl border border-zinc-100 text-[9px] md:text-[10px] text-zinc-600 font-medium italic space-y-2 leading-relaxed">
                                  <p>1. Ve a <strong>Apariencia → Editor de temas</strong> o usa un plugin como <em>Insert Headers and Footers</em>.</p>
                                  <p>2. Pega el código de inserción en la sección de <strong>footer</strong> (antes de &lt;/body&gt;).</p>
                                  <p>3. Guarda los cambios y verifica que el widget aparezca en tu sitio.</p>
                                </div>
                              </details>
                              <details className="group">
                                <summary className="flex items-center gap-2 cursor-pointer text-xs font-black italic text-zinc-700 hover:text-red-600 transition-colors p-2 rounded-xl hover:bg-white">
                                  <ChevronRight className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" />
                                  Shopify
                                </summary>
                                <div className="mt-2 ml-5 p-3 bg-white rounded-xl border border-zinc-100 text-[9px] md:text-[10px] text-zinc-600 font-medium italic space-y-2 leading-relaxed">
                                  <p>1. En el panel de Shopify, ve a <strong>Tienda online → Temas → Editar código</strong>.</p>
                                  <p>2. Busca el archivo <strong>theme.liquid</strong> y pega el código justo antes de &lt;/body&gt;.</p>
                                  <p>3. Haz clic en <strong>Guardar</strong> y el widget aparecerá en tu tienda.</p>
                                </div>
                              </details>
                              <details className="group">
                                <summary className="flex items-center gap-2 cursor-pointer text-xs font-black italic text-zinc-700 hover:text-red-600 transition-colors p-2 rounded-xl hover:bg-white">
                                  <ChevronRight className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" />
                                  Wix
                                </summary>
                                <div className="mt-2 ml-5 p-3 bg-white rounded-xl border border-zinc-100 text-[9px] md:text-[10px] text-zinc-600 font-medium italic space-y-2 leading-relaxed">
                                  <p>1. En el editor de Wix, haz clic en <strong>Añadir → Más → HTML personalizado</strong>.</p>
                                  <p>2. Pega el código de inserción en el cuadro de diálogo.</p>
                                  <p>3. Ajusta el tamaño del elemento a <strong>0x0</strong> (el widget es flotante) y colócalo en cualquier parte del pie de página.</p>
                                  <p>4. Publica los cambios.</p>
                                </div>
                              </details>
                              <details className="group">
                                <summary className="flex items-center gap-2 cursor-pointer text-xs font-black italic text-zinc-700 hover:text-red-600 transition-colors p-2 rounded-xl hover:bg-white">
                                  <ChevronRight className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" />
                                  Squarespace
                                </summary>
                                <div className="mt-2 ml-5 p-3 bg-white rounded-xl border border-zinc-100 text-[9px] md:text-[10px] text-zinc-600 font-medium italic space-y-2 leading-relaxed">
                                  <p>1. Ve a <strong>Configuración → Avanzado → Inyección de código</strong>.</p>
                                  <p>2. Pega el código en el campo <strong>Footer</strong>.</p>
                                  <p>3. Guarda los cambios.</p>
                                </div>
                              </details>
                              <details className="group">
                                <summary className="flex items-center gap-2 cursor-pointer text-xs font-black italic text-zinc-700 hover:text-red-600 transition-colors p-2 rounded-xl hover:bg-white">
                                  <ChevronRight className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" />
                                  HTML / Otras plataformas
                                </summary>
                                <div className="mt-2 ml-5 p-3 bg-white rounded-xl border border-zinc-100 text-[9px] md:text-[10px] text-zinc-600 font-medium italic space-y-2 leading-relaxed">
                                  <p>Pega el código de inserción justo antes del cierre de <strong>&lt;/body&gt;</strong> en tu archivo HTML.</p>
                                  <p>El widget se cargará automáticamente como un botón flotante en la posición configurada.</p>
                                </div>
                              </details>
                            </div>
                          </div>

                          <div className="bg-zinc-50 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-zinc-100 shadow-sm space-y-4">
                            <h4 className="text-[10px] font-black text-zinc-400 uppercase italic tracking-widest">Vista previa</h4>
                            <p className="text-[9px] md:text-[10px] text-zinc-500 font-medium italic">
                              Así se verá el botón del widget en tu sitio web.
                            </p>
                            <div className="relative bg-white rounded-2xl border border-zinc-200 h-48 md:h-56 overflow-hidden">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-[8px] md:text-[9px] text-zinc-300 font-black italic uppercase tracking-widest">Vista previa del sitio</div>
                              </div>
                              <div
                                className="absolute w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
                                style={{
                                  backgroundColor: widgetConfig.primaryColor || "#dc2626",
                                  [widgetConfig.position?.includes("right") ? "right" : "left"]: "20px",
                                  [widgetConfig.position?.includes("bottom") ? "bottom" : "top"]: "20px",
                                }}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              const url = `${widgetConfig.baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://jandosoft.vercel.app')}/s/${widgetSlug}?embed=1`;
                              window.open(url, "_blank", "width=400,height=600");
                            }}
                            className="w-full py-4 md:py-5 bg-zinc-950 text-white rounded-2xl font-black italic shadow-xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 uppercase text-xs md:text-sm"
                          >
                            <ExternalLink className="w-4 h-4" /> PROBAR WIDGET
                          </motion.button>
                        </div>
                      </div>
                    )}

                    {!widgetConfig && widgetStoreId && (
                      <div className="py-12 text-center italic font-black uppercase tracking-widest text-zinc-200 text-[10px]">Cargando configuración...</div>
                    )}
                  </motion.div>
                )}

                {activeTab === "email" && <EmailAdminSection />}

                {activeTab === "affiliates" && (
                  <motion.div key="affiliates" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                    <h2 className="text-2xl md:text-3xl font-black italic text-zinc-950">{t("affiliate.management")}</h2>
                    <AffiliatesAdminSection />
                  </motion.div>
                )}
            </AnimatePresence>
         </main>
      </div>
      {/* Activity detail modal */}
      <AnimatePresence>
        {viewingActivity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setViewingActivity(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] p-6 md:p-8 max-w-md w-full shadow-2xl border border-zinc-100 space-y-5"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center space-y-3">
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-black italic text-zinc-950 uppercase">Detalle de Actividad</h3>
                  <p className="text-[9px] font-medium text-zinc-400 italic mt-1">Información completa del evento</p>
                </div>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-4 md:p-5 space-y-3 border border-zinc-100">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest shrink-0">Acción</span>
                  <span className="text-xs md:text-sm font-black italic text-zinc-950 text-right">{viewingActivity.action}</span>
                </div>
                <div className="w-full h-px bg-zinc-200" />
                {viewingActivity.detail && (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest shrink-0">Detalle</span>
                      <span className="text-xs md:text-sm font-black italic text-zinc-950 text-right">{viewingActivity.detail}</span>
                    </div>
                    <div className="w-full h-px bg-zinc-200" />
                  </>
                )}
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest shrink-0">Ocurrió</span>
                  <span className="text-xs md:text-sm font-black italic text-zinc-950 text-right">
                    {viewingActivity.createdAt
                      ? new Date(viewingActivity.createdAt).toLocaleString("es", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : viewingActivity.time}
                  </span>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewingActivity(null)}
                className="w-full py-3 bg-zinc-50 text-zinc-500 rounded-xl font-black italic text-[10px] hover:bg-zinc-100 transition-all"
              >
                 {t("action.close")}
               </motion.button>
             </motion.div>
           </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm suspension popup */}
      <AnimatePresence>
        {confirmingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setConfirmingId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] p-6 md:p-8 max-w-sm w-full shadow-2xl border border-zinc-100 space-y-5"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto">
                  <Ban className="w-6 h-6 text-rose-600" />
                </div>
                <h3 className="text-lg font-black italic text-zinc-950 uppercase">Suspender {confirmingType === 'user' ? 'Usuario' : 'Empresa'}</h3>
                <p className="text-[10px] font-medium text-zinc-400 italic">Selecciona la duración de la suspensión</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "24h", label: "24 Horas" },
                  { value: "7d", label: "7 Días" },
                  { value: "30d", label: "30 Días" },
                  { value: "permanent", label: "Permanente" },
                ].map((opt) => (
                  <motion.button
                    key={opt.value}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (confirmingType === 'user') {
                        handleToggleUserSuspend(confirmingId, opt.value);
                      } else {
                        handleToggleSuspend(confirmingId, "", opt.value);
                      }
                      setConfirmingId(null);
                    }}
                    className="py-3 md:py-4 rounded-xl md:rounded-2xl font-black italic text-[10px] md:text-xs transition-all bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                  >
                    {opt.label}
                  </motion.button>
                ))}
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setConfirmingId(null)}
                className="w-full py-3 bg-zinc-50 text-zinc-500 rounded-xl font-black italic text-[10px] hover:bg-zinc-100 transition-all"
              >
                CANCELAR
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Detail Modal */}
      <AnimatePresence>
        {viewingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setViewingUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] p-6 md:p-8 max-w-lg w-full shadow-2xl border border-zinc-100 space-y-5 max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center font-black italic text-base", viewingUser.isSuspended ? "bg-rose-100 text-rose-600" : "bg-red-100 text-red-600")}>
                    {viewingUser.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <h3 className="text-lg font-black italic text-zinc-950 uppercase">{viewingUser.name}</h3>
                    <p className="text-[10px] font-bold text-zinc-400 italic">{viewingUser.email}</p>
                  </div>
                </div>
                <button onClick={() => setViewingUser(null)} className="p-2 hover:bg-zinc-100 rounded-xl transition-all">
                  <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-50 rounded-xl p-3">
                  <p className="text-[8px] font-black text-zinc-400 uppercase italic mb-1">Plan Actual</p>
                  <p className={cn("text-sm font-black italic", viewingUser.subscription ? "text-emerald-600" : "text-zinc-500")}>{getPlanLabel(viewingUser.subscription)}</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-3">
                  <p className="text-[8px] font-black text-zinc-400 uppercase italic mb-1">Estado</p>
                  <p className={cn("text-sm font-black italic", viewingUser.isSuspended ? "text-rose-600" : "text-emerald-600")}>{viewingUser.isSuspended ? "Suspendido" : "Activo"}</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-3">
                  <p className="text-[8px] font-black text-zinc-400 uppercase italic mb-1">Empresas</p>
                  <p className="text-sm font-black italic text-zinc-950">{viewingUser.storeCount || 0}</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-3">
                  <p className="text-[8px] font-black text-zinc-400 uppercase italic mb-1">Rol</p>
                  <p className="text-sm font-black italic text-zinc-950 uppercase">{viewingUser.role || "member"}</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-3">
                  <p className="text-[8px] font-black text-zinc-400 uppercase italic mb-1">Email Verificado</p>
                  <p className={cn("text-sm font-black italic", viewingUser.emailVerified ? "text-emerald-600" : "text-amber-600")}>{viewingUser.emailVerified ? "Sí" : "No"}</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-3">
                  <p className="text-[8px] font-black text-zinc-400 uppercase italic mb-1">ID</p>
                  <p className="text-[9px] font-mono text-zinc-500 truncate">{viewingUser._id}</p>
                </div>
              </div>

              {viewingUser.originalPlan && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                  <p className="text-[9px] font-black text-amber-600 uppercase italic">Plan Original (eliminado)</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[8px] font-bold text-zinc-400 italic">Plan</p>
                      <p className="text-sm font-black italic text-zinc-950">{viewingUser.originalPlanName || getPlanLabel(viewingUser.originalPlan)}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-zinc-400 italic">Precio</p>
                      <p className="text-sm font-black italic text-zinc-950">${viewingUser.originalPlanPrice || "?"}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-zinc-400 italic">Migrado a</p>
                      <p className="text-sm font-black italic text-emerald-600">{getPlanLabel(viewingUser.subscription)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-zinc-50 rounded-xl p-4">
                <p className="text-[8px] font-black text-zinc-400 uppercase italic mb-2">Cambiar Plan</p>
                <div className="flex items-center gap-2">
                  <select
                    value={viewingUser.subscription || "free"}
                    onChange={(e) => setViewingUser({ ...viewingUser, subscription: e.target.value })}
                    className="flex-1 text-[10px] font-black italic bg-white border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-red-600"
                  >
                    <option value="free">Free (Gratis)</option>
                    {planConfig?.plans.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} — ${p.price || 0}</option>
                    ))}
                  </select>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleChangeUserPlan(viewingUser._id, viewingUser.subscription)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-black italic text-[10px] hover:bg-red-700 transition-all shrink-0"
                  >
                    APLICAR
                  </motion.button>
                </div>
              </div>

              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (viewingUser.isSuspended) {
                      handleToggleUserSuspend(viewingUser._id);
                      setViewingUser(null);
                    } else {
                      setConfirmingId(viewingUser._id);
                      setConfirmingType('user');
                      setViewingUser(null);
                    }
                  }}
                  className={cn("flex-1 py-3 rounded-xl font-black italic text-xs transition-all", viewingUser.isSuspended ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200" : "bg-rose-100 text-rose-600 hover:bg-rose-200")}
                >
                  {viewingUser.isSuspended ? "ACTIVAR" : "SUSPENDER"}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewingUser(null)}
                  className="flex-1 py-3 bg-zinc-50 text-zinc-500 rounded-xl font-black italic text-xs hover:bg-zinc-100 transition-all"
                >
                  CERRAR
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Store Detail Modal */}
      <AnimatePresence>
        {viewingStore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setViewingStore(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] p-6 md:p-8 max-w-lg w-full shadow-2xl border border-zinc-100 space-y-5 max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", viewingStore.isSuspended ? "bg-rose-100 text-rose-600" : "bg-red-100 text-red-600")}>
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black italic text-zinc-950 uppercase">{viewingStore.name}</h3>
                    <p className="text-[10px] font-bold text-zinc-400 italic">{viewingStore.ownerEmail}</p>
                  </div>
                </div>
                <button onClick={() => setViewingStore(null)} className="p-2 hover:bg-zinc-100 rounded-xl transition-all">
                  <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-50 rounded-xl p-3">
                  <p className="text-[8px] font-black text-zinc-400 uppercase italic mb-1">Tipo</p>
                  <p className="text-sm font-black italic text-zinc-950">{viewingStore.typeLabel || viewingStore.type}</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-3">
                  <p className="text-[8px] font-black text-zinc-400 uppercase italic mb-1">Estado</p>
                  <p className={cn("text-sm font-black italic", viewingStore.isSuspended ? "text-rose-600" : "text-emerald-600")}>{viewingStore.isSuspended ? "Suspendida" : "Activa"}</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-3">
                  <p className="text-[8px] font-black text-zinc-400 uppercase italic mb-1">Productos</p>
                  <p className="text-sm font-black italic text-zinc-950">{viewingStore.productCount || 0}</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-3">
                  <p className="text-[8px] font-black text-zinc-400 uppercase italic mb-1">Clientes</p>
                  <p className="text-sm font-black italic text-zinc-950">{viewingStore.customerCount || 0}</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-3">
                  <p className="text-[8px] font-black text-zinc-400 uppercase italic mb-1">Pedidos</p>
                  <p className="text-sm font-black italic text-zinc-950">{viewingStore.orderCount || 0}</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-3">
                  <p className="text-[8px] font-black text-zinc-400 uppercase italic mb-1">Stripe Connect</p>
                  <p className={cn("text-sm font-black italic", viewingStore.stripeConnectStatus === "active" ? "text-emerald-600" : viewingStore.stripeConnectStatus === "pending" ? "text-amber-600" : "text-zinc-400")}>{viewingStore.stripeConnectStatus === "active" ? "Conectado ✓" : viewingStore.stripeConnectStatus === "pending" ? "Pendiente" : "No conectado"}</p>
                </div>
                {viewingStore.stripeAccountEmail && (
                  <div className="bg-zinc-50 rounded-xl p-3">
                    <p className="text-[8px] font-black text-zinc-400 uppercase italic mb-1">Email Stripe</p>
                    <p className="text-[9px] font-bold text-zinc-600 italic truncate">{viewingStore.stripeAccountEmail}</p>
                  </div>
                )}
                <div className="bg-zinc-50 rounded-xl p-3">
                  <p className="text-[8px] font-black text-zinc-400 uppercase italic mb-1">ID</p>
                  <p className="text-[9px] font-mono text-zinc-500 truncate">{viewingStore._id}</p>
                </div>
              </div>

              {viewingStore.isSuspended && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                  <p className="text-[8px] font-black text-rose-600 uppercase italic mb-1">Razón de suspensión</p>
                  <p className="text-xs font-bold text-rose-700 italic">{viewingStore.suspensionReason || "Sin razón especificada"}</p>
                </div>
              )}

              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (viewingStore.isSuspended) {
                      handleToggleSuspend(viewingStore._id);
                      setViewingStore(null);
                    } else {
                      setConfirmingId(viewingStore._id);
                      setConfirmingType('store');
                      setViewingStore(null);
                    }
                  }}
                  className={cn("flex-1 py-3 rounded-xl font-black italic text-xs transition-all", viewingStore.isSuspended ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200" : "bg-rose-100 text-rose-600 hover:bg-rose-200")}
                >
                  {viewingStore.isSuspended ? "ACTIVAR" : "SUSPENDER"}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewingStore(null)}
                  className="flex-1 py-3 bg-zinc-50 text-zinc-500 rounded-xl font-black italic text-xs hover:bg-zinc-100 transition-all"
                >
                  CERRAR
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {userPaymentsModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setUserPaymentsModal(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-6 md:px-8 py-5 md:py-6 border-b border-zinc-100">
                <div>
                  <h3 className="text-lg md:text-xl font-black italic text-zinc-950 uppercase tracking-tight">Pagos de {userPaymentsModal.name || userPaymentsModal.email}</h3>
                  <p className="text-[10px] md:text-xs text-zinc-400 font-bold italic mt-1">{userPaymentsModal.email}</p>
                </div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setUserPaymentsModal(null)} className="p-2 md:p-3 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-all">
                  <X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" />
                </motion.button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 md:px-8 py-4">
                <UserPaymentsContent email={userPaymentsModal.email} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Impersonation Overlay */}
      <AnimatePresence>
        {(impersonateToken || impersonateLoading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-white flex flex-col"
          >
            <div className="flex items-center justify-between px-4 md:px-8 py-3 bg-zinc-950 text-white shrink-0">
              <div className="flex items-center gap-3">
                <Eye className="w-4 h-4 text-blue-400" />
                <span className="text-xs md:text-sm font-black italic">
                  Modo Admin — Viendo como: <span className="text-blue-400">{impersonateUser?.name || impersonateUser?.email || "Usuario"}</span>
                </span>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { setImpersonateToken(null); setImpersonateUser(null); setImpersonateLoading(false); }}
                className="px-4 py-2 bg-red-600 text-white rounded-xl font-black italic text-[10px] md:text-xs hover:bg-red-700 transition-all flex items-center gap-2"
              >
                <X className="w-3.5 h-3.5" /> SALIR
              </motion.button>
            </div>
            <div className="flex-1 relative">
              {impersonateLoading && !impersonateToken && (
                <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                  <div className="flex items-center gap-3 px-6 py-4 bg-zinc-50 rounded-2xl text-zinc-400 italic font-black text-sm">
                    <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
                    Abriendo vista del usuario...
                  </div>
                </div>
              )}
              {impersonateToken && (
                <iframe
                  src={`/impersonate?token=${impersonateToken}`}
                  className="w-full h-full border-0"
                  title="Vista del usuario"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UserPaymentsContent({ email }: { email: string }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/stripe/payments?customerEmail=${encodeURIComponent(email)}&limit=100`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setPayments(data.payments || []);
        }
      } catch {} finally { setLoading(false); }
    })();
  }, [email]);

  if (loading) return <div className="py-12 text-center italic font-black uppercase text-zinc-300 text-xs tracking-widest">Cargando pagos...</div>;
  if (!payments.length) return <div className="py-12 text-center italic font-black uppercase text-zinc-200 text-xs tracking-widest">No hay pagos para este usuario</div>;

  return (
    <div className="space-y-2">
      {payments.map((p: any) => {
        const status = p.status || p.paymentStatus || "unknown";
        const statusColor = status === "completed" || status === "finished" || status === "confirmed" || status === "succeeded" ? "bg-emerald-50 text-emerald-600" : status === "pending" || status === "waiting" || status === "confirming" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600";
        return (
          <div key={p._id} className="flex items-center justify-between gap-3 p-3 md:p-4 bg-zinc-50 rounded-xl">
            <div className="space-y-1">
              <p className="text-[10px] md:text-xs font-black text-zinc-950 italic">{new Date(p.createdAt).toLocaleDateString()}</p>
              <p className="text-[9px] md:text-[10px] text-zinc-400 font-bold italic">{p.displayDescription || p.description || "—"}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-xs md:text-sm font-black text-red-600 italic">{p.displayCurrency || "USD"} ${p.displayAmount?.toFixed(2) || p.amount?.toFixed(2)}</p>
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black italic uppercase ${statusColor}`}>{status}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MenuItem({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.95 }} onClick={onClick} className={cn("w-full flex items-center gap-4 max-[400px]:px-3 max-[400px]:py-3 px-4 py-4 rounded-2xl font-black text-xs md:text-sm italic transition-all", active ? "bg-red-600 text-white shadow-xl shadow-red-100" : "text-zinc-500 hover:bg-zinc-100")}>
      {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-4 h-4 md:w-5 md:h-5" })} {label}
    </motion.button>
  );
}

function StatCard({ icon, label, value, change }: any) {
  return (
    <div className="bg-white max-[400px]:p-4 p-5 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] border border-zinc-100 shadow-sm md:shadow-2xl space-y-2 md:space-y-4 hover:scale-[1.02] transition-all">
       <div className="flex items-center justify-between gap-2">
          <div className="p-2 md:p-3 bg-zinc-50 rounded-lg md:rounded-xl">{icon}</div>
          <span className="text-[7px] md:text-[9px] font-black px-1.5 md:px-2 py-0.5 md:py-1 bg-emerald-50 text-emerald-600 rounded-lg italic text-right">{change}</span>
       </div>
       <div>
          <p className="text-[7px] md:text-[9px] font-bold text-zinc-400 uppercase tracking-widest italic truncate">{label}</p>
          <p className="max-[400px]:text-xl text-xl md:text-2xl font-black text-zinc-950 italic">{value}</p>
       </div>
    </div>
  );
}

function AdminInput({ label, placeholder, type ="text", value, onChange }: any) {
   return (
      <div className="space-y-1.5">
         <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{label}</label>
         <input 
            type={type} 
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-12 bg-white border border-zinc-100 rounded-xl px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-red-600/50 italic"
         />
      </div>
   );
}

function AdminRevenuePanel({ revenueData, loading, onRefresh, payments }: { revenueData: any; loading: boolean; onRefresh: () => void; payments: any[] }) {
  const { t } = useLanguage();
  const recentPayments = payments.filter((p: any) => p.status === "completed" || p.status === "succeeded" || p.paymentStatus === "finished").slice(0, 10);

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 px-6 py-4 bg-zinc-50 rounded-2xl text-zinc-400 italic font-black text-sm">
           <Loader className="w-5 h-5 animate-spin" /> {t("admin.loading")}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div key="revenue" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="max-[400px]:text-2xl text-3xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("admin.revenue")} de <span className="text-red-600">Plataforma</span></h3>
        <motion.button whileTap={{ scale: 0.9 }} onClick={onRefresh} className="p-2 hover:md:p-2.5 hover:bg-zinc-50 rounded-xl transition-all">
          <RefreshCw className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" />
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
        <div className="bg-white max-[400px]:p-5 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-2 md:space-y-4">
          <div className="p-2 md:p-3 bg-red-50 rounded-lg md:rounded-xl w-fit"><DollarSign className="w-5 h-5 md:w-6 md:h-6 text-red-600" /></div>
          <p className="text-[8px] md:text-[9px] font-wallpoet text-zinc-400 uppercase italic">Comisiones Jandosoft</p>
          <p className="max-[400px]:text-2xl text-3xl md:text-4xl font-black italic text-zinc-950">${(revenueData?.totalPlatformRevenue || 0).toFixed(2)}</p>
        </div>
        <div className="bg-white max-[400px]:p-5 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-2 md:space-y-4">
          <div className="p-2 md:p-3 bg-emerald-50 rounded-lg md:rounded-xl w-fit"><TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" /></div>
          <p className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic">Volumen Procesado</p>
          <p className="max-[400px]:text-2xl text-3xl md:text-4xl font-black italic text-zinc-950">${(revenueData?.totalProcessed || 0).toFixed(2)}</p>
        </div>
        <div className="bg-white max-[400px]:p-5 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-2 md:space-y-4">
          <div className="p-2 md:p-3 bg-blue-50 rounded-lg md:rounded-xl w-fit"><ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-blue-600" /></div>
          <p className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic">Transacciones</p>
          <p className="max-[400px]:text-2xl text-3xl md:text-4xl font-black italic text-zinc-950">{revenueData?.totalPayments || 0}</p>
        </div>
      </div>

      {revenueData?.byStore && Object.keys(revenueData.byStore).length > 0 && (
        <div className="bg-zinc-50 max-[400px]:p-5 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-zinc-100 space-y-4 md:space-y-6">
          <h4 className="max-[400px]:text-lg text-xl font-black italic text-zinc-950 uppercase tracking-tighter">Desglose por <span className="text-red-600">Empresa</span></h4>
          <div className="space-y-2 md:space-y-3">
            {Object.entries(revenueData.byStore).map(([name, info]: any) => (
              <div key={name} className="flex items-center justify-between max-[400px]:p-3.5 p-5 bg-white rounded-2xl border border-zinc-100 hover:border-red-200 transition-all">
                <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600 shrink-0"><Store className="w-4 h-4 md:w-5 md:h-5" /></div>
                  <div className="min-w-0">
                    <p className="font-black italic text-xs md:text-sm text-zinc-950 truncate">{name}</p>
                    <p className="text-[9px] md:text-[10px] text-zinc-400 font-bold italic">{info.count} transacciones</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs md:text-sm font-black italic text-zinc-950">${info.revenue.toFixed(2)}</p>
                  <p className="text-[9px] md:text-[10px] font-black text-red-600 italic">Comisión: ${info.fees.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentPayments.length > 0 && (
        <div className="bg-zinc-50 max-[400px]:p-5 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-zinc-100 space-y-4 md:space-y-6">
          <h4 className="max-[400px]:text-lg text-xl font-black italic text-zinc-950 uppercase tracking-tighter">Pagos <span className="text-red-600">Recientes</span></h4>
          <div className="space-y-2 md:space-y-3">
            {recentPayments.map((p: any) => (
              <div key={p._id} className="flex items-center justify-between max-[400px]:p-3.5 p-5 bg-white rounded-2xl border border-zinc-100 hover:border-red-200 transition-all">
                <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0"><DollarSign className="w-4 h-4 md:w-5 md:h-5" /></div>
                  <div className="min-w-0">
                    <p className="font-black italic text-xs md:text-sm text-zinc-950 truncate">{p.customerName || p.customerEmail || "Cliente"}</p>
                    <p className="text-[9px] md:text-[10px] text-zinc-400 font-bold italic">{p.displayDescription || p.description || "Pago"} · {p.displayPaymentMethod || "Stripe"}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs md:text-sm font-black italic text-emerald-600">${(p.displayAmount || p.amount || 0).toFixed(2)} {(p.displayCurrency || p.currency || "USD").toUpperCase()}</p>
                  <p className="text-[8px] md:text-[9px] text-zinc-400 font-bold italic">{p.createdAt ? new Date(p.createdAt).toLocaleDateString("es-MX", { timeZone: "America/Mexico_City" }) : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!revenueData?.byStore || Object.keys(revenueData.byStore).length === 0) && recentPayments.length === 0 && (
        <div className="py-12 md:py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">No hay transacciones registradas</div>
      )}
    </motion.div>
  );
}

function Loader({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );
}
