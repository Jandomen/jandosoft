"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Trash2, Shield, UserCog, Mail, Crown, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

interface Member {
  _id: string;
  userId: string;
  email: string;
  name: string;
  role: "owner" | "admin" | "member";
  joinedAt: string;
}

export default function TeamPanel() {
  const { showToast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [showInvite, setShowInvite] = useState(false);
  const [adding, setAdding] = useState(false);

  const loadMembers = async () => {
    try {
      const res = await fetch("/api/organization/members");
      const data = await res.json();
      setMembers(data.members || []);
    } catch {
      showToast("Error al cargar miembros", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMembers(); }, []);

  const addMember = async () => {
    if (!inviteEmail) return;
    setAdding(true);
    try {
      const res = await fetch("/api/organization/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Error al agregar", "error"); return; }
      setMembers(data.members || []);
      setInviteEmail("");
      setShowInvite(false);
      showToast("Miembro agregado", "success");
    } catch {
      showToast("Error de conexión", "error");
    } finally {
      setAdding(false);
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const res = await fetch(`/api/organization/members/${memberId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Error al eliminar", "error"); return; }
      setMembers(data.members || []);
      showToast("Miembro eliminado", "success");
    } catch {
      showToast("Error de conexión", "error");
    }
  };

  const changeRole = async (memberId: string, newRole: "admin" | "member") => {
    try {
      const res = await fetch(`/api/organization/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Error al cambiar rol", "error"); return; }
      setMembers(data.members || []);
      showToast("Rol actualizado", "success");
    } catch {
      showToast("Error de conexión", "error");
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <h3 className="text-2xl max-[400px]:text-xl font-black italic text-zinc-950 uppercase tracking-tighter"><Users className="w-6 h-6 max-[400px]:w-5 max-[400px]:h-5 inline mr-3 text-red-600" />Equipo</h3>
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 max-[400px]:h-14 bg-zinc-50 rounded-2xl animate-pulse" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-[400px]:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 max-[400px]:gap-3">
        <h3 className="text-2xl max-[400px]:text-xl font-black italic text-zinc-950 uppercase tracking-tighter">
          <Users className="w-6 h-6 max-[400px]:w-5 max-[400px]:h-5 inline mr-3 text-red-600" />Equipo
          <span className="text-zinc-400 text-base max-[400px]:text-sm ml-3">({members.length})</span>
        </h3>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowInvite(!showInvite)} className="px-6 max-[400px]:px-5 py-3 max-[400px]:py-2.5 bg-red-600 text-white rounded-2xl font-black text-xs max-[400px]:text-[10px] italic hover:bg-red-700 transition-all shadow-xl flex items-center gap-2">
          <UserPlus className="w-4 h-4 max-[400px]:w-3.5 max-[400px]:h-3.5" /> INVITAR
        </motion.button>
      </div>

      {showInvite && (
        <div className="bg-zinc-50 p-6 max-[400px]:p-5 rounded-[2rem] border border-zinc-100 space-y-4">
          <p className="text-xs max-[400px]:text-[11px] font-black italic text-zinc-950 uppercase tracking-tighter">Nuevo miembro</p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input type="email" placeholder="correo@ejemplo.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full bg-white pl-12 pr-4 py-4 max-[400px]:py-3.5 rounded-xl border border-zinc-200 outline-none font-medium focus:border-red-200 transition-all text-sm" />
            </div>
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value as any)} className="bg-white px-4 py-4 max-[400px]:py-3.5 rounded-xl border border-zinc-200 outline-none font-bold italic text-sm focus:border-red-200 transition-all">
              <option value="member">Miembro</option>
              <option value="admin">Admin</option>
            </select>
            <motion.button whileTap={{ scale: 0.95 }} onClick={addMember} disabled={!inviteEmail || adding} className="px-6 py-4 max-[400px]:py-3.5 bg-red-600 text-white rounded-xl font-black text-xs italic hover:bg-red-700 transition-all disabled:opacity-50 shadow-md">
              {adding ? "..." : "AGREGAR"}
            </motion.button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {members.map(m => (
          <div key={m._id} className="flex items-center justify-between p-4 max-[400px]:p-3 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-red-200 transition-all group">
            <div className="flex items-center gap-4 max-[400px]:gap-3 min-w-0 flex-1">
              <div className={cn("w-12 h-12 max-[400px]:w-10 max-[400px]:h-10 rounded-2xl flex items-center justify-center font-black text-sm max-[400px]:text-xs shrink-0", m.role === "owner" ? "bg-amber-50 text-amber-600" : m.role === "admin" ? "bg-red-50 text-red-600" : "bg-zinc-100 text-zinc-500")}>
                {m.name?.[0]?.toUpperCase() || m.email[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 max-[400px]:gap-1.5">
                  <p className="font-black italic text-zinc-950 text-sm truncate">{m.name || "Sin nombre"}</p>
                  {m.role === "owner" && <Crown className="w-3.5 h-3.5 max-[400px]:w-3 max-[400px]:h-3 text-amber-500 shrink-0" />}
                  {m.role === "admin" && <Shield className="w-3.5 h-3.5 max-[400px]:w-3 max-[400px]:h-3 text-red-500 shrink-0" />}
                </div>
                <p className="text-[10px] max-[400px]:text-[9px] font-bold text-zinc-400 italic truncate">{m.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 max-[400px]:gap-1.5 shrink-0">
              {m.role !== "owner" && (
                <>
                  <div className="relative group/role">
                    <motion.button whileTap={{ scale: 0.95 }} className="px-3 max-[400px]:px-2.5 py-1.5 bg-white rounded-lg border border-zinc-200 text-[9px] max-[400px]:text-[8px] font-black italic flex items-center gap-1 hover:border-red-200 transition-all uppercase">
                      <UserCog className="w-3 h-3 max-[400px]:w-2.5 max-[400px]:h-2.5" /> {m.role === "admin" ? "Admin" : "Miembro"}
                      <ChevronDown className="w-3 h-3 max-[400px]:w-2.5 max-[400px]:h-2.5" />
                    </motion.button>
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-zinc-100 shadow-lg py-1 min-w-[120px] hidden group-hover/role:block z-10">
                      <button onClick={() => changeRole(m._id, "admin")} className="w-full px-4 py-2 text-[10px] font-bold italic text-left hover:bg-zinc-50 flex items-center gap-2"><Shield className="w-3 h-3 text-red-500" /> Admin</button>
                      <button onClick={() => changeRole(m._id, "member")} className="w-full px-4 py-2 text-[10px] font-bold italic text-left hover:bg-zinc-50 flex items-center gap-2"><Users className="w-3 h-3 text-zinc-500" /> Miembro</button>
                    </div>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => removeMember(m._id)} className="p-2 max-[400px]:p-1.5 text-zinc-300 hover:text-red-500 transition-all">
                    <Trash2 className="w-4 h-4 max-[400px]:w-3.5 max-[400px]:h-3.5" />
                  </motion.button>
                </>
              )}
              {m.role === "owner" && (
                <span className="px-3 max-[400px]:px-2.5 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-[9px] max-[400px]:text-[8px] font-black italic uppercase shrink-0">Propietario</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
