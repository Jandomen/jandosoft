"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import {
  Plus, Trash2, X, Save, Loader2, GripVertical, Circle, Square,
} from "lucide-react";

interface TableData {
  id: string;
  number: number;
  capacity: number;
  section: string;
  shape: "rect" | "circle";
  status: string;
  x: number;
  y: number;
}

interface Props {
  storeId: string;
  floorPlan: any;
  tables: TableData[];
  onSave: (floorPlan: any) => void;
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  free: { bg: "bg-emerald-100", border: "border-emerald-400", text: "text-emerald-700" },
  occupied: { bg: "bg-red-100", border: "border-red-400", text: "text-red-700" },
  reserved: { bg: "bg-amber-100", border: "border-amber-400", text: "text-amber-700" },
  cleaning: { bg: "bg-blue-100", border: "border-blue-400", text: "text-blue-700" },
};

export default function FloorPlanEditor({ storeId, floorPlan, tables: initialTables, onSave }: Props) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [tables, setTables] = useState<TableData[]>(initialTables || []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [sectionFilter, setSectionFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [editingTable, setEditingTable] = useState<TableData | null>(null);
  const [editForm, setEditForm] = useState({ number: "", capacity: "", section: "", shape: "rect" as "rect" | "circle" });
  const canvasRef = useRef<HTMLDivElement>(null);

  const sections = ["all", ...new Set(tables.map(t => t.section).filter(Boolean))];

  const filteredTables = sectionFilter === "all" ? tables : tables.filter(t => t.section === sectionFilter);

  const addTable = () => {
    const num = tables.length > 0 ? Math.max(...tables.map(t => t.number)) + 1 : 1;
    const newTable: TableData = {
      id: Date.now().toString(),
      number: num,
      capacity: 4,
      section: "main",
      shape: "rect",
      status: "free",
      x: 50,
      y: 50,
    };
    setTables([...tables, newTable]);
  };

  const deleteTable = (id: string) => {
    setTables(tables.filter(t => t.id !== id));
    if (selectedId === id) { setSelectedId(null); setEditingTable(null); }
  };

  const openEditTable = (table: TableData) => {
    setSelectedId(table.id);
    setEditingTable(table);
    setEditForm({ number: String(table.number), capacity: String(table.capacity), section: table.section, shape: table.shape });
  };

  const saveEditTable = () => {
    if (!editingTable) return;
    setTables(tables.map(t => t.id === editingTable.id ? {
      ...t,
      number: parseInt(editForm.number) || t.number,
      capacity: parseInt(editForm.capacity) || t.capacity,
      section: editForm.section || t.section,
      shape: editForm.shape,
    } : t));
    setEditingTable(null);
  };

  const handleMouseDown = (e: React.MouseEvent, tableId: string) => {
    e.preventDefault();
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    setDragging(tableId);
    setDragOffset({ x: e.clientX - table.x, y: e.clientY - table.y });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - dragOffset.x, rect.width - 60));
    const y = Math.max(0, Math.min(e.clientY - dragOffset.y, rect.height - 60));
    setTables(prev => prev.map(t => t.id === dragging ? { ...t, x, y } : t));
  }, [dragging, dragOffset]);

  const handleMouseUp = useCallback(() => { setDragging(null); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ ...floorPlan, tables });
      showToast(t("restaurant.floor_plan_saved"), "success");
    } catch {
      showToast(t("restaurant.error_saving"), "error");
    }
    setSaving(false);
  };

  const selectedTable = tables.find(t => t.id === selectedId);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("restaurant.floor_plan")}</h3>
        <div className="flex items-center gap-2">
          <select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}
            className="bg-zinc-50 px-3 py-2 rounded-xl border border-zinc-100 outline-none text-xs font-medium">
            {sections.map(s => <option key={s} value={s}>{s === "all" ? t("restaurant.all_sections") : s}</option>)}
          </select>
          <motion.button whileTap={{ scale: 0.95 }} onClick={addTable}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-100 rounded-xl text-[10px] font-black italic text-zinc-700 transition-all">
            <Plus className="w-3.5 h-3.5" /> {t("restaurant.add_table")}
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black italic hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} {t("action.save")}
          </motion.button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-4 md:p-6">
        <div ref={canvasRef} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
          className="relative w-full bg-zinc-50 rounded-2xl border border-zinc-200 border-dashed min-h-[400px] md:min-h-[500px] overflow-hidden cursor-crosshair">
          {filteredTables.map(table => {
            const sc = STATUS_COLORS[table.status] || STATUS_COLORS.free;
            return (
              <motion.div key={table.id}
                onMouseDown={e => handleMouseDown(e, table.id)}
                onClick={() => openEditTable(table)}
                whileHover={{ scale: 1.05 }}
                className={cn(
                  "absolute cursor-grab active:cursor-grabbing flex flex-col items-center justify-center border-2 shadow-md transition-all select-none",
                  sc.bg, sc.border,
                  table.shape === "circle" ? "rounded-full" : "rounded-xl",
                  selectedId === table.id && "ring-2 ring-red-500 ring-offset-2"
                )}
                style={{ left: table.x, top: table.y, width: 64, height: 64 }}
              >
                <span className={cn("text-[10px] font-black italic", sc.text)}>#{table.number}</span>
                <span className="text-[7px] font-bold text-zinc-400">{table.capacity}{t("restaurant.people")}</span>
              </motion.div>
            );
          })}
          {filteredTables.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-xs text-zinc-300 italic font-black uppercase tracking-widest">{t("restaurant.no_tables")}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-[9px] font-black italic uppercase tracking-wider">
        {Object.entries(STATUS_COLORS).map(([status, colors]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={cn("w-3 h-3 rounded", colors.bg, "border", colors.border)} />
            <span className="text-zinc-500">{t(`restaurant.table_status_${status}`)}</span>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {editingTable && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setEditingTable(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-black italic text-zinc-950 uppercase tracking-tighter">{t("restaurant.edit_table")}</h4>
                <button onClick={() => setEditingTable(null)} className="p-1 hover:bg-zinc-50 rounded-lg"><X className="w-4 h-4 text-zinc-400" /></button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("restaurant.table_number")}</label>
                    <input type="number" value={editForm.number} onChange={e => setEditForm({ ...editForm, number: e.target.value })}
                      className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("restaurant.capacity")}</label>
                    <input type="number" value={editForm.capacity} onChange={e => setEditForm({ ...editForm, capacity: e.target.value })}
                      className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("restaurant.section")}</label>
                  <input type="text" value={editForm.section} onChange={e => setEditForm({ ...editForm, section: e.target.value })}
                    className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("restaurant.shape")}</label>
                  <div className="flex gap-2">
                    <button onClick={() => setEditForm({ ...editForm, shape: "rect" })}
                      className={cn("flex-1 py-2 rounded-xl border text-[10px] font-black italic transition-all flex items-center justify-center gap-1.5",
                        editForm.shape === "rect" ? "bg-red-600 text-white border-red-600" : "bg-zinc-50 text-zinc-500 border-zinc-100")}>
                      <Square className="w-3 h-3" /> {t("restaurant.rectangle")}
                    </button>
                    <button onClick={() => setEditForm({ ...editForm, shape: "circle" })}
                      className={cn("flex-1 py-2 rounded-xl border text-[10px] font-black italic transition-all flex items-center justify-center gap-1.5",
                        editForm.shape === "circle" ? "bg-red-600 text-white border-red-600" : "bg-zinc-50 text-zinc-500 border-zinc-100")}>
                      <Circle className="w-3 h-3" /> {t("restaurant.circle")}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => deleteTable(editingTable.id)}
                    className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-black italic hover:bg-red-100 transition-all flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" /> {t("action.delete")}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={saveEditTable}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-[10px] font-black italic hover:bg-red-700 transition-all shadow-lg shadow-red-100">
                    {t("action.save")}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
