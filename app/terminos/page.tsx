import Link from "next/link";

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="h-20 bg-white border-b border-zinc-100 flex items-center px-10">
        <Link href="/" className="text-2xl font-black italic tracking-tighter text-red-600 uppercase">
          JANDOSOFT <span className="text-zinc-950">PLATFORM</span>
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-20 space-y-12">
        <div className="space-y-4">
          <h1 className="text-5xl font-black italic text-zinc-950 uppercase tracking-tighter">Términos y Condiciones</h1>
          <p className="text-zinc-400 font-bold italic text-sm">Última actualización: Mayo 2026</p>
        </div>

        <section className="space-y-6">
          <h2 className="text-2xl font-black italic text-zinc-950 uppercase">1. Servicio</h2>
          <p className="text-zinc-600 leading-relaxed">
            Jandosoft proporciona una plataforma de herramientas cloud, CRM, IA y gestión empresarial. 
            El uso de la plataforma está sujeto a los presentes términos.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black italic text-zinc-950 uppercase">2. Cuentas</h2>
          <p className="text-zinc-600 leading-relaxed">
            El usuario es responsable de mantener la confidencialidad de sus credenciales. 
            Jandosoft no será responsable por accesos no autorizados derivados del mal uso de las credenciales.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black italic text-zinc-950 uppercase">3. Limitación de Responsabilidad</h2>
          <p className="text-zinc-600 leading-relaxed">
            Jandosoft proporciona el servicio "tal cual". No garantizamos que el servicio sea ininterrumpido 
            o libre de errores. En ningún caso Jandosoft será responsable por daños indirectos, 
            pérdida de datos, pérdida de ingresos o interrupción del negocio derivados del uso 
            o la imposibilidad de uso de la plataforma. Nuestra responsabilidad máxima se limita 
            al monto pagado por el servicio en los últimos 12 meses.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black italic text-zinc-950 uppercase">4. Datos</h2>
          <p className="text-zinc-600 leading-relaxed">
            Los datos almacenados en la plataforma son propiedad del usuario. Jandosoft no 
            compartirá información personal con terceros sin consentimiento explícito. 
            El usuario es responsable de la veracidad de los datos ingresados.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black italic text-zinc-950 uppercase">5. Suscripciones</h2>
          <p className="text-zinc-600 leading-relaxed">
            Las suscripciones se renuevan automáticamente. El usuario puede cancelar en cualquier 
            momento. No se realizan reembolsos por meses parciales. Jandosoft se reserva el derecho 
            de modificar los precios con aviso previo de 30 días.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black italic text-zinc-950 uppercase">6. Suspensión</h2>
          <p className="text-zinc-600 leading-relaxed">
            Jandosoft se reserva el derecho de suspender cuentas que violen estos términos, 
            que sean utilizadas para actividades ilegales, o que representen un riesgo para 
            la plataforma o sus usuarios.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black italic text-zinc-950 uppercase">7. Contacto</h2>
          <p className="text-zinc-600 leading-relaxed">
            Para cualquier consulta legal o de soporte, contacta a través del chat IA 
            en la plataforma o por correo electrónico.
          </p>
        </section>
      </main>

      <footer className="border-t border-zinc-100 py-8 px-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
            © 2026 JANDOSOFT ENTERPRISE
          </p>
          <Link href="/" className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline">
            Volver al inicio
          </Link>
        </div>
      </footer>
    </div>
  );
}
