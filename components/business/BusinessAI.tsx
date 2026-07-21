"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bot, Send, Loader2, Sparkles, User, Mic, MicOff, Trash2
} from "lucide-react";
import { motion } from "framer-motion";
import { cn, searchKnowledgeBase } from "@/lib/utils";
import { useVoiceInput } from "@/lib/hooks/useVoiceInput";
import MarkdownRenderer from "@/components/chat/MarkdownRenderer";
import { convertToUSD } from "./currency";
import { CATEGORIES, type CategoryId } from "@/lib/categories/registry";

const MODULE_ACTIONS: Record<string, string[]> = {
  menu: ["addMenuItem", "updateMenuItem", "deleteMenuItem"],
  recipes: ["addRecipe", "updateRecipe", "deleteRecipe"],
  restaurant: ["addReservation", "updateReservation", "cancelReservation", "replyToReview", "addPromotion", "updatePromotion", "deletePromotion", "addRestaurantOrder", "updateRestaurantOrder", "addLoyaltyPoints", "updateLoyaltySettings", "updateWaiterCall"],
  clients: ["addClient", "updateClient", "deleteClient"],
  case_files: ["addCaseFile", "updateCaseFile", "deleteCaseFile"],
  hearings: ["addHearing", "updateHearing", "deleteHearing"],
  documents: ["addDocument", "updateDocument", "deleteDocument"],
  medical_records: ["addMedicalRecord", "updateMedicalRecord", "deleteMedicalRecord"],
  prescriptions: ["addPrescription", "updatePrescription", "deletePrescription"],
  doctors: ["addDoctor", "updateDoctor", "deleteDoctor"],
  courses: ["addCourse", "updateCourse", "deleteCourse"],
  classes: ["addClass", "updateClass", "deleteClass"],
  students: ["addStudent", "updateStudent", "deleteStudent"],
  grades: ["addGrade", "updateGrade", "deleteGrade"],
  barbers: ["addBarber", "updateBarber", "deleteBarber"],
  queue: ["addToQueue", "updateQueueEntry", "addBarberHistoryEntry"],
  inventory: ["addInventoryItem", "updateInventoryItem", "deleteInventoryItem"],
  gallery: ["addGalleryItem", "updateGalleryItem", "deleteGalleryItem"],
  testimonials: ["addTestimonial", "updateTestimonial", "deleteTestimonial"],
  products: ["addProduct", "updateProduct", "deleteProduct"],
  customers: ["addCustomer", "updateCustomer", "deleteCustomer"],
  orders: ["addOrder", "updateOrder", "deleteOrder"],
  services: ["addService", "updateService", "deleteService"],
  knowledgebase: ["addKbEntry", "updateKbEntry", "deleteKbEntry"],
  automations: ["addAutomation", "updateAutomation", "deleteAutomation", "addWorkflow", "updateWorkflow", "deleteWorkflow"],
  campaigns: ["addCampaign", "updateCampaign", "deleteCampaign"],
  appointments: ["addAppointment", "updateAppointment", "cancelAppointment"],
};

const GENERIC_MODULES = new Set(["products", "customers", "orders", "services", "knowledgebase", "automations", "campaigns", "appointments"]);

function getAllowedActions(category: string): Set<string> {
  const catDef = CATEGORIES[category as CategoryId] || CATEGORIES.general;
  const allowed = new Set<string>();
  for (const mod of GENERIC_MODULES) {
    for (const action of MODULE_ACTIONS[mod] || []) allowed.add(action);
  }
  for (const mod of catDef.modules) {
    for (const action of MODULE_ACTIONS[mod] || []) allowed.add(action);
  }
  return allowed;
}

const AI_WINDOW_MS = 2.5 * 60 * 60 * 1000;

