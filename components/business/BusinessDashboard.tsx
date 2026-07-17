"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Store, Building2, Package, Users, ShoppingCart, DollarSign,
  Bot, ChevronRight, ChevronLeft, ArrowLeft, Plus, Trash2, BarChart3,
  TrendingUp, Clock, Edit3, X, Send, Loader2, Sparkles, User,
  Settings, CheckCircle2, Layers, Download, ExternalLink,
  ImageIcon, Upload, Link, Mic, MicOff, Paperclip, Search, BookOpen, Zap, Copy, Globe, Megaphone,   FileText, Menu, MessageSquare, FileSpreadsheet, AlertTriangle, HelpCircle, Code, ChevronUp, ChevronDown, Plug, Volume2, VolumeX, Bell, CheckCheck
} from "lucide-react";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "framer-motion";
import { cn, isSoundEnabled, setSoundEnabled } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import { MODULE_ICONS, CURRENCIES, convertToUSD, formatPrice } from "./currency";
import BusinessAI from "./BusinessAI";
import AnalyticsPanel from "./AnalyticsPanel";
import TeamPanel from "./TeamPanel";
import OrgSettingsPanel from "./OrgSettingsPanel";
import CampaignsPanel from "./CampaignsPanel";
import AppointmentsPanel from "./AppointmentsPanel";
import InvoicesPanel from "./InvoicesPanel";
import IntegrationsPanel from "./IntegrationsPanel";
import ScheduledTasksPanel from "./ScheduledTasksPanel";
import { useCategoryModules } from "@/lib/hooks/useCategoryModules";
import { ModuleId } from "@/lib/modules/registry";
import { CATEGORIES } from "@/lib/categories/registry";
import MenuPanel from "./industry/MenuPanel";
import { AddressAutocomplete } from "@/components/maps/AddressAutocomplete";
import CrmPanel from "@/components/crm/CrmPanel";
import RecipesPanel from "./industry/RecipesPanel";
import CoursesPanel from "./industry/CoursesPanel";
import ClassesPanel from "./industry/ClassesPanel";
import StudentsPanel from "./industry/StudentsPanel";
import GradesPanel from "./industry/GradesPanel";
import ClientsPanel from "./industry/ClientsPanel";
import CaseFilesPanel from "./industry/CaseFilesPanel";
import HearingsPanel from "./industry/HearingsPanel";
import MedicalRecordsPanel from "./industry/MedicalRecordsPanel";
import PrescriptionsPanel from "./industry/PrescriptionsPanel";
import DoctorsPanel from "./industry/DoctorsPanel";
import InventoryPanel from "./industry/InventoryPanel";
import GalleryPanel from "./industry/GalleryPanel";
import TestimonialsPanel from "./industry/TestimonialsPanel";
import DocumentsPanel from "./industry/DocumentsPanel";
import QRButton from "@/components/business/QRButton";

import RestaurantDashboard from "@/components/restaurant/RestaurantDashboard";
import FloorPlanEditor from "@/components/restaurant/FloorPlanEditor";
import OrdersPanel from "@/components/restaurant/OrdersPanel";
import ReservationsPanel from "@/components/restaurant/ReservationsPanel";
import PromotionsPanel from "@/components/restaurant/PromotionsPanel";
import LoyaltyPanel from "@/components/restaurant/LoyaltyPanel";
import ReviewsPanel from "@/components/restaurant/ReviewsPanel";
import WaiterCallsPanel from "@/components/restaurant/WaiterCallsPanel";

import BarbersPanel from "@/components/barbershop/BarbersPanel";
import QueuePanel from "@/components/barbershop/QueuePanel";
import BarberHistoryPanel from "@/components/barbershop/BarberHistoryPanel";

import ChatAppearancePanel from "./ChatAppearancePanel";


interface BusinessDashboardProps {
  userStore: any;
  userEmail: string;
  storeId: string | number;
  planLimits?: { maxStores: number; maxProductsPerStore: number; maxMessages: number; maxAutomations: number; maxAppointments?: number; maxCampaigns?: number; maxCustomers?: number };
  planExpired?: boolean;
  onNavigateToPricing?: () => void;
  onBack?: () => void;
  onEditStore?: (storeId: string | number, data: any) => Promise<void>;
  onDeleteStore?: (storeId: string | number) => Promise<void>;
  onSaveStore?: (storeId: string | number, data: any) => Promise<boolean>;
  initialSection?: string;
}

