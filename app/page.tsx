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
        <p className="text-zinc-400 text-sm">Error loading dashboard</p>
        <button onClick={this.handleRetry} className="px-6 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-all">
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
  ChevronRight,
  Package,
  Star,
  Search,
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  MessageCircle,
  Settings,
  Code,

  BookOpen,
  Megaphone,
  UserCircle,
  User,
  Menu,
  ExternalLink,
  Copy,
  FileSpreadsheet,
  HelpCircle,
  Inbox,
} from "lucide-react";
import ChatView from "@/components/chat/Chat";
import BusinessDashboard from "@/components/business/BusinessDashboard";
import PlansView from "@/components/store/Store";
import MessagesPanel from "@/components/messaging/MessagesPanel";
import SupportPanel from "@/components/support/SupportPanel";
import UserDashboard from "@/components/user/UserDashboard";
import UserProfilePanel from "@/components/user/UserProfilePanel";
import { Toast, useToast } from "@/components/ui/Toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn, slugify } from "@/lib/utils";
import { useTheme } from "@/components/public/ThemeProvider";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getPlanLimits, getPlanLabel } from "@/lib/plans";
import PlansCarousel from "@/components/public/PlansCarousel";
import { LanguageCarousel } from "@/components/ui/LanguageCarousel";
import NotificationPanel from "@/components/ui/NotificationPanel";
import ProductTour from "@/components/ui/ProductTour";

