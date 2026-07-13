export interface GuardrailResult {
  allowed: boolean;
  reason?: string;
  sanitizedInput?: string;
}

const FORBIDDEN_PATTERNS = [
  /\bignore\s+(all\s+)?(previous|above|below)\s+instructions\b/i,
  /\bforget\s+(all\s+)?(previous|above|below)\b/i,
  /\byou\s+are\s+(not\s+)?(an?\s+)?(assistant|ai|bot)\b/i,
  /\b(reveal|show|print|display)\s+(your\s+)?(system\s+)?prompt\b/i,
  /\b(configuration|instructions)\s+(above|below|given)\b/i,
  /\badmin\s+password\b/i,
  /\b(token|api[_\s]?key|secret|credential)s?\b/i,
];

const SENSITIVE_KEYWORDS = [
  /\b(password|secret|credential|api[_\s]?key|private[_\s]?key)\s*[:=]/i,
  /\b(stripe[_\s]?(secret|key|token)|sk_live_|pk_live_)\b/i,
  /\b(openrouter|openai)[_\s]?(api[_\s]?)?key\b/i,
  /\bmongodb[_\s]?(uri|connection)\b/i,
];

const CONTEXT_OUT_OF_SCOPE = [
  /\b(what'?s?\s+my\s+(email|password|credit\s*card))\b/i,
  /\b(delete|drop)\s+(database|collection|table)\b/i,
  /\b(ssh|root|sudo|chmod)\b/i,
];

export function validateInput(input: string): GuardrailResult {
  if (!input || input.trim().length === 0) {
    return { allowed: false, reason: "El mensaje está vacío." };
  }

  if (input.length > 4000) {
    return { allowed: false, reason: "El mensaje es demasiado largo (máximo 4000 caracteres)." };
  }

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(input)) {
      return {
        allowed: false,
        reason: "Tu mensaje contiene instrucciones que no puedo procesar.",
        sanitizedInput: input.replace(pattern, "[...]"),
      };
    }
  }

  return { allowed: true };
}

export function validateOutput(
  output: string,
  storeName?: string
): GuardrailResult {
  if (!output || output.trim().length === 0) {
    return { allowed: false, reason: "No se pudo generar una respuesta." };
  }

  for (const pattern of SENSITIVE_KEYWORDS) {
    if (pattern.test(output)) {
      return {
        allowed: false,
        reason: "La respuesta generada contiene información sensible y no será mostrada.",
      };
    }
  }

  if (output.includes("```") && (output.includes("OPENAI_API_KEY") || output.includes("OPENROUTER_API_KEY"))) {
    return {
      allowed: false,
      reason: "La respuesta contiene claves de API y ha sido bloqueada por seguridad.",
    };
  }

  return { allowed: true };
}

export function detectPromptInjection(input: string): boolean {
  const suspicious = [
    /\b(system|assistant|user)\s*[:]/i,
    /\byou\s+must\s+(now|forget|ignore)\b/i,
    /\bpretend\s+(you\s+are|to\s+be)\b/i,
    /\b(role\s*play|roleplay)\s+as\b/i,
    /\b(dan|do\s+anything\s+now|jailbreak)\b/i,
    /\boutput\s+(in\s+)?(json|xml|yaml|markdown)\s+(format|above|before)\b/i,
    /\[system\]|\[assistant\]|\[user\]/i,
    /\*\*(system|assistant|user|instructions?)\s*[:*]/i,
  ];

  for (const pattern of suspicious) {
    if (pattern.test(input)) return true;
  }
  return false;
}

export function isWithinScope(input: string, storeContext: { name?: string; industry?: string }): boolean {
  for (const pattern of CONTEXT_OUT_OF_SCOPE) {
    if (pattern.test(input)) return false;
  }
  return true;
}
