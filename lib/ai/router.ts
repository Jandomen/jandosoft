import { AI_CONFIG, logMetrics } from "./config";
import { metrics } from "./metrics";

export type Domain =
  | "crm"
  | "booking"
  | "products"
  | "payments"
  | "email"
  | "analytics"
  | "marketing"
  | "admin"
  | "legal"
  | "inventory"
  | "education"
  | "industry"
  | "general";

interface DomainRoute {
  domain: Domain;
  keywords: string[];
  priority: number;
}

const DOMAIN_ROUTES: DomainRoute[] = [
  {
    domain: "booking",
    keywords: [
      "cita", "agendar", "reservar", "appointment", "schedule", "booking",
      "agenda", "calendar", "calendario", "programar cita", "turno",
      "cancelar cita", "reprogramar", "mañana a las", "próximo lunes",
    ],
    priority: 10,
  },
  {
    domain: "crm",
    keywords: [
      "cliente", "customer", "clients", "equipo", "team", "miembro",
      "member", "invitar", "invite", "rol", "role", "colaborador",
      "empleado", "staff", "usuario nuevo", "registrar cliente",
    ],
    priority: 9,
  },
  {
    domain: "products",
    keywords: [
      "producto", "product", "servicio", "service", "orden", "order",
      "pedido", "inventario", "stock", "precio", "price", "precios",
      "catálogo", "catalog", "comprar", "productos", "servicios",
      "lista de productos", "nuevo producto", "eliminar producto",
    ],
    priority: 8,
  },
  {
    domain: "payments",
    keywords: [
      "pago", "payment", "checkout", "stripe", "factura", "invoice",
      "cobrar", "charge", "suscripción", "subscription", "plan",
      "precio del plan", "cancelar suscripción", "link de pago",
      "pagar", "transacción", "transaction", "recibo", "receipt",
      "método de pago", "tarjeta", "card",
    ],
    priority: 7,
  },
  {
    domain: "email",
    keywords: [
      "correo", "email", "mail", "enviar correo", "send email",
      "newsletter", "gmail", "plantilla", "template", "bienvenida",
      "recordatorio por correo", "notificación por email",
    ],
    priority: 6,
  },
  {
    domain: "marketing",
    keywords: [
      "campaña", "campaign", "marketing", "automatización", "automation",
      "base de conocimiento", "knowledge base", "kb", "smart form",
      "formulario", "form", "embudo", "funnel", "promoción", "promotion",
      "descuento", "discount", "newsletter", "email marketing",
      "redes sociales automático",
    ],
    priority: 5,
  },
  {
    domain: "analytics",
    keywords: [
      "analítica", "analytics", "estadística", "stats", "reporte",
      "report", "dashboard", "visitas", "tráfico", "traffic",
      "visitantes", "páginas populares", "rendimiento", "performance",
      "gráfica", "chart", "métrica", "metric",
    ],
    priority: 4,
  },
  {
    domain: "admin",
    keywords: [
      "configurar", "configure", "integración", "integration",
      "telegram", "discord", "slack", "whatsapp", "facebook",
      "instagram", "twitter", "tiktok", "youtube", "threads",
      "messenger", "tienda", "store", "empresa", "negocio",
      "widget", "embed", "tarea programada", "scheduled task",
      "recordatorio automático", "código embed", "agente ia",
    ],
    priority: 3,
  },
  {
    domain: "legal",
    keywords: [
      "documento", "document", "expediente", "case file", "audiencia",
      "hearing", "juzgado", "court", "juez", "judge", "abogado",
      "demanda", "lawsuit", "contrato", "contract", "legal",
      "caso", "case número", "case number", "tribunal",
      "sentencia", "notificación", "notificación",
    ],
    priority: 8,
  },
  {
    domain: "inventory",
    keywords: [
      "inventario", "inventory", "stock", "almacén", "warehouse",
      "proveedor", "supplier", "materia prima", "sku",
      "existencia", "bodega", "suministro", "supply",
    ],
    priority: 7,
  },
  {
    domain: "education",
    keywords: [
      "clase", "class", "curso", "course", "estudiante", "student",
      "profesor", "teacher", "maestro", "inscripción", "enroll",
      "horario", "schedule", "aula", "salón", "capacitación",
      "taller", "workshop", "alumno",
    ],
    priority: 6,
  },
];

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function keywordScore(message: string, history: string[]): Map<Domain, number> {
  const scores = new Map<Domain, number>();
  const texts = [message, ...history.slice(-3)];

  for (const route of DOMAIN_ROUTES) {
    let score = 0;
    for (const text of texts) {
      const normalized = normalize(text);
      for (const kw of route.keywords) {
        const normalizedKw = normalize(kw);
        if (normalized.includes(normalizedKw)) {
          score += normalizedKw.length > 6 ? 3 : 2;
        }
      }
    }
    if (score > 0) {
      scores.set(route.domain, score * route.priority);
    }
  }

  return scores;
}

