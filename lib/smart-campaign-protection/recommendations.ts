import { Recommendation, HealthScoreResult, ValidationResult } from "./types";
import { ReputationMetrics } from "./reputation";

export function generateRecommendations(params: {
  validation: ValidationResult;
  healthScore: HealthScoreResult;
  reputation: ReputationMetrics;
  audienceSize: number;
  recentCampaignCount: number;
  channel: string;
  subject?: string;
  content?: string;
}): Recommendation[] {
  const recs: Recommendation[] = [];

  // Frequency recommendations
  if (params.recentCampaignCount >= 5) {
    recs.push({
      id: "freq_reduce",
      type: "frequency",
      priority: "high",
      title: "Reducir frecuencia de envío",
      description: `${params.recentCampaignCount} campañas en los últimos 7 días. Esto puede causar fatiga de suscriptores.`,
      impact: "Mejora la tasa de apertura y reduce desuscripciones",
      autoFixAvailable: true,
      autoFixAction: "schedule_later"
    });
  }

  // Segmentation recommendations
  if (params.audienceSize > 500 && params.channel === "email") {
    recs.push({
      id: "seg_segment",
      type: "segmentation",
      priority: "medium",
      title: "Segmentar audiencia",
      description: `Enviar a ${params.audienceSize} destinatarios sin segmentar reduce la efectividad.`,
      impact: "Aumenta tasa de apertura hasta 40%",
      autoFixAvailable: true,
      autoFixAction: "auto_segment"
    });
  }

  // Batching recommendations
  if (params.audienceSize > 100) {
    recs.push({
      id: "batch_send",
      type: "batching",
      priority: "medium",
      title: "Enviar por lotes",
      description: `Con ${params.audienceSize} destinatarios, enviar por lotes protege tu reputación.`,
      impact: "Reduce riesgo de bloqueo por proveedor de email",
      autoFixAvailable: true,
      autoFixAction: "enable_batching"
    });
  }

  // Timing recommendations
  const hour = new Date().getHours();
  if (hour < 9 || hour > 18) {
    recs.push({
      id: "time_schedule",
      type: "timing",
      priority: "medium",
      title: "Programar para horario laboral",
      description: "Enviar fuera de horario laboral reduce la tasa de apertura.",
      impact: "Mejora la tasa de apertura entre 15-25%",
      autoFixAvailable: true,
      autoFixAction: "schedule_9am"
    });
  }

  // Subject recommendations
  if (params.subject) {
    if (params.subject.length > 50) {
      recs.push({
        id: "subj_shorten",
        type: "subject",
        priority: "low",
        title: "Acortar asunto",
        description: `El asunto tiene ${params.subject.length} caracteres. Los asuntos cortos (<50) tienen mejor rendimiento.`,
        impact: "Mejora visualización en móviles",
        autoFixAvailable: false
      });
    }
    if (!/[?!important]/.test(params.subject) && !/\d/.test(params.subject)) {
      recs.push({
        id: "subj_engage",
        type: "subject",
        priority: "low",
        title: "Hacer el asunto más interactivo",
        description: "Asuntos con preguntas o números tienen mayor tasa de apertura.",
        impact: "Aumenta tasa de apertura hasta 20%",
        autoFixAvailable: false
      });
    }
  }

  // Content recommendations
  if (params.content) {
    const lowerContent = params.content.toLowerCase();
    if (lowerContent.includes("http://") || lowerContent.includes("https://")) {
      recs.push({
        id: "content_links",
        type: "content",
        priority: "low",
        title: "Reducir enlaces externos",
        description: "Demasiados enlaces pueden activar filtros de spam.",
        impact: "Reduce probabilidad de ir a spam",
        autoFixAvailable: false
      });
    }
    if (params.content.length < 50) {
      recs.push({
        id: "content_expand",
        type: "content",
        priority: "medium",
        title: "Ampliar contenido",
        description: "El contenido es muy corto. Agrega más valor para el destinatario.",
        impact: "Mejora la tasa de engagement",
        autoFixAvailable: false
      });
    }
  }

  // Reputation recommendations
  if (params.reputation.bounceRate > 5) {
    recs.push({
      id: "rep_bounce",
      type: "general",
      priority: "critical",
      title: "Limpiar lista de correo",
      description: `Tasa de rebote del ${params.reputation.bounceRate}% es peligrosa para tu reputación.`,
      impact: "Previene bloqueo permanente del dominio",
      autoFixAvailable: true,
      autoFixAction: "clean_bounced"
    });
  }

  if (params.reputation.complaintRate > 0.3) {
    recs.push({
      id: "rep_complaint",
      type: "general",
      priority: "critical",
      title: "Revisar contenido por quejas",
      description: `Tasa de quejas del ${params.reputation.complaintRate}% indica problemas con el contenido.`,
      impact: "Previene reporte como spam",
      autoFixAvailable: false
    });
  }

  // Health score recommendations
  if (params.healthScore.score < 40) {
    recs.push({
      id: "health_critical",
      type: "general",
      priority: "critical",
      title: "Score de salud crítico",
      description: `Tu score de salud es ${params.healthScore.score}/100. Evita enviar campañas hasta mejorar.`,
      impact: "Protege tu dominio de ser bloqueado",
      autoFixAvailable: false
    });
  }

  return recs.sort((a, b) => {
    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
  });
}
