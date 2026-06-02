"use client";

import React, { useState, useEffect, useCallback, useRef, Component, type ReactNode } from "react";

class ErrorBoundary extends Component<{children: ReactNode; fallback?: ReactNode}, {hasError: boolean}> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(e: Error) { console.warn("ErrorBoundary caught:", e.message); }
  handleRetry = () => this.setState({ hasError: false });
  render() {
    if (this.state.hasError) return this.props.fallback ?? (
      <div className="p-10 text-center space-y-4">
        <p className="text-zinc-400 italic text-sm">Error loading dashboard</p>
        <button onClick={this.handleRetry} className="px-6 py-2 bg-red-600 text-white rounded-xl font-black text-xs italic hover:bg-red-700 transition-all">
          RETRY
        </button>
      </div>
    );
    return this.props.children;
  }
}
import Link from "next/link";
import { 
  ShoppingCart,
  ShieldCheck,
  Lock,
  UserPlus,
  ArrowRight,
  LogOut,
  Sparkles,
  Zap,
  Globe,
  Phone,
  X,
  Bot,
  Calendar,
  Database,
  ChevronRight,
  BarChart3,
  Package,
  Star,
  Search,
  LayoutDashboard,
  TrendingUp,
  Users,
  FileText,
  CreditCard,
  MessageCircle,
  Settings,
  Puzzle,
  BookOpen,
  Megaphone,
  UserCircle,
  Receipt,
  Menu,
  ExternalLink
} from "lucide-react";
import AdminView from "@/components/admin/Admin";
import ChatView from "@/components/chat/Chat";
import BusinessDashboard from "@/components/business/BusinessDashboard";
import StoreView from "@/components/store/Store";
import MessagesPanel from "@/components/messaging/MessagesPanel";
import { Toast, useToast } from "@/components/ui/Toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn, slugify } from "@/lib/utils";

