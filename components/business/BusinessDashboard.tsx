"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Store, Building2, Package, Users, ShoppingCart, DollarSign,
  Bot, ChevronRight, ArrowLeft, Plus, Trash2, BarChart3,
  TrendingUp, Clock, Edit3, X, Send, Loader2, Sparkles, User,
  Settings, CheckCircle2, Layers, CreditCard, Download, ExternalLink,
  Wallet, Percent, ToggleLeft, ToggleRight, Bitcoin, Lock, ImageIcon, Upload, Link, Mic, MicOff, Paperclip, Search, BookOpen, Zap, Copy, Globe, Megaphone, FileText, Menu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { useVoiceInput } from "@/lib/hooks/useVoiceInput";
import { readFileAsText, formatFileMessage } from "@/lib/utils/readFile";
import MarkdownRenderer from "@/components/chat/MarkdownRenderer";
import AnalyticsPanel from "./AnalyticsPanel";
import TeamPanel from "./TeamPanel";
import OrgSettingsPanel from "./OrgSettingsPanel";
import IntegrationsPanel from "./IntegrationsPanel";
import CampaignsPanel from "./CampaignsPanel";
import InvoicesPanel from "./InvoicesPanel";
import { executeIntegrationAction } from "@/lib/integration-actions";

const CURRENCIES: { code: string; symbol: string; name: string; rate: number }[] = [
  { code: "USD", symbol: "$", name: "Dólar estadounidense", rate: 1 },
  { code: "EUR", symbol: "€", name: "Euro", rate: 0.92 },
  { code: "GBP", symbol: "£", name: "Libra esterlina", rate: 0.79 },
  { code: "MXN", symbol: "MX$", name: "Peso mexicano", rate: 18.5 },
  { code: "COP", symbol: "COL$", name: "Peso colombiano", rate: 4100 },
  { code: "ARS", symbol: "AR$", name: "Peso argentino", rate: 1050 },
  { code: "BRL", symbol: "R$", name: "Real brasileño", rate: 5.15 },
  { code: "CLP", symbol: "CLP$", name: "Peso chileno", rate: 940 },
  { code: "PEN", symbol: "S/", name: "Sol peruano", rate: 3.75 },
  { code: "CRC", symbol: "₡", name: "Colón costarricense", rate: 520 },
  { code: "CAD", symbol: "C$", name: "Dólar canadiense", rate: 1.36 },
  { code: "JPY", symbol: "¥", name: "Yen japonés", rate: 151 },
  { code: "CNY", symbol: "¥", name: "Yuan chino", rate: 7.24 },
  { code: "INR", symbol: "₹", name: "Rupia india", rate: 83.5 },
  { code: "AUD", symbol: "A$", name: "Dólar australiano", rate: 1.54 },
  { code: "CHF", symbol: "CHF", name: "Franco suizo", rate: 0.88 },
  { code: "VES", symbol: "Bs.", name: "Bolívar venezolano", rate: 36.5 },
  { code: "UYU", symbol: "$U", name: "Peso uruguayo", rate: 39.5 },
  { code: "PYG", symbol: "₲", name: "Guaraní paraguayo", rate: 7500 },
  { code: "BOB", symbol: "Bs", name: "Boliviano", rate: 6.96 },
  { code: "DOP", symbol: "RD$", name: "Peso dominicano", rate: 59 },
  { code: "GTQ", symbol: "Q", name: "Quetzal guatemalteco", rate: 7.78 },
  { code: "HNL", symbol: "L", name: "Lempira hondureño", rate: 24.8 },
  { code: "NIO", symbol: "C$", name: "Córdoba nicaragüense", rate: 36.7 },
  { code: "PAB", symbol: "B/.", name: "Balboa panameño", rate: 1 },
];

function getCurrency(code: string) {
  return CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
}

function convertToUSD(amount: number, fromCurrency: string): number {
  const currency = getCurrency(fromCurrency);
  if (currency.code === "USD") return amount;
  return Math.round((amount / currency.rate) * 100) / 100;
}

function formatPrice(price: number, currencyCode: string): string {
  const c = getCurrency(currencyCode);
  return `${c.symbol}${price.toFixed(2)}`;
}

