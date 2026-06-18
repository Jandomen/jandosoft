"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Store, Building2, Package, Users, ShoppingCart, DollarSign,
  Bot, ChevronRight, ChevronLeft, ArrowLeft, Plus, Trash2, BarChart3,
  TrendingUp, Clock, Edit3, X, Send, Loader2, Sparkles, User,
  Settings, CheckCircle2, Layers, CreditCard, Download, ExternalLink,
  Wallet, Percent, ToggleLeft, ToggleRight, Bitcoin, Lock, ImageIcon, Upload, Link, Mic, MicOff, Paperclip, Search, BookOpen, Zap, Copy, Globe, Megaphone,   FileText, Menu, MessageSquare, FileSpreadsheet, AlertTriangle, HelpCircle, Code, ChevronUp, ChevronDown
} from "lucide-react";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import { useVoiceInput } from "@/lib/hooks/useVoiceInput";
import { readFileAsText, formatFileMessage } from "@/lib/utils/readFile";
import MarkdownRenderer from "@/components/chat/MarkdownRenderer";
import AnalyticsPanel from "./AnalyticsPanel";
import TeamPanel from "./TeamPanel";
import OrgSettingsPanel from "./OrgSettingsPanel";
import CampaignsPanel from "./CampaignsPanel";
import InvoicesPanel from "./InvoicesPanel";

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
  const { t } = useLanguage();
  const [section, setSection] = useState<"dashboard" | "products" | "customers" | "orders" | "payments" | "analytics" | "team" | "orgsettings" | "campaigns" | "invoices" | "ai" | "knowledgebase" | "automations" | "agentconfig" | "agentinstall" | "smartforms">((initialSection as any) || "dashboard");

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
  const [kbEntries, setKbEntries] = useState<{ id: number; title: string; content: string; category: string; question?: string; createdAt: string }[]>([]);
  const [showAddKb, setShowAddKb] = useState(false);
  const [editingKb, setEditingKb] = useState<any | null>(null);
  const [kbForm, setKbForm] = useState({ title: "", content: "", category: "general", question: "" });
  const [searchKb, setSearchKb] = useState("");
  const [kbCategories, setKbCategories] = useState<string[]>(["general", "productos", "clientes", "pedidos", "politicas", "faq", "manual"]);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showConfirmClearKb, setShowConfirmClearKb] = useState(false);
  const [kbImporting, setKbImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [agentConfig, setAgentConfig] = useState({
    systemPrompt: "",
    temperature: 0.7,
    model: "gpt-4o-mini",
    logo: "",
    primaryColor: "#dc2626",
    secondaryColor: "#f5f5f5",
    textColor: "#09090b",
    widgetWelcome: "",
    widgetPlaceholder: "",
    widgetHeader: "",
  });
  const [agentConfigTab, setAgentConfigTab] = useState<"general" | "widget">("general");
  const [installTab, setInstallTab] = useState<"html" | "shopify" | "woocommerce" | "wix" | "wordpress">("html");
  const [agentConfigSaving, setAgentConfigSaving] = useState(false);
  const [smartForms, setSmartForms] = useState<any[]>([]);
  const [showAddSmartForm, setShowAddSmartForm] = useState(false);
  const [editingSmartForm, setEditingSmartForm] = useState<any | null>(null);
  const [smartFormName, setSmartFormName] = useState("");
  const [smartFormDesc, setSmartFormDesc] = useState("");
  const [smartFormFields, setSmartFormFields] = useState<any[]>([]);
  const [editingSFormField, setEditingSFormField] = useState<any | null>(null);
  const [sformFieldType, setSformFieldType] = useState("text");
  const [sformFieldLabel, setSformFieldLabel] = useState("");
  const [sformFieldPlaceholder, setSformFieldPlaceholder] = useState("");
  const [sformFieldRequired, setSformFieldRequired] = useState(false);
  const [sformFieldOptions, setSformFieldOptions] = useState("");
  const [showFormSubmissions, setShowFormSubmissions] = useState<any | null>(null);
  const [showFormEmbed, setShowFormEmbed] = useState<any | null>(null);
  const [confirmDeleteForm, setConfirmDeleteForm] = useState<any | null>(null);
  const [automations, setAutomations] = useState<{ id: number; name: string; trigger: string; actionType: string; actionConfig: Record<string, string>; triggerConfig: Record<string, any>; enabled: boolean; createdAt: string }[]>([]);
  const [campaigns, setCampaigns] = useState<{ id: number; name: string; type: "email" | "sms"; status: "draft" | "scheduled" | "sending" | "sent" | "paused" | "cancelled"; audience: string; subject: string; body: string; scheduledAt: string | null; sentAt: string | null; stats: { sent: number; opened: number; clicked: number; bounced: number; unsubscribed: number }; createdAt: string }[]>([]);
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
  const [viewingProduct, setViewingProduct] = useState<any>(null);
  const [viewImgIndex, setViewImgIndex] = useState(0);
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
      setSmartForms((userStore as any)?.smartForms || []);
      const ac = (userStore as any)?.agentConfig;
      if (ac) {
        setAgentConfig({
          systemPrompt: ac.systemPrompt || "",
          temperature: ac.temperature ?? 0.7,
          model: ac.model || "gpt-4o-mini",
          logo: ac.logo || "",
          primaryColor: ac.primaryColor || "#dc2626",
          secondaryColor: ac.secondaryColor || "#f5f5f5",
          textColor: ac.textColor || "#09090b",
          widgetWelcome: ac.widgetWelcome || "",
          widgetPlaceholder: ac.widgetPlaceholder || "",
          widgetHeader: ac.widgetHeader || "",
        });
      }
    }
  }, [userStore]);

  const persistStore = (productsData?: any[], customersData?: any[], ordersData?: any[], knowledgebaseData?: any[], automationsData?: any[], campaignsData?: any[], smartFormsData?: any[]) => {
    const data: any = {};
    if (productsData !== undefined) data.products = productsData;
    if (customersData !== undefined) data.customers = customersData;
    if (ordersData !== undefined) data.orders = ordersData;
    if (knowledgebaseData !== undefined) data.knowledgebase = knowledgebaseData;
    if (automationsData !== undefined) data.automations = automationsData;
    if (campaignsData !== undefined) data.campaigns = campaignsData;
    if (smartFormsData !== undefined) data.smartForms = smartFormsData;
    if (Object.keys(data).length > 0 && onSaveStore && storeId) {
      Promise.resolve(onSaveStore(storeId, data)).catch(e => console.error("Persist failed:", e));
    }
  };

  const handleKbExport = () => {
    if (kbEntries.length === 0) { showToast("No hay entradas para exportar", "info"); return; }
    const ws = XLSX.utils.json_to_sheet(kbEntries.map(e => ({
      Pregunta: e.question || "",
      Título: e.question ? "" : e.title,
      Respuesta: e.content,
      Categoría: e.category,
      Creado: e.createdAt,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Conocimiento");
    XLSX.writeFile(wb, `conocimiento_${storeId}.xlsx`);
    showToast("Excel exportado correctamente", "success");
  };

  const handleDownloadKbTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { Pregunta: "¿Cómo hago una devolución?", Título: "", Respuesta: "El cliente tiene 30 días para devolver...", Categoría: "faq" },
      { Pregunta: "", Título: "Política de envíos", Respuesta: "Los envíos se realizan en 24-48 hrs...", Categoría: "politicas" },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Conocimiento");
    XLSX.writeFile(wb, "plantilla_conocimiento.xlsx");
    showToast("Plantilla descargada", "success");
  };

  const handleKbImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setKbImporting(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(ws);
        const now = new Date().toISOString();
        const imported = rows.map((r: any, i: number) => ({
          id: Date.now() + i,
          title: (r.Título || r.título || r.titulo || "").trim(),
          content: (r.Respuesta || r.respuesta || r.Contenido || r.contenido || "").trim(),
          category: (r.Categoría || r.categoria || r.Category || r.category || "general").trim().toLowerCase(),
          question: (r.Pregunta || r.pregunta || "").trim() || undefined,
          createdAt: now,
        })).filter((r: any) => r.content);
        if (imported.length === 0) { showToast("No se encontraron datos válidos en el archivo", "error"); setKbImporting(false); return; }
        const newCats = [...new Set([...kbCategories, ...imported.map((r: any) => r.category)])];
        setKbCategories(newCats);
        const merged = [...kbEntries, ...imported];
        setKbEntries(merged);
        persistStore(undefined, undefined, undefined, merged);
        showToast(`${imported.length} entradas importadas correctamente`, "success");
      } catch (err) {
        showToast("Error al leer el archivo. Verifica el formato.", "error");
      }
      setKbImporting(false);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
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
                <button onClick={() => { navigator.clipboard.writeText(window.location.origin + "/s/" + userStore.slug); showToast(t("biz.url_copied"), "success"); }} className="p-1 hover:bg-zinc-100 rounded-lg transition-all opacity-0 group-hover:opacity-100" title={t("biz.copied")}>
                  <Copy className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-950" />
                </button>
                <a href={"/s/" + userStore.slug} target="_blank" className={cn("p-1 hover:bg-zinc-100 rounded-lg transition-all opacity-0 group-hover:opacity-100", (userStore as any)?.isPublic ? "text-emerald-600 hover:text-emerald-700" : "text-zinc-300 hover:text-zinc-500")} title={t("biz.open_site")}>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setEditingStore(false); setConfirmDelete(false); setSettingsForm({ name: userStore?.name || "", desc: userStore?.desc || "", industry: userStore?.industry || "", slug: userStore?.slug || "", image: userStore?.image || "" }); setPublicVisible(!!(userStore as any)?.isPublic); setPublicAIEnabled(!!(userStore as any)?.publicAI); setShowSettings(true); }} className="p-1.5 md:p-2 hover:bg-zinc-50 rounded-xl transition-all" title={t("biz.store_settings")}>
              <Settings className="w-4 h-4 md:w-5 md:h-5 text-zinc-400 hover:text-zinc-950 transition-colors" />
            </motion.button>
            <div className="hidden md:block text-right">
              <p className="text-xs font-black text-zinc-950 italic">{userEmail?.split('@')[0]}</p>
              <p className="text-[9px] font-bold text-zinc-400 uppercase">{t("biz.owner")}</p>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-zinc-800 rounded-xl flex items-center justify-center font-black text-[10px] md:text-xs text-white shadow-lg uppercase">
              {userEmail?.[0] || "U"}
            </div>
          </div>
        </header>

        {/* Suspension warning banner */}
        {(userStore as any)?.isSuspended && (
          <div className="bg-rose-50 border-b border-rose-200 px-3 md:px-10 py-3 md:py-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shrink-0" />
              <p className="text-[10px] md:text-xs font-bold text-rose-800 italic">
                {(userStore as any)?.suspensionReason || t("biz.suspended_reason")}
                {(userStore as any)?.suspendedUntil && ` ${t("biz.suspended_until")} ${new Date((userStore as any).suspendedUntil).toLocaleDateString()}.`}
              </p>
            </div>
          </div>
        )}

        {/* Mobile horizontal tab bar */}
        <div className="md:hidden overflow-x-auto no-scrollbar border-b border-zinc-100 bg-white">
          <div className="flex gap-1.5 px-3 py-2.5 min-w-max">
            {[
              { icon: <BarChart3 className="w-3.5 h-3.5" />, label: t("nav.dashboard"), key: "dashboard" },
              { icon: <Package className="w-3.5 h-3.5" />, label: t("nav.products"), key: "products" },
              { icon: <Users className="w-3.5 h-3.5" />, label: t("nav.customers"), key: "customers" },
              { icon: <ShoppingCart className="w-3.5 h-3.5" />, label: t("nav.orders"), key: "orders" },
              { icon: <Wallet className="w-3.5 h-3.5" />, label: t("nav.payments"), key: "payments" },
              { icon: <TrendingUp className="w-3.5 h-3.5" />, label: t("nav.analytics"), key: "analytics" },
              { icon: <FileText className="w-3.5 h-3.5" />, label: t("nav.invoices"), key: "invoices" },
              { icon: <Megaphone className="w-3.5 h-3.5" />, label: t("nav.campaigns"), key: "campaigns" },
              { icon: <Zap className="w-3.5 h-3.5" />, label: t("nav.automations"), key: "automations" },
              { icon: <Bot className="w-3.5 h-3.5" />, label: t("nav.ai"), key: "ai" },
              { icon: <BookOpen className="w-3.5 h-3.5" />, label: t("nav.knowledgebase"), key: "knowledgebase" },
              { icon: <Settings className="w-3.5 h-3.5" />, label: "Config", key: "agentconfig" },
              { icon: <Code className="w-3.5 h-3.5" />, label: "Instalar", key: "agentinstall" },
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
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 italic">{t("biz.management")}</h3>
                <SideBtn icon={<BarChart3 />} label={t("nav.dashboard")} active={section === "dashboard"} onClick={() => setSection("dashboard")} />
                <SideBtn icon={<Package />} label={t("nav.products")} active={section === "products"} onClick={() => setSection("products")} />
                <SideBtn icon={<Users />} label={t("nav.customers")} active={section === "customers"} onClick={() => setSection("customers")} />
                <SideBtn icon={<ShoppingCart />} label={t("nav.orders")} active={section === "orders"} onClick={() => setSection("orders")} />
                <SideBtn icon={<TrendingUp />} label={t("nav.analytics")} active={section === "analytics"} onClick={() => setSection("analytics")} />
                <SideBtn icon={<FileText />} label={t("nav.invoices")} active={section === "invoices"} onClick={() => setSection("invoices")} />
                <SideBtn icon={<Megaphone />} label={t("nav.campaigns")} active={section === "campaigns"} onClick={() => setSection("campaigns")} />
              </div>
              <div className="space-y-1">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 italic">{t("biz.automation")}</h3>
                <SideBtn icon={<Zap />} label={t("nav.automations")} active={section === "automations"} onClick={() => setSection("automations")} />
              </div>
              <div className="space-y-1">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 italic">{t("biz.assistance")}</h3>
                <SideBtn icon={<Bot />} label={t("biz.ai_agent")} active={section === "ai"} onClick={() => setSection("ai")} />
                <SideBtn icon={<BookOpen />} label={t("biz.knowledge_base")} active={section === "knowledgebase"} onClick={() => setSection("knowledgebase")} />
                <SideBtn icon={<Settings />} label="Config. Agente" active={section === "agentconfig"} onClick={() => setSection("agentconfig")} />
                <SideBtn icon={<Code />} label="Instalación" active={section === "agentinstall"} onClick={() => setSection("agentinstall")} />
              </div>
              <div className="space-y-1">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 italic">Herramientas</h3>
                <SideBtn icon={<FileSpreadsheet />} label="Smart Forms" active={section === "smartforms"} onClick={() => setSection("smartforms")} />
              </div>
            </aside>
          )}
          <main className="flex-1 overflow-y-auto p-4 max-[400px]:p-3 max-[340px]:p-2 md:p-8 bg-white">
            {section === "dashboard" && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
                  <div className="bg-white max-[400px]:p-4 p-6 max-[400px]:rounded-[1.5rem] rounded-[2rem] border border-zinc-100 shadow-sm space-y-2 md:space-y-3">
                    <div className="p-2 md:p-3 bg-red-50 rounded-xl w-fit"><Package className="w-4 h-4 md:w-5 md:h-5 text-red-600" /></div>
                    <p className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic">{t("biz.products_metric")}</p>
                    <p className="max-[400px]:text-2xl text-3xl font-black italic text-zinc-950">{totalProducts}</p>
                  </div>
                  <div className="bg-white max-[400px]:p-4 p-6 max-[400px]:rounded-[1.5rem] rounded-[2rem] border border-zinc-100 shadow-sm space-y-2 md:space-y-3">
                    <div className="p-2 md:p-3 bg-blue-50 rounded-xl w-fit"><Users className="w-4 h-4 md:w-5 md:h-5 text-blue-600" /></div>
                    <p className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic">{t("biz.customers_metric")}</p>
                    <p className="max-[400px]:text-2xl text-3xl font-black italic text-zinc-950">{customers.length}</p>
                  </div>
                  <div className="bg-white max-[400px]:p-4 p-6 max-[400px]:rounded-[1.5rem] rounded-[2rem] border border-zinc-100 shadow-sm space-y-2 md:space-y-3">
                    <div className="p-2 md:p-3 bg-amber-50 rounded-xl w-fit"><ShoppingCart className="w-4 h-4 md:w-5 md:h-5 text-amber-600" /></div>
                    <p className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic">{t("biz.orders_metric")}</p>
                    <p className="max-[400px]:text-2xl text-3xl font-black italic text-zinc-950">{orders.length}</p>
                  </div>
                  <div className="bg-white max-[400px]:p-4 p-6 max-[400px]:rounded-[1.5rem] rounded-[2rem] border border-zinc-100 shadow-sm space-y-2 md:space-y-3">
                    <div className="p-2 md:p-3 bg-emerald-50 rounded-xl w-fit"><DollarSign className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" /></div>
                    <p className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic">{t("biz.sales_metric")}</p>
                    <p className="max-[400px]:text-2xl text-3xl font-black italic text-zinc-950">${totalSales}</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 max-[400px]:p-6 p-10 max-[400px]:rounded-[2rem] rounded-[3rem] text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[80px] -mr-32 -mt-32" />
                  <div className="relative z-10 space-y-3 md:space-y-4">
                    <Bot className="w-8 h-8 md:w-10 md:h-10 text-red-500" />
                    <h3 className="max-[400px]:text-2xl text-3xl font-black italic">{t("biz.ai_ready_title")}</h3>
                    <p className="text-zinc-400 font-medium max-w-lg max-[400px]:text-sm">{t("biz.ai_ready_desc")}</p>
                      <div className={cn("px-3 py-1 rounded-full text-[9px] font-black italic w-fit", planExpired ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-300")}>
                        {t("biz.msgs").replace("{n}", String(planLimits?.maxMessages ?? 999))}
                      </div>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => setSection("ai")} className="px-6 md:px-8 py-3 md:py-4 bg-red-600 text-white rounded-2xl font-black italic text-xs md:text-sm hover:bg-red-700 transition-all shadow-xl inline-flex items-center gap-3">
                      {t("biz.talk_to_ai")} <ChevronRight className="w-4 h-4" />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {products.filter(p => !searchProduct || p.name.toLowerCase().includes(searchProduct.toLowerCase())).map((p) => {
                    const pimg = p.images?.filter(Boolean) || [];
                    return (
                      <div key={p.id} className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-zinc-100 shadow-sm overflow-hidden hover:shadow-lg hover:border-zinc-200 transition-all group">
                        <div
                          className="aspect-[16/10] bg-zinc-50 relative overflow-hidden cursor-pointer"
                          onClick={() => { setViewingProduct(p); setViewImgIndex(0); }}
                        >
                          {pimg[0] ? (
                            <img src={pimg[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200">
                              <Package className="w-10 h-10 text-zinc-300" />
                            </div>
                          )}
                          {pimg.length > 1 && (
                            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-[8px] font-black italic rounded-lg backdrop-blur-sm">
                              +{pimg.length - 1}
                            </div>
                          )}
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <motion.button whileTap={{ scale: 0.9 }}
                              onClick={(e) => { e.stopPropagation(); setEditingProduct(p); setProductForm({ name: p.name, price: String(p.price), stock: String(p.stock), currency: p.currency || "USD" }); setProductImages(p.images || []); setImageUrlInput(""); setShowAddProduct(true); }}
                              className="p-1.5 md:p-2 bg-white/90 backdrop-blur-sm rounded-lg text-zinc-600 hover:text-blue-600 hover:bg-white shadow-lg transition-all"
                            >
                              <Edit3 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.9 }}
                              onClick={(e) => { e.stopPropagation(); const np = products.filter(x => x.id !== p.id); setProducts(np); persistStore(np, undefined, undefined); }}
                              className="p-1.5 md:p-2 bg-white/90 backdrop-blur-sm rounded-lg text-zinc-600 hover:text-rose-600 hover:bg-white shadow-lg transition-all"
                            >
                              <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                            </motion.button>
                          </div>
                        </div>
                        <div
                          className="p-4 md:p-5 space-y-2 cursor-pointer"
                          onClick={() => { setViewingProduct(p); setViewImgIndex(0); }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-black italic text-zinc-950 text-sm md:text-base leading-tight">{p.name}</h4>
                            <span className="text-lg md:text-xl font-black italic text-red-600 shrink-0 whitespace-nowrap">{formatPrice(p.price, p.currency)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase italic">
                            <span>Stock: {p.stock}</span>
                            {p.currency !== "USD" && <span>≈ ${p.priceUSD} USD</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {products.filter(p => !searchProduct || p.name.toLowerCase().includes(searchProduct.toLowerCase())).length === 0 && (
                    <div className="col-span-full py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">{searchProduct ? `Sin resultados para "${searchProduct}"` : "No hay productos aún"}</div>
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

                {/* Product detail modal */}
                <AnimatePresence>
                  {viewingProduct && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-2 md:p-6"
                      onClick={() => setViewingProduct(null)}
                    >
                      <motion.div
                        initial={{ scale: 0.92, y: 30 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.92, y: 30 }}
                        className="bg-white rounded-[2rem] md:rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="relative">
                          <button onClick={() => setViewingProduct(null)} className="absolute top-3 right-3 z-10 p-2 bg-black/50 text-white rounded-xl hover:bg-black/70 backdrop-blur-sm">
                            <X className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                          <div className="grid grid-cols-1 md:grid-cols-2">
                            <div className="relative bg-zinc-50 min-h-[280px] md:min-h-[400px] flex items-center">
                              {(() => {
                                const imgs = viewingProduct.images?.filter(Boolean) || [];
                                const current = imgs[viewImgIndex];
                                return (
                                  <div className="w-full h-full relative">
                                    {current ? (
                                      <img src={current} alt={viewingProduct.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200">
                                        <Package className="w-12 h-12 text-zinc-300" />
                                      </div>
                                    )}
                                    {imgs.length > 1 && (
                                      <>
                                        {viewImgIndex > 0 && (
                                          <button onClick={(e) => { e.stopPropagation(); setViewImgIndex(i => i - 1); }} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-xl shadow-lg hover:bg-white">
                                            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-zinc-700" />
                                          </button>
                                        )}
                                        {viewImgIndex < imgs.length - 1 && (
                                          <button onClick={(e) => { e.stopPropagation(); setViewImgIndex(i => i + 1); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-xl shadow-lg hover:bg-white">
                                            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-zinc-700" />
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                            <div className="p-5 md:p-8 flex flex-col justify-between space-y-5">
                              <div className="space-y-4">
                                <h2 className="text-xl md:text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{viewingProduct.name}</h2>
                                <p className="text-3xl md:text-4xl font-black italic text-red-600">{formatPrice(viewingProduct.price, viewingProduct.currency)}</p>
                                {viewingProduct.desc && (
                                  <p className="text-xs md:text-sm text-zinc-500 font-medium leading-relaxed">{viewingProduct.desc}</p>
                                )}
                                <div className={cn("px-3 py-1.5 rounded-xl text-[10px] font-black italic uppercase inline-block", viewingProduct.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700")}>
                                  {viewingProduct.stock > 0 ? `${viewingProduct.stock} en stock` : "Agotado"}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <motion.button whileTap={{ scale: 0.95 }}
                                  onClick={() => { setEditingProduct(viewingProduct); setProductForm({ name: viewingProduct.name, price: String(viewingProduct.price), stock: String(viewingProduct.stock), currency: viewingProduct.currency || "USD" }); setProductImages(viewingProduct.images || []); setImageUrlInput(""); setShowAddProduct(true); setViewingProduct(null); }}
                                  className="flex-1 py-3 bg-zinc-950 text-white rounded-2xl font-black italic text-[10px] hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                                >
                                  <Edit3 className="w-3.5 h-3.5" /> EDITAR
                                </motion.button>
                              </div>
                            </div>
                          </div>
                          {(viewingProduct.images?.filter(Boolean)?.length || 0) > 1 && (
                            <div className="px-5 md:px-8 pb-5 md:pb-8 flex gap-2 overflow-x-auto">
                              {viewingProduct.images?.filter(Boolean).map((img: string, i: number) => (
                                <button key={i} onClick={(e) => { e.stopPropagation(); setViewImgIndex(i); }} className={cn("w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all", viewImgIndex === i ? "border-red-600 shadow-md" : "border-transparent opacity-60 hover:opacity-100")}>
                                  <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                              ))}
                            </div>
                          )}
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

            {section === "invoices" && (
              <InvoicesPanel storeId={storeId} userEmail={userEmail} />
            )}

            {section === "campaigns" && (
              <CampaignsPanel campaigns={campaigns} setCampaigns={setCampaigns} onPersist={(d) => persistStore(undefined, undefined, undefined, undefined, undefined, d)} storeId={String(storeId)} />
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleKbImport} />
                    <motion.button whileTap={{ scale: 0.95 }} disabled={kbImporting} onClick={() => fileInputRef.current?.click()} className={cn("px-3 md:px-4 py-2.5 md:py-3 rounded-2xl font-black text-[9px] md:text-[10px] italic transition-all shadow-md flex items-center gap-1.5", kbImporting ? "bg-zinc-300 text-zinc-500 cursor-not-allowed" : "bg-emerald-600 text-white hover:bg-emerald-700")}>
                      {kbImporting ? <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5 md:w-4 md:h-4" />} {kbImporting ? "IMPORTANDO..." : "IMPORTAR"}
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={handleKbExport} className="px-3 md:px-4 py-2.5 md:py-3 bg-blue-600 text-white rounded-2xl font-black text-[9px] md:text-[10px] italic hover:bg-blue-700 transition-all shadow-md flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 md:w-4 md:h-4" /> EXPORTAR
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setEditingKb(null); setKbForm({ title: "", content: "", category: kbCategories[0], question: "" }); setShowAddKb(true); }} className="px-4 md:px-5 py-2.5 md:py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] md:text-xs italic hover:bg-red-700 transition-all shadow-xl flex items-center gap-2">
                      <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> AÑADIR
                    </motion.button>
                  </div>
                </div>

                {/* Action bar */}
                <div className="flex items-center gap-2 flex-wrap">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={handleDownloadKbTemplate} className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl font-black text-[9px] italic hover:bg-zinc-200 transition-all flex items-center gap-1.5">
                    <Download className="w-3 h-3" /> PLANTILLA EXCEL
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowManageCategories(true)} className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl font-black text-[9px] italic hover:bg-zinc-200 transition-all flex items-center gap-1.5">
                    <Layers className="w-3 h-3" /> GESTIONAR CATEGORÍAS
                  </motion.button>
                  {kbEntries.length > 0 && (
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowConfirmClearKb(true)} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-black text-[9px] italic hover:bg-rose-100 transition-all flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3" /> BORRAR TODO
                    </motion.button>
                  )}
                </div>

                {kbEntries.filter(e => !searchKb || e.title.toLowerCase().includes(searchKb.toLowerCase()) || e.content.toLowerCase().includes(searchKb.toLowerCase()) || e.category.toLowerCase().includes(searchKb.toLowerCase()) || (e.question && e.question.toLowerCase().includes(searchKb.toLowerCase()))).length === 0 ? (
                  <div className="py-12 md:py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">
                    {searchKb ? `Sin resultados para "${searchKb}"` : "No hay entradas en la base de conocimiento. Añade información para que el IA Agente la use."}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {kbEntries.filter(e => !searchKb || e.title.toLowerCase().includes(searchKb.toLowerCase()) || e.content.toLowerCase().includes(searchKb.toLowerCase()) || e.category.toLowerCase().includes(searchKb.toLowerCase()) || (e.question && e.question.toLowerCase().includes(searchKb.toLowerCase()))).map((entry) => (
                      <div key={entry.id} className="bg-white max-[400px]:p-4 rounded-[1.5rem] md:rounded-[2rem] border border-zinc-100 p-6 space-y-3 md:space-y-4 group hover:border-red-200 transition-all shadow-sm">
                        <div className="flex items-start justify-between gap-3 md:gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                              {entry.question ? <HelpCircle className="w-4 h-4 md:w-5 md:h-5" /> : <BookOpen className="w-4 h-4 md:w-5 md:h-5" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-black italic text-zinc-950 text-sm md:text-base truncate">{entry.question ? entry.question : entry.title}</p>
                              <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded-full text-[8px] font-black uppercase italic">{entry.category}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setEditingKb(entry); setKbForm({ title: entry.title, content: entry.content, category: entry.category, question: entry.question || "" }); setShowAddKb(true); }} className="p-1.5 md:p-2 text-zinc-300 hover:text-blue-500 transition-all"><Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => { const nk = kbEntries.filter(x => x.id !== entry.id); setKbEntries(nk); persistStore(undefined, undefined, undefined, nk); }} className="p-1.5 md:p-2 text-zinc-300 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
                          </div>
                        </div>
                        {entry.question && (
                          <p className="text-xs md:text-sm text-zinc-950 font-bold italic leading-relaxed whitespace-pre-wrap">{entry.title}</p>
                        )}
                        <p className="text-xs md:text-sm text-zinc-600 font-medium leading-relaxed line-clamp-3 whitespace-pre-wrap">{entry.content}</p>
                        <p className="text-[9px] text-zinc-400 font-bold italic">{new Date(entry.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add / Edit KB modal */}
                <AnimatePresence>
                  {showAddKb && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-6" onClick={() => { setShowAddKb(false); setEditingKb(null); }}>
                      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-lg bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-4xl relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setShowAddKb(false); setEditingKb(null); }} className="absolute top-4 md:top-6 right-4 md:right-6 p-2 hover:bg-zinc-50 rounded-xl"><X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></button>
                        <h3 className="text-xl md:text-2xl font-black italic text-zinc-950 mb-4 md:mb-6 uppercase tracking-tighter">{editingKb ? "Editar Entrada" : "Nueva Entrada"}</h3>
                        <div className="space-y-3 md:space-y-5">
                          <div className="flex items-center gap-2">
                            <motion.button whileTap={{ scale: 0.95 }}
                              onClick={() => setKbForm({...kbForm, question: kbForm.question ? "" : "¿?" })}
                              className={cn("px-3 py-1.5 rounded-xl font-black text-[9px] italic transition-all flex items-center gap-1.5", kbForm.question ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-400")}
                            >
                              <HelpCircle className="w-3 h-3" /> {kbForm.question ? "MODO PREGUNTA" : "MODO ARTÍCULO"}
                            </motion.button>
                          </div>
                          {kbForm.question ? (
                            <div>
                              <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Pregunta</label>
                              <input type="text" placeholder="Ej. ¿Cómo hago una devolución?" value={kbForm.question} onChange={e => setKbForm({...kbForm, question: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                            </div>
                          ) : (
                            <div>
                              <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Título</label>
                              <input type="text" placeholder="Ej. Política de devoluciones" value={kbForm.title} onChange={e => setKbForm({...kbForm, title: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                            </div>
                          )}
                          <div>
                            <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Categoría</label>
                            <select value={kbForm.category} onChange={e => setKbForm({...kbForm, category: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 italic text-sm">
                              {kbCategories.map(cat => (
                                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Respuesta</label>
                            <textarea placeholder="Describe la información que el IA Agente debe conocer..." value={kbForm.content} onChange={e => setKbForm({...kbForm, content: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all resize-none h-32 md:h-40 mt-1 text-sm" />
                          </div>
                          <button onClick={() => {
                            const title = kbForm.question || kbForm.title;
                            if (!title || !kbForm.content) return;
                            let newEntries;
                            if (editingKb) {
                              newEntries = kbEntries.map(e => e.id === editingKb.id ? { ...e, title: kbForm.title, content: kbForm.content, category: kbForm.category, question: kbForm.question || undefined } : e);
                            } else {
                              newEntries = [...kbEntries, { id: Date.now(), title: kbForm.title, content: kbForm.content, category: kbForm.category, question: kbForm.question || undefined, createdAt: new Date().toISOString() }];
                            }
                            setKbEntries(newEntries);
                            persistStore(undefined, undefined, undefined, newEntries);
                            setShowAddKb(false);
                            setEditingKb(null);
                            setKbForm({ title: "", content: "", category: kbCategories[0], question: "" });
                          }} disabled={!(kbForm.question || kbForm.title) || !kbForm.content} className="w-full py-4 md:py-5 bg-red-600 text-white rounded-2xl font-black italic text-sm md:text-base hover:bg-red-700 transition-all shadow-xl disabled:opacity-50">
                            {editingKb ? "ACTUALIZAR ENTRADA" : "GUARDAR ENTRADA"}
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Manage Categories modal */}
                <AnimatePresence>
                  {showManageCategories && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setShowManageCategories(false)}>
                      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-md bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-4xl relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowManageCategories(false)} className="absolute top-4 md:top-6 right-4 md:right-6 p-2 hover:bg-zinc-50 rounded-xl"><X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></button>
                        <h3 className="text-xl md:text-2xl font-black italic text-zinc-950 mb-4 md:mb-6 uppercase tracking-tighter">Gestionar Categorías</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <input type="text" placeholder="Nueva categoría..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="flex-1 bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => {
                              const name = newCategoryName.trim().toLowerCase();
                              if (!name || kbCategories.includes(name)) return;
                              setKbCategories(prev => [...prev, name]);
                              setNewCategoryName("");
                            }} disabled={!newCategoryName.trim()} className="px-4 py-3 bg-red-600 text-white rounded-xl font-black text-[10px] italic hover:bg-red-700 transition-all shadow-md disabled:opacity-50">
                              AGREGAR
                            </motion.button>
                          </div>
                          <div className="space-y-1 max-h-60 overflow-y-auto">
                            {kbCategories.map(cat => {
                              const usedCount = kbEntries.filter(e => e.category === cat).length;
                              const canDelete = cat !== kbCategories[0] || kbCategories.length > 1;
                              return (
                                <div key={cat} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold italic text-zinc-700 capitalize">{cat}</span>
                                    <span className="text-[9px] font-bold text-zinc-400 italic">({usedCount})</span>
                                  </div>
                                  {canDelete && (
                                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                                      const newCats = kbCategories.filter(c => c !== cat);
                                      setKbCategories(newCats);
                                      const updated = kbEntries.map(e => e.category === cat ? { ...e, category: newCats[0] } : e);
                                      setKbEntries(updated);
                                      persistStore(undefined, undefined, undefined, updated);
                                    }} className="p-1.5 text-zinc-400 hover:text-rose-500 transition-all">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </motion.button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Clear all confirmation modal */}
                <AnimatePresence>
                  {showConfirmClearKb && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setShowConfirmClearKb(false)}>
                      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-sm bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-4xl relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowConfirmClearKb(false)} className="absolute top-4 md:top-6 right-4 md:right-6 p-2 hover:bg-zinc-50 rounded-xl"><X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></button>
                        <div className="text-center space-y-4">
                          <div className="w-14 h-14 mx-auto bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600">
                            <AlertTriangle className="w-7 h-7" />
                          </div>
                          <h3 className="text-xl font-black italic text-zinc-950 uppercase tracking-tighter">¿Borrar todo?</h3>
                          <p className="text-sm text-zinc-500 font-medium">Se eliminarán las {kbEntries.length} entradas de la base de conocimiento. Esta acción no se puede deshacer.</p>
                          <div className="flex gap-3 pt-2">
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowConfirmClearKb(false)} className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-black text-xs italic hover:bg-zinc-200 transition-all">
                              CANCELAR
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => {
                              setKbEntries([]);
                              persistStore(undefined, undefined, undefined, []);
                              setShowConfirmClearKb(false);
                            }} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-black text-xs italic hover:bg-rose-700 transition-all shadow-md">
                              BORRAR TODO
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {section === "agentconfig" && (
              <div className="space-y-6 md:space-y-8 max-w-3xl">
                <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
                  <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">Configuración <span className="text-red-600">del Agente</span></h3>
                  <motion.button whileTap={{ scale: 0.95 }} disabled={agentConfigSaving} onClick={async () => {
                    setAgentConfigSaving(true);
                    try {
                      await onSaveStore?.(storeId, { agentConfig });
                      showToast("Configuración guardada", "success");
                    } catch { showToast("Error al guardar", "error"); }
                    setAgentConfigSaving(false);
                  }} className={cn("px-5 md:px-6 py-2.5 md:py-3 rounded-2xl font-black text-[10px] md:text-xs italic transition-all shadow-xl flex items-center gap-2", agentConfigSaving ? "bg-zinc-300 text-zinc-500 cursor-not-allowed" : "bg-red-600 text-white hover:bg-red-700")}>
                    {agentConfigSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} GUARDAR CONFIG
                  </motion.button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1.5">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setAgentConfigTab("general")} className={cn("px-5 py-2.5 rounded-xl font-black text-[10px] italic transition-all", agentConfigTab === "general" ? "bg-red-600 text-white shadow-md" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200")}>
                    GENERAL
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setAgentConfigTab("widget")} className={cn("px-5 py-2.5 rounded-xl font-black text-[10px] italic transition-all", agentConfigTab === "widget" ? "bg-red-600 text-white shadow-md" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200")}>
                    TEXTOS DEL WIDGET
                  </motion.button>
                </div>

                {agentConfigTab === "general" && (
                  <div className="space-y-6">
                    {/* Información General */}
                    <div className="bg-white rounded-[2rem] border border-zinc-100 p-6 md:p-8 shadow-sm space-y-5">
                      <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
                        <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        </div>
                        <h4 className="text-sm md:text-base font-black italic text-zinc-950 uppercase tracking-tight">Información General</h4>
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Prompt del Sistema</label>
                        <p className="text-[8px] text-zinc-300 italic ml-1 mb-2 font-medium">Personaliza cómo se comporta el agente IA. Si se deja vacío, se usará el prompt por defecto.</p>
                        <textarea value={agentConfig.systemPrompt} onChange={e => setAgentConfig(c => ({...c, systemPrompt: e.target.value}))} placeholder="Escribe el prompt personalizado para el agente..." className="w-full bg-zinc-50 p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all resize-none h-40 text-sm" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Temperatura</label>
                          <p className="text-[8px] text-zinc-300 italic ml-1 mb-2 font-medium">Controla la creatividad (0 = preciso, 2 = creativo)</p>
                          <div className="flex items-center gap-3">
                            <input type="range" min="0" max="2" step="0.1" value={agentConfig.temperature} onChange={e => setAgentConfig(c => ({...c, temperature: parseFloat(e.target.value)}))} className="flex-1 accent-red-600" />
                            <span className="text-sm font-black italic text-zinc-700 w-8 text-center">{agentConfig.temperature.toFixed(1)}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Modelo</label>
                          <p className="text-[8px] text-zinc-300 italic ml-1 mb-2 font-medium">Motor de IA a utilizar</p>
                          <select value={agentConfig.model} onChange={e => setAgentConfig(c => ({...c, model: e.target.value}))} className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all italic text-sm">
                            <option value="gpt-4o-mini">GPT-4o Mini (rápido)</option>
                            <option value="gpt-4o">GPT-4o (potente)</option>
                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo (económico)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Apariencia y Marca */}
                    <div className="bg-white rounded-[2rem] border border-zinc-100 p-6 md:p-8 shadow-sm space-y-5">
                      <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
                        <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        </div>
                        <h4 className="text-sm md:text-base font-black italic text-zinc-950 uppercase tracking-tight">Apariencia y Marca</h4>
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Logo del Agente</label>
                        <p className="text-[8px] text-zinc-300 italic ml-1 mb-2 font-medium">PNG, SVG, JPG o WebP. Se mostrará en el chat y widget.</p>
                        <div className="flex items-start gap-4">
                          <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-2 border-dashed border-zinc-200 flex items-center justify-center overflow-hidden shrink-0 bg-zinc-50">
                            {agentConfig.logo ? (
                              <img src={agentConfig.logo} alt="Logo" className="w-full h-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            ) : (
                              <svg className="w-8 h-8 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <input type="text" value={agentConfig.logo} onChange={e => setAgentConfig(c => ({...c, logo: e.target.value}))} placeholder="URL del logo..." className="flex-1 bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs" />
                              <label className="px-4 py-2.5 bg-zinc-100 text-zinc-600 rounded-xl font-black text-[9px] italic hover:bg-zinc-200 transition-all cursor-pointer flex items-center gap-1.5 shrink-0">
                                <Upload className="w-3 h-3" /> SUBIR
                                <input type="file" accept=".png,.svg,.jpg,.jpeg,.webp" className="hidden" onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = ev => setAgentConfig(c => ({...c, logo: ev.target?.result as string}));
                                  reader.readAsDataURL(file);
                                  e.target.value = "";
                                }} />
                              </label>
                            </div>
                            <button onClick={() => setAgentConfig(c => ({...c, logo: ""}))} className="text-[9px] font-bold text-rose-400 hover:text-rose-600 italic transition-colors">Eliminar logo</button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest mb-3 block">Colores</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
                            <input type="color" value={agentConfig.primaryColor} onChange={e => setAgentConfig(c => ({...c, primaryColor: e.target.value}))} className="w-10 h-10 rounded-xl border-2 border-zinc-200 cursor-pointer shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[9px] font-black text-zinc-500 uppercase italic">Principal</p>
                              <p className="text-[10px] font-mono font-bold text-zinc-700 truncate">{agentConfig.primaryColor}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
                            <input type="color" value={agentConfig.secondaryColor} onChange={e => setAgentConfig(c => ({...c, secondaryColor: e.target.value}))} className="w-10 h-10 rounded-xl border-2 border-zinc-200 cursor-pointer shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[9px] font-black text-zinc-500 uppercase italic">Secundario</p>
                              <p className="text-[10px] font-mono font-bold text-zinc-700 truncate">{agentConfig.secondaryColor}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
                            <input type="color" value={agentConfig.textColor} onChange={e => setAgentConfig(c => ({...c, textColor: e.target.value}))} className="w-10 h-10 rounded-xl border-2 border-zinc-200 cursor-pointer shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[9px] font-black text-zinc-500 uppercase italic">Texto</p>
                              <p className="text-[10px] font-mono font-bold text-zinc-700 truncate">{agentConfig.textColor}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {agentConfigTab === "widget" && (
                  <div className="space-y-5 bg-white rounded-[2rem] border border-zinc-100 p-6 md:p-8 shadow-sm">
                    <div>
                      <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Mensaje de Bienvenida</label>
                      <p className="text-[8px] text-zinc-300 italic ml-1 mb-2 font-medium">Texto que aparece cuando el usuario abre el chat. Si se deja vacío, se usará el mensaje por defecto.</p>
                      <input type="text" value={agentConfig.widgetWelcome} onChange={e => setAgentConfig(c => ({...c, widgetWelcome: e.target.value}))} placeholder="Ej. ¡Hola! Soy el asistente virtual. ¿En qué puedo ayudarte?" className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Placeholder del Input</label>
                      <p className="text-[8px] text-zinc-300 italic ml-1 mb-2 font-medium">Texto de ejemplo dentro del campo de escritura.</p>
                      <input type="text" value={agentConfig.widgetPlaceholder} onChange={e => setAgentConfig(c => ({...c, widgetPlaceholder: e.target.value}))} placeholder="Ej. Escribe tu pregunta..." className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Encabezado del Widget</label>
                      <p className="text-[8px] text-zinc-300 italic ml-1 mb-2 font-medium">Texto que aparece en el header del chat widget.</p>
                      <input type="text" value={agentConfig.widgetHeader} onChange={e => setAgentConfig(c => ({...c, widgetHeader: e.target.value}))} placeholder="Ej. Asistente de Mi Tienda" className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                    </div>
                    <div className="border-t border-zinc-100 pt-5">
                      <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest mb-3 block">Colores del Widget</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
                          <input type="color" value={agentConfig.primaryColor} onChange={e => setAgentConfig(c => ({...c, primaryColor: e.target.value}))} className="w-10 h-10 rounded-xl border-2 border-zinc-200 cursor-pointer shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[9px] font-black text-zinc-500 uppercase italic">Principal</p>
                            <p className="text-[10px] font-mono font-bold text-zinc-700 truncate">{agentConfig.primaryColor}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
                          <input type="color" value={agentConfig.secondaryColor} onChange={e => setAgentConfig(c => ({...c, secondaryColor: e.target.value}))} className="w-10 h-10 rounded-xl border-2 border-zinc-200 cursor-pointer shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[9px] font-black text-zinc-500 uppercase italic">Secundario</p>
                            <p className="text-[10px] font-mono font-bold text-zinc-700 truncate">{agentConfig.secondaryColor}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
                          <input type="color" value={agentConfig.textColor} onChange={e => setAgentConfig(c => ({...c, textColor: e.target.value}))} className="w-10 h-10 rounded-xl border-2 border-zinc-200 cursor-pointer shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[9px] font-black text-zinc-500 uppercase italic">Texto</p>
                            <p className="text-[10px] font-mono font-bold text-zinc-700 truncate">{agentConfig.textColor}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {section === "agentinstall" && (
              <div className="space-y-6 md:space-y-8 max-w-3xl">
                <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
                  <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">Instalación <span className="text-red-600">del Widget</span></h3>
                  <a href={`${window.location.origin}/s/${(userStore as any)?.slug || ""}`} target="_blank" rel="noopener noreferrer" className="px-5 md:px-6 py-2.5 md:py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] md:text-xs italic hover:bg-red-700 transition-all shadow-xl inline-flex items-center gap-2">
                    <ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4" /> VER TIENDA
                  </a>
                </div>

                {/* URL Pública */}
                <div className="bg-white rounded-[2rem] border border-zinc-100 p-6 md:p-8 shadow-sm space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
                    <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                      <Globe className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm md:text-base font-black italic text-zinc-950 uppercase tracking-tight">URL Pública</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-zinc-50 p-3 rounded-xl border border-zinc-100 text-xs md:text-sm font-mono text-zinc-700 truncate">
                      ${window.location.origin}/s/{(userStore as any)?.slug || "tu-tienda"}
                    </code>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/s/${(userStore as any)?.slug || ""}`); showToast("URL copiada", "success"); }} className="p-3 bg-zinc-100 text-zinc-600 rounded-xl hover:bg-zinc-200 transition-all shrink-0">
                      <Copy className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                {/* Platform tabs */}
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { key: "html" as const, label: "HTML / Script", icon: <Code className="w-3 h-3" /> },
                    { key: "shopify" as const, label: "Shopify", icon: <ShoppingCart className="w-3 h-3" /> },
                    { key: "woocommerce" as const, label: "WooCommerce", icon: <Store className="w-3 h-3" /> },
                    { key: "wix" as const, label: "Wix", icon: <Globe className="w-3 h-3" /> },
                    { key: "wordpress" as const, label: "WordPress", icon: <FileText className="w-3 h-3" /> },
                  ].map(tab => (
                    <motion.button key={tab.key} whileTap={{ scale: 0.95 }} onClick={() => setInstallTab(tab.key)} className={cn("px-4 py-2.5 rounded-xl font-black text-[9px] md:text-[10px] italic transition-all flex items-center gap-1.5", installTab === tab.key ? "bg-red-600 text-white shadow-md" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200")}>
                      {tab.icon} {tab.label}
                    </motion.button>
                  ))}
                </div>

                {/* HTML / Script */}
                {installTab === "html" && (
                  <div className="space-y-5">
                    <div className="bg-white rounded-[2rem] border border-zinc-100 p-6 md:p-8 shadow-sm space-y-4">
                      <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
                        <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                          <Code className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm md:text-base font-black italic text-zinc-950 uppercase tracking-tight">Embed Iframe</h4>
                      </div>
                      <p className="text-[10px] md:text-xs text-zinc-500 font-medium">Inserta este código en tu sitio web para mostrar el asistente IA como un widget flotante.</p>
                      <div className="relative">
                        <pre className="bg-zinc-950 text-zinc-100 p-4 md:p-5 rounded-2xl text-[10px] md:text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
{`<iframe
  src="${window.location.origin}/s/${(userStore as any)?.slug || "tu-tienda"}"
  style="width:100%;max-width:400px;height:600px;border:none;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.12);position:fixed;bottom:24px;right:24px;z-index:9999;background:white;"
  title="Asistente IA"
></iframe>`}
                        </pre>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                          const code = `<iframe\n  src="${window.location.origin}/s/${(userStore as any)?.slug || "tu-tienda"}"\n  style="width:100%;max-width:400px;height:600px;border:none;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.12);position:fixed;bottom:24px;right:24px;z-index:9999;background:white;"\n  title="Asistente IA"\n></iframe>`;
                          navigator.clipboard.writeText(code);
                          showToast("Código iframe copiado", "success");
                        }} className="absolute top-3 right-3 p-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all">
                          <Copy className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                    </div>

                    <div className="bg-white rounded-[2rem] border border-zinc-100 p-6 md:p-8 shadow-sm space-y-4">
                      <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
                        <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                          <FileText className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm md:text-base font-black italic text-zinc-950 uppercase tracking-tight">Script JavaScript</h4>
                      </div>
                      <p className="text-[10px] md:text-xs text-zinc-500 font-medium">Agrega este script justo antes de cerrar el <code className="text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded text-[9px] font-mono">&lt;/body&gt;</code> en tu sitio web.</p>
                      <div className="relative">
                        <pre className="bg-zinc-950 text-zinc-100 p-4 md:p-5 rounded-2xl text-[10px] md:text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
{`<script>
  (function() {
    var slug = "${(userStore as any)?.slug || "tu-tienda"}";
    var iframe = document.createElement('iframe');
    iframe.src = '${window.location.origin}/s/' + slug;
    iframe.style.cssText = 'width:100%;max-width:400px;height:600px;border:none;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.12);position:fixed;bottom:24px;right:24px;z-index:9999;background:white;';
    iframe.title = 'Asistente IA';
    document.body.appendChild(iframe);
  })();
</script>`}
                        </pre>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                          const code = `<script>\n  (function() {\n    var slug = "${(userStore as any)?.slug || "tu-tienda"}";\n    var iframe = document.createElement('iframe');\n    iframe.src = '${window.location.origin}/s/' + slug;\n    iframe.style.cssText = 'width:100%;max-width:400px;height:600px;border:none;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.12);position:fixed;bottom:24px;right:24px;z-index:9999;background:white;';\n    iframe.title = 'Asistente IA';\n    document.body.appendChild(iframe);\n  })();\n</script>`;
                          navigator.clipboard.writeText(code);
                          showToast("Código JS copiado", "success");
                        }} className="absolute top-3 right-3 p-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all">
                          <Copy className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Shopify */}
                {installTab === "shopify" && (
                  <div className="bg-white rounded-[2rem] border border-zinc-100 p-6 md:p-8 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm md:text-base font-black italic text-zinc-950 uppercase tracking-tight">Shopify</h4>
                        <p className="text-[8px] font-bold text-zinc-400 italic">Para tiendas en Shopify</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-[10px] md:text-xs text-zinc-600 font-medium leading-relaxed">
                      <p><strong>1.</strong> En el panel de Shopify, ve a <strong>Tienda Online → Temas → Editar código</strong>.</p>
                      <p><strong>2.</strong> Busca el archivo <code className="text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded text-[9px] font-mono">theme.liquid</code>.</p>
                      <p><strong>3.</strong> Pega este código justo antes del <code className="text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded text-[9px] font-mono">&lt;/body&gt;</code>:</p>
                    </div>
                    <div className="relative">
                      <pre className="bg-zinc-950 text-zinc-100 p-4 md:p-5 rounded-2xl text-[10px] md:text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
{`{% comment %} Jandosoft AI Widget {% endcomment %}
<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = '${window.location.origin}/s/${(userStore as any)?.slug || "tu-tienda"}';
    iframe.style.cssText = 'width:100%;max-width:400px;height:600px;border:none;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.12);position:fixed;bottom:24px;right:24px;z-index:9999;background:white;';
    iframe.title = 'Asistente IA';
    document.body.appendChild(iframe);
  })();
</script>`}
                      </pre>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                        navigator.clipboard.writeText(`{% comment %} Jandosoft AI Widget {% endcomment %}\n<script>\n  (function() {\n    var iframe = document.createElement('iframe');\n    iframe.src = '${window.location.origin}/s/${(userStore as any)?.slug || "tu-tienda"}';\n    iframe.style.cssText = 'width:100%;max-width:400px;height:600px;border:none;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.12);position:fixed;bottom:24px;right:24px;z-index:9999;background:white;';\n    iframe.title = 'Asistente IA';\n    document.body.appendChild(iframe);\n  })();\n</script>`);
                        showToast("Código Shopify copiado", "success");
                      }} className="absolute top-3 right-3 p-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all">
                        <Copy className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </div>
                )}

                {/* WooCommerce */}
                {installTab === "woocommerce" && (
                  <div className="bg-white rounded-[2rem] border border-zinc-100 p-6 md:p-8 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
                      <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                        <Store className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm md:text-base font-black italic text-zinc-950 uppercase tracking-tight">WooCommerce</h4>
                        <p className="text-[8px] font-bold text-zinc-400 italic">Plugin para WordPress + WooCommerce</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-[10px] md:text-xs text-zinc-600 font-medium leading-relaxed">
                      <p><strong>1.</strong> En el panel de WordPress, ve a <strong>Apariencia → Editor de temas → footer.php</strong> (o <strong>theme.json</strong> según tu tema).</p>
                      <p><strong>2.</strong> Pega este código justo antes del <code className="text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded text-[9px] font-mono">&lt;/body&gt;</code>:</p>
                    </div>
                    <div className="relative">
                      <pre className="bg-zinc-950 text-zinc-100 p-4 md:p-5 rounded-2xl text-[10px] md:text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
{`<!-- Jandosoft AI Widget -->
<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = '${window.location.origin}/s/${(userStore as any)?.slug || "tu-tienda"}';
    iframe.style.cssText = 'width:100%;max-width:400px;height:600px;border:none;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.12);position:fixed;bottom:24px;right:24px;z-index:9999;background:white;';
    iframe.title = 'Asistente IA';
    document.body.appendChild(iframe);
  })();
</script>`}
                      </pre>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                        navigator.clipboard.writeText(`<!-- Jandosoft AI Widget -->\n<script>\n  (function() {\n    var iframe = document.createElement('iframe');\n    iframe.src = '${window.location.origin}/s/${(userStore as any)?.slug || "tu-tienda"}';\n    iframe.style.cssText = 'width:100%;max-width:400px;height:600px;border:none;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.12);position:fixed;bottom:24px;right:24px;z-index:9999;background:white;';\n    iframe.title = 'Asistente IA';\n    document.body.appendChild(iframe);\n  })();\n</script>`);
                        showToast("Código WooCommerce copiado", "success");
                      }} className="absolute top-3 right-3 p-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all">
                        <Copy className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                    <p className="text-[9px] text-zinc-400 italic font-medium">También puedes usar el plugin <strong>"Insert Headers and Footers"</strong> para agregar el código sin editar el tema.</p>
                  </div>
                )}

                {/* Wix */}
                {installTab === "wix" && (
                  <div className="bg-white rounded-[2rem] border border-zinc-100 p-6 md:p-8 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm md:text-base font-black italic text-zinc-950 uppercase tracking-tight">Wix</h4>
                        <p className="text-[8px] font-bold text-zinc-400 italic">Para sitios en Wix</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-[10px] md:text-xs text-zinc-600 font-medium leading-relaxed">
                      <p><strong>1.</strong> En el editor de Wix, haz clic en <strong>Añadir → Más → HTML Personalizado</strong>.</p>
                      <p><strong>2.</strong> Arrastra el elemento a tu página y pega este código:</p>
                    </div>
                    <div className="relative">
                      <pre className="bg-zinc-950 text-zinc-100 p-4 md:p-5 rounded-2xl text-[10px] md:text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
{`<div id="jandosoft-widget"></div>
<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = '${window.location.origin}/s/${(userStore as any)?.slug || "tu-tienda"}';
    iframe.style.cssText = 'width:100%;max-width:400px;height:600px;border:none;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.12);position:fixed;bottom:24px;right:24px;z-index:9999;background:white;';
    iframe.title = 'Asistente IA';
    document.getElementById('jandosoft-widget').appendChild(iframe);
  })();
</script>`}
                      </pre>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                        navigator.clipboard.writeText(`<div id="jandosoft-widget"></div>\n<script>\n  (function() {\n    var iframe = document.createElement('iframe');\n    iframe.src = '${window.location.origin}/s/${(userStore as any)?.slug || "tu-tienda"}';\n    iframe.style.cssText = 'width:100%;max-width:400px;height:600px;border:none;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.12);position:fixed;bottom:24px;right:24px;z-index:9999;background:white;';\n    iframe.title = 'Asistente IA';\n    document.getElementById('jandosoft-widget').appendChild(iframe);\n  })();\n</script>`);
                        showToast("Código Wix copiado", "success");
                      }} className="absolute top-3 right-3 p-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all">
                        <Copy className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </div>
                )}

                {/* WordPress */}
                {installTab === "wordpress" && (
                  <div className="bg-white rounded-[2rem] border border-zinc-100 p-6 md:p-8 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
                      <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm md:text-base font-black italic text-zinc-950 uppercase tracking-tight">WordPress</h4>
                        <p className="text-[8px] font-bold text-zinc-400 italic">Para cualquier sitio en WordPress</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-[10px] md:text-xs text-zinc-600 font-medium leading-relaxed">
                      <p><strong>Opción 1:</strong> Ve a <strong>Apariencia → Editor de temas → footer.php</strong> y pega el script antes del <code className="text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded text-[9px] font-mono">&lt;/body&gt;</code>.</p>
                      <p><strong>Opción 2:</strong> Usa el plugin <strong>"Insert Headers and Footers"</strong> o <strong>"WPCode"</strong> para agregar el código sin editar archivos.</p>
                    </div>
                    <div className="relative">
                      <pre className="bg-zinc-950 text-zinc-100 p-4 md:p-5 rounded-2xl text-[10px] md:text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
{`<!-- Jandosoft AI Widget -->
<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = '${window.location.origin}/s/${(userStore as any)?.slug || "tu-tienda"}';
    iframe.style.cssText = 'width:100%;max-width:400px;height:600px;border:none;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.12);position:fixed;bottom:24px;right:24px;z-index:9999;background:white;';
    iframe.title = 'Asistente IA';
    document.body.appendChild(iframe);
  })();
</script>`}
                      </pre>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                        navigator.clipboard.writeText(`<!-- Jandosoft AI Widget -->\n<script>\n  (function() {\n    var iframe = document.createElement('iframe');\n    iframe.src = '${window.location.origin}/s/${(userStore as any)?.slug || "tu-tienda"}';\n    iframe.style.cssText = 'width:100%;max-width:400px;height:600px;border:none;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.12);position:fixed;bottom:24px;right:24px;z-index:9999;background:white;';\n    iframe.title = 'Asistente IA';\n    document.body.appendChild(iframe);\n  })();\n</script>`);
                        showToast("Código WordPress copiado", "success");
                      }} className="absolute top-3 right-3 p-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all">
                        <Copy className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </div>
                )}

                {/* Requirements note */}
                <div className="bg-amber-50 border border-amber-200 p-4 md:p-6 rounded-[1.8rem] md:rounded-[2.5rem] space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 mt-0.5 bg-amber-200 rounded-lg flex items-center justify-center text-amber-700 shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] md:text-xs font-black italic text-amber-800">Requisito</p>
                      <p className="text-[9px] md:text-[10px] font-medium text-amber-700 mt-1">El widget solo se mostrará si activaste "IA Pública" en la configuración de la tienda. Si no ves el asistente, ve a Ajustes de Tienda y activa la opción.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {section === "smartforms" && (
              <div className="space-y-6 md:space-y-8">
                <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
                  <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">Smart <span className="text-red-600">Forms</span></h3>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => {
                    setEditingSmartForm(null);
                    setSmartFormName("");
                    setSmartFormDesc("");
                    setSmartFormFields([]);
                    setShowAddSmartForm(true);
                  }} className="px-5 md:px-6 py-2.5 md:py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] md:text-xs italic hover:bg-red-700 transition-all shadow-xl flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> NUEVO FORMULARIO
                  </motion.button>
                </div>

                {smartForms.length === 0 ? (
                  <div className="py-16 md:py-20 text-center italic font-black uppercase tracking-widest text-zinc-200">
                    No hay formularios. Crea tu primer Smart Form para empezar a recolectar datos.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {smartForms.map(form => (
                      <div key={form.id} className="bg-white max-[400px]:p-4 p-6 rounded-[1.5rem] md:rounded-[2rem] border border-zinc-100 space-y-3 md:space-y-4 group hover:border-red-200 transition-all shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600 shrink-0">
                              <FileSpreadsheet className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-black italic text-zinc-950 text-sm md:text-base truncate">{form.name}</p>
                              {form.description && <p className="text-[9px] md:text-[10px] text-zinc-400 font-medium italic truncate">{form.description}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                              setShowFormEmbed(form);
                            }} className="p-1.5 md:p-2 text-zinc-300 hover:text-blue-500 transition-all"><Code className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                              setShowFormSubmissions(form);
                            }} className="p-1.5 md:p-2 text-zinc-300 hover:text-emerald-500 transition-all"><Layers className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                              setEditingSmartForm(form);
                              setSmartFormName(form.name);
                              setSmartFormDesc(form.description || "");
                              setSmartFormFields(form.fields || []);
                              setShowAddSmartForm(true);
                            }} className="p-1.5 md:p-2 text-zinc-300 hover:text-blue-500 transition-all"><Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setConfirmDeleteForm(form)} className="p-1.5 md:p-2 text-zinc-300 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" /></motion.button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-[9px] md:text-[10px] font-bold text-zinc-400 italic">
                          <span>{(form.fields || []).length} campos</span>
                          <span className="w-1 h-1 rounded-full bg-zinc-300" />
                          <span>{(form.submissions || []).length} respuestas</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Create / Edit Form Modal */}
                <AnimatePresence>
                  {showAddSmartForm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 md:p-6" onClick={() => { setShowAddSmartForm(false); setEditingSmartForm(null); }}>
                      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-2xl bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-4xl relative max-h-[90vh] overflow-y-auto no-scrollbar" onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setShowAddSmartForm(false); setEditingSmartForm(null); }} className="absolute top-4 right-4 p-2 hover:bg-zinc-50 rounded-xl"><X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></button>
                        <h3 className="text-xl md:text-2xl font-black italic text-zinc-950 mb-6 uppercase tracking-tighter">{editingSmartForm ? "Editar Formulario" : "Nuevo Formulario"}</h3>

                        <div className="space-y-5">
                          <div>
                            <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Nombre del Formulario</label>
                            <input type="text" value={smartFormName} onChange={e => setSmartFormName(e.target.value)} placeholder="Ej. Formulario de Contacto" className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Descripción (opcional)</label>
                            <textarea value={smartFormDesc} onChange={e => setSmartFormDesc(e.target.value)} placeholder="Ej. Formulario para que los clientes nos contacten..." className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all resize-none h-20 mt-1 text-sm" />
                          </div>

                          {/* Fields */}
                          <div className="border-t border-zinc-100 pt-5">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-black italic text-zinc-950 uppercase tracking-tight">Campos <span className="text-zinc-400">({smartFormFields.length})</span></h4>
                            </div>

                            {editingSFormField !== null && (
                              <div className="bg-zinc-50 rounded-2xl p-4 md:p-5 mb-4 space-y-3 border border-zinc-100">
                                <div className="flex items-center justify-between">
                                  <p className="text-[9px] font-black text-zinc-400 uppercase italic">{editingSFormField === -1 ? "Nuevo Campo" : "Editar Campo"}</p>
                                  <button onClick={() => setEditingSFormField(null)} className="text-[9px] font-black text-rose-400 hover:text-rose-600 italic">CANCELAR</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[8px] font-black text-zinc-400 uppercase italic">Tipo</label>
                                    <select value={sformFieldType} onChange={e => setSformFieldType(e.target.value)} className="w-full bg-white p-2.5 rounded-xl border border-zinc-100 outline-none font-medium text-xs mt-1">
                                      <option value="text">Texto</option>
                                      <option value="email">Email</option>
                                      <option value="phone">Teléfono</option>
                                      <option value="textarea">Área de texto</option>
                                      <option value="number">Número</option>
                                      <option value="date">Fecha</option>
                                      <option value="select">Selección</option>
                                      <option value="checkbox">Checkbox</option>
                                      <option value="radio">Radio</option>
                                      <option value="file">Archivo</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[8px] font-black text-zinc-400 uppercase italic">Etiqueta</label>
                                    <input type="text" value={sformFieldLabel} onChange={e => setSformFieldLabel(e.target.value)} placeholder="Ej. Nombre completo" className="w-full bg-white p-2.5 rounded-xl border border-zinc-100 outline-none font-medium text-xs mt-1" />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[8px] font-black text-zinc-400 uppercase italic">Placeholder</label>
                                    <input type="text" value={sformFieldPlaceholder} onChange={e => setSformFieldPlaceholder(e.target.value)} placeholder="Ej. Escribe tu nombre..." className="w-full bg-white p-2.5 rounded-xl border border-zinc-100 outline-none font-medium text-xs mt-1" />
                                  </div>
                                  <div className="flex items-end pb-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input type="checkbox" checked={sformFieldRequired} onChange={e => setSformFieldRequired(e.target.checked)} className="w-4 h-4 accent-red-600 rounded" />
                                      <span className="text-[9px] font-black text-zinc-500 uppercase italic">Campo obligatorio</span>
                                    </label>
                                  </div>
                                </div>
                                {["select", "checkbox", "radio"].includes(sformFieldType) && (
                                  <div>
                                    <label className="text-[8px] font-black text-zinc-400 uppercase italic">Opciones (una por línea)</label>
                                    <textarea value={sformFieldOptions} onChange={e => setSformFieldOptions(e.target.value)} placeholder="Opción 1&#10;Opción 2&#10;Opción 3" className="w-full bg-white p-2.5 rounded-xl border border-zinc-100 outline-none font-medium text-xs mt-1 resize-none h-20" />
                                  </div>
                                )}
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => {
                                  if (!sformFieldLabel.trim()) { showToast("La etiqueta es obligatoria", "info"); return; }
                                  const newField = {
                                    id: editingSFormField === -1 ? Date.now() : smartFormFields[editingSFormField].id,
                                    type: sformFieldType,
                                    label: sformFieldLabel.trim(),
                                    placeholder: sformFieldPlaceholder,
                                    required: sformFieldRequired,
                                    options: ["select", "checkbox", "radio"].includes(sformFieldType) ? sformFieldOptions.split("\n").map(o => o.trim()).filter(Boolean) : [],
                                  };
                                  let updated;
                                  if (editingSFormField === -1) {
                                    updated = [...smartFormFields, newField];
                                  } else {
                                    updated = smartFormFields.map((f, i) => i === editingSFormField ? newField : f);
                                  }
                                  setSmartFormFields(updated);
                                  setEditingSFormField(null);
                                  setSformFieldType("text");
                                  setSformFieldLabel("");
                                  setSformFieldPlaceholder("");
                                  setSformFieldRequired(false);
                                  setSformFieldOptions("");
                                }} disabled={!sformFieldLabel.trim()} className="w-full py-3 bg-red-600 text-white rounded-xl font-black text-[10px] italic hover:bg-red-700 transition-all shadow-md disabled:opacity-50">
                                  {editingSFormField === -1 ? "AGREGAR CAMPO" : "ACTUALIZAR CAMPO"}
                                </motion.button>
                              </div>
                            )}

                            {smartFormFields.length === 0 && editingSFormField === null ? (
                              <div className="py-8 text-center italic font-black uppercase tracking-widest text-zinc-200 text-xs">No hay campos. Agrega tu primer campo.</div>
                            ) : (
                              <div className="space-y-2">
                                {smartFormFields.map((field, i) => (
                                  <div key={field.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl group/field">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="flex flex-col gap-0.5">
                                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                                          if (i === 0) return;
                                          const updated = [...smartFormFields];
                                          [updated[i-1], updated[i]] = [updated[i], updated[i-1]];
                                          setSmartFormFields(updated);
                                        }} disabled={i === 0} className="text-zinc-300 hover:text-zinc-600 disabled:opacity-30 p-0.5"><ChevronUp className="w-3 h-3" /></motion.button>
                                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                                          if (i === smartFormFields.length - 1) return;
                                          const updated = [...smartFormFields];
                                          [updated[i], updated[i+1]] = [updated[i+1], updated[i]];
                                          setSmartFormFields(updated);
                                        }} disabled={i === smartFormFields.length - 1} className="text-zinc-300 hover:text-zinc-600 disabled:opacity-30 p-0.5"><ChevronDown className="w-3 h-3" /></motion.button>
                                      </div>
                                      <div>
                                        <p className="text-xs font-bold italic text-zinc-700 truncate">{field.label}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                          <span className="px-1.5 py-0.5 bg-zinc-200 text-zinc-500 rounded text-[7px] font-black uppercase italic">{field.type}</span>
                                          {field.required && <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded text-[7px] font-black uppercase italic">Req</span>}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover/field:opacity-100 transition-all">
                                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                                        setSformFieldType(field.type);
                                        setSformFieldLabel(field.label);
                                        setSformFieldPlaceholder(field.placeholder || "");
                                        setSformFieldRequired(field.required || false);
                                        setSformFieldOptions((field.options || []).join("\n"));
                                        setEditingSFormField(i);
                                      }} className="p-1.5 text-zinc-300 hover:text-blue-500 transition-all"><Edit3 className="w-3 h-3" /></motion.button>
                                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                                        setSmartFormFields(smartFormFields.filter((_, fi) => fi !== i));
                                      }} className="p-1.5 text-zinc-300 hover:text-rose-500 transition-all"><Trash2 className="w-3 h-3" /></motion.button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {editingSFormField === null && (
                              <motion.button whileTap={{ scale: 0.95 }} onClick={() => {
                                setSformFieldType("text");
                                setSformFieldLabel("");
                                setSformFieldPlaceholder("");
                                setSformFieldRequired(false);
                                setSformFieldOptions("");
                                setEditingSFormField(-1);
                              }} className="w-full mt-3 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-black text-[10px] italic hover:bg-zinc-200 transition-all flex items-center justify-center gap-2">
                                <Plus className="w-3.5 h-3.5" /> AÑADIR CAMPO
                              </motion.button>
                            )}
                          </div>

                          <button onClick={() => {
                            if (!smartFormName.trim()) { showToast("El nombre del formulario es obligatorio", "info"); return; }
                            if (smartFormFields.length === 0) { showToast("Agrega al menos un campo", "info"); return; }
                            let updated;
                            if (editingSmartForm) {
                              updated = smartForms.map(f => f.id === editingSmartForm.id ? { ...f, name: smartFormName.trim(), description: smartFormDesc.trim(), fields: smartFormFields } : f);
                            } else {
                              updated = [...smartForms, { id: Date.now(), name: smartFormName.trim(), description: smartFormDesc.trim(), fields: smartFormFields, submissions: [], createdAt: new Date().toISOString() }];
                            }
                            setSmartForms(updated);
                            persistStore(undefined, undefined, undefined, undefined, undefined, undefined, updated);
                            setShowAddSmartForm(false);
                            setEditingSmartForm(null);
                            setSmartFormName("");
                            setSmartFormDesc("");
                            setSmartFormFields([]);
                            showToast(editingSmartForm ? "Formulario actualizado" : "Formulario creado", "success");
                          }} disabled={!smartFormName.trim() || smartFormFields.length === 0} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black italic text-sm hover:bg-red-700 transition-all shadow-xl disabled:opacity-50">
                            {editingSmartForm ? "ACTUALIZAR FORMULARIO" : "CREAR FORMULARIO"}
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submissions Modal */}
                <AnimatePresence>
                  {showFormSubmissions && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 md:p-6" onClick={() => setShowFormSubmissions(null)}>
                      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-4xl bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-4xl relative max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowFormSubmissions(null)} className="absolute top-4 right-4 p-2 hover:bg-zinc-50 rounded-xl"><X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></button>
                        <h3 className="text-xl md:text-2xl font-black italic text-zinc-950 mb-2 uppercase tracking-tighter">{showFormSubmissions.name}</h3>
                        <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 italic mb-6">{(showFormSubmissions.submissions || []).length} respuestas</p>

                        {(showFormSubmissions.submissions || []).length === 0 ? (
                          <div className="py-12 text-center italic font-black uppercase tracking-widest text-zinc-200 text-sm">Sin respuestas aún</div>
                        ) : (
                          <div className="overflow-x-auto flex-1">
                            <table className="w-full text-xs md:text-sm">
                              <thead>
                                <tr className="border-b border-zinc-100">
                                  <th className="text-left py-2 px-2 font-black italic text-zinc-400 text-[9px] md:text-[10px] uppercase tracking-wider">#</th>
                                  {(showFormSubmissions.fields || []).map((f: any) => (
                                    <th key={f.id} className="text-left py-2 px-2 font-black italic text-zinc-400 text-[9px] md:text-[10px] uppercase tracking-wider whitespace-nowrap">{f.label}</th>
                                  ))}
                                  <th className="text-left py-2 px-2 font-black italic text-zinc-400 text-[9px] md:text-[10px] uppercase tracking-wider whitespace-nowrap">Fecha</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(showFormSubmissions.submissions || []).map((sub: any, i: number) => (
                                  <tr key={sub.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-all">
                                    <td className="py-2.5 px-2 font-bold text-zinc-400 italic">{i + 1}</td>
                                    {(showFormSubmissions.fields || []).map((f: any) => (
                                      <td key={f.id} className="py-2.5 px-2 font-medium text-zinc-700 max-w-[200px] truncate">{sub.data?.[f.id] || "-"}</td>
                                    ))}
                                    <td className="py-2.5 px-2 font-medium text-zinc-400 text-[10px] whitespace-nowrap">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Embed Modal */}
                <AnimatePresence>
                  {showFormEmbed && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 md:p-6" onClick={() => setShowFormEmbed(null)}>
                      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-lg bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-4xl relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowFormEmbed(null)} className="absolute top-4 right-4 p-2 hover:bg-zinc-50 rounded-xl"><X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></button>
                        <h3 className="text-xl md:text-2xl font-black italic text-zinc-950 mb-2 uppercase tracking-tighter">Embed <span className="text-red-600">{showFormEmbed.name}</span></h3>
                        <p className="text-[9px] font-bold text-zinc-400 italic mb-6">Inserta este formulario en tu sitio web</p>
                        <div className="space-y-5">
                          <div className="bg-zinc-50 rounded-2xl p-4 space-y-3">
                            <h4 className="text-[9px] font-black text-zinc-500 uppercase italic tracking-wider">Iframe</h4>
                            <div className="relative">
                              <pre className="bg-zinc-950 text-zinc-100 p-3 rounded-xl text-[9px] md:text-[10px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
{`<iframe
  src="${window.location.origin}/embed/form/${(userStore as any)?.slug || "tu-tienda"}/${showFormEmbed.id}"
  style="width:100%;max-width:500px;height:600px;border:none;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);background:white;"
  title="${showFormEmbed.name}"
></iframe>`}
                              </pre>
                              <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                                const code = `<iframe\n  src="${window.location.origin}/embed/form/${(userStore as any)?.slug || "tu-tienda"}/${showFormEmbed.id}"\n  style="width:100%;max-width:500px;height:600px;border:none;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);background:white;"\n  title="${showFormEmbed.name}"\n></iframe>`;
                                navigator.clipboard.writeText(code);
                                showToast("Código iframe copiado", "success");
                              }} className="absolute top-2 right-2 p-1.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all">
                                <Copy className="w-3 h-3" />
                              </motion.button>
                            </div>
                          </div>
                          <div className="bg-zinc-50 rounded-2xl p-4 space-y-3">
                            <h4 className="text-[9px] font-black text-zinc-500 uppercase italic tracking-wider">JavaScript</h4>
                            <div className="relative">
                              <pre className="bg-zinc-950 text-zinc-100 p-3 rounded-xl text-[9px] md:text-[10px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
{`<div id="jandosoft-form-${showFormEmbed.id}"></div>
<script>
  (function() {
    var container = document.getElementById('jandosoft-form-${showFormEmbed.id}');
    if (!container) return;
    var iframe = document.createElement('iframe');
    iframe.src = '${window.location.origin}/embed/form/${(userStore as any)?.slug || "tu-tienda"}/${showFormEmbed.id}';
    iframe.style.cssText = 'width:100%;max-width:500px;height:600px;border:none;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);background:white;';
    iframe.title = '${showFormEmbed.name}';
    container.appendChild(iframe);
  })();
</script>`}
                              </pre>
                              <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                                const code = `<div id="jandosoft-form-${showFormEmbed.id}"></div>\n<script>\n  (function() {\n    var container = document.getElementById('jandosoft-form-${showFormEmbed.id}');\n    if (!container) return;\n    var iframe = document.createElement('iframe');\n    iframe.src = '${window.location.origin}/embed/form/${(userStore as any)?.slug || "tu-tienda"}/${showFormEmbed.id}';\n    iframe.style.cssText = 'width:100%;max-width:500px;height:600px;border:none;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);background:white;';\n    iframe.title = '${showFormEmbed.name}';\n    container.appendChild(iframe);\n  })();\n</script>`;
                                navigator.clipboard.writeText(code);
                                showToast("Código JS copiado", "success");
                              }} className="absolute top-2 right-2 p-1.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all">
                                <Copy className="w-3 h-3" />
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Delete confirmation */}
                <AnimatePresence>
                  {confirmDeleteForm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setConfirmDeleteForm(null)}>
                      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-sm bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-4xl relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setConfirmDeleteForm(null)} className="absolute top-4 right-4 p-2 hover:bg-zinc-50 rounded-xl"><X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></button>
                        <div className="text-center space-y-4">
                          <div className="w-14 h-14 mx-auto bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600">
                            <AlertTriangle className="w-7 h-7" />
                          </div>
                          <h3 className="text-xl font-black italic text-zinc-950 uppercase tracking-tighter">¿Eliminar formulario?</h3>
                          <p className="text-sm text-zinc-500 font-medium">Se eliminará "{confirmDeleteForm.name}" y todas sus respuestas ({confirmDeleteForm.submissions?.length || 0}). Esta acción no se puede deshacer.</p>
                          <div className="flex gap-3 pt-2">
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setConfirmDeleteForm(null)} className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-black text-xs italic hover:bg-zinc-200 transition-all">
                              CANCELAR
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => {
                              const updated = smartForms.filter(f => f.id !== confirmDeleteForm.id);
                              setSmartForms(updated);
                              persistStore(undefined, undefined, undefined, undefined, undefined, undefined, updated);
                              setConfirmDeleteForm(null);
                              showToast("Formulario eliminado", "success");
                            }} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-black text-xs italic hover:bg-rose-700 transition-all shadow-md">
                              ELIMINAR
                            </motion.button>
                          </div>
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
                          }} disabled={!automationForm.name || (automationForm.actionType === "webhook" && !automationForm.actionConfig.webhookUrl) || (automationForm.actionType === "send_telegram" && !automationForm.actionConfig.chatId) || (automationForm.actionType === "send_slack" && !automationForm.actionConfig.channel)} className="w-full py-4 md:py-5 bg-red-600 text-white rounded-2xl font-black italic text-sm md:text-base hover:bg-red-700 transition-all shadow-xl disabled:opacity-50">
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

  const [showStripeDisconnectModal, setShowStripeDisconnectModal] = useState(false);

  const disconnectStripe = async () => {
    setShowStripeDisconnectModal(false);
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

                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowStripeDisconnectModal(true)} disabled={loading} className="w-full py-3 md:py-4 bg-rose-50 text-rose-600 border border-rose-200 rounded-2xl font-black text-[9px] md:text-xs italic hover:bg-rose-100 transition-all flex items-center justify-center gap-2">
                  <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  DESCONECTAR
                </motion.button>

                {showStripeDisconnectModal && (
                  <div className="bg-rose-50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-rose-200 space-y-3 md:space-y-4 text-center">
                    <p className="text-xs md:text-sm font-black italic text-rose-700">¿Desconectar Stripe? Se eliminará la cuenta conectada y se desactivarán los pagos.</p>
                    <div className="flex gap-3 md:gap-4 justify-center">
                      <button onClick={() => setShowStripeDisconnectModal(false)} className="px-5 md:px-8 py-2.5 md:py-3 bg-white text-zinc-700 rounded-xl font-black text-[10px] md:text-xs italic border border-zinc-200">
                        CANCELAR
                      </button>
                      <button onClick={disconnectStripe} className="px-5 md:px-8 py-2.5 md:py-3 bg-rose-600 text-white rounded-xl font-black text-[10px] md:text-xs italic hover:bg-rose-700">
                        DESCONECTAR
                      </button>
                    </div>
                  </div>
                )}
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
  const [appointments, setAppointments] = useState<any[]>([]);
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

  // Load appointments for AI context
  useEffect(() => {
    const storeId = (store as any)?._id;
    if (!storeId) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/appointments?storeId=${storeId}&limit=50`);
        const data = await res.json();
        setAppointments(data.appointments || []);
      } catch {}
    };
    load();
  }, [store]);

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
    setMessages([{ role: "bot", content: `¡Hola! Soy el agente IA de ${agentName || "tu negocio"}. Puedo ayudarte a gestionar productos, clientes, pedidos y citas. Solo dime qué necesitas crear, modificar o eliminar.`, timestamp: Date.now() }]);
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

  const appointmentsStr = appointments.map((a: any) =>
    `  - ${a.date} ${a.time} | ${a.customerInfo?.name || "Sin nombre"} | ${a.service?.name || "Sin servicio"} | ${a.status}`
  ).join("\n");

  const contextInfo = `DATOS ACTUALES:\nProductos (${products.length}): ${productsStr || "ninguno"}\nClientes (${customers.length}): ${customersStr || "ninguno"}\nPedidos (${orders.length}): ${ordersStr || "ninguno"}\nVentas totales: $${totalSales}${storeConfig}\n\nBASE DE CONOCIMIENTO (${kbEntries.length} entradas):\n${kbStr || "No hay entradas en la base de conocimiento."}\n\nAUTOMATIZACIONES ACTIVAS (${automations.filter((a: any) => a.enabled).length}):\n${autoStr || "No hay automatizaciones activas."}\n\nCONTACTOS (${aiContacts.length}): ${contactsStr || "No hay contactos guardados. Puedes añadir contactos con la acción addContact."}\n\nCONVERSACIONES RECIENTES (${aiConversations.length}):\n${aiConversations.map((c: any) => {
    const other = c.participants?.find((p: any) => p.email !== c.lastSenderId) || c.participants?.[0];
    return `- ${other?.name || "Usuario"}: ${c.lastMessage || "Sin mensajes"}`;
  }).join("\n") || "No hay conversaciones."}\n\nCITAS (${appointments.length}):\n${appointmentsStr || "  No hay citas agendadas."}\n\nPuedes consultar la base de conocimiento, automatizaciones, contactos, conversaciones y citas para responder preguntas del usuario. También puedes sugerir añadir, modificar o eliminar entradas de KB, automatizaciones y citas usando los actions correspondientes. Puedes enviar mensajes a otros usuarios usando la acción sendMessage y añadir contactos con addContact.`;

  const executeActions = (actions: any[]) => {
    let newProducts = [...products];
    let newCustomers = [...customers];
    let newOrders = [...orders];
    let newKbEntries = [...kbEntries];
    let newAutomations = [...automations];
    let newAppointments = [...appointments];
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
        case "addAppointment":
          (async () => {
            const storeId = (store as any)?._id;
            if (!storeId) { result += "⚠️ Error: ID de tienda no disponible. "; return; }
            try {
              const res = await fetch("/api/appointments", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  storeId,
                  customerInfo: { name: action.customerName || "", email: action.customerEmail || "", phone: action.customerPhone || "" },
                  service: { id: 0, name: action.serviceName || "General", price: action.servicePrice || 0, duration: action.duration || 60 },
                  date: action.date,
                  time: action.time,
                  duration: action.duration || 60,
                  notes: action.notes || "",
                  status: action.status || "pending",
                }),
              });
              const data = await res.json();
              if (data.appointment) {
                newAppointments = [...newAppointments, data.appointment];
                result += `✅ Cita agendada para ${action.customerName} el ${action.date} a las ${action.time}. `;
              } else { result += `⚠️ Error al crear cita. `; }
            } catch { result += `⚠️ Error al crear cita. `; }
          })();
          break;
        case "updateAppointment":
          (async () => {
            const id = action.id;
            if (!id) { result += "⚠️ Error: ID de cita requerido. "; return; }
            try {
              const res = await fetch(`/api/appointments/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(action.data || {}),
              });
              const data = await res.json();
              if (data.appointment) {
                newAppointments = newAppointments.map((a: any) => a._id === id ? data.appointment : a);
                result += `✏️ Cita actualizada. `;
              } else { result += `⚠️ Error al actualizar cita. `; }
            } catch { result += `⚠️ Error al actualizar cita. `; }
          })();
          break;
        case "cancelAppointment":
          (async () => {
            const id = action.id;
            if (!id) { result += "⚠️ Error: ID de cita requerido. "; return; }
            try {
              const res = await fetch(`/api/appointments/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "cancelled" }),
              });
              const data = await res.json();
              if (data.appointment) {
                newAppointments = newAppointments.map((a: any) => a._id === id ? data.appointment : a);
                result += `🗑️ Cita cancelada. `;
              } else { result += `⚠️ Error al cancelar cita. `; }
            } catch { result += `⚠️ Error al cancelar cita. `; }
          })();
          break;
      }
    }
    setProducts(newProducts);
    setCustomers(newCustomers);
    setOrders(newOrders);
    setKbEntries(newKbEntries);
    setAutomations(newAutomations);
    setAppointments(newAppointments);
    return { result, newProducts, newCustomers, newOrders, newKbEntries, newAutomations };
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !canSend) return;
    const userMsg = { role: "user", content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    try {
      const ac = (store as any)?.agentConfig || {};
      const defaultSystem = `Eres un asistente IA experto en gestión de negocios y en la plataforma Jandosoft. Ayudas al usuario a administrar su negocio "${agentName}" dentro de Jandosoft.

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
  {"type":"addContact","email":"email@usuario.com"},
  {"type":"addAppointment","customerName":"Juan","customerEmail":"j@e.com","customerPhone":"123","serviceName":"Consulta","servicePrice":50,"date":"2026-06-17","time":"15:00","duration":60,"notes":"Nota opcional"},
  {"type":"updateAppointment","id":"ID_DE_CITA","data":{"date":"2026-06-18","time":"16:00","status":"confirmed","notes":"Actualizada"}},
  {"type":"cancelAppointment","id":"ID_DE_CITA"}
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
- Puedes gestionar citas/agenda: crear (addAppointment), modificar (updateAppointment) y cancelar (cancelAppointment). Usa fechas implícitas ("mañana", "próximo lunes") sin preguntar de más.

LÍMITES ÉTICOS:
- NO compartas, repitas ni expongas información personal de los clientes (emails, teléfonos, nombres completos) a menos que el usuario sea el dueño del negocio y esté consultando sus propios datos.
- NO des consejos financieros, contables, legales ni médicos. Si te preguntan, recomienda consultar a un profesional.
- NO generes contenido ofensivo, discriminatorio, engañoso o inapropiado.
- NO inventes transacciones, productos o clientes que no existan en el contexto.
- Si el usuario pide algo fuera del alcance de la gestión del negocio, responde amablemente que no puedes ayudar con eso y sugiere algo relacionado al negocio.`;

      const systemContent = ac.systemPrompt
        ? `${ac.systemPrompt}\n\n${contextInfo}\n\nIMPORTANTE - Puedes MODIFICAR los datos del negocio actual. Para ello, incluye al final de tu respuesta un bloque JSON con las acciones a ejecutar, usando el formato estandar de Jandosoft.\n\nREGLAS:\n- Siempre confirma con el usuario ANTES de eliminar algo.\n- Después de crear algo, confirma el nombre y nuevo ID en tu mensaje.\n- Precios y montos en dólares.\n- No inventes datos que no existan en el contexto.\n- Si el usuario pide modificar datos, genera el JSON y explícale qué hiciste.\n- Responde en español profesional y amigable.\n\nLÍMITES ÉTICOS:\n- NO compartas, repitas ni expongas información personal de los clientes (emails, teléfonos, nombres completos) a menos que el usuario sea el dueño del negocio y esté consultando sus propios datos.\n- NO des consejos financieros, contables, legales ni médicos.\n- NO generes contenido ofensivo, discriminatorio, engañoso o inapropiado.\n- NO inventes transacciones, productos o clientes que no existan en el contexto.`
        : defaultSystem;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemContent },
            ...messages.concat(userMsg).map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }))
          ],
          overrideSystem: true,
          model: ac.model ? `openai/${ac.model}` : undefined,
          temperature: ac.temperature,
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
