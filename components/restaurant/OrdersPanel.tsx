"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import { useStoreSocket } from "@/lib/socket-client";
import {
  Plus, X, Loader2, Clock, ArrowRight, ShoppingCart,
  UtensilsCrossed, Package, Truck, AlertTriangle,
} from "lucide-react";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  id: string;
  type: string;
  tableNumber?: number;
  items: OrderItem[];
  total: number;
  status: string;
  notes?: string;
  couponCode?: string;
  createdAt: string;
}

interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
}

interface Props {
  storeId: string;
}

const STATUS_TABS = ["all", "received", "preparing", "ready", "delivered"] as const;
const STATUS_FLOW: Record<string, string> = { received: "preparing", preparing: "ready", ready: "delivered" };
const STATUS_COLORS: Record<string, string> = {
  received: "bg-blue-100 text-blue-700",
  preparing: "bg-amber-100 text-amber-700",
  ready: "bg-emerald-100 text-emerald-700",
  delivered: "bg-zinc-100 text-zinc-500",
};
const TYPE_ICONS: Record<string, React.ReactNode> = {
  dine_in: <UtensilsCrossed className="w-3 h-3" />,
  takeout: <Package className="w-3 h-3" />,
  delivery: <Truck className="w-3 h-3" />,
};

export default function OrdersPanel({ storeId }: Props) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [newOrder, setNewOrder] = useState({
    type: "dine_in", tableNumber: "", items: [] as { name: string; quantity: number; price: number }[],
    notes: "", couponCode: "",
  });
  const [selectedMenuItem, setSelectedMenuItem] = useState("");
  const [selectedQty, setSelectedQty] = useState("1");
  const [hasNewOrder, setHasNewOrder] = useState(false);

  const TAX_RATE = 0.08;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, storeRes] = await Promise.all([
        fetch(`/api/restaurant/${storeId}/orders`),
        fetch(`/api/restaurant/${storeId}`),
      ]);
      const ordersData = await ordersRes.json();
      const storeData = await storeRes.json();
      setOrders(ordersData.orders || []);
      setMenuItems(storeData.menuItems || []);
    } catch {
      showToast(t("restaurant.error_loading"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [storeId]);

  useStoreSocket(storeId, (event, data) => {
    if (event === "new-order" || event === "order-updated") {
      fetchData();
      setHasNewOrder(true);
    }
  });

  const filtered = activeTab === "all" ? orders : orders.filter(o => o.status === activeTab);
  const tabCounts = STATUS_TABS.reduce((acc, tab) => {
    acc[tab] = tab === "all" ? orders.length : orders.filter(o => o.status === tab).length;
    return acc;
  }, {} as Record<string, number>);

  const addMenuItemToOrder = () => {
    const item = menuItems.find(m => m.id === Number(selectedMenuItem));
    if (!item || !selectedQty) return;
    const qty = parseInt(selectedQty) || 1;
    const existing = newOrder.items.findIndex(i => i.name === item.name);
    if (existing >= 0) {
      const updated = [...newOrder.items];
      updated[existing] = { ...updated[existing], quantity: updated[existing].quantity + qty };
      setNewOrder({ ...newOrder, items: updated });
    } else {
      setNewOrder({ ...newOrder, items: [...newOrder.items, { name: item.name, quantity: qty, price: item.price }] });
    }
    setSelectedMenuItem("");
    setSelectedQty("1");
  };

  const removeItem = (idx: number) => {
    setNewOrder({ ...newOrder, items: newOrder.items.filter((_, i) => i !== idx) });
  };

  const subtotal = newOrder.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const createOrder = async () => {
    if (newOrder.items.length === 0) return;
    try {
      const res = await fetch(`/api/restaurant/${storeId}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newOrder.type,
          tableNumber: newOrder.type === "dine_in" ? parseInt(newOrder.tableNumber) || undefined : undefined,
          items: newOrder.items,
          total, notes: newOrder.notes, couponCode: newOrder.couponCode || undefined,
        }),
      });
      const data = await res.json();
      setOrders(prev => [data.order || data, ...prev]);
      setNewOrder({ type: "dine_in", tableNumber: "", items: [], notes: "", couponCode: "" });
      setShowModal(false);
      showToast(t("restaurant.order_created"), "success");
    } catch {
      showToast(t("restaurant.error_saving"), "error");
    }
  };

  const advanceStatus = async (order: Order) => {
    const next = STATUS_FLOW[order.status];
    if (!next) return;
    try {
      await fetch(`/api/restaurant/${storeId}/orders/${order._id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      setOrders(prev => prev.map(o => o._id === order._id ? { ...o, status: next } : o));
      showToast(t("restaurant.status_updated"), "success");
    } catch {
      showToast(t("restaurant.error_saving"), "error");
    }
  };

  const nextStatusLabel = (status: string) => {
    const next = STATUS_FLOW[status];
    return next ? t(`restaurant.status_${next}`) : null;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter flex items-center gap-2">
          {t("restaurant.orders")}
          {hasNewOrder && <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />}
        </h3>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setShowModal(true); setHasNewOrder(false); }}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 text-white rounded-xl text-[10px] md:text-xs font-black italic hover:bg-red-700 transition-all shadow-xl shadow-red-100">
          <Plus className="w-3.5 h-3.5" /> {t("restaurant.new_order")}
        </motion.button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {STATUS_TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black italic whitespace-nowrap transition-all",
              activeTab === tab ? "bg-red-600 text-white shadow-md" : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100")}>
            {t(`restaurant.tab_${tab}`)}
            <span className={cn("px-1.5 py-0.5 rounded-full text-[8px]", activeTab === tab ? "bg-white/20" : "bg-zinc-200 text-zinc-500")}>
              {tabCounts[tab]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-zinc-300 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">{t("restaurant.no_orders")}</div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(order => (
            <motion.div key={order._id || order.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 md:p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 bg-zinc-50 rounded-lg">{TYPE_ICONS[order.type] || <ShoppingCart className="w-3 h-3" />}</div>
                  <div className="min-w-0">
                    <p className="text-xs font-black italic text-zinc-950 truncate">
                      #{(order._id || order.id || "").slice(-6)} — {order.type === "dine_in" ? `${t("restaurant.table")} ${order.tableNumber}` : t(`restaurant.type_${order.type}`)}
                    </p>
                    <p className="text-[9px] text-zinc-400 font-bold italic">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <span className={cn("text-[8px] font-black italic px-2 py-0.5 rounded-full uppercase shrink-0", STATUS_COLORS[order.status])}>
                  {t(`restaurant.status_${order.status}`)}
                </span>
              </div>
              <div className="space-y-1">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-600 font-medium italic">{item.quantity}x {item.name}</span>
                    <span className="text-zinc-400 font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-zinc-50">
                <p className="text-sm font-black italic text-zinc-950">${order.total?.toFixed(2)}</p>
                {STATUS_FLOW[order.status] && (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => advanceStatus(order)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-[9px] font-black italic hover:bg-red-700 transition-all shadow-sm">
                    {nextStatusLabel(order.status)} <ArrowRight className="w-3 h-3" />
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-[2rem] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-zinc-100">
                <h4 className="text-sm font-black italic uppercase tracking-tighter">{t("restaurant.create_order")}</h4>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-zinc-50 rounded-lg"><X className="w-4 h-4 text-zinc-400" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("restaurant.order_type")}</label>
                  <div className="flex gap-2">
                    {(["dine_in", "takeout", "delivery"] as const).map(type => (
                      <button key={type} onClick={() => setNewOrder({ ...newOrder, type })}
                        className={cn("flex-1 py-2.5 rounded-xl border text-[10px] font-black italic transition-all",
                          newOrder.type === type ? "bg-red-600 text-white border-red-600" : "bg-zinc-50 text-zinc-500 border-zinc-100")}>
                        {t(`restaurant.type_${type}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {newOrder.type === "dine_in" && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("restaurant.table_number")}</label>
                    <input type="number" value={newOrder.tableNumber} onChange={e => setNewOrder({ ...newOrder, tableNumber: e.target.value })}
                      placeholder={t("restaurant.table_number_placeholder")}
                      className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1">{t("restaurant.add_item")}</label>
                  <div className="flex gap-2">
                    <select value={selectedMenuItem} onChange={e => setSelectedMenuItem(e.target.value)}
                      className="flex-1 bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium">
                      <option value="">{t("restaurant.select_item")}</option>
                      {menuItems.map(m => <option key={m.id} value={m.id}>{m.name} — ${m.price}</option>)}
                    </select>
                    <input type="number" min="1" value={selectedQty} onChange={e => setSelectedQty(e.target.value)}
                      className="w-16 bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium text-center" />
                    <motion.button whileTap={{ scale: 0.95 }} onClick={addMenuItemToOrder}
                      className="px-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all">
                      <Plus className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                {newOrder.items.length > 0 && (
                  <div className="space-y-2 bg-zinc-50 rounded-xl p-3">
                    {newOrder.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-xs font-medium italic text-zinc-700">{item.quantity}x {item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-400">${(item.price * item.quantity).toFixed(2)}</span>
                          <button onClick={() => removeItem(i)} className="text-zinc-300 hover:text-red-500"><X className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-1.5 bg-zinc-50 rounded-xl p-3 text-[10px] font-bold">
                  <div className="flex justify-between text-zinc-500"><span>{t("restaurant.subtotal")}</span><span>${subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-zinc-500"><span>{t("restaurant.tax")}</span><span>${tax.toFixed(2)}</span></div>
                  <div className="flex justify-between text-zinc-950 font-black text-sm border-t border-zinc-200 pt-1.5"><span>{t("restaurant.total")}</span><span>${total.toFixed(2)}</span></div>
                </div>

                <input type="text" placeholder={t("restaurant.coupon_code")} value={newOrder.couponCode}
                  onChange={e => setNewOrder({ ...newOrder, couponCode: e.target.value })}
                  className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />

                <textarea placeholder={t("restaurant.notes")} value={newOrder.notes} rows={2}
                  onChange={e => setNewOrder({ ...newOrder, notes: e.target.value })}
                  className="w-full bg-zinc-50 p-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all resize-none" />

                <motion.button whileTap={{ scale: 0.97 }} onClick={createOrder} disabled={newOrder.items.length === 0}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black italic hover:bg-red-700 transition-all shadow-xl disabled:opacity-50">
                  {t("restaurant.create_order")}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