function ProductThumbImg({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const [hasError, setHasError] = useState(false);
  if (!src || hasError) {
    return <div className={cn("w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-300", className)}><Package className="w-1/2 h-1/2" /></div>;
  }
  return <img src={src} alt={alt} className={cn("w-full h-full object-cover", className)} onError={() => setHasError(true)} />;
}

interface BusinessDashboardProps {
  userStore: any;
  userEmail: string;
  storeId: string | number;
  planLimits?: { maxStores: number; maxProductsPerStore: number; maxMessages: number; maxAutomations: number };
  planExpired?: boolean;
  onNavigateToPricing?: () => void;
  onBack?: () => void;
  onEditStore?: (storeId: string | number, data: any) => Promise<void>;
  onDeleteStore?: (storeId: string | number) => Promise<void>;
  onSaveStore?: (storeId: string | number, data: any) => void | Promise<void>;
  initialSection?: string;
}

export default function BusinessDashboard({ userStore, userEmail, storeId, planLimits, planExpired, onNavigateToPricing, onBack, onEditStore, onDeleteStore, onSaveStore, initialSection }: BusinessDashboardProps) {
  const [section, setSection] = useState<"dashboard" | "products" | "customers" | "orders" | "payments" | "analytics" | "team" | "orgsettings" | "integrations" | "campaigns" | "invoices" | "ai" | "knowledgebase" | "automations">((initialSection as any) || "dashboard");

  useEffect(() => {
    if (initialSection) setSection(initialSection as any);
  }, [initialSection]);
  const [products, setProducts] = useState<{ id: number; name: string; price: number; currency: string; priceUSD: number; stock: number; images: string[] }[]>([]);
  const [customers, setCustomers] = useState<{ id: number; name: string; email: string; phone: string }[]>([]);
  const [orders, setOrders] = useState<{ id: number; product: string; amount: number; status: string }[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [productForm, setProductForm] = useState({ name: "", price: "", stock: "", currency: "USD" });
  const [productImages, setProductImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [kbEntries, setKbEntries] = useState<{ id: number; title: string; content: string; category: string; createdAt: string }[]>([]);
  const [showAddKb, setShowAddKb] = useState(false);
  const [editingKb, setEditingKb] = useState<any | null>(null);
  const [kbForm, setKbForm] = useState({ title: "", content: "", category: "general" });
  const [searchKb, setSearchKb] = useState("");
  const [automations, setAutomations] = useState<{ id: number; name: string; trigger: string; actionType: string; actionConfig: Record<string, string>; triggerConfig: Record<string, any>; enabled: boolean; createdAt: string }[]>([]);
  const [campaigns, setCampaigns] = useState<{ id: number; name: string; type: "email" | "sms"; status: "draft" | "scheduled" | "sending" | "sent" | "paused" | "cancelled"; audience: string; subject: string; body: string; scheduledAt: string | null; sentAt: string | null; stats: { sent: number; opened: number; clicked: number; bounced: number; unsubscribed: number }; createdAt: string }[]>([]);
  const [integrations, setIntegrations] = useState<{ platform: string; apiKey: string; status: string; _id: string }[]>([]);

  useEffect(() => {
    if (!storeId) return;
    fetch(`/api/integrations/${storeId}`)
      .then(r => r.json())
      .then(d => { if (d.integrations) setIntegrations(d.integrations); })
      .catch(() => {});
  }, [storeId]);
  const [showAddAutomation, setShowAddAutomation] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<any | null>(null);
  const [automationForm, setAutomationForm] = useState({ name: "", trigger: "new_order", actionType: "send_notification", actionConfig: {} as Record<string, string>, triggerConfig: {} as Record<string, any> });
  const [showSettings, setShowSettings] = useState(false);
  const [editingStore, setEditingStore] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ name: "", desc: "", industry: "", slug: "", image: "" });
  const [storeImageUploading, setStoreImageUploading] = useState(false);
  const [publicVisible, setPublicVisible] = useState(false);
  const [publicAIEnabled, setPublicAIEnabled] = useState(false);
  const [searchProduct, setSearchProduct] = useState("");
  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchOrder, setSearchOrder] = useState("");

  const { showToast } = useToast();

  useEffect(() => {
    if (userStore) {
      setProducts(userStore.products || []);
      setCustomers(userStore.customers || []);
      setOrders(userStore.orders || []);
      setKbEntries(userStore.knowledgebase || []);
      setAutomations(userStore.automations || []);
      setCampaigns(userStore.campaigns || []);
    }
  }, [userStore]);

  const persistStore = (productsData?: any[], customersData?: any[], ordersData?: any[], knowledgebaseData?: any[], automationsData?: any[], campaignsData?: any[]) => {
    const data: any = {};
    if (productsData !== undefined) data.products = productsData;
    if (customersData !== undefined) data.customers = customersData;
    if (ordersData !== undefined) data.orders = ordersData;
    if (knowledgebaseData !== undefined) data.knowledgebase = knowledgebaseData;
    if (automationsData !== undefined) data.automations = automationsData;
    if (campaignsData !== undefined) data.campaigns = campaignsData;
    if (Object.keys(data).length > 0 && onSaveStore && storeId) {
      Promise.resolve(onSaveStore(storeId, data)).catch(e => console.error("Persist failed:", e));
    }
  };

  const addProduct = () => {
    if (!productForm.name || !productForm.price) return;
    const price = parseFloat(productForm.price);
    const currency = productForm.currency || "USD";
    const priceUSD = convertToUSD(price, currency);
    let newProducts;
    if (editingProduct) {
      newProducts = products.map(p => p.id === editingProduct.id ? { ...p, name: productForm.name, price, currency, priceUSD, stock: parseInt(productForm.stock) || 0, images: [...productImages] } : p);
    } else {
      newProducts = [...products, { id: Date.now(), name: productForm.name, price, currency, priceUSD, stock: parseInt(productForm.stock) || 0, images: [...productImages] }];
    }
    setProducts(newProducts);
    setProductForm({ name: "", price: "", stock: "", currency: "USD" });
    setProductImages([]);
    setImageUrlInput("");
    setShowAddProduct(false);
    setEditingProduct(null);
    persistStore(newProducts, undefined, undefined);
    executeAutomations("new_product", { productName: productForm.name, productPrice: price, productStock: parseInt(productForm.stock) || 0 });
    if ((parseInt(productForm.stock) || 0) <= 5) {
      executeAutomations("low_stock", { productName: productForm.name, productStock: parseInt(productForm.stock) || 0 });
    }
  };

  const executeAutomations = async (trigger: string, context: Record<string, any> = {}) => {
    const triggered = automations.filter(a => a.enabled && a.trigger === trigger);
    for (const auto of triggered) {
      if (auto.actionType === "send_notification") {
        showToast(auto.actionConfig.message || `⚡ Automatización "${auto.name}" ejecutada`, "info");
      }
      if (auto.actionType === "webhook" && auto.actionConfig.webhookUrl) {
        fetch(auto.actionConfig.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trigger, automation: auto.name, ...context }),
        }).catch(() => {});
      }
      const integrationActions = ["ai_generate", "send_telegram", "send_discord", "send_slack", "send_whatsapp", "send_sms", "post_to_social"];
      if (integrationActions.includes(auto.actionType)) {
        const ctx = typeof context === "object" ? context : {};
        const cfg = { ...ctx, ...auto.actionConfig };
        const result = await executeIntegrationAction(auto.actionType, cfg, integrations);
        if (result.success) {
          showToast(`✅ ${auto.name}: ${result.message}`, "success");
        } else {
          showToast(`❌ ${auto.name}: ${result.message}`, "error");
        }
      }
    }
  };

  const totalSales = orders.reduce((sum, o) => sum + o.amount, 0);
  const totalProducts = products.length;
  const maxProducts = planLimits?.maxProductsPerStore ?? 9999;
  const canAddProduct = totalProducts < maxProducts && !planExpired;
  const maxAutomations = planLimits?.maxAutomations ?? 999;
  const canAddAutomation = automations.length < maxAutomations && !planExpired;

  const [showSidebar, setShowSidebar] = useState(true);

  return (
    <div className="max-w-7xl mx-auto px-0 md:px-2">
      <div className="flex flex-col min-h-[calc(100vh-8rem)] md:min-h-[600px] lg:h-[850px] w-full bg-white rounded-none md:rounded-[3rem] border-0 md:border border-zinc-200 shadow-2xl overflow-hidden">
        <header className="px-3 md:px-10 py-3 md:py-6 bg-white border-b border-zinc-100 flex items-center justify-between gap-1 md:gap-2">
          <div className="flex items-center gap-1 md:gap-4 min-w-0">
            <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="p-1.5 md:p-2 hover:bg-zinc-50 rounded-xl transition-all shrink-0"><ArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></motion.button>

            <div className="p-1.5 md:p-3 bg-gradient-to-br from-red-600 to-red-700 rounded-xl md:rounded-2xl shadow-xl shadow-red-100 text-white shrink-0">
              <Store className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm md:text-xl font-black italic tracking-tighter text-zinc-950 truncate">{userStore?.name || "Mi Empresa"}</h2>
              <div className="hidden md:flex items-center gap-2 mt-0.5">
                <span className="px-2.5 py-0.5 bg-red-50 text-red-600 rounded-full text-[9px] font-black italic uppercase">{userStore?.typeLabel || userStore?.type || "Sistema"}</span>
                <span className="text-[9px] text-zinc-400 font-black italic">{userStore?.industry}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-3 shrink-0">
            {userStore?.slug && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-zinc-50 rounded-xl border border-zinc-100 shadow-sm group">
                <span className={cn("w-2 h-2 rounded-full animate-pulse", (userStore as any)?.isPublic ? "bg-emerald-500" : "bg-zinc-300")} />
                <span className="text-[9px] font-bold text-zinc-400 italic tracking-tight">/s/{userStore.slug}</span>
                <button onClick={() => { navigator.clipboard.writeText(window.location.origin + "/s/" + userStore.slug); showToast("URL copiada al portapapeles", "success"); }} className="p-1 hover:bg-zinc-100 rounded-lg transition-all opacity-0 group-hover:opacity-100" title="Copiar URL">
                  <Copy className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-950" />
                </button>
                <a href={"/s/" + userStore.slug} target="_blank" className={cn("p-1 hover:bg-zinc-100 rounded-lg transition-all opacity-0 group-hover:opacity-100", (userStore as any)?.isPublic ? "text-emerald-600 hover:text-emerald-700" : "text-zinc-300 hover:text-zinc-500")} title="Abrir sitio público">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setEditingStore(false); setConfirmDelete(false); setSettingsForm({ name: userStore?.name || "", desc: userStore?.desc || "", industry: userStore?.industry || "", slug: userStore?.slug || "", image: userStore?.image || "" }); setPublicVisible(!!(userStore as any)?.isPublic); setPublicAIEnabled(!!(userStore as any)?.publicAI); setShowSettings(true); }} className="p-1.5 md:p-2 hover:bg-zinc-50 rounded-xl transition-all" title="Configuración de la tienda">
              <Settings className="w-4 h-4 md:w-5 md:h-5 text-zinc-400 hover:text-zinc-950 transition-colors" />
            </motion.button>
            <div className="hidden md:block text-right">
              <p className="text-xs font-black text-zinc-950 italic">{userEmail?.split('@')[0]}</p>
              <p className="text-[9px] font-bold text-zinc-400 uppercase">Propietario</p>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-zinc-800 rounded-xl flex items-center justify-center font-black text-[10px] md:text-xs text-white shadow-lg uppercase">
              {userEmail?.[0] || "U"}
            </div>
          </div>
        </header>

        {/* Mobile horizontal tab bar */}
        <div className="md:hidden overflow-x-auto no-scrollbar border-b border-zinc-100 bg-white">
          <div className="flex gap-1.5 px-3 py-2.5 min-w-max">
            {[
              { icon: <BarChart3 className="w-3.5 h-3.5" />, label: "Dashboard", key: "dashboard" },
              { icon: <Package className="w-3.5 h-3.5" />, label: "Productos", key: "products" },
              { icon: <Users className="w-3.5 h-3.5" />, label: "Clientes", key: "customers" },
              { icon: <ShoppingCart className="w-3.5 h-3.5" />, label: "Pedidos", key: "orders" },
              { icon: <Wallet className="w-3.5 h-3.5" />, label: "Pagos", key: "payments" },
              { icon: <TrendingUp className="w-3.5 h-3.5" />, label: "Analytics", key: "analytics" },
              { icon: <FileText className="w-3.5 h-3.5" />, label: "Facturas", key: "invoices" },
              { icon: <Megaphone className="w-3.5 h-3.5" />, label: "Campañas", key: "campaigns" },
              { icon: <Zap className="w-3.5 h-3.5" />, label: "Auto.", key: "automations" },
              { icon: <Bot className="w-3.5 h-3.5" />, label: "IA", key: "ai" },
              { icon: <BookOpen className="w-3.5 h-3.5" />, label: "Base Conoc.", key: "knowledgebase" },
            ].map((tab) => (
              <motion.button
                key={tab.key}
                whileTap={{ scale: 0.92 }}
                onClick={() => setSection(tab.key as any)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black italic transition-all whitespace-nowrap",
                  section === tab.key
                    ? "bg-red-600 text-white shadow-md"
                    : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                )}
              >
                {React.cloneElement(tab.icon, { className: "w-3.5 h-3.5" })}
                {tab.label}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          {showSidebar && (
            <aside className="hidden md:flex flex-col w-56 bg-zinc-50 border-r border-zinc-100 p-6 gap-6 overflow-y-auto shrink-0">
              <div className="space-y-1">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 italic">Gestión</h3>
                <SideBtn icon={<BarChart3 />} label="Dashboard" active={section === "dashboard"} onClick={() => setSection("dashboard")} />
                <SideBtn icon={<Package />} label="Productos" active={section === "products"} onClick={() => setSection("products")} />
                <SideBtn icon={<Users />} label="Clientes" active={section === "customers"} onClick={() => setSection("customers")} />
                <SideBtn icon={<ShoppingCart />} label="Pedidos" active={section === "orders"} onClick={() => setSection("orders")} />
                <SideBtn icon={<Wallet />} label="Pagos" active={section === "payments"} onClick={() => setSection("payments")} />
                <SideBtn icon={<TrendingUp />} label="Analytics" active={section === "analytics"} onClick={() => setSection("analytics")} />
                <SideBtn icon={<FileText />} label="Facturas" active={section === "invoices"} onClick={() => setSection("invoices")} />
                <SideBtn icon={<Megaphone />} label="Campañas" active={section === "campaigns"} onClick={() => setSection("campaigns")} />
              </div>
              <div className="space-y-1">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 italic">Automatización</h3>
                <SideBtn icon={<Zap />} label="Automatizaciones" active={section === "automations"} onClick={() => setSection("automations")} />
              </div>
              <div className="space-y-1">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 italic">Asistencia</h3>
                <SideBtn icon={<Bot />} label="IA Agente" active={section === "ai"} onClick={() => setSection("ai")} />
                <SideBtn icon={<BookOpen />} label="Base de Conocimiento" active={section === "knowledgebase"} onClick={() => setSection("knowledgebase")} />
              </div>
            </aside>
          )}
          <main className="flex-1 overflow-y-auto p-4 max-[400px]:p-3 max-[340px]:p-2 md:p-8 bg-white">
            {section === "dashboard" && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
                  <div className="bg-white max-[400px]:p-4 p-6 max-[400px]:rounded-[1.5rem] rounded-[2rem] border border-zinc-100 shadow-sm space-y-2 md:space-y-3">
                    <div className="p-2 md:p-3 bg-red-50 rounded-xl w-fit"><Package className="w-4 h-4 md:w-5 md:h-5 text-red-600" /></div>
                    <p className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic">Productos</p>
                    <p className="max-[400px]:text-2xl text-3xl font-black italic text-zinc-950">{totalProducts}</p>
                  </div>
                  <div className="bg-white max-[400px]:p-4 p-6 max-[400px]:rounded-[1.5rem] rounded-[2rem] border border-zinc-100 shadow-sm space-y-2 md:space-y-3">
                    <div className="p-2 md:p-3 bg-blue-50 rounded-xl w-fit"><Users className="w-4 h-4 md:w-5 md:h-5 text-blue-600" /></div>
                    <p className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic">Clientes</p>
                    <p className="max-[400px]:text-2xl text-3xl font-black italic text-zinc-950">{customers.length}</p>
                  </div>
                  <div className="bg-white max-[400px]:p-4 p-6 max-[400px]:rounded-[1.5rem] rounded-[2rem] border border-zinc-100 shadow-sm space-y-2 md:space-y-3">
                    <div className="p-2 md:p-3 bg-amber-50 rounded-xl w-fit"><ShoppingCart className="w-4 h-4 md:w-5 md:h-5 text-amber-600" /></div>
                    <p className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic">Pedidos</p>
                    <p className="max-[400px]:text-2xl text-3xl font-black italic text-zinc-950">{orders.length}</p>
                  </div>
                  <div className="bg-white max-[400px]:p-4 p-6 max-[400px]:rounded-[1.5rem] rounded-[2rem] border border-zinc-100 shadow-sm space-y-2 md:space-y-3">
                    <div className="p-2 md:p-3 bg-emerald-50 rounded-xl w-fit"><DollarSign className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" /></div>
                    <p className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic">Ventas</p>
                    <p className="max-[400px]:text-2xl text-3xl font-black italic text-zinc-950">${totalSales}</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 max-[400px]:p-6 p-10 max-[400px]:rounded-[2rem] rounded-[3rem] text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[80px] -mr-32 -mt-32" />
                  <div className="relative z-10 space-y-3 md:space-y-4">
                    <Bot className="w-8 h-8 md:w-10 md:h-10 text-red-500" />
                    <h3 className="max-[400px]:text-2xl text-3xl font-black italic">Tu agente IA está listo</h3>
                    <p className="text-zinc-400 font-medium max-w-lg max-[400px]:text-sm">El asistente conoce tu negocio. Úsalo para resolver dudas, analizar datos o gestionar tu tienda.</p>
                      <div className={cn("px-3 py-1 rounded-full text-[9px] font-black italic w-fit", planExpired ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-300")}>
                        {planLimits?.maxMessages ?? 999} msgs
                      </div>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => setSection("ai")} className="px-6 md:px-8 py-3 md:py-4 bg-red-600 text-white rounded-2xl font-black italic text-xs md:text-sm hover:bg-red-700 transition-all shadow-xl inline-flex items-center gap-3">
                      HABLAR CON IA <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
            )}

            {section === "products" && (
              <div className="space-y-6 md:space-y-8">
                <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
                  <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                    <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">Productos <span className="text-red-600">({totalProducts}/{maxProducts})</span></h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                      <input type="text" placeholder="Buscar producto..." value={searchProduct} onChange={e => setSearchProduct(e.target.value)} className="w-36 md:w-44 bg-zinc-50 pl-10 pr-4 py-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-red-200 transition-all" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-zinc-400 italic">{totalProducts}/{maxProducts} usados</span>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => {
                      if (canAddProduct) { setShowAddProduct(true); return; }
                      if (planExpired) { showToast("❌ Plan vencido. Renueva tu plan para agregar productos.", "error"); onNavigateToPricing?.(); return; }
                      showToast(`⚠️ Límite de ${maxProducts} productos alcanzado. Actualiza tu plan para agregar más.`, "info");
                      onNavigateToPricing?.();
                    }} className={cn("px-5 md:px-6 py-2.5 md:py-3 rounded-2xl font-black text-[10px] md:text-xs italic transition-all shadow-xl flex items-center gap-2", canAddProduct ? "bg-red-600 text-white hover:bg-red-700" : "bg-zinc-200 text-zinc-400 cursor-not-allowed")}>
                      <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> AÑADIR
                    </motion.button>
                  </div>
                </div>
                {/* Plan limit warnings with CTA */}
                {planExpired && (
                  <div className="bg-red-50 border border-red-300 max-[400px]:p-4 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shrink-0" />
                      <p className="text-[10px] md:text-[11px] font-bold text-red-800 italic">❌ Plan vencido. No puedes agregar ni modificar productos. Renueva tu plan para recuperar el control total de tu negocio.</p>
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={onNavigateToPricing} className="px-6 py-3 bg-red-600 text-white rounded-xl font-black text-[10px] italic hover:bg-red-700 transition-all shadow-md">
                      RENOVAR PLAN AHORA
                    </motion.button>
                  </div>
                )}
                {!planExpired && totalProducts >= maxProducts && (
                  <div className="bg-amber-50 border border-amber-300 max-[400px]:p-4 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-amber-500 rounded-full shrink-0" />
                      <p className="text-[10px] md:text-[11px] font-bold text-amber-800 italic">⚠️ Límite de {maxProducts} productos alcanzado. Actualiza tu plan para seguir agregando productos a tu tienda.</p>
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={onNavigateToPricing} className="px-6 py-3 bg-amber-600 text-white rounded-xl font-black text-[10px] italic hover:bg-amber-700 transition-all shadow-md">
                      ACTUALIZAR PLAN
                    </motion.button>
                  </div>
                )}
                <div className="space-y-2 md:space-y-3">
                  {products.filter(p => !searchProduct || p.name.toLowerCase().includes(searchProduct.toLowerCase())).map((p) => (
                    <div key={p.id} className="flex items-center justify-between max-[400px]:p-3.5 p-5 bg-zinc-50 rounded-2xl border border-zinc-100 group hover:border-red-200 transition-all">
                      <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                        <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-red-600 shadow-sm overflow-hidden shrink-0">
                          <ProductThumbImg src={p.images?.[0]} alt={p.name} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black italic text-zinc-950 text-sm md:text-base truncate">{p.name}</p>
                          <p className="text-[9px] md:text-[10px] text-zinc-400 font-bold italic truncate">{formatPrice(p.price, p.currency)} · Stock: {p.stock} {p.images?.length ? `· ${p.images.length} img` : ""} {p.currency !== "USD" ? `≈ $${p.priceUSD} USD` : ""}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setEditingProduct(p); setProductForm({ name: p.name, price: String(p.price), stock: String(p.stock), currency: p.currency || "USD" }); setProductImages(p.images || []); setImageUrlInput(""); setShowAddProduct(true); }} className="p-1.5 md:p-2 text-zinc-300 hover:text-blue-500 transition-all"><Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { const np = products.filter(x => x.id !== p.id); setProducts(np); persistStore(np, undefined, undefined); }} className="p-1.5 md:p-2 text-zinc-300 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
                      </div>
                    </div>
                  ))}
                  {products.filter(p => !searchProduct || p.name.toLowerCase().includes(searchProduct.toLowerCase())).length === 0 && (
                    <div className="py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">{searchProduct ? `Sin resultados para "${searchProduct}"` : "No hay productos aún"}</div>
                  )}
                </div>
                <AnimatePresence>
                    {showAddProduct && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4" onClick={() => { setShowAddProduct(false); setEditingProduct(null); }}>
                      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-md bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-4xl relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setShowAddProduct(false); setEditingProduct(null); }} className="absolute top-4 md:top-6 right-4 md:right-6 p-2 hover:bg-zinc-50 rounded-xl"><X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></button>
                        <h3 className="text-xl md:text-2xl font-black italic text-zinc-950 mb-4 md:mb-6 uppercase tracking-tighter">{editingProduct ? "Editar Producto" : "Nuevo Producto"}</h3>
                        <div className="space-y-3 md:space-y-4 max-h-[70vh] overflow-y-auto pr-1 md:pr-2">
                          <input type="text" placeholder="Nombre" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                          <div className="grid grid-cols-3 gap-2 md:gap-3">
                            <div className="col-span-1">
                              <select value={productForm.currency} onChange={e => setProductForm({...productForm, currency: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm italic">
                                {CURRENCIES.filter((c, i, a) => a.findIndex(x => x.code === c.code) === i).map(c => (
                                  <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                                ))}
                              </select>
                            </div>
                            <div className="col-span-2 flex gap-2 md:gap-4">
                              <input type="number" step="0.01" placeholder="Precio" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                              <input type="number" placeholder="Stock" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                            </div>
                          </div>
                          {productForm.price && productForm.currency && productForm.currency !== "USD" && (
                            <p className="text-[10px] text-zinc-400 font-medium italic text-right">≈ ${convertToUSD(parseFloat(productForm.price), productForm.currency).toFixed(2)} USD</p>
                          )}

                          {/* Images Section */}
                          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest">Imágenes ({productImages.length}/10)</label>
                            </div>

                            {/* Image Preview Grid */}
                            {productImages.length > 0 && (
                              <div className="grid grid-cols-5 gap-2">
                                {productImages.map((url, i) => (
                                  <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-white border border-zinc-200">
                                    <img src={url} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%23ccc" stroke-width="2"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>'; }} />
                                    <button onClick={() => setProductImages(prev => prev.filter((_, j) => j !== i))} className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><X className="w-3 h-3" /></button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Upload from device */}
                            <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-dashed border-zinc-300 cursor-pointer hover:border-red-300 transition-all">
                              <Upload className="w-5 h-5 text-zinc-400" />
                              <span className="text-xs font-medium text-zinc-500 italic">Subir desde el dispositivo</span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                disabled={productImages.length >= 10}
                                onChange={async (e) => {
                                  const files = Array.from(e.target.files || []);
                                  const remaining = 10 - productImages.length;
                                  const toUpload = files.slice(0, remaining);
                                  for (const file of toUpload) {
                                    const formData = new FormData();
                                    formData.append("file", file);
                                    try {
                                      const res = await fetch("/api/upload", { method: "POST", body: formData });
                                      const data = await res.json();
                                      if (data.url) setProductImages(prev => [...prev, data.url]);
                                    } catch { /* ignore failed uploads */ }
                                  }
                                  e.target.value = "";
                                }}
                              />
                            </label>

                            {/* URL input */}
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Link className="absolute left-3 top-3 w-4 h-4 text-zinc-300" />
                                <input
                                  type="text" placeholder="O pega una URL de imagen..."
                                  value={imageUrlInput}
                                  onChange={e => setImageUrlInput(e.target.value)}
                                  className="w-full bg-white p-3 pl-10 rounded-xl border border-zinc-200 outline-none text-xs font-medium focus:border-red-200 transition-all"
                                />
                              </div>
                              <button
                                onClick={() => {
                                  if (imageUrlInput && productImages.length < 10) {
                                    setProductImages(prev => [...prev, imageUrlInput]);
                                    setImageUrlInput("");
                                  }
                                }}
                                disabled={!imageUrlInput || productImages.length >= 10}
                                className="px-4 py-2 bg-zinc-800 text-white rounded-xl text-[9px] font-black italic hover:bg-zinc-700 transition-all disabled:opacity-50"
                              >
                                AÑADIR
                              </button>
                            </div>
                          </div>

                          <button onClick={addProduct} disabled={!productForm.name || !productForm.price} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black italic hover:bg-red-700 transition-all shadow-xl disabled:opacity-50">
                            {editingProduct ? "ACTUALIZAR PRODUCTO" : "GUARDAR PRODUCTO"}
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {section === "customers" && (
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                  <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">Clientes <span className="text-red-600">({customers.length})</span></h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                    <input type="text" placeholder="Buscar cliente..." value={searchCustomer} onChange={e => setSearchCustomer(e.target.value)} className="w-36 md:w-44 bg-zinc-50 pl-10 pr-4 py-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-red-200 transition-all" />
                  </div>
                </div>
                {customers.filter(c => !searchCustomer || c.name.toLowerCase().includes(searchCustomer.toLowerCase()) || c.email.toLowerCase().includes(searchCustomer.toLowerCase())).length === 0 ? (
                  <div className="py-12 md:py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">{searchCustomer ? `Sin resultados para "${searchCustomer}"` : "No hay clientes registrados"}</div>
                ) : (
                  <div className="space-y-2">
                    {customers.filter(c => !searchCustomer || c.name.toLowerCase().includes(searchCustomer.toLowerCase()) || c.email.toLowerCase().includes(searchCustomer.toLowerCase())).map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between max-[400px]:p-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-xl flex items-center justify-center text-zinc-400 shadow-sm shrink-0"><User className="w-4 h-4 md:w-5 md:h-5" /></div>
                          <div className="min-w-0">
                            <p className="text-sm font-black italic text-zinc-950 truncate">{c.name}</p>
                            <p className="text-[9px] md:text-[10px] text-zinc-400 font-bold italic truncate">{c.email} {c.phone ? `· ${c.phone}` : ""}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {section === "orders" && (
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                  <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">Pedidos <span className="text-red-600">({orders.length})</span></h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                    <input type="text" placeholder="Buscar pedido..." value={searchOrder} onChange={e => setSearchOrder(e.target.value)} className="w-36 md:w-44 bg-zinc-50 pl-10 pr-4 py-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-red-200 transition-all" />
                  </div>
                </div>
                {orders.filter(o => !searchOrder || o.product.toLowerCase().includes(searchOrder.toLowerCase()) || o.status.toLowerCase().includes(searchOrder.toLowerCase())).length === 0 ? (
                  <div className="py-12 md:py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">{searchOrder ? `Sin resultados para "${searchOrder}"` : "No hay pedidos registrados"}</div>
                ) : (
                  <div className="space-y-2">
                    {orders.filter(o => !searchOrder || o.product.toLowerCase().includes(searchOrder.toLowerCase()) || o.status.toLowerCase().includes(searchOrder.toLowerCase())).map((o: any) => (
                      <div key={o.id} className="flex items-center justify-between max-[400px]:p-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-xl flex items-center justify-center text-zinc-400 shadow-sm shrink-0"><ShoppingCart className="w-4 h-4 md:w-5 md:h-5" /></div>
                          <div className="min-w-0">
                            <p className="text-sm font-black italic text-zinc-950 truncate">{o.product}</p>
                            <p className="text-[9px] md:text-[10px] text-zinc-400 font-bold italic truncate">${o.amount} · {o.status}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {section === "payments" && (
              <StripeConnectPanel storeId={storeId} userStore={userStore} userEmail={userEmail} />
            )}

            {section === "analytics" && (
              <AnalyticsPanel storeId={storeId} />
            )}

            {section === "team" && (
              <TeamPanel />
            )}

            {section === "orgsettings" && (
              <OrgSettingsPanel />
            )}

            {section === "integrations" && (
              <IntegrationsPanel storeId={storeId} />
            )}

            {section === "invoices" && (
              <InvoicesPanel storeId={storeId} userEmail={userEmail} />
            )}

            {section === "campaigns" && (
              <CampaignsPanel campaigns={campaigns} setCampaigns={setCampaigns} onPersist={(d) => persistStore(undefined, undefined, undefined, undefined, undefined, d)} />
            )}

            {section === "ai" && (
              <div className="h-full flex flex-col">
                <BusinessAI agentName={userStore?.name || "mi negocio"} store={userStore} products={products} setProducts={setProducts} customers={customers} setCustomers={setCustomers} orders={orders} setOrders={setOrders} totalSales={totalSales} kbEntries={kbEntries} setKbEntries={setKbEntries} automations={automations} setAutomations={setAutomations} onPersist={persistStore} onExecuteAutomations={executeAutomations} maxMessages={planLimits?.maxMessages ?? 999} />
              </div>
            )}

            {section === "knowledgebase" && (
              <div className="space-y-6 md:space-y-8">
                <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
                  <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                    <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">Conocimiento <span className="text-red-600">({kbEntries.length})</span></h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                      <input type="text" placeholder="Buscar entrada..." value={searchKb} onChange={e => setSearchKb(e.target.value)} className="w-36 md:w-44 bg-zinc-50 pl-10 pr-4 py-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-red-200 transition-all" />
                    </div>
                  </div>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setEditingKb(null); setKbForm({ title: "", content: "", category: "general" }); setShowAddKb(true); }} className="px-5 md:px-6 py-2.5 md:py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] md:text-xs italic hover:bg-red-700 transition-all shadow-xl flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> AÑADIR
                  </motion.button>
                </div>

                {kbEntries.filter(e => !searchKb || e.title.toLowerCase().includes(searchKb.toLowerCase()) || e.content.toLowerCase().includes(searchKb.toLowerCase()) || e.category.toLowerCase().includes(searchKb.toLowerCase())).length === 0 ? (
                  <div className="py-12 md:py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">
                    {searchKb ? `Sin resultados para "${searchKb}"` : "No hay entradas en la base de conocimiento. Añade información para que el IA Agente la use."}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {kbEntries.filter(e => !searchKb || e.title.toLowerCase().includes(searchKb.toLowerCase()) || e.content.toLowerCase().includes(searchKb.toLowerCase()) || e.category.toLowerCase().includes(searchKb.toLowerCase())).map((entry) => (
                      <div key={entry.id} className="bg-white max-[400px]:p-4 rounded-[1.5rem] md:rounded-[2rem] border border-zinc-100 p-6 space-y-3 md:space-y-4 group hover:border-red-200 transition-all shadow-sm">
                        <div className="flex items-start justify-between gap-3 md:gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                              <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-black italic text-zinc-950 text-sm md:text-base truncate">{entry.title}</p>
                              <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded-full text-[8px] font-black uppercase italic">{entry.category}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setEditingKb(entry); setKbForm({ title: entry.title, content: entry.content, category: entry.category }); setShowAddKb(true); }} className="p-1.5 md:p-2 text-zinc-300 hover:text-blue-500 transition-all"><Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => { const nk = kbEntries.filter(x => x.id !== entry.id); setKbEntries(nk); persistStore(undefined, undefined, undefined, nk); }} className="p-1.5 md:p-2 text-zinc-300 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
                          </div>
                        </div>
                        <p className="text-xs md:text-sm text-zinc-600 font-medium leading-relaxed line-clamp-3 whitespace-pre-wrap">{entry.content}</p>
                        <p className="text-[9px] text-zinc-400 font-bold italic">{new Date(entry.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}

                <AnimatePresence>
                  {showAddKb && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-6" onClick={() => { setShowAddKb(false); setEditingKb(null); }}>
                      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-lg bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-4xl relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setShowAddKb(false); setEditingKb(null); }} className="absolute top-4 md:top-6 right-4 md:right-6 p-2 hover:bg-zinc-50 rounded-xl"><X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></button>
                        <h3 className="text-xl md:text-2xl font-black italic text-zinc-950 mb-4 md:mb-6 uppercase tracking-tighter">{editingKb ? "Editar Entrada" : "Nueva Entrada"}</h3>
                        <div className="space-y-3 md:space-y-5">
                          <div>
                            <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Título</label>
                            <input type="text" placeholder="Ej. Política de devoluciones" value={kbForm.title} onChange={e => setKbForm({...kbForm, title: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Categoría</label>
                            <select value={kbForm.category} onChange={e => setKbForm({...kbForm, category: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 italic text-sm">
                              <option value="general">General</option>
                              <option value="productos">Productos</option>
                              <option value="clientes">Clientes</option>
                              <option value="pedidos">Pedidos</option>
                              <option value="politicas">Políticas</option>
                              <option value="faq">FAQ</option>
                              <option value="manual">Manual</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Contenido</label>
                            <textarea placeholder="Describe la información que el IA Agente debe conocer..." value={kbForm.content} onChange={e => setKbForm({...kbForm, content: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all resize-none h-32 md:h-40 mt-1 text-sm" />
                          </div>
                          <button onClick={() => {
                            if (!kbForm.title || !kbForm.content) return;
                            let newEntries;
                            if (editingKb) {
                              newEntries = kbEntries.map(e => e.id === editingKb.id ? { ...e, title: kbForm.title, content: kbForm.content, category: kbForm.category } : e);
                            } else {
                              newEntries = [...kbEntries, { id: Date.now(), title: kbForm.title, content: kbForm.content, category: kbForm.category, createdAt: new Date().toISOString() }];
                            }
                            setKbEntries(newEntries);
                            persistStore(undefined, undefined, undefined, newEntries);
                            setShowAddKb(false);
                            setEditingKb(null);
                            setKbForm({ title: "", content: "", category: "general" });
                          }} disabled={!kbForm.title || !kbForm.content} className="w-full py-4 md:py-5 bg-red-600 text-white rounded-2xl font-black italic text-sm md:text-base hover:bg-red-700 transition-all shadow-xl disabled:opacity-50">
                            {editingKb ? "ACTUALIZAR ENTRADA" : "GUARDAR ENTRADA"}
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {section === "automations" && (
              <div className="space-y-6 md:space-y-8">
                <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
                  <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                    <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">Automatizaciones <span className="text-red-600">({automations.filter(a => a.enabled).length}/{automations.length})</span></h3>
                    <span className="text-[9px] font-black text-zinc-400 italic">{automations.length}/{maxAutomations} usadas</span>
                  </div>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => {
                    if (canAddAutomation) { setEditingAutomation(null); setAutomationForm({ name: "", trigger: "new_order", actionType: "send_notification", actionConfig: {}, triggerConfig: {} }); setShowAddAutomation(true); return; }
                    if (planExpired) { showToast("❌ Plan vencido. Renueva tu plan para crear más automatizaciones.", "error"); onNavigateToPricing?.(); return; }
                    showToast(`⚠️ Límite de ${maxAutomations} automatizaciones alcanzado. Actualiza tu plan para crear más.`, "info");
                    onNavigateToPricing?.();
                  }} className={cn("px-5 md:px-6 py-2.5 md:py-3 rounded-2xl font-black text-[10px] md:text-xs italic transition-all shadow-xl flex items-center gap-2", canAddAutomation ? "bg-red-600 text-white hover:bg-red-700" : "bg-zinc-200 text-zinc-400 cursor-not-allowed")}>
                    <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> NUEVA REGLA
                  </motion.button>
                </div>

                {planExpired && (
                  <div className="bg-red-50 border border-red-300 max-[400px]:p-4 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shrink-0" />
                      <p className="text-[10px] md:text-[11px] font-bold text-red-800 italic">❌ Plan vencido. No puedes crear nuevas automatizaciones. Renueva tu plan para recuperar el control total.</p>
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={onNavigateToPricing} className="px-6 py-3 bg-red-600 text-white rounded-xl font-black text-[10px] italic hover:bg-red-700 transition-all shadow-md">RENOVAR PLAN AHORA</motion.button>
                  </div>
                )}
                {!planExpired && automations.length >= maxAutomations && (
                  <div className="bg-amber-50 border border-amber-300 max-[400px]:p-4 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-amber-500 rounded-full shrink-0" />
                      <p className="text-[10px] md:text-[11px] font-bold text-amber-800 italic">⚠️ Límite de {maxAutomations} automatizaciones alcanzado. Actualiza tu plan para crear más reglas.</p>
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={onNavigateToPricing} className="px-6 py-3 bg-amber-600 text-white rounded-xl font-black text-[10px] italic hover:bg-amber-700 transition-all shadow-md">ACTUALIZAR PLAN</motion.button>
                  </div>
                )}
                {automations.length === 0 ? (
                  <div className="py-12 md:py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">
                    No hay reglas de automatización. Crea una para empezar a automatizar tu negocio.
                  </div>
                ) : (
                  <div className="space-y-2 md:space-y-3">
                    {automations.map((auto) => (
                      <div key={auto.id} className={cn("flex items-center justify-between max-[400px]:p-3.5 p-5 rounded-2xl border transition-all group", auto.enabled ? "bg-white border-zinc-100 hover:border-red-200" : "bg-zinc-50 border-zinc-100 opacity-60")}>
                        <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                          <div className={cn("w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm shrink-0", auto.enabled ? "bg-amber-50 text-amber-600" : "bg-zinc-100 text-zinc-400")}>
                            <Zap className={cn("w-4 h-4 md:w-6 md:h-6")} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-black italic text-zinc-950 text-sm md:text-base truncate">{auto.name}</p>
                            <div className="flex items-center gap-1.5 md:gap-2 mt-0.5 md:mt-1 flex-wrap">
                              <span className="px-1.5 md:px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-[7px] md:text-[8px] font-black uppercase italic">{auto.trigger.replace(/_/g, " ")}</span>
                              <span className="px-1.5 md:px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[7px] md:text-[8px] font-black uppercase italic">{auto.actionType === "send_notification" ? "Notificación" : "Webhook"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 md:gap-2 shrink-0">
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                            const updated = automations.map(a => a.id === auto.id ? { ...a, enabled: !a.enabled } : a);
                            setAutomations(updated);
                            persistStore(undefined, undefined, undefined, undefined, updated);
                          }} className={cn("px-2.5 md:px-4 py-1.5 md:py-2 rounded-xl font-black text-[8px] md:text-[9px] italic uppercase transition-all", auto.enabled ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-zinc-200 text-zinc-400 hover:bg-zinc-300")}>
                            {auto.enabled ? "ACTIVO" : "INACTIVO"}
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setEditingAutomation(auto); setAutomationForm({ name: auto.name, trigger: auto.trigger, actionType: auto.actionType, actionConfig: { ...auto.actionConfig }, triggerConfig: { ...auto.triggerConfig } }); setShowAddAutomation(true); }} className="p-1.5 md:p-2 text-zinc-300 hover:text-blue-500 transition-all"><Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => { const na = automations.filter(x => x.id !== auto.id); setAutomations(na); persistStore(undefined, undefined, undefined, undefined, na); }} className="p-1.5 md:p-2 text-zinc-300 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <AnimatePresence>
                  {showAddAutomation && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-6" onClick={() => { setShowAddAutomation(false); setEditingAutomation(null); }}>
                      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-lg bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-4xl relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setShowAddAutomation(false); setEditingAutomation(null); }} className="absolute top-4 md:top-6 right-4 md:right-6 p-2 hover:bg-zinc-50 rounded-xl"><X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></button>
                        <h3 className="text-xl md:text-2xl font-black italic text-zinc-950 mb-4 md:mb-6 uppercase tracking-tighter">{editingAutomation ? "Editar Regla" : "Nueva Regla"}</h3>
                        <div className="space-y-3 md:space-y-5 max-h-[70vh] overflow-y-auto pr-1 md:pr-2">
                          <div>
                            <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Nombre</label>
                            <input type="text" placeholder="Ej. Notificar nuevo pedido" value={automationForm.name} onChange={e => setAutomationForm({...automationForm, name: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Disparador (Trigger)</label>
                            <select value={automationForm.trigger} onChange={e => setAutomationForm({...automationForm, trigger: e.target.value, triggerConfig: {} })} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm italic text-sm">
                              <option value="new_order">Nuevo pedido</option>
                              <option value="new_customer">Nuevo cliente</option>
                              <option value="new_product">Nuevo producto</option>
                              <option value="low_stock">Stock bajo</option>
                              <option value="payment_received">Pago recibido</option>
                            </select>
                          </div>

                          {(automationForm.trigger === "low_stock") && (
                            <div>
                              <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Umbral de stock mínimo</label>
                              <input type="number" placeholder="Ej. 5" value={automationForm.triggerConfig.stockThreshold ?? 5} onChange={e => setAutomationForm({...automationForm, triggerConfig: { ...automationForm.triggerConfig, stockThreshold: parseInt(e.target.value) || 5 }})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                            </div>
                          )}

                          <div>
                            <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Acción</label>
                            <select value={automationForm.actionType} onChange={e => setAutomationForm({...automationForm, actionType: e.target.value, actionConfig: {} })} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm italic text-sm">
                              <optgroup label="Generales">
                                <option value="send_notification">Notificación en app</option>
                                <option value="webhook">Webhook (HTTP request)</option>
                              </optgroup>
                              <optgroup label="Integraciones">
                                <option value="ai_generate">IA Generar texto (OpenAI/Anthropic)</option>
                                <option value="send_telegram">Enviar a Telegram</option>
                                <option value="send_discord">Enviar a Discord</option>
                                <option value="send_slack">Enviar a Slack</option>
                                <option value="send_whatsapp">Enviar WhatsApp</option>
                                <option value="send_sms">Enviar SMS (Twilio)</option>
                                <option value="post_to_social">Publicar en redes sociales</option>
                              </optgroup>
                            </select>
                          </div>

                          {automationForm.actionType === "send_notification" && (
                            <div>
                              <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Mensaje de notificación</label>
                              <input type="text" placeholder="Ej. ¡Nuevo pedido recibido!" value={automationForm.actionConfig.message || ""} onChange={e => setAutomationForm({...automationForm, actionConfig: { ...automationForm.actionConfig, message: e.target.value }})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                            </div>
                          )}

                          {automationForm.actionType === "webhook" && (
                            <div>
                              <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">URL del Webhook</label>
                              <input type="url" placeholder="https://ejemplo.com/webhook" value={automationForm.actionConfig.webhookUrl || ""} onChange={e => setAutomationForm({...automationForm, actionConfig: { ...automationForm.actionConfig, webhookUrl: e.target.value }})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                            </div>
                          )}

                          {automationForm.actionType === "ai_generate" && (
                            <div>
                              <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Prompt / Instrucción</label>
                              <textarea placeholder="Ej. Genera un mensaje de bienvenida para un nuevo cliente..." value={automationForm.actionConfig.prompt || ""} onChange={e => setAutomationForm({...automationForm, actionConfig: { ...automationForm.actionConfig, prompt: e.target.value }})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all resize-none h-24 mt-1 text-sm" />
                              <div className="mt-2">
                                <label className="text-[8px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Modelo</label>
                                <select value={automationForm.actionConfig.model || "gpt-4o-mini"} onChange={e => setAutomationForm({...automationForm, actionConfig: { ...automationForm.actionConfig, model: e.target.value }})} className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 italic text-xs">
                                  <option value="gpt-4o-mini">GPT-4o Mini (rápido)</option>
                                  <option value="gpt-4o">GPT-4o (potente)</option>
                                  <option value="claude-3-haiku">Claude 3 Haiku</option>
                                  <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {automationForm.actionType === "send_telegram" && (
                            <div>
                              <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Chat ID</label>
                              <input type="text" placeholder="Ej. -1001234567890" value={automationForm.actionConfig.chatId || ""} onChange={e => setAutomationForm({...automationForm, actionConfig: { ...automationForm.actionConfig, chatId: e.target.value }})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                              <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest mt-3 block">Mensaje</label>
                              <textarea placeholder="Ej. ¡Nuevo pedido recibido!" value={automationForm.actionConfig.message || ""} onChange={e => setAutomationForm({...automationForm, actionConfig: { ...automationForm.actionConfig, message: e.target.value }})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all resize-none h-20 mt-1 text-sm" />
                            </div>
                          )}

                          {automationForm.actionType === "send_discord" && (
                            <div>
                              <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Mensaje</label>
                              <textarea placeholder="Ej. ¡Nuevo pedido recibido!" value={automationForm.actionConfig.message || ""} onChange={e => setAutomationForm({...automationForm, actionConfig: { ...automationForm.actionConfig, message: e.target.value }})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all resize-none h-20 mt-1 text-sm" />
                            </div>
                          )}

                          {automationForm.actionType === "send_slack" && (
                            <>
                              <div>
                                <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Canal</label>
                                <input type="text" placeholder="Ej. #general" value={automationForm.actionConfig.channel || ""} onChange={e => setAutomationForm({...automationForm, actionConfig: { ...automationForm.actionConfig, channel: e.target.value }})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                              </div>
                              <div>
                                <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Mensaje</label>
                                <textarea placeholder="Ej. ¡Nuevo pedido recibido!" value={automationForm.actionConfig.message || ""} onChange={e => setAutomationForm({...automationForm, actionConfig: { ...automationForm.actionConfig, message: e.target.value }})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all resize-none h-20 mt-1 text-sm" />
                              </div>
                            </>
                          )}

                          {automationForm.actionType === "send_whatsapp" && (
                            <>
                              <div>
                                <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Número de destino</label>
                                <input type="text" placeholder="Ej. 521234567890" value={automationForm.actionConfig.to || ""} onChange={e => setAutomationForm({...automationForm, actionConfig: { ...automationForm.actionConfig, to: e.target.value }})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                              </div>
                              <div>
                                <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Mensaje</label>
                                <textarea placeholder="Ej. ¡Gracias por tu compra!" value={automationForm.actionConfig.message || ""} onChange={e => setAutomationForm({...automationForm, actionConfig: { ...automationForm.actionConfig, message: e.target.value }})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all resize-none h-20 mt-1 text-sm" />
                              </div>
                            </>
                          )}

                          {automationForm.actionType === "send_sms" && (
                            <>
                              <div>
                                <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Número origen (Twilio)</label>
                                <input type="text" placeholder="Ej. +15017122661" value={automationForm.actionConfig.from || ""} onChange={e => setAutomationForm({...automationForm, actionConfig: { ...automationForm.actionConfig, from: e.target.value }})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                              </div>
                              <div>
                                <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Número destino</label>
                                <input type="text" placeholder="Ej. +521234567890" value={automationForm.actionConfig.to || ""} onChange={e => setAutomationForm({...automationForm, actionConfig: { ...automationForm.actionConfig, to: e.target.value }})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                              </div>
                              <div>
                                <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Mensaje</label>
                                <textarea placeholder="Ej. Tu pedido está en camino" value={automationForm.actionConfig.message || ""} onChange={e => setAutomationForm({...automationForm, actionConfig: { ...automationForm.actionConfig, message: e.target.value }})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all resize-none h-20 mt-1 text-sm" />
                              </div>
                            </>
                          )}

                          {automationForm.actionType === "post_to_social" && (
                            <>
                              <div>
                                <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Texto de la publicación</label>
                                <textarea placeholder="Ej. ¡Nuevo producto disponible!" value={automationForm.actionConfig.message || ""} onChange={e => setAutomationForm({...automationForm, actionConfig: { ...automationForm.actionConfig, message: e.target.value }})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all resize-none h-20 mt-1 text-sm" />
                              </div>
                              <div>
                                <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">URL (opcional)</label>
                                <input type="url" placeholder="https://tutienda.com/producto" value={automationForm.actionConfig.url || ""} onChange={e => setAutomationForm({...automationForm, actionConfig: { ...automationForm.actionConfig, url: e.target.value }})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                              </div>
                            </>
                          )}

                          <button onClick={() => {
                            if (!automationForm.name) return;
                            let newAutomations;
                            if (editingAutomation) {
                              newAutomations = automations.map(a => a.id === editingAutomation.id ? { ...a, name: automationForm.name, trigger: automationForm.trigger, actionType: automationForm.actionType, actionConfig: automationForm.actionConfig, triggerConfig: automationForm.triggerConfig } : a);
                            } else {
                              newAutomations = [...automations, { id: Date.now(), name: automationForm.name, trigger: automationForm.trigger, actionType: automationForm.actionType, actionConfig: automationForm.actionConfig, triggerConfig: automationForm.triggerConfig, enabled: true, createdAt: new Date().toISOString() }];
                            }
                            setAutomations(newAutomations);
                            persistStore(undefined, undefined, undefined, undefined, newAutomations);
                            setShowAddAutomation(false);
                            setEditingAutomation(null);
                          }} disabled={!automationForm.name || (automationForm.actionType === "webhook" && !automationForm.actionConfig.webhookUrl) || (automationForm.actionType === "send_telegram" && !automationForm.actionConfig.chatId) || (automationForm.actionType === "send_slack" && !automationForm.actionConfig.channel) || (automationForm.actionType === "send_whatsapp" && !automationForm.actionConfig.to) || (automationForm.actionType === "send_sms" && (!automationForm.actionConfig.from || !automationForm.actionConfig.to))} className="w-full py-4 md:py-5 bg-red-600 text-white rounded-2xl font-black italic text-sm md:text-base hover:bg-red-700 transition-all shadow-xl disabled:opacity-50">
                            {editingAutomation ? "ACTUALIZAR REGLA" : "CREAR REGLA"}
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </main>
        </div>

        {/* Settings Modal */}
        <AnimatePresence>
          {showSettings && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-center justify-center p-4 md:p-6">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-lg bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-3xl relative overflow-hidden">
                <button onClick={() => setShowSettings(false)} className="absolute top-4 md:top-8 right-4 md:right-8 p-1 hover:bg-zinc-100 rounded-lg"><X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></button>

                <div className="text-center mb-6 md:mb-8">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-red-50 text-red-600 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                    {editingStore ? <Edit3 className="w-6 h-6 md:w-8 md:h-8" /> : <Settings className="w-6 h-6 md:w-8 md:h-8" />}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black italic text-zinc-950 uppercase tracking-tighter">
                    {editingStore ? "Editar Empresa" : "Configuración"}
                  </h3>
                  <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2 italic">
                    {editingStore ? "Actualiza los datos de tu negocio" : userStore?.name || "Mi Empresa"}
                  </p>
                </div>

                {!editingStore ? (
                  <div className="space-y-4 md:space-y-6">
                    <div className="bg-zinc-50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-zinc-100 space-y-3 md:space-y-4">
                      {(userStore?.image || settingsForm.image) && (
                        <div className="flex justify-center mb-2">
                          <img src={userStore?.image || settingsForm.image} alt={userStore?.name} className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border border-zinc-200 shadow-sm" />
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic">Nombre</span>
                        <span className="text-xs md:text-sm font-black italic text-zinc-950 text-right">{userStore?.name}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic">Tipo</span>
                        <span className="text-xs md:text-sm font-black italic text-zinc-950">{userStore?.typeLabel || userStore?.type}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic">Industria</span>
                        <span className="text-xs md:text-sm font-black italic text-zinc-950">{userStore?.industry}</span>
                      </div>
                      {userStore?.desc && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic">Descripción</span>
                          <span className="text-xs md:text-sm font-black italic text-zinc-950 text-right max-w-[140px] md:max-w-[200px]">{userStore.desc}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-3 md:p-4 bg-zinc-50 rounded-xl md:rounded-2xl border border-zinc-100 gap-2">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <Globe className="w-4 h-4 md:w-5 md:h-5 text-zinc-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[11px] md:text-xs font-black italic text-zinc-950 truncate">Tienda Pública</p>
                          {userStore?.slug && (
                            <button onClick={() => { navigator.clipboard.writeText(window.location.origin + "/s/" + userStore.slug); showToast("URL copiada", "success"); }} className="flex items-center gap-1 text-[7px] md:text-[8px] font-bold text-zinc-400 italic hover:text-red-600 transition-colors truncate">
                              /s/{userStore.slug} <Copy className="w-2.5 h-2.5 md:w-3 md:h-3 shrink-0" />
                            </button>
                          )}
                          {!userStore?.slug && (
                            <p className="text-[7px] md:text-[8px] font-bold text-zinc-400 italic">Generando slug...</p>
                          )}
                        </div>
                      </div>
                      <button onClick={async () => { const v = !publicVisible; setPublicVisible(v); try { await onEditStore?.(userStore?._id || userStore?.id, { isPublic: v }); showToast(v ? "✅ Tienda pública activada" : "Tienda privada", "success"); } catch { setPublicVisible(!v); showToast("Error al actualizar", "error"); } }} className={cn("px-3 md:px-4 py-1.5 md:py-2 rounded-xl font-black text-[8px] md:text-[9px] italic uppercase transition-all shrink-0", publicVisible ? "bg-emerald-50 text-emerald-600" : "bg-zinc-200 text-zinc-400")}>
                        {publicVisible ? "ACTIVO" : "INACTIVO"}
                      </button>
                    </div>
                    {publicVisible && (
                      <div className="flex items-center justify-between p-3 md:p-4 bg-zinc-50 rounded-xl md:rounded-2xl border border-zinc-100 gap-2">
                        <div className="flex items-center gap-2 md:gap-3 min-w-0">
                          <Bot className="w-4 h-4 md:w-5 md:h-5 text-zinc-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] md:text-xs font-black italic text-zinc-950 truncate">IA Pública</p>
                            <p className="text-[7px] md:text-[8px] font-bold text-zinc-400 italic truncate">Chat IA visible en la página pública</p>
                          </div>
                        </div>
                        <button onClick={async () => { const v = !publicAIEnabled; setPublicAIEnabled(v); try { await onEditStore?.(userStore?._id || userStore?.id, { publicAI: v }); showToast(v ? "✅ IA pública activada" : "IA pública desactivada", "success"); } catch { setPublicAIEnabled(!v); showToast("Error al actualizar", "error"); } }} className={cn("px-3 md:px-4 py-1.5 md:py-2 rounded-xl font-black text-[8px] md:text-[9px] italic uppercase transition-all shrink-0", publicAIEnabled ? "bg-emerald-50 text-emerald-600" : "bg-zinc-200 text-zinc-400")}>
                          {publicAIEnabled ? "ACTIVO" : "INACTIVO"}
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                      <button onClick={async () => { try { await onEditStore?.(userStore?._id || userStore?.id, { isPublic: publicVisible, publicAI: publicAIEnabled }); showToast("✅ Configuración guardada", "success"); } catch { showToast("Error al guardar", "error"); } }} className="w-full py-3 md:py-4 bg-emerald-600 text-white rounded-xl md:rounded-2xl font-black italic text-[9px] md:text-xs hover:bg-emerald-700 transition-all shadow-xl">
                        GUARDAR
                      </button>
                      <button onClick={() => setEditingStore(true)} className="w-full py-3 md:py-4 bg-red-600 text-white rounded-xl md:rounded-2xl font-black italic text-[11px] md:text-sm hover:bg-red-700 transition-all shadow-xl">
                        EDITAR
                      </button>
                      <button onClick={() => setConfirmDelete(true)} className="w-full py-3 md:py-4 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl md:rounded-2xl font-black italic text-[11px] md:text-sm hover:bg-rose-100 transition-all">
                        ELIMINAR
                      </button>
                    </div>
                    {confirmDelete && (
                      <div className="bg-rose-50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-rose-200 space-y-3 md:space-y-4 text-center">
                        <p className="text-xs md:text-sm font-black italic text-rose-700">¿Eliminar tu empresa? Esta acción no se puede deshacer.</p>
                        <div className="flex gap-3 md:gap-4 justify-center">
                          <button onClick={() => setConfirmDelete(false)} className="px-5 md:px-8 py-2.5 md:py-3 bg-white text-zinc-700 rounded-xl font-black text-[10px] md:text-xs italic border border-zinc-200">
                            CANCELAR
                          </button>
                          <button onClick={() => { onDeleteStore?.(userStore?._id || userStore?.id); setShowSettings(false); }} className="px-5 md:px-8 py-2.5 md:py-3 bg-rose-600 text-white rounded-xl font-black text-[10px] md:text-xs italic hover:bg-rose-700">
                            ELIMINAR
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 md:space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Nombre de la empresa</label>
                      <input type="text" placeholder="Ej. Mi Tienda Online" value={settingsForm.name} onChange={e => setSettingsForm({...settingsForm, name: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Industria</label>
                      <select value={settingsForm.industry} onChange={e => setSettingsForm({...settingsForm, industry: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all italic text-sm">
                        <option value="tecnologia">Tecnología</option>
                        <option value="comercio">Comercio</option>
                        <option value="servicios">Servicios</option>
                        <option value="salud">Salud</option>
                        <option value="educacion">Educación</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Descripción (opcional)</label>
                      <textarea placeholder="Describe tu negocio..." value={settingsForm.desc} onChange={e => setSettingsForm({...settingsForm, desc: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all resize-none h-20 md:h-24 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Logo / Imagen de la tienda</label>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-xl border border-zinc-200 bg-zinc-50 overflow-hidden flex items-center justify-center shrink-0">
                          {settingsForm.image ? (
                            <img src={settingsForm.image} alt="Store" className="w-full h-full object-cover" />
                          ) : (
                            <Store className="w-6 h-6 text-zinc-300" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <input type="text" placeholder="https://ejemplo.com/logo.png" value={settingsForm.image} onChange={e => setSettingsForm({...settingsForm, image: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs" />
                          <div className="flex gap-2">
                            <label className="cursor-pointer px-3 py-1.5 bg-zinc-100 text-zinc-700 rounded-lg text-[9px] font-black italic hover:bg-zinc-200 transition-all">
                              {storeImageUploading ? "SUBINDO..." : "SUBIR ARCHIVO"}
                              <input type="file" accept="image/*" className="hidden" disabled={storeImageUploading} onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setStoreImageUploading(true);
                                try {
                                  const fd = new FormData();
                                  fd.append("file", file);
                                  const res = await fetch("/api/upload", { method: "POST", body: fd });
                                  const data = await res.json();
                                  if (data.url) setSettingsForm(prev => ({ ...prev, image: data.url }));
                                } catch { showToast("Error al subir imagen", "error"); }
                                finally { setStoreImageUploading(false); }
                              }} />
                            </label>
                            {settingsForm.image && (
                              <button onClick={() => setSettingsForm(prev => ({ ...prev, image: "" }))} className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black italic hover:bg-rose-100 transition-all">
                                ELIMINAR
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Slug (URL pública)</label>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] md:text-[9px] font-bold text-zinc-400 italic whitespace-nowrap">/s/</span>
                        <input type="text" placeholder="mi-tienda" value={settingsForm.slug} onChange={e => setSettingsForm({...settingsForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "")})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all font-mono text-sm" />
                      </div>
                      <p className="text-[7px] md:text-[8px] font-bold text-zinc-400 italic ml-1">/s/{settingsForm.slug || "mi-tienda"}</p>
                    </div>
                    <div className="flex items-center justify-between p-3 md:p-4 bg-zinc-50 rounded-xl md:rounded-2xl border border-zinc-100 gap-2">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <Globe className="w-4 h-4 md:w-5 md:h-5 text-zinc-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[11px] md:text-xs font-black italic text-zinc-950 truncate">Tienda Pública</p>
                          {userStore?.slug && (
                            <button onClick={() => { navigator.clipboard.writeText(window.location.origin + "/s/" + userStore.slug); showToast("URL copiada", "success"); }} className="flex items-center gap-1 text-[7px] md:text-[8px] font-bold text-zinc-400 italic hover:text-red-600 transition-colors truncate">
                              /s/{userStore.slug} <Copy className="w-2.5 h-2.5 md:w-3 md:h-3 shrink-0" />
                            </button>
                          )}
                          {!userStore?.slug && (
                            <p className="text-[7px] md:text-[8px] font-bold text-zinc-400 italic">Generando slug...</p>
                          )}
                        </div>
                      </div>
                      <button onClick={async () => { const v = !publicVisible; setPublicVisible(v); try { await onEditStore?.(userStore?._id || userStore?.id, { isPublic: v }); } catch (e: any) { setPublicVisible(!v); showToast(e.message || "Error al actualizar", "error"); } }} className={cn("px-3 md:px-4 py-1.5 md:py-2 rounded-xl font-black text-[8px] md:text-[9px] italic uppercase transition-all shrink-0", publicVisible ? "bg-emerald-50 text-emerald-600" : "bg-zinc-200 text-zinc-400")}>
                        {publicVisible ? "ACTIVO" : "INACTIVO"}
                      </button>
                    </div>
                    {publicVisible && (
                      <div className="flex items-center justify-between p-3 md:p-4 bg-zinc-50 rounded-xl md:rounded-2xl border border-zinc-100 gap-2">
                        <div className="flex items-center gap-2 md:gap-3 min-w-0">
                          <Bot className="w-4 h-4 md:w-5 md:h-5 text-zinc-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] md:text-xs font-black italic text-zinc-950 truncate">IA Pública</p>
                            <p className="text-[7px] md:text-[8px] font-bold text-zinc-400 italic truncate">Chat IA visible en la página pública</p>
                          </div>
                        </div>
                        <button onClick={async () => { const v = !publicAIEnabled; setPublicAIEnabled(v); try { await onEditStore?.(userStore?._id || userStore?.id, { publicAI: v }); } catch (e: any) { setPublicAIEnabled(!v); showToast(e.message || "Error al actualizar", "error"); } }} className={cn("px-3 md:px-4 py-1.5 md:py-2 rounded-xl font-black text-[8px] md:text-[9px] italic uppercase transition-all shrink-0", publicAIEnabled ? "bg-emerald-50 text-emerald-600" : "bg-zinc-200 text-zinc-400")}>
                          {publicAIEnabled ? "ACTIVO" : "INACTIVO"}
                        </button>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <button onClick={() => setEditingStore(false)} className="w-full py-3 md:py-4 bg-zinc-50 text-zinc-600 rounded-xl md:rounded-2xl font-black italic text-[11px] md:text-sm hover:bg-zinc-100 transition-all">
                        CANCELAR
                      </button>
                      <button onClick={async () => { try { await onEditStore?.(userStore?._id || userStore?.id, { name: settingsForm.name, desc: settingsForm.desc, industry: settingsForm.industry, slug: settingsForm.slug, image: settingsForm.image, isPublic: publicVisible, publicAI: publicAIEnabled }); setShowSettings(false); } catch (e: any) { showToast(e.message || "Error al guardar", "error"); } }} disabled={!settingsForm.name} className="w-full py-3 md:py-4 bg-red-600 text-white rounded-xl md:rounded-2xl font-black italic text-[11px] md:text-sm hover:bg-red-700 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4" /> GUARDAR
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StripeConnectPanel({ storeId, userStore, userEmail }: { storeId: string | number; userStore: any; userEmail: string }) {
  const [loading, setLoading] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(userStore?.stripeAccountId || null);
  const [onboarded, setOnboarded] = useState(false);
  const [paymentsEnabled, setPaymentsEnabled] = useState(userStore?.paymentsEnabled || false);
  const [feePercent, setFeePercent] = useState(userStore?.platformFeePercent ?? 5);
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [gatewayState, setGatewayState] = useState<Record<string, boolean>>({
    stripe: true,
    crypto: userStore?.paymentMethods?.crypto ?? false,
    paypal: userStore?.paymentMethods?.paypal ?? false,
    transfer: userStore?.paymentMethods?.transfer ?? false,
  });
  const [savingGateway, setSavingGateway] = useState(false);
  const { showToast } = useToast();

  const fetchPayments = async () => {
    try {
      const res = await fetch(`/api/stripe/payments?storeId=${storeId}`);
      const data = await res.json();
      if (data.payments) setPayments(data.payments);
      if (data.stats) setStats(data.stats);
    } catch {}
  };

  useEffect(() => {
    if (accountId) {
      fetchPayments();
      checkStatus();
    }
  }, [accountId]);

  const checkStatus = async () => {
    setCheckingStatus(true);
    try {
      const res = await fetch("/api/stripe/account-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId }),
      });
      const data = await res.json();
      setOnboarded(data.onboarded);
    } catch {} finally {
      setCheckingStatus(false);
    }
  };

  const createAccount = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, email: userEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Error al crear cuenta Stripe", "error");
        return;
      }
      if (data.accountId) {
        setAccountId(data.accountId);
        const linkRes = await fetch("/api/stripe/onboarding-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeId }),
        });
        const linkData = await linkRes.json();
        if (linkData.url) {
          window.open(linkData.url, "_blank");
        }
      }
    } catch (e: any) {
      showToast("Error de conexión al crear cuenta Stripe", "error");
    } finally {
      setLoading(false);
    }
  };

  const getOnboardingLink = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/onboarding-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId }),
      });
      const data = await res.json();
      if (data.url) window.open(data.url, "_blank");
    } catch {} finally {
      setLoading(false);
    }
  };

  const togglePayments = async () => {
    const newVal = !paymentsEnabled;
    try {
      const res = await fetch("/api/stripe/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, paymentsEnabled: newVal }),
      });
      const data = await res.json();
      if (data.paymentsEnabled !== undefined) setPaymentsEnabled(data.paymentsEnabled);
    } catch {}
  };

  const updateFee = async () => {
    try {
      await fetch("/api/stripe/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, platformFeePercent: feePercent }),
      });
    } catch {}
  };

  const disconnectStripe = async () => {
    if (!confirm("¿Desconectar Stripe? Se eliminará la cuenta conectada y se desactivarán los pagos.")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId }),
      });
      const data = await res.json();
      if (data.success) {
        setAccountId(null);
        setOnboarded(false);
        setPaymentsEnabled(false);
        showToast("Stripe desconectado", "success");
      }
    } catch {
      showToast("Error al desconectar Stripe", "error");
    } finally {
      setLoading(false);
    }
  };

  const saveGatewayConfig = async () => {
    setSavingGateway(true);
    try {
      await fetch(`/api/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethods: gatewayState }),
      });
      showToast("Configuración de pagos guardada", "success");
    } catch {
      showToast("Error al guardar configuración", "error");
    } finally {
      setSavingGateway(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">
          Pagos <span className="text-red-600">Integrados</span>
        </h3>
        <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase italic", paymentsEnabled ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-400")}>
          {paymentsEnabled ? "Activo" : "Inactivo"}
        </span>
      </div>

      {/* Stripe Connect Section */}
      <div className="bg-zinc-50 max-[400px]:p-5 p-8 max-[400px]:rounded-[2rem] rounded-[3rem] border border-zinc-100 space-y-5 md:space-y-6">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="p-2 md:p-3 bg-red-50 rounded-xl md:rounded-2xl text-red-600">
            <CreditCard className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h4 className="max-[400px]:text-base text-lg font-black italic text-zinc-950 uppercase tracking-tighter">Stripe Connect</h4>
            <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 italic">Recibe pagos de tus clientes con Stripe</p>
          </div>
        </div>

        {!accountId ? (
          <div className="space-y-4">
            <p className="text-xs md:text-sm text-zinc-500 font-medium">Conecta tu cuenta Stripe Express para empezar a recibir pagos de forma segura.</p>
            <motion.button whileTap={{ scale: 0.95 }} onClick={createAccount} disabled={loading} className="w-full md:w-auto px-6 md:px-8 py-3.5 md:py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] md:text-xs italic hover:bg-red-700 transition-all shadow-xl flex items-center justify-center gap-3">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              CONECTAR CON STRIPE
            </motion.button>
          </div>
        ) : (
          <div className="space-y-5 md:space-y-6">
            <div className="bg-white max-[400px]:p-5 p-6 rounded-2xl md:rounded-3xl border border-zinc-100 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-black text-zinc-400 uppercase italic">Cuenta Stripe</span>
                <span className="text-[10px] md:text-xs font-mono text-zinc-500 truncate max-w-[120px] md:max-w-[200px]">{accountId}</span>
              </div>

              {/* Status indicator */}
              <div className="bg-zinc-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-zinc-100">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    {checkingStatus ? (
                      <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin text-zinc-400 shrink-0" />
                    ) : onboarded ? (
                      <div className="w-4 h-4 md:w-5 md:h-5 bg-emerald-500 rounded-full flex items-center justify-center shrink-0"><CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-white" /></div>
                    ) : (
                      <div className="w-4 h-4 md:w-5 md:h-5 bg-amber-500 rounded-full flex items-center justify-center animate-pulse shrink-0"><div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full" /></div>
                    )}
                    <div className="min-w-0">
                      <p className={cn("text-xs md:text-sm font-black italic truncate", onboarded ? "text-emerald-700" : "text-amber-700")}>
                        {checkingStatus ? "Verificando..." : onboarded ? "Conexión exitosa" : "Registro pendiente"}
                      </p>
                      <p className="text-[8px] md:text-[9px] font-bold text-zinc-400 italic truncate">
                        {onboarded ? "Tu cuenta Stripe está activa y lista para recibir pagos" : "Completa el registro en Stripe para activar los pagos"}
                      </p>
                    </div>
                  </div>
                  <span className={cn("px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black italic whitespace-nowrap shrink-0", onboarded ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                    {onboarded ? "COMPLETO" : "PENDIENTE"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 md:gap-3">
                {!onboarded && (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={getOnboardingLink} disabled={loading} className="w-full py-3 md:py-4 bg-red-600 text-white rounded-2xl font-black text-[9px] md:text-xs italic hover:bg-red-700 transition-all shadow-xl flex items-center justify-center gap-2 md:gap-3 col-span-2">
                    {loading ? <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                    COMPLETAR REGISTRO
                  </motion.button>
                )}

                {onboarded && (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={getOnboardingLink} className="w-full py-3 md:py-4 bg-zinc-950 text-white rounded-2xl font-black text-[9px] md:text-xs italic hover:bg-zinc-800 transition-all shadow-xl flex items-center justify-center gap-2 md:gap-3">
                    <ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    IR A STRIPE
                  </motion.button>
                )}

                <motion.button whileTap={{ scale: 0.95 }} onClick={disconnectStripe} disabled={loading} className="w-full py-3 md:py-4 bg-rose-50 text-rose-600 border border-rose-200 rounded-2xl font-black text-[9px] md:text-xs italic hover:bg-rose-100 transition-all flex items-center justify-center gap-2">
                  <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  DESCONECTAR
                </motion.button>
              </div>
            </div>

            {/* Payment Toggle */}
            {onboarded && (
              <>
                <div className="bg-white max-[400px]:p-5 p-6 rounded-2xl md:rounded-3xl border border-zinc-100 space-y-3 md:space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      {paymentsEnabled ? <ToggleRight className="w-5 h-5 md:w-6 md:h-6 text-emerald-600 shrink-0" /> : <ToggleLeft className="w-5 h-5 md:w-6 md:h-6 text-zinc-300 shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-[11px] md:text-sm font-black italic text-zinc-950 uppercase tracking-tighter truncate">Pagos Integrados</p>
                        <p className="text-[8px] md:text-[9px] font-bold text-zinc-400 italic truncate">{paymentsEnabled ? "Tus clientes pueden pagar con tarjeta" : "Activa para recibir pagos en tu tienda"}</p>
                      </div>
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={togglePayments} className={cn("px-4 md:px-6 py-2 md:py-3 rounded-2xl font-black text-[9px] md:text-xs italic transition-all shadow-md shrink-0", paymentsEnabled ? "bg-emerald-600 text-white" : "bg-zinc-200 text-zinc-500")}>
                      {paymentsEnabled ? "ACTIVO" : "INACTIVO"}
                    </motion.button>
                  </div>
                </div>

                {/* Fee Config */}
                <div className="bg-white max-[400px]:p-5 p-6 rounded-2xl md:rounded-3xl border border-zinc-100 space-y-3 md:space-y-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Percent className="w-4 h-4 md:w-5 md:h-5 text-red-600 shrink-0" />
                    <p className="text-[11px] md:text-sm font-black italic text-zinc-950 uppercase tracking-tighter">Comisión de Plataforma</p>
                  </div>
                  <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                    <input
                      type="number"
                      value={feePercent}
                      onChange={(e) => setFeePercent(parseFloat(e.target.value) || 0)}
                      className="w-20 md:w-24 bg-zinc-50 p-2.5 md:p-3 rounded-xl border border-zinc-100 outline-none font-black text-base md:text-lg text-center focus:border-red-200 transition-all"
                      min="0"
                      max="100"
                      step="0.5"
                    />
                    <span className="text-xs md:text-sm font-black italic text-zinc-400">%</span>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={updateFee} className="px-5 md:px-6 py-2.5 md:py-3 bg-zinc-950 text-white rounded-2xl font-black text-[9px] md:text-xs italic hover:bg-zinc-800 transition-all">
                      ACTUALIZAR
                    </motion.button>
                  </div>
                  <p className="text-[8px] md:text-[9px] text-zinc-400 italic">Porcentaje que Jandosoft retiene por cada transacción.</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Payment Gateways Configuration */}
      <div className="bg-zinc-50 max-[400px]:p-5 p-8 max-[400px]:rounded-[2rem] rounded-[3rem] border border-zinc-100 space-y-5 md:space-y-6">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="p-2 md:p-3 bg-amber-50 rounded-xl md:rounded-2xl text-amber-600">
            <Wallet className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h4 className="max-[400px]:text-base text-lg font-black italic text-zinc-950 uppercase tracking-tighter">Métodos de Pago</h4>
            <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 italic">Selecciona los métodos que tus clientes pueden usar</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <GatewayToggle
            name="Stripe"
            icon={<CreditCard className="w-5 h-5" />}
            desc="Tarjetas de crédito/débito"
            enabled={gatewayState.stripe}
            locked={true}
          />
          <GatewayToggle
            name="Crypto"
            icon={<Bitcoin className="w-5 h-5" />}
            desc="Bitcoin, ETH, USDT vía NowPayments"
            enabled={gatewayState.crypto}
            locked={false}
            onToggle={() => setGatewayState(s => ({ ...s, crypto: !s.crypto }))}
          />
          <GatewayToggle
            name="PayPal"
            icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z"/><path d="M19.178 6.534c-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437z"/><path d="M18.694 6.088c-.84 4.318-3.744 5.81-7.468 5.81H9.06a.666.666 0 0 0-.656.563L7.2 18.729l-.443 2.812a.4.4 0 0 0 .395.463h2.602a.574.574 0 0 0 .566-.488l.022-.115.448-2.837.032-.175a.574.574 0 0 1 .566-.488h.356c2.29 0 4.084-.93 4.608-3.628.215-1.116.104-2.047-.437-2.682a2.364 2.364 0 0 0-.361-.37c.134-.013.28-.02.437-.02h1.255c.567 0 1.07.382 1.16.949z"/></svg>}
            desc="PayPal, tarjetas y saldo"
            enabled={gatewayState.paypal}
            locked={false}
            onToggle={() => setGatewayState(s => ({ ...s, paypal: !s.paypal }))}
          />
          <GatewayToggle
            name="Transferencia"
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>}
            desc="Transferencia bancaria directa"
            enabled={gatewayState.transfer}
            locked={false}
            onToggle={() => setGatewayState(s => ({ ...s, transfer: !s.transfer }))}
          />
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={saveGatewayConfig} disabled={savingGateway} className="w-full md:w-auto px-6 md:px-8 py-3 md:py-3 bg-zinc-950 text-white rounded-2xl font-black text-[10px] md:text-xs italic hover:bg-zinc-800 transition-all shadow-md flex items-center justify-center gap-2">
          {savingGateway ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          GUARDAR CONFIGURACIÓN
        </motion.button>
      </div>

      {/* Payments List */}
      <div className="space-y-4">
        <h4 className="max-[400px]:text-lg text-xl font-black italic text-zinc-950 uppercase tracking-tighter">
          Transacciones <span className="text-red-600">({payments.length})</span>
        </h4>

        {stats && (
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <div className="bg-white max-[400px]:p-3 p-5 max-[400px]:rounded-[1.5rem] rounded-[2rem] border border-zinc-100 shadow-sm space-y-1 md:space-y-2">
              <p className="text-[7px] md:text-[9px] font-black text-zinc-400 uppercase italic">Ingresos</p>
              <p className="max-[400px]:text-lg text-2xl font-black italic text-zinc-950 truncate">${stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-white max-[400px]:p-3 p-5 max-[400px]:rounded-[1.5rem] rounded-[2rem] border border-zinc-100 shadow-sm space-y-1 md:space-y-2">
              <p className="text-[7px] md:text-[9px] font-black text-zinc-400 uppercase italic">Comisiones</p>
              <p className="max-[400px]:text-lg text-2xl font-black italic text-red-600 truncate">${stats.totalFees.toFixed(2)}</p>
            </div>
            <div className="bg-white max-[400px]:p-3 p-5 max-[400px]:rounded-[1.5rem] rounded-[2rem] border border-zinc-100 shadow-sm space-y-1 md:space-y-2">
              <p className="text-[7px] md:text-[9px] font-black text-zinc-400 uppercase italic">Neto</p>
              <p className="max-[400px]:text-lg text-2xl font-black italic text-emerald-600 truncate">${stats.totalNet.toFixed(2)}</p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {payments.map((p: any) => (
            <div key={p._id} className="flex items-center justify-between max-[400px]:p-3.5 p-5 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-red-200 transition-all">
              <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-xl flex items-center justify-center text-zinc-400 shadow-sm shrink-0">
                  <DollarSign className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-black italic text-xs md:text-sm text-zinc-950 truncate">${p.amount.toFixed(2)}</p>
                  <p className="text-[9px] md:text-[10px] text-zinc-400 font-bold italic truncate">{p.customerEmail || p.customerName || "Anónimo"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 md:gap-6 shrink-0">
                <div className="text-right">
                  <p className={cn("text-[9px] md:text-[10px] font-black italic", p.status === "completed" ? "text-emerald-600" : "text-amber-600")}>
                    {p.status === "completed" ? "Completado" : p.status}
                  </p>
                  <p className="text-[8px] md:text-[9px] text-zinc-400 italic">{new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="text-[9px] md:text-[10px] font-black text-red-400 italic">-${p.platformFee.toFixed(2)}</span>
              </div>
            </div>
          ))}
          {payments.length === 0 && (
            <div className="py-12 md:py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">No hay transacciones aún</div>
          )}
        </div>
      </div>
    </div>
  );
}

function SideBtn({ icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.95 }} onClick={onClick} className={cn("w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black text-xs italic transition-all", active ? "bg-red-600 text-white shadow-lg shadow-red-100" : "text-zinc-500 hover:bg-zinc-100")}>
      {React.cloneElement(icon, { className: "w-4 h-4" })} {label}
    </motion.button>
  );
}

function GatewayToggle({ name, icon, desc, enabled, locked, onToggle }: { name: string; icon: React.ReactNode; desc: string; enabled: boolean; locked: boolean; onToggle?: () => void }) {
  const Component = locked ? 'div' : motion.button;
  const props: any = {};
  if (!locked) {
    props.onClick = onToggle;
    props.whileTap = { scale: 0.97 };
  }
  return (
    <Component {...props} className={cn("flex items-center gap-3 md:gap-4 max-[400px]:p-4 p-5 rounded-2xl border transition-all w-full text-left", enabled ? "bg-white border-emerald-200 shadow-sm" : "bg-zinc-50 border-zinc-100 opacity-70", !locked && "cursor-pointer hover:shadow-md")}>
      <div className={cn("p-2 md:p-2.5 rounded-xl", enabled ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-400")}>
        {typeof icon === 'string' ? icon : icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs md:text-sm font-black italic text-zinc-950">{name}</span>
          {locked && <Lock className="w-3 h-3 text-zinc-300 shrink-0" />}
        </div>
        <p className="text-[8px] md:text-[9px] font-bold text-zinc-400 italic truncate">{desc}</p>
      </div>
      <div className={cn("px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[8px] md:text-[9px] font-black italic whitespace-nowrap shrink-0", enabled ? "bg-emerald-50 text-emerald-600" : "bg-zinc-200 text-zinc-400")}>
        {enabled ? "ACTIVO" : "INACTIVO"}
      </div>
    </Component>
  );
}

const AI_WINDOW_MS = 2.5 * 60 * 60 * 1000;

function BusinessAI({ agentName, store, products, setProducts, customers, setCustomers, orders, setOrders, totalSales, kbEntries, setKbEntries, automations, setAutomations, onPersist, onExecuteAutomations, maxMessages = 999 }: {
  agentName: string;
  store?: any;
  products: any[]; setProducts: any;
  customers: any[]; setCustomers: any;
  orders: any[]; setOrders: any;
  totalSales: number;
  kbEntries: any[]; setKbEntries: any;
  automations: any[]; setAutomations: any;
  onPersist?: (products?: any[], customers?: any[], orders?: any[], knowledgebase?: any[], automations?: any[]) => void;
  onExecuteAutomations?: (trigger: string, context: Record<string, any>) => void;
  maxMessages?: number;
}) {
  const storageKey = `jandosoft_business_ai_${agentName.replace(/[^a-zA-Z0-9]/g, "_")}`;
  const [messages, setMessages] = useState<{ role: string; content: string; timestamp: number }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const voice = useVoiceInput();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [aiContacts, setAiContacts] = useState<any[]>([]);
  const [aiConversations, setAiConversations] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load messaging data for AI context
  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, convRes] = await Promise.all([
          fetch("/api/contacts"),
          fetch("/api/conversations"),
        ]);
        const cData = await cRes.json();
        const convData = await convRes.json();
        setAiContacts(cData.contacts || []);
        setAiConversations(convData.conversations || []);
      } catch {}
    };
    load();
  }, []);

  // Scroll detection
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const threshold = 40;
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
      setIsAtBottom(atBottom);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll only if user is at bottom
  useEffect(() => {
    if (scrollRef.current && isAtBottom) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isAtBottom]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          setLoaded(true);
          return;
        }
      }
    } catch {}
    setMessages([{ role: "bot", content: `¡Hola! Soy el agente IA de ${agentName || "tu negocio"}. Puedo ayudarte a gestionar productos, clientes y pedidos. Solo dime qué necesitas crear, modificar o eliminar.`, timestamp: Date.now() }]);
    setLoaded(true);
  }, [storageKey, agentName]);

  useEffect(() => {
    if (loaded && messages.length > 0) {
      try { localStorage.setItem(storageKey, JSON.stringify(messages)); } catch {}
    }
  }, [messages, loaded, storageKey]);

  const now = Date.now();
  const recentUserMessages = messages.filter(m => m.role === "user" && now - m.timestamp < AI_WINDOW_MS).length;
  const canSend = recentUserMessages < maxMessages;

  useEffect(() => {
    if (voice.transcript) {
      setInput(voice.transcript);
    }
  }, [voice.transcript]);

  const handleAttachFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const content = await readFileAsText(file);
      const msg = formatFileMessage(file.name, content);
      setMessages(prev => [...prev, { role: "user", content: msg, timestamp: Date.now() }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "bot", content: `⚠️ ${err.message}`, timestamp: Date.now() }]);
    }
    e.target.value = "";
  };

  const productsStr = products.map((p: any) => `ID:${p.id} ${p.name} $${p.price} stock:${p.stock}`).join(" | ");
  const customersStr = customers.map((c: any) => `ID:${c.id} ${c.name} ${c.email} ${c.phone}`).join(" | ");
  const ordersStr = orders.map((o: any) => `ID:${o.id} ${o.product} $${o.amount} ${o.status}`).join(" | ");
  const kbStr = kbEntries.map((k: any) => `[${k.category}] ${k.title}: ${k.content.slice(0, 200)}`).join("\n");

  const autoStr = automations.filter((a: any) => a.enabled).map((a: any) => `"${a.name}" (trigger: ${a.trigger}, action: ${a.actionType})`).join(", ");
  const contactsStr = aiContacts.map((c: any) => `${c.contactName} (${c.contactEmail})`).join(", ");
  const storeConfig = store ? `\n\nCONFIGURACIÓN DE LA TIENDA:\n- Tipo: ${store.type || "No definido"}\n- Industria: ${store.industry || "No definida"}\n- Descripción: ${store.desc || "Sin descripción"}\n- Slug: ${store.slug || "Sin slug"}\n- URL pública: ${store.slug ? window.location.origin + "/s/" + store.slug : "N/A"}\n- Tienda pública: ${store.isPublic ? "Sí" : "No"}\n- IA pública: ${store.publicAI ? "Sí" : "No"}\n- Imagen: ${store.image ? "Tiene imagen" : "Sin imagen"}\n- Moneda: ${store.currency || "USD"}\n- Stripe Connect: ${store.stripeAccountId ? "Conectado" : "No conectado"}\n- Pagos habilitados: ${store.paymentsEnabled ? "Sí" : "No"}\n- Comisión de plataforma: ${store.platformFeePercent ?? 5}%` : "";

  const contextInfo = `DATOS ACTUALES:\nProductos (${products.length}): ${productsStr || "ninguno"}\nClientes (${customers.length}): ${customersStr || "ninguno"}\nPedidos (${orders.length}): ${ordersStr || "ninguno"}\nVentas totales: $${totalSales}${storeConfig}\n\nBASE DE CONOCIMIENTO (${kbEntries.length} entradas):\n${kbStr || "No hay entradas en la base de conocimiento."}\n\nAUTOMATIZACIONES ACTIVAS (${automations.filter((a: any) => a.enabled).length}):\n${autoStr || "No hay automatizaciones activas."}\n\nCONTACTOS (${aiContacts.length}): ${contactsStr || "No hay contactos guardados. Puedes añadir contactos con la acción addContact."}\n\nCONVERSACIONES RECIENTES (${aiConversations.length}):\n${aiConversations.map((c: any) => {
    const other = c.participants?.find((p: any) => p.email !== c.lastSenderId) || c.participants?.[0];
    return `- ${other?.name || "Usuario"}: ${c.lastMessage || "Sin mensajes"}`;
  }).join("\n") || "No hay conversaciones."}\n\nPuedes consultar la base de conocimiento, automatizaciones, contactos y conversaciones para responder preguntas del usuario. También puedes sugerir añadir, modificar o eliminar entradas de KB y automatizaciones usando los actions correspondientes. Puedes enviar mensajes a otros usuarios usando la acción sendMessage y añadir contactos con addContact.`;

  const executeActions = (actions: any[]) => {
    let newProducts = [...products];
    let newCustomers = [...customers];
    let newOrders = [...orders];
    let newKbEntries = [...kbEntries];
    let newAutomations = [...automations];
    let result = "";
    let _uid = Date.now();
    const uid = () => ++_uid;
    for (const action of actions) {
      switch (action.type) {
        case "addProduct":
          const priceVal = typeof action.price === "string" ? parseFloat(action.price.replace(/[^0-9.]/g, "")) : Number(action.price) || 0;
          const currencyVal = action.currency || "USD";
          const stockVal = action.stock || 0;
          newProducts = [...newProducts, { id: uid(), name: action.name, price: priceVal, currency: currencyVal, priceUSD: convertToUSD(priceVal, currencyVal), stock: stockVal, images: [] }];
          result += `✅ Producto "${action.name}" creado. `;
          onExecuteAutomations?.("new_product", { productName: action.name, productPrice: priceVal, productStock: stockVal });
          if (stockVal <= 5) onExecuteAutomations?.("low_stock", { productName: action.name, productStock: stockVal });
          break;
        case "deleteProduct":
          newProducts = newProducts.filter((p: any) => p.id !== action.id);
          result += `🗑️ Producto eliminado. `;
          break;
        case "updateProduct":
          newProducts = newProducts.map((p: any) => p.id === action.id ? { ...p, ...action.data } : p);
          result += `✏️ Producto actualizado. `;
          break;
        case "addCustomer":
          newCustomers = [...newCustomers, { id: uid(), name: action.name, email: action.email || "", phone: action.phone || "" }];
          result += `✅ Cliente "${action.name}" registrado. `;
          onExecuteAutomations?.("new_customer", { customerName: action.name, customerEmail: action.email });
          break;
        case "deleteCustomer":
          newCustomers = newCustomers.filter((c: any) => c.id !== action.id);
          result += `🗑️ Cliente eliminado. `;
          break;
        case "addOrder":
          newOrders = [...newOrders, { id: uid(), product: action.product, amount: action.amount, status: action.status || "Pendiente" }];
          result += `✅ Pedido de "${action.product}" creado. `;
          onExecuteAutomations?.("new_order", { orderProduct: action.product, orderAmount: action.amount, orderStatus: action.status });
          break;
        case "deleteOrder":
          newOrders = newOrders.filter((o: any) => o.id !== action.id);
          result += `🗑️ Pedido eliminado. `;
          break;
        case "updateOrder":
          newOrders = newOrders.map((o: any) => o.id === action.id ? { ...o, ...action.data } : o);
          result += `✏️ Pedido actualizado. `;
          break;
        case "addKbEntry":
          newKbEntries = [...newKbEntries, { id: uid(), title: action.title, content: action.content, category: action.category || "general", createdAt: new Date().toISOString() }];
          result += `📚 Entrada "${action.title}" añadida a la base de conocimiento. `;
          break;
        case "deleteKbEntry":
          newKbEntries = newKbEntries.filter((k: any) => k.id !== action.id);
          result += `🗑️ Entrada de conocimiento eliminada. `;
          break;
        case "updateKbEntry":
          newKbEntries = newKbEntries.map((k: any) => k.id === action.id ? { ...k, ...action.data } : k);
          result += `✏️ Entrada de conocimiento actualizada. `;
          break;
        case "addAutomation":
          newAutomations = [...newAutomations, { id: uid(), name: action.name, trigger: action.trigger, actionType: action.actionType, actionConfig: action.actionConfig || {}, triggerConfig: action.triggerConfig || {}, enabled: true, createdAt: new Date().toISOString() }];
          result += `⚡ Automatización "${action.name}" creada. `;
          break;
        case "deleteAutomation":
          newAutomations = newAutomations.filter((a: any) => a.id !== action.id);
          result += `🗑️ Automatización eliminada. `;
          break;
        case "updateAutomation":
          newAutomations = newAutomations.map((a: any) => a.id === action.id ? { ...a, ...action.data } : a);
          result += `✏️ Automatización actualizada. `;
          break;
        case "sendMessage":
          (async () => {
            const to = action.to;
            const content = action.content;
            if (to && content) {
              try {
                const convRes = await fetch("/api/conversations", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ participantEmail: to }),
                });
                const convData = await convRes.json();
                if (convData.conversation) {
                  await fetch(`/api/conversations/${convData.conversation._id}/messages`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content }),
                  });
                  result += `✉️ Mensaje enviado a ${to}. `;
                }
              } catch { result += `⚠️ Error al enviar mensaje a ${to}. `; }
            }
          })();
          break;
        case "addContact":
          (async () => {
            const email = action.email;
            if (email) {
              try {
                const res = await fetch("/api/contacts", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ contactEmail: email }),
                });
                const data = await res.json();
                if (data.contact) result += `👤 Contacto "${email}" añadido. `;
              } catch { result += `⚠️ Error al añadir contacto ${email}. `; }
            }
          })();
          break;
      }
    }
    setProducts(newProducts);
    setCustomers(newCustomers);
    setOrders(newOrders);
    setKbEntries(newKbEntries);
    setAutomations(newAutomations);
    return { result, newProducts, newCustomers, newOrders, newKbEntries, newAutomations };
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !canSend) return;
    const userMsg = { role: "user", content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: `Eres un asistente IA experto en gestión de negocios y en la plataforma Jandosoft. Ayudas al usuario a administrar su negocio "${agentName}" dentro de Jandosoft.

${contextInfo}

IMPORTANTE - ERES EXPERTO EN JANDOSOFT: Puedes dar sugerencias sobre cómo usar las funciones de Jandosoft para mejorar el negocio: configuración de tienda, productos, pagos (Stripe, cripto), integraciones (Telegram, Discord, Slack, WhatsApp, Twilio, redes sociales), automatizaciones, base de conocimiento, campañas de marketing, analíticas, equipo, facturación, planes (Free/Basic/Enterprise), y el builder visual. Usa la configuración de la tienda arriba para dar consejos personalizados.

IMPORTANTE - SOLO PUEDES VER Y MODIFICAR los datos del negocio actual (${agentName}). NO tienes acceso a datos de otros usuarios, otras tiendas, ni información fuera del contexto proporcionado arriba. Si el usuario te pide datos de otros negocios o información que no está en el contexto, debes responder que no tienes acceso a esa información.

Puedes MODIFICAR los datos del negocio actual. Para ello, incluye al final de tu respuesta un bloque JSON con las acciones a ejecutar, usando este formato EXACTO:

\`\`\`json
{"actions":[
  {"type":"addProduct","name":"Nombre","price":100,"stock":5},
  {"type":"deleteProduct","id":123},
  {"type":"updateProduct","id":123,"data":{"name":"Nuevo","price":200,"stock":10}},
  {"type":"addCustomer","name":"Juan","email":"j@e.com","phone":"123"},
  {"type":"deleteCustomer","id":456},
  {"type":"addOrder","product":"Producto","amount":100,"status":"Pagado"},
  {"type":"deleteOrder","id":789},
  {"type":"updateOrder","id":789,"data":{"status":"Enviado","amount":150}},
  {"type":"addKbEntry","title":"Política de devoluciones","content":"Texto completo...","category":"politicas"},
  {"type":"deleteKbEntry","id":1},
  {"type":"updateKbEntry","id":1,"data":{"title":"Nuevo título","content":"Nuevo contenido","category":"faq"}},
  {"type":"sendMessage","to":"email@usuario.com","content":"Mensaje a enviar"},
  {"type":"addContact","email":"email@usuario.com"}
]}
\`\`\`

REGLAS:
- Siempre confirma con el usuario ANTES de eliminar algo.
- Después de crear algo, confirma el nombre y nuevo ID en tu mensaje.
- Precios y montos en dólares.
- No inventes datos que no existan en el contexto.
- Si el usuario pide modificar datos, genera el JSON y explícale qué hiciste.
- Responde en español profesional y amigable.
- Si ves que falta configuración importante (Stripe no conectado, tienda no pública, etc.), sugiere amablemente cómo mejorarlo.

LÍMITES ÉTICOS:
- NO compartas, repitas ni expongas información personal de los clientes (emails, teléfonos, nombres completos) a menos que el usuario sea el dueño del negocio y esté consultando sus propios datos.
- NO des consejos financieros, contables, legales ni médicos. Si te preguntan, recomienda consultar a un profesional.
- NO generes contenido ofensivo, discriminatorio, engañoso o inapropiado.
- NO inventes transacciones, productos o clientes que no existan en el contexto.
- Si el usuario pide algo fuera del alcance de la gestión del negocio, responde amablemente que no puedes ayudar con eso y sugiere algo relacionado al negocio.` },
            ...messages.concat(userMsg).map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }))
          ]
        })
      });
      const data = await response.json();
      let botContent = data.text || "Error al procesar";
      if (data.error) botContent = `Error: ${data.error}`;

      const jsonMatch = botContent.match(/```json\n?([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1].trim());
          if (parsed.actions && Array.isArray(parsed.actions) && parsed.actions.length > 0) {
            const { result: actionResult, newProducts, newCustomers, newOrders, newKbEntries, newAutomations } = executeActions(parsed.actions);
            botContent = botContent.replace(jsonMatch[0], "").trim();
            if (actionResult) {
              botContent += `\n\n—\n*${actionResult}*`;
            }
            onPersist?.(newProducts, newCustomers, newOrders, newKbEntries);
            if (newAutomations) onPersist?.(undefined, undefined, undefined, undefined, newAutomations);
          }
        } catch (e) {
          // JSON parse failed — show response as-is
        }
      }

      setMessages(prev => [...prev, { role: "bot", content: botContent || "Completado.", timestamp: Date.now() }]);
    } catch {
      setMessages(prev => [...prev, { role: "bot", content: "Error de conexión con el servidor.", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
        <div className="p-2 md:p-3 bg-red-50 rounded-xl md:rounded-2xl text-red-600"><Bot className="w-5 h-5 md:w-6 md:h-6" /></div>
        <div className="min-w-0">
          <h3 className="max-[400px]:text-lg text-xl font-black italic text-zinc-950 uppercase tracking-tighter truncate">Agente IA</h3>
          <p className="text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase italic truncate">Especializado en {agentName}</p>
        </div>
        <span className="ml-auto text-[9px] md:text-[10px] font-black italic px-2 md:px-3 py-1 rounded-full bg-zinc-100 text-zinc-500 shrink-0">
          {maxMessages - recentUserMessages} msgs
        </span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 md:space-y-4 mb-4 md:mb-6 pr-1 md:pr-2">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex items-start gap-1.5 md:gap-3", m.role === "user" ? "flex-row-reverse" : "")}>
            <div className={cn("w-7 h-7 max-[340px]:w-6 max-[340px]:h-6 md:w-8 md:h-8 rounded-xl flex items-center justify-center shrink-0", m.role === "user" ? "bg-zinc-200" : "bg-red-50 text-red-600")}>
              {m.role === "user" ? <User className="w-3.5 h-3.5 max-[340px]:w-3 max-[340px]:h-3 md:w-4 md:h-4" /> : <Sparkles className="w-3.5 h-3.5 max-[340px]:w-3 max-[340px]:h-3 md:w-4 md:h-4" />}
            </div>
            <div className={cn("p-3 md:p-4 rounded-2xl max-w-[85%] md:max-w-[75%] text-xs md:text-sm font-medium leading-relaxed max-[340px]:px-2.5 max-[340px]:py-2 overflow-wrap-anywhere", m.role === "user" ? "bg-zinc-950 text-white rounded-tr-none" : "bg-zinc-50 text-zinc-700 rounded-tl-none border border-zinc-100")}>
              {m.role === "user" ? m.content : <MarkdownRenderer content={m.content} />}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-1.5 md:gap-3">
            <div className="w-7 h-7 max-[340px]:w-6 max-[340px]:h-6 rounded-xl bg-red-50 flex items-center justify-center text-red-600"><Loader2 className="w-3.5 h-3.5 max-[340px]:w-3 max-[340px]:h-3 md:w-4 md:h-4 animate-spin" /></div>
            <div className="p-3 max-[340px]:px-2.5 max-[340px]:py-2 md:p-4 rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-400 text-xs md:text-sm italic">Pensando...</div>
          </div>
        )}
      </div>
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder={!canSend ? "Límite de mensajes alcanzado (vuelve en 2.5h)" : "Pregunta o da una orden sobre tu negocio..."}
          disabled={!canSend}
          className={cn(
            "w-full bg-zinc-50 max-[400px]:p-3 max-[340px]:p-2.5 max-[400px]:text-xs text-sm p-4 rounded-2xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all disabled:opacity-50 disabled:bg-zinc-100",
            voice.isSupported ? "max-[400px]:pr-[102px]" : "max-[400px]:pr-[72px]"
          )}
        />
        <div className="absolute right-1 md:right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 md:gap-1">
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-8 h-8 max-[340px]:w-7 max-[340px]:h-7 rounded-xl flex items-center justify-center text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50 shrink-0"
          >
            <Paperclip className="w-3.5 h-3.5 max-[340px]:w-3 max-[340px]:h-3 md:w-4 md:h-4" />
          </motion.button>
          <input ref={fileInputRef} type="file" accept=".json,.csv,.tsv,.txt,.xml,.yaml,.yml,.md,.log,.env,.sql,.html,.css,.js,.ts,.jsx,.tsx,.py,.rb,.php,.java,.go,.rs,.sh" className="hidden" onChange={handleAttachFile} />
          {voice.isSupported && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={voice.isListening ? voice.stopListening : voice.startListening}
              disabled={isLoading}
              className={cn("w-8 h-8 max-[340px]:w-7 max-[340px]:h-7 rounded-xl flex items-center justify-center transition-all shrink-0", voice.isListening ? "bg-red-600 text-white animate-pulse shadow-lg shadow-red-200" : "text-zinc-400 hover:text-red-600 hover:bg-red-50")}
            >
              {voice.isListening ? <MicOff className="w-3.5 h-3.5 max-[340px]:w-3 max-[340px]:h-3 md:w-4 md:h-4" /> : <Mic className="w-3.5 h-3.5 max-[340px]:w-3 max-[340px]:h-3 md:w-4 md:h-4" />}
            </motion.button>
          )}
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleSend} disabled={isLoading || !input.trim()} className="w-8 h-8 max-[340px]:w-7 max-[340px]:h-7 bg-red-600 text-white rounded-xl flex items-center justify-center hover:bg-red-700 transition-all disabled:opacity-50 shrink-0">
            <Send className="w-3.5 h-3.5 max-[340px]:w-3 max-[340px]:h-3 md:w-4 md:h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