export default function BusinessAI({ agentName, store, products, setProducts, customers, setCustomers, orders, setOrders, services, setServices, totalSales, kbEntries, setKbEntries, campaigns, setCampaigns, automations, setAutomations, onPersist, onExecuteAutomations, onSaveStore, maxMessages = 999 }: {
  agentName: string;
  store?: any;
  products: any[]; setProducts: any;
  customers: any[]; setCustomers: any;
  orders: any[]; setOrders: any;
  services: any[]; setServices: any;
  totalSales: number;
  kbEntries: any[]; setKbEntries: any;
  campaigns: any[]; setCampaigns: any;
  automations: any[]; setAutomations: any;
  onPersist?: (products?: any[], customers?: any[], orders?: any[], knowledgebase?: any[], automations?: any[], campaigns?: any[], smartForms?: any[], services?: any[]) => void;
  onExecuteAutomations?: (trigger: string, context: Record<string, any>) => void;
  onSaveStore?: (storeId: string | number, data: any) => Promise<boolean>;
  maxMessages?: number;
}) {
  const storageKey = `jandosoft_business_ai_${agentName.replace(/[^a-zA-Z0-9]/g, "_")}`;
  const [messages, setMessages] = useState<{ role: string; content: string; timestamp: number }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastProvider, setLastProvider] = useState<string>("");
  const voice = useVoiceInput({ autoSend: true, onResult: (text) => handleSend(text) });
  const clearChat = () => {
    localStorage.removeItem(storageKey);
    setMessages([{ role: "bot", content: `¡Hola! Soy el agente IA de ${agentName || "tu negocio"}. Puedo ayudarte a gestionar productos, clientes, pedidos y citas. Solo dime qué necesitas crear, modificar o eliminar.`, timestamp: Date.now() }]);
  };
  const [loaded, setLoaded] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [aiContacts, setAiContacts] = useState<any[]>([]);
  const [aiConversations, setAiConversations] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const storeCategory = (store as any)?.category || "general";
  const allowedActions = getAllowedActions(storeCategory);
  const categoryModules = new Set((CATEGORIES[storeCategory as CategoryId] || CATEGORIES.general).modules);

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

  const productsStr = products.map((p: any) => `ID:${p.id} ${p.name} $${p.price} stock:${p.stock}`).join(" | ");
  const customersStr = customers.map((c: any) => `ID:${c.id} ${c.name} ${c.email} ${c.phone}`).join(" | ");
  const ordersStr = orders.map((o: any) => `ID:${o.id} ${o.product} $${o.amount} ${o.status}`).join(" | ");
  const servicesStr = services.map((s: any) => `ID:${s.id} ${s.name} $${s.price} ${s.desc ? s.desc.slice(0, 50) : ""}`).join(" | ");
  const autoStr = automations.filter((a: any) => a.enabled).map((a: any) => `"${a.name}" (trigger: ${a.trigger}, action: ${a.actionType})`).join(", ");
  const campaignsStr = campaigns.map((c: any) => `"${c.name}" (${c.type}, ${c.status})`).join(", ");
  const contactsStr = aiContacts.map((c: any) => `${c.contactName} (${c.contactEmail})`).join(", ");
  const storeConfig = store ? `\n\nCONFIGURACIÓN DE LA EMPRESA:\n- Tipo: ${store.type || "No definido"}\n- Industria: ${store.industry || "No definida"}\n- Descripción: ${store.desc || "Sin descripción"}\n- Slug: ${store.slug || "Sin slug"}\n- URL pública: ${store.slug ? window.location.origin + "/s/" + store.slug : "N/A"}\n- Empresa pública: ${store.isPublic ? "Sí" : "No"}\n- IA pública: ${store.publicAI ? "Sí" : "No"}\n- Imagen: ${store.image ? "Tiene imagen" : "Sin imagen"}\n- Moneda: ${store.currency || "USD"}\n- Stripe Connect: ${store.stripeAccountId ? "Conectado" : "No conectado"}\n- Pagos habilitados: ${store.paymentsEnabled ? "Sí" : "No"}\n- Comisión de plataforma: ${store.platformFeePercent ?? 5}%` : "";

  const clientsList = (store?.clients || []).map((c: any) => `  ID:${c.id} ${c.name} ${c.email || ""} ${c.phone || ""}`).join("\n");
  const caseFilesList = (store?.caseFiles || []).map((f: any) => `  ID:${f.id} ${f.title || f.name || ""} ${f.clientName || ""} ${f.status || ""}`).join("\n");
  const hearingsList = (store?.hearings || []).map((h: any) => `  ID:${h.id} ${h.title || h.name || ""} ${h.date || ""} ${h.status || ""}`).join("\n");
  const documentsList = (store?.documents || []).map((d: any) => `  ID:${d.id} ${d.title || d.name || ""} ${d.type || ""}`).join("\n");
  const medicalRecordsList = (store?.medicalRecords || []).map((r: any) => `  ID:${r.id} ${r.patientName || ""} ${r.diagnosis || ""} ${r.date || ""}`).join("\n");
  const prescriptionsList = (store?.prescriptions || []).map((p: any) => `  ID:${p.id} ${p.patientName || ""} ${p.medication || ""} ${p.prescribedBy || ""}`).join("\n");
  const doctorsList = (store?.doctors || []).map((d: any) => `  ID:${d.id} ${d.name || ""} ${d.specialty || ""} ${d.phone || ""}`).join("\n");
  const coursesList = (store?.courses || []).map((c: any) => `  ID:${c.id} ${c.name || ""} ${c.instructor || ""} $${c.price || 0} ${c.level || ""}`).join("\n");
  const studentsList = (store?.students || []).map((s: any) => `  ID:${s.id} ${s.name || ""} ${s.email || ""} ${s.grade || ""}`).join("\n");
  const menuItemsList = (store?.menuItems || []).map((m: any) => `  ID:${m.id} ${m.name || ""} ${m.category || ""} $${m.price || 0} ${m.featured ? "★" : ""}`).join("\n");
  const recipesList = (store?.recipes || []).map((r: any) => `  ID:${r.id} ${r.name || ""} ${r.difficulty || ""} ${r.prepTime || 0}min`).join("\n");
  const gradesList = (store?.grades || []).map((g: any) => `  ID:${g.id} ${g.studentName || ""} ${g.course || ""} ${g.subject || ""} ${g.score || 0} ${g.letterGrade || ""}`).join("\n");
  const classesList = (store?.classes || []).map((c: any) => `  ID:${c.id} ${c.name || ""} ${c.course || ""} ${c.teacher || ""} cupo:${c.enrolled || 0}/${c.capacity || 0}`).join("\n");
  const inventoryItemsList = (store?.inventoryItems || []).map((i: any) => `  ID:${i.id} ${i.name || ""} ${i.category || ""} qty:${i.quantity || 0} $${i.price || 0}`).join("\n");
  const galleryItemsList = (store?.galleryItems || []).map((g: any) => `  ID:${g.id} ${g.title || ""} ${g.category || ""} ${g.featured ? "★" : ""}`).join("\n");
  const testimonialsList = (store?.testimonials || []).map((t: any) => `  ID:${t.id} ${t.clientName || ""} ${t.rating || 0}★ ${t.company || ""} ${t.approved ? "✓" : "pendiente"}`).join("\n");

  const appointmentsStr = appointments.map((a: any) =>
    `  - ${a.date} ${a.time} | ${a.customerInfo?.name || "Sin nombre"} | ${a.service?.name || "Sin servicio"} | ${a.status}`
  ).join("\n");

  const getContextInfo = (query: string) => {
    const matchedKb = searchKnowledgeBase(query, kbEntries, 5);
    const kbStr = matchedKb.map((k: any) => `[${k.category}] ${k.question ? k.question + " → " : ""}${k.title}: ${k.content.slice(0, 200)}`).join("\n");

    let sections = `DATOS ACTUALES:\nProductos (${products.length}): ${productsStr || "ninguno"}\nServicios (${services.length}): ${servicesStr || "ninguno"}\nClientes de negocio (${customers.length}): ${customersStr || "ninguno"}\nPedidos (${orders.length}): ${ordersStr || "ninguno"}\nCampañas (${campaigns.length}): ${campaignsStr || "ninguna"}\nVentas totales: $${totalSales}${storeConfig}`;

    if (categoryModules.has("clients")) sections += `\n\nCLIENTES LEGALES (${(store?.clients || []).length}):\n${clientsList || "  No hay clientes legales registrados."}`;
    if (categoryModules.has("case_files")) sections += `\n\nEXPEDIENTES (${(store?.caseFiles || []).length}):\n${caseFilesList || "  No hay expedientes."}`;
    if (categoryModules.has("hearings")) sections += `\n\nAUDIENCIAS (${(store?.hearings || []).length}):\n${hearingsList || "  No hay audiencias."}`;
    if (categoryModules.has("documents")) sections += `\n\nDOCUMENTOS (${(store?.documents || []).length}):\n${documentsList || "  No hay documentos."}`;
    if (categoryModules.has("medical_records")) sections += `\n\nHISTORIALES MÉDICOS (${(store?.medicalRecords || []).length}):\n${medicalRecordsList || "  No hay historiales médicos."}`;
    if (categoryModules.has("prescriptions")) sections += `\n\nRECETAS MÉDICAS (${(store?.prescriptions || []).length}):\n${prescriptionsList || "  No hay recetas médicas."}`;
    if (categoryModules.has("doctors")) sections += `\n\nDOCTORAS/DOCTORES (${(store?.doctors || []).length}):\n${doctorsList || "  No hay doctoras registradas."}`;
    if (categoryModules.has("courses")) sections += `\n\nCURSOS (${(store?.courses || []).length}):\n${coursesList || "  No hay cursos."}`;
    if (categoryModules.has("students")) sections += `\n\nESTUDIANTES (${(store?.students || []).length}):\n${studentsList || "  No hay estudiantes registrados."}`;
    if (categoryModules.has("grades")) sections += `\n\nCALIFICACIONES (${(store?.grades || []).length}):\n${gradesList || "  No hay calificaciones."}`;
    if (categoryModules.has("classes")) sections += `\n\nCLASES (${(store?.classes || []).length}):\n${classesList || "  No hay clases registradas."}`;
    if (categoryModules.has("menu")) sections += `\n\nMENÚ (${(store?.menuItems || []).length}):\n${menuItemsList || "  No hay items en el menú."}`;
    if (categoryModules.has("recipes")) sections += `\n\nRECETAS (${(store?.recipes || []).length}):\n${recipesList || "  No hay recetas."}`;
    if (categoryModules.has("inventory")) sections += `\n\nINVENTARIO (${(store?.inventoryItems || []).length}):\n${inventoryItemsList || "  No hay items en inventario."}`;
    if (categoryModules.has("gallery")) sections += `\n\nGALERÍA (${(store?.galleryItems || []).length}):\n${galleryItemsList || "  No hay imágenes en la galería."}`;
    if (categoryModules.has("testimonials")) sections += `\n\nTESTIMONIOS (${(store?.testimonials || []).length}):\n${testimonialsList || "  No hay testimonios."}`;

    sections += `\n\nBASE DE CONOCIMIENTO (${kbEntries.length}):\n${kbStr || "  No hay entradas."}\n\nAUTOMATIZACIONES (${automations.length}):\n${autoStr || "  No hay automatizaciones."}\n\nCONTACTOS (${aiContacts.length}):\n${contactsStr || "  No hay contactos."}\n\nCONVERSACIONES:\n${aiConversations.length > 0 ? aiConversations.slice(0, 5).map((c: any) => { const other = c.participants?.find((p: any) => p.email !== c.lastSenderId) || c.participants?.[0]; return `- ${other?.name || "Usuario"}: ${c.lastMessage || "Sin mensajes"}`; }).join("\n") : "No hay conversaciones."}\n\nCITAS (${appointments.length}):\n${appointmentsStr || "  No hay citas agendadas."}\n\nPuedes consultar la base de conocimiento, automatizaciones, contactos, conversaciones y citas para responder preguntas del usuario. También puedes sugerir añadir, modificar o eliminar entradas usando los actions correspondientes. Puedes enviar mensajes a otros usuarios usando la acción sendMessage, enviar correos electrónicos con sendEmail, y añadir contactos con addContact.`;
    return sections;
  };

  const executeActions = async (actions: any[]) => {
    let newProducts = [...products];
    let newCustomers = [...customers];
    let newOrders = [...orders];
    let newServices = [...services];
    let newCampaigns = [...campaigns];
    let newKbEntries = [...kbEntries];
    let newAutomations = [...automations];
    let newAppointments = [...appointments];
    let result = "";
    let _uid = Date.now();
    const uid = () => ++_uid;
    const asyncOps: Promise<void>[] = [];
    for (const action of actions) {
      if (!allowedActions.has(action.type)) {
        result += `⚠️ La acción "${action.type}" no está disponible para este tipo de negocio. `;
        continue;
      }
      switch (action.type) {
        case "addProduct":
          const priceVal = typeof action.price === "string" ? parseFloat(action.price.replace(/[^0-9.]/g, "")) : Number(action.price) || 0;
          const currencyVal = action.currency || "USD";
          const stockVal = action.stock || 0;
          newProducts = [...newProducts, { id: uid(), name: action.name, price: priceVal, currency: currencyVal, priceUSD: convertToUSD(priceVal, currencyVal), stock: stockVal, images: [], desc: action.desc || "", barcode: action.barcode || "" }];
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
        case "updateCustomer":
          newCustomers = newCustomers.map((c: any) => c.id === action.id ? { ...c, ...action.data } : c);
          result += `✏️ Cliente actualizado. `;
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
        case "addService":
          newServices = [...newServices, { id: uid(), name: action.name, price: action.price, desc: action.desc || "", duration: action.duration || 60 }];
          result += `✅ Servicio "${action.name}" creado. `;
          break;
        case "updateService":
          newServices = newServices.map((s: any) => s.id === action.id ? { ...s, ...action.data } : s);
          result += `✏️ Servicio actualizado. `;
          break;
        case "deleteService":
          newServices = newServices.filter((s: any) => s.id !== action.id);
          result += `🗑️ Servicio eliminado. `;
          break;
        case "addKbEntry":
          newKbEntries = [...newKbEntries, { id: uid(), title: action.title, content: action.content, question: action.question || "", category: action.category || "general", createdAt: new Date().toISOString() }];
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
        case "addWorkflow":
          newAutomations = [...newAutomations, { id: uid(), name: action.name, trigger: action.trigger || action.triggerType, actionType: "workflow", actionConfig: { workflow: true, steps: action.steps || [] }, triggerConfig: action.triggerConfig || {}, enabled: true, createdAt: new Date().toISOString() }];
          result += `⚡ Workflow "${action.name}" creado. `;
          break;
        case "deleteWorkflow":
          newAutomations = newAutomations.filter((a: any) => a.id !== action.id);
          result += `🗑️ Workflow eliminado. `;
          break;
        case "updateWorkflow":
          newAutomations = newAutomations.map((a: any) => a.id === action.id ? { ...a, ...action.data } : a);
          result += `✏️ Workflow actualizado. `;
          break;
        case "addCampaign":
          newCampaigns = [...newCampaigns, { id: uid(), name: action.name, type: action.type || "email", status: "draft", audience: action.audience || "", subject: action.subject || "", body: action.body || "", scheduledAt: null, sentAt: null, stats: { sent: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 }, createdAt: new Date().toISOString() }];
          result += `📢 Campaña "${action.name}" creada. `;
          break;
        case "updateCampaign":
          newCampaigns = newCampaigns.map((c: any) => c.id === action.id ? { ...c, ...action.data } : c);
          result += `✏️ Campaña actualizada. `;
          break;
        case "deleteCampaign":
          newCampaigns = newCampaigns.filter((c: any) => c.id !== action.id);
          result += `🗑️ Campaña eliminada. `;
          break;
        case "sendMessage":
          asyncOps.push((async () => {
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
          })());
          break;
        case "sendEmail":
          asyncOps.push((async () => {
            const to = action.to;
            const subject = action.subject || "Mensaje de Jandosoft";
            const content = action.content || action.message || "";
            if (to && content) {
              try {
                const res = await fetch("/api/email/send", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ to, subject, content }),
                });
                const data = await res.json();
                if (data.success) result += `✉️ Correo enviado a ${to}. `;
                else result += `⚠️ Error al enviar correo a ${to}. `;
              } catch { result += `⚠️ Error de conexión al enviar correo a ${to}. `; }
            } else { result += `⚠️ Falta destinatario (to) o contenido (content) para enviar el correo. `; }
          })());
          break;
        case "addContact":
          asyncOps.push((async () => {
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
          })());
          break;
        case "addAppointment":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
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
          })());
          break;
        case "updateAppointment":
          asyncOps.push((async () => {
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
          })());
          break;
        case "cancelAppointment":
          asyncOps.push((async () => {
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
          })());
          break;
        case "addClient":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.clients || [];
            const newClient = { id: uid(), name: action.name, email: action.email || "", phone: action.phone || "", ...(action.data || {}) };
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { clients: [...existing, newClient] }));
            if (_ok !== false) result += `✅ Cliente legal "${action.name}" creado. `;
            else result += `⚠️ Error al guardar en el servidor.`;
          })());
          break;
        case "deleteClient":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.clients || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { clients: existing.filter((c: any) => c.id !== action.id) }));
            if (_ok !== false) result += `🗑️ Cliente legal eliminado. `;
            else result += `⚠️ Error al eliminar en el servidor.`;
          })());
          break;
        case "updateClient":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.clients || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { clients: existing.map((c: any) => c.id === action.id ? { ...c, ...action.data } : c) }));
            if (_ok !== false) result += `✏️ Cliente legal actualizado. `;
            else result += `⚠️ Error al actualizar en el servidor.`;
          })());
          break;
        case "addCaseFile":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.caseFiles || [];
            const newEntry = { id: uid(), caseNumber: action.title || action.caseNumber || "Expediente", clientName: action.clientName || "", type: action.type || "", status: action.status || "active", description: action.description || "", court: action.court || "", judge: action.judge || "", filingDate: action.filingDate || "", opposingCounsel: action.opposingCounsel || "", outcome: action.outcome || "", ...(action.data || {}) };
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { caseFiles: [...existing, newEntry] }));
            if (_ok !== false) result += `✅ Expediente "${newEntry.caseNumber}" creado. `;
            else result += `⚠️ Error al guardar en el servidor.`;
          })());
          break;
        case "deleteCaseFile":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.caseFiles || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { caseFiles: existing.filter((f: any) => f.id !== action.id) }));
            if (_ok !== false) result += `🗑️ Expediente eliminado. `;
            else result += `⚠️ Error al eliminar en el servidor.`;
          })());
          break;
        case "updateCaseFile":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.caseFiles || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { caseFiles: existing.map((f: any) => f.id === action.id ? { ...f, ...action.data } : f) }));
            if (_ok !== false) result += `✏️ Expediente actualizado. `;
            else result += `⚠️ Error al actualizar en el servidor.`;
          })());
          break;
        case "addHearing":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.hearings || [];
            const newEntry = { id: uid(), caseNumber: action.title || action.caseNumber || "Audiencia", date: action.date || "", time: action.time || "", court: action.court || "", judge: action.judge || "", notes: action.notes || "", room: action.room || "", hearingType: action.type || action.hearingType || "", duration: action.duration || 60, outcome: action.outcome || "", ...(action.data || {}) };
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { hearings: [...existing, newEntry] }));
            if (_ok !== false) result += `✅ Audiencia "${newEntry.caseNumber}" creada. `;
            else result += `⚠️ Error al guardar en el servidor.`;
          })());
          break;
        case "deleteHearing":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.hearings || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { hearings: existing.filter((h: any) => h.id !== action.id) }));
            if (_ok !== false) result += `🗑️ Audiencia eliminada. `;
            else result += `⚠️ Error al eliminar en el servidor.`;
          })());
          break;
        case "updateHearing":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.hearings || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { hearings: existing.map((h: any) => h.id === action.id ? { ...h, ...action.data } : h) }));
            if (_ok !== false) result += `✏️ Audiencia actualizada. `;
            else result += `⚠️ Error al actualizar en el servidor.`;
          })());
          break;
        case "addDocument":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.documents || [];
            const newEntry = { id: uid(), name: action.title || action.name || "Documento", type: action.type || "", desc: action.content || action.desc || "", fileUrl: action.fileUrl || "", ...(action.data || {}) };
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { documents: [...existing, newEntry] }));
            if (_ok !== false) result += `✅ Documento "${newEntry.name}" creado. `;
            else result += `⚠️ Error al guardar en el servidor.`;
          })());
          break;
        case "deleteDocument":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.documents || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { documents: existing.filter((d: any) => d.id !== action.id) }));
            if (_ok !== false) result += `🗑️ Documento eliminado. `;
            else result += `⚠️ Error al eliminar en el servidor.`;
          })());
          break;
        case "updateDocument":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.documents || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { documents: existing.map((d: any) => d.id === action.id ? { ...d, ...action.data } : d) }));
            if (_ok !== false) result += `✏️ Documento actualizado. `;
            else result += `⚠️ Error al actualizar en el servidor.`;
          })());
          break;
        case "addMedicalRecord":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.medicalRecords || [];
            const newEntry = { id: uid(), patientName: action.patientName, date: action.date || "", diagnosis: action.diagnosis || "", doctor: action.doctor || "", notes: action.notes || "", visitType: action.visitType || "general", symptoms: action.symptoms || "", treatment: action.treatment || "", followUpDate: action.followUpDate || "", attachments: action.attachments || "", ...(action.data || {}) };
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { medicalRecords: [...existing, newEntry] }));
            if (_ok !== false) result += `✅ Historial médico de "${action.patientName}" creado. `;
            else result += `⚠️ Error al guardar en el servidor.`;
          })());
          break;
        case "updateMedicalRecord":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.medicalRecords || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { medicalRecords: existing.map((r: any) => r.id === action.id ? { ...r, ...action.data } : r) }));
            if (_ok !== false) result += `✏️ Historial médico actualizado. `;
            else result += `⚠️ Error al actualizar en el servidor.`;
          })());
          break;
        case "deleteMedicalRecord":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.medicalRecords || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { medicalRecords: existing.filter((r: any) => r.id !== action.id) }));
            if (_ok !== false) result += `🗑️ Historial médico eliminado. `;
            else result += `⚠️ Error al eliminar en el servidor.`;
          })());
          break;
        case "addPrescription":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.prescriptions || [];
            const newEntry = { id: uid(), patientName: action.patientName, medication: action.medication, dosage: action.dosage || "", frequency: action.frequency || "", startDate: action.startDate || "", endDate: action.endDate || "", prescribedBy: action.prescribedBy || "", pharmacy: action.pharmacy || "", refills: action.refills || 0, instructions: action.instructions || "", strength: action.strength || "", ...(action.data || {}) };
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { prescriptions: [...existing, newEntry] }));
            if (_ok !== false) result += `✅ Receta de "${action.medication}" para ${action.patientName} creada. `;
            else result += `⚠️ Error al guardar en el servidor.`;
          })());
          break;
        case "updatePrescription":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.prescriptions || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { prescriptions: existing.map((p: any) => p.id === action.id ? { ...p, ...action.data } : p) }));
            if (_ok !== false) result += `✏️ Receta actualizada. `;
            else result += `⚠️ Error al actualizar en el servidor.`;
          })());
          break;
        case "deletePrescription":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.prescriptions || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { prescriptions: existing.filter((p: any) => p.id !== action.id) }));
            if (_ok !== false) result += `🗑️ Receta eliminada. `;
            else result += `⚠️ Error al eliminar en el servidor.`;
          })());
          break;
        case "addDoctor":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.doctors || [];
            const newEntry = { id: uid(), name: action.name, specialty: action.specialty || "", phone: action.phone || "", email: action.email || "", schedule: action.schedule || "", licenseNumber: action.licenseNumber || "", department: action.department || "", bio: action.bio || "", imageUrl: action.imageUrl || "", consultationFee: Number(action.consultationFee) || 0, available: action.available !== false, ...(action.data || {}) };
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { doctors: [...existing, newEntry] }));
            if (_ok !== false) result += `✅ Doctor(a) "${action.name}" registrado(a). `;
            else result += `⚠️ Error al guardar en el servidor.`;
          })());
          break;
        case "updateDoctor":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.doctors || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { doctors: existing.map((d: any) => d.id === action.id ? { ...d, ...action.data } : d) }));
            if (_ok !== false) result += `✏️ Doctor(a) actualizado(a). `;
            else result += `⚠️ Error al actualizar en el servidor.`;
          })());
          break;
        case "deleteDoctor":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.doctors || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { doctors: existing.filter((d: any) => d.id !== action.id) }));
            if (_ok !== false) result += `🗑️ Doctor(a) eliminado(a). `;
            else result += `⚠️ Error al eliminar en el servidor.`;
          })());
          break;
        case "addInventoryItem":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.inventoryItems || [];
            const newEntry = { id: uid(), name: action.name, quantity: Number(action.quantity) || 0, price: Number(action.price) || 0, supplier: action.supplier || "", category: action.category || "", sku: action.sku || "", minStock: Number(action.minStock) || 0, location: action.location || "", expirationDate: action.expirationDate || "", unit: action.unit || "", description: action.description || "", ...(action.data || {}) };
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { inventoryItems: [...existing, newEntry] }));
            if (_ok !== false) result += `✅ Item "${action.name}" añadido al inventario. `;
            else result += `⚠️ Error al guardar en el servidor.`;
          })());
          break;
        case "updateInventoryItem":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.inventoryItems || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { inventoryItems: existing.map((i: any) => i.id === action.id ? { ...i, ...action.data } : i) }));
            if (_ok !== false) result += `✏️ Item de inventario actualizado. `;
            else result += `⚠️ Error al actualizar en el servidor.`;
          })());
          break;
        case "deleteInventoryItem":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.inventoryItems || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { inventoryItems: existing.filter((i: any) => i.id !== action.id) }));
            if (_ok !== false) result += `🗑️ Item de inventario eliminado. `;
            else result += `⚠️ Error al eliminar en el servidor.`;
          })());
          break;
        case "addGalleryItem":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.galleryItems || [];
            const newEntry = { id: uid(), title: action.title, imageUrl: action.imageUrl || "", desc: action.desc || "", altText: action.altText || "", category: action.category || "", featured: action.featured === true, date: action.date || "", ...(action.data || {}) };
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { galleryItems: [...existing, newEntry] }));
            if (_ok !== false) result += `✅ Imagen "${action.title}" añadida a la galería. `;
            else result += `⚠️ Error al guardar en el servidor.`;
          })());
          break;
        case "updateGalleryItem":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.galleryItems || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { galleryItems: existing.map((g: any) => g.id === action.id ? { ...g, ...action.data } : g) }));
            if (_ok !== false) result += `✏️ Item de galería actualizado. `;
            else result += `⚠️ Error al actualizar en el servidor.`;
          })());
          break;
        case "deleteGalleryItem":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.galleryItems || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { galleryItems: existing.filter((g: any) => g.id !== action.id) }));
            if (_ok !== false) result += `🗑️ Item de galería eliminado. `;
            else result += `⚠️ Error al eliminar en el servidor.`;
          })());
          break;
        case "addTestimonial":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.testimonials || [];
            const newEntry = { id: uid(), clientName: action.clientName, text: action.text || "", rating: Number(action.rating) || 5, date: action.date || "", company: action.company || "", position: action.position || "", avatar: action.avatar || "", approved: action.approved !== false, featured: action.featured === true, ...(action.data || {}) };
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { testimonials: [...existing, newEntry] }));
            if (_ok !== false) result += `✅ Testimonio de "${action.clientName}" añadido. `;
            else result += `⚠️ Error al guardar en el servidor.`;
          })());
          break;
        case "updateTestimonial":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.testimonials || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { testimonials: existing.map((t: any) => t.id === action.id ? { ...t, ...action.data } : t) }));
            if (_ok !== false) result += `✏️ Testimonio actualizado. `;
            else result += `⚠️ Error al actualizar en el servidor.`;
          })());
          break;
        case "deleteTestimonial":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.testimonials || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { testimonials: existing.filter((t: any) => t.id !== action.id) }));
            if (_ok !== false) result += `🗑️ Testimonio eliminado. `;
            else result += `⚠️ Error al eliminar en el servidor.`;
          })());
          break;
        case "addClass":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.classes || [];
            const newEntry = { id: uid(), name: action.name, course: action.course || "", teacher: action.teacher || "", schedule: action.schedule || "", capacity: Number(action.capacity) || 0, price: Number(action.price) || 0, enrolled: Number(action.enrolled) || 0, room: action.room || "", startDate: action.startDate || "", endDate: action.endDate || "", recurring: action.recurring || "", ...(action.data || {}) };
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { classes: [...existing, newEntry] }));
            if (_ok !== false) result += `✅ Clase "${action.name}" creada. `;
            else result += `⚠️ Error al guardar en el servidor.`;
          })());
          break;
        case "updateClass":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.classes || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { classes: existing.map((c: any) => c.id === action.id ? { ...c, ...action.data } : c) }));
            if (_ok !== false) result += `✏️ Clase actualizada. `;
            else result += `⚠️ Error al actualizar en el servidor.`;
          })());
          break;
        case "deleteClass":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.classes || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { classes: existing.filter((c: any) => c.id !== action.id) }));
            if (_ok !== false) result += `🗑️ Clase eliminada. `;
            else result += `⚠️ Error al eliminar en el servidor.`;
          })());
          break;
        case "addCourse":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.courses || [];
            const newEntry = { id: uid(), name: action.name, desc: action.desc || "", price: Number(action.price) || 0, durationWeeks: Number(action.durationWeeks) || 0, schedule: action.schedule || "", instructor: action.instructor || "", maxStudents: Number(action.maxStudents) || 0, level: action.level || "", startDate: action.startDate || "", imageUrl: action.imageUrl || "", ...(action.data || {}) };
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { courses: [...existing, newEntry] }));
            if (_ok !== false) result += `✅ Curso "${action.name}" creado. `;
            else result += `⚠️ Error al guardar en el servidor.`;
          })());
          break;
        case "updateCourse":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.courses || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { courses: existing.map((c: any) => c.id === action.id ? { ...c, ...action.data } : c) }));
            if (_ok !== false) result += `✏️ Curso actualizado. `;
            else result += `⚠️ Error al actualizar en el servidor.`;
          })());
          break;
        case "deleteCourse":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.courses || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { courses: existing.filter((c: any) => c.id !== action.id) }));
            if (_ok !== false) result += `🗑️ Curso eliminado. `;
            else result += `⚠️ Error al eliminar en el servidor.`;
          })());
          break;
        case "addStudent":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.students || [];
            const newEntry = { id: uid(), name: action.name, email: action.email || "", phone: action.phone || "", grade: action.grade || "", parentName: action.parentName || "", address: action.address || "", birthDate: action.birthDate || "", enrollmentDate: action.enrollmentDate || "", emergencyContact: action.emergencyContact || "", notes: action.notes || "", photo: action.photo || "", ...(action.data || {}) };
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { students: [...existing, newEntry] }));
            if (_ok !== false) result += `✅ Estudiante "${action.name}" registrado. `;
            else result += `⚠️ Error al guardar en el servidor.`;
          })());
          break;
        case "updateStudent":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.students || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { students: existing.map((s: any) => s.id === action.id ? { ...s, ...action.data } : s) }));
            if (_ok !== false) result += `✏️ Estudiante actualizado. `;
            else result += `⚠️ Error al actualizar en el servidor.`;
          })());
          break;
        case "deleteStudent":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.students || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { students: existing.filter((s: any) => s.id !== action.id) }));
            if (_ok !== false) result += `🗑️ Estudiante eliminado. `;
            else result += `⚠️ Error al eliminar en el servidor.`;
          })());
          break;
        case "addGrade":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.grades || [];
            const newEntry = { id: uid(), studentName: action.studentName, course: action.course || "", score: Number(action.score) || 0, period: action.period || "", comments: action.comments || "", subject: action.subject || "", gradeWeight: Number(action.gradeWeight) || 1, letterGrade: action.letterGrade || "", semester: action.semester || "", attendance: Number(action.attendance) || 0, ...(action.data || {}) };
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { grades: [...existing, newEntry] }));
            if (_ok !== false) result += `✅ Calificación para ${action.studentName} creada. `;
            else result += `⚠️ Error al guardar en el servidor.`;
          })());
          break;
        case "updateGrade":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.grades || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { grades: existing.map((g: any) => g.id === action.id ? { ...g, ...action.data } : g) }));
            if (_ok !== false) result += `✏️ Calificación actualizada. `;
            else result += `⚠️ Error al actualizar en el servidor.`;
          })());
          break;
        case "deleteGrade":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.grades || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { grades: existing.filter((g: any) => g.id !== action.id) }));
            if (_ok !== false) result += `🗑️ Calificación eliminada. `;
            else result += `⚠️ Error al eliminar en el servidor.`;
          })());
          break;
        case "addMenuItem":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.menuItems || [];
            const newEntry = { id: uid(), name: action.name, desc: action.desc || "", price: Number(action.price) || 0, category: action.category || "", imageUrl: action.imageUrl || "", ingredients: action.ingredients || "", calories: Number(action.calories) || 0, dietaryInfo: action.dietaryInfo || "", featured: action.featured === true, preparationTime: Number(action.preparationTime) || 0, ...(action.data || {}) };
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { menuItems: [...existing, newEntry] }));
            if (_ok !== false) result += `✅ Item "${action.name}" añadido al menú. `;
            else result += `⚠️ Error al guardar en el servidor.`;
          })());
          break;
        case "updateMenuItem":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.menuItems || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { menuItems: existing.map((m: any) => m.id === action.id ? { ...m, ...action.data } : m) }));
            if (_ok !== false) result += `✏️ Item de menú actualizado. `;
            else result += `⚠️ Error al actualizar en el servidor.`;
          })());
          break;
        case "deleteMenuItem":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.menuItems || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { menuItems: existing.filter((m: any) => m.id !== action.id) }));
            if (_ok !== false) result += `🗑️ Item de menú eliminado. `;
            else result += `⚠️ Error al eliminar en el servidor.`;
          })());
          break;
        case "addRecipe":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.recipes || [];
            const newEntry = { id: uid(), name: action.name, ingredients: action.ingredients || "", instructions: action.instructions || "", prepTime: Number(action.prepTime) || 0, cookTime: Number(action.cookTime) || 0, difficulty: action.difficulty || "", servings: Number(action.servings) || 1, calories: Number(action.calories) || 0, imageUrl: action.imageUrl || "", tags: action.tags || "", ...(action.data || {}) };
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { recipes: [...existing, newEntry] }));
            if (_ok !== false) result += `✅ Receta "${action.name}" creada. `;
            else result += `⚠️ Error al guardar en el servidor.`;
          })());
          break;
        case "updateRecipe":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.recipes || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { recipes: existing.map((r: any) => r.id === action.id ? { ...r, ...action.data } : r) }));
            if (_ok !== false) result += `✏️ Receta actualizada. `;
            else result += `⚠️ Error al actualizar en el servidor.`;
          })());
          break;
        case "deleteRecipe":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            const existing = (store as any)?.recipes || [];
            const _ok = await Promise.resolve(onSaveStore?.(storeId, { recipes: existing.filter((r: any) => r.id !== action.id) }));
            if (_ok !== false) result += `🗑️ Receta eliminada. `;
            else result += `⚠️ Error al eliminar en el servidor.`;
          })());
          break;
        case "addReservation":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            if (!action.customerName || !action.phone) { result += "⚠️ Faltan campos requeridos: customerName, phone. "; return; }
            try {
              const res = await fetch(`/api/restaurant/${storeId}/reservations`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  customerName: action.customerName, phone: action.phone, email: action.email || "",
                  date: action.date, time: action.time, partySize: Number(action.partySize) || 2,
                  tableNumber: action.tableNumber ? Number(action.tableNumber) : undefined, notes: action.notes || "",
                }),
              });
              const data = await res.json();
              if (data.reservation || data._id) result += `✅ Reserva creada para ${action.customerName} el ${action.date} a las ${action.time}. `;
              else result += `⚠️ Error al crear reserva. `;
            } catch { result += `⚠️ Error al crear reserva. `; }
          })());
          break;
        case "updateReservation":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            const id = action.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            if (!id) { result += "⚠️ Error: ID de reserva requerido. "; return; }
            try {
              const body: any = {};
              if (action.status) body.status = action.status;
              if (action.date) body.date = action.date;
              if (action.time) body.time = action.time;
              if (action.partySize) body.partySize = Number(action.partySize);
              if (action.tableNumber) body.tableNumber = Number(action.tableNumber);
              if (action.notes) body.notes = action.notes;
              await fetch(`/api/restaurant/${storeId}/reservations/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
              });
              result += `✅ Reserva actualizada. `;
            } catch { result += `⚠️ Error al actualizar reserva. `; }
          })());
          break;
        case "cancelReservation":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            const id = action.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            if (!id) { result += "⚠️ Error: ID de reserva requerido. "; return; }
            try {
              await fetch(`/api/restaurant/${storeId}/reservations/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "cancelled" }),
              });
              result += `🗑️ Reserva cancelada. `;
            } catch { result += `⚠️ Error al cancelar reserva. `; }
          })());
          break;
        case "replyToReview":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            const reviewId = action.reviewId;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            if (!reviewId || !action.reply) { result += "⚠️ Faltan campos requeridos: reviewId, reply. "; return; }
            try {
              await fetch(`/api/restaurant/${storeId}/reviews/${reviewId}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reply: action.reply }),
              });
              result += `✅ Respuesta enviada a la reseña. `;
            } catch { result += `⚠️ Error al responder reseña. `; }
          })());
          break;
        case "addPromotion":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            if (!action.code || !action.type || !action.value) { result += "⚠️ Faltan campos requeridos: code, type, value. "; return; }
            try {
              const res = await fetch(`/api/restaurant/${storeId}/promotions`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  code: action.code.toUpperCase(), description: action.description || "", type: action.type,
                  value: Number(action.value), minOrder: Number(action.minOrder) || 0, maxUses: Number(action.maxUses) || 0,
                  validFrom: action.validFrom || undefined, validUntil: action.validUntil || undefined, active: action.active !== false,
                }),
              });
              const data = await res.json();
              if (data.promotion || data._id) result += `✅ Promoción "${action.code}" creada. `;
              else result += `⚠️ Error al crear promoción. `;
            } catch { result += `⚠️ Error al crear promoción. `; }
          })());
          break;
        case "updatePromotion":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            const id = action.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            if (!id) { result += "⚠️ Error: ID de promoción requerido. "; return; }
            try {
              const body: any = {};
              if (action.code) body.code = action.code.toUpperCase();
              if (action.description) body.description = action.description;
              if (action.type) body.type = action.type;
              if (action.value) body.value = Number(action.value);
              if (action.minOrder !== undefined) body.minOrder = Number(action.minOrder);
              if (action.maxUses !== undefined) body.maxUses = Number(action.maxUses);
              if (action.validFrom) body.validFrom = action.validFrom;
              if (action.validUntil) body.validUntil = action.validUntil;
              if (action.active !== undefined) body.active = action.active;
              await fetch(`/api/restaurant/${storeId}/promotions/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
              });
              result += `✅ Promoción actualizada. `;
            } catch { result += `⚠️ Error al actualizar promoción. `; }
          })());
          break;
        case "deletePromotion":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            const id = action.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            if (!id) { result += "⚠️ Error: ID de promoción requerido. "; return; }
            try {
              await fetch(`/api/restaurant/${storeId}/promotions/${id}`, { method: "DELETE" });
              result += `🗑️ Promoción eliminada. `;
            } catch { result += `⚠️ Error al eliminar promoción. `; }
          })());
          break;
        case "addRestaurantOrder":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            if (!action.type || !action.items?.length) { result += "⚠️ Faltan campos requeridos: type, items. "; return; }
            try {
              const total = action.items.reduce((sum: number, it: any) => sum + (it.price * it.quantity), 0);
              const res = await fetch(`/api/restaurant/${storeId}/orders`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: action.type, tableNumber: action.tableNumber ? Number(action.tableNumber) : undefined,
                  items: action.items, total: action.total || total, notes: action.notes || "", couponCode: action.couponCode || undefined,
                }),
              });
              const data = await res.json();
              if (data.order || data._id) result += `✅ Pedido de restaurante creado (total: $${action.total || total}). `;
              else result += `⚠️ Error al crear pedido. `;
            } catch { result += `⚠️ Error al crear pedido. `; }
          })());
          break;
        case "updateRestaurantOrder":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            const id = action.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            if (!id) { result += "⚠️ Error: ID de pedido requerido. "; return; }
            try {
              await fetch(`/api/restaurant/${storeId}/orders/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: action.status }),
              });
              result += `✅ Estado del pedido actualizado a "${action.status}". `;
            } catch { result += `⚠️ Error al actualizar pedido. `; }
          })());
          break;
        case "addLoyaltyPoints":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            if (!action.memberId || !action.points || !action.type) { result += "⚠️ Faltan campos requeridos: memberId, points, type. "; return; }
            try {
              await fetch(`/api/restaurant/${storeId}/loyalty/transactions`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  memberId: action.memberId, points: Number(action.points), type: action.type, description: action.description || "",
                }),
              });
              result += `✅ ${action.points} puntos de lealtad registrados (${action.type}). `;
            } catch { result += `⚠️ Error al registrar puntos. `; }
          })());
          break;
        case "updateLoyaltySettings":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            try {
              const body: any = {};
              if (action.pointsPerDollar) body.pointsPerDollar = Number(action.pointsPerDollar);
              if (action.rewardsThreshold) body.rewardsThreshold = Number(action.rewardsThreshold);
              await fetch(`/api/restaurant/${storeId}/loyalty`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
              });
              result += `✅ Configuración de lealtad actualizada. `;
            } catch { result += `⚠️ Error al actualizar configuración de lealtad. `; }
          })());
          break;
        case "updateWaiterCall":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            const id = action.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            if (!id || !action.status) { result += "⚠️ Faltan campos requeridos: id, status. "; return; }
            try {
              await fetch(`/api/restaurant/${storeId}/waiter-calls/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: action.status }),
              });
              result += `✅ Llamada de mesero actualizada a "${action.status}". `;
            } catch { result += `⚠️ Error al actualizar llamada de mesero. `; }
          })());
          break;
        case "addBarber":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            if (!action.name || !action.phone) { result += "⚠️ Faltan campos requeridos: name, phone. "; return; }
            try {
              const schedule: any = {};
              const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
              days.forEach(d => { schedule[d] = { start: "09:00", end: "18:00", enabled: d !== "sunday" }; });
              const res = await fetch(`/api/barbershop/${storeId}/barbers`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: action.name, phone: action.phone, email: action.email || "",
                  photoUrl: action.photoUrl || "", specialties: action.specialties || [],
                  bio: action.bio || "", schedule: action.schedule || schedule, active: true,
                }),
              });
              const data = await res.json();
              if (data.barber || data._id) result += `✅ Barbero "${action.name}" registrado. `;
              else result += `⚠️ Error al registrar barbero. `;
            } catch { result += `⚠️ Error al registrar barbero. `; }
          })());
          break;
        case "updateBarber":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            const id = action.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            if (!id) { result += "⚠️ Error: ID de barbero requerido. "; return; }
            try {
              const body: any = {};
              if (action.name) body.name = action.name;
              if (action.phone) body.phone = action.phone;
              if (action.email) body.email = action.email;
              if (action.photoUrl) body.photoUrl = action.photoUrl;
              if (action.specialties) body.specialties = action.specialties;
              if (action.bio) body.bio = action.bio;
              if (action.schedule) body.schedule = action.schedule;
              if (action.active !== undefined) body.active = action.active;
              await fetch(`/api/barbershop/${storeId}/barbers/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
              });
              result += `✅ Barbero actualizado. `;
            } catch { result += `⚠️ Error al actualizar barbero. `; }
          })());
          break;
        case "deleteBarber":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            const id = action.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            if (!id) { result += "⚠️ Error: ID de barbero requerido. "; return; }
            try {
              await fetch(`/api/barbershop/${storeId}/barbers/${id}`, { method: "DELETE" });
              result += `🗑️ Barbero eliminado. `;
            } catch { result += `⚠️ Error al eliminar barbero. `; }
          })());
          break;
        case "addToQueue":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            if (!action.customerName || !action.serviceRequested) { result += "⚠️ Faltan campos requeridos: customerName, serviceRequested. "; return; }
            try {
              const res = await fetch(`/api/barbershop/${storeId}/queue`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  customerName: action.customerName, phone: action.phone || "",
                  serviceRequested: action.serviceRequested, preferredBarber: action.preferredBarber || undefined, notes: action.notes || "",
                }),
              });
              const data = await res.json();
              if (data.entry || data._id) result += `✅ ${action.customerName} añadido a la cola. `;
              else result += `⚠️ Error al añadir a la cola. `;
            } catch { result += `⚠️ Error al añadir a la cola. `; }
          })());
          break;
        case "updateQueueEntry":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            const id = action.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            if (!id || !action.status) { result += "⚠️ Faltan campos requeridos: id, status. "; return; }
            try {
              await fetch(`/api/barbershop/${storeId}/queue/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: action.status }),
              });
              result += `✅ Estado de cola actualizado a "${action.status}". `;
            } catch { result += `⚠️ Error al actualizar cola. `; }
          })());
          break;
        case "addBarberHistoryEntry":
          asyncOps.push((async () => {
            const storeId = (store as any)?._id || (store as any)?.id;
            if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; return; }
            if (!action.barberName || !action.customerName || !action.service) { result += "⚠️ Faltan campos requeridos: barberName, customerName, service. "; return; }
            try {
              const res = await fetch(`/api/barbershop/${storeId}/history`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  barberId: action.barberId || "", barberName: action.barberName,
                  customerName: action.customerName, phone: action.phone || "",
                  service: action.service, price: Number(action.price) || 0,
                  duration: Number(action.duration) || 30, rating: Number(action.rating) || 5,
                  notes: action.notes || "", date: action.date || new Date().toISOString(),
                }),
              });
              const data = await res.json();
              if (data.entry || data._id) result += `✅ Historial registrado para ${action.customerName}. `;
              else result += `⚠️ Error al registrar historial. `;
            } catch { result += `⚠️ Error al registrar historial. `; }
          })());
          break;
        case "changeLanguage": {
          const lang = action.language || action.lang;
          const validLangs = ["es", "en", "fr", "zh", "hi", "ko", "ja", "it", "pt", "ru"];
          if (!lang || !validLangs.includes(lang)) {
            result += `⚠️ Idioma no válido. Idiomas disponibles: ${validLangs.join(", ")}. `;
            break;
          }
          const storeId = (store as any)?._id || (store as any)?.id;
          if (!storeId) { result += "⚠️ Error: ID de empresa no disponible. "; break; }
          asyncOps.push((async () => {
            try {
              const currentConfig = (store as any)?.agentConfig || {};
              const _ok = await Promise.resolve(onSaveStore?.(storeId, { agentConfig: { ...currentConfig, lang } }));
              if (_ok !== false) result += `✅ Idioma del chat widget cambiado a ${lang}. `;
              else result += `⚠️ Error al cambiar idioma. `;
            } catch { result += `⚠️ Error al cambiar idioma. `; }
          })());
          break;
        }
      }
    }
    await Promise.all(asyncOps);
    setProducts(newProducts);
    setCustomers(newCustomers);
    setOrders(newOrders);
    setServices(newServices);
    setCampaigns(newCampaigns);
    setKbEntries(newKbEntries);
    setAutomations(newAutomations);
    setAppointments(newAppointments);
    if (asyncOps.length > 0) {
      window.dispatchEvent(new CustomEvent("appointments-changed", { detail: { storeId: (store as any)?._id } }));
    }
    return { result, newProducts, newCustomers, newOrders, newServices, newCampaigns, newKbEntries, newAutomations };
  };

  const handleSend = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim() || isLoading || !canSend) return;
    const userMsg = { role: "user", content: msg, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    try {
      const ac = (store as any)?.agentConfig || {};
      const contextInfo = getContextInfo(input);
      const MODULE_EXAMPLES: Record<string, string> = {
        products: `  {"type":"addProduct","name":"Nombre","price":100,"stock":5,"desc":"Descripción","barcode":"123"},
  {"type":"deleteProduct","id":123},
  {"type":"updateProduct","id":123,"data":{"name":"Nuevo","price":200,"stock":10}}`,
        customers: `  {"type":"addCustomer","name":"Juan","email":"j@e.com","phone":"123"},
  {"type":"updateCustomer","id":1,"data":{"email":"nuevo@email.com","phone":"987654321"}},
  {"type":"deleteCustomer","id":456}`,
        orders: `  {"type":"addOrder","product":"Producto","amount":100,"status":"Pagado"},
  {"type":"deleteOrder","id":789},
  {"type":"updateOrder","id":789,"data":{"status":"Enviado","amount":150}}`,
        services: `  {"type":"addService","name":"Consulta legal","price":500,"desc":"Asesoría de 1 hora","duration":60},
  {"type":"updateService","id":1,"data":{"price":600,"desc":"Nueva descripción"}},
  {"type":"deleteService","id":1}`,
        knowledgebase: `  {"type":"addKbEntry","title":"Política de devoluciones","content":"Texto completo...","category":"politicas","question":"¿Cuál es la política?"},
  {"type":"deleteKbEntry","id":1},
  {"type":"updateKbEntry","id":1,"data":{"title":"Nuevo título","content":"Nuevo contenido","category":"faq"}}`,
        automations: `  {"type":"addAutomation","name":"Notificar nuevo producto","trigger":"new_product","actionType":"send_notification","actionConfig":{"message":"¡Nuevo producto creado!"}},
  {"type":"updateAutomation","id":1,"data":{"name":"Nuevo nombre","enabled":false}},
  {"type":"deleteAutomation","id":1}`,
        campaigns: `  {"type":"addCampaign","name":"Campaña de bienvenida","type":"email","subject":"Bienvenido","body":"Hola {{name}}, gracias por tu compra","audience":"todos"},
  {"type":"updateCampaign","id":1,"data":{"status":"sending"}},
  {"type":"deleteCampaign","id":1}`,
        appointments: `  {"type":"addAppointment","customerName":"Juan","customerEmail":"j@e.com","customerPhone":"123","serviceName":"Consulta","servicePrice":50,"date":"2026-06-17","time":"15:00","duration":60,"notes":"Nota opcional"},
  {"type":"updateAppointment","id":"ID_DE_CITA","data":{"date":"2026-06-18","time":"16:00","status":"confirmed"}},
  {"type":"cancelAppointment","id":"ID_DE_CITA"}`,
        clients: `  {"type":"addClient","name":"María García","email":"maria@email.com","phone":"555-1234"},
  {"type":"updateClient","id":1,"data":{"email":"nuevo@email.com"}},
  {"type":"deleteClient","id":1}`,
        case_files: `  {"type":"addCaseFile","title":"Caso González vs Pérez","clientName":"Carlos González","type":"civil","status":"activo"},
  {"type":"updateCaseFile","id":1,"data":{"status":"cerrado"}},
  {"type":"deleteCaseFile","id":1}`,
        hearings: `  {"type":"addHearing","caseNumber":"Audiencia preliminar","date":"2026-07-15","time":"10:00","hearingType":"virtual","court":"Juzgado 1","judge":"Juez Pérez","duration":60},
  {"type":"updateHearing","id":1,"data":{"date":"2026-07-16"}},
  {"type":"deleteHearing","id":1}`,
        documents: `  {"type":"addDocument","name":"Contrato","type":"contrato","desc":"Contrato de arrendamiento","fileUrl":"https://..."},
  {"type":"updateDocument","id":1,"data":{"name":"Nuevo título"}},
  {"type":"deleteDocument","id":1}`,
        medical_records: `  {"type":"addMedicalRecord","patientName":"Ana López","date":"2026-07-10","diagnosis":"Hipertensión","doctor":"Dra. Martínez","visitType":"general","symptoms":"Dolor de cabeza","treatment":"Medicación"},
  {"type":"updateMedicalRecord","id":1,"data":{"diagnosis":"Actualizado"}},
  {"type":"deleteMedicalRecord","id":1}`,
        prescriptions: `  {"type":"addPrescription","patientName":"Ana López","medication":"Enalapril","dosage":"10mg","frequency":"1 vez al día","prescribedBy":"Dra. Martínez"},
  {"type":"updatePrescription","id":1,"data":{"dosage":"20mg"}},
  {"type":"deletePrescription","id":1}`,
        doctors: `  {"type":"addDoctor","name":"Dra. María","specialty":"Cardiología","phone":"555-9876","email":"maria@clinica.com","licenseNumber":"12345"},
  {"type":"updateDoctor","id":1,"data":{"consultationFee":1800}},
  {"type":"deleteDoctor","id":1}`,
        inventory: `  {"type":"addInventoryItem","name":"Laptop HP","quantity":10,"price":25000,"category":"Electrónicos","sku":"LPT-001","minStock":2},
  {"type":"updateInventoryItem","id":1,"data":{"quantity":8}},
  {"type":"deleteInventoryItem","id":1}`,
        gallery: `  {"type":"addGalleryItem","title":"Oficina","imageUrl":"https://...","desc":"Vista principal","category":"instalaciones","featured":true},
  {"type":"updateGalleryItem","id":1,"data":{"featured":false}},
  {"type":"deleteGalleryItem","id":1}`,
        testimonials: `  {"type":"addTestimonial","clientName":"Carlos","text":"Excelente servicio","rating":5,"company":"Tech Corp","approved":true},
  {"type":"updateTestimonial","id":1,"data":{"rating":4}},
  {"type":"deleteTestimonial","id":1}`,
        classes: `  {"type":"addClass","name":"Matemáticas","course":"Matemáticas","teacher":"Prof. García","schedule":"Lun-Mie 10:00","capacity":30,"price":500},
  {"type":"updateClass","id":1,"data":{"capacity":35}},
  {"type":"deleteClass","id":1}`,
        courses: `  {"type":"addCourse","name":"Programación Web","desc":"Curso completo","price":2000,"durationWeeks":12,"instructor":"Prof. López","level":"intermedio"},
  {"type":"updateCourse","id":1,"data":{"price":2200}},
  {"type":"deleteCourse","id":1}`,
        students: `  {"type":"addStudent","name":"Ana Pérez","email":"ana@email.com","phone":"555-1111","grade":"9°","parentName":"María Pérez"},
  {"type":"updateStudent","id":1,"data":{"grade":"10°"}},
  {"type":"deleteStudent","id":1}`,
        grades: `  {"type":"addGrade","studentName":"Ana Pérez","course":"Programación","score":95,"period":"2026-1","subject":"HTML","letterGrade":"A"},
  {"type":"updateGrade","id":1,"data":{"score":98}},
  {"type":"deleteGrade","id":1}`,
        menu: `  {"type":"addMenuItem","name":"Hamburguesa","desc":"Carne 200g","price":150,"category":"hamburguesas","ingredients":"Carne, queso","calories":650,"featured":true},
  {"type":"updateMenuItem","id":1,"data":{"price":160}},
  {"type":"deleteMenuItem","id":1}`,
        recipes: `  {"type":"addRecipe","name":"Pasta Alfredo","ingredients":"Pasta, crema","instructions":"Cocer pasta...","prepTime":10,"cookTime":20,"difficulty":"fácil","servings":4},
  {"type":"updateRecipe","id":1,"data":{"difficulty":"media"}},
  {"type":"deleteRecipe","id":1}`,
        restaurant: `  {"type":"addReservation","customerName":"Juan","phone":"555-1234","email":"j@e.com","date":"2026-07-20","time":"19:00","partySize":4,"notes":"Mesa junto a ventana"},
  {"type":"updateReservation","id":"RES_ID","data":{"status":"confirmed"}},
  {"type":"cancelReservation","id":"RES_ID"},
  {"type":"replyToReview","reviewId":1,"reply":"¡Gracias por tu reseña!"},
  {"type":"addPromotion","code":"VERANO20","type":"percentage","value":20,"description":"20% en verano","validFrom":"2026-07-01","validUntil":"2026-08-31"},
  {"type":"updatePromotion","id":1,"data":{"active":false}},
  {"type":"deletePromotion","id":1},
  {"type":"addRestaurantOrder","type":"dine_in","tableNumber":5,"items":[{"name":"Hamburguesa","quantity":2,"price":150}],"total":300},
  {"type":"updateRestaurantOrder","id":"ORD_ID","data":{"status":"delivered"}},
  {"type":"addLoyaltyPoints","memberId":"M1","points":100,"type":"earned","description":"Compra en restaurante"},
  {"type":"updateLoyaltySettings","pointsPerDollar":2,"rewardsThreshold":500},
  {"type":"updateWaiterCall","id":"CALL_ID","status":"resolved"}`,
        barbers: `  {"type":"addBarber","name":"Carlos","phone":"555-1234","email":"carlos@barber.com","specialties":["fade","barba"],"bio":"10 años de experiencia"},
  {"type":"updateBarber","id":1,"data":{"specialties":["fade","barba","diseño"]}},
  {"type":"deleteBarber","id":1}`,
        queue: `  {"type":"addToQueue","customerName":"Pedro","phone":"555-5678","serviceRequested":"Corte de cabello","notes":"Quiere fade alto"},
  {"type":"updateQueueEntry","id":"Q_ID","data":{"status":"in_progress"}},
  {"type":"addBarberHistoryEntry","barberName":"Carlos","customerName":"Pedro","service":"Corte de cabello","price":150,"duration":30,"rating":5,"date":"2026-07-15"}`,
      };

      const MODULE_DESCRIPTIONS: Record<string, string> = {
        products: "- Puedes gestionar productos: crear (addProduct), modificar (updateProduct) y eliminar (deleteProduct).",
        customers: "- Puedes gestionar clientes: crear (addCustomer), modificar (updateCustomer) y eliminar (deleteCustomer).",
        orders: "- Puedes gestionar pedidos: crear (addOrder), modificar (updateOrder) y eliminar (deleteOrder).",
        services: "- Puedes gestionar servicios: crear (addService), modificar (updateService) y eliminar (deleteService).",
        knowledgebase: "- Puedes gestionar la base de conocimiento: crear (addKbEntry), modificar (updateKbEntry) y eliminar (deleteKbEntry).",
        automations: "- Puedes crear automatizaciones (addAutomation) con triggers: new_order, new_customer, new_product, low_stock, payment_received y actionTypes: send_notification, send_email, webhook, send_telegram, send_discord, send_slack, post_to_social, ai_generate. También editarlas y eliminarlas.\n- También puedes crear Workflows (addWorkflow) con triggers avanzados: new_customer, new_order, new_appointment, payment_received, payment_failed, low_stock, customer_birthday, customer_inactive, webhook_received. Cada workflow tiene pasos con condiciones y acciones. También editarlos (updateWorkflow) y eliminarlos (deleteWorkflow).",
        campaigns: "- Puedes crear campañas de marketing (addCampaign) de tipo email o sms. También editarlas (updateCampaign) y eliminarlas (deleteCampaign).",
        appointments: "- Puedes gestionar citas/agenda: crear (addAppointment), modificar (updateAppointment) y cancelar (cancelAppointment). Usa fechas implícitas.",
        clients: "- Puedes gestionar clientes legales: crear (addClient), modificar (updateClient) y eliminar (deleteClient).",
        case_files: "- Puedes gestionar expedientes: crear (addCaseFile), modificar (updateCaseFile) y eliminar (deleteCaseFile).",
        hearings: "- Puedes gestionar audiencias: crear (addHearing), modificar (updateHearing) y eliminar (deleteHearing).",
        documents: "- Puedes gestionar documentos: crear (addDocument), modificar (updateDocument) y eliminar (deleteDocument).",
        medical_records: "- Puedes gestionar historiales médicos: crear (addMedicalRecord), modificar (updateMedicalRecord) y eliminar (deleteMedicalRecord).",
        prescriptions: "- Puedes gestionar recetas médicas: crear (addPrescription), modificar (updatePrescription) y eliminar (deletePrescription).",
        doctors: "- Puedes gestionar doctores: crear (addDoctor), modificar (updateDoctor) y eliminar (deleteDoctor).",
        inventory: "- Puedes gestionar inventario: crear (addInventoryItem), modificar (updateInventoryItem) y eliminar (deleteInventoryItem).",
        gallery: "- Puedes gestionar la galería: crear (addGalleryItem), modificar (updateGalleryItem) y eliminar (deleteGalleryItem).",
        testimonials: "- Puedes gestionar testimonios: crear (addTestimonial), modificar (updateTestimonial) y eliminar (deleteTestimonial).",
        classes: "- Puedes gestionar clases: crear (addClass), modificar (updateClass) y eliminar (deleteClass).",
        courses: "- Puedes gestionar cursos: crear (addCourse), modificar (updateCourse) y eliminar (deleteCourse).",
        students: "- Puedes gestionar estudiantes: crear (addStudent), modificar (updateStudent) y eliminar (deleteStudent).",
        grades: "- Puedes gestionar calificaciones: crear (addGrade), modificar (updateGrade) y eliminar (deleteGrade).",
        menu: "- Puedes gestionar el menú: crear (addMenuItem), modificar (updateMenuItem) y eliminar (deleteMenuItem).",
        recipes: "- Puedes gestionar recetas: crear (addRecipe), modificar (updateRecipe) y eliminar (deleteRecipe).",
        restaurant: "- Puedes gestionar reservaciones (addReservation/updateReservation/cancelReservation), responder reseñas (replyToReview), promociones (addPromotion/updatePromotion/deletePromotion), pedidos de restaurante (addRestaurantOrder/updateRestaurantOrder), puntos de lealtad (addLoyaltyPoints/updateLoyaltySettings), llamadas de mesero (updateWaiterCall).",
        barbers: "- Puedes gestionar barberos (addBarber/updateBarber/deleteBarber), cola de barbershop (addToQueue/updateQueueEntry) e historial de barbero (addBarberHistoryEntry).",
      };

      const activeExamples = Object.entries(MODULE_EXAMPLES)
        .filter(([mod]) => GENERIC_MODULES.has(mod) || categoryModules.has(mod as any))
        .map(([, ex]) => ex)
        .join(",\n");

      const activeDescriptions = Object.entries(MODULE_DESCRIPTIONS)
        .filter(([mod]) => GENERIC_MODULES.has(mod) || categoryModules.has(mod as any))
        .map(([, desc]) => desc)
        .join("\n");

      const catPrompt = (CATEGORIES[storeCategory as CategoryId] || CATEGORIES.general).systemPrompt;

      const defaultSystem = `${catPrompt} Ayudas al usuario a administrar su negocio "${agentName}" dentro de Jandosoft.

${contextInfo}

IMPORTANTE - SOLO PUEDES VER Y MODIFICAR los datos del negocio actual (${agentName}). NO tienes acceso a datos de otros usuarios ni empresas.

Puedes MODIFICAR los datos del negocio actual. Para ello, incluye al final de tu respuesta un bloque JSON con las acciones a ejecutar:

\`\`\`json
{"actions":[
${activeExamples}
]}
\`\`\`

REGLAS:
- **CREAR = ACCIÓN INMEDIATA**: Cuando el usuario te pida CREAR algo, genera el bloque JSON INMEDIATAMENTE. NO pidas confirmación.
- **ELIMINAR = CONFIRMACIÓN PREVIA**: Siempre confirma ANTES de eliminar algo.
- **MODIFICAR = ACCIÓN INMEDIATA**: Si el usuario pide modificar datos, genera el JSON y explícale qué cambiaste.
- Para fechas y horas: si el usuario no especifica, usa fecha de hoy o mañana según contexto.
- Precios y montos en dólares.
- No inventes datos que no existan en el contexto.
- Responde en español profesional y amigable, CONCISO.
- Puedes enviar correos electrónicos (sendEmail) con los campos to, subject y content.
- Puedes enviar mensajes (sendMessage) con los campos to y content.
- Puedes añadir contactos (addContact) con el campo email.
- Puedes cambiar el idioma del chat widget (changeLanguage) con el campo language. Idiomas válidos: es, en, fr, zh, hi, ko, ja, it, pt, ru.
- Puedes cambiar el idioma del chat widget (changeLanguage) con el campo language. Idiomas válidos: es, en, fr, zh, hi, ko, ja, it, pt, ru.
${activeDescriptions}
- IMPORTANTE: SIEMPRE que el usuario te pida crear, modificar, eliminar o enviar algo, DEBES incluir el bloque JSON con las acciones correspondientes. No te limites a decir "lo haré" sin generar el JSON.

LÍMITES ÉTICOS:
- NO compartas información personal de los clientes a menos que el usuario sea el dueño.
- NO des consejos financieros, contables, legales ni médicos.
- NO generes contenido ofensivo o inapropiado.
- NO inventes datos que no existan en el contexto.`;

      const systemContent = ac.systemPrompt
        ? `${ac.systemPrompt}\n\n${contextInfo}\n\nIMPORTANTE - Puedes MODIFICAR los datos del negocio actual. Para ello, incluye al final de tu respuesta un bloque JSON con las acciones a ejecutar, usando el formato estandar de Jandosoft.\n\nREGLAS:\n- **CREAR = ACCIÓN INMEDIATA**: Cuando el usuario te pida CREAR algo, genera el bloque JSON INMEDIATAMENTE. NO pidas confirmación, NO preguntes detalles que ya puedes inferir. Simplemente créalo y confirma después.\n- **ELIMINAR = CONFIRMACIÓN PREVIA**: Siempre confirma ANTES de eliminar algo. Si pide eliminar TODOS los elementos, lista lo que vas a eliminar y pide confirmación explícita.\n- **MODIFICAR = ACCIÓN INMEDIATA**: Si el usuario pide modificar datos, genera el JSON y explícale qué cambiaste.\n- Para fechas y horas: si el usuario no especifica, usa fecha de hoy o mañana según contexto. Si no especifica hora, usa 9:00 AM o 10:00 AM.\n- Precios y montos en dólares.\n- No inventes datos que no existan en el contexto.\n- Responde en español profesional y amigable, CONCISO.\n- Puedes enviar correos electrónicos (sendEmail) con los campos to, subject y content.\n- Puedes enviar mensajes (sendMessage) con los campos to y content.\n- Puedes añadir contactos (addContact) con el campo email.\n${activeDescriptions}\n- IMPORTANTE: SIEMPRE que el usuario te pida crear, modificar, eliminar o enviar algo, DEBES incluir el bloque JSON con las acciones correspondientes. No te limites a decir "lo haré" sin generar el JSON.\n\nLÍMITES ÉTICOS:\n- NO compartas información personal de los clientes a menos que el usuario sea el dueño.\n- NO des consejos financieros, contables, legales ni médicos.\n- NO generes contenido ofensivo o inapropiado.\n- NO inventes datos que no existan en el contexto.`
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
          storeId: store?._id || store?.id || "",
        })
      });
      const data = await response.json();
      let botContent = data.text || "No pude generar una respuesta. Intenta reformular tu pregunta.";
      if (data.error) botContent = data.error;
      if (data.provider) setLastProvider(data.provider);

      if (data.limitReached && data.plans && data.plans.length > 0) {
        const plansMsg = "\n\n---\n**Upgrada tu plan para continuar:**\n\n" +
          data.plans.map((p: any) => `• **${p.name}** — $${p.price}/mes — ${p.desc}`).join("\n") +
          "\n\n[Ver planes y upgradear](/dashboard?tab=plans)";
        botContent += plansMsg;
      }

      const jsonMatch = botContent.match(/```json\n?([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1].trim());
          if (parsed.actions && Array.isArray(parsed.actions) && parsed.actions.length > 0) {
            const actionTypes = parsed.actions.map((a: any) => a.type).join(", ");
            setMessages(prev => [...prev, { role: "action", content: `⚡ Ejecutando: ${actionTypes}...`, timestamp: Date.now() }]);
            const { result: actionResult, newProducts, newCustomers, newOrders, newServices, newCampaigns, newKbEntries, newAutomations } = await executeActions(parsed.actions);
            setMessages(prev => prev.filter(m => !(m.role === "action" && m.content?.startsWith("⚡ Ejecutando"))));
            botContent = botContent.replace(jsonMatch[0], "").trim();
            if (actionResult) {
              botContent += `\n\n—\n*${actionResult}*`;
            }
            onPersist?.(newProducts, newCustomers, newOrders, newKbEntries, newAutomations, newCampaigns, undefined, newServices);
          }
        } catch (e) {
          // JSON parse failed — show response as-is
        }
      }

      setMessages(prev => [...prev, { role: "bot", content: botContent || "Completado.", timestamp: Date.now() }]);
    } catch {
      setMessages(prev => [...prev, { role: "bot", content: "No pude conectarme al servidor. Verifica tu conexión a internet e intenta de nuevo.", timestamp: Date.now() }]);
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
        {lastProvider && (
          <span className={cn("text-[9px] md:text-[10px] font-black italic px-2 md:px-3 py-1 rounded-full shrink-0", lastProvider === "platform" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600")}>
            {lastProvider === "platform" ? "🌐 Platform" : `🤖 ${lastProvider}`}
          </span>
        )}
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 md:space-y-4 mb-4 md:mb-6 pr-1 md:pr-2">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex items-start gap-1.5 md:gap-3", m.role === "user" ? "flex-row-reverse" : "")}>
            <div className={cn("w-7 h-7 max-[340px]:w-6 max-[340px]:h-6 md:w-8 md:h-8 rounded-xl flex items-center justify-center shrink-0", m.role === "user" ? "bg-zinc-200" : m.role === "action" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600")}>
              {m.role === "user" ? <User className="w-3.5 h-3.5 max-[340px]:w-3 max-[340px]:h-3 md:w-4 md:h-4" /> : m.role === "action" ? <Loader2 className="w-3.5 h-3.5 max-[340px]:w-3 max-[340px]:h-3 md:w-4 md:h-4 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 max-[340px]:w-3 max-[340px]:h-3 md:w-4 md:h-4" />}
            </div>
            <div className={cn("p-3 md:p-4 rounded-2xl max-w-[85%] md:max-w-[75%] text-xs md:text-sm font-medium leading-relaxed max-[340px]:px-2.5 max-[340px]:py-2 overflow-wrap-anywhere", m.role === "user" ? "bg-zinc-950 text-white rounded-tr-none" : m.role === "action" ? "bg-amber-50 text-amber-700 rounded-tl-none border border-amber-200" : "bg-zinc-50 text-zinc-700 rounded-tl-none border border-zinc-100")}>
              {m.role === "user" ? m.content : m.role === "action" ? <span className="inline-flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" />{m.content}</span> : <MarkdownRenderer content={m.content} />}
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
            onClick={clearChat}
            className="w-8 h-8 max-[340px]:w-7 max-[340px]:h-7 rounded-xl flex items-center justify-center text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all shrink-0"
            title="Limpiar chat"
          >
            <Trash2 className="w-3.5 h-3.5 max-[340px]:w-3 max-[340px]:h-3 md:w-4 md:h-4" />
          </motion.button>
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
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleSend()} disabled={isLoading || !input.trim()} className="w-8 h-8 max-[340px]:w-7 max-[340px]:h-7 bg-red-600 text-white rounded-xl flex items-center justify-center hover:bg-red-700 transition-all disabled:opacity-50 shrink-0">
            <Send className="w-3.5 h-3.5 max-[340px]:w-3 max-[340px]:h-3 md:w-4 md:h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
