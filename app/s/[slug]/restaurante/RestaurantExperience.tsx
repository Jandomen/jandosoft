"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, X, Plus, Minus, Clock, Star, ChevronRight,
  Phone, FileText, MessageSquare, UtensilsCrossed, CalendarDays,
  Users, MapPin, Send, CheckCircle, Loader2, AlertCircle,
  ArrowLeft, Trash2, Tag, Receipt, Bell, PenSquare,
  ChefHat, Package, HandMetal, CircleDot, Search,
} from "lucide-react";
import { useTheme } from "@/components/public/ThemeProvider";
import { getCurrencySymbol } from "@/lib/utils/currency";

type Tab = "menu" | "reservar" | "pedidos" | "resenas";

interface Props {
  store: any;
  tableNumber?: number;
  initialTab?: string;
  currency?: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes: string;
  imageUrl?: string;
}

interface OrderStatus {
  _id: string;
  status: string;
  items: any[];
  total: number;
  createdAt: string;
  tableNumber?: number;
  statusHistory: { status: string; timestamp: string }[];
}

interface Review {
  _id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface MenuItem {
  id: string;
  name: string;
  desc?: string;
  price: number;
  imageUrl?: string;
  category?: string;
  ingredients?: string[];
  calories?: number;
  dietaryInfo?: string[];
  featured?: boolean;
  preparationTime?: number;
  available?: boolean;
}

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: "menu", label: "Menú", icon: UtensilsCrossed },
  { key: "reservar", label: "Reservar", icon: CalendarDays },
  { key: "pedidos", label: "Pedidos", icon: Package },
  { key: "resenas", label: "Reseñas", icon: Star },
];

const STATUS_STEPS = [
  { key: "received", label: "Recibido", icon: CheckCircle },
  { key: "preparing", label: "Preparando", icon: ChefHat },
  { key: "ready", label: "Listo", icon: Bell },
  { key: "delivered", label: "Entregado", icon: Package },
];