function WebsitesContent({ userStores, user, onSelectStore, onCreateStore, onNavigate }: {
  userStores: any[];
  user: any;
  onSelectStore?: any;
  onCreateStore?: any;
  onNavigate?: any;
}) {
  const { t } = useLanguage();
  const rawStores = Array.isArray(userStores) ? userStores : [];
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", desc: "", type: "tienda" });

  const filteredStores = rawStores.filter((s: any) => {
    const q = searchQuery.toLowerCase();
    return !q || (s.name && s.name.toLowerCase().includes(q)) || (s.industry && s.industry.toLowerCase().includes(q)) || (s.type && s.type.toLowerCase().includes(q));
  });

  const totalProducts = rawStores.reduce((sum, s) => sum + (s.products?.length || 0), 0);
  const totalCustomers = rawStores.reduce((sum, s) => sum + (s.customers?.length || 0), 0);
  const totalOrders = rawStores.reduce((sum, s) => sum + (s.orders?.length || 0), 0);
  const publicStores = rawStores.filter(s => s.isPublic).length;
  const storeCount = rawStores.length;

  const plan = user?.subscription;
  const planExpiry = user?.subscriptionExpiry ? new Date(user.subscriptionExpiry) : null;
  const isExpired = planExpiry && planExpiry < new Date();
  const limits = user?.planLimits || getPlanLimits(plan);
  const planLabel = getPlanLabel(plan);
  const canCreateStore = storeCount < limits.maxStores && !isExpired;

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 max-[400px]:p-4 p-6 md:p-10 max-[400px]:rounded-2xl rounded-3xl text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="w-11 h-11 md:w-14 md:h-14 bg-white/10 rounded-xl flex items-center justify-center border border-white/[0.08] shrink-0">
              <Globe className="w-5 h-5 md:w-7 md:h-7" />
            </div>
            <div>
              <h2 className="text-lg md:text-2xl font-bold tracking-tight">Mis Websites</h2>
              <p className="text-zinc-400 text-xs">{storeCount} sitios · {publicStores} públicos</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { label: "Empresas", value: storeCount, color: "text-red-400" },
              { label: "Productos", value: totalProducts, color: "text-blue-400" },
              { label: "Clientes", value: totalCustomers, color: "text-emerald-400" },
              { label: "Pedidos", value: totalOrders, color: "text-amber-400" },
            ].map(stat => (
              <div key={stat.label} className="bg-white/[0.06] rounded-xl p-3 md:p-4 space-y-1 border border-white/[0.06]">
                <p className="text-[9px] font-medium text-zinc-500 tracking-wide">{stat.label}</p>
                <p className={`text-xl md:text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
          <input type="text" placeholder="Buscar sitio..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-white pl-10 pr-4 py-2.5 rounded-lg border border-zinc-200 outline-none text-xs focus:border-red-300 focus:ring-2 focus:ring-red-500/10 transition-all" />
        </div>
        <button onClick={() => {
          if (canCreateStore) { setShowForm(true); return; }
          if (isExpired) { showToast("Plan vencido. Renueva para crear más sitios.", "error"); onNavigate?.("pricing"); return; }
          showToast(`Límite de ${limits.maxStores} sitios alcanzado`, "info");
          onNavigate?.("pricing");
        }} className={cn("w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-2", canCreateStore ? "bg-red-600 text-white hover:bg-red-700" : "bg-zinc-200 text-zinc-400 cursor-not-allowed")}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          {canCreateStore ? "NUEVA EMPRESA" : `${storeCount}/${limits.maxStores}`}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="w-full max-w-md bg-white rounded-2xl p-6 md:p-8 shadow-xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 p-1.5 hover:bg-zinc-50 rounded-lg"><X className="w-4 h-4 text-zinc-400" /></button>
              <h3 className="text-lg md:text-xl font-bold text-zinc-950 mb-6">Nueva Empresa</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1 block">Nombre</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ej. Mi Empresa" className="w-full bg-zinc-50 p-3 rounded-lg border border-zinc-100 outline-none text-sm focus:bg-white focus:border-red-200 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1 block">Descripción</label>
                  <textarea value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} placeholder="Describe tu sitio..." className="w-full bg-zinc-50 p-3 rounded-lg border border-zinc-100 outline-none text-sm focus:bg-white focus:border-red-200 transition-all resize-none h-24" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1 block">Tipo</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full bg-zinc-50 p-3 rounded-lg border border-zinc-100 outline-none text-sm focus:bg-white focus:border-red-200 transition-all">
                    <option value="tienda">Empresa</option>
                    <option value="blog">Blog</option>
                    <option value="portafolio">Portafolio</option>
                    <option value="landing">Landing Page</option>
                    <option value="servicios">Servicios</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <button onClick={async () => {
                  if (!form.name.trim()) { showToast("El nombre es obligatorio", "info"); return; }
                  const storeData = { name: form.name.trim(), desc: form.desc.trim(), type: form.type };
                  if (onCreateStore) await onCreateStore(storeData);
                  setShowForm(false);
                  setForm({ name: "", desc: "", type: "tienda" });
                }} disabled={!form.name.trim()} className="w-full py-3 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-all shadow-sm disabled:opacity-50">
                  CREAR SITIO
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {filteredStores.length === 0 ? (
        <div className="py-16 md:py-20 text-center italic font-black uppercase tracking-widest text-zinc-200">
          {searchQuery ? `Sin resultados para "${searchQuery}"` : "No tienes sitios web. Crea tu primer sitio."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {filteredStores.map((store: any) => {
            const storeId = store._id || store.id;
            const pCount = store.products?.length || 0;
            const cCount = store.customers?.length || 0;
            const oCount = store.orders?.length || 0;
            const storeUrl = store.slug ? `https://jandosoft.vercel.app/s/${store.slug}` : null;
            return (
              <div key={storeId || Math.random()}
                className="bg-white rounded-2xl border border-zinc-100 p-5 md:p-6 space-y-4 hover:border-red-200 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 md:w-11 md:h-11 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-zinc-950 truncate">{store.name || "Sin nombre"}</h4>
                      <p className="text-xs text-zinc-400 truncate">{store.industry || store.type || "General"}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {store.isPublic && (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-medium">Público</span>
                    )}
                    {store.publicAI && (
                      <span className="px-2 py-0.5 bg-cyan-50 text-cyan-600 rounded-md text-[10px] font-medium">IA</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Prod.", value: pCount, color: "text-blue-600 bg-blue-50" },
                    { label: "Client.", value: cCount, color: "text-emerald-600 bg-emerald-50" },
                    { label: "Pedidos", value: oCount, color: "text-amber-600 bg-amber-50" },
                  ].map(stat => (
                    <div key={stat.label} className={`${stat.color} rounded-lg p-2 text-center`}>
                      <p className="text-sm font-semibold">{stat.value}</p>
                      <p className="text-[10px] font-medium opacity-60">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-1.5">
                  <motion.button whileTap={{ scale: 0.98 }} onClick={() => onSelectStore?.(storeId)}
                    className="w-full py-2.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-all shadow-sm"
                  >
                    ADMINISTRAR
                  </motion.button>
                  {storeUrl && (
                    <div className="flex gap-1.5">
                      <a href={storeUrl} target="_blank" rel="noopener noreferrer"
                        className="flex-1 py-2 bg-zinc-50 text-zinc-600 rounded-lg text-xs font-medium hover:bg-zinc-100 transition-all flex items-center justify-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> VER SITIO
                      </a>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => {
                        navigator.clipboard.writeText(storeUrl);
                        showToast("URL copiada", "success");
                      }} className="py-2 px-3 bg-zinc-50 text-zinc-600 rounded-lg hover:bg-zinc-100 transition-all">
                        <Copy className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SuspendedAccountContent({ handleLogout }: { handleLogout: () => void }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white">
      <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      </div>
      <h1 className="text-2xl font-bold mb-2">Cuenta Suspendida</h1>
      <p className="text-zinc-400 text-sm mb-8 text-center max-w-md">Tu cuenta ha sido suspendida. Comunícate con soporte para más información.</p>
      <button onClick={handleLogout} className="px-8 py-3 bg-white text-zinc-950 rounded-lg text-sm font-semibold hover:bg-zinc-100 transition-all shadow-sm">CERRAR SESIÓN</button>
    </div>
  );
}

const SESSION_KEY = "jandosession";
const SESS_DURATION = 7 * 24 * 60 * 60 * 1000;



function getDaysLeft(expiry: Date | string | null): number | null {
  if (!expiry) return null;
  const d = new Date(expiry);
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

interface Session {
  token: string;
  email: string;
  organizationId: string;
  loggedAt: number;
}

export default function Page() {
  const { t } = useLanguage();
  const { theme, toggle: toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [businessSection, setBusinessSection] = useState<string>("overview");
  const [isLogged, setIsLogged] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [user, setUser] = useState({
    email: "",
    subscription: null as string | null,
    subscriptionExpiry: null as Date | null,
    subscriptionStatus: null as string | null,
    planLimits: null as any,
    isSuspended: false,
    emailVerified: true as boolean,
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
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isNewUser, setIsNewUser] = useState(false);
  const [tourTrigger, setTourTrigger] = useState(0);

  useEffect(() => {
    if (!token) return;
    const fetchUnread = async () => {
      try {
        const res = await apiFetch("/api/conversations/unread-total");
        const data = await res.json();
        setUnreadMessages(data.unread || 0);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, [token]);

  // Auto-advance tour when user navigates to AI section
  useEffect(() => {
    if (activeTab === "business" && businessSection === "ai" && isLogged) {
      window.dispatchEvent(new CustomEvent("tour:action:ai_configured"));
    }
  }, [activeTab, businessSection, isLogged]);

  const handlePaymentSuccess = async (transaction: any) => {
    setTransactions(prev => [transaction, ...prev]);
    const planId = transaction.planId || "";
    const subType = planId || "starter";
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    setUser(prev => ({ ...prev, subscription: subType, subscriptionExpiry: expiry }));
    try {
      const userRes = await apiFetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subType, subscriptionExpiry: expiry.toISOString() }),
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.user) {
          setUser(prev => ({ ...prev, ...userData.user }));
        }
      }
    } catch (e) {
      console.error("Network error updating subscription:", e);
    }
    try {
      const getRes = await apiFetch("/api/user");
      if (getRes.ok) {
        const getData = await getRes.json();
        if (getData.user) {
          setUser(prev => ({ ...prev, ...getData.user }));
        }
      }
    } catch {}
    setActiveTab("dashboard");
    showToast(`Plan ${subType.toUpperCase()} activado correctamente`, "success");
  };
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
      organizationId: typeof session.organizationId === "string" ? session.organizationId : "",
      loggedAt: typeof session.loggedAt === "number" ? session.loggedAt : 0,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionClean));

    syncToken(sessionClean.token);
    setIsLogged(true);
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
      apiFetch("/api/auth/me").then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser((prev) => ({ ...prev, ...data.user }));
          }
        }
      }).catch(() => {});
    } catch {}
  }, []);

  const saveSession = (email: string, sessionToken: string, orgId: string) => {
    const session: Session = {
      token: sessionToken || "",
      email: email || "",
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
        if (data.emailSent === false) {
          showToast(`Registro exitoso, pero no se pudo enviar el correo de verificación: ${data.emailError || "error SMTP"}`, "error");
        } else {
          showToast("Registro exitoso", "success");
        }
        setIsLogged(true);
        setUser(prev => ({ ...prev, email: data.user.email, name: data.user.name, emailVerified: data.user.emailVerified ?? false, organizationId: data.user.organizationId, role: data.user.role }));
        setOrg(data.organization);
        saveSession(data.user.email, data.token, data.user.organizationId);
        setActiveTab("dashboard");
        loadFromAPI(data.user.email);
        setRegisterForm({ name: "", phone: "", email: "", password: "" });
        setIsNewUser(true);
      } else {
        showToast(data.error || "Error al registrar", "error");
      }
    } catch {
      showToast("Error de conexión al registrar", "error");
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
        setShowLogin(false);
        setShowForgotPassword(false);
        setForgotSent(false);
        setForgotError("");
        setActiveTab("dashboard");
        showToast(`Sesión iniciada: ${loginForm.email}`, "success");
        saveSession(data.user.email, data.token, data.user.organizationId || "");
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
    if (!isLogged && !["home", "register", "chat", "pricing"].includes(activeTab)) {
      setActiveTab("home");
    }
  }, [isLogged, activeTab]);

  useEffect(() => {
    if (!isLogged || !token) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser((prev) => ({
              ...prev,
              isSuspended: data.user.isSuspended,
              subscription: data.user.subscription ?? prev.subscription,
              subscriptionExpiry: data.user.subscriptionExpiry ?? prev.subscriptionExpiry,
              subscriptionStatus: data.user.subscriptionStatus ?? prev.subscriptionStatus,
              planLimits: data.user.planLimits ?? prev.planLimits,
            }));
          }
        }
      } catch {}
    }, 15000);
    return () => clearInterval(interval);
  }, [isLogged, token]);

  const handleForgotPassword = async () => {
    if (!forgotEmail) { setForgotError("Ingresa tu correo electrónico"); return; }
    setForgotLoading(true);
    setForgotError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setForgotSent(true);
      } else {
        setForgotError(data.error || "Error al enviar solicitud");
      }
    } catch {
      setForgotError("Error de conexión");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLogged(false);
    syncToken(null);
    setOrg(null);
    setUserStores([]);
    setUser({ email: "", subscription: null, subscriptionExpiry: null, subscriptionStatus: null, planLimits: null, isSuspended: false, emailVerified: true, organizationId: "", role: "member" });
    setActiveTab("home");
    localStorage.removeItem(SESSION_KEY);
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    showToast("Sesión cerrada", "info");
  };

  const handleSaveStore = async (storeId: string | number, data: any): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: "Error al guardar" }));
        showToast(errBody.error || `Error ${res.status}`, "error");
        return false;
      }
      setUserStores(prev => prev.map(s => (s._id === storeId || s.id === storeId) ? { ...s, ...data } : s));
      return true;
    } catch (e) {
      console.error("Error saving store:", e);
      showToast("Error de red al guardar", "error");
      return false;
    }
  };

  const handleSelectStore = (storeId: string | number) => {
    setActiveStoreId(storeId);
    setActiveTab("business");
  };

  if (isLogged && user.isSuspended) {
    return <SuspendedAccountContent handleLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex font-sans text-zinc-950 overflow-x-hidden overflow-y-hidden relative">
      
      <aside className="w-56 hidden md:flex bg-gradient-to-b from-red-600 to-red-800 flex-col py-5 border-r border-red-500/30 z-50 overflow-y-auto shadow-2xl shadow-red-900/30">
         <div className="px-4 mb-5">
            <motion.div 
               whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
               className="cursor-pointer"
               onClick={() => setActiveTab("home")}
            >
               <span className="text-lg font-wallpoet tracking-[0.25em] text-white">JANDOSOFT</span>
            </motion.div>
         </div>
         <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mx-4 mb-4" />
          <div className="px-3 mb-4">
              <LanguageCarousel />
           </div>

          <nav className="flex-1 flex flex-col px-3 space-y-5 overflow-y-auto no-scrollbar">
             {isLogged && (
              <>
                <div>
                  <p className="text-[9px] font-semibold text-red-200 uppercase tracking-[0.15em] px-3 mb-2">{t("section.management")}</p>
                  <SideNavItem2 icon={<LayoutDashboard className="w-4 h-4" />} label={t("nav.mystores")} active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} dataTour="create_store" />
                  <SideNavItem2 icon={<Package className="w-4 h-4" />} label={t("nav.products")} active={activeTab === "business" && businessSection === "products"} onClick={() => { if (activeStoreId) { setBusinessSection("products"); setActiveTab("business"); } else showToast(t("status.select_store_first"), "info"); }} />
                  <SideNavItem2 icon={<Users className="w-4 h-4" />} label={t("nav.customers")} active={activeTab === "business" && businessSection === "customers"} onClick={() => { if (activeStoreId) { setBusinessSection("customers"); setActiveTab("business"); } else showToast(t("status.select_store_first"), "info"); }} />
                  <SideNavItem2 icon={<ShoppingCart className="w-4 h-4" />} label={t("nav.orders")} active={activeTab === "business" && businessSection === "orders"} onClick={() => { if (activeStoreId) { setBusinessSection("orders"); setActiveTab("business"); } else showToast(t("status.select_store_first"), "info"); }} />
                  <SideNavItem2 icon={<FileText className="w-4 h-4" />} label={t("nav.invoices")} active={activeTab === "business" && businessSection === "invoices"} onClick={() => { if (activeStoreId) { setBusinessSection("invoices"); setActiveTab("business"); } else showToast(t("status.select_store_first"), "info"); }} />
                </div>

                <div>
                  <p className="text-[9px] font-semibold text-red-200 uppercase tracking-[0.15em] px-3 mb-2">{t("section.automation")}</p>
                  <SideNavItem2 icon={<Bot className="w-4 h-4" />} label={t("nav.ai")} active={activeTab === "business" && businessSection === "ai"} onClick={() => { if (activeStoreId) { setBusinessSection("ai"); setActiveTab("business"); } else showToast(t("status.select_store_first"), "info"); }} dataTour="ai_agent" />
                  <SideNavItem2 icon={<Zap className="w-4 h-4" />} label={t("nav.automations")} active={activeTab === "business" && businessSection === "automations"} onClick={() => { if (activeStoreId) { setBusinessSection("automations"); setActiveTab("business"); } else showToast(t("status.select_store_first"), "info"); }} />
                  <SideNavItem2 icon={<BookOpen className="w-4 h-4" />} label={t("nav.knowledgebase")} active={activeTab === "business" && businessSection === "knowledgebase"} onClick={() => { if (activeStoreId) { setBusinessSection("knowledgebase"); setActiveTab("business"); } else showToast(t("status.select_store_first"), "info"); }} />
                  <SideNavItem2 icon={<Settings className="w-4 h-4" />} label={t("nav.agentconfig")} active={activeTab === "business" && businessSection === "agentconfig"} onClick={() => { if (activeStoreId) { setBusinessSection("agentconfig"); setActiveTab("business"); } else showToast(t("status.select_store_first"), "info"); }} />
                  <SideNavItem2 icon={<Code className="w-4 h-4" />} label={t("nav.agentinstall")} active={activeTab === "business" && businessSection === "agentinstall"} onClick={() => { if (activeStoreId) { setBusinessSection("agentinstall"); setActiveTab("business"); } else showToast(t("status.select_store_first"), "info"); }} />
                </div>

                <div>
                  <p className="text-[9px] font-semibold text-red-200 uppercase tracking-[0.15em] px-3 mb-2">{t("section.tools")}</p>
                  <SideNavItem2 icon={<FileSpreadsheet className="w-4 h-4" />} label={t("nav.smartforms")} active={activeTab === "business" && businessSection === "smartforms"} onClick={() => { if (activeStoreId) { setBusinessSection("smartforms"); setActiveTab("business"); } else showToast(t("status.select_store_first"), "info"); }} />
                </div>

                <div>
                  <p className="text-[9px] font-semibold text-red-200 uppercase tracking-[0.15em] px-3 mb-2">{t("nav.communications")}</p>
                  <SideNavItem2 icon={<MessageCircle className="w-4 h-4" />} label={t("nav.chat")} active={activeTab === "chat"} onClick={() => setActiveTab("chat")} dataTour="chat" />
                  <SideNavItem2 icon={<Users className="w-4 h-4" />} label={t("nav.messages")} active={activeTab === "messages"} onClick={() => setActiveTab("messages")} badge={unreadMessages} />
                  <SideNavItem2 icon={<Megaphone className="w-4 h-4" />} label={t("nav.campaigns")} active={activeTab === "business" && businessSection === "campaigns"} onClick={() => { if (activeStoreId) { setBusinessSection("campaigns"); setActiveTab("business"); } else showToast(t("status.select_store_first"), "info"); }} />
                  <SideNavItem2 icon={<Inbox className="w-4 h-4" />} label={t("nav.support") || "Soporte"} active={activeTab === "support"} onClick={() => setActiveTab("support")} />
                </div>
                <div>
                  <SideNavItem2 icon={<Package className="w-4 h-4" />} label={user.subscription ? (t("nav.update_plan") || "Actualizar Plan") : t("nav.plans")} active={activeTab === "pricing"} onClick={() => setActiveTab("pricing")} dataTour="explore" />
                </div>

                <div>
                  <p className="text-[9px] font-semibold text-red-200 uppercase tracking-[0.15em] px-3 mb-2">{t("section.company")}</p>
                  <SideNavItem2 icon={<UserCircle className="w-4 h-4" />} label={t("nav.team")} active={activeTab === "business" && businessSection === "team"} onClick={() => { if (activeStoreId) { setBusinessSection("team"); setActiveTab("business"); } else showToast(t("status.select_store_first"), "info"); }} />
                  <SideNavItem2 icon={<Settings className="w-4 h-4" />} label={t("nav.config")} active={activeTab === "business" && businessSection === "orgsettings"} onClick={() => { if (activeStoreId) { setBusinessSection("orgsettings"); setActiveTab("business"); } else showToast(t("status.select_store_first"), "info"); }} />
                  <SideNavItem2 icon={<User className="w-4 h-4" />} label={t("nav.profile")} active={activeTab === "profile"} onClick={() => setActiveTab("profile")} />
                </div>
              </>
            )}
            {!isLogged && (
              <>
                <SideNavItem2 icon={<Sparkles className="w-4 h-4" />} label={t("nav.home")} active={activeTab === "home"} onClick={() => setActiveTab("home")} />
                <SideNavItem2 icon={<Bot className="w-4 h-4" />} label={t("nav.chat")} active={activeTab === "chat"} onClick={() => setActiveTab("chat")} dataTour="chat" />
                <SideNavItem2 icon={<Package className="w-4 h-4" />} label={t("nav.plans")} active={activeTab === "pricing"} onClick={() => setActiveTab("pricing")} dataTour="explore" />
              </>
            )}
         </nav>

          <div className="flex flex-col px-3 mt-4 pt-4 border-t border-red-800/30">
             {isLogged && (
               <SideNavItem2 icon={<LogOut className="w-4 h-4" />} label={t("action.logout_short")} active={false} onClick={handleLogout} />
             )}
            {!isLogged && (
              <SideNavItem2 icon={<UserPlus className="w-4 h-4" />} label={t("action.access")} active={false} onClick={() => setShowLogin(true)} />
            )}
         </div>
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {isLogged ? (
            <>
              <MobileNavItem icon={<LayoutDashboard className="w-5 h-5" />} label={t("nav.mystores")} active={activeTab === "dashboard"} onClick={() => { setMobileDrawerOpen(false); setActiveTab("dashboard"); }} dataTour="create_store" />
              <MobileNavItem icon={<Package className="w-5 h-5" />} label={t("nav.products")} active={activeTab === "business" && businessSection === "products"} onClick={() => { setMobileDrawerOpen(false); if (activeStoreId) { setBusinessSection("products"); setActiveTab("business"); } else showToast(t("status.select_store_first"), "info"); }} />
              <MobileNavItem icon={<Bot className="w-5 h-5" />} label={t("nav.chat")} active={activeTab === "chat"} onClick={() => { setMobileDrawerOpen(false); setActiveTab("chat"); }} dataTour="chat" />
              <MobileNavItem icon={<CreditCard className="w-5 h-5" />} label={user.subscription ? (t("nav.update_plan") || "Actualizar") : t("nav.plans")} active={activeTab === "pricing"} onClick={() => { setMobileDrawerOpen(false); setActiveTab("pricing"); }} />
              <MobileNavItem icon={<Menu className="w-5 h-5" />} label={t("nav.menu")} active={mobileDrawerOpen} onClick={() => setMobileDrawerOpen(true)} />
            </>
          ) : (
            <>
              <MobileNavItem icon={<Sparkles className="w-5 h-5" />} label={t("nav.home")} active={activeTab === "home"} onClick={() => { setMobileDrawerOpen(false); setActiveTab("home"); }} />
              <MobileNavItem icon={<Bot className="w-5 h-5" />} label={t("nav.chat")} active={activeTab === "chat"} onClick={() => { setMobileDrawerOpen(false); setActiveTab("chat"); }} dataTour="chat" />
              <MobileNavItem icon={<Package className="w-5 h-5" />} label={t("nav.plans")} active={activeTab === "pricing"} onClick={() => { setMobileDrawerOpen(false); setActiveTab("pricing"); }} dataTour="explore" />
              <MobileNavItem icon={<UserPlus className="w-5 h-5" />} label={t("action.access")} active={false} onClick={() => setShowLogin(true)} />
            </>
          )}
        </div>
      </nav>

      {/* Mobile floating help button */}
      {isLogged && (
        <button
          onClick={() => setTourTrigger(n => n + 1)}
          className="md:hidden fixed bottom-20 right-3 z-40 w-9 h-9 rounded-full bg-zinc-800/90 backdrop-blur text-zinc-400 hover:text-white hover:bg-zinc-700 flex items-center justify-center shadow-lg transition-all"
          title="Tutorial"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      )}

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
                  <span className="text-sm font-wallpoet tracking-[0.2em] text-red-600">JANDOSOFT</span>
                  <div className="flex items-center gap-2">
                    <LanguageCarousel />
                    <button
                      onClick={toggleTheme}
                      className="w-8 h-8 rounded-lg bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center"
                    >
                      {theme === "dark" ? (
                        <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      )}
                    </button>
                    {isLogged && (
                      <button
                        onClick={() => { setTourTrigger(n => n + 1); setMobileDrawerOpen(false); }}
                        className="w-8 h-8 rounded-lg bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center"
                        aria-label="Ayuda / Tutorial"
                        title="Tutorial de bienvenida"
                      >
                        <HelpCircle className="w-4 h-4 text-zinc-500" />
                      </button>
                    )}
                    <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setMobileDrawerOpen(false)}
                    className="w-8 h-8 rounded-lg bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-zinc-400" />
                  </motion.button>
                </div>
                  </div>

              <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
                {isLogged ? (
                  <>
                    <MobileDrawerGroup label={t("section.management")}>
                      <MobileDrawerItem icon={<LayoutDashboard className="w-4 h-4" />} label={t("nav.mystores")} active={activeTab === "dashboard"} onClick={() => { setMobileDrawerOpen(false); setActiveTab("dashboard"); }} dataTour="create_store" />
                      <MobileDrawerItem icon={<Package className="w-4 h-4" />} label={t("nav.products")} active={activeTab === "business" && businessSection === "products"} onClick={() => { setMobileDrawerOpen(false); if (activeStoreId) { setBusinessSection("products"); setActiveTab("business"); } else showToast(t("status.select_store_first"), "info"); }} />
                      <MobileDrawerItem icon={<Users className="w-4 h-4" />} label={t("nav.customers")} active={activeTab === "business" && businessSection === "customers"} onClick={() => { setMobileDrawerOpen(false); if (activeStoreId) { setBusinessSection("customers"); setActiveTab("business"); } else showToast(t("status.select_store_first"), "info"); }} />
                      <MobileDrawerItem icon={<ShoppingCart className="w-4 h-4" />} label={t("nav.orders")} active={activeTab === "business" && businessSection === "orders"} onClick={() => { setMobileDrawerOpen(false); if (activeStoreId) { setBusinessSection("orders"); setActiveTab("business"); } else showToast(t("status.select_store_first"), "info"); }} />
                      <MobileDrawerItem icon={<FileText className="w-4 h-4" />} label={t("nav.invoices")} active={activeTab === "business" && businessSection === "invoices"} onClick={() => { setMobileDrawerOpen(false); if (activeStoreId) { setBusinessSection("invoices"); setActiveTab("business"); } else showToast(t("status.select_store_first"), "info"); }} />
                    </MobileDrawerGroup>

                    <MobileDrawerGroup label={t("section.automation")}>
                      <MobileDrawerItem icon={<Bot className="w-4 h-4" />} label={t("nav.ai")} active={activeTab === "business" && businessSection === "ai"} onClick={() => { setMobileDrawerOpen(false); if (activeStoreId) { setBusinessSection("ai"); setActiveTab("business"); } else showToast(t("status.select_store_first"), "info"); }} dataTour="ai_agent" />
                      <MobileDrawerItem icon={<Zap className="w-4 h-4" />} label={t("nav.automations")} active={activeTab === "business" && businessSection === "automations"} onClick={() => { setMobileDrawerOpen(false); if (activeStoreId) { setBusinessSection("automations"); setActiveTab("business"); } else showToast(t("status.select_store_first"), "info"); }} />
                      <MobileDrawerItem icon={<BookOpen className="w-4 h-4" />} label={t("nav.knowledgebase")} active={activeTab === "business" && businessSection === "knowledgebase"} onClick={() => { setMobileDrawerOpen(false); if (activeStoreId) { setBusinessSection("knowledgebase"); setActiveTab("business"); } else showToast(t("status.select_store_first"), "info"); }} />
                      <MobileDrawerItem icon={<Settings className="w-4 h-4" />} label={t("nav.agentconfig")} active={activeTab === "business" && businessSection === "agentconfig"} onClick={() => { setMobileDrawerOpen(false); if (activeStoreId) { setBusinessSection("agentconfig"); setActiveTab("business"); } else showToast(t("status.select_store_first"), "info"); }} />
                      <MobileDrawerItem icon={<Code className="w-4 h-4" />} label={t("nav.agentinstall")} active={activeTab === "business" && businessSection === "agentinstall"} onClick={() => { setMobileDrawerOpen(false); if (activeStoreId) { setBusinessSection("agentinstall"); setActiveTab("business"); } else showToast(t("status.select_store_first"), "info"); }} />
                    </MobileDrawerGroup>

                    <MobileDrawerGroup label={t("section.tools")}>
                      <MobileDrawerItem icon={<FileSpreadsheet className="w-4 h-4" />} label={t("nav.smartforms")} active={activeTab === "business" && businessSection === "smartforms"} onClick={() => { setMobileDrawerOpen(false); if (activeStoreId) { setBusinessSection("smartforms"); setActiveTab("business"); } else showToast(t("status.select_store_first"), "info"); }} />
                    </MobileDrawerGroup>

                    <MobileDrawerGroup label={t("section.communications")}>
                      <MobileDrawerItem icon={<MessageCircle className="w-4 h-4" />} label={t("nav.chat")} active={activeTab === "chat"} onClick={() => { setMobileDrawerOpen(false); setActiveTab("chat"); }} dataTour="chat" />
                      <MobileDrawerItem icon={<Users className="w-4 h-4" />} label={t("nav.messages")} active={activeTab === "messages"} onClick={() => { setMobileDrawerOpen(false); setActiveTab("messages"); }} />
                      <MobileDrawerItem icon={<Megaphone className="w-4 h-4" />} label={t("nav.campaigns")} active={activeTab === "business" && businessSection === "campaigns"} onClick={() => { setMobileDrawerOpen(false); if (activeStoreId) { setBusinessSection("campaigns"); setActiveTab("business"); } else showToast(t("status.select_store_first"), "info"); }} />
                    </MobileDrawerGroup>

                    <MobileDrawerGroup label={t("section.company")}>
                      <MobileDrawerItem icon={<UserCircle className="w-4 h-4" />} label={t("nav.team")} active={activeTab === "business" && businessSection === "team"} onClick={() => { setMobileDrawerOpen(false); if (activeStoreId) { setBusinessSection("team"); setActiveTab("business"); } else showToast(t("status.select_store_first"), "info"); }} />
                      <MobileDrawerItem icon={<Settings className="w-4 h-4" />} label={t("nav.config")} active={activeTab === "business" && businessSection === "orgsettings"} onClick={() => { setMobileDrawerOpen(false); if (activeStoreId) { setBusinessSection("orgsettings"); setActiveTab("business"); } else showToast(t("status.select_store_first"), "info"); }} />
                      <MobileDrawerItem icon={<User className="w-4 h-4" />} label={t("nav.profile")} active={activeTab === "profile"} onClick={() => { setMobileDrawerOpen(false); setActiveTab("profile"); }} />
                    </MobileDrawerGroup>
                    <MobileDrawerItem icon={<Package className="w-4 h-4" />} label={user.subscription ? (t("nav.update_plan") || "Actualizar Plan") : t("nav.plans")} active={activeTab === "pricing"} onClick={() => { setMobileDrawerOpen(false); setActiveTab("pricing"); }} dataTour="explore" />
                  </>
                ) : (
                  <>
                    <MobileDrawerItem icon={<Sparkles className="w-4 h-4" />} label={t("nav.home")} active={activeTab === "home"} onClick={() => { setMobileDrawerOpen(false); setActiveTab("home"); }} />
                    <MobileDrawerItem icon={<Bot className="w-4 h-4" />} label={t("nav.chat")} active={activeTab === "chat"} onClick={() => { setMobileDrawerOpen(false); setActiveTab("chat"); }} />
                    <MobileDrawerItem icon={<Package className="w-4 h-4" />} label={t("nav.plans")} active={activeTab === "pricing"} onClick={() => { setMobileDrawerOpen(false); setActiveTab("pricing"); }} dataTour="explore" />
                  </>
                )}
              </nav>

              <div className="border-t border-zinc-100 px-3 py-4 shrink-0">
                 {isLogged ? (
                   <div className="space-y-1">
                     <MobileDrawerItem icon={<LogOut className="w-4 h-4" />} label={t("action.logout")} active={false} onClick={() => { setMobileDrawerOpen(false); handleLogout(); }} />
                   </div>
                 ) : (
                  <MobileDrawerItem icon={<UserPlus className="w-4 h-4" />} label={t("action.login")} active={false} onClick={() => { setMobileDrawerOpen(false); setShowLogin(true); }} />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 bg-zinc-50 relative flex flex-col overflow-hidden pb-20 md:pb-0">
          <HeaderNav activeTab={activeTab} isLogged={isLogged} setActiveTab={setActiveTab} setShowLogin={setShowLogin} setMobileDrawerOpen={setMobileDrawerOpen} token={token} onRestartTour={() => setTourTrigger(n => n + 1)} onNavigateNotification={(section) => { if (activeStoreId) { setBusinessSection(section); setActiveTab("business"); } else showToast(t("status.select_store_first") || "Selecciona una empresa primero", "info"); }} />

          <div className="flex-1 overflow-y-auto p-4 max-[400px]:p-2.5 max-[340px]:p-1.5 md:p-8 relative">
             <AnimatePresence mode="wait">
                  {activeTab === "home" && <HomeTabContent setActiveTab={setActiveTab} isLogged={isLogged} setShowLogin={setShowLogin} />}

                {activeTab === "register" && <RegisterPanelContent registerForm={registerForm} setRegisterForm={setRegisterForm} handleRegister={handleRegister} setShowLogin={setShowLogin} setActiveTab={setActiveTab} isLogged={isLogged} />}


                  {activeTab === "dashboard" && isLogged && (
                     <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 350, damping: 30 }} className="py-4 md:py-10">
                         <ErrorBoundary>
                         <UserDashboard
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
                                  showToast(errData.error || "Error al crear empresa", "error");
                                  return;
                                }
                                const data = await res.json();
                                if (data.store) { setUserStores((prev: any) => [...prev, data.store]); setActiveStoreId(data.store._id || data.store.id); setActiveTab("business"); showToast("Empresa creada con éxito", "success"); window.dispatchEvent(new CustomEvent("tour:action:store_created")); }
                              } catch (e) {
                                showToast("Error de conexión al crear empresa", "error");
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
                              const res = await apiFetch(`/api/stores/${sid}`, { method: "DELETE" });
                              if (!res.ok) {
                                const errData = await res.json().catch(() => ({}));
                                showToast(errData.error || "Error al eliminar empresa", "error");
                                return;
                              }
                              setUserStores((prev: any) => prev.filter((s: any) => s._id !== sid && s.id !== sid));
                              if (activeStoreId === sid) setActiveStoreId(null);
                            }}
                         />
                         </ErrorBoundary>
                     </motion.div>
                  )}
                   {activeTab === "profile" && isLogged && (
                    <UserProfilePanel
                      user={user}
                      apiFetch={apiFetch}
                      showToast={showToast}
                      onLogout={handleLogout}
                    />
                  )}
                  {activeTab === "support" && isLogged && (
                    <motion.div key="support" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 350, damping: 30 }} className="max-[400px]:py-2 py-4 md:py-10">
                      <SupportPanel />
                    </motion.div>
                  )}
{activeTab === "chat" && <motion.div key="chat" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 350, damping: 30 }} className="max-[400px]:py-2 py-4 md:py-10">{isLogged ? <ChatView maxMessages={(user.planLimits || getPlanLimits(user.subscription)).maxMessages} context={{ email: user.email, plan: user.subscription ?? undefined, storeName: Array.isArray(userStores) && userStores.length > 0 ? userStores[0].name : undefined, industry: Array.isArray(userStores) && userStores.length > 0 ? userStores[0].industry : undefined, storeType: Array.isArray(userStores) && userStores.length > 0 ? userStores[0].type : undefined, description: Array.isArray(userStores) && userStores.length > 0 ? userStores[0].description : undefined }} userStores={userStores} onStoresChange={(stores) => setUserStores(stores)} /> : <ChatView />}</motion.div>}
                  {activeTab === "messages" && isLogged && <motion.div key="messages" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 350, damping: 30 }} className="max-w-4xl mx-auto py-4 md:py-10"><MessagesPanel /></motion.div>}
                  {activeTab === "pricing" && <motion.div key="pricing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 350, damping: 30 }} className="py-10"><PlansView currency={currency} isPremium={isPremium} isLogged={isLogged} userEmail={user.email} onPaymentSuccess={handlePaymentSuccess} onLoginRequest={() => setShowLogin(true)} /></motion.div>}
                 {activeTab === "business" && isLogged && activeStore && (
                    <motion.div key="business" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 350, damping: 30 }} className="py-10">
                         <BusinessDashboard userStore={activeStore} userEmail={user.email} storeId={activeStoreId as string | number} planLimits={user.planLimits || getPlanLimits(user.subscription)} planExpired={!!(user.subscriptionExpiry && new Date(user.subscriptionExpiry) < new Date())} onNavigateToPricing={() => setActiveTab("pricing")} initialSection={businessSection}
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
                            const res = await apiFetch(`/api/stores/${storeId}`, { method: "DELETE" });
                            if (!res.ok) {
                              const errData = await res.json().catch(() => ({}));
                              showToast(errData.error || "Error al eliminar empresa", "error");
                              return;
                            }
                            setUserStores(prev => prev.filter(s => s._id !== storeId && s.id !== storeId));
                            setActiveStoreId(null);
                            setActiveTab("dashboard");
                          }}
                         onSaveStore={handleSaveStore}
                       />
                   </motion.div>
                )}


             </AnimatePresence>
         </div>

          <StatusBarFooter isLogged={isLogged} setShowLogin={setShowLogin} setActiveTab={setActiveTab} />

         {ToastComponent}
          <ProductTour isNewUser={isNewUser} emailVerified={user.emailVerified} manualTrigger={tourTrigger} />
      </main>

      {showLogin && !showForgotPassword && <LoginPanelContent loginForm={loginForm} setLoginForm={setLoginForm} handleUserLogin={handleUserLogin} setShowLogin={setShowLogin} setActiveTab={setActiveTab} setShowForgotPassword={setShowForgotPassword} setForgotEmail={setForgotEmail} />}
      {showLogin && showForgotPassword && <ForgotPasswordPanelContent forgotEmail={forgotEmail} setForgotEmail={setForgotEmail} forgotSent={forgotSent} setForgotSent={setForgotSent} forgotLoading={forgotLoading} forgotError={forgotError} handleForgotPassword={handleForgotPassword} setShowLogin={setShowLogin} setShowForgotPassword={setShowForgotPassword} setForgotError={setForgotError} />}
    </div>
  );
}

