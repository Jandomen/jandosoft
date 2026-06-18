"use client";

import { useState, useEffect } from "react";
import { Loader2, Send, CheckCircle2, AlertTriangle, Bot } from "lucide-react";
import { motion } from "framer-motion";

export default function EmbedFormPage({ params }: { params: Promise<{ slug: string; formId: string }> }) {
  const [slug, setSlug] = useState("");
  const [formId, setFormId] = useState("");
  const [form, setForm] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    params.then(p => {
      setSlug(p.slug);
      setFormId(p.formId);
    });
  }, [params]);

  useEffect(() => {
    if (!slug || !formId) return;
    (async () => {
      try {
        const res = await fetch(`/api/stores/public/${slug}`);
        const data = await res.json();
        if (!data.store) { setError("Tienda no encontrada"); setLoading(false); return; }
        const forms = data.store.smartForms || [];
        const f = forms.find((x: any) => String(x.id) === formId);
        if (!f) { setError("Formulario no encontrado"); setLoading(false); return; }
        setForm(f);
        const init: Record<string, string> = {};
        (f.fields || []).forEach((field: any) => { init[field.id] = ""; });
        setFormData(init);
      } catch { setError("Error al cargar formulario"); }
      setLoading(false);
    })();
  }, [slug, formId]);

  const handleSubmit = async () => {
    if (!form) return;
    const missing = (form.fields || []).filter((f: any) => f.required && !formData[f.id]?.trim());
    if (missing.length > 0) { setSubmitError(`Campos obligatorios: ${missing.map((f: any) => f.label).join(", ")}`); return; }
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`/api/embed/form/${slug}/${formId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: formData }),
      });
      if (!res.ok) { const err = await res.json(); setSubmitError(err.error || "Error al enviar"); setSubmitting(false); return; }
      setSubmitted(true);
    } catch { setSubmitError("Error de conexión"); }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-300" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center gap-3 p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-rose-400" />
        <p className="text-sm font-medium text-zinc-500">{error}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <p className="text-base font-black italic text-zinc-950 uppercase tracking-tight">¡Recibido!</p>
        <p className="text-xs text-zinc-500 font-medium">Gracias por tu respuesta. Te contactaremos pronto si es necesario.</p>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-md mx-auto bg-white">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600">
          <Bot className="w-4 h-4" />
        </div>
        <p className="font-black italic text-sm text-zinc-950 uppercase tracking-tight">{form?.name || "Formulario"}</p>
      </div>

      {form?.description && (
        <p className="text-xs text-zinc-500 font-medium mb-5">{form.description}</p>
      )}

      <div className="space-y-4">
        {(form?.fields || []).map((field: any) => (
          <div key={field.id}>
            <label className="text-[10px] font-black text-zinc-400 uppercase italic ml-1 tracking-wider flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-rose-500">*</span>}
            </label>
            {field.type === "textarea" ? (
              <textarea
                value={formData[field.id] || ""}
                onChange={e => setFormData(d => ({ ...d, [field.id]: e.target.value }))}
                placeholder={field.placeholder || ""}
                className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all resize-none h-24 mt-1 text-sm"
              />
            ) : field.type === "select" ? (
              <select
                value={formData[field.id] || ""}
                onChange={e => setFormData(d => ({ ...d, [field.id]: e.target.value }))}
                className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm"
              >
                <option value="">Seleccionar...</option>
                {(field.options || []).map((opt: string, i: number) => (
                  <option key={i} value={opt}>{opt}</option>
                ))}
              </select>
            ) : field.type === "checkbox" ? (
              <div className="mt-2 space-y-1.5">
                {(field.options || []).map((opt: string, i: number) => (
                  <label key={i} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox" value={opt}
                      checked={(formData[field.id] || "").split(", ").includes(opt)}
                      onChange={e => {
                        const current = (formData[field.id] || "").split(", ").filter(Boolean);
                        const next = e.target.checked ? [...current, opt] : current.filter((x: string) => x !== opt);
                        setFormData(d => ({ ...d, [field.id]: next.join(", ") }));
                      }}
                      className="w-4 h-4 accent-red-600 rounded"
                    />
                    <span className="text-xs font-medium text-zinc-600">{opt}</span>
                  </label>
                ))}
              </div>
            ) : field.type === "radio" ? (
              <div className="mt-2 space-y-1.5">
                {(field.options || []).map((opt: string, i: number) => (
                  <label key={i} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio" name={`field-${field.id}`} value={opt}
                      checked={formData[field.id] === opt}
                      onChange={e => setFormData(d => ({ ...d, [field.id]: e.target.value }))}
                      className="w-4 h-4 accent-red-600"
                    />
                    <span className="text-xs font-medium text-zinc-600">{opt}</span>
                  </label>
                ))}
              </div>
            ) : field.type === "number" ? (
              <input type="number"
                value={formData[field.id] || ""}
                onChange={e => setFormData(d => ({ ...d, [field.id]: e.target.value }))}
                placeholder={field.placeholder || ""}
                className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm"
              />
            ) : field.type === "date" ? (
              <input type="date"
                value={formData[field.id] || ""}
                onChange={e => setFormData(d => ({ ...d, [field.id]: e.target.value }))}
                className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm"
              />
            ) : field.type === "file" ? (
              <input type="file"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) setFormData(d => ({ ...d, [field.id]: file.name }));
                }}
                className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:italic file:bg-red-600 file:text-white"
              />
            ) : (
              <input type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
                value={formData[field.id] || ""}
                onChange={e => setFormData(d => ({ ...d, [field.id]: e.target.value }))}
                placeholder={field.placeholder || ""}
                className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all mt-1 text-sm"
              />
            )}
          </div>
        ))}
      </div>

      {submitError && (
        <p className="text-[10px] font-bold text-rose-500 italic mt-4 flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3" /> {submitError}
        </p>
      )}

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full mt-6 py-3.5 bg-red-600 text-white rounded-2xl font-black italic text-sm hover:bg-red-700 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {submitting ? "ENVIANDO..." : "ENVIAR"}
      </motion.button>
    </div>
  );
}