const TIME_SLOTS = (() => {
  const slots: string[] = [];
  for (let h = 8; h <= 23; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
})();

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function RestaurantExperience({
  store,
  tableNumber,
  initialTab = "menu",
  currency = "USD",
}: Props) {
  const { theme, toggle } = useTheme();
  const symbol = getCurrencySymbol(currency);

  const [activeTab, setActiveTab] = useState<Tab>(initialTab as Tab);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderType, setOrderType] = useState<"dine_in" | "takeout">(
    tableNumber ? "dine_in" : "takeout"
  );
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [couponLoading, setCouponLoading] = useState(false);

  const [reservationDate, setReservationDate] = useState("");
  const [reservationTime, setReservationTime] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [resName, setResName] = useState("");
  const [resPhone, setResPhone] = useState("");
  const [resEmail, setResEmail] = useState("");
  const [resNotes, setResNotes] = useState("");
  const [resSubmitting, setResSubmitting] = useState(false);
  const [resSuccess, setResSuccess] = useState(false);

  const [myOrders, setMyOrders] = useState<OrderStatus[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [callWaiterLoading, setCallWaiterLoading] = useState(false);
  const [requestBillLoading, setRequestBillLoading] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [reviewEmail, setReviewEmail] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const apiCall = useCallback(
    async (method: string, body?: any) => {
      const url = `/api/public/restaurant?slug=${store.slug}`;
      const opts: any = {
        method,
        headers: { "Content-Type": "application/json" },
      };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(url, opts);
      return res.json();
    },
    [store.slug]
  );

  // --- Fetch menu ---
  useEffect(() => {
    (async () => {
      try {
        setMenuLoading(true);
        const data = await apiCall("GET");
        if (data.items) {
          setMenuItems(data.items);
          const cats = Array.from(
            new Set(data.items.map((i: MenuItem) => i.category || "General"))
          ) as string[];
          setCategories(cats);
        }
      } catch {
        // fallback to store menuItems
        const items = store.menuItems || store.products || [];
        setMenuItems(items);
        const cats = Array.from(
          new Set(items.map((i: any) => i.category || "General"))
        ) as string[];
        setCategories(cats);
      } finally {
        setMenuLoading(false);
      }
    })();
  }, [store.slug]);

  // --- Fetch orders when tab = pedidos + table set ---
  useEffect(() => {
    if (activeTab !== "pedidos") return;
    (async () => {
      setOrdersLoading(true);
      try {
        const data = await apiCall("GET");
        const orders = data.orders || [];
        setMyOrders(
          tableNumber
            ? orders.filter((o: OrderStatus) => o.tableNumber === tableNumber)
            : orders.slice(0, 5)
        );
      } catch {
        setMyOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    })();
  }, [activeTab, tableNumber, apiCall]);

  // --- Fetch reviews when tab = resenas ---
  useEffect(() => {
    if (activeTab !== "resenas") return;
    (async () => {
      setReviewsLoading(true);
      try {
        const data = await apiCall("GET");
        setReviews(data.reviews || []);
        setAvgRating(data.avgRating || 0);
      } catch {
        setReviews(store.reviews || []);
        const revs = store.reviews || [];
        setAvgRating(
          revs.length > 0
            ? revs.reduce((s: number, r: any) => s + r.rating, 0) / revs.length
            : 0
        );
      } finally {
        setReviewsLoading(false);
      }
    })();
  }, [activeTab, apiCall, store.reviews]);

  // --- Cart helpers ---
  const addToCart = useCallback(
    (item: MenuItem) => {
      setCart((prev) => {
        const existing = prev.find((c) => c.id === item.id);
        if (existing) {
          return prev.map((c) =>
            c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
          );
        }
        return [
          ...prev,
          {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            notes: "",
            imageUrl: item.imageUrl,
          },
        ];
      });
      showToast(`${item.name} agregado al pedido`);
    },
    [showToast]
  );

  const updateCartQty = useCallback((id: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((c) => (c.id === id ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0);
    });
  }, []);

  const updateCartNote = useCallback((id: string, notes: string) => {
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, notes } : c)));
  }, []);

  const cartCount = useMemo(() => cart.reduce((s, c) => s + c.quantity, 0), [cart]);
  const cartSubtotal = useMemo(
    () => cart.reduce((s, c) => s + c.price * c.quantity, 0),
    [cart]
  );
  const cartTax = useMemo(() => cartSubtotal * 0.16, [cartSubtotal]);
  const cartTotal = useMemo(
    () => cartSubtotal + cartTax - couponDiscount,
    [cartSubtotal, cartTax, couponDiscount]
  );

  // --- Coupon ---
  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const data = await apiCall("POST", {
        action: "validate_coupon",
        code: couponCode,
        subtotal: cartSubtotal,
      });
      if (data.discount) {
        setCouponDiscount(data.discount);
        showToast(`Cupón aplicado: -${symbol}${data.discount.toFixed(2)}`);
      } else {
        showToast(data.error || "Cupón inválido", "error");
      }
    } catch {
      showToast("Error al validar cupón", "error");
    } finally {
      setCouponLoading(false);
    }
  };

  // --- Place order ---
  const placeOrder = async () => {
    if (cart.length === 0) return;
    try {
      const data = await apiCall("POST", {
        action: "create_order",
        items: cart.map((c) => ({
          id: c.id,
          name: c.name,
          price: c.price,
          quantity: c.quantity,
          notes: c.notes,
        })),
        orderType,
        tableNumber,
        subtotal: cartSubtotal,
        tax: cartTax,
        discount: couponDiscount,
        total: cartTotal,
        couponCode: couponDiscount > 0 ? couponCode : undefined,
      });
      if (data.order || data._id) {
        showToast("Pedido enviado correctamente");
        setCart([]);
        setCartOpen(false);
        setCouponCode("");
        setCouponDiscount(0);
        setActiveTab("pedidos");
      } else {
        showToast(data.error || "Error al enviar pedido", "error");
      }
    } catch {
      showToast("Error al enviar pedido", "error");
    }
  };

  // --- Reservation ---
  const submitReservation = async () => {
    if (!reservationDate || !reservationTime || !resName || !resPhone) {
      showToast("Completa todos los campos obligatorios", "error");
      return;
    }
    setResSubmitting(true);
    try {
      const data = await apiCall("POST", {
        action: "create_reservation",
        date: reservationDate,
        time: reservationTime,
        partySize,
        customerName: resName,
        phone: resPhone,
        email: resEmail,
        notes: resNotes,
      });
      if (data.reservation || data._id) {
        setResSuccess(true);
        showToast("Reservación confirmada");
      } else {
        showToast(data.error || "Error al reservar", "error");
      }
    } catch {
      showToast("Error al reservar", "error");
    } finally {
      setResSubmitting(false);
    }
  };

  // --- Review ---
  const submitReview = async () => {
    if (!reviewName || !reviewComment) {
      showToast("Completa tu nombre y comentario", "error");
      return;
    }
    setReviewSubmitting(true);
    try {
      const data = await apiCall("POST", {
        action: "create_review",
        rating: reviewRating,
        comment: reviewComment,
        customerName: reviewName,
        email: reviewEmail,
      });
      if (data.review || data._id) {
        showToast("Reseña publicada");
        setReviewComment("");
        setReviewRating(5);
        setActiveTab("resenas");
      } else {
        showToast(data.error || "Error al publicar", "error");
      }
    } catch {
      showToast("Error al publicar reseña", "error");
    } finally {
      setReviewSubmitting(false);
    }
  };

  // --- Call waiter ---
  const callWaiter = async () => {
    if (!tableNumber) return;
    setCallWaiterLoading(true);
    try {
      await apiCall("POST", { action: "call_waiter", tableNumber });
      showToast("Mesero llamado, espere un momento");
    } catch {
      showToast("Error al llamar al mesero", "error");
    } finally {
      setCallWaiterLoading(false);
    }
  };

  // --- Request bill ---
  const requestBill = async () => {
    if (!tableNumber) return;
    setRequestBillLoading(true);
    try {
      await apiCall("POST", { action: "request_bill", tableNumber });
      showToast("Solicitud de cuenta enviada");
    } catch {
      showToast("Error al solicitar cuenta", "error");
    } finally {
      setRequestBillLoading(false);
    }
  };

  // --- Filtered menu ---
  const filteredMenu = useMemo(() => {
    let items = menuItems.filter((i) => i.available !== false);
    if (activeCategory !== "all") {
      items = items.filter((i) => (i.category || "General") === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.desc || "").toLowerCase().includes(q)
      );
    }
    return items;
  }, [menuItems, activeCategory, searchQuery]);

  const featuredItems = useMemo(
    () => filteredMenu.filter((i) => i.featured),
    [filteredMenu]
  );

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {store.image ? (
              <img
                src={store.image}
                alt={store.name}
                className="w-8 h-8 rounded-xl object-cover ring-2 ring-zinc-200 dark:ring-zinc-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-xs shadow-lg">
                R
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                {store.name}
              </h1>
              {tableNumber && (
                <span className="text-[10px] font-semibold text-red-600 dark:text-red-400">
                  Mesa {tableNumber}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            {cartCount > 0 && (
              <button
                onClick={() => setCartOpen(true)}
                className="relative w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-lg"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ===== TAB NAV ===== */}
      <div className="sticky top-14 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
        <div className="max-w-2xl mx-auto px-2 flex overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 ${
                  isActive
                    ? "text-red-600 border-red-600"
                    : "text-zinc-400 dark:text-zinc-500 border-transparent hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <main className="max-w-2xl mx-auto px-4 py-4 pb-24">
        <AnimatePresence mode="wait">
          {/* ==== MENU TAB ==== */}
          {activeTab === "menu" && (
            <motion.div
              key="menu"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Buscar en el menú..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
                />
              </div>

              {/* Categories */}
              <div
                ref={categoryScrollRef}
                className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4"
              >
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                    activeCategory === "all"
                      ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                      : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  Todos
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                      activeCategory === cat
                        ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                        : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Order type toggle */}
              <div className="flex bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-1">
                {[
                  { key: "dine_in" as const, label: "Come Aquí" },
                  { key: "takeout" as const, label: "Para Llevar" },
                ].map((ot) => (
                  <button
                    key={ot.key}
                    onClick={() => setOrderType(ot.key)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      orderType === ot.key
                        ? "bg-red-600 text-white shadow-sm"
                        : "text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {ot.label}
                  </button>
                ))}
              </div>

              {/* Loading */}
              {menuLoading && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 text-red-600 animate-spin" />
                </div>
              )}

              {/* Featured */}
              {!menuLoading && featuredItems.length > 0 && activeCategory === "all" && !searchQuery && (
                <div>
                  <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    Destacados
                  </h3>
                  <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
                    {featuredItems.map((item) => (
                      <div
                        key={item.id}
                        className="shrink-0 w-56 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden"
                      >
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-28 object-cover"
                          />
                        )}
                        <div className="p-3 space-y-1.5">
                          <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                            {item.name}
                          </h4>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2">
                            {item.desc || ""}
                          </p>
                          <div className="flex items-center justify-between pt-1">
                            <span className="font-black text-sm text-red-600">
                              {symbol}{item.price.toFixed(2)}
                            </span>
                            <button
                              onClick={() => addToCart(item)}
                              className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-sm hover:bg-red-700 active:scale-95 transition-all"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Menu grid */}
              {!menuLoading && (
                <div className="space-y-3">
                  {filteredMenu.length === 0 && (
                    <div className="text-center py-16 text-zinc-400 text-sm">
                      No hay platos disponibles
                    </div>
                  )}
                  {filteredMenu.map((item) => {
                    const cartItem = cart.find((c) => c.id === item.id);
                    return (
                      <div
                        key={item.id}
                        className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden"
                      >
                        <div className="flex">
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-24 h-24 sm:w-28 sm:h-28 object-cover shrink-0"
                            />
                          )}
                          <div className="flex-1 p-3 space-y-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-1.5">
                                  {item.name}
                                  {item.featured && (
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 shrink-0" />
                                  )}
                                </h4>
                                {item.desc && (
                                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5">
                                    {item.desc}
                                  </p>
                                )}
                              </div>
                              <span className="font-black text-sm text-red-600 shrink-0">
                                {symbol}{item.price.toFixed(2)}
                              </span>
                            </div>

                            {/* Meta */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              {item.calories && (
                                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                                  {item.calories} cal
                                </span>
                              )}
                              {item.preparationTime && (
                                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  {item.preparationTime} min
                                </span>
                              )}
                              {(item.dietaryInfo || []).slice(0, 2).map((d) => (
                                <span
                                  key={d}
                                  className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                                >
                                  {d}
                                </span>
                              ))}
                            </div>

                            {/* Ingredients */}
                            {item.ingredients && item.ingredients.length > 0 && (
                              <p className="text-[9px] text-zinc-400 dark:text-zinc-500 truncate">
                                {item.ingredients.join(" · ")}
                              </p>
                            )}

                            {/* Add button / qty */}
                            <div className="pt-1">
                              {cartItem ? (
                                <div className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-900/20 rounded-xl px-1">
                                  <button
                                    onClick={() => updateCartQty(item.id, -1)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="text-xs font-bold text-red-600 w-5 text-center">
                                    {cartItem.quantity}
                                  </span>
                                  <button
                                    onClick={() => updateCartQty(item.id, 1)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToCart(item)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600 text-white text-[10px] font-bold shadow-sm hover:bg-red-700 active:scale-95 transition-all"
                                >
                                  <Plus className="w-3 h-3" />
                                  Agregar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ==== RESERVAR TAB ==== */}
          {activeTab === "reservar" && (
            <motion.div
              key="reservar"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {resSuccess ? (
                <div className="text-center py-16 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    Reservación Confirmada
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {reservationDate} a las {reservationTime} · {partySize} personas
                  </p>
                  <button
                    onClick={() => {
                      setResSuccess(false);
                      setReservationDate("");
                      setReservationTime("");
                      setPartySize(2);
                      setResName("");
                      setResPhone("");
                      setResEmail("");
                      setResNotes("");
                    }}
                    className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow-lg hover:bg-red-700 transition-all"
                  >
                    Nueva Reservación
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 space-y-4">
                    {/* Date */}
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1.5">
                        Fecha
                      </label>
                      <input
                        type="date"
                        min={today}
                        value={reservationDate}
                        onChange={(e) => setReservationDate(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                      />
                    </div>

                    {/* Time */}
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1.5">
                        Hora
                      </label>
                      <div className="grid grid-cols-5 gap-1.5 max-h-32 overflow-y-auto">
                        {TIME_SLOTS.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => setReservationTime(slot)}
                            className={`py-2 rounded-lg text-[11px] font-bold transition-all ${
                              reservationTime === slot
                                ? "bg-red-600 text-white shadow-sm"
                                : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Party size */}
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1.5">
                        Personas
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setPartySize(Math.max(1, partySize - 1))}
                          className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 w-8 text-center">
                          {partySize}
                        </span>
                        <button
                          onClick={() => setPartySize(Math.min(20, partySize + 1))}
                          className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Customer info */}
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 space-y-3">
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Información de Contacto
                    </h3>
                    <input
                      type="text"
                      placeholder="Nombre *"
                      value={resName}
                      onChange={(e) => setResName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                    />
                    <input
                      type="tel"
                      placeholder="Teléfono *"
                      value={resPhone}
                      onChange={(e) => setResPhone(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                    />
                    <input
                      type="email"
                      placeholder="Email (opcional)"
                      value={resEmail}
                      onChange={(e) => setResEmail(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                    />
                    <textarea
                      placeholder="Notas especiales (alergias, occasion, etc.)"
                      value={resNotes}
                      onChange={(e) => setResNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none"
                    />
                  </div>

                  <button
                    onClick={submitReservation}
                    disabled={resSubmitting || !reservationDate || !reservationTime || !resName || !resPhone}
                    className="w-full py-3 rounded-xl bg-red-600 text-white text-sm font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {resSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CalendarDays className="w-4 h-4" />
                    )}
                    {resSubmitting ? "Confirmando..." : "Confirmar Reservación"}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ==== PEDIDOS TAB ==== */}
          {activeTab === "pedidos" && (
            <motion.div
              key="pedidos"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Action buttons */}
              {tableNumber && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={callWaiter}
                    disabled={callWaiterLoading}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-500/20 hover:bg-amber-600 disabled:opacity-50 transition-all active:scale-[0.98]"
                  >
                    {callWaiterLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                    Llamar Mesero
                  </button>
                  <button
                    onClick={requestBill}
                    disabled={requestBillLoading}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-zinc-800 dark:bg-zinc-700 text-white text-xs font-bold shadow-lg hover:bg-zinc-900 dark:hover:bg-zinc-600 disabled:opacity-50 transition-all active:scale-[0.98]"
                  >
                    {requestBillLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Receipt className="w-4 h-4" />
                    )}
                    Solicitar Cuenta
                  </button>
                </div>
              )}

              {ordersLoading && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 text-red-600 animate-spin" />
                </div>
              )}

              {!ordersLoading && myOrders.length === 0 && (
                <div className="text-center py-16 space-y-3">
                  <Package className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto" />
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">
                    No hay pedidos activos
                  </p>
                </div>
              )}

              {myOrders.map((order) => {
                const currentStepIdx = STATUS_STEPS.findIndex(
                  (s) => s.key === order.status
                );
                return (
                  <div
                    key={order._id}
                    className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                        Pedido #{String(order._id).slice(-6).toUpperCase()}
                      </span>
                      {order.tableNumber && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 dark:bg-red-900/20 text-red-600">
                          Mesa {order.tableNumber}
                        </span>
                      )}
                    </div>

                    {/* Status tracker */}
                    <div className="flex items-center justify-between">
                      {STATUS_STEPS.map((step, idx) => {
                        const StepIcon = step.icon;
                        const isComplete = idx <= currentStepIdx;
                        const isCurrent = idx === currentStepIdx;
                        return (
                          <div key={step.key} className="flex flex-col items-center flex-1">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center mb-1 transition-all ${
                                isComplete
                                  ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
                              } ${isCurrent ? "ring-2 ring-red-300 dark:ring-red-700" : ""}`}
                            >
                              <StepIcon className="w-4 h-4" />
                            </div>
                            <span
                              className={`text-[9px] font-bold ${
                                isComplete
                                  ? "text-red-600"
                                  : "text-zinc-400 dark:text-zinc-500"
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Items */}
                    <div className="space-y-1.5">
                      {(order.items || []).map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-zinc-700 dark:text-zinc-300">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="text-zinc-500 dark:text-zinc-400">
                            {symbol}{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        Total
                      </span>
                      <span className="text-sm font-black text-red-600">
                        {symbol}{order.total?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* ==== RESEÑAS TAB ==== */}
          {activeTab === "resenas" && (
            <motion.div
              key="resenas"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Average rating */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 text-center space-y-2">
                <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                  {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                </div>
                <div className="flex items-center justify-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`w-5 h-5 ${
                        n <= Math.round(avgRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-zinc-300 dark:text-zinc-600"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {reviews.length} reseña{reviews.length !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Write review */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 space-y-3">
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <PenSquare className="w-3.5 h-3.5" />
                  Escribir Reseña
                </h3>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setReviewRating(n)}
                      className="transition-transform active:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          n <= reviewRating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-zinc-300 dark:text-zinc-600"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Tu nombre *"
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                />
                <input
                  type="email"
                  placeholder="Email (opcional)"
                  value={reviewEmail}
                  onChange={(e) => setReviewEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                />
                <textarea
                  placeholder="Cuéntanos tu experiencia..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none"
                />
                <button
                  onClick={submitReview}
                  disabled={reviewSubmitting || !reviewName || !reviewComment}
                  className="w-full py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {reviewSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  {reviewSubmitting ? "Enviando..." : "Publicar Reseña"}
                </button>
              </div>

              {/* Review list */}
              {reviewsLoading && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 text-red-600 animate-spin" />
                </div>
              )}

              {!reviewsLoading && reviews.length === 0 && (
                <div className="text-center py-12 space-y-2">
                  <MessageSquare className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto" />
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">
                    Sé el primero en dejar una reseña
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div
                    key={rev._id}
                    className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {rev.customerName}
                      </span>
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`w-3 h-3 ${
                            n <= rev.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-zinc-300 dark:text-zinc-600"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ===== FLOATING CART BUTTON ===== */}
      <AnimatePresence>
        {cartCount > 0 && !cartOpen && activeTab === "menu" && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={() => setCartOpen(true)}
            className="fixed bottom-20 right-4 md:right-auto md:bottom-6 md:left-1/2 md:translate-x-[280px] z-40 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-red-600 text-white shadow-2xl shadow-red-600/30 hover:bg-red-700 active:scale-95 transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="text-xs font-bold">
              {cartCount} {cartCount === 1 ? "artículo" : "artículos"}
            </span>
            <div className="w-px h-4 bg-white/30" />
            <span className="text-sm font-black">{symbol}{cartTotal.toFixed(2)}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ===== CALL WAITER FAB ===== */}
      {tableNumber && activeTab === "menu" && cartCount === 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={callWaiter}
          disabled={callWaiterLoading}
          className="fixed bottom-6 right-4 z-40 w-14 h-14 rounded-2xl bg-amber-500 text-white shadow-2xl shadow-amber-500/30 flex items-center justify-center hover:bg-amber-600 active:scale-95 transition-all disabled:opacity-50"
        >
          {callWaiterLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
        </motion.button>
      )}

      {/* ===== CART DRAWER ===== */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="fixed inset-0 bg-black/40 z-50"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-zinc-900 rounded-t-3xl max-h-[85vh] flex flex-col"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
              </div>

              <div className="px-4 pb-2 flex items-center justify-between">
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Tu Pedido
                </h2>
                <button
                  onClick={() => setCartOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-4">
                {cart.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <ShoppingCart className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto" />
                    <p className="text-sm text-zinc-400 dark:text-zinc-500">
                      Tu carrito está vacío
                    </p>
                  </div>
                ) : (
                  <>
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                      >
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-12 h-12 rounded-xl object-cover shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {item.name}
                            </span>
                            <span className="text-xs font-bold text-red-600 shrink-0">
                              {symbol}{(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                          <input
                            type="text"
                            placeholder="Notas (sin cebolla, etc)"
                            value={item.notes}
                            onChange={(e) => updateCartNote(item.id, e.target.value)}
                            className="w-full text-[10px] px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 placeholder:text-zinc-400 focus:outline-none"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateCartQty(item.id, -1)}
                              className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 w-5 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateCartQty(item.id, 1)}
                              className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() =>
                                setCart((prev) => prev.filter((c) => c.id !== item.id))
                              }
                              className="ml-auto text-zinc-400 hover:text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Coupon */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Cupón de descuento"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                      />
                      <button
                        onClick={validateCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-3 py-2 rounded-xl bg-zinc-800 dark:bg-zinc-700 text-white text-xs font-bold hover:bg-zinc-900 disabled:opacity-50 transition-all"
                      >
                        {couponLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Tag className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Totals */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400">
                          Subtotal
                        </span>
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          {symbol}{cartSubtotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400">
                          Impuestos (16%)
                        </span>
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          {symbol}{cartTax.toFixed(2)}
                        </span>
                      </div>
                      {couponDiscount > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-emerald-600 dark:text-emerald-400">
                            Descuento
                          </span>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">
                            -{symbol}{couponDiscount.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1.5 border-t border-zinc-100 dark:border-zinc-800">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          Total
                        </span>
                        <span className="text-base font-black text-red-600">
                          {symbol}{cartTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {cart.length > 0 && (
                <div className="px-4 pb-6 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    onClick={placeOrder}
                    className="w-full py-3.5 rounded-xl bg-red-600 text-white text-sm font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Enviar Pedido · {symbol}{cartTotal.toFixed(2)}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== TOAST ===== */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2 ${
              toast.type === "success"
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                : "bg-red-600 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-3.5 h-3.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5" />
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
