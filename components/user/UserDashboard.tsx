"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  ShieldCheck,
  Clock,
  AlertCircle,
  Plus,
  Download,
  FileText,
  Store,
  Building2,
  X,
  CheckCircle2,
  Zap,
  Bot,
  Layers,
  ArrowRight,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { generateInvoicePDF } from "@/lib/pdf-utils";

interface UserDashboardProps {
  user: {
    email: string;
    subscription: string | null;
    subscriptionExpiry: Date | null;
    isSuspended: boolean;
  };

  userStores: any[];
  transactions: any[];

  onNavigate: (tab: any) => void;

  onSelectStore?: (storeId: string | number) => void;
  onCreateStore?: (store: any) => void;
  onEditStore?: (storeId: string | number, data: any) => void;
  onDeleteStore?: (storeId: string | number) => void;
}

const MAX_FREE_STORES = 3;

export default function UserDashboard({
  user,
  userStores,
  transactions,
  onNavigate,
  onSelectStore,
  onCreateStore,
  onEditStore,
  onDeleteStore,
}: UserDashboardProps) {
  const expiryDate = user.subscriptionExpiry
    ? new Date(user.subscriptionExpiry)
    : null;

  const isExpired = expiryDate
    ? new Date() > expiryDate
    : false;

  const daysLeft = expiryDate
    ? Math.ceil(
        (expiryDate.getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  const [showCreateStore, setShowCreateStore] = useState(false);

  const [editingStoreId, setEditingStoreId] =
    useState<string | number | null>(null);

  const [confirmDelete, setConfirmDelete] =
    useState<string | number | null>(null);

  const [storeForm, setStoreForm] = useState({
    name: "",
    desc: "",
    industry: "tecnologia",
    type: "",
  });

  const [step, setStep] = useState(1);

  const [myInvoices, setMyInvoices] = useState<any[]>([]);

  const isFree = !user.subscription || isExpired;

  const stores = Array.isArray(userStores)
    ? userStores
    : [];

  const storeCount = stores.length;

  const maxStores = isFree
    ? MAX_FREE_STORES
    : 999;

  const atLimit = storeCount >= maxStores;

  const editingStore = editingStoreId
    ? stores.find(
        (s) =>
          s._id === editingStoreId ||
          s.id === editingStoreId
      )
    : null;

  useEffect(() => {
    if (user?.email) {
      fetch(
        `/api/invoices?email=${encodeURIComponent(
          user.email
        )}`
      )
        .then((res) => res.json())
        .then((data) =>
          setMyInvoices(data.invoices || [])
        )
        .catch(() => {});
    }
  }, [user?.email]);

  const openCreateStore = () => {
    setEditingStoreId(null);

    setStoreForm({
      name: "",
      desc: "",
      industry: "tecnologia",
      type: "",
    });

    setStep(1);

    setShowCreateStore(true);
  };

  const openEditStore = (store: any) => {
    setEditingStoreId(store._id || store.id);

    setStoreForm({
      name: store.name,
      desc: store.desc || "",
      industry: store.industry || "tecnologia",
      type: store.type || "",
    });

    setStep(2);

    setShowCreateStore(true);
  };

  const handleCreateStore = () => {
    if (!storeForm.type || !storeForm.name)
      return;

    const typeLabels: Record<string, string> = {
      ventas: "Sistema de Ventas",
      saas: "SaaS",
      crm: "CRM",
      tienda: "Tienda Online",
      educacion: "Plataforma Educativa",
      otro: "Otro",
    };

    if (editingStoreId && editingStore) {
      onEditStore?.(editingStoreId, {
        ...editingStore,
        name: storeForm.name,
        desc: storeForm.desc,
        industry: storeForm.industry,
        type: storeForm.type,
        typeLabel:
          typeLabels[storeForm.type] ||
          storeForm.type,
      });
    } else {
      onCreateStore?.({
        name: storeForm.name,
        desc: storeForm.desc,
        industry: storeForm.industry,
        type: storeForm.type,
        typeLabel:
          typeLabels[storeForm.type] ||
          storeForm.type,
        createdAt: new Date().toISOString(),
        ownerEmail: user.email,
      });
    }

    setStoreForm({
      name: "",
      desc: "",
      industry: "tecnologia",
      type: "",
    });

    setEditingStoreId(null);

    setStep(1);

    setShowCreateStore(false);
  };

  const handleDeleteStore = (
    storeId: string | number
  ) => {
    onDeleteStore?.(storeId);

    setConfirmDelete(null);

    setShowCreateStore(false);
  };

  if (user.isSuspended) {
    return (
      <div className="max-w-2xl mx-auto py-16 max-[400px]:py-16 py-20 text-center space-y-6 max-[400px]:space-y-6 space-y-8 px-4">
        <div className="w-20 h-20 max-[400px]:w-20 max-[400px]:h-20 w-24 h-24 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-red-100">
          <AlertCircle className="w-10 h-10 max-[400px]:w-10 max-[400px]:h-10 w-12 h-12" />
        </div>

        <h2 className="text-2xl max-[400px]:text-2xl text-3xl sm:text-4xl font-black italic text-zinc-950 uppercase tracking-tight">
          Cuenta Suspendida
        </h2>

        <p className="text-zinc-500 font-medium text-sm max-[400px]:text-sm text-base sm:text-lg italic">
          Tu acceso ha sido restringido por el
          administrador.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5 max-[400px]:space-y-5 space-y-6 sm:space-y-10 pb-20 px-3 sm:px-6">

      {/* HEADER */}

      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 max-[400px]:gap-5 gap-6 bg-zinc-950 p-5 sm:p-8 lg:p-10 rounded-[2rem] sm:rounded-[3rem] text-white shadow-3xl relative overflow-hidden">

        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/20 rounded-full blur-[100px] -mr-32 -mt-32" />

        <div className="relative z-10 flex items-center gap-4 sm:gap-6">

          <div className="w-14 h-14 max-[400px]:w-14 max-[400px]:h-14 w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl shrink-0">
            <User className="w-7 h-7 max-[400px]:w-7 max-[400px]:h-7 w-8 h-8 sm:w-10 sm:h-10 text-red-500" />
          </div>

          <div className="min-w-0">
            <h2 className="text-xl max-[400px]:text-xl text-2xl sm:text-3xl font-black italic tracking-tight uppercase break-all">
              {user?.email?.split?.("@")?.[0] ||
                user?.email ||
                "Usuario"}
            </h2>

            <div className="flex flex-wrap items-center gap-1.5 max-[400px]:gap-1.5 gap-2 mt-1.5 max-[400px]:mt-1.5 mt-2">

              <span
                className={cn(
                  "px-2 max-[400px]:px-2 px-3 py-1 rounded-full text-[9px] max-[400px]:text-[9px] text-[10px] font-black uppercase tracking-wide sm:tracking-widest italic",
                  user.subscription
                    ? "bg-red-600 text-white"
                    : "bg-zinc-800 text-zinc-400"
                )}
              >
                {user.subscription
                  ? `PLAN ${user.subscription.toUpperCase()}`
                  : "USUARIO FREE"}
              </span>

              {user.subscription && (
                <span
                  className={cn(
                    "flex items-center gap-1 text-[9px] max-[400px]:text-[9px] text-[10px] font-black uppercase tracking-wide sm:tracking-widest italic",
                    isExpired
                      ? "text-red-500"
                      : "text-emerald-500"
                  )}
                >
                  <Clock className="w-2.5 h-2.5 max-[400px]:w-2.5 max-[400px]:h-2.5 w-3 h-3" />
                  {isExpired
                    ? "Expirado"
                    : `${daysLeft} días restantes`}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full lg:w-auto">

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate("chat")}
            className="w-full sm:w-auto px-5 py-3 bg-white text-zinc-950 rounded-2xl font-black text-[10px] max-[400px]:text-[10px] text-xs uppercase tracking-wide sm:tracking-widest hover:bg-red-600 hover:text-white transition-all italic shadow-2xl"
          >
            SOPORTE IA
          </motion.button>
        </div>
      </header>

      {/* PLAN */}

      {isFree && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200 p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] space-y-5 max-[400px]:space-y-5 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-[400px]:gap-4 gap-5">

            <div className="flex items-center gap-3 max-[400px]:gap-3 gap-4">

              <div className="w-12 h-12 max-[400px]:w-12 max-[400px]:h-12 w-14 h-14 bg-amber-600 text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                <Zap className="w-6 h-6 max-[400px]:w-6 max-[400px]:h-6 w-7 h-7" />
              </div>

              <div>
                <h4 className="text-lg max-[400px]:text-lg text-xl font-black italic text-zinc-950 uppercase tracking-tight">
                  Plan Gratuito
                </h4>

                <p className="text-[9px] max-[400px]:text-[9px] text-[10px] font-bold text-amber-600 uppercase tracking-wide sm:tracking-widest italic">
                  Límites de prueba
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-[400px]:gap-3 gap-4">

            <div className="bg-white/80 p-4 max-[400px]:p-4 p-5 rounded-2xl border border-amber-200/50 flex items-center gap-3 max-[400px]:gap-3 gap-4">
              <Layers className="w-7 h-7 max-[400px]:w-7 max-[400px]:h-7 w-8 h-8 text-amber-500 shrink-0" />
              <div>
                <p className="text-[8px] max-[400px]:text-[8px] text-[9px] font-black text-zinc-400 uppercase tracking-wide sm:tracking-widest italic">
                  DATOS
                </p>

                <p className="text-base max-[400px]:text-base text-lg font-black italic text-zinc-950">
                  10 registros
                </p>
              </div>
            </div>

            <div className="bg-white/80 p-4 max-[400px]:p-4 p-5 rounded-2xl border border-amber-200/50 flex items-center gap-3 max-[400px]:gap-3 gap-4">
              <Bot className="w-7 h-7 max-[400px]:w-7 max-[400px]:h-7 w-8 h-8 text-amber-500 shrink-0" />
              <div>
                <p className="text-[8px] max-[400px]:text-[8px] text-[9px] font-black text-zinc-400 uppercase tracking-wide sm:tracking-widest italic">
                  IA CHAT
                </p>

                <p className="text-base max-[400px]:text-base text-lg font-black italic text-zinc-950">
                  10 preguntas
                </p>
              </div>
            </div>

            <div className="bg-white/80 p-4 max-[400px]:p-4 p-5 rounded-2xl border border-amber-200/50 flex items-center gap-3 max-[400px]:gap-3 gap-4">
              <Store className="w-7 h-7 max-[400px]:w-7 max-[400px]:h-7 w-8 h-8 text-amber-500 shrink-0" />
              <div>
                <p className="text-[8px] max-[400px]:text-[8px] text-[9px] font-black text-zinc-400 uppercase tracking-wide sm:tracking-widest italic">
                  TIENDAS
                </p>

                <p className="text-base max-[400px]:text-base text-lg font-black italic text-zinc-950">
                  {storeCount}/{maxStores}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* STORES */}

      <div className="space-y-4 max-[400px]:space-y-4 space-y-5">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-[400px]:gap-3 gap-4">

          <div>
            <h3 className="text-xl max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tight">
              Mis{" "}
              <span className="text-red-600">
                Tiendas
              </span>
            </h3>

            <p className="text-[9px] max-[400px]:text-[9px] text-[10px] font-black text-zinc-400 uppercase tracking-wide sm:tracking-widest mt-0.5 max-[400px]:mt-0.5 mt-1 italic">
              {storeCount} de{" "}
              {isFree
                ? maxStores
                : "ilimitadas"}{" "}
              creadas
            </p>
          </div>

          {!atLimit && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={openCreateStore}
              className="w-full sm:w-auto px-5 max-[400px]:px-5 px-6 py-2.5 max-[400px]:py-2.5 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] max-[400px]:text-[10px] text-xs italic hover:bg-red-700 transition-all shadow-xl flex items-center justify-center gap-2"
            >
              <Plus className="w-3.5 h-3.5 max-[400px]:w-3.5 max-[400px]:h-3.5 w-4 h-4" />
              NUEVA TIENDA
            </motion.button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">

          {stores.map((store) => (
            <motion.div
              key={store._id || store.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[1.8rem] sm:rounded-[2.5rem] border border-zinc-100 shadow-sm p-4 max-[400px]:p-4 p-5 sm:p-6 space-y-4 max-[400px]:space-y-4 space-y-5 group hover:border-red-200 hover:shadow-xl transition-all cursor-pointer relative"
              onClick={() =>
                onSelectStore?.(
                  store._id || store.id
                )
              }
            >
              <div className="flex items-start justify-between">

                <div className="w-12 h-12 max-[400px]:w-12 max-[400px]:h-12 w-14 h-14 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-100 shrink-0">
                  <Store className="w-6 h-6 max-[400px]:w-6 max-[400px]:h-6 w-7 h-7" />
                </div>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditStore(store);
                  }}
                  className="p-1.5 max-[400px]:p-1.5 p-2 rounded-xl hover:bg-zinc-50 text-zinc-300 hover:text-red-600 transition-all"
                >
                  <Building2 className="w-3.5 h-3.5 max-[400px]:w-3.5 max-[400px]:h-3.5 w-4 h-4" />
                </motion.button>
              </div>

              <div>
                <h4 className="text-base max-[400px]:text-base text-lg font-black italic text-zinc-950 uppercase tracking-tight break-words">
                  {store.name}
                </h4>

                <div className="flex flex-wrap items-center gap-1.5 max-[400px]:gap-1.5 gap-2 mt-1.5 max-[400px]:mt-1.5 mt-2">
                  <span className="px-2 max-[400px]:px-2 px-2.5 py-0.5 bg-red-50 text-red-600 rounded-full text-[8px] max-[400px]:text-[8px] text-[9px] font-black italic uppercase">
                    {store.typeLabel ||
                      store.type}
                  </span>

                  <span className="text-[8px] max-[400px]:text-[8px] text-[9px] text-zinc-400 font-black italic">
                    {store.industry}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[9px] max-[400px]:text-[9px] text-[10px] font-black uppercase tracking-wide sm:tracking-widest text-red-600 italic">
                ENTRAR
                <ArrowRight className="w-3 h-3 max-[400px]:w-3 max-[400px]:h-3 w-3.5 h-3.5" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}