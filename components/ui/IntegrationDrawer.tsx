"use client";

import { X, Loader2, Check, ExternalLink, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

interface DrawerField {
  key: string;
  label: string;
  placeholder: string;
  secret?: boolean;
  value?: string;
}

interface IntegrationDrawerProps {
  open: boolean;
  onClose: () => void;
  icon: any;
  iconColor: string;
  label: string;
  description?: string;
  docsUrl?: string;
  docsLabel?: string;
  connected: boolean;
  connectedInfo?: string;
  fields: DrawerField[];
  formValues: Record<string, string>;
  onFormChange: (key: string, value: string) => void;
  onSave: () => void;
  onDisconnect?: () => void;
  onTest?: () => void;
  saving?: boolean;
  testing?: boolean;
  children?: React.ReactNode;
}

export default function IntegrationDrawer({
  open, onClose, icon: Icon, iconColor, label, description, docsUrl, docsLabel,
  connected, connectedInfo, fields, formValues, onFormChange,
  onSave, onDisconnect, onTest, saving, testing, children,
}: IntegrationDrawerProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[150] bg-black/30 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 z-[160] h-full w-full max-w-md bg-white shadow-3xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: connected ? iconColor + "15" : "#f4f4f5" }}>
                    <Icon className="w-6 h-6" style={{ color: connected ? iconColor : "#a1a1aa" }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black italic text-zinc-950 uppercase tracking-tight">{label}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-zinc-300"}`} />
                      <span className={`text-[9px] font-bold italic uppercase ${connected ? "text-emerald-600" : "text-zinc-400"}`}>
                        {connected ? "Conectado" : "Desconectado"}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-xl transition-all">
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
              {description && (
                <p className="text-[10px] font-medium text-zinc-400 italic">{description}</p>
              )}
              {connected && connectedInfo && (
                <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-[9px] font-bold text-emerald-700 italic">{connectedInfo}</p>
                </div>
              )}
              {docsUrl && (
                <a href={docsUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-[10px] font-bold text-purple-500 hover:text-purple-700 italic">
                  <ExternalLink className="w-3 h-3" /> {docsLabel || "Ver documentación"}
                </a>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {children ? children : (
                <>
                  {fields.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest">
                        {connected ? "Credenciales" : "Ingresa tus credenciales para conectar"}
                      </p>
                      {fields.map(field => (
                        <div key={field.key} className="space-y-1">
                          <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{field.label}</label>
                          <input
                            type={field.secret ? "password" : "text"}
                            value={formValues[field.key] ?? field.value ?? ""}
                            onChange={e => onFormChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-zinc-100">
              <div className="flex gap-2">
                {!connected ? (
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={onSave} disabled={saving}
                    className="flex-1 px-5 py-3 bg-red-600 text-white rounded-xl font-black text-xs italic hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    {saving ? "Guardando..." : "Conectar"}
                  </motion.button>
                ) : (
                  <>
                    {onTest && (
                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={onTest} disabled={testing}
                        className="px-4 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-black text-[10px] italic hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center gap-1.5">
                        {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        {testing ? "Probando..." : "Probar"}
                      </motion.button>
                    )}
                    {onDisconnect && (
                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={onDisconnect}
                        className="px-4 py-3 bg-red-50 text-red-500 rounded-xl font-black text-[10px] italic hover:bg-red-100 transition-all flex items-center gap-1.5">
                        <Trash2 className="w-3 h-3" /> Desconectar
                      </motion.button>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
