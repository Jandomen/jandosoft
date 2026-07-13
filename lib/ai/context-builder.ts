import type { Domain } from "@/lib/ai/tools";
import { AI_CONFIG } from "@/lib/ai/config";

export interface StoreContext {
  name: string;
  industry?: string;
  type?: string;
  slug?: string;
  paymentsEnabled: boolean;
  ownerEmail?: string;
  organizationId?: string;
}

export interface SubscriptionInfo {
  plan: string;
  status?: string;
  expiry?: string;
  maxProducts?: number;
  maxStores?: number;
}

export interface ContextRequest {
  message: string;
  history: { role: string; content: string }[];
  domain: Domain;
  secondaryDomains: Domain[];
  isDomainSpecific: boolean;
  domains?: Domain[];
}

export interface BuiltContext {
  systemPrompt: string;
  sections: string[];
  warnings: string[];
  relevantData: {
    products?: any[];
    customers?: any[];
    orders?: any[];
    services?: any[];
    appointments?: any[];
    knowledgebase?: any[];
    automations?: any[];
    campaigns?: any[];
    smartForms?: any[];
  };
}

function buildDateString(): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${dateStr}. HORA: ${timeStr}`;
}

function buildLimitWarnings(
  productsCount: number,
  maxProducts: number,
  sub: SubscriptionInfo | null
): string[] {
  const warnings: string[] = [];
  if (productsCount >= maxProducts) {
    warnings.push("⚠️ LÍMITE ALCANZADO: Has alcanzado el máximo de productos para tu plan.");
  } else if (productsCount >= maxProducts * 0.8) {
    warnings.push("⚠️ ADVERTENCIA: Estás usando más del 80% de tu límite de productos.");
  }
  if (sub?.expiry && new Date(sub.expiry) < new Date()) {
    warnings.push("⚠️ TU SUSCRIPCIÓN ESTÁ VENCIDA. Renueva para seguir usando funciones premium.");
  }
  return warnings;
}

function roleForStore(storeContext: StoreContext | null, isGeneric: boolean): string {
  if (isGeneric) {
    return "Eres el asistente oficial de Jandosoft, una plataforma para crear y gestionar empresas en línea.";
  }
  if (storeContext) {
    return `Eres el asistente oficial de ${storeContext.name}, un negocio en la plataforma Jandosoft.`;
  }
  return "Eres el asistente oficial de Jandosoft, una plataforma para crear y gestionar empresas en línea.";
}

const DOMAIN_INSTRUCTIONS: Record<Domain, string> = {
  general: "",
  crm: `👥 CLIENTES: create_customer, update_customer, list_customers. EQUIPO: invite_team_member, remove_team_member, change_team_member_role, list_team_members.`,
  booking: `📅 CITAS: create_appointment (solo nombre, fecha y hora), update_appointment, cancel_appointment, list_appointments. Interpreta fechas implícitas.`,
  products: `📦 PRODUCTOS: create_product, delete_product. SERVICIOS: create_service, update_service, delete_service, list_services. ÓRDENES: create_order, update_order_status, list_orders.`,
  payments: `💳 PAGOS: create_checkout (Stripe), list_payments. SUSCRIPCIONES: check_my_subscription, create_subscription_checkout, cancel_subscription. FACTURAS: create_invoice, list_invoices, update_invoice_status, delete_invoice, send_invoice_email.`,
  email: `📧 EMAIL: send_email con content o template.`,
  analytics: `📊 ANALÍTICAS: get_analytics (días opcional) → visitas totales, visitantes únicos, desglose diario, páginas populares.`,
  marketing: `📢 MARKETING: create_campaign, update_campaign, delete_campaign, list_campaigns, send_campaign. AUTOMATIZACIONES: create_automation, update_automation, delete_automation, list_automations, toggle_automation. KB: create_kb_entry, update_kb_entry, delete_kb_entry, list_kb_entries. FORMULARIOS: create_smart_form, update_smart_form, delete_smart_form, list_smart_forms, list_form_submissions. TAREAS: schedule_task.`,
  admin: `⚙️ ADMIN: create_store, delete_store, update_store. INTEGRACIONES: configure_integration, toggle_integration, delete_integration, test_integration, list_integrations. WIDGET: get_widget_embed. TAREAS: list_scheduled_tasks, delete_scheduled_task. AGENTE: get_agent_config, update_agent_config.`,
};

function truncateList<T>(items: T[], label: string, format: (item: T) => string): string[] {
  const max = AI_CONFIG.maxListItems;
  const lines: string[] = [];
  const shown = items.slice(0, max);
  for (const item of shown) {
    lines.push(format(item));
  }
  if (items.length > max) {
    lines.push(`  ... y ${items.length - max} más.`);
  }
  return lines;
}

export function buildContext(ctxReq: ContextRequest, store: any): BuiltContext {
  const dateStr = buildDateString();
  const domainLabel: Record<Domain, string> = {
    general: "General",
    crm: "CRM / Clientes",
    booking: "Citas / Reservaciones",
    products: "Productos / Servicios",
    payments: "Pagos / Facturación",
    email: "Correo Electrónico",
    analytics: "Analíticas",
    marketing: "Marketing / Automatizaciones",
    admin: "Administración / Integraciones",
  };

  const effectiveDomains = ctxReq.domains ?? [];
  function hasDomain(d: Domain): boolean {
    return !ctxReq.isDomainSpecific || effectiveDomains.includes(d);
  }

  const storeContext: StoreContext | null = store?.name
    ? {
        name: store.name,
        industry: store.industry,
        type: store.type,
        slug: store.slug,
        paymentsEnabled: !!(store.paymentIntegrations?.length > 0),
        ownerEmail: store.ownerEmail,
        organizationId: store.organizationId,
      }
    : null;

  const sub: SubscriptionInfo | null = store?._subscription || null;
  const effectiveMaxProducts = sub?.maxProducts ?? Infinity;
  const productsCount = store?.products?.length || 0;

  const warnings = buildLimitWarnings(productsCount, effectiveMaxProducts, sub);

  const sections: string[] = [];
  sections.push(
    `Nombre: ${store.name || "N/A"} | Tipo: ${store.type || "N/A"} | Industria: ${store.industry || "N/A"}`
  );
  sections.push(`Pagos: ${storeContext?.paymentsEnabled ? "Activos" : "No configurados"}`);
  sections.push(`SUSCRIPCIÓN: ${(sub?.plan || "free").toUpperCase()}`);
  sections.push(
    `Productos: ${productsCount} / ${effectiveMaxProducts}${productsCount >= effectiveMaxProducts ? " (COMPLETO)" : productsCount >= effectiveMaxProducts * 0.8 ? " (cerca del límite)" : ""}`
  );
  if (sub?.expiry) sections.push(`Vencimiento: ${new Date(sub.expiry).toLocaleDateString()}`);
  sections.push(...warnings);

  const relevantData: BuiltContext["relevantData"] = {};

  if (hasDomain("products")) {
    if (store?.products?.length) {
      sections.push(``, `PRODUCTOS (${store.products.length}):`);
      sections.push(...truncateList(store.products, "PRODUCTOS", (p: any) => `  - ${p.name} | $${p.price} | Stock: ${p.stock}`));
      relevantData.products = store.products;
    }
    if (store?.orders?.length) {
      sections.push(``, `ÓRDENES (${store.orders.length}):`);
      sections.push(...truncateList(store.orders, "ÓRDENES", (o: any) => `  - ${o.product} | $${o.amount} | ${o.status}`));
      relevantData.orders = store.orders;
    }
    if (store?.services?.length) {
      sections.push(``, `SERVICIOS (${store.services.length}):`);
      sections.push(...truncateList(store.services, "SERVICIOS", (s: any) => `  - ${s.name} | $${s.price} | ${s.desc}`));
      relevantData.services = store.services;
    }
  }

  if (hasDomain("crm")) {
    if (store?.customers?.length) {
      sections.push(``, `CLIENTES (${store.customers.length}):`);
      sections.push(...truncateList(store.customers, "CLIENTES", (c: any) => `  - ${c.name} | ${c.email} | ${c.phone}`));
      relevantData.customers = store.customers;
    }
  }

  if (!ctxReq.isDomainSpecific) {
    if (store?.knowledgebase?.length) {
      sections.push(``, `BASE DE CONOCIMIENTO (${store.knowledgebase.length}):`);
      const sortedKB = [...store.knowledgebase].sort((a: any, b: any) => {
        const msg = ctxReq.message.toLowerCase();
        const aRelevance = msg ? ((a.title || "").toLowerCase().includes(msg) || (a.content || "").toLowerCase().includes(msg) ? 1 : 0) : 0;
        const bRelevance = msg ? ((b.title || "").toLowerCase().includes(msg) || (b.content || "").toLowerCase().includes(msg) ? 1 : 0) : 0;
        return bRelevance - aRelevance;
      });
      sections.push(...truncateList(sortedKB, "KB", (k: any) => `  [${k.category || "General"}] ${k.question ? k.question + " → " : ""}${k.title}: ${k.content}`));
      relevantData.knowledgebase = store.knowledgebase;
    }
  }

  if (hasDomain("booking")) {
    if (store?.appointments?.length) {
      sections.push(``, `📅 CITAS (${store.appointments.length}):`);
      sections.push(...truncateList(store.appointments, "CITAS", (a: any) => `  - ${a.customerInfo?.name || "Sin nombre"} | ${a.date} ${a.time} | ${a.status}`));
      relevantData.appointments = store.appointments;
    }
  }

  const domainSuffix = ctxReq.isDomainSpecific
    ? ` Dominio activo: ${domainLabel[ctxReq.domain]}.`
    : ".";

  const role = roleForStore(storeContext, !!store?._generic);

  const domainInstructions = ctxReq.isDomainSpecific
    ? effectiveDomains.map((d) => DOMAIN_INSTRUCTIONS[d]).filter(Boolean).join("\n")
    : Object.values(DOMAIN_INSTRUCTIONS).filter(Boolean).join("\n");

  const systemPrompt = [
    `FECHA OFICIAL DE HOY (USAR ESTA, NO INVENTAR): ${dateStr}`,
    ``,
    role + domainSuffix,
    ``,
    `CONFIGURACIÓN:`,
    sections.join("\n"),
    ``,
    `Tienes herramientas para ${ctxReq.isDomainSpecific ? domainLabel[ctxReq.domain].toLowerCase() : "gestionar la empresa"}. USA LAS HERRAMIENTAS DISPONIBLES. NO digas que no puedes — ejecuta la acción directamente.`,
    ``,
    domainInstructions,
    ``,
    `IMPORTANTE: El usuario usa la línea de comandos. Cuando te pida hacer algo, EJECUTA la herramienta directamente. No le digas "ve al panel".`,
    ``,
    `INFO: Después de ejecutar una herramienta, informa el resultado concreto. Si algo falla, explica exactamente qué pasó.`,
    warnings.length ? `\n⚠️ ALERTAS:\n${warnings.join("\n")}` : "",
    `Responde en español.`,
  ]
    .filter(Boolean)
    .join("\n");

  return { systemPrompt, sections, warnings, relevantData };
}