function SideNavItem2({ icon, label, active, onClick, badge, dataTour }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, badge?: number; dataTour?: string }) {
   return (
      <button onClick={onClick} data-tour={dataTour} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group", active ? "bg-red-800/60 text-white" : "text-red-200 hover:text-white hover:bg-red-800/40")}>
         <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all relative", active ? "bg-white text-red-600" : "bg-red-800/40 text-red-200")}>
            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-4 h-4" })}
            {badge ? <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold min-w-[14px] h-[14px] flex items-center justify-center rounded-full px-0.5">{badge > 99 ? "99+" : badge}</span> : null}
         </div>
         <span className={cn("text-xs font-semibold tracking-tight whitespace-nowrap", active ? "opacity-100" : "opacity-80 group-hover:opacity-100")}>{label}</span>
      </button>
   );
}

function MobileNavItem({ icon, label, active, onClick, dataTour }: { icon: React.ReactNode; label?: string; active: boolean; onClick: () => void; dataTour?: string }) {
   return (
      <button onClick={onClick} data-tour={dataTour} className={cn("flex flex-col items-center justify-center gap-0.5 px-1 max-[340px]:px-0.5 py-1 rounded-lg transition-all min-w-0 flex-1", active ? "text-red-500" : "text-zinc-500 hover:text-zinc-300")}>
         <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all", active ? "bg-red-500/10 text-red-500" : "text-current")}>
            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-5 h-5" })}
         </div>
         {label && <span className={cn("text-[8px] font-semibold tracking-wide truncate w-full text-center", active ? "text-red-500" : "text-zinc-500")}>{label}</span>}
      </button>
   );
}

function MobileDrawerGroup({ label, children }: { label: string; children: React.ReactNode }) {
   return (
      <div>
         <p className="text-[9px] font-semibold text-zinc-400 uppercase tracking-[0.15em] px-3 mb-1.5">{label}</p>
         <div className="space-y-0.5">{children}</div>
      </div>
   );
}

function MobileDrawerItem({ icon, label, active, onClick, dataTour }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; dataTour?: string }) {
   return (
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        data-tour={dataTour}
        className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all", active ? "bg-red-50 text-red-600 font-semibold" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900")}
      >
         <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all", active ? "bg-red-600 text-white shadow-sm" : "bg-zinc-100 text-zinc-500")}>
            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-4 h-4" })}
         </div>
         <span className="text-sm">{label}</span>
      </motion.button>
   );
}

