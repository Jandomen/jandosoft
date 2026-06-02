"use client";

import { useState, useEffect } from "react";
import { Settings, Building2, Save, Hash, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/Toast";

interface OrgData {
  _id: string;
  name: string;
  slug: string;
  memberCount?: number;
  createdAt: string;
}

export default function OrgSettingsPanel() {
  const { showToast } = useToast();
  const [org, setOrg] = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/organization");
        const data = await res.json();
        if (data.organization) {
          setOrg(data.organization);
          setOrgName(data.organization.name);
        }
      } catch {
        showToast("Error al cargar organización", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveOrg = async () => {
    if (!orgName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Error al guardar", "error"); return; }
      setOrg(data.organization);
      showToast("Organización actualizada", "success");
    } catch {
      showToast("Error de conexión", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <h3 className="text-2xl max-[400px]:text-xl font-black italic text-zinc-950 uppercase tracking-tighter"><Settings className="w-6 h-6 max-[400px]:w-5 max-[400px]:h-5 inline mr-3 text-red-600" />Configuración</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-[400px]:gap-5 gap-6">
          {[1, 2].map(i => <div key={i} className="h-28 max-[400px]:h-28 h-32 bg-zinc-50 rounded-[2rem] animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-[400px]:space-y-6 space-y-8">
      <h3 className="text-2xl max-[400px]:text-xl font-black italic text-zinc-950 uppercase tracking-tighter">
        <Settings className="w-6 h-6 max-[400px]:w-5 max-[400px]:h-5 inline mr-3 text-red-600" />Configuración
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-[400px]:gap-5 gap-6">
        <div className="bg-white p-6 max-[400px]:p-6 p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-5 max-[400px]:space-y-5 space-y-6">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 max-[400px]:w-5 max-[400px]:h-5 w-6 h-6 text-red-600" />
            <p className="text-sm max-[400px]:text-xs font-black italic text-zinc-950 uppercase tracking-tighter">Organización</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">Nombre</label>
              <input type="text" value={orgName} onChange={e => setOrgName(e.target.value)} className="w-full bg-zinc-50 p-3.5 max-[400px]:p-3.5 p-4 rounded-xl border border-zinc-100 outline-none font-medium focus:bg-white focus:border-red-200 transition-all text-sm" />
            </div>
            <motion.button whileTap={{ scale: 0.95 }} onClick={saveOrg} disabled={!orgName.trim() || saving} className="px-7 max-[400px]:px-7 px-8 py-3.5 max-[400px]:py-3.5 py-4 bg-red-600 text-white rounded-2xl font-black text-xs italic hover:bg-red-700 transition-all shadow-xl disabled:opacity-50 flex items-center gap-2">
              <Save className="w-3.5 h-3.5 max-[400px]:w-3.5 max-[400px]:h-3.5 w-4 h-4" /> {saving ? "GUARDANDO..." : "GUARDAR"}
            </motion.button>
          </div>
        </div>

        <div className="bg-white p-6 max-[400px]:p-6 p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-5 max-[400px]:space-y-5 space-y-6">
          <p className="text-sm max-[400px]:text-xs font-black italic text-zinc-950 uppercase tracking-tighter">Detalles</p>
          <div className="space-y-3 max-[400px]:space-y-3 space-y-4">
            <div className="flex items-center justify-between p-3.5 max-[400px]:p-3.5 p-4 bg-zinc-50 rounded-xl">
              <span className="text-[9px] max-[400px]:text-[9px] text-[10px] font-bold text-zinc-400 italic uppercase flex items-center gap-2"><Hash className="w-2.5 h-2.5 max-[400px]:w-2.5 max-[400px]:h-2.5 w-3 h-3" /> Slug</span>
              <span className="text-[11px] max-[400px]:text-[11px] text-xs font-black italic text-zinc-950 truncate ml-2">{org?.slug}</span>
            </div>
            <div className="flex items-center justify-between p-3.5 max-[400px]:p-3.5 p-4 bg-zinc-50 rounded-xl">
              <span className="text-[9px] max-[400px]:text-[9px] text-[10px] font-bold text-zinc-400 italic uppercase flex items-center gap-2"><Calendar className="w-2.5 h-2.5 max-[400px]:w-2.5 max-[400px]:h-2.5 w-3 h-3" /> Creada</span>
              <span className="text-[11px] max-[400px]:text-[11px] text-xs font-black italic text-zinc-950 text-right ml-2">{org?.createdAt ? new Date(org.createdAt).toLocaleDateString("es", { year: "numeric", month: "long", day: "numeric" }) : "-"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