function SafeUserDashboard(p: {
  user: any; userStores: any; transactions: any; onNavigate: any;
  onSelectStore?: any; onCreateStore?: any; onEditStore?: any; onDeleteStore?: any;
}) {
  const rawStores = Array.isArray(p.userStores) ? p.userStores : [];
  const email = p.user?.email || "";
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", desc: "", type: "tienda" });
  const [searchQuery, setSearchQuery] = useState("");
  const { showToast } = useToast();
  const filteredStores = rawStores.filter((s: any) => {
    const q = searchQuery.toLowerCase();
    return !q || (s.name && s.name.toLowerCase().includes(q)) || (s.industry && s.industry.toLowerCase().includes(q)) || (s.type && s.type.toLowerCase().includes(q));
  });

  const storeCount = rawStores.length;
  const plan = p.user?.subscription;
  const planExpiry = p.user?.subscriptionExpiry ? new Date(p.user.subscriptionExpiry) : null;
  const isExpired = planExpiry && planExpiry < new Date();
  const limits = getPlanLimits(plan);
  const daysLeft = getDaysLeft(planExpiry);
  const planLabel = getPlanLabel(plan);
  const planColor = isExpired ? "bg-red-500/20 text-red-300" : plan ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-500/20 text-zinc-300";
  const canCreateStore = storeCount < limits.maxStores && !isExpired;

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 pb-4 md:pb-20">
      {/* User header */}
      <div className="bg-zinc-950 max-[400px]:p-4 p-6 md:p-10 max-[400px]:rounded-2xl rounded-[2rem] md:rounded-[3.5rem] text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-2xl md:rounded-3xl flex items-center justify-center border border-white/10 shrink-0">
                <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              </div>
              <div>
                <h2 className="max-[400px]:text-lg text-xl md:text-3xl font-black italic tracking-tighter uppercase">{p.user?.name || email?.split?.('@')?.[0] || (typeof email === 'string' ? email : "") || "Usuario"}</h2>
                <p className="text-zinc-400 text-[10px] md:text-xs font-bold italic">{typeof email === 'string' ? email : ""}</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className={cn("px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl font-black text-[9px] md:text-xs italic tracking-widest inline-block", planColor)}>
                {planLabel}
              </div>
              {planExpiry && (
                <p className={cn("text-[8px] md:text-[9px] font-bold italic mt-1", isExpired ? "text-red-400" : "text-zinc-400")}>
                  {isExpired ? "VENCIDO" : `Expira: ${planExpiry.toLocaleDateString()}`}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Subscription / Pricing card */}
      <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-zinc-100 p-4 md:p-6 group hover:border-red-200 transition-all space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-amber-50 rounded-xl md:rounded-2xl flex items-center justify-center text-amber-600 shadow-sm shrink-0">
              <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <p className="text-base md:text-lg font-black italic text-zinc-950 uppercase tracking-tighter">
                {plan ? `Plan ${plan.charAt(0).toUpperCase() + plan.slice(1)}` : "Sin plan activo"}
              </p>
              <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 italic">
                {plan
                  ? isExpired
                    ? "Tu plan ha vencido. Renueva para seguir disfrutando de todos los beneficios."
                    : `Acceso completo al plan ${plan}. ${planExpiry ? `Válido hasta ${planExpiry.toLocaleDateString()}.` : ""}`
                  : "Elige un plan y accede a todas las herramientas de Jandosoft."}
              </p>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => p.onNavigate?.("pricing")} className="w-full sm:w-auto px-5 md:px-6 py-3 bg-red-600 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs italic hover:bg-red-700 transition-all shadow-xl whitespace-nowrap text-center">
            VER PLANES
          </motion.button>
        </div>

        {/* Plan limits */}
        {!plan && (
          <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
            <div className="flex items-center justify-between text-sm">
              <span className="font-black italic text-zinc-600">Límite de tiendas</span>
              <span className="font-black italic text-zinc-950">{storeCount} / {limits.maxStores}</span>
            </div>
            <div className="mt-2 bg-zinc-200 h-2 rounded-full overflow-hidden">
              <div className="bg-red-600 h-full rounded-full transition-all" style={{ width: `${Math.min(100, (storeCount / limits.maxStores) * 100)}%` }} />
            </div>
            <p className="text-[9px] font-bold text-zinc-400 italic mt-2">Máximo {limits.maxStores} tiendas · {limits.maxProductsPerStore} productos por tienda en tu plan</p>
          </div>
        )}

        {/* Expiry warnings with CTA */}
        {daysLeft !== null && daysLeft <= 7 && !isExpired && (
          <div className="bg-amber-50 border border-amber-300 p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse shrink-0" />
              <p className="text-[11px] font-bold text-amber-800 italic">
                ⚠️ Tu plan {plan ? plan.toUpperCase() : ""} vence en {daysLeft} día{daysLeft === 1 ? "" : "s"}. Renueva hoy para mantener todas tus tiendas, productos y funciones activas.
              </p>
            </div>
            <button onClick={() => p.onNavigate?.("pricing")} className="px-6 py-3 bg-amber-600 text-white rounded-xl font-black text-[10px] italic hover:bg-amber-700 transition-all shadow-md">
              RENOVAR PLAN AHORA
            </button>
          </div>
        )}
        {isExpired && (
          <div className="bg-red-50 border border-red-300 p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shrink-0" />
              <p className="text-[11px] font-bold text-red-800 italic">
                ❌ Plan vencido. Tus tiendas y productos están en modo solo lectura. Renueva tu plan para recuperar el control total.
              </p>
            </div>
            <button onClick={() => p.onNavigate?.("pricing")} className="px-6 py-3 bg-red-600 text-white rounded-xl font-black text-[10px] italic hover:bg-red-700 transition-all shadow-md">
              RENOVAR PLAN AHORA
            </button>
          </div>
        )}
      </div>

      {/* Stores section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-6 w-full sm:w-auto">
            <div>
              <h3 className="text-xl md:text-2xl font-black italic text-zinc-950">Mis Tiendas</h3>
              <p className="text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1 italic">{storeCount} creadas</p>
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
              <input type="text" placeholder="Buscar tienda..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full sm:w-52 bg-zinc-50 pl-10 pr-4 py-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-red-200 transition-all" />
            </div>
          </div>
          <button onClick={() => {
            if (canCreateStore) { setShowForm(true); return; }
            if (isExpired) { showToast("❌ Plan vencido. Renueva tu plan para crear más tiendas.", "error"); p.onNavigate?.("pricing"); return; }
            showToast(`⚠️ Límite de ${limits.maxStores} tiendas alcanzado. Actualiza tu plan para crear más.`, "info");
            p.onNavigate?.("pricing");
          }} className={cn("w-full sm:w-auto px-5 md:px-6 py-3 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs italic transition-all shadow-xl flex items-center justify-center gap-2", canCreateStore ? "bg-red-600 text-white hover:bg-red-700" : "bg-zinc-200 text-zinc-400 cursor-not-allowed")}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            {canCreateStore ? "NUEVA TIENDA" : `LÍMITE (${limits.maxStores})`}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {(filteredStores as any[]).map((store: any) => {
            const storeId = store._id || store.id;
            const storeName = typeof store.name === 'string' ? store.name : '';
            const storeType = typeof store.typeLabel === 'string' ? store.typeLabel : (typeof store.type === 'string' ? store.type : '');
            const storeIndustry = typeof store.industry === 'string' ? store.industry : '';
            return (
              <div key={storeId || Math.random()}
                onClick={() => p.onSelectStore?.(storeId)}
                className="bg-white max-[400px]:rounded-2xl max-[400px]:p-4 rounded-[2rem] md:rounded-[2.5rem] border border-zinc-100 p-5 md:p-6 space-y-3 md:space-y-4 group hover:border-red-200 hover:shadow-xl transition-all cursor-pointer"
              >
                <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-red-600 to-red-700 max-[400px]:rounded-xl rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                </div>
                <div className="min-w-0">
                  <h4 className="text-base md:text-lg font-black italic text-zinc-950 truncate">{storeName || "Tienda"}</h4>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-[8px] md:text-[9px] font-black italic uppercase">{storeType || "General"}</span>
                    {storeIndustry && <span className="text-[8px] md:text-[9px] text-zinc-400 font-black italic">{storeIndustry}</span>}
                  </div>
                </div>
                {(() => {
                  const storeSlug = store.slug || slugify(storeName) || undefined;
                  return storeSlug && (
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <a href={`/s/${storeSlug}`} target="_blank" className="p-2.5 hover:bg-emerald-50 rounded-xl transition-all group" title="Ver tienda pública">
                        <ExternalLink className="w-5 h-5 text-zinc-400 group-hover:text-emerald-600 transition-colors" />
                      </a>
                    </div>
                  );
                })()}
              </div>
            );
          })}
          {filteredStores.length === 0 && (
            <div className="col-span-full py-16 text-center italic font-black uppercase tracking-widest text-zinc-300">
              {searchQuery ? `Sin resultados para "${searchQuery}"` : "No tienes tiendas aún. Crea tu primera tienda."}
            </div>
          )}
        </div>
      </div>

      {/* Create store modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[100] max-[400px]:p-3 p-4 md:p-6" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg bg-white max-[400px]:rounded-2xl max-[400px]:p-4 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-3xl relative overflow-hidden mx-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowForm(false)} className="absolute top-4 md:top-8 right-4 md:right-8 p-1 hover:bg-zinc-100 rounded-lg">
              <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <div className="text-center mb-6">
              <h3 className="text-2xl md:text-3xl font-black italic text-zinc-950">Nueva Tienda</h3>
              <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2 italic">Comienza tu negocio en Jandosoft</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Nombre</label>
                <input placeholder="Ej. Mi Tienda" value={form.name}
                  onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
              </div>
              <div>
                <label className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Tipo</label>
                <select value={form.type}
                  onChange={e => setForm(f => ({...f, type: e.target.value}))}
                  className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 italic text-sm">
                  <option value="tienda">Tienda Online</option>
                  <option value="ventas">Sistema de Ventas</option>
                  <option value="saas">SaaS</option>
                  <option value="crm">CRM</option>
                </select>
              </div>
              <div>
                <label className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Descripción</label>
                <textarea placeholder="Describe tu negocio..." value={form.desc}
                  onChange={e => setForm(f => ({...f, desc: e.target.value}))}
                  className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all resize-none h-20 mt-1 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4 pt-2">
                <button onClick={() => setShowForm(false)}
                  className="py-3 md:py-4 bg-zinc-50 text-zinc-600 rounded-xl md:rounded-2xl font-black italic text-[11px] md:text-sm hover:bg-zinc-100 transition-all">
                  CANCELAR
                </button>
                <button onClick={() => {
                  p.onCreateStore?.({
                    name: form.name || "Mi Tienda",
                    desc: form.desc,
                    type: form.type,
                    typeLabel: form.type,
                    industry: "tecnologia",
                    createdAt: new Date().toISOString(),
                    ownerEmail: email
                  });
                  setShowForm(false);
                  setForm({ name: "", desc: "", type: "tienda" });
                }}
                  className="py-3 md:py-4 bg-red-600 text-white rounded-xl md:rounded-2xl font-black italic text-[11px] md:text-sm hover:bg-red-700 transition-all shadow-xl flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                  CREAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



const SESSION_KEY = "jandosession";
const SESS_DURATION = 7 * 24 * 60 * 60 * 1000;

const PLAN_LIMITS: Record<string, { maxStores: number; maxProductsPerStore: number; maxMessages: number; maxAutomations: number; label: string }> = {
  free: { maxStores: 3, maxProductsPerStore: 20, maxMessages: 10, maxAutomations: 5, label: "Gratis" },
  basic: { maxStores: 10, maxProductsPerStore: 100, maxMessages: 999, maxAutomations: 20, label: "Básico" },
  enterprise: { maxStores: 999, maxProductsPerStore: 9999, maxMessages: 999, maxAutomations: 999, label: "Enterprise" },
};

function getPlanLimits(subscription: string | null) {
  return PLAN_LIMITS[subscription || "free"] || PLAN_LIMITS.free;
}

function getPlanLabel(subscription: string | null) {
  return subscription ? `PLAN ${subscription.toUpperCase()}` : "SIN PLAN";
}

function getDaysLeft(expiry: Date | string | null): number | null {
  if (!expiry) return null;
  const d = new Date(expiry);
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

interface Session {
  token: string;
  email: string;
  isAdmin: boolean;
  organizationId: string;
  loggedAt: number;
}

export default function Page() {
  const [activeTab, setActiveTab] = useState<"home" | "admin" | "register" | "admin-login" | "chat" | "dashboard" | "business" | "pricing" | "messages">("home");
  const [businessSection, setBusinessSection] = useState<string>("overview");
  const [isLogged, setIsLogged] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [adminLoginForm, setAdminLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [user, setUser] = useState({
    email: "",
    subscription: null as string | null,
    subscriptionExpiry: null as Date | null,
    isSuspended: false,
    organizationId: "",
    role: "member" as string,
  });
  const [org, setOrg] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const syncToken = (t: string | null) => { setToken(t); tokenRef.current = t; };
  const [userStores, setUserStores] = useState<any[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string | number | null>(null);
  const activeStore = Array.isArray(userStores) ? (userStores.find(s => (s._id === activeStoreId || s.id === activeStoreId)) || null) : null;
  const [transactions, setTransactions] = useState<any[]>([]);
  const [currency, setCurrency] = useState<"USD" | "MXN" | "COP" | "ARS">("USD");

  const handlePaymentSuccess = async (transaction: any) => {
    setTransactions(prev => [transaction, ...prev]);
    const planName = transaction.items[0];
    let subType = "basic";
    if (planName.toLowerCase().includes("enterprise")) subType = "enterprise";
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    setUser(prev => ({ ...prev, subscription: subType, subscriptionExpiry: expiry }));
    await apiFetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: subType, subscriptionExpiry: expiry.toISOString() }),
    }).catch(() => {});
  };

  const [products, setProducts] = useState<any[]>([
    { id: 1, name: "Jandosoft Cloud Core", price: 499, desc: "Infraestructura escalable con base de datos en tiempo real.", icon: <Database className="w-8 h-8" />, images: ["https://res.cloudinary.com/dpmufjj8y/image/upload/v1748556975/jandosoft/cloud-core_ld5upi.png"] },
    { id: 2, name: "Admin Enterprise Panel", price: 850, desc: "Control total de métricas y CRM para grandes empresas.", icon: <ShieldCheck className="w-8 h-8" />, images: ["https://res.cloudinary.com/dpmufjj8y/image/upload/v1748556975/jandosoft/admin-panel_mtvzok.png"] },
    { id: 3, name: "Smart Booking Engine", price: 299, desc: "Sistema de citas automatizado con IA integrada.", icon: <Calendar className="w-8 h-8" />, images: ["https://res.cloudinary.com/dpmufjj8y/image/upload/v1748556975/jandosoft/booking_ybhsut.png"] },
    { id: 4, name: "IA Support Agent", price: 150, desc: "Chatbot avanzado conectado a tus datos de negocio.", icon: <Bot className="w-8 h-8" />, images: ["https://res.cloudinary.com/dpmufjj8y/image/upload/v1748556975/jandosoft/ia-agent_hpblrg.png"] },
    { id: 5, name: "Global Edge CDN", price: 199, desc: "Acelera tu contenido a nivel mundial con nuestra red ultra rápida.", icon: <Globe className="w-8 h-8" />, images: ["https://res.cloudinary.com/dpmufjj8y/image/upload/v1748556975/jandosoft/global-cdn_fjhzof.png"] },
    { id: 6, name: "Security Shield Pro", price: 350, desc: "Protección contra ataques DDoS y firewall avanzado de última generación.", icon: <Lock className="w-8 h-8" />, images: ["https://res.cloudinary.com/dpmufjj8y/image/upload/v1748556975/jandosoft/security-shield_h5dypa.png"] },
    { id: 7, name: "Auto-Scale Analytics", price: 420, desc: "Métricas profundas que escalan con el tráfico de tu aplicación.", icon: <BarChart3 className="w-8 h-8" />, images: ["https://res.cloudinary.com/dpmufjj8y/image/upload/v1748556975/jandosoft/analytics_b2sxdk.png"] },
    { id: 8, name: "Serverless Compute", price: 275, desc: "Ejecuta funciones en la nube sin preocuparte por la infraestructura.", icon: <Zap className="w-8 h-8" />, images: ["https://res.cloudinary.com/dpmufjj8y/image/upload/v1748556975/jandosoft/serverless_klef3l.png"] },
  ]);
  const { showToast, ToastComponent } = useToast();

  const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const headers: any = { ...options.headers };
    const t = tokenRef.current;
    if (t) {
      headers["Authorization"] = `Bearer ${t}`;
    }
    if (!headers["Content-Type"] && options.body) {
      headers["Content-Type"] = "application/json";
    }
    return fetch(url, { ...options, headers });
  }, []);

  const loadFromAPI = useCallback(async (email: string) => {
    try {
      const [userRes, storesRes] = await Promise.all([
        fetch(`/api/user?email=${encodeURIComponent(email)}`),
        apiFetch(`/api/stores?email=${encodeURIComponent(email)}`)
      ]);
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(prev => ({ ...prev, ...userData.user }));
      }
      if (storesRes.ok) {
        const storesData = await storesRes.json();
        const list = storesData.stores ?? storesData.userStores ?? storesData;
        setUserStores(Array.isArray(list) ? list : []);
      }
    } catch (e) {
      console.error("Error loading data from API:", e);
    }
  }, [apiFetch]);

  const loadUserFromSession = useCallback(async (session: Session) => {
    const sessionClean = {
      token: typeof session.token === "string" ? session.token : "",
      email: typeof session.email === "string" ? session.email : "",
      isAdmin: !!session.isAdmin,
      organizationId: typeof session.organizationId === "string" ? session.organizationId : "",
      loggedAt: typeof session.loggedAt === "number" ? session.loggedAt : 0,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionClean));

    syncToken(sessionClean.token);
    setIsLogged(true);
    setIsAdmin(sessionClean.isAdmin);
    setUser(prev => ({ ...prev, email: sessionClean.email, organizationId: sessionClean.organizationId }));

    const orgId = sessionClean.organizationId && sessionClean.organizationId !== "undefined" ? sessionClean.organizationId : "";
    const email = sessionClean.email || "";

    try {
      const [userRes, storesRes] = await Promise.all([
        apiFetch(`/api/user${email ? `?email=${encodeURIComponent(email)}` : ""}`),
        orgId ? apiFetch(`/api/stores?organizationId=${orgId}`) : apiFetch(`/api/stores${email ? `?email=${encodeURIComponent(email)}` : ""}`),
      ]);
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.user) {
          setUser(prev => ({ ...prev, ...userData.user }));
          if (userData.user.organizationId) {
            const sessionStr = localStorage.getItem(SESSION_KEY);
            if (sessionStr) {
              try {
                const s = JSON.parse(sessionStr);
                s.organizationId = userData.user.organizationId;
                localStorage.setItem(SESSION_KEY, JSON.stringify(s));
              } catch {}
            }
          }
        }
      }
      if (storesRes.ok) {
        const storesData = await storesRes.json();
        const list = storesData.stores ?? storesData.userStores ?? storesData;
        setUserStores(Array.isArray(list) ? list : []);
      }
    } catch (e) {
      console.error("Error loading user data:", e);
    }
  }, [apiFetch]);

  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (!saved) return;
    try {
      const session: Session = JSON.parse(saved);
      if (Date.now() - session.loggedAt > SESS_DURATION) {
        localStorage.removeItem(SESSION_KEY);
        showToast("Sesión expirada. Vuelve a iniciar sesión.", "error");
        return;
      }
      loadUserFromSession(session);
    } catch {}
  }, []);

  const saveSession = (email: string, admin = false, sessionToken: string, orgId: string) => {
    const session: Session = {
      token: sessionToken || "",
      email: email || "",
      isAdmin: admin || false,
      organizationId: orgId || "",
      loggedAt: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    syncToken(sessionToken);
  };

  const handleRegister = async () => {
    if (!registerForm.name || !registerForm.phone || !registerForm.email || !registerForm.password) {
      showToast("Por favor completa todos los campos", "info");
      return;
    }
    if (registerForm.password.length < 6) {
      showToast("La contraseña debe tener al menos 6 caracteres", "error");
      return;
    }
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast("Registro exitoso", "success");
        setIsLogged(true);
        setIsAdmin(false);
        setUser(prev => ({ ...prev, email: data.user.email, name: data.user.name, organizationId: data.user.organizationId, role: data.user.role }));
        setOrg(data.organization);
        saveSession(data.user.email, false, data.token, data.user.organizationId);
        setActiveTab("dashboard");
        loadFromAPI(data.user.email);
        setRegisterForm({ name: "", phone: "", email: "", password: "" });
      } else {
        showToast(data.error || "Error al registrar", "error");
      }
    } catch {
      showToast("Error de conexión al registrar", "error");
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminLoginForm)
      });
      const data = await res.json();
      if (data.success) {
        setIsAdmin(true);
        setIsLogged(true);
        setShowLogin(false);
        setActiveTab("admin");
        showToast("Bienvenido Administrador", "success");
        saveSession(adminLoginForm.email, true, "", "");
      } else {
        showToast(data.error || "Credenciales incorrectas", "error");
      }
    } catch {
      showToast("Error de conexión", "error");
    }
  };

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      showToast("Por favor rellena todos los campos", "info");
      return;
    }
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (data.success) {
        setUser(prev => ({ ...prev, ...data.user }));
        setIsLogged(true);
        setIsAdmin(false);
        setShowLogin(false);
        setActiveTab("dashboard");
        showToast(`Sesión iniciada: ${loginForm.email}`, "success");
        saveSession(data.user.email, false, data.token, data.user.organizationId || "");
        loadFromAPI(loginForm.email);
        setLoginForm({ email: "", password: "" });
      } else {
        showToast(data.error || "Error al iniciar sesión", "error");
      }
    } catch {
      showToast("Error de conexión al iniciar sesión", "error");
    }
  };

  useEffect(() => {
    if (!isLogged && !["home", "register", "admin-login"].includes(activeTab)) {
      setActiveTab("home");
    }
  }, [isLogged, activeTab]);

  const handleLogout = () => {
    setIsLogged(false);
    setIsAdmin(false);
    syncToken(null);
    setOrg(null);
    setUserStores([]);
    setUser({ email: "", subscription: null, subscriptionExpiry: null, isSuspended: false, organizationId: "", role: "member" });
    setActiveTab("home");
    localStorage.removeItem(SESSION_KEY);
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    showToast("Sesión cerrada", "info");
  };

  const handleSaveStore = async (storeId: string | number, data: any) => {
    try {
      await apiFetch(`/api/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      setUserStores(prev => prev.map(s => (s._id === storeId || s.id === storeId) ? { ...s, ...data } : s));
    } catch (e) {
      console.error("Error saving store:", e);
    }
  };

  const handleSelectStore = (storeId: string | number) => {
    setActiveStoreId(storeId);
    setActiveTab("business");
  };

  return (
    <div className="min-h-screen bg-red-600 flex font-sans text-zinc-950 overflow-x-hidden overflow-y-hidden relative">
      
      <aside className="w-56 hidden md:flex bg-red-700 flex-col py-6 border-r border-red-800/20 z-50 overflow-y-auto">
         <motion.div 
            whileHover={{ rotate: 180, scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-red-900/40 cursor-pointer mx-auto mb-4"
            onClick={() => setActiveTab("home")}
         >
            <ShieldCheck className="w-8 h-8 text-red-600" />
         </motion.div>

         <nav className="flex-1 flex flex-col px-3 space-y-5 overflow-y-auto no-scrollbar">
            {isLogged && (
              <>
                <div>
                  <p className="text-[9px] font-black text-red-300 uppercase tracking-[0.2em] px-3 mb-2 italic">Gestión</p>
                  <SideNavItem2 icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
                  <SideNavItem2 icon={<Package className="w-4 h-4" />} label="Productos" active={activeTab === "business" && businessSection === "products"} onClick={() => { if (activeStoreId) { setBusinessSection("products"); setActiveTab("business"); } else showToast("Selecciona una tienda primero", "info"); }} />
                  <SideNavItem2 icon={<Users className="w-4 h-4" />} label="Clientes" active={activeTab === "business" && businessSection === "customers"} onClick={() => { if (activeStoreId) { setBusinessSection("customers"); setActiveTab("business"); } else showToast("Selecciona una tienda primero", "info"); }} />
                  <SideNavItem2 icon={<ShoppingCart className="w-4 h-4" />} label="Pedidos" active={activeTab === "business" && businessSection === "orders"} onClick={() => { if (activeStoreId) { setBusinessSection("orders"); setActiveTab("business"); } else showToast("Selecciona una tienda primero", "info"); }} />
                  <SideNavItem2 icon={<FileText className="w-4 h-4" />} label="Facturas" active={activeTab === "business" && businessSection === "invoices"} onClick={() => { if (activeStoreId) { setBusinessSection("invoices"); setActiveTab("business"); } else showToast("Selecciona una tienda primero", "info"); }} />
                  <SideNavItem2 icon={<CreditCard className="w-4 h-4" />} label="Pagos" active={activeTab === "business" && businessSection === "payments"} onClick={() => { if (activeStoreId) { setBusinessSection("payments"); setActiveTab("business"); } else setActiveTab("pricing"); }} />
                </div>

                <div>
                  <p className="text-[9px] font-black text-red-300 uppercase tracking-[0.2em] px-3 mb-2 italic">Automatización</p>
                  <SideNavItem2 icon={<Bot className="w-4 h-4" />} label="IA Agente" active={activeTab === "business" && businessSection === "ai"} onClick={() => { if (activeStoreId) { setBusinessSection("ai"); setActiveTab("business"); } else showToast("Selecciona una tienda primero", "info"); }} />
                  <SideNavItem2 icon={<Zap className="w-4 h-4" />} label="Automatizaciones" active={activeTab === "business" && businessSection === "automations"} onClick={() => { if (activeStoreId) { setBusinessSection("automations"); setActiveTab("business"); } else showToast("Selecciona una tienda primero", "info"); }} />
                  <SideNavItem2 icon={<BookOpen className="w-4 h-4" />} label="Base de Conocimiento" active={activeTab === "business" && businessSection === "knowledgebase"} onClick={() => { if (activeStoreId) { setBusinessSection("knowledgebase"); setActiveTab("business"); } else showToast("Selecciona una tienda primero", "info"); }} />
                </div>

                <div>
                  <p className="text-[9px] font-black text-red-300 uppercase tracking-[0.2em] px-3 mb-2 italic">Comunicación</p>
                  <SideNavItem2 icon={<MessageCircle className="w-4 h-4" />} label="IA Chat" active={activeTab === "chat"} onClick={() => setActiveTab("chat")} />
                  <SideNavItem2 icon={<Users className="w-4 h-4" />} label="Mensajes" active={activeTab === "messages"} onClick={() => setActiveTab("messages")} />
                  <SideNavItem2 icon={<Megaphone className="w-4 h-4" />} label="Campañas" active={activeTab === "business" && businessSection === "campaigns"} onClick={() => { if (activeStoreId) { setBusinessSection("campaigns"); setActiveTab("business"); } else showToast("Selecciona una tienda primero", "info"); }} />
                </div>

                <div>
                  <p className="text-[9px] font-black text-red-300 uppercase tracking-[0.2em] px-3 mb-2 italic">Empresa</p>
                  <SideNavItem2 icon={<UserCircle className="w-4 h-4" />} label="Equipo" active={activeTab === "business" && businessSection === "team"} onClick={() => { if (activeStoreId) { setBusinessSection("team"); setActiveTab("business"); } else showToast("Selecciona una tienda primero", "info"); }} />
                  <SideNavItem2 icon={<Settings className="w-4 h-4" />} label="Configuración" active={activeTab === "business" && businessSection === "orgsettings"} onClick={() => { if (activeStoreId) { setBusinessSection("orgsettings"); setActiveTab("business"); } else showToast("Selecciona una tienda primero", "info"); }} />
                  <SideNavItem2 icon={<Puzzle className="w-4 h-4" />} label="Integraciones" active={activeTab === "business" && businessSection === "integrations"} onClick={() => { if (activeStoreId) { setBusinessSection("integrations"); setActiveTab("business"); } else showToast("Selecciona una tienda primero", "info"); }} />
                </div>
              </>
            )}
            {!isLogged && (
              <>
                <SideNavItem2 icon={<Sparkles className="w-4 h-4" />} label="Inicio" active={activeTab === "home"} onClick={() => setActiveTab("home")} />
                <SideNavItem2 icon={<Package className="w-4 h-4" />} label="Planes" active={activeTab === "pricing"} onClick={() => setActiveTab("pricing")} />
              </>
            )}
         </nav>

         <div className="flex flex-col px-3 mt-4 pt-4 border-t border-red-800/20">
            {isLogged && (
              <>
                {isAdmin && <SideNavItem2 icon={<ShieldCheck className="w-4 h-4" />} label="Admin" active={activeTab === "admin"} onClick={() => setActiveTab("admin")} />}
                <SideNavItem2 icon={<LogOut className="w-4 h-4" />} label="Salir" active={false} onClick={handleLogout} />
              </>
            )}
            {!isLogged && (
              <SideNavItem2 icon={<UserPlus className="w-4 h-4" />} label="Acceder" active={false} onClick={() => setShowLogin(true)} />
            )}
         </div>
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-zinc-200/80 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {isLogged ? (
            <>
              <MobileNavItem icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" active={activeTab === "dashboard"} onClick={() => { setMobileDrawerOpen(false); setActiveTab("dashboard"); }} />
              <MobileNavItem icon={<Package className="w-5 h-5" />} label="Productos" active={activeTab === "business" && businessSection === "products"} onClick={() => { setMobileDrawerOpen(false); if (activeStoreId) { setBusinessSection("products"); setActiveTab("business"); } else showToast("Selecciona una tienda primero", "info"); }} />
              <MobileNavItem icon={<Bot className="w-5 h-5" />} label="IA Chat" active={activeTab === "chat"} onClick={() => { setMobileDrawerOpen(false); setActiveTab("chat"); }} />
              <MobileNavItem icon={<CreditCard className="w-5 h-5" />} label="Planes" active={activeTab === "pricing"} onClick={() => { setMobileDrawerOpen(false); setActiveTab("pricing"); }} />
              <MobileNavItem icon={<Menu className="w-5 h-5" />} label="Menú" active={mobileDrawerOpen} onClick={() => setMobileDrawerOpen(true)} />
            </>
          ) : (
            <>
              <MobileNavItem icon={<Sparkles className="w-5 h-5" />} label="Inicio" active={activeTab === "home"} onClick={() => { setMobileDrawerOpen(false); setActiveTab("home"); }} />
              <MobileNavItem icon={<Package className="w-5 h-5" />} label="Planes" active={activeTab === "pricing"} onClick={() => { setMobileDrawerOpen(false); setActiveTab("pricing"); }} />
              <MobileNavItem icon={<UserPlus className="w-5 h-5" />} label="Acceder" active={false} onClick={() => setShowLogin(true)} />
            </>
          )}
        </div>
      </nav>

      {/* Mobile fullscreen drawer */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setMobileDrawerOpen(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              onClick={e => e.stopPropagation()}
              className="absolute left-0 top-0 bottom-0 w-[300px] max-w-[85vw] bg-white shadow-4xl flex flex-col overflow-y-auto"
            >
              <div className="flex items-center justify-between px-5 h-16 border-b border-zinc-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-md">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-black italic text-zinc-950 tracking-tight">JANDOSOFT</span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMobileDrawerOpen(false)}
                  className="w-8 h-8 rounded-lg bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-zinc-400" />
                </motion.button>
              </div>

              <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
                {isLogged ? (
                  <>
                    <MobileDrawerGroup label="Gestión">
                      <MobileDrawerItem icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" active={activeTab === "dashboard"} onClick={() => { setMobileDrawerOpen(false); setActiveTab("dashboard"); }} />
                      <MobileDrawerItem icon={<Package className="w-4 h-4" />} label="Productos" active={activeTab === "business" && businessSection === "products"} onClick={() => { setMobileDrawerOpen(false); if (activeStoreId) { setBusinessSection("products"); setActiveTab("business"); } else showToast("Selecciona una tienda primero", "info"); }} />
                      <MobileDrawerItem icon={<Users className="w-4 h-4" />} label="Clientes" active={activeTab === "business" && businessSection === "customers"} onClick={() => { setMobileDrawerOpen(false); if (activeStoreId) { setBusinessSection("customers"); setActiveTab("business"); } else showToast("Selecciona una tienda primero", "info"); }} />
                      <MobileDrawerItem icon={<ShoppingCart className="w-4 h-4" />} label="Pedidos" active={activeTab === "business" && businessSection === "orders"} onClick={() => { setMobileDrawerOpen(false); if (activeStoreId) { setBusinessSection("orders"); setActiveTab("business"); } else showToast("Selecciona una tienda primero", "info"); }} />
                      <MobileDrawerItem icon={<FileText className="w-4 h-4" />} label="Facturas" active={activeTab === "business" && businessSection === "invoices"} onClick={() => { setMobileDrawerOpen(false); if (activeStoreId) { setBusinessSection("invoices"); setActiveTab("business"); } else showToast("Selecciona una tienda primero", "info"); }} />
                      <MobileDrawerItem icon={<CreditCard className="w-4 h-4" />} label="Pagos" active={activeTab === "business" && businessSection === "payments"} onClick={() => { setMobileDrawerOpen(false); if (activeStoreId) { setBusinessSection("payments"); setActiveTab("business"); } else setActiveTab("pricing"); }} />
                    </MobileDrawerGroup>

                    <MobileDrawerGroup label="Automatización">
                      <MobileDrawerItem icon={<Bot className="w-4 h-4" />} label="IA Agente" active={activeTab === "business" && businessSection === "ai"} onClick={() => { setMobileDrawerOpen(false); if (activeStoreId) { setBusinessSection("ai"); setActiveTab("business"); } else showToast("Selecciona una tienda primero", "info"); }} />
                      <MobileDrawerItem icon={<Zap className="w-4 h-4" />} label="Automatizaciones" active={activeTab === "business" && businessSection === "automations"} onClick={() => { setMobileDrawerOpen(false); if (activeStoreId) { setBusinessSection("automations"); setActiveTab("business"); } else showToast("Selecciona una tienda primero", "info"); }} />
                      <MobileDrawerItem icon={<BookOpen className="w-4 h-4" />} label="Base de Conocimiento" active={activeTab === "business" && businessSection === "knowledgebase"} onClick={() => { setMobileDrawerOpen(false); if (activeStoreId) { setBusinessSection("knowledgebase"); setActiveTab("business"); } else showToast("Selecciona una tienda primero", "info"); }} />
                    </MobileDrawerGroup>

                    <MobileDrawerGroup label="Comunicación">
                      <MobileDrawerItem icon={<MessageCircle className="w-4 h-4" />} label="IA Chat" active={activeTab === "chat"} onClick={() => { setMobileDrawerOpen(false); setActiveTab("chat"); }} />
                      <MobileDrawerItem icon={<Users className="w-4 h-4" />} label="Mensajes" active={activeTab === "messages"} onClick={() => { setMobileDrawerOpen(false); setActiveTab("messages"); }} />
                      <MobileDrawerItem icon={<Megaphone className="w-4 h-4" />} label="Campañas" active={activeTab === "business" && businessSection === "campaigns"} onClick={() => { setMobileDrawerOpen(false); if (activeStoreId) { setBusinessSection("campaigns"); setActiveTab("business"); } else showToast("Selecciona una tienda primero", "info"); }} />
                    </MobileDrawerGroup>

                    <MobileDrawerGroup label="Empresa">
                      <MobileDrawerItem icon={<UserCircle className="w-4 h-4" />} label="Equipo" active={activeTab === "business" && businessSection === "team"} onClick={() => { setMobileDrawerOpen(false); if (activeStoreId) { setBusinessSection("team"); setActiveTab("business"); } else showToast("Selecciona una tienda primero", "info"); }} />
                      <MobileDrawerItem icon={<Settings className="w-4 h-4" />} label="Configuración" active={activeTab === "business" && businessSection === "orgsettings"} onClick={() => { setMobileDrawerOpen(false); if (activeStoreId) { setBusinessSection("orgsettings"); setActiveTab("business"); } else showToast("Selecciona una tienda primero", "info"); }} />
                      <MobileDrawerItem icon={<Puzzle className="w-4 h-4" />} label="Integraciones" active={activeTab === "business" && businessSection === "integrations"} onClick={() => { setMobileDrawerOpen(false); if (activeStoreId) { setBusinessSection("integrations"); setActiveTab("business"); } else showToast("Selecciona una tienda primero", "info"); }} />
                    </MobileDrawerGroup>
                  </>
                ) : (
                  <>
                    <MobileDrawerItem icon={<Sparkles className="w-4 h-4" />} label="Inicio" active={activeTab === "home"} onClick={() => { setMobileDrawerOpen(false); setActiveTab("home"); }} />
                    <MobileDrawerItem icon={<Package className="w-4 h-4" />} label="Planes" active={activeTab === "pricing"} onClick={() => { setMobileDrawerOpen(false); setActiveTab("pricing"); }} />
                  </>
                )}
              </nav>

              <div className="border-t border-zinc-100 px-3 py-4 shrink-0">
                {isLogged ? (
                  <div className="space-y-1">
                    {isAdmin && (
                      <MobileDrawerItem icon={<ShieldCheck className="w-4 h-4" />} label="Admin" active={activeTab === "admin"} onClick={() => { setMobileDrawerOpen(false); setActiveTab("admin"); }} />
                    )}
                    <MobileDrawerItem icon={<LogOut className="w-4 h-4" />} label="Cerrar Sesión" active={false} onClick={() => { setMobileDrawerOpen(false); handleLogout(); }} />
                  </div>
                ) : (
                  <MobileDrawerItem icon={<UserPlus className="w-4 h-4" />} label="Iniciar Sesión" active={false} onClick={() => { setMobileDrawerOpen(false); setShowLogin(true); }} />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 bg-white relative flex flex-col overflow-hidden pb-20 md:pb-0">
         <header className="h-16 md:h-20 w-full bg-white/80 backdrop-blur-xl border-b border-zinc-100 flex items-center justify-between px-4 md:px-10 z-40">
            <div className="flex items-center gap-2 md:gap-4">
               <h1 className="text-lg md:text-2xl font-black italic tracking-tighter text-red-600 uppercase">JANDOSOFT </h1>
               <div className="h-6 w-px bg-zinc-200 hidden md:block" />
            </div>

              <div className="flex items-center gap-2 md:gap-6">
                 {!isLogged && activeTab !== "register" && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab("register")}
                      className="px-4 md:px-6 py-2 md:py-2.5 bg-red-600 text-white rounded-xl font-black text-[10px] md:text-xs hover:bg-red-700 transition-all shadow-xl shadow-red-100 flex items-center gap-1 md:gap-2 italic"
                    >
                       COMENZAR <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                    </motion.button>
                )}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMobileDrawerOpen(true)}
                  className="md:hidden w-9 h-9 rounded-xl bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center transition-colors"
                >
                  <Menu className="w-5 h-5 text-zinc-600" />
                </motion.button>
             </div>
         </header>

          <div className="flex-1 overflow-y-auto p-4 max-[400px]:p-2.5 max-[340px]:p-1.5 md:p-8 relative">
             <AnimatePresence mode="wait">
                 {activeTab === "home" && (
                    <motion.div
                       key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="space-y-16 md:space-y-32 pb-16 md:pb-32"
                   >
                       <section className="relative overflow-hidden rounded-[2rem] md:rounded-[4rem] bg-gradient-to-br from-zinc-950 via-zinc-900 to-red-950 max-[400px]:p-4 p-6 md:p-12 lg:p-24">
                          <div className="absolute top-0 right-0 max-[500px]:w-[250px] max-[500px]:h-[250px] w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
                          <div className="absolute bottom-0 left-0 max-[500px]:w-[200px] max-[500px]:h-[200px] w-[400px] h-[400px] bg-red-600/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
                         <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="absolute top-10 right-10 w-32 h-32 border border-red-500/20 rounded-full" />
                         <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="absolute bottom-20 left-20 w-20 h-20 border border-red-500/10 rounded-full" />

                         <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 md:space-y-10">
                           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="inline-flex items-center gap-2 px-3 md:px-5 py-1.5 md:py-2 bg-white/10 text-white rounded-full text-[9px] md:text-xs font-black border border-white/10 backdrop-blur-md italic tracking-widest">
                             <Zap className="w-3 h-3 md:w-3.5 md:h-3.5 text-red-400" /> PLATAFORMA DE NEGOCIOS N°1
                           </motion.div>

                           <motion.h2 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black italic leading-[1.05] tracking-tighter text-white">
                             Construye el <br/>
                             <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-amber-500">Futuro Digital</span>
                             <br/>de tu Empresa
                           </motion.h2>

                           <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-sm md:text-lg lg:text-xl text-zinc-400 font-medium leading-relaxed max-w-2xl mx-auto">
                             La suite definitiva de herramientas cloud, CRM, IA, booking y más — diseñada para escalar tu negocio sin límites.
                           </motion.p>

                           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
                              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setActiveTab("register")} className="w-full sm:w-auto px-6 md:px-10 py-4 md:py-5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl font-black text-sm md:text-lg hover:scale-105 transition-all shadow-2xl shadow-red-600/30 italic tracking-wider flex items-center justify-center gap-2 md:gap-3">
                                COMENZAR AHORA <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                              </motion.button>
                              <motion.button whileTap={{ scale: 0.95 }} onClick={() => isLogged ? setActiveTab("dashboard") : setShowLogin(true)} className="w-full sm:w-auto px-6 md:px-10 py-4 md:py-5 bg-white/10 text-white border border-white/20 rounded-2xl font-black text-sm md:text-lg hover:bg-white/20 transition-all italic tracking-wider backdrop-blur-md">
                                {isLogged ? "MI ESPACIO" : "INICIAR SESIÓN"}
                              </motion.button>
                           </motion.div>
                        </div>
                      </section>

<section className="max-w-6xl mx-auto px-6">
                         <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid grid-cols-2 md:grid-cols-4 max-[400px]:gap-3 gap-6">
                          {[
                            { value: "10K+", label: "Usuarios Activos" },
                            { value: "99.9%", label: "Uptime Garantizado" },
                            { value: "150+", label: "Países" },
                            { value: "4.9", label: "Calificación" },
                          ].map((stat, i) => (
                            <motion.div
                              key={stat.label}
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{ delay: i * 0.1 }}
                              className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-zinc-100 shadow-3xl p-4 md:p-8 text-center space-y-2 hover:border-red-600/20 transition-all"
                            >
                              <p className="text-2xl md:text-5xl font-black italic text-red-600 tracking-tighter">{stat.value}</p>
                              <p className="text-xs font-black uppercase tracking-widest text-zinc-400 italic">{stat.label}</p>
                            </motion.div>
                          ))}
                        </motion.div>
                      </section>

                      <section className="max-w-6xl mx-auto px-6 space-y-12">
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center space-y-4">
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-xs font-black border border-red-100 italic">
                            <Zap className="w-3.5 h-3.5" /> ECOSISTEMA COMPLETO
                          </div>
                          <h3 className="max-[400px]:text-3xl text-4xl md:text-5xl font-black italic text-zinc-950 uppercase tracking-tighter">
                            Todo lo que <span className="text-red-600">necesitas</span>
                          </h3>
                          <p className="max-[400px]:text-sm text-zinc-500 text-lg font-medium max-w-xl mx-auto">
                            Una plataforma unificada con herramientas empresariales de alto rendimiento.
                          </p>
                        </motion.div>

                        <div className="flex justify-center">
                          <motion.button
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            whileHover={{ y: -8 }}
                            onClick={() => setActiveTab("chat")}
                            className="bg-white rounded-[2rem] md:rounded-[3rem] border border-zinc-100 shadow-3xl p-4 md:p-8 text-left space-y-4 md:space-y-6 group hover:shadow-4xl transition-all text-start max-w-sm"
                          >
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                              <Bot className="w-5 h-5 md:w-8 md:h-8" />
                            </div>
                            <div>
                              <h4 className="text-lg md:text-2xl font-black italic text-zinc-950 uppercase tracking-tighter mb-1 md:mb-2">IA Agent</h4>
                              <p className="text-xs md:text-sm text-zinc-500 font-medium leading-relaxed">Chatbot avanzado conectado a la inteligencia de tu negocio.</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-600 italic opacity-0 group-hover:opacity-100 transition-opacity">
                              Explorar <ArrowRight className="w-3.5 h-3.5" />
                            </div>
                          </motion.button>
                        </div>
                      </section>

                      <section className="max-w-6xl mx-auto px-6 space-y-12">
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center space-y-4">
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-xs font-black border border-red-100 italic">
                            <Package className="w-3.5 h-3.5" /> PLANES PROFESIONALES
                          </div>
                          <h3 className="max-[400px]:text-3xl text-4xl md:text-5xl font-black italic text-zinc-950 uppercase tracking-tighter">
                            Inversión <span className="text-red-600">Transparente</span>
                          </h3>
                          <p className="max-[400px]:text-sm text-zinc-500 text-lg font-medium max-w-xl mx-auto">
                            Soluciones modulares que se adaptan al tamaño de tu negocio.
                          </p>
                        </motion.div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                          {products.slice(0, 4).map((p, i) => (
                            <motion.div
                              key={p.id}
                              initial={{ opacity: 0, y: 30 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{ delay: i * 0.1 }}
                              whileHover={{ y: -6 }}
                              onClick={() => setActiveTab("register")}
                              className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-zinc-100 shadow-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 cursor-pointer group hover:border-red-600/20 transition-all"
                            >
                              <div className="w-10 h-10 md:w-14 md:h-14 bg-zinc-50 rounded-xl md:rounded-2xl flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all shadow-md group-hover:rotate-6">
                                {React.cloneElement(p.icon as React.ReactElement<{ className?: string }>, { className: "w-5 h-5 md:w-7 md:h-7" })}
                              </div>
                              <div>
                                <p className="text-sm md:text-lg font-black italic text-zinc-950 uppercase tracking-tighter mb-0.5 md:mb-1">{p.name}</p>
                                <p className="text-[9px] md:text-[11px] text-zinc-400 font-bold uppercase tracking-widest italic">{p.desc}</p>
                              </div>
                              <div className="flex items-end justify-between">
                                <p className="text-2xl md:text-3xl font-black italic tracking-tighter text-red-600">${p.price}</p>
                                <span className="text-[8px] md:text-[9px] font-black text-zinc-300 uppercase tracking-widest">{currency}</span>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
                          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setActiveTab("register")} className="px-6 md:px-10 py-4 md:py-5 bg-red-600 text-white rounded-2xl font-black text-sm md:text-lg hover:bg-red-700 transition-all shadow-2xl shadow-red-200 italic tracking-wider inline-flex items-center gap-2 md:gap-3">
                            COMENZAR AHORA <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                          </motion.button>
                        </motion.div>
                      </section>

                      <section className="max-w-6xl mx-auto px-6 space-y-12">
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center space-y-4">
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-xs font-black border border-red-100 italic">
                            <Star className="w-3.5 h-3.5" /> CLIENTES SATISFECHOS
                          </div>
                          <h3 className="max-[400px]:text-3xl text-4xl md:text-5xl font-black italic text-zinc-950 uppercase tracking-tighter">
                            Lo que dicen de <span className="text-red-600">Jandosoft</span>
                          </h3>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {[
                            { name: "Carlos Mendoza", role: "CTO, TechCorp", text: "Migramos toda nuestra infraestructura a Jandosoft. La latencia se redujo un 60% en el primer mes." },
                            { name: "Ana Lucía Reyes", role: "CEO, StartUpBoost", text: "El CRM y el booking engine nos ahorraron 20 horas semanales en gestión. Increíble." },
                            { name: "Diego Fernández", role: "Director IT, GlobalSys", text: "La IA Agent transformó nuestro soporte al cliente. Resolución automática del 80%." },
                          ].map((t, i) => (
                            <motion.div
                              key={t.name}
                              initial={{ opacity: 0, y: 30 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{ delay: i * 0.15 }}
                              className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-zinc-100 shadow-3xl p-4 md:p-8 space-y-3 md:space-y-6"
                            >
                              <div className="flex gap-1 text-amber-400">
                                {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 md:w-4 md:h-4 fill-current" />)}
                              </div>
                              <p className="text-xs md:text-sm text-zinc-600 font-medium leading-relaxed italic">"{t.text}"</p>
                              <div>
                                <p className="text-xs md:text-sm font-black italic text-zinc-950 uppercase tracking-tight">{t.name}</p>
                                <p className="text-[8px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t.role}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </section>

                      <section className="max-w-6xl mx-auto px-6">
                        <motion.div
                          initial={{ opacity: 0, y: 40 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          className="relative overflow-hidden max-[340px]:rounded-3xl rounded-[2rem] md:rounded-[4rem] bg-gradient-to-br from-red-600 via-red-700 to-red-950 max-[340px]:p-5 p-8 md:p-24 text-center"
                        >
                          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_60%)]" />
                          <div className="absolute bottom-0 right-0 max-[340px]:w-[150px] max-[340px]:h-[150px] w-[300px] h-[300px] bg-white/5 rounded-full blur-[80px]" />

                          <div className="relative z-10 space-y-8 max-w-2xl mx-auto">
                            <h3 className="max-[340px]:text-2xl text-4xl md:text-6xl font-black italic text-white leading-[1.1] tracking-tighter">
                              ¿Listo para <span className="text-amber-300">transformar</span> tu negocio?
                            </h3>
                            <p className="max-[340px]:text-sm text-lg text-red-200 font-medium leading-relaxed">
                              Únete a miles de empresas que ya confían en Jandosoft. Sin contratos anuales, cancela cuando quieras.
                            </p>
                            <div className="flex flex-wrap justify-center gap-4">
                              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setActiveTab("register")} className="w-full sm:w-auto px-6 md:px-10 py-4 md:py-5 bg-white text-red-700 rounded-2xl font-black text-sm md:text-lg hover:bg-amber-50 transition-all shadow-2xl italic tracking-wider flex items-center justify-center gap-2 md:gap-3">
                                CREAR CUENTA GRATIS <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                              </motion.button>
                              <motion.button whileTap={{ scale: 0.95 }} onClick={() => isLogged ? setActiveTab("dashboard") : setShowLogin(true)} className="w-full sm:w-auto px-6 md:px-10 py-4 md:py-5 bg-transparent text-white border-2 border-white/20 rounded-2xl font-black text-sm md:text-lg hover:bg-white/10 transition-all italic tracking-wider">
                                {isLogged ? "MI ESPACIO" : "INICIAR SESIÓN"}
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      </section>
                   </motion.div>
                )}

                {activeTab === "register" && (
                   <motion.div 
                      key="register" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className="max-w-md mx-auto max-[400px]:py-10 py-20"
                    >
                       <div className="bg-white max-[400px]:p-4 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-zinc-100 shadow-3xl text-center space-y-6 md:space-y-8">
                          <div className="w-16 h-16 md:w-20 md:h-20 bg-red-50 rounded-2xl md:rounded-3xl mx-auto flex items-center justify-center">
                             <UserPlus className="w-8 h-8 md:w-10 md:h-10 text-red-600" />
                          </div>
                          <div>
                             <h3 className="max-[400px]:text-xl text-2xl md:text-3xl font-black italic text-zinc-950">Crea tu Cuenta</h3>
                            <p className="text-zinc-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px] mt-1 md:mt-2">Acceso completo a la nube Jandosoft</p>
                         </div>
                         <div className="space-y-3 md:space-y-4">
                            <div className="relative group">
                               <UserPlus className="absolute left-3 md:left-4 top-3 md:top-4 w-4 h-4 md:w-5 md:h-5 text-zinc-300 group-focus-within:text-red-500 transition-colors" />
                               <input type="text" placeholder="Nombre completo" value={registerForm.name} onChange={e => setRegisterForm({...registerForm, name: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 pl-10 md:pl-12 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                            </div>
                            <div className="relative group">
                               <Phone className="absolute left-3 md:left-4 top-3 md:top-4 w-4 h-4 md:w-5 md:h-5 text-zinc-300 group-focus-within:text-red-500 transition-colors" />
                               <input type="tel" placeholder="Teléfono" value={registerForm.phone} onChange={e => setRegisterForm({...registerForm, phone: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 pl-10 md:pl-12 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                            </div>
                            <div className="relative group">
                               <ArrowRight className="absolute left-3 md:left-4 top-3 md:top-4 w-4 h-4 md:w-5 md:h-5 text-zinc-300 group-focus-within:text-red-500 transition-colors" />
                               <input type="email" placeholder="Correo electrónico" value={registerForm.email} onChange={e => setRegisterForm({...registerForm, email: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 pl-10 md:pl-12 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                            </div>
                            <div className="relative group">
                               <Lock className="absolute left-3 md:left-4 top-3 md:top-4 w-4 h-4 md:w-5 md:h-5 text-zinc-300 group-focus-within:text-red-500 transition-colors" />
                               <input type="password" placeholder="Contraseña (mín. 6 caracteres)" value={registerForm.password} onChange={e => setRegisterForm({...registerForm, password: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 pl-10 md:pl-12 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                            </div>
                             <motion.button whileTap={{ scale: 0.97 }} onClick={handleRegister} className="w-full py-4 md:py-5 bg-red-600 text-white rounded-2xl font-black text-base md:text-xl flex items-center justify-center gap-2 md:gap-3 hover:bg-red-700 transition-all shadow-xl shadow-red-100 italic">
                                REGISTRARME <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                             </motion.button>
                         </div>
                          <p className="text-[10px] md:text-xs text-zinc-400 font-bold">¿Ya tienes cuenta? <span className="text-red-600 cursor-pointer hover:underline" onClick={() => { if (!isLogged) setShowLogin(true); }}>Inicia sesión</span></p>
                      </div>
                   </motion.div>
                )}


                  {activeTab === "dashboard" && isLogged && (
                     <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 350, damping: 30 }} className="py-4 md:py-10">
                         <ErrorBoundary>
                         <SafeUserDashboard
                           user={user}
                           userStores={userStores}
                           transactions={transactions}
                           onNavigate={setActiveTab}
                           onSelectStore={handleSelectStore}
                            onCreateStore={async (storeData: any) => {
                              try {
                                const res = await apiFetch("/api/stores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(storeData) });
                                if (!res.ok) {
                                  const errData = await res.json().catch(() => ({}));
                                  showToast(errData.error || "Error al crear tienda", "error");
                                  return;
                                }
                                const data = await res.json();
                                if (data.store) { setUserStores((prev: any) => [...prev, data.store]); setActiveStoreId(data.store._id || data.store.id); setActiveTab("business"); showToast("Tienda creada con éxito", "success"); }
                              } catch (e) {
                                showToast("Error de conexión al crear tienda", "error");
                              }
                            }}
                           onEditStore={async (sid: string | number, storeData: any) => {
                              const res = await apiFetch(`/api/stores/${sid}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(storeData) });
                              if (!res.ok) {
                                const errData = await res.json().catch(() => ({}));
                                throw new Error(errData.error || "Error al guardar");
                              }
                              setUserStores((prev: any) => prev.map((s: any) => (s._id === sid || s.id === sid) ? { ...s, ...storeData } : s));
                            }}
                           onDeleteStore={async (sid: string | number) => {
                             await apiFetch(`/api/stores/${sid}`, { method: "DELETE" });
                             setUserStores((prev: any) => prev.filter((s: any) => s._id !== sid && s.id !== sid));
                             if (activeStoreId === sid) setActiveStoreId(null);
                           }}
                         />
                         </ErrorBoundary>
                     </motion.div>
                  )}
{activeTab === "chat" && isLogged && <motion.div key="chat" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 350, damping: 30 }} className="max-[400px]:py-2 py-4 md:py-10"><ChatView maxMessages={getPlanLimits(user.subscription).maxMessages} context={{ email: user.email, plan: user.subscription ?? undefined, storeName: Array.isArray(userStores) && userStores.length > 0 ? userStores[0].name : undefined, industry: Array.isArray(userStores) && userStores.length > 0 ? userStores[0].industry : undefined, storeType: Array.isArray(userStores) && userStores.length > 0 ? userStores[0].type : undefined, description: Array.isArray(userStores) && userStores.length > 0 ? userStores[0].description : undefined }} /></motion.div>}
                  {activeTab === "messages" && isLogged && <motion.div key="messages" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 350, damping: 30 }} className="max-w-4xl mx-auto py-4 md:py-10"><MessagesPanel /></motion.div>}
                  {activeTab === "pricing" && isLogged && <motion.div key="pricing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 350, damping: 30 }} className="py-10"><StoreView currency={currency} products={products} isPremium={isPremium} isLogged={isLogged} userEmail={user.email} onPaymentSuccess={handlePaymentSuccess} /></motion.div>}
                  {activeTab === "admin" && isAdmin && isLogged && <motion.div key="admin" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 350, damping: 30 }}><AdminView currency={currency} setCurrency={setCurrency} products={products} setProducts={setProducts} isPremium={isPremium} setIsPremium={setIsPremium} transactions={transactions} /></motion.div>}
                 {activeTab === "business" && isLogged && activeStore && (
                    <motion.div key="business" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 350, damping: 30 }} className="py-10">
                         <BusinessDashboard userStore={activeStore} userEmail={user.email} storeId={activeStoreId as string | number} planLimits={getPlanLimits(user.subscription)} planExpired={!!(user.subscriptionExpiry && new Date(user.subscriptionExpiry) < new Date())} onNavigateToPricing={() => setActiveTab("pricing")} initialSection={businessSection}
                         onBack={() => { setActiveStoreId(null); setActiveTab("dashboard"); }}
                          onEditStore={async (storeId, data) => {
                            const res = await apiFetch(`/api/stores/${storeId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
                            if (!res.ok) {
                              const errData = await res.json().catch(() => ({}));
                              throw new Error(errData.error || "Error al guardar");
                            }
                            setUserStores(prev => prev.map(s => (s._id === storeId || s.id === storeId) ? { ...s, ...data } : s));
                          }}
                         onDeleteStore={async (storeId) => {
                           await apiFetch(`/api/stores/${storeId}`, { method: "DELETE" });
                           setUserStores(prev => prev.filter(s => s._id !== storeId && s.id !== storeId));
                           setActiveStoreId(null);
                           setActiveTab("dashboard");
                         }}
                         onSaveStore={handleSaveStore}
                       />
                   </motion.div>
                )}


               
                {activeTab === "admin-login" && (
                   <motion.div 
                      key="admin-login" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className="max-w-md mx-auto max-[400px]:py-10 py-20"
                    >
                       <div className="bg-white max-[400px]:p-4 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border-2 md:border-4 border-red-600 shadow-3xl text-center space-y-6 md:space-y-8 relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-full h-1 bg-red-600" />
                         <div className="w-16 h-16 md:w-20 md:h-20 bg-red-600 rounded-2xl md:rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl shadow-red-100">
                            <ShieldCheck className="w-8 h-8 md:w-10 md:h-10" />
                         </div>
                         <div>
                            <h3 className="text-2xl md:text-3xl font-black italic text-zinc-950">Acceso Administrador</h3>
                            <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1 md:mt-2 italic">Panel de Control Corporativo</p>
                         </div>
                         <form onSubmit={handleAdminLogin} className="space-y-3 md:space-y-5">
                            <div className="relative group">
                               <ArrowRight className="absolute left-3 md:left-4 top-3 md:top-4 w-4 h-4 md:w-5 md:h-5 text-zinc-300 group-focus-within:text-red-500 transition-colors" />
                               <input 
                                  type="email" placeholder="admin@jandosoft.com" 
                                  className="w-full bg-zinc-50 p-3 md:p-4 pl-10 md:pl-12 rounded-xl border border-zinc-100 outline-none font-medium text-sm focus:bg-white focus:border-red-200 transition-all" 
                                  value={adminLoginForm.email}
                                  onChange={e => setAdminLoginForm({...adminLoginForm, email: e.target.value})}
                               />
                            </div>
                            <div className="relative group">
                               <Lock className="absolute left-3 md:left-4 top-3 md:top-4 w-4 h-4 md:w-5 md:h-5 text-zinc-300 group-focus-within:text-red-500 transition-colors" />
                               <input 
                                  type="password" placeholder="••••••••" 
                                  className="w-full bg-zinc-50 p-3 md:p-4 pl-10 md:pl-12 rounded-xl border border-zinc-100 outline-none font-medium text-sm focus:bg-white focus:border-red-200 transition-all" 
                                  value={adminLoginForm.password}
                                  onChange={e => setAdminLoginForm({...adminLoginForm, password: e.target.value})}
                               />
                            </div>
                              <motion.button whileTap={{ scale: 0.97 }} type="submit" className="w-full py-4 md:py-5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl font-black text-sm md:text-lg flex items-center justify-center gap-2 md:gap-3 hover:scale-[1.02] transition-all shadow-2xl shadow-red-200 italic tracking-wider">
                                 <ShieldCheck className="w-4 h-4 md:w-5 md:h-5" /> VERIFICAR CREDENCIALES
                              </motion.button>
                         </form>
                         <p className="text-[8px] md:text-[9px] text-zinc-400 font-bold italic">Solo personal autorizado · Jandosoft Enterprise</p>
                      </div>
                   </motion.div>
                )}
            </AnimatePresence>
         </div>

          {/* Bottom Status Bar */}
          <footer className="hidden md:flex h-10 bg-white border-t border-zinc-100 items-center justify-between px-4 md:px-10 text-[9px] font-black uppercase tracking-widest text-zinc-400">
            <div className="flex gap-6">
               <span className="flex items-center gap-1.5"><Globe className="w-3 h-3 text-red-600" /> GLOBAL CLOUD: ACTIVE</span>
               <span className="flex items-center gap-1.5 cursor-pointer hover:text-red-600" onClick={() => isLogged ? setActiveTab("dashboard") : setShowLogin(true)}><Lock className="w-3 h-3" /> {isLogged ? "PANEL" : "LOGIN"}</span>
            </div>
             <Link href="/terminos" className="hover:text-red-600 cursor-pointer">TÉRMINOS</Link>
             <p className="hover:text-red-600 cursor-pointer" onClick={() => setActiveTab("admin-login")}>ADMIN SYSTEM © 2026 JANDOSOFT</p>
         </footer>

         {ToastComponent}
      </main>

      {/* User Login Overlay */}
      <AnimatePresence>
         {showLogin && (
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xl flex items-center justify-center max-[400px]:p-3 p-6"
             >
                <motion.div 
                   initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="w-full max-w-md bg-white rounded-[2rem] md:rounded-[3.5rem] max-[400px]:p-4 p-6 md:p-12 shadow-4xl relative overflow-hidden border border-zinc-100"
                >
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />
                   <button onClick={() => setShowLogin(false)} className="absolute top-4 md:top-8 right-4 md:right-8 w-8 h-8 md:w-10 md:h-10 rounded-xl bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center transition-all"><X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></button>
                   
                   <div className="text-center mb-6 md:mb-10">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-2xl shadow-red-200">
                         <Lock className="w-7 h-7 md:w-9 md:h-9 text-white" />
                      </div>
                      <h3 className="text-2xl md:text-4xl font-black italic text-zinc-950 uppercase tracking-tighter">Bienvenido</h3>
                      <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1 md:mt-2 italic">Accede a tu panel Jandosoft</p>
                   </div>
                   <form onSubmit={handleUserLogin} className="space-y-3 md:space-y-5">
                      <div className="relative group">
                         <ArrowRight className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-zinc-300 group-focus-within:text-red-500 transition-colors" />
                         <input 
                            type="email" placeholder="Correo electrónico" 
                            className="w-full bg-zinc-50 p-3 md:p-5 pl-11 md:pl-14 rounded-xl md:rounded-2xl border border-zinc-100 outline-none font-medium text-sm focus:bg-white focus:border-red-200 focus:ring-2 focus:ring-red-600/10 transition-all" 
                            value={loginForm.email}
                            onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                         />
                      </div>
                      <div className="relative group">
                         <Lock className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-zinc-300 group-focus-within:text-red-500 transition-colors" />
                         <input 
                            type="password" placeholder="Contraseña" 
                            className="w-full bg-zinc-50 p-3 md:p-5 pl-11 md:pl-14 rounded-xl md:rounded-2xl border border-zinc-100 outline-none font-medium text-sm focus:bg-white focus:border-red-200 focus:ring-2 focus:ring-red-600/10 transition-all" 
                            value={loginForm.password}
                            onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                         />
                      </div>
                      <motion.button type="submit" whileTap={{ scale: 0.97 }} className="w-full py-4 md:py-5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl font-black text-base md:text-xl flex items-center justify-center gap-2 md:gap-3 hover:scale-[1.02] transition-all shadow-2xl shadow-red-200 italic tracking-wider uppercase">
                          INGRESAR <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                       </motion.button>
                      <p className="text-center text-[10px] md:text-xs text-zinc-400 font-bold italic">¿No tienes cuenta? <span className="text-red-600 cursor-pointer hover:underline" onClick={() => { setShowLogin(false); setActiveTab("register"); }}>Regístrate</span></p>
                   </form>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
}

function SideNavItem2({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
   return (
      <button onClick={onClick} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group", active ? "bg-white/15 text-white" : "text-red-200 hover:text-white hover:bg-white/5")}>
         <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all", active ? "bg-white text-red-600" : "text-red-200")}>
            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-4 h-4" })}
         </div>
         <span className={cn("text-xs font-black italic uppercase tracking-tight whitespace-nowrap", active ? "opacity-100" : "opacity-70 group-hover:opacity-100")}>{label}</span>
      </button>
   );
}

function MobileNavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label?: string; active: boolean; onClick: () => void }) {
   return (
      <button onClick={onClick} className={cn("flex flex-col items-center justify-center gap-0.5 px-1 max-[340px]:px-0.5 py-1 rounded-xl transition-all min-w-0 flex-1", active ? "text-red-600" : "text-zinc-400 hover:text-zinc-600")}>
         <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center transition-all", active ? "bg-red-50 text-red-600" : "text-current")}>
            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-5 h-5" })}
         </div>
         {label && <span className={cn("text-[8px] max-[340px]:text-[7.5px] font-black uppercase tracking-widest max-[340px]:tracking-normal truncate w-full text-center", active ? "text-red-600" : "text-zinc-400")}>{label}</span>}
      </button>
   );
}

function MobileDrawerGroup({ label, children }: { label: string; children: React.ReactNode }) {
   return (
      <div>
         <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] px-3 mb-1.5 italic">{label}</p>
         <div className="space-y-0.5">{children}</div>
      </div>
   );
}

function MobileDrawerItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
   return (
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all", active ? "bg-red-50 text-red-600 font-black" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 font-bold")}
      >
         <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all", active ? "bg-red-600 text-white shadow-md" : "bg-zinc-100 text-zinc-500")}>
            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-4 h-4" })}
         </div>
         <span className="text-sm italic tracking-tight">{label}</span>
      </motion.button>
   );
}
