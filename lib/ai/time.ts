/**
 * Centralized Time System for Jandosoft AI
 *
 * Single source of truth for all date/time operations.
 * The agent NEVER invents dates — it always uses the server-provided time.
 *
 * All date/time operations pass through this module.
 */

const DEFAULT_TIMEZONE = "UTC";
const DEFAULT_LOCALE = "es-MX";

// ── Timezone Validation ──

function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// ── Timezone Resolution ──

/**
 * Get the effective timezone for a store.
 * Priority: store.timezone > process.env.TZ > "UTC"
 */
export function getStoreTimezone(store?: any): string {
  if (store?.timezone && typeof store.timezone === "string" && store.timezone.length > 3) {
    if (isValidTimezone(store.timezone)) return store.timezone;
  }
  if (process.env.TZ && process.env.TZ.length > 3) {
    if (isValidTimezone(process.env.TZ)) return process.env.TZ;
  }
  return DEFAULT_TIMEZONE;
}

/**
 * Get the locale for a store (for date formatting).
 */
export function getStoreLocale(store?: any): string {
  if (store?.agentConfig?.lang) {
    const langMap: Record<string, string> = {
      es: "es-MX", en: "en-US", fr: "fr-FR", zh: "zh-CN",
      hi: "hi-IN", ko: "ko-KR", ja: "ja-JP", it: "it-IT",
      pt: "pt-BR", ru: "ru-RU",
    };
    return langMap[store.agentConfig.lang] || DEFAULT_LOCALE;
  }
  return DEFAULT_LOCALE;
}

// ── Core Time Functions ──

/**
 * Get the current server time as a Date object.
 * This is the single source of truth — never use `new Date()` elsewhere.
 */
export function getServerNow(): Date {
  return new Date();
}

/**
 * Get the current time as an ISO 8601 string (UTC).
 * Example: "2025-07-15T18:30:00.000Z"
 */
export function getCurrentDateTimeISO(): string {
  return getServerNow().toISOString();
}

/**
 * Get current date components in a specific timezone.
 * Returns structured date info that the agent can use for calculations.
 */
