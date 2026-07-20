import { ValidationResult, ValidationWarning, ChannelType, RiskLevel } from "./types";

const SPAM_TRIGGERS = [
  "free", "winner", "click here", "act now", "limited time", "guarantee",
  "no obligation", "buy now", "order now", "congratulations", "you won",
  "100% free", "no cost", "risk free", "special promotion", "exclusive deal"
];

export function validateCampaign(params: {
  channel: ChannelType;
  subject?: string;
  content: string;
  audienceSize: number;
  recentCampaignCount: number;
  avgOpenRate: number;
  avgBounceRate: number;
}): ValidationResult {
  const warnings: ValidationWarning[] = [];
  let score = 100;

  // Check spam triggers in content
  const lowerContent = params.content.toLowerCase();
  const foundTriggers = SPAM_TRIGGERS.filter(t => lowerContent.includes(t));
  if (foundTriggers.length > 0) {
    warnings.push({
      code: "SPAM_KEYWORDS",
      message: `Contenido detectado como potencial spam: "${foundTriggers.slice(0, 3).join('", ')}"`,
      severity: foundTriggers.length >= 3 ? "danger" : "warning",
      suggestion: "Evita palabras de spam. Usa un lenguaje natural y personalizado."
    });
    score -= foundTriggers.length * 10;
  }

  // Check ALL CAPS
  const capsWords = params.content.split(/\s+/).filter(w => w.length >= 4 && w === w.toUpperCase() && /[A-Z]/.test(w));
  if (capsWords.length >= 3) {
    warnings.push({
      code: "EXCESSIVE_CAPS",
      message: `${capsWords.length} palabras en MAYÚSCULAS detectadas`,
      severity: "warning",
      suggestion: "Reduce las mayúsculas. Se percibe como gritar."
    });
    score -= 15;
  }

  // Check excessive punctuation
  if (/[!]{2,}/.test(params.content) || /[?]{2,}/.test(params.content)) {
    warnings.push({
      code: "EXCESSIVE_PUNCTUATION",
      message: "Exceso de signos de exclamación/interrogación",
      severity: "warning",
      suggestion: "Un solo signo de exclamación es suficiente."
    });
    score -= 10;
  }

  // Check subject line
  if (params.channel === "email" && params.subject) {
    if (params.subject.length > 60) {
      warnings.push({
        code: "SUBJECT_TOO_LONG",
        message: `Asunto muy largo (${params.subject.length} caracteres). Se truncará en móviles.`,
        severity: "info",
        suggestion: "Mantén el asunto bajo 50 caracteres para mejor visualización."
      });
      score -= 5;
    }
    if (params.subject === params.subject.toUpperCase() && params.subject.length > 5) {
      warnings.push({
        code: "SUBJECT_ALL_CAPS",
        message: "El asunto está en MAYÚSCULAS",
        severity: "warning",
        suggestion: "Usa mayúsculas solo al inicio de palabras."
      });
      score -= 10;
    }
  }

  // Check audience size vs frequency
  if (params.recentCampaignCount >= 3) {
    warnings.push({
      code: "HIGH_FREQUENCY",
      message: `${params.recentCampaignCount} campañas enviadas recientemente`,
      severity: params.recentCampaignCount >= 5 ? "danger" : "warning",
      suggestion: "Reduce la frecuencia de envío para evitar cansancio de la audiencia."
    });
    score -= params.recentCampaignCount * 5;
  }

  // Check bounce rate
  if (params.avgBounceRate > 5) {
    warnings.push({
      code: "HIGH_BOUNCE_RATE",
      message: `Tasa de rebote alta: ${params.avgBounceRate.toFixed(1)}%`,
      severity: params.avgBounceRate > 10 ? "danger" : "warning",
      suggestion: "Limpia tu lista de correos. Rebotes altos dañan tu reputación."
    });
    score -= Math.floor(params.avgBounceRate * 2);
  }

  // Check send time
  const hour = new Date().getHours();
  if (hour < 8 || hour > 21) {
    warnings.push({
      code: "BAD_SEND_TIME",
      message: "Hora de envío fuera del horario laboral",
      severity: "info",
      suggestion: "Envía entre 9am y 6pm para mejor tasa de apertura."
    });
    score -= 5;
  }

  // Check empty content
  if (params.content.trim().length < 10) {
    warnings.push({
      code: "CONTENT_TOO_SHORT",
      message: "El contenido es muy corto",
      severity: "warning",
      suggestion: "Agrega más detalles para que el mensaje sea efectivo."
    });
    score -= 10;
  }

  // Check SMS length
  if (params.channel === "sms" && params.content.length > 160) {
    warnings.push({
      code: "SMS_TOO_LONG",
      message: `SMS excede 160 caracteres (${params.content.length}). Se cobrarán ${Math.ceil(params.content.length / 160)} mensajes.`,
      severity: "info",
      suggestion: "Reduce el texto o considera usar email para mensajes largos."
    });
  }

  score = Math.max(0, Math.min(100, score));
  const risk: RiskLevel = score >= 80 ? "excellent" : score >= 60 ? "good" : score >= 40 ? "medium" : score >= 20 ? "high" : "critical";

  return { valid: score >= 30, risk, warnings, score };
}
