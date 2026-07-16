"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import {
  ShoppingCart, DollarSign, MapPin, CalendarClock,
  Loader2, Bell, UtensilsCrossed, Plus, LayoutGrid,
  Megaphone, Clock, CheckCircle2, ChefHat, Truck,
  AlertTriangle,
} from "lucide-react";

interface Props {
  storeId: string;
  store: any;
  onSaveStore: any;
}

interface Order {
  _id: string;
  id: string;
  type: string;
  tableNumber?: number;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: string;
  createdAt: string;
}

interface WaiterCall {
  _id: string;
  tableNumber: number;
  message: string;
  status: string;
  createdAt: string;
}

export default function RestaurantDashboard({ storeId, store, onSaveStore }: Props) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>([]);
  const [tables, setTables] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/restaurant/${storeId}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setWaiterCalls(data.waiterCalls || []);
      setTables(data.tables || []);
    } catch {
      showToast(t("restaurant.error_loading"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [storeId]);

  const today = new Date().toDateString();
  const ordersToday = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const revenueToday = ordersToday.reduce((s, o) => s + (o.total || 0), 0);
  const occupied = tables.filter(t => t.status === "occupied").length;
  const pendingCalls = waiterCalls.filter(c => c.status === "pending");

  const statusColors: Record<string, string> = {
    received: "bg-blue-100 text-blue-700",
    preparing: "bg-amber-100 text-amber-700",
    ready: "bg-emerald-100 text-emerald-700",
    delivered: "bg-zinc-100 text-zinc-500",
  };

  const acknowledgeCall = async (id: string) => {
    await fetch(`/api/restaurant/${storeId}/waiter-calls/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "acknowledged" }),
    });
    setWaiterCalls(prev => prev.map(c => c._id === id ? { ...c, status: "acknowledged" } : c));
  };

  const resolveCall = async (id: string) => {
    await fetch(`/api/restaurant/${storeId}/waiter-calls/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    });
    setWaiterCalls(prev => prev.filter(c => c._id !== id));
    showToast(t("restaurant.call_resolved"), "success");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-zinc-300 animate-spin" />
      </div>
    );
  }

  const stats = [
    { icon: <ShoppingCart className="w-5 h-5" />, label: t("restaurant.orders_today"), value: ordersToday.length, color: "bg-blue-50 text-blue-600" },
    { icon: <DollarSign className="w-5 h-5" />, label: t("restaurant.revenue_today"), value: `$${revenueToday.toFixed(2)}`, color: "bg-emerald-50 text-emerald-600" },
    { icon: <MapPin className="w-5 h-5" />, label: t("restaurant.tables_occupied"), value: `${occupied}/${tables.length}`, color: "bg-amber-50 text-amber-600" },
    { icon: <CalendarClock className="w-5 h-5" />, label: t("restaurant.pending_calls"), value: pendingCalls.length, color: "bg-red-50 text-red-600" },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("restaurant.dashboard")}</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white max-[400px]:p-4 p-6 max-[400px]:rounded-[1.5rem] rounded-[2rem] border border-zinc-100 shadow-sm space-y-2 md:space-y-3">
            <div className={cn("p-2 md:p-3 rounded-xl w-fit", s.color)}>{s.icon}</div>
            <p className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic">{s.label}</p>
            <p className="max-[400px]:text-2xl text-3xl font-black italic text-zinc-950">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-5 md:p-6 space-y-4">
          <h4 className="text-xs font-black italic text-zinc-950 uppercase tracking-tight flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-red-600" /> {t("restaurant.recent_orders")}
          </h4>
          {orders.length === 0 ? (
            <p className="text-xs text-zinc-300 italic font-black uppercase tracking-widest py-8 text-center">{t("restaurant.no_orders")}</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {orders.slice(0, 10).map(order => (
                <div key={order._id || order.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black italic text-zinc-950 truncate">
                      #{(order._id || order.id || "").slice(-6)} — {order.type === "dine_in" ? `${t("restaurant.table")} ${order.tableNumber}` : order.type}
                    </p>
                    <p className="text-[9px] text-zinc-400 font-bold italic mt-0.5">
                      {order.items?.length || 0} {t("restaurant.items")} — ${order.total?.toFixed(2)}
                    </p>
                  </div>
                  <span className={cn("text-[8px] font-black italic px-2 py-0.5 rounded-full uppercase shrink-0 ml-2", statusColors[order.status] || "bg-zinc-100 text-zinc-500")}>
                    {t(`restaurant.status_${order.status}`)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-5 md:p-6 space-y-4">
          <h4 className="text-xs font-black italic text-zinc-950 uppercase tracking-tight flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-red-600" /> {t("restaurant.waiter_calls")}
          </h4>
          {pendingCalls.length === 0 ? (
            <p className="text-xs text-zinc-300 italic font-black uppercase tracking-widest py-8 text-center">{t("restaurant.no_pending_calls")}</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {pendingCalls.map(call => (
                <div key={call._id} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black italic text-zinc-950">{t("restaurant.table")} {call.tableNumber}</p>
                    <p className="text-[9px] text-zinc-500 italic">{call.message}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => acknowledgeCall(call._id)}
                      className="px-2.5 py-1.5 bg-amber-500 text-white rounded-lg text-[9px] font-black italic hover:bg-amber-600 transition-all">
                      {t("restaurant.acknowledge")}
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => resolveCall(call._id)}
                      className="px-2.5 py-1.5 bg-emerald-500 text-white rounded-lg text-[9px] font-black italic hover:bg-emerald-600 transition-all">
                      {t("restaurant.resolve")}
                    </motion.button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 md:gap-3">
        {[
          { icon: <Plus className="w-3.5 h-3.5" />, label: t("restaurant.new_order"), event: "restaurant-new-order" },
          { icon: <CalendarClock className="w-3.5 h-3.5" />, label: t("restaurant.new_reservation"), event: "restaurant-reservations" },
          { icon: <LayoutGrid className="w-3.5 h-3.5" />, label: t("restaurant.floor_plan"), event: "restaurant-floor-plan" },
          { icon: <Megaphone className="w-3.5 h-3.5" />, label: t("restaurant.promotions"), event: "restaurant-promotions" },
        ].map((action, i) => (
          <motion.button key={i} whileTap={{ scale: 0.95 }}
            onClick={() => window.dispatchEvent(new CustomEvent(action.event))}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-100 text-zinc-700 rounded-2xl text-[10px] md:text-xs font-black italic transition-all">
            {action.icon} {action.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