export default function BusinessDashboard({ userStore, userEmail, storeId, planLimits, planExpired, onNavigateToPricing, onBack, onEditStore, onDeleteStore, onSaveStore, initialSection }: BusinessDashboardProps) {
  const { t } = useLanguage();
  const storeTypeLabels: Record<string, string> = {
    general: t("user.store_type_general"),
    ventas: t("user.store_type_sales"),
    saas: t("user.store_type_saas"),
    crm: t("user.store_type_crm"),
    tienda: t("user.store_type_online"),
    educacion: t("user.store_type_educational"),
    otro: t("user.store_type_other"),
  };
  const industryLabels: Record<string, string> = {
    tecnologia: t("biz.industry_technology"),
    comercio: t("biz.industry_commerce"),
    servicios: t("biz.industry_services"),
    salud: t("biz.industry_health"),
    educacion: t("biz.industry_education"),
    otro: t("biz.industry_other"),
  };
  const [widgetOrigin, setWidgetOrigin] = useState('https://jandosoft.vercel.app');
  useEffect(() => { setWidgetOrigin(window.location.origin); }, []);

  const [section, setSection] = useState<string>((initialSection as any) || "dashboard");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");

  const isFreePlan = !planLimits || planLimits.maxCustomers === 0;

  const handleSectionChange = (newSection: string) => {
    if (isFreePlan) {
      const freeGated = ["analytics", "campaigns", "customers", "agentconfig", "gallery", "team", "smartforms", "knowledgebase"];
      if (freeGated.includes(newSection)) {
        const messages: Record<string, string> = {
          analytics: "Analytics está disponible desde el plan Starter ($29/mes)",
          campaigns: "Las campañas están disponibles desde el plan Starter ($29/mes)",
          customers: "Los clientes están disponibles desde el plan Starter ($29/mes)",
          agentconfig: "La configuración del agente IA está disponible desde el plan Starter ($29/mes)",
          gallery: "La galería está disponible desde el plan Starter ($29/mes)",
          team: "El equipo está disponible desde el plan Business ($79/mes)",
          smartforms: "Los formularios inteligentes están disponibles desde el plan Business ($79/mes)",
          knowledgebase: "La base de conocimiento está disponible desde el plan Starter ($29/mes)",
        };
        setUpgradeMessage(messages[newSection] || "Esta función está disponible desde un plan superior");
        setShowUpgradeModal(true);
        return;
      }
    }
    setSection(newSection);
  };

  useEffect(() => {
    if (initialSection) setSection(initialSection as any);
  }, [initialSection]);

  // Listen for navigate-to-integrations events from child components
  useEffect(() => {
    const handler = () => setSection("integrations");
    window.addEventListener("navigate-to-integrations", handler);
    return () => window.removeEventListener("navigate-to-integrations", handler);
  }, []);

  const [products, setProducts] = useState<{ id: number; name: string; price: number; currency: string; priceUSD: number; stock: number; images: string[] }[]>([]);
  const [services, setServices] = useState<{ id: number; name: string; desc: string; price: number; duration: number }[]>([]);
  const [showAddService, setShowAddService] = useState(false);
  const [confirmDeleteAllServices, setConfirmDeleteAllServices] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [serviceForm, setServiceForm] = useState({ name: "", desc: "", price: "", duration: "60" });
  const [customers, setCustomers] = useState<{ id: number; name: string; email: string; phone: string }[]>([]);
  const [orders, setOrders] = useState<{ id: number; product: string; amount: number; status: string }[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [productForm, setProductForm] = useState({ name: "", price: "", stock: "", currency: "USD", desc: "", barcode: "" });
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
    borderColor: "#e4e4e7",
    borderRadius: 16,
    shadow: "0 8px 40px rgba(0,0,0,0.12)",
    headerBgColor: "#dc2626",
    headerTextColor: "#ffffff",
    botBubbleColor: "#f4f4f5",
    userBubbleColor: "#dc2626",
    chatBgColor: "#f9fafb",
    inputBgColor: "#ffffff",
    inputBorderColor: "#e4e4e7",
    inputFocusColor: "#dc2626",
    inputTextColor: "#18181b",
    botTextColor: "#18181b",
    userTextColor: "#ffffff",
    fontFamily: "",
    buttonSize: 56,
    buttonPosition: "bottom-right",
    buttonStyle: "circle",
    chatWidth: 380,
    chatHeight: 540,
    animationType: "slide",
    inputRadius: 12,
    bubbleRadius: 16,
    theme: "custom",
    lang: "",
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
  const [automationTab, setAutomationTab] = useState<"rules" | "schedule">("rules");
  const [showAddAutomation, setShowAddAutomation] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<any | null>(null);
  const [automationForm, setAutomationForm] = useState({ name: "", trigger: "new_order", actionType: "send_notification", actionConfig: {} as Record<string, string>, triggerConfig: {} as Record<string, any> });
  const [showSettings, setShowSettings] = useState(false);
  const [editingStore, setEditingStore] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ name: "", desc: "", industry: "", slug: "", image: "", location: "", phone: "", currency: "USD", coordinates: null as { lat: number; lng: number } | null });
  const [storeImageUploading, setStoreImageUploading] = useState(false);
  const [publicVisible, setPublicVisible] = useState(false);
  const [publicAIEnabled, setPublicAIEnabled] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [viewingProduct, setViewingProduct] = useState<any>(null);
  const [viewImgIndex, setViewImgIndex] = useState(0);
  const [searchProduct, setSearchProduct] = useState("");
  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchOrder, setSearchOrder] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [showCategoryGrid, setShowCategoryGrid] = useState(false);

  const { showToast } = useToast();

  const storeCategory = (userStore as any)?.category || "general";
  const { grouped: moduleGroups, modules: activeModules } = useCategoryModules(storeCategory);

  useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);

  useEffect(() => {
    if (userStore) {
      setProducts(userStore.products || []);
      setServices(userStore.services || []);
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
          borderColor: ac.borderColor || "#e4e4e7",
          borderRadius: ac.borderRadius ?? 16,
          shadow: ac.shadow || "0 8px 40px rgba(0,0,0,0.12)",
          headerBgColor: ac.headerBgColor || "#dc2626",
          headerTextColor: ac.headerTextColor || "#ffffff",
          botBubbleColor: ac.botBubbleColor || "#f4f4f5",
          userBubbleColor: ac.userBubbleColor || "#dc2626",
          chatBgColor: ac.chatBgColor || "#f9fafb",
          inputBgColor: ac.inputBgColor || "#ffffff",
          inputBorderColor: ac.inputBorderColor || "#e4e4e7",
          inputFocusColor: ac.inputFocusColor || "#dc2626",
          inputTextColor: ac.inputTextColor || "#18181b",
          botTextColor: ac.botTextColor || "#18181b",
          userTextColor: ac.userTextColor || "#ffffff",
          fontFamily: ac.fontFamily || "",
          buttonSize: ac.buttonSize || 56,
          buttonPosition: ac.buttonPosition || "bottom-right",
          buttonStyle: ac.buttonStyle || "circle",
          chatWidth: ac.chatWidth || 380,
          chatHeight: ac.chatHeight || 540,
          animationType: ac.animationType || "slide",
          inputRadius: ac.inputRadius ?? 12,
          bubbleRadius: ac.bubbleRadius ?? 16,
          theme: ac.theme || "custom",
          lang: ac.lang || "",
        });
      }
    }
  }, [userStore?._id || userStore?.id]);

  useEffect(() => {
    if (!userStore?._id && !userStore?.id) return;
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    const fetchInitial = async () => {
      try {
        const res = await fetch(`/api/notifications?limit=20`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || data.notifications?.filter((n: any) => !n.read).length || 0);
        }
      } catch {}
    };

    const connect = () => {
      if (closed) return;
      if (es) { try { es.close(); } catch {} }
      es = new EventSource(`/api/notifications/stream`);
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "notification:new" && data.payload) {
            setNotifications(prev => [data.payload, ...prev].slice(0, 50));
            setUnreadCount(prev => prev + 1);
          }
        } catch {}
      };
      es.onerror = () => {
        es?.close();
        if (!closed) reconnectTimer = setTimeout(connect, 3000);
      };
    };

    fetchInitial();
    connect();

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      es?.close();
    };
  }, [userStore?._id || userStore?.id]);

  const markNotificationRead = async (id: string) => {
    try {
      await fetch(`/api/notifications`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: id }) });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {}
  };

  const markAllRead = async () => {
    try {
      await fetch(`/api/notifications`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAllRead: true }) });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {}
  };

  const persistStore = (productsData?: any[], customersData?: any[], ordersData?: any[], knowledgebaseData?: any[], automationsData?: any[], campaignsData?: any[], smartFormsData?: any[], servicesData?: any[]) => {
    const data: any = {};
    if (productsData !== undefined) data.products = productsData;
    if (customersData !== undefined) data.customers = customersData;
    if (ordersData !== undefined) data.orders = ordersData;
    if (knowledgebaseData !== undefined) data.knowledgebase = knowledgebaseData;
    if (automationsData !== undefined) data.automations = automationsData;
    if (campaignsData !== undefined) data.campaigns = campaignsData;
    if (smartFormsData !== undefined) data.smartForms = smartFormsData;
    if (servicesData !== undefined) data.services = servicesData;
    if (Object.keys(data).length > 0 && onSaveStore && storeId) {
      Promise.resolve(onSaveStore(storeId, data)).catch(e => console.error("Persist failed:", e));
    }
  };

  const handleKbExport = () => {
      if (kbEntries.length === 0) { showToast(t("knowledgebase.no_entries_export"), "info"); return; }
    const ws = XLSX.utils.json_to_sheet(kbEntries.map(e => ({
      Pregunta: e.question || "",
      Título: e.question ? "" : e.title,
      Respuesta: e.content,
      Categoría: e.category,
      Creado: e.createdAt,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t("knowledgebase.sheet_name"));
    XLSX.writeFile(wb, `conocimiento_${storeId}.xlsx`);
    showToast(t("knowledgebase.exported"), "success");
  };

  const handleDownloadKbTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { Pregunta: "¿Cómo hago una devolución?", Título: "", Respuesta: "El cliente tiene 30 días para devolver...", Categoría: "faq" },
      { Pregunta: "", Título: "Política de envíos", Respuesta: "Los envíos se realizan en 24-48 hrs...", Categoría: "politicas" },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t("knowledgebase.sheet_name"));
    XLSX.writeFile(wb, "plantilla_conocimiento.xlsx");
    showToast(t("knowledgebase.template_downloaded"), "success");
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
        if (imported.length === 0) { showToast(t("knowledgebase.no_valid_data"), "error"); setKbImporting(false); return; }
        const newCats = [...new Set([...kbCategories, ...imported.map((r: any) => r.category)])];
        setKbCategories(newCats);
        const merged = [...kbEntries, ...imported];
        setKbEntries(merged);
        persistStore(undefined, undefined, undefined, merged);
        showToast(`${imported.length} entradas importadas correctamente`, "success");
      } catch (err) {
        showToast(t("knowledgebase.file_read_error"), "error");
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
    const desc = productForm.desc || "";
    const barcode = productForm.barcode || "";
    let newProducts;
    if (editingProduct) {
      newProducts = products.map(p => p.id === editingProduct.id ? { ...p, name: productForm.name, price, currency, priceUSD, stock: parseInt(productForm.stock) || 0, images: [...productImages], desc, barcode } : p);
    } else {
      newProducts = [...products, { id: Date.now(), name: productForm.name, price, currency, priceUSD, stock: parseInt(productForm.stock) || 0, images: [...productImages], desc, barcode }];
    }
    setProducts(newProducts);
    setProductForm({ name: "", price: "", stock: "", currency: "USD", desc: "", barcode: "" });
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

  const addService = () => {
    if (!serviceForm.name || !serviceForm.price) return;
    const price = parseFloat(serviceForm.price);
    const duration = parseInt(serviceForm.duration) || 60;
    let newServices;
    if (editingService) {
      newServices = services.map(s => s.id === editingService.id ? { ...s, name: serviceForm.name, desc: serviceForm.desc, price, duration } : s);
    } else {
      newServices = [...services, { id: Date.now(), name: serviceForm.name, desc: serviceForm.desc, price, duration }];
    }
    setServices(newServices);
    setServiceForm({ name: "", desc: "", price: "", duration: "60" });
    setShowAddService(false);
    setEditingService(null);
    persistStore(undefined, undefined, undefined, undefined, undefined, undefined, undefined, newServices);
  };

  const executeAutomations = async (trigger: string, context: Record<string, any> = {}) => {
    const triggered = automations.filter(a => a.enabled && a.trigger === trigger);
    for (const auto of triggered) {
      if (auto.actionType === "send_notification") {
        const msg = auto.actionConfig.message || `⚡ Automatización "${auto.name}" ejecutada`;
        showToast(msg, "info");
        const triggerSectionMap: Record<string, string> = {
          new_order: "orders", new_customer: "customers", new_product: "products",
          low_stock: "products", payment_received: "payments",
        };
        fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "automation",
            title: `⚡ ${auto.name}`,
            message: msg,
            storeId,
            link: triggerSectionMap[trigger] ? `/business?section=${triggerSectionMap[trigger]}` : undefined,
          }),
        }).catch(() => {});
      }

      if (auto.actionType === "webhook" && auto.actionConfig.webhookUrl) {
        fetch(auto.actionConfig.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trigger, automation: auto.name, ...context }),
        }).catch(() => {});
      }

      if (auto.actionType === "send_email" && auto.actionConfig.to && auto.actionConfig.subject) {
        try {
          const emailRes = await fetch("/api/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: auto.actionConfig.to,
              subject: auto.actionConfig.subject,
              content: auto.actionConfig.body || "",
            }),
          });
          if (emailRes.ok) {
            fetch("/api/notifications", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "automation",
                title: `📧 ${auto.name}`,
                message: `Email enviado a ${auto.actionConfig.to}`,
                storeId,
                link: "/business?section=customers",
              }),
            }).catch(() => {});
          }
        } catch {}
      }

      if (auto.actionType === "send_telegram") {
        const message = auto.actionConfig.message || `⚡ ${auto.name}: ${JSON.stringify(context)}`;
        const botToken = auto.actionConfig.botToken;
        if (botToken && auto.actionConfig.chatId) {
          fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: auto.actionConfig.chatId, text: message }),
          }).catch(() => {});
        }
      }

      if (auto.actionType === "send_discord" && auto.actionConfig.webhookUrl) {
        const message = auto.actionConfig.message || `⚡ ${auto.name}: ${JSON.stringify(context)}`;
        fetch(auto.actionConfig.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: message }),
        }).catch(() => {});
      }

      if (auto.actionType === "send_slack" && auto.actionConfig.webhookUrl) {
        const message = auto.actionConfig.message || `⚡ ${auto.name}: ${JSON.stringify(context)}`;
        fetch(auto.actionConfig.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: message }),
        }).catch(() => {});
      }

      if (auto.actionType === "post_to_social") {
        showToast(`📱 Publicación lista: "${auto.actionConfig.message?.slice(0, 40)}..." (integración pendiente)`, "info");
      }

      if (auto.actionType === "ai_generate" && auto.actionConfig.prompt) {
        try {
          const res = await fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [{ role: "user", content: auto.actionConfig.prompt }],
              model: auto.actionConfig.model || "gpt-4o-mini",
              storeContext: JSON.stringify(context),
            }),
          });
          const data = await res.json();
          if (data.response) {
            showToast(`🤖 AI: ${data.response.slice(0, 80)}...`, "success");
          }
        } catch {}
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
                <span className="px-2.5 py-0.5 bg-red-50 text-red-600 rounded-full text-[9px] font-black italic uppercase">{storeTypeLabels[userStore?.type] || userStore?.typeLabel || userStore?.type || t("user.store_type_general")}</span>
                <span className="text-[9px] text-zinc-400 font-black italic">{industryLabels[userStore?.industry] || userStore?.industry}</span>
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
          <div className="relative">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowNotifications(!showNotifications)} className="p-1.5 md:p-2 hover:bg-zinc-50 rounded-xl transition-all relative" title="Notificaciones">
              <Bell className="w-4 h-4 md:w-5 md:h-5 text-zinc-400 hover:text-zinc-950 transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 md:w-5 md:h-5 bg-red-500 text-white text-[8px] md:text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">{unreadCount > 99 ? "99+" : unreadCount}</span>
              )}
            </motion.button>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-zinc-100 z-50 overflow-hidden max-h-96">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50">
                    <span className="text-xs font-black text-zinc-950 italic">Notificaciones</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[9px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1"><CheckCheck className="w-3 h-3" />Marcar leídas</button>
                    )}
                  </div>
                  <div className="overflow-y-auto max-h-72">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center"><Bell className="w-8 h-8 text-zinc-200 mx-auto mb-2" /><p className="text-xs text-zinc-400">Sin notificaciones</p></div>
                    ) : notifications.map((n: any) => (
                      <div key={n._id} onClick={() => { if (!n.read) markNotificationRead(n._id); }} className={cn("px-4 py-3 border-b border-zinc-50 cursor-pointer hover:bg-zinc-50 transition-all", !n.read && "bg-red-50/50")}>
                        <div className="flex items-start gap-2">
                          {!n.read && <span className="w-2 h-2 bg-red-500 rounded-full mt-1 shrink-0" />}
                          <div className="min-w-0">
                            <p className={cn("text-xs truncate", n.read ? "text-zinc-600" : "text-zinc-950 font-bold")}>{n.title || n.message}</p>
                            {n.message && n.title && <p className="text-[10px] text-zinc-400 truncate mt-0.5">{n.message}</p>}
                            <p className="text-[9px] text-zinc-300 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setEditingStore(false); setConfirmDelete(false); setSettingsForm({ name: userStore?.name || "", desc: userStore?.desc || "", industry: userStore?.industry || "", slug: userStore?.slug || "", image: userStore?.image || "", location: (userStore as any)?.location || "", phone: (userStore as any)?.phone || "", currency: (userStore as any)?.currency || "USD", coordinates: (userStore as any)?.coordinates || null }); setPublicVisible(!!(userStore as any)?.isPublic); setPublicAIEnabled(!!(userStore as any)?.publicAI); setShowSettings(true); }} className="p-1.5 md:p-2 hover:bg-zinc-50 rounded-xl transition-all" title={t("biz.store_settings")}>
              <Settings className="w-4 h-4 md:w-5 md:h-5 text-zinc-400 hover:text-zinc-950 transition-colors" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => { const next = !soundOn; setSoundOn(next); setSoundEnabled(next); }} className="p-1.5 md:p-2 hover:bg-zinc-50 rounded-xl transition-all" title={soundOn ? "Silenciar sonidos" : "Activar sonidos"}>
              {soundOn ? <Volume2 className="w-4 h-4 md:w-5 md:h-5 text-zinc-400 hover:text-zinc-950 transition-colors" /> : <VolumeX className="w-4 h-4 md:w-5 md:h-5 text-zinc-300 hover:text-zinc-950 transition-colors" />}
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
            {activeModules.map((mod) => (
              <motion.button
                key={mod.sectionKey}
                whileTap={{ scale: 0.92 }}
                onClick={() => handleSectionChange(mod.sectionKey)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black italic transition-all whitespace-nowrap",
                  section === mod.sectionKey
                    ? "bg-red-600 text-white shadow-md"
                    : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                )}
              >
                <span className="w-3.5 h-3.5">{MODULE_ICONS[mod.icon]}</span>
                {t(mod.nameKey)}
                {isFreePlan && ["analytics", "campaigns", "customers", "agentconfig", "gallery", "team", "smartforms", "knowledgebase"].includes(mod.sectionKey) && (
                  <span className="text-[7px] bg-amber-100 text-amber-600 px-1 py-0.5 rounded-full font-black">PRO</span>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          {showSidebar && (
            <aside className="hidden md:flex flex-col w-56 bg-zinc-50 border-r border-zinc-100 p-6 gap-6 overflow-y-auto shrink-0">
              {moduleGroups.map((group) => (
                <div key={group.groupId} className="space-y-1">
                  <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 italic">{t(group.groupNameKey)}</h3>
                  {group.modules.map((mod) => (
                    <SideBtn
                      key={mod.sectionKey}
                      icon={MODULE_ICONS[mod.icon]}
                      label={t(mod.nameKey)}
                      active={section === mod.sectionKey}
                      onClick={() => handleSectionChange(mod.sectionKey)}
                      badge={isFreePlan && ["analytics", "campaigns", "customers", "agentconfig", "gallery", "team", "smartforms", "knowledgebase"].includes(mod.sectionKey) ? "PRO" : undefined}
                    />
                  ))}
                </div>
              ))}
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

                {/* API Status Summary */}
                <div className="bg-white max-[400px]:p-4 p-5 max-[400px]:rounded-[1.5rem] rounded-[2rem] border border-zinc-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[10px] md:text-xs font-black italic text-zinc-950 uppercase tracking-tight flex items-center gap-2">
                      <Plug className="w-3.5 h-3.5 text-red-600" /> APIs Conectadas
                    </h4>
                    <button onClick={() => setSection("integrations")} className="text-[9px] font-black text-red-600 hover:text-red-700 italic uppercase">Ver todas</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "stripe", label: "Stripe", color: "#635BFF", icon: "💳" },
                      { key: "paypal", label: "PayPal", color: "#003087", icon: "🅿️" },
                      { key: "mercadopago", label: "MercadoPago", color: "#009EE3", icon: "💙" },
                      { key: "whatsapp", label: "WhatsApp", color: "#25D366", icon: "💬" },
                      { key: "telegram", label: "Telegram", color: "#26A5E4", icon: "✈️" },
                      { key: "gmail", label: "Gmail", color: "#EA4335", icon: "📧" },
                    ].filter(api => {
                      if (userStore?.integrations?.[api.key]?.enabled) return true;
                      if (api.key === "stripe" || api.key === "paypal" || api.key === "mercadopago") {
                        return userStore?.paymentIntegrations?.some((p: any) => p.provider === api.key && p.enabled);
                      }
                      return false;
                    }).map(api => {
                      const connected = userStore?.integrations?.[api.key]?.enabled || userStore?.paymentIntegrations?.some((p: any) => p.provider === api.key && p.enabled);
                      return (
                        <div key={api.key} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black italic uppercase border border-green-200 bg-green-50 text-green-700 transition-all">
                          <span>{api.icon}</span> {api.label}
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        </div>
                      );
                    })}
                    {userStore?.aiProvider?.enabled && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black italic uppercase border border-purple-200 bg-purple-50 text-purple-700">
                        🤖 IA: {userStore.aiProvider.model || userStore.aiProvider.provider}
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                      </div>
                    )}
                    {!userStore?.integrations && !userStore?.paymentIntegrations?.length && !userStore?.aiProvider?.enabled && (
                      <button onClick={() => setSection("integrations")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black italic uppercase border border-dashed border-zinc-200 bg-zinc-50 text-zinc-400 hover:border-red-300 hover:text-red-500 transition-all">
                        <Plus className="w-3 h-3" /> Conectar APIs
                      </button>
                    )}
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
                    <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("biz.products_metric")} <span className="text-red-600">({totalProducts}/{maxProducts})</span></h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                      <input type="text" placeholder={t("biz.search_product")} value={searchProduct} onChange={e => setSearchProduct(e.target.value)} className="w-36 md:w-44 bg-zinc-50 pl-10 pr-4 py-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-red-200 transition-all" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-zinc-400 italic">{totalProducts}/{maxProducts} {t("biz.used_label")}</span>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => {
                      if (canAddProduct) { setShowAddProduct(true); return; }
                      if (planExpired) { showToast(t("biz.plan_expired_warn"), "error"); onNavigateToPricing?.(); return; }
                      showToast(t("biz.limit_warn").replace("{n}", String(maxProducts)), "info");
                      onNavigateToPricing?.();
                    }} className={cn("px-5 md:px-6 py-2.5 md:py-3 rounded-2xl font-black text-[10px] md:text-xs italic transition-all shadow-xl flex items-center gap-2", canAddProduct ? "bg-red-600 text-white hover:bg-red-700" : "bg-zinc-200 text-zinc-400 cursor-not-allowed")}>
                      <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> {t("biz.add_btn")}
                    </motion.button>
                  </div>
                </div>
                {/* Plan limit warnings with CTA */}
                {planExpired && (
                  <div className="bg-red-50 border border-red-300 max-[400px]:p-4 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shrink-0" />
                      <p className="text-[10px] md:text-[11px] font-bold text-red-800 italic">{t("biz.plan_expired_warn")}</p>
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={onNavigateToPricing} className="px-6 py-3 bg-red-600 text-white rounded-xl font-black text-[10px] italic hover:bg-red-700 transition-all shadow-md">
                      {t("biz.renew_plan")}
                    </motion.button>
                  </div>
                )}
                {!planExpired && totalProducts >= maxProducts && (
                  <div className="bg-amber-50 border border-amber-300 max-[400px]:p-4 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-amber-500 rounded-full shrink-0" />
                      <p className="text-[10px] md:text-[11px] font-bold text-amber-800 italic">{t("biz.limit_warn").replace("{n}", String(maxProducts))}</p>
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={onNavigateToPricing} className="px-6 py-3 bg-amber-600 text-white rounded-xl font-black text-[10px] italic hover:bg-amber-700 transition-all shadow-md">
                      {t("biz.upgrade_plan")}
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
                            <QRButton url={`${typeof window !== "undefined" ? window.location.origin : ""}/s/${userStore?.slug || "store"}?item=products|${p.id}`} label={p.name} />
                            <motion.button whileTap={{ scale: 0.9 }}
                              onClick={(e) => { e.stopPropagation(); setEditingProduct(p); setProductForm({ name: p.name, price: String(p.price), stock: String(p.stock), currency: p.currency || "USD", desc: (p as any).desc || "", barcode: (p as any).barcode || "" }); setProductImages(p.images || []); setImageUrlInput(""); setShowAddProduct(true); }}
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
                            <span>{t("biz.stock_label")} {p.stock}</span>
                            {p.currency !== "USD" && <span>≈ ${p.priceUSD} USD</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {products.filter(p => !searchProduct || p.name.toLowerCase().includes(searchProduct.toLowerCase())).length === 0 && (
                    <div className="col-span-full py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">{searchProduct ? t("biz.no_results").replace("{query}", searchProduct) : t("biz.no_products")}</div>
                  )}
                </div>
                <AnimatePresence>
                    {showAddProduct && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4" onClick={() => { setShowAddProduct(false); setEditingProduct(null); }}>
                      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-md bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-4xl relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setShowAddProduct(false); setEditingProduct(null); }} className="absolute top-4 md:top-6 right-4 md:right-6 p-2 hover:bg-zinc-50 rounded-xl"><X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></button>
                        <h3 className="text-xl md:text-2xl font-black italic text-zinc-950 mb-4 md:mb-6 uppercase tracking-tighter">{editingProduct ? t("biz.edit_product") : t("biz.new_product")}</h3>
                        <div className="space-y-3 md:space-y-4 max-h-[70vh] overflow-y-auto pr-1 md:pr-2">
                          <input type="text" placeholder={t("biz.product_name_placeholder")} value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                            <div className="col-span-1">
                              <select value={productForm.currency} onChange={e => setProductForm({...productForm, currency: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs md:text-sm italic">
                                {CURRENCIES.filter((c, i, a) => a.findIndex(x => x.code === c.code) === i).map(c => (
                                  <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                                ))}
                              </select>
                            </div>
                            <div className="col-span-1 flex gap-2 md:gap-4">
                              <input type="number" step="0.01" placeholder={t("biz.product_price_placeholder")} value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                              <input type="number" placeholder={t("biz.product_stock_placeholder")} value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                            </div>
                          </div>
                          {productForm.price && productForm.currency && productForm.currency !== "USD" && (
                            <p className="text-[10px] text-zinc-400 font-medium italic text-right">≈ ${convertToUSD(parseFloat(productForm.price), productForm.currency).toFixed(2)} USD</p>
                          )}
                          <textarea placeholder={t("biz.product_desc_placeholder") || "Descripción del producto..."} value={productForm.desc} onChange={e => setProductForm({...productForm, desc: e.target.value})} rows={2} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm resize-none" />
                          <div className="relative">
                            <input type="text" placeholder={t("biz.product_barcode_placeholder") || "Código de barras (opcional)"} value={productForm.barcode} onChange={e => setProductForm({...productForm, barcode: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm font-mono" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-zinc-300 uppercase">Barcode</span>
                          </div>

                          {/* Images Section */}
                          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest">{t("biz.images_label")} ({productImages.length}/10)</label>
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
                              <span className="text-xs font-medium text-zinc-500 italic">{t("biz.upload_device")}</span>
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
                                  type="text" placeholder={t("biz.image_url_placeholder")}
                                  value={imageUrlInput}
                                  onChange={e => setImageUrlInput(e.target.value)}
                                   className="w-full bg-white p-2.5 md:p-3 pl-8 md:pl-10 rounded-xl border border-zinc-200 outline-none text-[10px] md:text-xs font-medium focus:border-red-200 transition-all"
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
                                {t("biz.add_image")}
                              </button>
                            </div>
                          </div>

                          <button onClick={addProduct} disabled={!productForm.name || !productForm.price} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black italic hover:bg-red-700 transition-all shadow-xl disabled:opacity-50">
                            {editingProduct ? t("biz.update_product") : t("biz.save_product")}
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
                            <div className="relative bg-zinc-50 min-h-[200px] md:min-h-[400px] flex items-center">
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
                                  {viewingProduct.stock > 0 ? `${viewingProduct.stock} ${t("biz.in_stock")}` : t("biz.out_of_stock")}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <motion.button whileTap={{ scale: 0.95 }}
                                  onClick={() => { setEditingProduct(viewingProduct); setProductForm({ name: viewingProduct.name, price: String(viewingProduct.price), stock: String(viewingProduct.stock), currency: viewingProduct.currency || "USD", desc: viewingProduct.desc || "", barcode: viewingProduct.barcode || "" }); setProductImages(viewingProduct.images || []); setImageUrlInput(""); setShowAddProduct(true); setViewingProduct(null); }}
                                  className="flex-1 py-3 bg-zinc-950 text-white rounded-2xl font-black italic text-[10px] hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                                >
                                  <Edit3 className="w-3.5 h-3.5" /> {t("biz.edit_btn")}
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

            {section === "services" && (
              <div className="space-y-6 md:space-y-8">
                <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
                  <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                    <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("nav.services")} <span className="text-red-600">({services.length})</span></h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {services.length > 0 && (
                      confirmDeleteAllServices ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] md:text-xs font-bold text-rose-600">¿Eliminar todos?</span>
                          <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setServices([]); persistStore(undefined, undefined, undefined, undefined, undefined, undefined, undefined, []); setConfirmDeleteAllServices(false); }} className="px-3 py-2 bg-rose-600 text-white rounded-xl font-black text-[10px] md:text-xs hover:bg-rose-700 transition-all">
                            Sí, eliminar
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setConfirmDeleteAllServices(false)} className="px-3 py-2 bg-zinc-100 text-zinc-600 rounded-xl font-bold text-[10px] md:text-xs hover:bg-zinc-200 transition-all">
                            Cancelar
                          </motion.button>
                        </div>
                      ) : (
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setConfirmDeleteAllServices(true)} className="px-4 py-2.5 bg-zinc-100 text-zinc-500 rounded-2xl font-black text-[10px] md:text-xs italic hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center gap-1.5">
                          <Trash2 className="w-3.5 h-3.5" /> Eliminar todos
                        </motion.button>
                      )
                    )}
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setEditingService(null); setServiceForm({ name: "", desc: "", price: "", duration: "60" }); setShowAddService(true); }} className="px-5 md:px-6 py-2.5 md:py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] md:text-xs italic hover:bg-red-700 transition-all shadow-xl flex items-center gap-2">
                      <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> {t("services.add")}
                    </motion.button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {services.map((s) => (
                    <div key={s.id} className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-zinc-100 shadow-sm p-5 md:p-6 space-y-4 hover:shadow-lg hover:border-zinc-200 transition-all group">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-black italic text-zinc-950 text-sm md:text-base leading-tight truncate">{s.name}</h4>
                          {s.desc && <p className="text-[11px] md:text-xs text-zinc-400 font-medium italic mt-1 line-clamp-2">{s.desc}</p>}
                        </div>
                        <span className="text-lg md:text-xl font-black italic text-red-600 shrink-0 whitespace-nowrap">{formatPrice(s.price, (userStore as any)?.currency || "USD")}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase italic">
                          <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" /> {s.duration} min
                        </div>
                        <div className="flex items-center gap-1">
                          <QRButton url={`${typeof window !== "undefined" ? window.location.origin : ""}/s/${userStore?.slug || "store"}?item=services|${s.id}`} label={s.name} />
                          <motion.button whileTap={{ scale: 0.9 }}
                            onClick={() => { setEditingService(s); setServiceForm({ name: s.name, desc: s.desc || "", price: String(s.price), duration: String(s.duration || 60) }); setShowAddService(true); }}
                            className="p-1.5 md:p-2 text-zinc-300 hover:text-blue-500 transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.9 }}
                            onClick={() => { const ns = services.filter(x => x.id !== s.id); setServices(ns); persistStore(undefined, undefined, undefined, undefined, undefined, undefined, undefined, ns); }}
                            className="p-1.5 md:p-2 text-zinc-300 hover:text-rose-500 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {services.length === 0 && (
                    <div className="col-span-full py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">{t("services.empty")}</div>
                  )}
                </div>

                <AnimatePresence>
                  {showAddService && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4" onClick={() => { setShowAddService(false); setEditingService(null); }}>
                      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-md bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-4xl relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setShowAddService(false); setEditingService(null); }} className="absolute top-4 md:top-6 right-4 md:right-6 p-2 hover:bg-zinc-50 rounded-xl"><X className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /></button>
                        <h3 className="text-xl md:text-2xl font-black italic text-zinc-950 mb-4 md:mb-6 uppercase tracking-tighter">{editingService ? t("services.edit") : t("services.new")}</h3>
                        <div className="space-y-3 md:space-y-4">
                          <input type="text" placeholder={t("services.name_placeholder")} value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                          <textarea placeholder={t("services.desc_placeholder")} value={serviceForm.desc} onChange={e => setServiceForm({...serviceForm, desc: e.target.value})} rows={3} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm resize-none" />
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("services.price")}</label>
                              <input type="number" step="0.01" placeholder="0.00" value={serviceForm.price} onChange={e => setServiceForm({...serviceForm, price: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("services.duration")}</label>
                              <input type="number" placeholder="60" value={serviceForm.duration} onChange={e => setServiceForm({...serviceForm, duration: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                            </div>
                          </div>
                          <button onClick={addService} disabled={!serviceForm.name || !serviceForm.price} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black italic hover:bg-red-700 transition-all shadow-xl disabled:opacity-50">
                            {editingService ? t("services.update_btn") : t("services.save_btn")}
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {section === "customers" && (
              <CrmPanel storeId={storeId as string} />
            )}

            {section === "orders" && (
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                  <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("biz.orders_metric")} <span className="text-red-600">({orders.length})</span></h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                    <input type="text" placeholder={t("biz.search_order")} value={searchOrder} onChange={e => setSearchOrder(e.target.value)} className="w-36 md:w-44 bg-zinc-50 pl-10 pr-4 py-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-red-200 transition-all" />
                  </div>
                </div>
                {orders.filter(o => !searchOrder || o.product.toLowerCase().includes(searchOrder.toLowerCase()) || o.status.toLowerCase().includes(searchOrder.toLowerCase())).length === 0 ? (
                  <div className="py-12 md:py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">{searchOrder ? t("biz.no_results").replace("{query}", searchOrder) : t("biz.no_orders")}</div>
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

            {section === "analytics" && (
              <AnalyticsPanel storeId={storeId} />
            )}

            {section === "team" && (
              <TeamPanel />
            )}

            {section === "orgsettings" && (
              <>
                <div className="space-y-6 max-[400px]:space-y-5">
                  <h3 className="text-2xl max-[400px]:text-xl font-black italic text-zinc-950 uppercase tracking-tighter">
                    <Settings className="w-6 h-6 max-[400px]:w-5 max-[400px]:h-5 inline mr-3 text-red-600" />{t("org.title")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-[400px]:gap-5 gap-6">
                    <div className="bg-white p-6 max-[400px]:p-5 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-5 max-[400px]:space-y-4">
                      <div className="flex items-center gap-3">
                        <Store className="w-5 h-5 text-red-600" />
                        <p className="text-sm max-[400px]:text-xs font-black italic text-zinc-950 uppercase tracking-tighter">{t("org.company")}</p>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("org.category_label")}</label>
                          <button
                            onClick={() => setShowCategoryGrid(true)}
                            className="w-full bg-zinc-50 p-3.5 max-[400px]:p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm text-left flex items-center justify-between"
                          >
                            <span>{t("cat_" + storeCategory)}</span>
                            <ChevronDown className="w-4 h-4 text-zinc-400" />
                          </button>
                        </div>
                        <p className="text-[10px] font-bold text-zinc-400 italic">
                          {t("cat_" + storeCategory + "_desc")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <OrgSettingsPanel />
              </>
            )}

            {section === "appointments" && (
              <AppointmentsPanel storeId={String(storeId)} />
            )}

            {section === "invoices" && (
              <InvoicesPanel storeId={storeId} userEmail={userEmail} />
            )}

            {section === "campaigns" && (
              <CampaignsPanel campaigns={campaigns} setCampaigns={setCampaigns} onPersist={(d) => persistStore(undefined, undefined, undefined, undefined, undefined, d)} storeId={String(storeId)} />
            )}

            {section === "integrations" && (
              <IntegrationsPanel storeId={String(storeId)} userEmail={userEmail} />
            )}

            {section === "ai" && (
              <div className="h-full flex flex-col">
                <BusinessAI agentName={userStore?.name || "mi negocio"} store={userStore} products={products} setProducts={setProducts} services={services} setServices={setServices} customers={customers} setCustomers={setCustomers} orders={orders} setOrders={setOrders} totalSales={totalSales} kbEntries={kbEntries} setKbEntries={setKbEntries} campaigns={campaigns} setCampaigns={setCampaigns} automations={automations} setAutomations={setAutomations} onPersist={persistStore} onExecuteAutomations={executeAutomations} onSaveStore={onSaveStore} maxMessages={planLimits?.maxMessages ?? 999} />
              </div>
            )}

            {section === "knowledgebase" && (
              <div className="space-y-6 md:space-y-8">
                <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
                  <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                    <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("knowledgebase.title")} <span className="text-red-600">({kbEntries.length})</span></h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                      <input type="text" placeholder={t("knowledgebase.search_placeholder")} value={searchKb} onChange={e => setSearchKb(e.target.value)} className="w-36 md:w-44 bg-zinc-50 pl-10 pr-4 py-2.5 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-red-200 transition-all" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleKbImport} />
                    <motion.button whileTap={{ scale: 0.95 }} disabled={kbImporting} onClick={() => fileInputRef.current?.click()} className={cn("px-2.5 md:px-4 py-2 md:py-3 rounded-2xl font-black text-[8px] md:text-[10px] italic transition-all shadow-md flex items-center gap-1 md:gap-1.5", kbImporting ? "bg-zinc-300 text-zinc-500 cursor-not-allowed" : "bg-emerald-600 text-white hover:bg-emerald-700")}>
                      {kbImporting ? <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : <FileSpreadsheet className="w-3 h-3 md:w-4 md:h-4" />} <span className="hidden sm:inline">{kbImporting ? t("knowledgebase.import_loading") : t("knowledgebase.import")}</span>
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={handleKbExport} className="px-2.5 md:px-4 py-2 md:py-3 bg-blue-600 text-white rounded-2xl font-black text-[8px] md:text-[10px] italic hover:bg-blue-700 transition-all shadow-md flex items-center gap-1 md:gap-1.5">
                      <Download className="w-3 h-3 md:w-4 md:h-4" /> <span className="hidden sm:inline">{t("knowledgebase.export")}</span>
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setEditingKb(null); setKbForm({ title: "", content: "", category: kbCategories[0], question: "" }); setShowAddKb(true); }} className="px-3 md:px-5 py-2 md:py-3 bg-red-600 text-white rounded-2xl font-black text-[9px] md:text-xs italic hover:bg-red-700 transition-all shadow-xl flex items-center gap-1.5 md:gap-2">
                      <Plus className="w-3 h-3 md:w-4 md:h-4" /> {t("knowledgebase.add")}
                    </motion.button>
                  </div>
                </div>

                {/* Action bar */}
                <div className="flex items-center gap-2 flex-wrap">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={handleDownloadKbTemplate} className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl font-black text-[9px] italic hover:bg-zinc-200 transition-all flex items-center gap-1.5">
                    <Download className="w-3 h-3" /> {t("knowledgebase.template")}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowManageCategories(true)} className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl font-black text-[9px] italic hover:bg-zinc-200 transition-all flex items-center gap-1.5">
                    <Layers className="w-3 h-3" /> {t("knowledgebase.manage_categories")}
                  </motion.button>
                  {kbEntries.length > 0 && (
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowConfirmClearKb(true)} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-black text-[9px] italic hover:bg-rose-100 transition-all flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3" /> {t("knowledgebase.clear_all")}
                    </motion.button>
                  )}
                </div>

                {kbEntries.filter(e => !searchKb || e.title.toLowerCase().includes(searchKb.toLowerCase()) || e.content.toLowerCase().includes(searchKb.toLowerCase()) || e.category.toLowerCase().includes(searchKb.toLowerCase()) || (e.question && e.question.toLowerCase().includes(searchKb.toLowerCase()))).length === 0 ? (
                  <div className="py-12 md:py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">
                    {searchKb ? t("knowledgebase.no_results").replace("{query}", searchKb) : t("knowledgebase.empty")}
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
                        <h3 className="text-xl md:text-2xl font-black italic text-zinc-950 mb-4 md:mb-6 uppercase tracking-tighter">{editingKb ? t("knowledgebase.form_edit") : t("knowledgebase.form_new")}</h3>
                        <div className="space-y-3 md:space-y-5">
                          <div className="flex items-center gap-2">
                            <motion.button whileTap={{ scale: 0.95 }}
                              onClick={() => setKbForm({...kbForm, question: kbForm.question ? "" : "¿?" })}
                              className={cn("px-3 py-1.5 rounded-xl font-black text-[9px] italic transition-all flex items-center gap-1.5", kbForm.question ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-400")}
                            >
                              <HelpCircle className="w-3 h-3" /> {kbForm.question ? t("knowledgebase.question_mode") : t("knowledgebase.article_mode")}
                            </motion.button>
                          </div>
                          {kbForm.question ? (
                            <div>
                              <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("knowledgebase.question_label")}</label>
                              <input type="text" placeholder={t("knowledgebase.question_placeholder")} value={kbForm.question} onChange={e => setKbForm({...kbForm, question: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                            </div>
                          ) : (
                            <div>
                              <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("knowledgebase.title_label")}</label>
                              <input type="text" placeholder={t("knowledgebase.title_placeholder")} value={kbForm.title} onChange={e => setKbForm({...kbForm, title: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                            </div>
                          )}
                          <div>
                            <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("knowledgebase.category_label")}</label>
                            <select value={kbForm.category} onChange={e => setKbForm({...kbForm, category: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 italic text-sm">
                              {kbCategories.map(cat => (
                                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("knowledgebase.answer_label")}</label>
                            <textarea placeholder={t("knowledgebase.answer_placeholder")} value={kbForm.content} onChange={e => setKbForm({...kbForm, content: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all resize-none h-32 md:h-40 mt-1 text-sm" />
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
                            {editingKb ? t("knowledgebase.form_update") : t("knowledgebase.form_save")}
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
                        <h3 className="text-xl md:text-2xl font-black italic text-zinc-950 mb-4 md:mb-6 uppercase tracking-tighter">{t("knowledgebase.categories_title")}</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <input type="text" placeholder={t("knowledgebase.categories_new_placeholder")} value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="flex-1 bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => {
                              const name = newCategoryName.trim().toLowerCase();
                              if (!name || kbCategories.includes(name)) return;
                              setKbCategories(prev => [...prev, name]);
                              setNewCategoryName("");
                            }} disabled={!newCategoryName.trim()} className="px-4 py-3 bg-red-600 text-white rounded-xl font-black text-[10px] italic hover:bg-red-700 transition-all shadow-md disabled:opacity-50">
                              {t("knowledgebase.categories_add")}
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
                          <h3 className="text-xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("knowledgebase.clear_confirm_title")}</h3>
                          <p className="text-sm text-zinc-500 font-medium">{t("knowledgebase.clear_confirm_desc").replace("{n}", String(kbEntries.length))}</p>
                          <div className="flex gap-3 pt-2">
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowConfirmClearKb(false)} className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-black text-xs italic hover:bg-zinc-200 transition-all">
                              {t("knowledgebase.clear_cancel")}
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => {
                              setKbEntries([]);
                              persistStore(undefined, undefined, undefined, []);
                              setShowConfirmClearKb(false);
                            }} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-black text-xs italic hover:bg-rose-700 transition-all shadow-md">
                              {t("knowledgebase.clear_confirm")}
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
                  <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("agentconfig.title")} <span className="text-red-600">{t("agentconfig.title_suffix")}</span></h3>
                  <motion.button whileTap={{ scale: 0.95 }} disabled={agentConfigSaving} onClick={async () => {
                    setAgentConfigSaving(true);
                    try {
                      await onSaveStore?.(storeId, { agentConfig });
                      showToast(t("agentconfig.saved"), "success");
                    } catch { showToast(t("agentconfig.save_error"), "error"); }
                    setAgentConfigSaving(false);
                  }} className={cn("px-5 md:px-6 py-2.5 md:py-3 rounded-2xl font-black text-[10px] md:text-xs italic transition-all shadow-xl flex items-center gap-2", agentConfigSaving ? "bg-zinc-300 text-zinc-500 cursor-not-allowed" : "bg-red-600 text-white hover:bg-red-700")}>
                    {agentConfigSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} {t("agentconfig.save")}
                  </motion.button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1.5">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setAgentConfigTab("general")} className={cn("px-5 py-2.5 rounded-xl font-black text-[10px] italic transition-all", agentConfigTab === "general" ? "bg-red-600 text-white shadow-md" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200")}>
                    {t("agentconfig.tab_general")}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setAgentConfigTab("widget")} className={cn("px-5 py-2.5 rounded-xl font-black text-[10px] italic transition-all", agentConfigTab === "widget" ? "bg-red-600 text-white shadow-md" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200")}>
                    {t("agentconfig.tab_widget")}
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
                        <h4 className="text-sm md:text-base font-black italic text-zinc-950 uppercase tracking-tight">{t("agentconfig.general_info")}</h4>
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("agentconfig.system_prompt_label")}</label>
                        <p className="text-[8px] text-zinc-300 italic ml-1 mb-2 font-medium">{t("agentconfig.system_prompt_desc")}</p>
                        <textarea value={agentConfig.systemPrompt} onChange={e => setAgentConfig(c => ({...c, systemPrompt: e.target.value}))} placeholder={t("agentconfig.system_prompt_placeholder")} className="w-full bg-zinc-50 p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all resize-none h-40 text-sm" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("agentconfig.temperature_label")}</label>
                          <p className="text-[8px] text-zinc-300 italic ml-1 mb-2 font-medium">{t("agentconfig.temperature_desc")}</p>
                          <div className="flex items-center gap-3">
                            <input type="range" min="0" max="2" step="0.1" value={agentConfig.temperature} onChange={e => setAgentConfig(c => ({...c, temperature: parseFloat(e.target.value)}))} className="flex-1 accent-red-600" />
                            <span className="text-sm font-black italic text-zinc-700 w-8 text-center">{agentConfig.temperature.toFixed(1)}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("agentconfig.model_label")}</label>
                          <p className="text-[8px] text-zinc-300 italic ml-1 mb-2 font-medium">{t("agentconfig.model_desc")}</p>
                          <select value={agentConfig.model} onChange={e => setAgentConfig(c => ({...c, model: e.target.value}))} className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all italic text-sm">
                            <option value="gpt-4o-mini">{t("agentconfig.model_fast")}</option>
                            <option value="gpt-4o">{t("agentconfig.model_powerful")}</option>
                            <option value="gpt-3.5-turbo">{t("agentconfig.model_economical")}</option>
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
                        <h4 className="text-sm md:text-base font-black italic text-zinc-950 uppercase tracking-tight">{t("agentconfig.appearance")}</h4>
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("agentconfig.logo_label")}</label>
                        <p className="text-[8px] text-zinc-300 italic ml-1 mb-2 font-medium">{t("agentconfig.logo_desc")}</p>
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
                              <input type="text" value={agentConfig.logo} onChange={e => setAgentConfig(c => ({...c, logo: e.target.value}))} placeholder={t("agentconfig.logo_url_placeholder")} className="flex-1 bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs" />
                              <label className="px-4 py-2.5 bg-zinc-100 text-zinc-600 rounded-xl font-black text-[9px] italic hover:bg-zinc-200 transition-all cursor-pointer flex items-center gap-1.5 shrink-0">
                                <Upload className="w-3 h-3" /> {t("agentconfig.logo_upload")}
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
                            <button onClick={() => setAgentConfig(c => ({...c, logo: ""}))} className="text-[9px] font-bold text-rose-400 hover:text-rose-600 italic transition-colors">{t("agentconfig.logo_remove")}</button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest mb-3 block">{t("agentconfig.colors")}</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
                            <input type="color" value={agentConfig.primaryColor} onChange={e => setAgentConfig(c => ({...c, primaryColor: e.target.value}))} className="w-10 h-10 rounded-xl border-2 border-zinc-200 cursor-pointer shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[9px] font-black text-zinc-500 uppercase italic">{t("agentconfig.color_primary")}</p>
                              <p className="text-[10px] font-mono font-bold text-zinc-700 truncate">{agentConfig.primaryColor}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
                            <input type="color" value={agentConfig.secondaryColor} onChange={e => setAgentConfig(c => ({...c, secondaryColor: e.target.value}))} className="w-10 h-10 rounded-xl border-2 border-zinc-200 cursor-pointer shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[9px] font-black text-zinc-500 uppercase italic">{t("agentconfig.color_secondary")}</p>
                              <p className="text-[10px] font-mono font-bold text-zinc-700 truncate">{agentConfig.secondaryColor}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
                            <input type="color" value={agentConfig.textColor} onChange={e => setAgentConfig(c => ({...c, textColor: e.target.value}))} className="w-10 h-10 rounded-xl border-2 border-zinc-200 cursor-pointer shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[9px] font-black text-zinc-500 uppercase italic">{t("agentconfig.color_text")}</p>
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
                      <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("agentconfig.welcome_label")}</label>
                      <p className="text-[8px] text-zinc-300 italic ml-1 mb-2 font-medium">{t("agentconfig.welcome_desc")}</p>
                      <input type="text" value={agentConfig.widgetWelcome} onChange={e => setAgentConfig(c => ({...c, widgetWelcome: e.target.value}))} placeholder={t("agentconfig.welcome_placeholder")} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("agentconfig.input_placeholder_label")}</label>
                      <p className="text-[8px] text-zinc-300 italic ml-1 mb-2 font-medium">{t("agentconfig.input_placeholder_desc")}</p>
                      <input type="text" value={agentConfig.widgetPlaceholder} onChange={e => setAgentConfig(c => ({...c, widgetPlaceholder: e.target.value}))} placeholder={t("agentconfig.input_placeholder_eg")} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("agentconfig.header_label")}</label>
                      <p className="text-[8px] text-zinc-300 italic ml-1 mb-2 font-medium">{t("agentconfig.header_desc")}</p>
                      <input type="text" value={agentConfig.widgetHeader} onChange={e => setAgentConfig(c => ({...c, widgetHeader: e.target.value}))} placeholder={t("agentconfig.header_placeholder")} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                    </div>
                    <div className="border-t border-zinc-100 pt-5">
                      <ChatAppearancePanel config={agentConfig} onChange={setAgentConfig} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {section === "agentinstall" && (
              <div className="space-y-6 md:space-y-8 max-w-3xl">
                <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
                  <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("agentinstall.title")} <span className="text-red-600">{t("agentinstall.title_suffix")}</span></h3>
                  <a href={`${window.location.origin}/s/${(userStore as any)?.slug || ""}`} target="_blank" rel="noopener noreferrer" className="px-5 md:px-6 py-2.5 md:py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] md:text-xs italic hover:bg-red-700 transition-all shadow-xl inline-flex items-center gap-2">
                    <ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4" /> {t("agentinstall.view_store")}
                  </a>
                </div>

                {/* URL Pública */}
                <div className="bg-white rounded-[2rem] border border-zinc-100 p-6 md:p-8 shadow-sm space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
                    <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                      <Globe className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm md:text-base font-black italic text-zinc-950 uppercase tracking-tight">{t("agentinstall.public_url")}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-zinc-50 p-3 rounded-xl border border-zinc-100 text-xs md:text-sm font-mono text-zinc-700 truncate">
                      ${window.location.origin}/s/{(userStore as any)?.slug || "tu-empresa"}
                    </code>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/s/${(userStore as any)?.slug || ""}`); showToast(t("agentinstall.url_copied"), "success"); }} className="p-3 bg-zinc-100 text-zinc-600 rounded-xl hover:bg-zinc-200 transition-all shrink-0">
                      <Copy className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                {/* Platform tabs */}
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { key: "html" as const, label: t("agentinstall.tab_html"), icon: <Code className="w-3 h-3" /> },
                    { key: "shopify" as const, label: t("agentinstall.tab_shopify"), icon: <ShoppingCart className="w-3 h-3" /> },
                    { key: "woocommerce" as const, label: t("agentinstall.tab_woocommerce"), icon: <Store className="w-3 h-3" /> },
                    { key: "wix" as const, label: t("agentinstall.tab_wix"), icon: <Globe className="w-3 h-3" /> },
                    { key: "wordpress" as const, label: t("agentinstall.tab_wordpress"), icon: <FileText className="w-3 h-3" /> },
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
                          <h4 className="text-sm md:text-base font-black italic text-zinc-950 uppercase tracking-tight">{t("agentinstall.iframe_title")}</h4>
                        </div>
                        <p className="text-[10px] md:text-xs text-zinc-500 font-medium">{t("agentinstall.iframe_desc")}</p>
                        <div className="relative">
                          <pre className="bg-zinc-950 text-zinc-100 p-4 md:p-5 rounded-2xl text-[10px] md:text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
{`<!-- Jandosoft AI Chat Widget (recomendado) -->
<script src="${widgetOrigin}/widget.js"></script>
<script>
  window.Jandosoft.init({
    slug: "${(userStore as any)?.slug || "tu-empresa"}",
    baseUrl: "${widgetOrigin}"
  });
</script>`}
                          </pre>
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                            const code = `<!-- Jandosoft AI Chat Widget -->\n<script src="${widgetOrigin}/widget.js"><\/script>\n<script>\n  window.Jandosoft.init({\n    slug: "${(userStore as any)?.slug || "tu-empresa"}",\n    baseUrl: "${widgetOrigin}"\n  });\n<\/script>`;
                            navigator.clipboard.writeText(code);
                            showToast(t("agentinstall.iframe_copied"), "success");
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
                        <h4 className="text-sm md:text-base font-black italic text-zinc-950 uppercase tracking-tight">{t("agentinstall.js_title")}</h4>
                      </div>
                      <p className="text-[10px] md:text-xs text-zinc-500 font-medium">{t("agentinstall.js_desc")}</p>
                      <div className="relative">
                        <pre className="bg-zinc-950 text-zinc-100 p-4 md:p-5 rounded-2xl text-[10px] md:text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
{`<!-- Jandosoft AI Chat Widget -->
<script src="${widgetOrigin}/widget.js"></script>
<script>
  window.Jandosoft.init({
    slug: "${(userStore as any)?.slug || "tu-empresa"}",
    baseUrl: "${widgetOrigin}"
  });
</script>`}
                          </pre>
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                            const code = `<!-- Jandosoft AI Chat Widget -->\n<script src="${widgetOrigin}/widget.js"><\/script>\n<script>\n  window.Jandosoft.init({\n    slug: "${(userStore as any)?.slug || "tu-empresa"}",\n    baseUrl: "${widgetOrigin}"\n  });\n<\/script>`;
                          navigator.clipboard.writeText(code);
                          showToast(t("agentinstall.js_copied"), "success");
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
                        <h4 className="text-sm md:text-base font-black italic text-zinc-950 uppercase tracking-tight">{t("agentinstall.shopify_title")}</h4>
                        <p className="text-[8px] font-bold text-zinc-400 italic">{t("agentinstall.shopify_subtitle")}</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-[10px] md:text-xs text-zinc-600 font-medium leading-relaxed">
                      <p>
                        {t("agentinstall.shopify_step1")}{" "}
                        <strong className="text-zinc-950 font-semibold">{t("agentinstall.shopify_path1")}</strong>
                      </p>
                      <p>
                        {t("agentinstall.shopify_step2")}{" "}
                        <code className="bg-zinc-100 text-red-600 px-1.5 py-0.5 rounded font-mono text-[10px] md:text-xs">theme.liquid</code>
                      </p>
                      <p>
                        {t("agentinstall.shopify_step3")}{" "}
                        <code className="bg-zinc-100 text-red-600 px-1.5 py-0.5 rounded font-mono text-[10px] md:text-xs">&lt;/body&gt;</code>
                      </p>
                    </div>
                    <div className="relative">
                       <pre className="bg-zinc-950 text-zinc-100 p-4 md:p-5 rounded-2xl text-[10px] md:text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
{`{% comment %} Jandosoft AI Chat Widget {% endcomment %}
<script src="${widgetOrigin}/widget.js"></script>
<script>
  window.Jandosoft.init({
    slug: "${(userStore as any)?.slug || "tu-empresa"}",
    baseUrl: "${widgetOrigin}"
  });
</script>`}
                      </pre>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                        navigator.clipboard.writeText(`{% comment %} Jandosoft AI Chat Widget {% endcomment %}\n<script src="${widgetOrigin}/widget.js"><\/script>\n<script>\n  window.Jandosoft.init({\n    slug: "${(userStore as any)?.slug || "tu-empresa"}",\n    baseUrl: "${widgetOrigin}"\n  });\n<\/script>`);
                        showToast(t("agentinstall.shopify_copied"), "success");
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
                        <h4 className="text-sm md:text-base font-black italic text-zinc-950 uppercase tracking-tight">{t("agentinstall.woo_title")}</h4>
                        <p className="text-[8px] font-bold text-zinc-400 italic">{t("agentinstall.woo_subtitle")}</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-[10px] md:text-xs text-zinc-600 font-medium leading-relaxed">
                      <p>
                        {t("agentinstall.woo_step1")}{" "}
                        <strong className="text-zinc-950 font-semibold">{t("agentinstall.woo_path1")}</strong>
                        {t("agentinstall.woo_or")}
                        <span className="italic">{t("agentinstall.woo_per_theme")}</span>
                      </p>
                      <p>
                        {t("agentinstall.woo_step2")}{" "}
                        <code className="bg-zinc-100 text-red-600 px-1.5 py-0.5 rounded font-mono text-[10px] md:text-xs">&lt;/body&gt;</code>
                      </p>
                    </div>
                    <div className="relative">
                      <pre className="bg-zinc-950 text-zinc-100 p-4 md:p-5 rounded-2xl text-[10px] md:text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
{`<!-- Jandosoft AI Chat Widget -->
<script src="${widgetOrigin}/widget.js"></script>
<script>
  window.Jandosoft.init({
    slug: "${(userStore as any)?.slug || "tu-empresa"}",
    baseUrl: "${widgetOrigin}"
  });
</script>`}
                      </pre>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                        navigator.clipboard.writeText(`<!-- Jandosoft AI Chat Widget -->\n<script src="${widgetOrigin}/widget.js"><\/script>\n<script>\n  window.Jandosoft.init({\n    slug: "${(userStore as any)?.slug || "tu-empresa"}",\n    baseUrl: "${widgetOrigin}"\n  });\n<\/script>`);
                        showToast(t("agentinstall.woo_copied"), "success");
                      }} className="absolute top-3 right-3 p-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all">
                        <Copy className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                    <p className="text-[9px] text-zinc-400 italic font-medium">{t("agentinstall.woo_alt")}</p>
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
                        <h4 className="text-sm md:text-base font-black italic text-zinc-950 uppercase tracking-tight">{t("agentinstall.wix_title")}</h4>
                        <p className="text-[8px] font-bold text-zinc-400 italic">{t("agentinstall.wix_subtitle")}</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-[10px] md:text-xs text-zinc-600 font-medium leading-relaxed">
                      <p>
                        {t("agentinstall.wix_step1")}{" "}
                        <strong className="text-zinc-950 font-semibold">{t("agentinstall.wix_path1")}</strong>
                      </p>
                      <p>{t("agentinstall.wix_step2")}</p>
                    </div>
                    <div className="relative">
                      <pre className="bg-zinc-950 text-zinc-100 p-4 md:p-5 rounded-2xl text-[10px] md:text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
{`<!-- Jandosoft AI Chat Widget -->
<script src="${widgetOrigin}/widget.js"></script>
<script>
  window.Jandosoft.init({
    slug: "${(userStore as any)?.slug || "tu-empresa"}",
    baseUrl: "${widgetOrigin}"
  });
</script>`}
                      </pre>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                        navigator.clipboard.writeText(`<!-- Jandosoft AI Chat Widget -->\n<script src="${widgetOrigin}/widget.js"><\/script>\n<script>\n  window.Jandosoft.init({\n    slug: "${(userStore as any)?.slug || "tu-empresa"}",\n    baseUrl: "${widgetOrigin}"\n  });\n<\/script>`);
                        showToast(t("agentinstall.wix_copied"), "success");
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
                        <h4 className="text-sm md:text-base font-black italic text-zinc-950 uppercase tracking-tight">{t("agentinstall.wp_title")}</h4>
                        <p className="text-[8px] font-bold text-zinc-400 italic">{t("agentinstall.wp_subtitle")}</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-[10px] md:text-xs text-zinc-600 font-medium leading-relaxed">
                      <p>
                        <strong className="text-zinc-950 font-bold">{t("agentinstall.wp_option1")}</strong>{" "}
                        {t("agentinstall.wp_go_to")}{" "}
                        <strong className="text-zinc-950 font-semibold">{t("agentinstall.wp_path1")}</strong>{" "}
                        {t("agentinstall.wp_and_paste")}{" "}
                        <code className="bg-zinc-100 text-red-600 px-1.5 py-0.5 rounded font-mono text-[10px] md:text-xs">&lt;/body&gt;</code>
                      </p>
                      <p>
                        <strong className="text-zinc-950 font-bold">{t("agentinstall.wp_option2")}</strong>{" "}
                        {t("agentinstall.wp_use_plugin")}{" "}
                        <strong className="text-zinc-950 font-semibold">{t("agentinstall.wp_plugin_name")}</strong>{" "}
                        {t("agentinstall.wp_or")}{" "}
                        <strong className="text-zinc-950 font-semibold">{t("agentinstall.wp_code_plugin")}</strong>{" "}
                        {t("agentinstall.wp_no_edit")}
                      </p>
                    </div>
                    <div className="relative">
                      <pre className="bg-zinc-950 text-zinc-100 p-4 md:p-5 rounded-2xl text-[10px] md:text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
{`<!-- Jandosoft AI Chat Widget -->
<script src="${widgetOrigin}/widget.js"></script>
<script>
  window.Jandosoft.init({
    slug: "${(userStore as any)?.slug || "tu-empresa"}",
    baseUrl: "${widgetOrigin}"
  });
</script>`}
                      </pre>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                        navigator.clipboard.writeText(`<!-- Jandosoft AI Chat Widget -->\n<script src="${widgetOrigin}/widget.js"><\/script>\n<script>\n  window.Jandosoft.init({\n    slug: "${(userStore as any)?.slug || "tu-empresa"}",\n    baseUrl: "${widgetOrigin}"\n  });\n<\/script>`);
                        showToast(t("agentinstall.wp_copied"), "success");
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
                      <p className="text-[10px] md:text-xs font-black italic text-amber-800">{t("agentinstall.requirement_title")}</p>
                      <p className="text-[9px] md:text-[10px] font-medium text-amber-700 mt-1">{t("agentinstall.requirement_desc")}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {section === "smartforms" && (
              <div className="space-y-6 md:space-y-8">
                <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
                  <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("smartforms.title")} <span className="text-red-600">{t("smartforms.title_suffix")}</span></h3>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => {
                    setEditingSmartForm(null);
                    setSmartFormName("");
                    setSmartFormDesc("");
                    setSmartFormFields([]);
                    setShowAddSmartForm(true);
                  }} className="px-5 md:px-6 py-2.5 md:py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] md:text-xs italic hover:bg-red-700 transition-all shadow-xl flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> {t("smartforms.new")}
                  </motion.button>
                </div>

                {smartForms.length === 0 ? (
                  <div className="py-16 md:py-20 text-center italic font-black uppercase tracking-widest text-zinc-200">
                    {t("smartforms.empty")}
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
                          <span>{(form.fields || []).length} {t("smartforms.fields_count")}</span>
                          <span className="w-1 h-1 rounded-full bg-zinc-300" />
                          <span>{(form.submissions || []).length} {t("smartforms.submissions_count")}</span>
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
                        <h3 className="text-xl md:text-2xl font-black italic text-zinc-950 mb-6 uppercase tracking-tighter">{editingSmartForm ? t("smartforms.form_edit") : t("smartforms.form_new")}</h3>

                        <div className="space-y-5">
                          <div>
                            <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("smartforms.form_name_label")}</label>
                            <input type="text" value={smartFormName} onChange={e => setSmartFormName(e.target.value)} placeholder={t("smartforms.form_name_placeholder")} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("smartforms.form_desc_label")}</label>
                            <textarea value={smartFormDesc} onChange={e => setSmartFormDesc(e.target.value)} placeholder={t("smartforms.form_desc_placeholder")} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all resize-none h-20 mt-1 text-sm" />
                          </div>

                          {/* Fields */}
                          <div className="border-t border-zinc-100 pt-5">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-black italic text-zinc-950 uppercase tracking-tight">{t("smartforms.fields_title")} <span className="text-zinc-400">({smartFormFields.length})</span></h4>
                            </div>

                            {editingSFormField !== null && (
                              <div className="bg-zinc-50 rounded-2xl p-4 md:p-5 mb-4 space-y-3 border border-zinc-100">
                                <div className="flex items-center justify-between">
                                  <p className="text-[9px] font-black text-zinc-400 uppercase italic">{editingSFormField === -1 ? t("smartforms.field_new") : t("smartforms.field_edit")}</p>
                                  <button onClick={() => setEditingSFormField(null)} className="text-[9px] font-black text-rose-400 hover:text-rose-600 italic">{t("smartforms.field_cancel")}</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[8px] font-black text-zinc-400 uppercase italic">{t("smartforms.field_type_label")}</label>
                                    <select value={sformFieldType} onChange={e => setSformFieldType(e.target.value)} className="w-full bg-white p-2.5 rounded-xl border border-zinc-100 outline-none font-medium text-xs mt-1">
                                      <option value="text">{t("smartforms.field_type_text")}</option>
                                      <option value="email">{t("smartforms.field_type_email")}</option>
                                      <option value="phone">{t("smartforms.field_type_phone")}</option>
                                      <option value="textarea">{t("smartforms.field_type_textarea")}</option>
                                      <option value="number">{t("smartforms.field_type_number")}</option>
                                      <option value="date">{t("smartforms.field_type_date")}</option>
                                      <option value="select">{t("smartforms.field_type_select")}</option>
                                      <option value="checkbox">{t("smartforms.field_type_checkbox")}</option>
                                      <option value="radio">{t("smartforms.field_type_radio")}</option>
                                      <option value="file">{t("smartforms.field_type_file")}</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[8px] font-black text-zinc-400 uppercase italic">{t("smartforms.field_label_label")}</label>
                                    <input type="text" value={sformFieldLabel} onChange={e => setSformFieldLabel(e.target.value)} placeholder={t("smartforms.field_label_placeholder")} className="w-full bg-white p-2.5 rounded-xl border border-zinc-100 outline-none font-medium text-xs mt-1" />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[8px] font-black text-zinc-400 uppercase italic">{t("smartforms.field_placeholder_label")}</label>
                                    <input type="text" value={sformFieldPlaceholder} onChange={e => setSformFieldPlaceholder(e.target.value)} placeholder={t("smartforms.field_placeholder_eg")} className="w-full bg-white p-2.5 rounded-xl border border-zinc-100 outline-none font-medium text-xs mt-1" />
                                  </div>
                                  <div className="flex items-end pb-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input type="checkbox" checked={sformFieldRequired} onChange={e => setSformFieldRequired(e.target.checked)} className="w-4 h-4 accent-red-600 rounded" />
                                      <span className="text-[9px] font-black text-zinc-500 uppercase italic">{t("smartforms.field_required")}</span>
                                    </label>
                                  </div>
                                </div>
                                {["select", "checkbox", "radio"].includes(sformFieldType) && (
                                  <div>
                                    <label className="text-[8px] font-black text-zinc-400 uppercase italic">{t("smartforms.field_options_label")}</label>
                                    <textarea value={sformFieldOptions} onChange={e => setSformFieldOptions(e.target.value)} placeholder={t("smartforms.options_placeholder")} className="w-full bg-white p-2.5 rounded-xl border border-zinc-100 outline-none font-medium text-xs mt-1 resize-none h-20" />
                                  </div>
                                )}
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => {
                                  if (!sformFieldLabel.trim()) { showToast(t("smartforms.field_error_required"), "info"); return; }
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
                                  {editingSFormField === -1 ? t("smartforms.field_add") : t("smartforms.field_update")}
                                </motion.button>
                              </div>
                            )}

                            {smartFormFields.length === 0 && editingSFormField === null ? (
                              <div className="py-8 text-center italic font-black uppercase tracking-widest text-zinc-200 text-xs">{t("smartforms.fields_empty")}</div>
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
                                <Plus className="w-3.5 h-3.5" /> {t("smartforms.field_add_btn")}
                              </motion.button>
                            )}
                          </div>

                          <button onClick={() => {
                            if (!smartFormName.trim()) { showToast(t("smartforms.form_error_name"), "info"); return; }
                            if (smartFormFields.length === 0) { showToast(t("smartforms.form_error_fields"), "info"); return; }
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
                            showToast(editingSmartForm ? t("smartforms.form_updated") : t("smartforms.form_created"), "success");
                          }} disabled={!smartFormName.trim() || smartFormFields.length === 0} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black italic text-sm hover:bg-red-700 transition-all shadow-xl disabled:opacity-50">
                            {editingSmartForm ? t("smartforms.form_update_btn") : t("smartforms.form_create_btn")}
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
                        <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 italic mb-6">{(showFormSubmissions.submissions || []).length} {t("smartforms.submissions_title")}</p>

                        {(showFormSubmissions.submissions || []).length === 0 ? (
                          <div className="py-12 text-center italic font-black uppercase tracking-widest text-zinc-200 text-sm">{t("smartforms.submissions_empty")}</div>
                        ) : (
                          <div className="overflow-x-auto flex-1">
                            <table className="w-full text-xs md:text-sm">
                              <thead>
                                <tr className="border-b border-zinc-100">
                                  <th className="text-left py-2 px-2 font-black italic text-zinc-400 text-[9px] md:text-[10px] uppercase tracking-wider">{t("smartforms.submissions_number")}</th>
                                  {(showFormSubmissions.fields || []).map((f: any) => (
                                    <th key={f.id} className="text-left py-2 px-2 font-black italic text-zinc-400 text-[9px] md:text-[10px] uppercase tracking-wider whitespace-nowrap">{f.label}</th>
                                  ))}
                                  <th className="text-left py-2 px-2 font-black italic text-zinc-400 text-[9px] md:text-[10px] uppercase tracking-wider whitespace-nowrap">{t("smartforms.submissions_date")}</th>
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
                        <h3 className="text-xl md:text-2xl font-black italic text-zinc-950 mb-2 uppercase tracking-tighter">{t("smartforms.embed_title")} <span className="text-red-600">{showFormEmbed.name}</span></h3>
                        <p className="text-[9px] font-bold text-zinc-400 italic mb-6">{t("smartforms.embed_desc")}</p>
                        <div className="space-y-5">
                          <div className="bg-zinc-50 rounded-2xl p-4 space-y-3">
                            <h4 className="text-[9px] font-black text-zinc-500 uppercase italic tracking-wider">{t("smartforms.embed_iframe")}</h4>
                            <div className="relative">
                              <pre className="bg-zinc-950 text-zinc-100 p-3 rounded-xl text-[9px] md:text-[10px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
{`<iframe
  src="${window.location.origin}/embed/form/${(userStore as any)?.slug || "tu-empresa"}/${showFormEmbed.id}"
  style="width:100%;max-width:500px;height:600px;border:none;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);background:white;"
  title="${showFormEmbed.name}"
></iframe>`}
                              </pre>
                              <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                                const code = `<iframe\n  src="${window.location.origin}/embed/form/${(userStore as any)?.slug || "tu-empresa"}/${showFormEmbed.id}"\n  style="width:100%;max-width:500px;height:600px;border:none;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);background:white;"\n  title="${showFormEmbed.name}"\n></iframe>`;
                                navigator.clipboard.writeText(code);
                                showToast(t("smartforms.embed_iframe_copied"), "success");
                              }} className="absolute top-2 right-2 p-1.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all">
                                <Copy className="w-3 h-3" />
                              </motion.button>
                            </div>
                          </div>
                          <div className="bg-zinc-50 rounded-2xl p-4 space-y-3">
                            <h4 className="text-[9px] font-black text-zinc-500 uppercase italic tracking-wider">{t("smartforms.embed_js")}</h4>
                            <div className="relative">
                              <pre className="bg-zinc-950 text-zinc-100 p-3 rounded-xl text-[9px] md:text-[10px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
{`<div id="jandosoft-form-${showFormEmbed.id}"></div>
<script>
  (function() {
    var container = document.getElementById('jandosoft-form-${showFormEmbed.id}');
    if (!container) return;
    var iframe = document.createElement('iframe');
    iframe.src = '${window.location.origin}/embed/form/${(userStore as any)?.slug || "tu-empresa"}/${showFormEmbed.id}';
    iframe.style.cssText = 'width:100%;max-width:500px;height:600px;border:none;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);background:white;';
    iframe.title = '${showFormEmbed.name}';
    container.appendChild(iframe);
  })();
</script>`}
                              </pre>
                              <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                                const code = `<div id="jandosoft-form-${showFormEmbed.id}"></div>\n<script>\n  (function() {\n    var container = document.getElementById('jandosoft-form-${showFormEmbed.id}');\n    if (!container) return;\n    var iframe = document.createElement('iframe');\n    iframe.src = '${window.location.origin}/embed/form/${(userStore as any)?.slug || "tu-empresa"}/${showFormEmbed.id}';\n    iframe.style.cssText = 'width:100%;max-width:500px;height:600px;border:none;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);background:white;';\n    iframe.title = '${showFormEmbed.name}';\n    container.appendChild(iframe);\n  })();\n</script>`;
                                navigator.clipboard.writeText(code);
                                showToast(t("smartforms.embed_js_copied"), "success");
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
                          <h3 className="text-xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("smartforms.delete_title")}</h3>
                          <p className="text-sm text-zinc-500 font-medium">{t("smartforms.delete_desc").replace("{name}", confirmDeleteForm.name).replace("{n}", String(confirmDeleteForm.submissions?.length || 0))}</p>
                          <div className="flex gap-3 pt-2">
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setConfirmDeleteForm(null)} className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-black text-xs italic hover:bg-zinc-200 transition-all">
                              {t("smartforms.delete_cancel")}
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => {
                              const updated = smartForms.filter(f => f.id !== confirmDeleteForm.id);
                              setSmartForms(updated);
                              persistStore(undefined, undefined, undefined, undefined, undefined, undefined, updated);
                              setConfirmDeleteForm(null);
                              showToast(t("smartforms.form_deleted"), "success");
                            }} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-black text-xs italic hover:bg-rose-700 transition-all shadow-md">
                              {t("smartforms.delete_confirm")}
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
                <div className="flex gap-1.5">
                  <button onClick={() => setAutomationTab("rules")} className={cn("px-4 py-2 rounded-xl text-[9px] md:text-[10px] font-black italic uppercase transition-all", automationTab === "rules" ? "bg-red-600 text-white shadow-md" : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100")}>{t("automations.tab_rules")}</button>
                  <button onClick={() => setAutomationTab("schedule")} className={cn("px-4 py-2 rounded-xl text-[9px] md:text-[10px] font-black italic uppercase transition-all", automationTab === "schedule" ? "bg-red-600 text-white shadow-md" : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100")}>{t("automations.tab_scheduled")}</button>
                </div>

                {automationTab === "schedule" ? (
                  <ScheduledTasksPanel />
                ) : (
                <>
                <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
                  <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                    <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("automations.title")} <span className="text-red-600">({automations.filter(a => a.enabled).length}/{automations.length})</span></h3>
                    <span className="text-[9px] font-black text-zinc-400 italic">{automations.length}/{maxAutomations} {t("automations.used")}</span>
                  </div>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => {
                    if (canAddAutomation) { setEditingAutomation(null); setAutomationForm({ name: "", trigger: "new_order", actionType: "send_notification", actionConfig: {}, triggerConfig: {} }); setShowAddAutomation(true); return; }
                    if (planExpired) { showToast(t("automations.plan_expired"), "error"); onNavigateToPricing?.(); return; }
                    showToast(t("automations.limit_reached").replace("{n}", String(maxAutomations)), "info");
                    onNavigateToPricing?.();
                  }} className={cn("px-5 md:px-6 py-2.5 md:py-3 rounded-2xl font-black text-[10px] md:text-xs italic transition-all shadow-xl flex items-center gap-2", canAddAutomation ? "bg-red-600 text-white hover:bg-red-700" : "bg-zinc-200 text-zinc-400 cursor-not-allowed")}>
                    <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> {t("automations.new_rule")}
                  </motion.button>
                </div>

                {planExpired && (
                  <div className="bg-red-50 border border-red-300 max-[400px]:p-4 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shrink-0" />
                      <p className="text-[10px] md:text-[11px] font-bold text-red-800 italic">{t("automations.plan_expired_banner")}</p>
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={onNavigateToPricing} className="px-6 py-3 bg-red-600 text-white rounded-xl font-black text-[10px] italic hover:bg-red-700 transition-all shadow-md">{t("automations.renew_plan")}</motion.button>
                  </div>
                )}
                {!planExpired && automations.length >= maxAutomations && (
                  <div className="bg-amber-50 border border-amber-300 max-[400px]:p-4 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-amber-500 rounded-full shrink-0" />
                      <p className="text-[10px] md:text-[11px] font-bold text-amber-800 italic">{t("automations.limit_banner").replace("{n}", String(maxAutomations))}</p>
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={onNavigateToPricing} className="px-6 py-3 bg-amber-600 text-white rounded-xl font-black text-[10px] italic hover:bg-amber-700 transition-all shadow-md">{t("automations.upgrade_plan")}</motion.button>
                  </div>
                )}
                {automations.length === 0 ? (
                  <div className="py-12 md:py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">
                    {t("automations.empty")}
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
                              <span className="px-1.5 md:px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-[7px] md:text-[8px] font-black uppercase italic">{({
                                new_order: t("automations.form_trigger_new_order"),
                                new_customer: t("automations.form_trigger_new_customer"),
                                new_product: t("automations.form_trigger_new_product"),
                                low_stock: t("automations.form_trigger_low_stock"),
                                payment_received: t("automations.form_trigger_payment"),
                              })[auto.trigger] || auto.trigger?.replace(/_/g, " ") || "?"}</span>
                              <span className="px-1.5 md:px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[7px] md:text-[8px] font-black uppercase italic">{({
                                send_notification: t("automations.badge_notification"),
                                webhook: t("automations.badge_webhook"),
                                send_email: "Email",
                                send_telegram: "Telegram",
                                send_discord: "Discord",
                                send_slack: "Slack",
                                post_to_social: t("automations.form_action_social"),
                                ai_generate: "AI",
                              })[auto.actionType] || auto.actionType?.replace(/_/g, " ") || "?"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 md:gap-2 shrink-0">
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                            const updated = automations.map(a => a.id === auto.id ? { ...a, enabled: !a.enabled } : a);
                            setAutomations(updated);
                            persistStore(undefined, undefined, undefined, undefined, updated);
                          }} className={cn("px-2.5 md:px-4 py-1.5 md:py-2 rounded-xl font-black text-[8px] md:text-[9px] italic uppercase transition-all", auto.enabled ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-zinc-200 text-zinc-400 hover:bg-zinc-300")}>
                            {auto.enabled ? t("automations.status_active") : t("automations.status_inactive")}
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
                        <h3 className="text-xl md:text-2xl font-black italic text-zinc-950 mb-4 md:mb-6 uppercase tracking-tighter">{editingAutomation ? t("automations.form_edit") : t("automations.form_new")}</h3>
                        <div className="space-y-3 md:space-y-5 max-h-[70vh] overflow-y-auto pr-1 md:pr-2">
                          <div>
                            <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("automations.form_name_label")}</label>
                            <input type="text" placeholder={t("automations.form_name_placeholder")} value={automationForm.name} onChange={e => setAutomationForm({...automationForm, name: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("automations.form_trigger_label")}</label>
                            <select value={automationForm.trigger} onChange={e => setAutomationForm({...automationForm, trigger: e.target.value, triggerConfig: {} })} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm italic text-sm">
                              <option value="new_order">{t("automations.form_trigger_new_order")}</option>
                              <option value="new_customer">{t("automations.form_trigger_new_customer")}</option>
                              <option value="new_product">{t("automations.form_trigger_new_product")}</option>
                              <option value="low_stock">{t("automations.form_trigger_low_stock")}</option>
                              <option value="payment_received">{t("automations.form_trigger_payment")}</option>
                            </select>
                          </div>

                          {(automationForm.trigger === "low_stock") && (
                            <div>
                              <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("automations.form_stock_label")}</label>
                              <input type="number" placeholder={t("automations.form_stock_placeholder")} value={automationForm.triggerConfig.stockThreshold ?? 5} onChange={e => setAutomationForm({...automationForm, triggerConfig: { ...automationForm.triggerConfig, stockThreshold: parseInt(e.target.value) || 5 }})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                            </div>
                          )}

                          <div>
                            <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("automations.form_action_label")}</label>
                            <select value={automationForm.actionType} onChange={e => setAutomationForm({...automationForm, actionType: e.target.value, actionConfig: {} })} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm italic text-sm">
                              <optgroup label={t("automations.form_action_general")}>
                                <option value="send_notification">{t("automations.form_action_notification")}</option>
                                <option value="webhook">{t("automations.form_action_webhook")}</option>
                                <option value="send_email">{t("automations.form_action_email")}</option>
                              </optgroup>
                              <optgroup label={t("automations.form_action_integrations")}>
                                <option value="send_telegram">{t("automations.form_action_telegram")}</option>
                                <option value="send_discord">{t("automations.form_action_discord")}</option>
                                <option value="send_slack">{t("automations.form_action_slack")}</option>
                                <option value="post_to_social">{t("automations.form_action_social")}</option>
                              </optgroup>

                            </select>
                          </div>

                          {automationForm.actionType === "send_notification" && (
                            <div>
                              <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("automations.form_notification_label")}</label>
                              <input type="text" placeholder={t("automations.form_notification_placeholder")} value={automationForm.actionConfig.message || ""} onChange={e => setAutomationForm({...automationForm, actionConfig: { ...automationForm.actionConfig, message: e.target.value }})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                            </div>
                          )}

                          {automationForm.actionType === "webhook" && (
                            <div>
                              <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("automations.form_webhook_label")}</label>
                              <input type="url" placeholder={t("automations.form_webhook_placeholder")} value={automationForm.actionConfig.webhookUrl || ""} onChange={e => setAutomationForm({...automationForm, actionConfig: { ...automationForm.actionConfig, webhookUrl: e.target.value }})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                            </div>
                          )}

                          {automationForm.actionType === "send_email" && (
                            <>
                              <div>
                                <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("automations.form_to_label")}</label>
                                <input type="email" placeholder={t("automations.form_to_placeholder")} value={automationForm.actionConfig.to || ""} onChange={e => setAutomationForm({...automationForm, actionConfig: { ...automationForm.actionConfig, to: e.target.value }})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                              </div>
                              <div>
                                <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("automations.form_subject_label")}</label>
                                <input type="text" placeholder={t("automations.form_subject_placeholder")} value={automationForm.actionConfig.subject || ""} onChange={e => setAutomationForm({...automationForm, actionConfig: { ...automationForm.actionConfig, subject: e.target.value }})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                              </div>
                              <div>
                                <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("automations.form_body_label")}</label>
                                <textarea placeholder={t("automations.form_body_placeholder")} value={automationForm.actionConfig.body || ""} onChange={e => setAutomationForm({...automationForm, actionConfig: { ...automationForm.actionConfig, body: e.target.value }})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all resize-none h-32 mt-1 text-sm font-mono" />
                              </div>
                            </>
                          )}

                          {automationForm.actionType === "ai_generate" && (
                            <div>
                              <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("automations.form_ai_label")}</label>
                              <textarea placeholder={t("automations.form_ai_placeholder")} value={automationForm.actionConfig.prompt || ""} onChange={e => setAutomationForm({...automationForm, actionConfig: { ...automationForm.actionConfig, prompt: e.target.value }})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all resize-none h-24 mt-1 text-sm" />
                              <div className="mt-2">
                                <label className="text-[8px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("automations.form_model_label")}</label>
                                <select value={automationForm.actionConfig.model || "gpt-4o-mini"} onChange={e => setAutomationForm({...automationForm, actionConfig: { ...automationForm.actionConfig, model: e.target.value }})} className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 italic text-xs">
                                  <option value="gpt-4o-mini">{t("automations.form_model_mini")}</option>
                                  <option value="gpt-4o">{t("automations.form_model_powerful")}</option>
                                  <option value="claude-3-haiku">{t("automations.form_model_haiku")}</option>
                                  <option value="claude-3-sonnet">{t("automations.form_model_sonnet")}</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {automationForm.actionType === "send_telegram" && (
                            <div>
                              <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("automations.form_chat_id_label")}</label>
                              <input type="text" placeholder={t("automations.form_chat_id_placeholder")} value={automationForm.actionConfig.chatId || ""} onChange={e => setAutomationForm({...automationForm, actionConfig: { ...automationForm.actionConfig, chatId: e.target.value }})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                              <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest mt-3 block">{t("automations.form_chat_message_label")}</label>
                              <textarea placeholder={t("automations.form_chat_message_placeholder")} value={automationForm.actionConfig.message || ""} onChange={e => setAutomationForm({...automationForm, actionConfig: { ...automationForm.actionConfig, message: e.target.value }})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all resize-none h-20 mt-1 text-sm" />
                            </div>
                          )}

                          {automationForm.actionType === "send_discord" && (
                            <>
                              <div>
                                <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("automations.form_webhook_label")}</label>
                                <input type="url" placeholder={t("automations.form_webhook_placeholder")} value={automationForm.actionConfig.webhookUrl || ""} onChange={e => setAutomationForm({...automationForm, actionConfig: { ...automationForm.actionConfig, webhookUrl: e.target.value }})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                              </div>
                              <div>
                                <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("automations.form_chat_message_label")}</label>
                                <textarea placeholder={t("automations.form_chat_message_placeholder")} value={automationForm.actionConfig.message || ""} onChange={e => setAutomationForm({...automationForm, actionConfig: { ...automationForm.actionConfig, message: e.target.value }})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all resize-none h-20 mt-1 text-sm" />
                              </div>
                            </>
                          )}

                          {automationForm.actionType === "send_slack" && (
                            <>
                              <div>
                                <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("automations.form_channel_label")}</label>
                                <input type="text" placeholder={t("automations.form_channel_placeholder")} value={automationForm.actionConfig.channel || ""} onChange={e => setAutomationForm({...automationForm, actionConfig: { ...automationForm.actionConfig, channel: e.target.value }})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
                              </div>
                              <div>
                                <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("automations.form_chat_message_label")}</label>
                                <textarea placeholder={t("automations.form_chat_message_placeholder")} value={automationForm.actionConfig.message || ""} onChange={e => setAutomationForm({...automationForm, actionConfig: { ...automationForm.actionConfig, message: e.target.value }})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all resize-none h-20 mt-1 text-sm" />
                              </div>
                            </>
                          )}

                          {automationForm.actionType === "post_to_social" && (
                            <>
                              <div>
                              <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("automations.form_social_label")}</label>
                              <textarea placeholder={t("automations.form_social_placeholder")} value={automationForm.actionConfig.message || ""} onChange={e => setAutomationForm({...automationForm, actionConfig: { ...automationForm.actionConfig, message: e.target.value }})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all resize-none h-20 mt-1 text-sm" />
                              </div>
                              <div>
                              <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("automations.form_url_label")}</label>
                              <input type="url" placeholder={t("automations.form_url_placeholder")} value={automationForm.actionConfig.url || ""} onChange={e => setAutomationForm({...automationForm, actionConfig: { ...automationForm.actionConfig, url: e.target.value }})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm" />
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
                          }} disabled={!automationForm.name || (automationForm.actionType === "webhook" && !automationForm.actionConfig.webhookUrl) || (automationForm.actionType === "send_email" && (!automationForm.actionConfig.to || !automationForm.actionConfig.subject || !automationForm.actionConfig.body)) || (automationForm.actionType === "send_telegram" && !automationForm.actionConfig.chatId) || (automationForm.actionType === "send_discord" && !automationForm.actionConfig.webhookUrl) || (automationForm.actionType === "send_slack" && !automationForm.actionConfig.channel)} className="w-full py-4 md:py-5 bg-red-600 text-white rounded-2xl font-black italic text-sm md:text-base hover:bg-red-700 transition-all shadow-xl disabled:opacity-50">
                            {editingAutomation ? t("automations.form_update") : t("automations.form_create")}
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        )}

            {(section as string) === "menu" && <MenuPanel storeId={storeId} onSaveStore={onSaveStore} store={userStore} />}
            {(section as string) === "recipes" && <RecipesPanel storeId={storeId} onSaveStore={onSaveStore} store={userStore} />}
            {(section as string) === "courses" && <CoursesPanel storeId={storeId} onSaveStore={onSaveStore} store={userStore} />}
            {(section as string) === "classes" && <ClassesPanel storeId={storeId} onSaveStore={onSaveStore} store={userStore} />}
            {(section as string) === "students" && <StudentsPanel storeId={storeId} onSaveStore={onSaveStore} store={userStore} />}
            {(section as string) === "grades" && <GradesPanel storeId={storeId} onSaveStore={onSaveStore} store={userStore} />}
            {(section as string) === "clients" && <ClientsPanel storeId={storeId} onSaveStore={onSaveStore} store={userStore} />}
            {(section as string) === "case_files" && <CaseFilesPanel storeId={storeId} onSaveStore={onSaveStore} store={userStore} />}
            {(section as string) === "hearings" && <HearingsPanel storeId={storeId} onSaveStore={onSaveStore} store={userStore} />}
            {(section as string) === "medical_records" && <MedicalRecordsPanel storeId={storeId} onSaveStore={onSaveStore} store={userStore} />}
            {(section as string) === "prescriptions" && <PrescriptionsPanel storeId={storeId} onSaveStore={onSaveStore} store={userStore} />}
            {(section as string) === "doctors" && <DoctorsPanel storeId={storeId} onSaveStore={onSaveStore} store={userStore} />}
            {(section as string) === "inventory" && <InventoryPanel storeId={storeId} onSaveStore={onSaveStore} store={userStore} />}
            {(section as string) === "gallery" && <GalleryPanel storeId={storeId} onSaveStore={onSaveStore} store={userStore} />}
            {(section as string) === "testimonials" && <TestimonialsPanel storeId={storeId} onSaveStore={onSaveStore} store={userStore} />}
            {(section as string) === "documents" && <DocumentsPanel storeId={storeId} onSaveStore={onSaveStore} store={userStore} />}
            {(section as string) === "restaurant" && <RestaurantDashboard storeId={String(storeId)} store={userStore} onSaveStore={onSaveStore} />}
            {(section as string) === "floor_plan" && <FloorPlanEditor storeId={String(storeId)} floorPlan={(userStore as any)?.restaurantFloorPlan || {}} tables={((userStore as any)?.restaurantTables || [])} onSave={(fp: any) => onSaveStore?.(storeId, { restaurantFloorPlan: fp, restaurantTables: fp.tables })} />}
            {(section as string) === "restaurant_orders" && <OrdersPanel storeId={String(storeId)} />}
            {(section as string) === "reservations" && <ReservationsPanel storeId={String(storeId)} />}
            {(section as string) === "promotions" && <PromotionsPanel storeId={String(storeId)} />}
            {(section as string) === "loyalty" && <LoyaltyPanel storeId={String(storeId)} />}
            {(section as string) === "restaurant_reviews" && <ReviewsPanel storeId={String(storeId)} />}
            {(section as string) === "waiter_calls" && <WaiterCallsPanel storeId={String(storeId)} />}
            {(section as string) === "barbers" && <BarbersPanel storeId={String(storeId)} />}
            {(section as string) === "queue" && <QueuePanel storeId={String(storeId)} />}
            {(section as string) === "barber_history" && <BarberHistoryPanel storeId={String(storeId)} />}
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
                    {editingStore ? t("biz.config_title_edit") : t("biz.config_title")}
                  </h3>
                  <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2 italic">
                    {editingStore ? t("biz.config_subtitle_edit") : userStore?.name || t("biz.config_title")}
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
                        <span className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic">{t("biz.config_field_name")}</span>
                        <span className="text-xs md:text-sm font-black italic text-zinc-950 text-right">{userStore?.name}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic">{t("biz.config_field_type")}</span>
                        <span className="text-xs md:text-sm font-black italic text-zinc-950">{storeTypeLabels[userStore?.type] || userStore?.typeLabel || userStore?.type}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic">{t("biz.config_field_industry")}</span>
                        <span className="text-xs md:text-sm font-black italic text-zinc-950">{industryLabels[userStore?.industry] || userStore?.industry}</span>
                      </div>
                      {userStore?.desc && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic">{t("biz.config_field_description")}</span>
                          <span className="text-xs md:text-sm font-black italic text-zinc-950 text-right max-w-[140px] md:max-w-[200px]">{userStore.desc}</span>
                        </div>
                      )}
                      {(userStore as any)?.phone && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic">Teléfono</span>
                          <span className="text-xs md:text-sm font-black italic text-zinc-950 text-right">{(userStore as any).phone}</span>
                        </div>
                      )}
                      {(userStore as any)?.location && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic">Dirección</span>
                          <span className="text-xs md:text-sm font-black italic text-zinc-950 text-right max-w-[140px] md:max-w-[200px]">{(userStore as any).location}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-3 md:p-4 bg-zinc-50 rounded-xl md:rounded-2xl border border-zinc-100 gap-2">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <Globe className="w-4 h-4 md:w-5 md:h-5 text-zinc-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[11px] md:text-xs font-black italic text-zinc-950 truncate">{t("biz.config_public_store")}</p>
                          {userStore?.slug && (
                            <button onClick={() => { navigator.clipboard.writeText(window.location.origin + "/s/" + userStore.slug); showToast(t("biz.url_copied"), "success"); }} className="flex items-center gap-1 text-[7px] md:text-[8px] font-bold text-zinc-400 italic hover:text-red-600 transition-colors truncate">
                              /s/{userStore.slug} <Copy className="w-2.5 h-2.5 md:w-3 md:h-3 shrink-0" />
                            </button>
                          )}
                          {!userStore?.slug && (
                            <p className="text-[7px] md:text-[8px] font-bold text-zinc-400 italic">{t("settings.generating_slug")}</p>
                          )}
                        </div>
                      </div>
                      <button onClick={async () => { const v = !publicVisible; setPublicVisible(v); try { await onEditStore?.(userStore?._id || userStore?.id, { isPublic: v }); showToast(v ? "✅ " + t("status.active") : t("status.inactive"), "success"); } catch { setPublicVisible(!v); showToast(t("status.error"), "error"); } }} className={cn("px-3 md:px-4 py-1.5 md:py-2 rounded-xl font-black text-[8px] md:text-[9px] italic uppercase transition-all shrink-0", publicVisible ? "bg-emerald-50 text-emerald-600" : "bg-zinc-200 text-zinc-400")}>
                        {publicVisible ? t("biz.config_active") : t("biz.config_inactive")}
                      </button>
                    </div>
                    {publicVisible && (
                      <div className="flex items-center justify-between p-3 md:p-4 bg-zinc-50 rounded-xl md:rounded-2xl border border-zinc-100 gap-2">
                        <div className="flex items-center gap-2 md:gap-3 min-w-0">
                          <Bot className="w-4 h-4 md:w-5 md:h-5 text-zinc-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] md:text-xs font-black italic text-zinc-950 truncate">{t("biz.config_public_ai")}</p>
                            <p className="text-[7px] md:text-[8px] font-bold text-zinc-400 italic truncate">{t("settings.chat_visible")}</p>
                          </div>
                        </div>
                        <button onClick={async () => { const v = !publicAIEnabled; setPublicAIEnabled(v); try { await onEditStore?.(userStore?._id || userStore?.id, { publicAI: v }); showToast(v ? "✅ " + t("status.active") : t("status.inactive"), "success"); } catch { setPublicAIEnabled(!v); showToast(t("status.error"), "error"); } }} className={cn("px-3 md:px-4 py-1.5 md:py-2 rounded-xl font-black text-[8px] md:text-[9px] italic uppercase transition-all shrink-0", publicAIEnabled ? "bg-emerald-50 text-emerald-600" : "bg-zinc-200 text-zinc-400")}>
                          {publicAIEnabled ? t("biz.config_active") : t("biz.config_inactive")}
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 md:gap-4">
                      <button onClick={async () => { try { await onEditStore?.(userStore?._id || userStore?.id, { isPublic: publicVisible, publicAI: publicAIEnabled }); showToast("✅ " + t("status.success"), "success"); } catch { showToast(t("status.error"), "error"); } }} className="w-full py-3 md:py-4 bg-emerald-600 text-white rounded-xl md:rounded-2xl font-black italic text-[9px] md:text-xs hover:bg-emerald-700 transition-all shadow-xl">
                        {t("biz.config_btn_save")}
                      </button>
                      <button onClick={() => setEditingStore(true)} className="w-full py-3 md:py-4 bg-red-600 text-white rounded-xl md:rounded-2xl font-black italic text-[11px] md:text-sm hover:bg-red-700 transition-all shadow-xl">
                        {t("biz.config_btn_edit")}
                      </button>
                      <button onClick={() => setConfirmDelete(true)} className="w-full py-3 md:py-4 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl md:rounded-2xl font-black italic text-[11px] md:text-sm hover:bg-rose-100 transition-all">
                        {t("biz.config_btn_delete")}
                      </button>
                    </div>
                    {confirmDelete && (
                      <div className="bg-rose-50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-rose-200 space-y-3 md:space-y-4 text-center">
                        <p className="text-xs md:text-sm font-black italic text-rose-700">{t("biz.config_delete_confirm")}</p>
                        <div className="flex gap-3 md:gap-4 justify-center">
                          <button onClick={() => setConfirmDelete(false)} className="px-5 md:px-8 py-2.5 md:py-3 bg-white text-zinc-700 rounded-xl font-black text-[10px] md:text-xs italic border border-zinc-200">
                            {t("biz.config_btn_cancel")}
                          </button>
                          <button onClick={() => { onDeleteStore?.(userStore?._id || userStore?.id); setShowSettings(false); }} className="px-5 md:px-8 py-2.5 md:py-3 bg-rose-600 text-white rounded-xl font-black text-[10px] md:text-xs italic hover:bg-rose-700">
                            {t("biz.config_btn_delete")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 md:space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("biz.config_edit_name")}</label>
                      <input type="text" placeholder={t("biz.config_edit_name_placeholder")} value={settingsForm.name} onChange={e => setSettingsForm({...settingsForm, name: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("biz.config_edit_industry")}</label>
                      <select value={settingsForm.industry} onChange={e => setSettingsForm({...settingsForm, industry: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all italic text-sm">
                        <option value="tecnologia">{t("biz.industry_technology")}</option>
                        <option value="comercio">{t("biz.industry_commerce")}</option>
                        <option value="servicios">{t("biz.industry_services")}</option>
                        <option value="salud">{t("biz.industry_health")}</option>
                        <option value="educacion">{t("biz.industry_education")}</option>
                        <option value="otro">{t("biz.industry_other")}</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("biz.config_edit_desc")}</label>
                      <textarea placeholder={t("biz.config_edit_desc_placeholder")} value={settingsForm.desc} onChange={e => setSettingsForm({...settingsForm, desc: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all resize-none h-20 md:h-24 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("biz.config_edit_logo")}</label>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-xl border border-zinc-200 bg-zinc-50 overflow-hidden flex items-center justify-center shrink-0">
                          {settingsForm.image ? (
                            <img src={settingsForm.image} alt="Store" className="w-full h-full object-cover" />
                          ) : (
                            <Store className="w-6 h-6 text-zinc-300" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <input type="text" placeholder={t("biz.config_edit_logo_placeholder")} value={settingsForm.image} onChange={e => setSettingsForm({...settingsForm, image: e.target.value})} className="w-full bg-zinc-50 p-2.5 md:p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-xs" />
                          <div className="flex gap-2">
                            <label className="cursor-pointer px-3 py-1.5 bg-zinc-100 text-zinc-700 rounded-lg text-[9px] font-black italic hover:bg-zinc-200 transition-all">
                              {storeImageUploading ? t("biz.config_uploading") : t("biz.config_upload")}
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
                                } catch { showToast(t("status.error"), "error"); }
                                finally { setStoreImageUploading(false); }
                              }} />
                            </label>
                            {settingsForm.image && (
                              <button onClick={() => setSettingsForm(prev => ({ ...prev, image: "" }))} className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black italic hover:bg-rose-100 transition-all">
                                {t("biz.config_btn_delete")}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{t("settings.slug_label")}</label>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] md:text-[9px] font-bold text-zinc-400 italic whitespace-nowrap">/s/</span>
                        <input type="text" placeholder="mi-empresa" value={settingsForm.slug} onChange={e => setSettingsForm({...settingsForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "")})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all font-mono text-sm" />
                      </div>
                      <p className="text-[7px] md:text-[8px] font-bold text-zinc-400 italic ml-1">/s/{settingsForm.slug || "mi-empresa"}</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Teléfono</label>
                      <input type="text" placeholder="+52 55 1234 5678" value={settingsForm.phone} onChange={e => setSettingsForm({...settingsForm, phone: e.target.value})} className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Moneda de la tienda</label>
                      <select value={settingsForm.currency} onChange={e => setSettingsForm({...settingsForm, currency: e.target.value})}
                        className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm">
                        {CURRENCIES.map(c => (
                          <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</option>
                        ))}
                      </select>
                      <p className="text-[7px] md:text-[8px] font-bold text-zinc-400 italic ml-1">Precios, facturas y pagos se mostrarán en esta moneda</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Dirección del negocio</label>
                      <AddressAutocomplete
                        storeId={String(storeId)}
                        value={settingsForm.location}
                        onChange={(address, coords) => setSettingsForm(prev => ({ ...prev, location: address, coordinates: coords || prev.coordinates }))}
                        placeholder="Calle, número, colonia, ciudad"
                        className="w-full bg-zinc-50 p-3 md:p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 md:p-4 bg-zinc-50 rounded-xl md:rounded-2xl border border-zinc-100 gap-2">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <Globe className="w-4 h-4 md:w-5 md:h-5 text-zinc-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[11px] md:text-xs font-black italic text-zinc-950 truncate">{t("biz.config_public_store")}</p>
                          {userStore?.slug && (
                            <button onClick={() => { navigator.clipboard.writeText(window.location.origin + "/s/" + userStore.slug); showToast(t("biz.url_copied"), "success"); }} className="flex items-center gap-1 text-[7px] md:text-[8px] font-bold text-zinc-400 italic hover:text-red-600 transition-colors truncate">
                              /s/{userStore.slug} <Copy className="w-2.5 h-2.5 md:w-3 md:h-3 shrink-0" />
                            </button>
                          )}
                          {!userStore?.slug && (
                            <p className="text-[7px] md:text-[8px] font-bold text-zinc-400 italic">{t("settings.generating_slug")}</p>
                          )}
                        </div>
                      </div>
                      <button onClick={async () => { const v = !publicVisible; setPublicVisible(v); try { await onEditStore?.(userStore?._id || userStore?.id, { isPublic: v }); } catch (e: any) { setPublicVisible(!v); showToast(e.message || t("status.error"), "error"); } }} className={cn("px-3 md:px-4 py-1.5 md:py-2 rounded-xl font-black text-[8px] md:text-[9px] italic uppercase transition-all shrink-0", publicVisible ? "bg-emerald-50 text-emerald-600" : "bg-zinc-200 text-zinc-400")}>
                        {publicVisible ? t("biz.config_active") : t("biz.config_inactive")}
                      </button>
                    </div>
                    {publicVisible && (
                      <div className="flex items-center justify-between p-3 md:p-4 bg-zinc-50 rounded-xl md:rounded-2xl border border-zinc-100 gap-2">
                        <div className="flex items-center gap-2 md:gap-3 min-w-0">
                          <Bot className="w-4 h-4 md:w-5 md:h-5 text-zinc-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] md:text-xs font-black italic text-zinc-950 truncate">{t("biz.config_public_ai")}</p>
                            <p className="text-[7px] md:text-[8px] font-bold text-zinc-400 italic truncate">{t("settings.chat_visible")}</p>
                          </div>
                        </div>
                        <button onClick={async () => { const v = !publicAIEnabled; setPublicAIEnabled(v); try { await onEditStore?.(userStore?._id || userStore?.id, { publicAI: v }); } catch (e: any) { setPublicAIEnabled(!v); showToast(e.message || t("status.error"), "error"); } }} className={cn("px-3 md:px-4 py-1.5 md:py-2 rounded-xl font-black text-[8px] md:text-[9px] italic uppercase transition-all shrink-0", publicAIEnabled ? "bg-emerald-50 text-emerald-600" : "bg-zinc-200 text-zinc-400")}>
                          {publicAIEnabled ? t("biz.config_active") : t("biz.config_inactive")}
                        </button>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <button onClick={() => setEditingStore(false)} className="w-full py-3 md:py-4 bg-zinc-50 text-zinc-600 rounded-xl md:rounded-2xl font-black italic text-[11px] md:text-sm hover:bg-zinc-100 transition-all">
                        {t("biz.config_btn_cancel")}
                      </button>
                      <button onClick={async () => { try { await onEditStore?.(userStore?._id || userStore?.id, { name: settingsForm.name, desc: settingsForm.desc, industry: settingsForm.industry, slug: settingsForm.slug, image: settingsForm.image, location: settingsForm.location, phone: settingsForm.phone, currency: settingsForm.currency, coordinates: settingsForm.coordinates, isPublic: publicVisible, publicAI: publicAIEnabled }); setShowSettings(false); } catch (e: any) { showToast(e.message || t("status.error"), "error"); } }} disabled={!settingsForm.name} className="w-full py-3 md:py-4 bg-red-600 text-white rounded-xl md:rounded-2xl font-black italic text-[11px] md:text-sm hover:bg-red-700 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4" /> {t("biz.config_btn_save")}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowUpgradeModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}
              className="bg-white rounded-[2rem] p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto">
                <TrendingUp className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-black italic text-zinc-950">Función premium</h3>
              <p className="text-sm text-zinc-500 font-medium">{upgradeMessage}</p>
              <div className="flex gap-3">
                <button onClick={() => setShowUpgradeModal(false)} className="flex-1 py-3 bg-zinc-100 text-zinc-500 rounded-xl font-black italic text-xs hover:bg-zinc-200 transition-all">
                  Ahora no
                </button>
                <button onClick={() => { setShowUpgradeModal(false); onNavigateToPricing?.(); }} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black italic text-xs hover:bg-red-700 transition-all shadow-lg">
                  Ver planes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCategoryGrid && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => { setShowCategoryGrid(false); setCategorySearch(""); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] p-6 max-w-2xl w-full shadow-2xl border border-zinc-100 space-y-4 max-h-[80vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black italic text-zinc-950 uppercase">{t("org.category_label") || "Categoría"}</h3>
                <button onClick={() => { setShowCategoryGrid(false); setCategorySearch(""); }} className="p-2 hover:bg-zinc-100 rounded-xl transition-all">
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value.toLowerCase())}
                  placeholder={t("org.search_category") || "Buscar categoría..."}
                  className="w-full pl-9 pr-4 py-3 bg-zinc-50 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 overflow-y-auto flex-1">
                {Object.entries(CATEGORIES)
                  .filter(([id, cat]) => !categorySearch || t("cat_" + id).toLowerCase().includes(categorySearch) || t("cat_" + id + "_desc").toLowerCase().includes(categorySearch) || id.includes(categorySearch))
                  .map(([id, cat]) => (
                  <button
                    key={id}
                    onClick={async () => {
                      if (onSaveStore && storeId) {
                        await Promise.resolve(onSaveStore(storeId, { category: id }));
                        showToast(t("org.toast_category_updated"), "success");
                      }
                      setShowCategoryGrid(false);
                      setCategorySearch("");
                    }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${storeCategory === id ? "bg-red-50 border-red-200 shadow-sm" : "bg-zinc-50 border-zinc-100 hover:bg-zinc-100"}`}
                  >
                    <span className="text-[10px] md:text-xs font-black italic text-zinc-950">{t("cat_" + id)}</span>
                    <span className="text-[7px] md:text-[8px] font-bold text-zinc-400 line-clamp-2">{t("cat_" + id + "_desc")}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



function SideBtn({ icon, label, active, onClick, badge }: { icon: any; label: string; active: boolean; onClick: () => void; badge?: string }) {
  return (
    <motion.button whileTap={{ scale: 0.95 }} onClick={onClick} className={cn("w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black text-xs italic transition-all", active ? "bg-red-600 text-white shadow-lg shadow-red-100" : "text-zinc-500 hover:bg-zinc-100")}>
      {icon ? React.cloneElement(icon, { className: "w-4 h-4" }) : null} {label}
      {badge && <span className="text-[7px] bg-amber-100 text-amber-600 px-1 py-0.5 rounded-full font-black ml-auto">{badge}</span>}
    </motion.button>
  );
}