type TabType = "home" | "register" | "chat" | "dashboard" | "business" | "pricing" | "messages" | "profile" | "support";

function HeaderNav({ activeTab, isLogged, setActiveTab, setShowLogin, setMobileDrawerOpen, token, onRestartTour, onNavigateNotification }: {
  activeTab: TabType; isLogged: boolean; setActiveTab: React.Dispatch<React.SetStateAction<TabType>>; setShowLogin: (v: boolean) => void; setMobileDrawerOpen: (v: boolean) => void; token: string | null; onRestartTour: () => void; onNavigateNotification?: (section: string) => void;
}) {
  const { t } = useLanguage();
  const { theme, toggle: toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return (
    <header className="h-16 md:h-20 w-full bg-white/90 backdrop-blur-xl border-b border-zinc-100 flex items-center justify-between px-4 md:px-10 z-40">
      <div className="flex items-center gap-2 md:gap-4">
        <span className="text-base md:text-lg font-wallpoet tracking-[0.2em] text-red-600">JANDOSOFT</span>
        <div className="h-5 w-px bg-zinc-200 hidden md:block" />
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <LanguageCarousel />
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center transition-all"
          aria-label={mounted ? (theme === "dark" ? "Modo claro" : "Modo oscuro") : "Modo oscuro"}
        >
          {mounted && theme === "dark" ? (
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
        {isLogged && (
          <>
            <button
              onClick={onRestartTour}
              className="w-8 h-8 rounded-lg bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center transition-all"
              aria-label="Ayuda / Tutorial"
              title="Tutorial de bienvenida"
            >
              <HelpCircle className="w-4 h-4 text-zinc-500" />
            </button>
            <NotificationPanel token={token} onNavigate={onNavigateNotification} />
          </>
        )}
        {!isLogged && activeTab !== "register" && (
          <>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setActiveTab("chat")}
              className="px-3 md:px-4 py-2 md:py-2.5 bg-zinc-50 text-zinc-600 rounded-lg text-[10px] md:text-xs font-medium hover:bg-zinc-100 transition-all flex items-center gap-1.5"
            >
              <Bot className="w-3.5 h-3.5" /> {t("nav.chat")}
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setActiveTab("register")}
              className="px-4 md:px-5 py-2 md:py-2.5 bg-red-600 text-white rounded-lg text-[10px] md:text-xs font-semibold hover:bg-red-700 transition-all shadow-sm flex items-center gap-1.5"
            >
              {t("action.start")} <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </>
        )}
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMobileDrawerOpen(true)}
          className="md:hidden w-9 h-9 rounded-lg bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center transition-colors"
        >
          <Menu className="w-5 h-5 text-zinc-600" />
        </motion.button>
      </div>
    </header>
  );
}

