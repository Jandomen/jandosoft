export function verifyEmailConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!process.env.SMTP_USER) {
    errors.push("SMTP_USER no configurado. Agrega SMTP_USER en .env.local (ej: alquizor8@gmail.com)");
  }
  if (!process.env.SMTP_PASS) {
    errors.push("SMTP_PASS no configurado. Agrega la contraseña de aplicación de Gmail en .env.local");
  }
  if (!process.env.SMTP_HOST) {
    errors.push("SMTP_HOST no configurado. Se usará smtp.gmail.com por defecto");
  }

  if (errors.length > 0) {
    console.warn("═══════════════════════════════════════════════");
    console.warn("  JANDOSOFT — Configuración de Correo (SMTP)");
    console.warn("═══════════════════════════════════════════════");
    errors.forEach((err) => console.warn(`  ⚠ ${err}`));
    console.warn("═══════════════════════════════════════════════");
    return { valid: false, errors };
  }

  console.log("[Email] Configuración SMTP verificada correctamente ✓");
  return { valid: true, errors: [] };
}