const GENERAL_INDICATORS = [
  "hola", "buenos días", "buenas tardes", "buenas noches", "qué tal",
  "hello", "hi", "hey", "gracias", "thanks", "thank you", "adiós",
  "chao", "bye", "quién eres", "what can you do", "ayuda", "help",
  "cómo estás", "quien eres", "who are you",
];

export function detectDomain(message: string, history: string[] = []): {
  domain: Domain;
  secondaryDomains: Domain[];
  confidence: "high" | "medium" | "low";
} {
  const normalizedMsg = normalize(message);

  for (const indicator of GENERAL_INDICATORS) {
    if (normalizedMsg.includes(indicator)) {
      return { domain: "general", secondaryDomains: [], confidence: "high" };
    }
  }

  const scores = keywordScore(message, history);

  if (scores.size === 0) {
    return { domain: "general", secondaryDomains: [], confidence: "low" };
  }

  const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const topScore = sorted[0][1];
  const topDomain = sorted[0][0];
  const secondary = sorted
    .filter(([, s]) => s >= topScore * 0.5 && s < topScore)
    .map(([d]) => d);

  const confidence: "high" | "medium" | "low" =
    topScore > 20 ? "high" : topScore > 10 ? "medium" : "low";

  return {
    domain: topDomain,
    secondaryDomains: secondary,
    confidence,
  };
}

export function getDomainLabel(domain: Domain): string {
  const labels: Record<Domain, string> = {
    crm: "Clientes y Equipo",
    booking: "Citas y Reservas",
    products: "Productos y Servicios",
    payments: "Pagos y Facturación",
    email: "Correos Electrónicos",
    analytics: "Analíticas",
    marketing: "Marketing y Automatización",
    admin: "Administración",
    legal: "Legal y Documentos",
    inventory: "Inventario",
    education: "Educación",
    industry: "Industria",
    general: "General",
  };
  return labels[domain];
}

export async function routerLLMDetect(
  message: string,
  history: string[]
): Promise<Domain[]> {
  const primary = detectDomain(message, history);

  if (primary.confidence === "high") {
    return [primary.domain, ...primary.secondaryDomains];
  }

  const startTime = Date.now();
  try {
    const { default: OpenAI } = await import("openai");
    const key = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
    if (!key) return [primary.domain, ...primary.secondaryDomains];

    const client = new OpenAI({
      apiKey: key,
      baseURL: key === process.env.OPENROUTER_API_KEY
        ? "https://openrouter.ai/api/v1"
        : undefined,
    });

    const domainList = DOMAIN_ROUTES.map((r) => r.domain).join(", ");
    const comp = await client.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Clasifica este mensaje en uno o más dominios: ${domainList}. Responde SOLO con los nombres de dominio separados por coma, nada más.`,
        },
        { role: "user", content: message },
      ],
      max_tokens: 50,
      temperature: 0,
    });

    const text = comp.choices?.[0]?.message?.content?.toLowerCase().trim() || "";
    const duration = Date.now() - startTime;
    logMetrics("router", 50, comp.usage?.prompt_tokens || 0, comp.usage?.completion_tokens || 0, duration);

    const detected = text.split(",").map((d) => d.trim()).filter(
      (d): d is Domain => DOMAIN_ROUTES.some((r) => r.domain === d)
    );

    return detected.length > 0
      ? detected
      : [primary.domain, ...primary.secondaryDomains];
  } catch {
    return [primary.domain, ...primary.secondaryDomains];
  }
}
