"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, 
  Users, 
  Settings, 
  Plus, 
  TrendingUp, 
  Clock, 
  Database as DbIcon, 
  Package, 
  ArrowUpRight, 
  Search, 
  LogOut, 
  Trash2, 
  Globe, 
  Cpu, 
  Key, 
  Cloud,
  Layers,
  FileText,
  Mail,
  Zap,
  ShoppingBag,
  ShieldCheck,
  CreditCard,
  Image as ImageIcon,
  ChevronRight,
  Upload,
  Download,
  DollarSign,
  Store,
  UserCheck,
  Building2,
  RefreshCw,
  Menu,
  X
} from "lucide-react";
import { generateInvoicePDF } from "@/lib/pdf-utils";

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

interface AdminProps {
  currency: string;
  setCurrency: (c: any) => void;
  products: any[];
  setProducts: (p: any) => void;
  isPremium: boolean;
  setIsPremium: (p: boolean) => void;
  transactions: any[];
}

export default function Admin({ currency, setCurrency, products, setProducts, isPremium, setIsPremium, transactions }: AdminProps) {
  const [newProduct, setNewProduct] = useState({ name: "", price: "", desc: "", images: [] });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [liveActivity, setLiveActivity] = useState<{ action: string; time: string; detail?: string }[]>([]);

  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalStores: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    newUsersThisMonth: 0,
    activeUsersToday: 0,
  });
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allStores, setAllStores] = useState<any[]>([]);
  const [allInvoices, setAllInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const [dashRes, usersRes, storesRes, invRes] = await Promise.all([
        fetch("/api/admin/dashboard"),
        fetch("/api/admin/users"),
        fetch("/api/admin/stores"),
        fetch("/api/invoices"),
      ]);
      if (dashRes.ok) {
        const data = await dashRes.json();
        setDashboardStats(data.stats);
        setLiveActivity(data.activity || []);
      }
      if (usersRes.ok) {
        const data = await usersRes.json();
        setAllUsers(data.users || []);
      }
      if (storesRes.ok) {
        const data = await storesRes.json();
        setAllStores(data.stores || []);
      }
      if (invRes.ok) {
        const data = await invRes.json();
        setAllInvoices(data.invoices || []);
      }
    } catch (e) {
      console.error("Error fetching admin data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {};

  const publishProduct = () => {
    if (!newProduct.name || !newProduct.price) return;
    const product = {
      id: Date.now(),
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      desc: newProduct.desc,
      images: newProduct.images,
      icon: <Package className="w-8 h-8" />
    };
    setProducts([product, ...products]);
    setNewProduct({ name: "", price: "", desc: "", images: [] });
    setActiveTab("dashboard");
  };

  return (
    <div className="flex flex-col min-h-[600px] md:h-[800px] w-full max-w-7xl mx-auto border-0 md:border border-zinc-200 rounded-none md:rounded-[3rem] overflow-hidden shadow-2xl bg-white">
      <header className="max-[400px]:px-3 px-4 md:px-10 max-[400px]:py-3 py-4 md:py-6 bg-white border-b border-zinc-100 flex items-center justify-between gap-2">
         <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <div className="p-2 md:p-3 bg-red-600 rounded-xl md:rounded-2xl shadow-xl shadow-red-100 text-white shrink-0">
               <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
               <h2 className="max-[400px]:text-base text-lg md:text-xl font-black italic tracking-tighter text-zinc-950 truncate">Panel <span className="text-red-600">Jandosoft</span></h2>
               <p className="text-[8px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest italic truncate">Administración Global</p>
            </div>
         </div>
         <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl">
               <span className="text-[10px] font-black text-zinc-400 uppercase italic">Premium:</span>
               <button 
                  onClick={() => setIsPremium(!isPremium)}
                  className={cn("px-4 py-1.5 rounded-full text-[10px] font-black italic uppercase transition-all shadow-sm", isPremium ? "bg-emerald-500 text-white" : "bg-zinc-200 text-zinc-500 hover:bg-zinc-300")}
               >
                  {isPremium ? "ACTIVO" : "BÁSICO (FREE)"}
               </button>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl">
               <span className="text-[10px] font-black text-zinc-400 uppercase italic">Moneda:</span>
               <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="bg-transparent text-xs font-black italic text-red-600 outline-none cursor-pointer"
               >
                  <option value="USD">USD ($)</option>
                  <option value="MXN">MXN ($)</option>
                  <option value="COP">COP ($)</option>
                  <option value="ARS">ARS ($)</option>
               </select>
            </div>
            <button onClick={fetchDashboard} className="p-2.5 hover:bg-zinc-50 rounded-xl transition-all" title="Actualizar datos">
              <RefreshCw className={cn("w-5 h-5 text-zinc-400", loading ? "animate-spin" : "")} />
            </button>
            <div className="flex items-center gap-3">
               <div className="text-right">
                  <p className="text-xs font-black text-zinc-950 italic">Admin@Jandosoft</p>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase">Superuser</p>
               </div>
               <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-lg">AD</div>
            </div>
         </div>
         <div className="flex md:hidden items-center gap-2">
           <motion.button whileTap={{ scale: 0.9 }} onClick={fetchDashboard} className="p-1.5 hover:bg-zinc-50 rounded-xl transition-all" title="Actualizar datos">
             <RefreshCw className={cn("w-4 h-4 text-zinc-400", loading ? "animate-spin" : "")} />
           </motion.button>
           <motion.button whileTap={{ scale: 0.9 }} onClick={() => setActiveTab("settings")} className="p-1.5 hover:bg-zinc-50 rounded-xl transition-all">
             <Settings className="w-4 h-4 text-zinc-400" />
           </motion.button>
         </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
         <motion.button
           whileTap={{ scale: 0.9 }}
           onClick={() => setMobileSidebar(true)}
           className="md:hidden absolute top-3 left-3 z-20 p-2 bg-white rounded-xl border border-zinc-100 shadow-md"
         >
           <Menu className="w-4 h-4 text-zinc-400" />
         </motion.button>
         <AnimatePresence>
           {mobileSidebar && (
             <motion.aside
               initial={{ x: -300 }}
               animate={{ x: 0 }}
               exit={{ x: -300 }}
               transition={{ type: "spring", stiffness: 400, damping: 30 }}
               className="absolute md:relative z-30 inset-y-0 left-0 w-64 bg-zinc-50 border-r border-zinc-100 p-4 md:p-6 flex flex-col gap-6 md:gap-8 overflow-y-auto shadow-xl md:shadow-none"
             >
               <div className="flex items-center justify-between md:hidden mb-2">
                 <h3 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest italic">Navegación Admin</h3>
                 <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMobileSidebar(false)} className="p-1 hover:bg-zinc-100 rounded-lg"><X className="w-4 h-4 text-zinc-400" /></motion.button>
               </div>
               <div className="space-y-1">
                  <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 md:mb-4 italic">General</h3>
                  <MenuItem icon={<BarChart3 />} label="Dashboard" active={activeTab === "dashboard"} onClick={() => { setActiveTab("dashboard"); setMobileSidebar(false); }} />
                  <MenuItem icon={<Users />} label="Usuarios" active={activeTab === "users"} onClick={() => { setActiveTab("users"); setMobileSidebar(false); }} />
                  <MenuItem icon={<Store />} label="Tiendas" active={activeTab === "stores"} onClick={() => { setActiveTab("stores"); setMobileSidebar(false); }} />
                  <MenuItem icon={<ShoppingBag />} label="Productos" active={activeTab === "store-admin"} onClick={() => { setActiveTab("store-admin"); setMobileSidebar(false); }} />
                  <MenuItem icon={<DbIcon />} label="Database" active={activeTab === "database"} onClick={() => { setActiveTab("database"); setMobileSidebar(false); }} />
               </div>
               <div className="space-y-1">
                  <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 md:mb-4 italic">Gestión</h3>
                  <MenuItem icon={<BarChart3 />} label="Analytics" active={activeTab === 'analytics'} onClick={() => { setActiveTab('analytics'); setMobileSidebar(false); }} />
                  <MenuItem icon={<DollarSign />} label="Ganancias" active={activeTab === 'revenue'} onClick={() => { setActiveTab('revenue'); setMobileSidebar(false); }} />
                  <MenuItem icon={<FileText />} label="Historial" active={activeTab === 'history'} onClick={() => { setActiveTab('history'); setMobileSidebar(false); }} />
                  <MenuItem icon={<Settings />} label="Ajustes" active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setMobileSidebar(false); }} />
               </div>
             </motion.aside>
           )}
         </AnimatePresence>

         <main className="flex-1 overflow-y-auto max-[400px]:p-3 p-4 md:p-10 bg-white relative">
            <AnimatePresence mode="wait">
               {activeTab === "dashboard" && (
                  <motion.div key="dashboard" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10">
                     {loading ? (
                       <div className="flex items-center justify-center py-20">
                         <div className="flex items-center gap-3 px-6 py-4 bg-zinc-50 rounded-2xl text-zinc-400 italic font-black text-sm">
                           <Loader className="w-5 h-5 animate-spin" /> CARGANDO DATOS...
                         </div>
                       </div>
                     ) : (
                       <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                          <StatCard icon={<Users className="text-red-500" />} label="Usuarios Totales" value={dashboardStats.totalUsers.toString()} change={`+${dashboardStats.newUsersThisMonth} este mes`} />
                          <StatCard icon={<Store className="text-emerald-500" />} label="Tiendas" value={dashboardStats.totalStores.toString()} change={`${dashboardStats.totalProducts} productos`} />
                          <StatCard icon={<ShoppingBag className="text-amber-500" />} label="Pedidos" value={dashboardStats.totalOrders.toString()} change={`$${dashboardStats.totalRevenue}`} />
                          <StatCard icon={<TrendingUp className="text-blue-500" />} label="Hoy" value={dashboardStats.activeUsersToday.toString()} change="nuevos hoy" />
                       </div>
 
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
                          <div className="bg-zinc-50/50 max-[400px]:p-5 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-zinc-100 space-y-4 md:space-y-6 shadow-sm">
                             <h3 className="max-[400px]:text-lg text-xl font-black italic text-zinc-950">Actividad Reciente</h3>
                             <div className="space-y-3 md:space-y-4">
                                {liveActivity.map((act, i) => (
                                   <motion.div key={i} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center justify-between max-[400px]:p-3 p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm italic font-black text-[10px] md:text-xs group hover:border-red-600 transition-all">
                                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                                         <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-red-600 rounded-full animate-pulse shrink-0" />
                                         <span className="truncate">{act.action}</span>
                                      </div>
                                      <span className="text-[8px] md:text-[9px] text-zinc-400 shrink-0">{act.time}</span>
                                   </motion.div>
                                ))}
                                {liveActivity.length === 0 && (
                                  <div className="py-6 md:py-8 text-center italic font-black text-zinc-200 text-[10px] md:text-xs">Sin actividad reciente</div>
                                )}
                             </div>
                          </div>
                          <div className="bg-red-600 max-[400px]:p-6 p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] text-white space-y-6 md:space-y-8 relative overflow-hidden group shadow-2xl shadow-red-200">
                             <Zap className="absolute top-6 md:top-10 right-6 md:right-10 w-20 h-20 md:w-32 md:h-32 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
                             <div className="relative z-10 space-y-3 md:space-y-4">
                                <h3 className="max-[400px]:text-2xl text-3xl md:text-4xl font-black italic leading-none">Aumenta tu Escalabilidad.</h3>
                                <p className="text-red-100 font-medium max-[400px]:text-sm">Gestiona tu infraestructura Cloud desde un solo lugar con la potencia de Jandosoft Enterprise.</p>
                             </div>
                             <motion.button whileTap={{ scale: 0.95 }} onClick={() => setActiveTab("settings")} className="relative z-10 px-6 md:px-8 py-3 md:py-4 bg-white text-red-600 rounded-2xl font-black italic shadow-xl hover:scale-105 transition-all text-[10px] md:text-sm">GESTIONAR CLUSTER</motion.button>
                          </div>
                       </div>
                      </>
                     )}
                  </motion.div>
               )}

                {activeTab === "users" && (
                  <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-8">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <h3 className="max-[400px]:text-2xl text-3xl font-black italic text-zinc-950 uppercase">Usuarios <span className="text-red-600">({allUsers.length})</span></h3>
                      <span className="text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">Todos los registros</span>
                    </div>
                    <div className="space-y-2 md:space-y-3">
                      {allUsers.map((u) => (
                        <div key={u._id} className="flex items-center justify-between max-[400px]:p-3.5 p-5 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-red-200 transition-all">
                          <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                            <div className="w-8 h-8 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-red-600 shadow-sm font-black italic text-xs md:text-base shrink-0">
                              {u.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-black italic text-zinc-950 text-sm md:text-base truncate">{u.name}</p>
                              <p className="text-[9px] md:text-[10px] text-zinc-400 font-bold italic truncate">{u.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 md:gap-6 shrink-0">
                            <div className="text-right">
                              <p className="text-[9px] md:text-[10px] font-black italic text-zinc-950">{u.storeCount || 0} tiendas</p>
                              <p className={cn("text-[8px] md:text-[9px] font-bold uppercase italic", u.subscription ? "text-emerald-600" : "text-zinc-400")}>
                                {u.subscription || "Free"}
                              </p>
                            </div>
                            <div className={cn("w-1.5 h-1.5 md:w-2 md:h-2 rounded-full", u.isSuspended ? "bg-rose-500" : "bg-emerald-500")} />
                          </div>
                        </div>
                      ))}
                      {allUsers.length === 0 && (
                        <div className="py-12 md:py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">No hay usuarios registrados</div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === "stores" && (
                  <motion.div key="stores" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-8">
                    <div className="flex items-center justify-between">
                      <h3 className="max-[400px]:text-2xl text-3xl font-black italic text-zinc-950 uppercase">Tiendas <span className="text-red-600">({allStores.length})</span></h3>
                    </div>
                    <div className="space-y-2 md:space-y-3">
                      {allStores.map((s) => (
                        <div key={s._id} className="flex items-center justify-between max-[400px]:p-3.5 p-5 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-red-200 transition-all">
                          <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                            <div className="w-8 h-8 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-red-600 shadow-sm shrink-0">
                              <Store className="w-4 h-4 md:w-6 md:h-6" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-black italic text-zinc-950 text-sm md:text-base truncate">{s.name}</p>
                              <p className="text-[9px] md:text-[10px] text-zinc-400 font-bold italic truncate">{s.ownerEmail} · {s.typeLabel || s.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 md:gap-6 shrink-0">
                            <div className="flex gap-2 md:gap-4 text-[8px] md:text-[10px] font-black italic text-zinc-500">
                              <span>{s.productCount} prod.</span>
                              <span className="hidden md:inline">{s.customerCount} clientes</span>
                              <span>{s.orderCount} ped.</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {allStores.length === 0 && (
                        <div className="py-12 md:py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">No hay tiendas creadas</div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === "store-admin" && (
                   <motion.div key="store" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 md:space-y-10">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                         <h3 className="max-[400px]:text-2xl text-3xl font-black italic text-zinc-950 uppercase">Gestión de <span className="text-red-600">Productos</span></h3>
                         <span className="text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">{products.length} Items Publicados</span>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
                         <div className="bg-zinc-50 max-[400px]:p-5 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-zinc-100 space-y-5 md:space-y-6 shadow-sm">
                            <div className="space-y-3 md:space-y-4">
                               <div className="grid grid-cols-2 gap-3 md:gap-4">
                                  <AdminInput label="Nombre del Producto" placeholder="Ej. Plan Avanzado" value={newProduct.name} onChange={(v: string) => setNewProduct({...newProduct, name: v})} />
                                  <AdminInput label={`Inversión (${currency})`} placeholder="Ej. 299" type="number" value={newProduct.price} onChange={(v: string) => setNewProduct({...newProduct, price: v})} />
                               </div>
                               <div className="space-y-1.5">
                                  <label className="text-[9px] font-black text-zinc-400 uppercase italic tracking-widest ml-1">Descripción corta</label>
                                  <textarea 
                                     value={newProduct.desc}
                                     onChange={(e) => setNewProduct({...newProduct, desc: e.target.value})}
                                     className="w-full bg-white border border-zinc-100 rounded-xl md:rounded-2xl p-3 md:p-4 text-[11px] md:text-xs font-medium outline-none focus:ring-2 focus:ring-red-600/50"
                                     placeholder="Detalles del producto..."
                                  />
                               </div>
                               
                               <div className="space-y-3">
                                  <label className="text-[9px] font-black text-zinc-400 uppercase italic flex items-center justify-between">
                                     Galería (Hasta 10 imágenes)
                                     <span className="text-red-600">{newProduct.images.length}/10</span>
                                  </label>
                                  <div className="grid grid-cols-5 gap-2">
                                     {newProduct.images.map((img, i) => (
                                        <div key={i} className="aspect-square bg-white rounded-xl overflow-hidden border border-zinc-100 relative group shadow-sm">
                                           <img src={img} className="w-full h-full object-cover" />
                                           <button onClick={() => setNewProduct({...newProduct, images: newProduct.images.filter((_, idx) => idx !== i)})} className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                     ))}
                                     {newProduct.images.length < 10 && (
                                        <label className="aspect-square bg-white border-2 border-dashed border-zinc-200 rounded-xl flex items-center justify-center text-zinc-300 hover:text-red-500 hover:border-red-200 cursor-pointer transition-all">
                                           <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                                           <Plus className="w-6 h-6" />
                                        </label>
                                     )}
                                  </div>
                               </div>
                               
                               <motion.button whileTap={{ scale: 0.95 }}
                                  onClick={publishProduct}
                                  className="w-full py-4 md:py-5 bg-red-600 text-white rounded-2xl font-black italic shadow-xl shadow-red-100 hover:bg-red-700 transition-all flex items-center justify-center gap-3 uppercase text-xs md:text-sm"
                               >
                                  PUBLICAR PRODUCTO <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                               </motion.button>
                            </div>
                         </div>

                         <div className="space-y-3 md:space-y-4">
                            <h4 className="text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">Activos actualmente</h4>
                            <div className="grid grid-cols-1 gap-3 md:gap-4">
                               {products.map((p: any) => (
                                  <div key={p.id} className="bg-white max-[400px]:p-3 p-4 rounded-2xl md:rounded-3xl border border-zinc-100 shadow-sm flex items-center justify-between group hover:border-red-600/20 transition-all">
                                     <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                                        <div className="w-8 h-8 md:w-12 md:h-12 bg-zinc-50 rounded-xl md:rounded-2xl flex items-center justify-center text-red-600 shadow-inner shrink-0">
                                           {p.icon || <Package />}
                                        </div>
                                        <div className="min-w-0">
                                           <p className="font-black italic text-xs md:text-sm text-zinc-950 truncate">{p.name}</p>
                                           <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 italic">{currency} {p.price}</p>
                                        </div>
                                     </div>
                                     <motion.button whileTap={{ scale: 0.9 }} onClick={() => setProducts(products.filter((pr: any) => pr.id !== p.id))} className="p-2 md:p-3 text-zinc-300 hover:text-rose-500 transition-colors shrink-0">
                                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                     </motion.button>
                                  </div>
                               ))}
                            </div>
                         </div>
                      </div>
                  </motion.div>
               )}

               {activeTab === "database" && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><div className="text-sm font-black italic text-zinc-400 p-10">Database View</div></motion.div>}
               
                {activeTab === "settings" && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 md:space-y-10">
                      <h3 className="max-[400px]:text-2xl text-3xl font-black italic text-zinc-950 uppercase">Configuración <span className="text-red-600">Enterprise</span></h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                         <ConfigBox label="MongoDB Cluster" value="mongodb+srv://alquizor8..." icon={<DbIcon className="text-emerald-500" />} />
                         <ConfigBox label="Cloudinary Assets" value="dpmufjj8y" icon={<Cloud className="text-blue-500" />} />
                         <ConfigBox label="Stripe Endpoint" value="sk_live_51PLATLD..." icon={<CreditCard className="text-red-500" />} />
                         <ConfigBox label="NowPayments Key" value="7H9EZ7V-2V5M2WK..." icon={<Zap className="text-amber-500" />} />
                      </div>
                   </motion.div>
                )}

                {activeTab === "history" && (
                   <motion.div key="history" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 md:space-y-8">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                         <h3 className="max-[400px]:text-2xl text-3xl font-black italic text-zinc-950 uppercase tracking-tighter">Historial Global de <span className="text-red-600">Pagos</span></h3>
                         <div className="px-3 md:px-4 py-1.5 md:py-2 bg-zinc-950 text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase italic">{allInvoices.length} Facturas</div>
                      </div>

                      <div className="bg-white border border-zinc-100 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-xl overflow-x-auto">
                         <table className="w-full text-left min-w-[500px]">
                            <thead className="bg-zinc-50 border-b border-zinc-100">
                               <tr>
                                  <th className="max-[400px]:px-4 px-5 md:px-8 max-[400px]:py-3 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Factura</th>
                                  <th className="max-[400px]:px-4 px-5 md:px-8 max-[400px]:py-3 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Cliente</th>
                                  <th className="max-[400px]:px-4 px-5 md:px-8 max-[400px]:py-3 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Monto</th>
                                  <th className="max-[400px]:px-4 px-5 md:px-8 max-[400px]:py-3 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Comprobante</th>
                               </tr>
                            </thead>
                            <tbody>
                               {allInvoices.map((inv) => (
                                  <tr key={inv._id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                                     <td className="max-[400px]:px-4 px-5 md:px-8 max-[400px]:py-4 py-5 md:py-6">
                                        <p className="text-[10px] md:text-xs font-black text-zinc-950 italic">{inv.invoiceNumber}</p>
                                        <p className="text-[9px] md:text-[10px] text-zinc-400 font-bold">{new Date(inv.createdAt).toLocaleDateString()}</p>
                                     </td>
                                     <td className="max-[400px]:px-4 px-5 md:px-8 max-[400px]:py-4 py-5 md:py-6">
                                        <p className="text-[10px] md:text-xs font-bold text-zinc-600 italic truncate max-w-[120px] md:max-w-none">{inv.userEmail}</p>
                                     </td>
                                     <td className="max-[400px]:px-4 px-5 md:px-8 max-[400px]:py-4 py-5 md:py-6">
                                        <p className="text-xs md:text-sm font-black text-red-600 italic">{inv.currency} ${inv.amount}</p>
                                     </td>
                                     <td className="max-[400px]:px-4 px-5 md:px-8 max-[400px]:py-4 py-5 md:py-6 text-right">
                                        <motion.button whileTap={{ scale: 0.9 }}
                                           onClick={() => generateInvoicePDF(inv)}
                                           className="p-2 md:p-3 bg-zinc-50 text-zinc-400 hover:text-red-600 hover:bg-white hover:shadow-lg rounded-xl transition-all"
                                        >
                                           <Download className="w-4 h-4 md:w-5 md:h-5" />
                                        </motion.button>
                                     </td>
                                  </tr>
                               ))}
                               {allInvoices.length === 0 && (
                                  <tr>
                                     <td colSpan={4} className="max-[400px]:px-4 px-5 md:px-8 max-[400px]:py-12 py-16 md:py-20 text-center italic font-black uppercase text-zinc-200 tracking-widest text-xs md:text-sm">No hay facturas registradas</td>
                                  </tr>
                               )}
                            </tbody>
                         </table>
                      </div>
                   </motion.div>
                 )}

                {activeTab === "analytics" && (
                   <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 md:space-y-8">
                     <h3 className="max-[400px]:text-2xl text-3xl font-black italic text-zinc-950 uppercase">Analytics</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                       <div className="bg-zinc-50 max-[400px]:p-5 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-zinc-100 space-y-2 md:space-y-4">
                         <p className="text-[8px] md:text-[10px] font-black text-zinc-400 uppercase italic">Total Usuarios</p>
                         <p className="max-[400px]:text-3xl text-4xl md:text-5xl font-black italic text-zinc-950">{dashboardStats.totalUsers}</p>
                       </div>
                       <div className="bg-zinc-50 max-[400px]:p-5 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-zinc-100 space-y-2 md:space-y-4">
                         <p className="text-[8px] md:text-[10px] font-black text-zinc-400 uppercase italic">Total Tiendas</p>
                         <p className="max-[400px]:text-3xl text-4xl md:text-5xl font-black italic text-zinc-950">{dashboardStats.totalStores}</p>
                       </div>
                       <div className="bg-zinc-50 max-[400px]:p-5 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-zinc-100 space-y-2 md:space-y-4">
                         <p className="text-[8px] md:text-[10px] font-black text-zinc-400 uppercase italic">Ingresos Totales</p>
                         <p className="max-[400px]:text-3xl text-4xl md:text-5xl font-black italic text-zinc-950">${dashboardStats.totalRevenue}</p>
                       </div>
                     </div>
                   </motion.div>
                )}

                {activeTab === "revenue" && (
                  <AdminRevenuePanel />
                )}
            </AnimatePresence>
         </main>
      </div>
    </div>
  );
}

function MenuItem({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.95 }} onClick={onClick} className={cn("w-full flex items-center gap-4 max-[400px]:px-3 max-[400px]:py-3 px-4 py-4 rounded-2xl font-black text-xs md:text-sm italic transition-all", active ? "bg-red-600 text-white shadow-xl shadow-red-100" : "text-zinc-500 hover:bg-zinc-100")}>
      {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-4 h-4 md:w-5 md:h-5" })} {label}
    </motion.button>
  );
}

function StatCard({ icon, label, value, change }: any) {
  return (
    <div className="bg-white max-[400px]:p-4 p-5 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] border border-zinc-100 shadow-sm md:shadow-2xl space-y-2 md:space-y-4 hover:scale-[1.02] transition-all">
       <div className="flex items-center justify-between gap-2">
          <div className="p-2 md:p-3 bg-zinc-50 rounded-lg md:rounded-xl">{icon}</div>
          <span className="text-[7px] md:text-[9px] font-black px-1.5 md:px-2 py-0.5 md:py-1 bg-emerald-50 text-emerald-600 rounded-lg italic text-right">{change}</span>
       </div>
       <div>
          <p className="text-[7px] md:text-[9px] font-bold text-zinc-400 uppercase tracking-widest italic truncate">{label}</p>
          <p className="max-[400px]:text-xl text-xl md:text-2xl font-black text-zinc-950 italic">{value}</p>
       </div>
    </div>
  );
}

function AdminInput({ label, placeholder, type ="text", value, onChange }: any) {
   return (
      <div className="space-y-1.5">
         <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest">{label}</label>
         <input 
            type={type} 
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-12 bg-white border border-zinc-100 rounded-xl px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-red-600/50 italic"
         />
      </div>
   );
}

function ConfigBox({ label, value, icon }: any) {
   return (
      <div className="bg-zinc-50 max-[400px]:p-4 p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-zinc-100 space-y-3 md:space-y-4 shadow-sm">
         <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-white rounded-xl shadow-sm">{icon}</div>
            <span className="text-[10px] md:text-xs font-black italic text-zinc-950 uppercase truncate">{label}</span>
         </div>
         <div className="bg-white p-3 md:p-4 rounded-xl border border-zinc-100 font-mono text-[8px] md:text-[9px] text-zinc-400 break-all">{value}</div>
      </div>
   );
}

function AdminRevenuePanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/platform-revenue");
      const d = await res.json();
      setData(d);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 px-6 py-4 bg-zinc-50 rounded-2xl text-zinc-400 italic font-black text-sm">
          <Loader className="w-5 h-5 animate-spin" /> CARGANDO...
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div key="revenue" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="max-[400px]:text-2xl text-3xl font-black italic text-zinc-950 uppercase tracking-tighter">Ganancias de <span className="text-red-600">Plataforma</span></h3>
        <motion.button whileTap={{ scale: 0.9 }} onClick={fetchData} className="p-2 hover:md:p-2.5 hover:bg-zinc-50 rounded-xl transition-all">
          <RefreshCw className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" />
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
        <div className="bg-white max-[400px]:p-5 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-2 md:space-y-4">
          <div className="p-2 md:p-3 bg-red-50 rounded-lg md:rounded-xl w-fit"><DollarSign className="w-5 h-5 md:w-6 md:h-6 text-red-600" /></div>
          <p className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic">Comisiones Jandosoft</p>
          <p className="max-[400px]:text-2xl text-3xl md:text-4xl font-black italic text-zinc-950">${(data?.totalPlatformRevenue || 0).toFixed(2)}</p>
        </div>
        <div className="bg-white max-[400px]:p-5 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-2 md:space-y-4">
          <div className="p-2 md:p-3 bg-emerald-50 rounded-lg md:rounded-xl w-fit"><TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" /></div>
          <p className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic">Volumen Procesado</p>
          <p className="max-[400px]:text-2xl text-3xl md:text-4xl font-black italic text-zinc-950">${(data?.totalProcessed || 0).toFixed(2)}</p>
        </div>
        <div className="bg-white max-[400px]:p-5 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-2 md:space-y-4">
          <div className="p-2 md:p-3 bg-blue-50 rounded-lg md:rounded-xl w-fit"><ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-blue-600" /></div>
          <p className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase italic">Transacciones</p>
          <p className="max-[400px]:text-2xl text-3xl md:text-4xl font-black italic text-zinc-950">{data?.totalPayments || 0}</p>
        </div>
      </div>

      {data?.byStore && Object.keys(data.byStore).length > 0 && (
        <div className="bg-zinc-50 max-[400px]:p-5 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-zinc-100 space-y-4 md:space-y-6">
          <h4 className="max-[400px]:text-lg text-xl font-black italic text-zinc-950 uppercase tracking-tighter">Desglose por <span className="text-red-600">Tienda</span></h4>
          <div className="space-y-2 md:space-y-3">
            {Object.entries(data.byStore).map(([name, info]: any) => (
              <div key={name} className="flex items-center justify-between max-[400px]:p-3.5 p-5 bg-white rounded-2xl border border-zinc-100 hover:border-red-200 transition-all">
                <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600 shrink-0"><Store className="w-4 h-4 md:w-5 md:h-5" /></div>
                  <div className="min-w-0">
                    <p className="font-black italic text-xs md:text-sm text-zinc-950 truncate">{name}</p>
                    <p className="text-[9px] md:text-[10px] text-zinc-400 font-bold italic">{info.count} transacciones</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs md:text-sm font-black italic text-zinc-950">${info.revenue.toFixed(2)}</p>
                  <p className="text-[9px] md:text-[10px] font-black text-red-600 italic">Comisión: ${info.fees.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!data?.byStore || Object.keys(data.byStore).length === 0) && (
        <div className="py-12 md:py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">No hay transacciones registradas</div>
      )}
    </motion.div>
  );
}

function Loader({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );
}