export function getDateComponents(timezone: string): {
  iso: string;
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
  weekday: string;
  weekdayShort: string;
  dateStr: string;
  timeStr: string;
  datetimeStr: string;
  dateISO: string;
  timeFull: string;
  tzAbbrev: string;
  tzOffset: string;
} {
  const safeTz = isValidTimezone(timezone) ? timezone : DEFAULT_TIMEZONE;
  const now = getServerNow();

  const formatter = new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    timeZone: safeTz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    weekday: "long",
    timeZoneName: "short",
  });

  const parts = formatter.formatToParts(now);
  const get = (type: string) => parts.find(p => p.type === type)?.value || "";

  const year = parseInt(get("year"));
  const month = parseInt(get("month"));
  const day = parseInt(get("day"));
  const hours = parseInt(get("hour"));
  const minutes = parseInt(get("minute"));
  const seconds = parseInt(get("second"));
  const weekday = get("weekday");
  const weekdayShort = weekday.substring(0, 3);
  const tzAbbrev = get("timeZoneName");

  // Build date string in Spanish
  const dateStr = now.toLocaleDateString(DEFAULT_LOCALE, {
    timeZone: safeTz,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timeStr = now.toLocaleTimeString(DEFAULT_LOCALE, {
    timeZone: safeTz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const timeFull = now.toLocaleTimeString(DEFAULT_LOCALE, {
    timeZone: safeTz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // ISO date parts
  const dateISO = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  // Timezone offset
  const offsetFormatter = new Intl.DateTimeFormat("en", {
    timeZone: safeTz,
    timeZoneName: "shortOffset",
  });
  const offsetParts = offsetFormatter.formatToParts(now);
  const tzOffset = offsetParts.find(p => p.type === "timeZoneName")?.value?.replace("GMT", "") || "+00:00";

  return {
    iso: now.toISOString(),
    year, month, day, hours, minutes, seconds,
    weekday, weekdayShort,
    dateStr, timeStr, datetimeStr: `${dateStr} ${timeStr}`,
    dateISO, timeFull, tzAbbrev, tzOffset,
  };
}

/**
 * Format a specific date in the store's timezone.
 * Useful for formatting appointment dates, campaign dates, etc.
 */
export function formatDateInTimezone(
  date: Date | string | number,
  timezone: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : typeof date === "number" ? new Date(date) : date;
  const safeTz = isValidTimezone(timezone) ? timezone : DEFAULT_TIMEZONE;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: safeTz,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  };
  return d.toLocaleDateString(DEFAULT_LOCALE, defaultOptions);
}

/**
 * Format a specific time in the store's timezone.
 */
export function formatTimeInTimezone(
  date: Date | string | number,
  timezone: string,
  hour12: boolean = false
): string {
  const d = typeof date === "string" ? new Date(date) : typeof date === "number" ? new Date(date) : date;
  const safeTz = isValidTimezone(timezone) ? timezone : DEFAULT_TIMEZONE;
  return d.toLocaleTimeString(DEFAULT_LOCALE, {
    timeZone: safeTz,
    hour: "2-digit",
    minute: "2-digit",
    hour12,
  });
}

/**
 * Compute a relative date (today, tomorrow, next Monday, etc.) using the server's real time.
 * Returns the date in YYYY-MM-DD format.
 */
export function computeRelativeDate(
  reference: "today" | "yesterday" | "tomorrow" | string,
  timezone: string
): string {
  const components = getDateComponents(timezone);
  const baseDate = new Date(components.dateISO + "T12:00:00Z");

  if (reference === "today") return components.dateISO;

  if (reference === "yesterday") {
    baseDate.setUTCDate(baseDate.getUTCDate() - 1);
    return baseDate.toISOString().split("T")[0];
  }

  if (reference === "tomorrow") {
    baseDate.setUTCDate(baseDate.getUTCDate() + 1);
    return baseDate.toISOString().split("T")[0];
  }

  // Handle "next Monday", "next week", etc.
  const weekdayMap: Record<string, number> = {
    domingo: 0, lunes: 1, martes: 2, miércoles: 3,
    jueves: 4, viernes: 5, sábadas: 6, sábado: 6,
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
  };

  const refLower = reference.toLowerCase().trim();

  // "next [weekday]"
  for (const [name, dayNum] of Object.entries(weekdayMap)) {
    if (refLower.includes(name)) {
      const currentDay = baseDate.getUTCDay();
      let daysAhead = dayNum - currentDay;
      if (daysAhead <= 0) daysAhead += 7;
      if (refLower.includes("próximo") || refLower.includes("proximo") || refLower.includes("next")) {
        // If it's the same weekday, add 7 more
        if (daysAhead === 0) daysAhead = 7;
      }
      baseDate.setUTCDate(baseDate.getUTCDate() + daysAhead);
      return baseDate.toISOString().split("T")[0];
    }
  }

  // "next week" / "la próxima semana"
  if (refLower.includes("semana") || refLower.includes("week")) {
    baseDate.setUTCDate(baseDate.getUTCDate() + 7);
    return baseDate.toISOString().split("T")[0];
  }

  // "next month" / "el próximo mes"
  if (refLower.includes("mes") || refLower.includes("month")) {
    baseDate.setUTCMonth(baseDate.getUTCMonth() + 1);
    return baseDate.toISOString().split("T")[0];
  }

  // Fallback: try to parse as a date
  const parsed = new Date(reference);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  // Last resort: return today
  return components.dateISO;
}

/**
 * Validate that a date string is not in the past (for appointment booking).
 * Uses the server's real time, not the LLM's knowledge.
 */
export function isDateInPast(dateStr: string, timezone: string): boolean {
  const components = getDateComponents(timezone);
  return dateStr < components.dateISO;
}

/**
 * Validate that a time on a given date is not in the past.
 */
export function isTimeInPast(dateStr: string, timeStr: string, timezone: string): boolean {
  const components = getDateComponents(timezone);
  if (dateStr > components.dateISO) return false;
  if (dateStr < components.dateISO) return true;
  return timeStr <= components.timeStr;
}

// ── System Prompt Injection ──

/**
 * Generate the time context block for the system prompt.
 * This is the ONLY place where dates are formatted for the AI prompt.
 * The agent must use these values — never compute its own.
 */
export function injectTimeContext(store?: any): string {
  const tz = getStoreTimezone(store);
  const components = getDateComponents(tz);

  return [
    `═══════════════════════════════════════════════`,
    `FECHA Y HORA DEL SERVIDOR (USAR SIEMPRE ESTOS VALORES):`,
    `═══════════════════════════════════════════════`,
    `Fecha actual: ${components.dateStr} (${components.dateISO})`,
    `Hora actual: ${components.timeStr} (${components.timeFull})`,
    `Día de la semana: ${components.weekday}`,
    `Zona horaria: ${tz} (${components.tzAbbrev}, UTC${components.tzOffset})`,
    ``,
    `IMPORTANTE:`,
    `- La fecha de HOY es ${components.dateISO} (${components.weekday}).`,
    `- La hora actual es ${components.timeStr} en zona ${tz}.`,
    `- Si el usuario pregunta "¿qué día es hoy?", responde: "${components.dateStr}".`,
    `- Si el usuario pregunta "¿qué hora es?", responde: "${components.timeStr}".`,
    `- Si el usuario dice "hoy", usa la fecha ${components.dateISO}.`,
    `- Si el usuario dice "mañana", calcula ${components.dateISO} + 1 día.`,
    `- Si el usuario dice "ayer", calcula ${components.dateISO} - 1 día.`,
    `- NUNCA inventes fechas ni horas. Usa SIEMPRE los valores de arriba.`,
    `- Para calcular fechas relativas ("próximo lunes", "la próxima semana", etc.), usa ${components.dateISO} como punto de partida.`,
    `- Si necesitas verificar la fecha/hora actual, usa la herramienta getCurrentDateTime.`,
    `═══════════════════════════════════════════════`,
  ].join("\n");
}

/**
 * Generate a compact time context for the business dashboard agent.
 * Shorter version for the internal assistant.
 */
export function injectTimeContextCompact(store?: any): string {
  const tz = getStoreTimezone(store);
  const components = getDateComponents(tz);

  return [
    `FECHA: ${components.dateStr} (${components.dateISO}) | HORA: ${components.timeStr} | TZ: ${tz}`,
    `Si el usuario menciona "hoy", "mañana", "ayer", usa ${components.dateISO} como referencia.`,
  ].join("\n");
}

// ── Tool Definition ──

/**
 * Tool definition for getCurrentDateTime — allows the agent to query server time on demand.
 */
export const GET_CURRENT_DATETIME_TOOL = {
  type: "function",
  function: {
    name: "getCurrentDateTime",
    description: "Get the current date and time from the server. Use this to verify the current date/time, calculate relative dates (tomorrow, next week, etc.), or when you need to confirm the current timestamp. Returns ISO format, human-readable date, time, timezone, and day of week.",
    parameters: {
      type: "object",
      properties: {
        timezone: {
          type: "string",
          description: "Optional timezone (e.g. 'America/Mexico_City', 'Europe/Madrid'). If not provided, uses the store's configured timezone.",
        },
      },
    },
  },
};

/**
 * Execute the getCurrentDateTime tool.
 * Returns current server time in the specified or store timezone.
 */
export function executeGetCurrentDateTime(args: { timezone?: string }, store?: any): {
  success: boolean;
  iso: string;
  date: string;
  dateISO: string;
  time: string;
  timeFull: string;
  weekday: string;
  timezone: string;
  tzAbbrev: string;
  message: string;
} {
  const tz = args.timezone || getStoreTimezone(store);
  const components = getDateComponents(tz);

  return {
    success: true,
    iso: components.iso,
    date: components.dateStr,
    dateISO: components.dateISO,
    time: components.timeStr,
    timeFull: components.timeFull,
    weekday: components.weekday,
    timezone: tz,
    tzAbbrev: components.tzAbbrev,
    message: `Fecha actual del servidor: ${components.dateStr} (${components.dateISO}), hora: ${components.timeStr}, día: ${components.weekday}, zona horaria: ${tz} (${components.tzAbbrev})`,
  };
}