function HomeTabContent({ setActiveTab, isLogged, setShowLogin }: {
  setActiveTab: React.Dispatch<React.SetStateAction<TabType>>; isLogged: boolean; setShowLogin: (v: boolean) => void;
}) {
  const { t } = useLanguage();
  return (
    <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="space-y-16 md:space-y-32 pb-16 md:pb-32"
    >
      <section className="relative overflow-hidden rounded-3xl md:rounded-[3rem] bg-gradient-to-br from-zinc-950 via-zinc-900 to-neutral-950 max-[400px]:p-5 p-8 md:p-16 lg:p-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(220,38,38,0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(220,38,38,0.08),transparent_50%)]" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[150px]" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/[0.08] text-white rounded-full text-xs font-medium border border-white/[0.1] backdrop-blur-md tracking-wide">
            <Zap className="w-3 h-3 text-red-400" /> {t("landing.badge")}
          </motion.div>

          <motion.h2 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.1] tracking-tight text-white">
            {t("landing.hero_title")} <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-orange-400">{t("landing.hero_title_highlight")}</span>
            <br/>{t("landing.hero_subtitle")}
          </motion.h2>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-sm md:text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            {t("landing.hero_desc")}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => setActiveTab("register")} className="w-full sm:w-auto px-8 py-3.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all shadow-lg shadow-red-600/25 flex items-center justify-center gap-2">
              {t("landing.cta_start")} <ArrowRight className="w-4 h-4" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => isLogged ? setActiveTab("dashboard") : setShowLogin(true)} className="w-full sm:w-auto px-8 py-3.5 bg-white/[0.08] text-white border border-white/[0.15] rounded-xl text-sm font-medium hover:bg-white/[0.12] transition-all backdrop-blur-md">
              {isLogged ? t("user.my_space") : t("action.login")}
            </motion.button>
          </motion.div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid grid-cols-2 md:grid-cols-4 max-[400px]:gap-3 gap-5">
          {[
            { value: "10K+", label: t("landing.stat_users") },
            { value: "99.9%", label: t("landing.stat_uptime") },
            { value: "150+", label: t("landing.stat_countries") },
            { value: "4.9", label: t("landing.stat_rating") },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 md:p-8 text-center space-y-1.5 hover:border-red-200 hover:shadow-md transition-all"
            >
              <p className="text-3xl md:text-5xl font-bold text-red-600 tracking-tight">{stat.value}</p>
              <p className="text-xs font-medium text-zinc-400">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="max-w-6xl mx-auto px-6 space-y-12">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-50 text-red-600 rounded-full text-xs font-medium border border-red-100">
            <Zap className="w-3.5 h-3.5" /> {t("landing.ecosystem_badge")}
          </div>
          <h3 className="text-3xl md:text-5xl font-bold text-zinc-950 tracking-tight">
            {t("landing.ecosystem_title")} <span className="text-red-600">{t("landing.ecosystem_title_highlight")}</span>
          </h3>
          <p className="text-sm md:text-base text-zinc-500 max-w-xl mx-auto">
            {t("landing.ecosystem_desc")}
          </p>
        </motion.div>

        <div className="max-w-sm mx-auto">
          <motion.button initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} whileHover={{ y: -4 }}
            onClick={() => setActiveTab("chat")}
            className="w-full bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 md:p-8 text-left space-y-4 group hover:shadow-md hover:border-red-200 transition-all text-start"
          >
            <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <Bot className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            <div>
              <h4 className="text-lg md:text-xl font-semibold text-zinc-950 tracking-tight mb-1">{t("nav.ai")}</h4>
              <p className="text-sm text-zinc-500 leading-relaxed">{t("landing.ai_desc")}</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
              {t("action.explore")} <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </motion.button>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 space-y-12">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-50 text-red-600 rounded-full text-xs font-medium border border-red-100">
            <Package className="w-3.5 h-3.5" /> {t("landing.plans_badge")}
          </div>
          <h3 className="text-3xl md:text-5xl font-bold text-zinc-950 tracking-tight">
            {t("landing.plans_title")} <span className="text-red-600">{t("landing.plans_title_highlight")}</span>
          </h3>
          <p className="text-sm md:text-base text-zinc-500 max-w-xl mx-auto">
            {t("landing.plans_desc")}
          </p>
        </motion.div>

        <PlansCarousel onSelectPlan={() => setActiveTab("register")} />

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => setActiveTab("register")} className="px-8 py-3.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all shadow-lg inline-flex items-center gap-2">
            {t("landing.cta_start")} <ChevronRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </section>

      <section className="max-w-6xl mx-auto px-6 space-y-12">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-50 text-red-600 rounded-full text-xs font-medium border border-red-100">
            <Star className="w-3.5 h-3.5" /> {t("landing.testimonials_badge")}
          </div>
          <h3 className="text-3xl md:text-5xl font-bold text-zinc-950 tracking-tight">
            {t("landing.testimonials_title")} <span className="text-red-600">{t("landing.testimonials_title_highlight")}</span>
          </h3>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "Carlos Mendoza", role: "CTO, TechCorp", text: t("landing.testimonial_1") },
            { name: "Ana Lucía Reyes", role: "CEO, StartUpBoost", text: t("landing.testimonial_2") },
            { name: "Diego Fernández", role: "Director IT, GlobalSys", text: t("landing.testimonial_3") },
          ].map((tst, i) => (
            <motion.div key={tst.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
              className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 md:p-8 space-y-4 hover:shadow-md hover:border-red-200 transition-all"
            >
              <div className="flex gap-1 text-amber-400">
                {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-current" />)}
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed">&ldquo;{tst.text}&rdquo;</p>
              <div>
                <p className="text-sm font-semibold text-zinc-950">{tst.name}</p>
                <p className="text-xs text-zinc-400">{tst.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 via-red-700 to-zinc-900 max-[400px]:p-5 p-8 md:p-20 text-center"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />
          <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-white/5 rounded-full blur-[80px]" />

          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <h3 className="text-3xl md:text-5xl font-bold text-white leading-[1.15] tracking-tight">
              {t("landing.cta_title")} <span className="text-amber-300">{t("landing.cta_title_highlight")}</span> {t("landing.hero_subtitle")}?
            </h3>
            <p className="text-base md:text-lg text-red-200 leading-relaxed">
              {t("landing.cta_desc")}
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <motion.button whileTap={{ scale: 0.98 }} onClick={() => setActiveTab("register")} className="w-full sm:w-auto px-8 py-3.5 bg-white text-red-700 rounded-xl text-sm font-semibold hover:bg-zinc-50 transition-all shadow-lg flex items-center justify-center gap-2">
                {t("landing.cta_free")} <ArrowRight className="w-4 h-4" />
              </motion.button>
              <motion.button whileTap={{ scale: 0.98 }} onClick={() => isLogged ? setActiveTab("dashboard") : setShowLogin(true)} className="w-full sm:w-auto px-8 py-3.5 bg-transparent text-white border border-white/20 rounded-xl text-sm font-medium hover:bg-white/10 transition-all">
                {isLogged ? t("user.my_space") : t("action.login")}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </section>
    </motion.div>
  );
}

function RegisterPanelContent({ registerForm, setRegisterForm, handleRegister, setShowLogin, setActiveTab, isLogged }: {
  registerForm: any; setRegisterForm: any; handleRegister: () => void; setShowLogin: (v: boolean) => void; setActiveTab: React.Dispatch<React.SetStateAction<TabType>>; isLogged: boolean;
}) {
  const { t } = useLanguage();
  return (
    <motion.div key="register" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
      className="max-w-md mx-auto max-[400px]:py-10 py-20"
    >
      <div className="bg-white max-[400px]:p-5 p-8 md:p-10 rounded-2xl border border-zinc-100 shadow-sm text-center space-y-6">
        <div className="w-14 h-14 md:w-16 md:h-16 bg-red-50 rounded-xl mx-auto flex items-center justify-center">
          <UserPlus className="w-7 h-7 md:w-8 md:h-8 text-red-600" />
        </div>
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-zinc-950">{t("register.title")}</h3>
          <p className="text-zinc-400 text-xs mt-1">{t("register.subtitle")}</p>
        </div>
        <div className="space-y-3">
          <div className="relative group">
            <UserPlus className="absolute left-3 top-3 w-4 h-4 text-zinc-300 group-focus-within:text-red-500 transition-colors" />
            <input type="text" placeholder={t("register.name_placeholder")} value={registerForm.name} onChange={e => setRegisterForm({...registerForm, name: e.target.value})} className="w-full bg-zinc-50 p-3 pl-9 rounded-lg border border-zinc-100 outline-none text-sm focus:bg-white focus:border-red-200 transition-all" />
          </div>
          <div className="relative group">
            <Phone className="absolute left-3 top-3 w-4 h-4 text-zinc-300 group-focus-within:text-red-500 transition-colors" />
            <input type="tel" placeholder={t("form.phone")} value={registerForm.phone} onChange={e => setRegisterForm({...registerForm, phone: e.target.value})} className="w-full bg-zinc-50 p-3 pl-9 rounded-lg border border-zinc-100 outline-none text-sm focus:bg-white focus:border-red-200 transition-all" />
          </div>
          <div className="relative group">
            <ArrowRight className="absolute left-3 top-3 w-4 h-4 text-zinc-300 group-focus-within:text-red-500 transition-colors" />
            <input type="email" placeholder={t("form.email")} value={registerForm.email} onChange={e => setRegisterForm({...registerForm, email: e.target.value})} className="w-full bg-zinc-50 p-3 pl-9 rounded-lg border border-zinc-100 outline-none text-sm focus:bg-white focus:border-red-200 transition-all" />
          </div>
          <div className="relative group">
            <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-300 group-focus-within:text-red-500 transition-colors" />
            <input type="password" placeholder={t("register.password_placeholder")} value={registerForm.password} onChange={e => setRegisterForm({...registerForm, password: e.target.value})} className="w-full bg-zinc-50 p-3 pl-9 rounded-lg border border-zinc-100 outline-none text-sm focus:bg-white focus:border-red-200 transition-all" />
          </div>
          <motion.button whileTap={{ scale: 0.98 }} onClick={handleRegister} className="w-full py-3 bg-red-600 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-sm">
            {t("action.register")} <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
        <p className="text-xs text-zinc-400">{t("register.has_account")} <span className="text-red-600 cursor-pointer hover:underline font-medium" onClick={() => { if (!isLogged) setShowLogin(true); }}>{t("action.login")}</span></p>
      </div>
    </motion.div>
  );
}

function StatusBarFooter({ isLogged, setShowLogin, setActiveTab }: {
  isLogged: boolean; setShowLogin: (v: boolean) => void; setActiveTab: React.Dispatch<React.SetStateAction<TabType>>;
}) {
  const { t } = useLanguage();
  return (
    <footer className="hidden md:flex h-10 bg-white border-t border-zinc-100 items-center justify-between px-4 md:px-10 text-[10px] font-medium text-zinc-400">
      <div className="flex gap-6">
        <span className="flex items-center gap-1.5"><Globe className="w-3 h-3 text-red-500" /> {t("status.global_cloud")}</span>
        <span className="flex items-center gap-1.5 cursor-pointer hover:text-red-600 transition-colors" onClick={() => isLogged ? setActiveTab("dashboard") : setShowLogin(true)}><Lock className="w-3 h-3" /> {isLogged ? t("nav.dashboard") : t("action.login")}</span>
      </div>
      <Link href="/terminos" className="hover:text-red-600 transition-colors cursor-pointer">{t("footer.terms")}</Link>
      <Link href="/admin" className="hover:text-red-600 transition-colors">{t("footer.admin_system")}</Link>
    </footer>
  );
}

function LoginPanelContent({ loginForm, setLoginForm, handleUserLogin, setShowLogin, setActiveTab, setShowForgotPassword, setForgotEmail }: {
  loginForm: any; setLoginForm: any; handleUserLogin: (e: React.FormEvent) => void; setShowLogin: (v: boolean) => void; setActiveTab: React.Dispatch<React.SetStateAction<TabType>>; setShowForgotPassword: (v: boolean) => void; setForgotEmail: (v: string) => void;
}) {
  const { t } = useLanguage();
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center max-[400px]:p-3 p-6"
    >
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white rounded-2xl p-6 md:p-10 shadow-xl relative border border-zinc-100"
      >
        <button onClick={() => setShowLogin(false)} className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center transition-all"><X className="w-4 h-4 text-zinc-400" /></button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-zinc-950">{t("login.welcome")}</h3>
          <p className="text-xs text-zinc-400 mt-1">{t("login.subtitle")}</p>
        </div>
        <form onSubmit={handleUserLogin} className="space-y-3">
          <div className="relative group">
            <ArrowRight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-red-500 transition-colors" />
            <input type="email" placeholder={t("form.email")}
              className="w-full bg-zinc-50 p-3 pl-9 rounded-lg border border-zinc-100 outline-none text-sm focus:bg-white focus:border-red-200 focus:ring-2 focus:ring-red-600/10 transition-all"
              value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})}
            />
          </div>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-red-500 transition-colors" />
            <input type="password" placeholder={t("form.password")}
              className="w-full bg-zinc-50 p-3 pl-9 rounded-lg border border-zinc-100 outline-none text-sm focus:bg-white focus:border-red-200 focus:ring-2 focus:ring-red-600/10 transition-all"
              value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})}
            />
          </div>
          <motion.button type="submit" whileTap={{ scale: 0.98 }} className="w-full py-3 bg-red-600 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-sm">
            {t("action.login")} <ArrowRight className="w-4 h-4" />
          </motion.button>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0 text-[10px] sm:text-xs">
            <p className="text-zinc-400">{t("login.no_account")} <span className="text-red-600 cursor-pointer hover:underline font-medium" onClick={() => { setShowLogin(false); setActiveTab("register"); }}>{t("action.register")}</span></p>
            <span className="text-red-600 cursor-pointer hover:underline font-medium" onClick={() => { setShowForgotPassword(true); setForgotEmail(loginForm.email); }}>{t("login.forgot_password")}</span>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function ForgotPasswordPanelContent({ forgotEmail, setForgotEmail, forgotSent, setForgotSent, forgotLoading, forgotError, handleForgotPassword, setShowLogin, setShowForgotPassword, setForgotError }: {
  forgotEmail: string; setForgotEmail: (v: string) => void; forgotSent: boolean; setForgotSent: (v: boolean) => void; forgotLoading: boolean; forgotError: string; handleForgotPassword: () => void; setShowLogin: (v: boolean) => void; setShowForgotPassword: (v: boolean) => void; setForgotError: (v: string) => void;
}) {
  const { t } = useLanguage();
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center max-[400px]:p-3 p-6"
    >
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white rounded-2xl p-6 md:p-10 shadow-xl relative border border-zinc-100"
      >
        <button onClick={() => setShowLogin(false)} className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center transition-all"><X className="w-4 h-4 text-zinc-400" /></button>

        {!forgotSent ? (
          <>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-zinc-950">{t("login.forgot_title")}</h3>
              <p className="text-xs text-zinc-400 mt-1">{t("login.forgot_desc")}</p>
            </div>
            <div className="space-y-3">
              <div className="relative group">
                <ArrowRight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-red-500 transition-colors" />
                <input type="email" placeholder={t("login.forgot_email_placeholder")}
                  className="w-full bg-zinc-50 p-3 pl-9 rounded-lg border border-zinc-100 outline-none text-sm focus:bg-white focus:border-red-200 focus:ring-2 focus:ring-red-600/10 transition-all"
                  value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                />
              </div>
              {forgotError && <p className="text-xs font-medium text-red-600 text-center">{forgotError}</p>}
              <motion.button whileTap={{ scale: 0.98 }} onClick={handleForgotPassword} disabled={forgotLoading}
                className="w-full py-3 bg-red-600 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-sm disabled:opacity-50"
              >
                {forgotLoading ? t("status.sending") : t("login.forgot_send")} <ArrowRight className="w-4 h-4" />
              </motion.button>
              <p className="text-center text-xs text-zinc-400">
                <span className="text-red-600 cursor-pointer hover:underline font-medium" onClick={() => { setShowForgotPassword(false); setForgotError(""); }}>{t("login.back_to_login")}</span>
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-zinc-950">{t("login.forgot_sent")}</h3>
              <p className="text-xs text-zinc-500 mt-1">{t("login.forgot_sent_desc").replace("{email}", forgotEmail)}</p>
            </div>
            <div className="text-center space-y-3">
              <motion.button whileTap={{ scale: 0.98 }}
                onClick={() => { setShowForgotPassword(false); setForgotSent(false); setForgotError(""); }}
                className="w-full py-3 bg-zinc-950 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800 transition-all shadow-sm"
              >
                {t("login.back_to_login")}
              </motion.button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
