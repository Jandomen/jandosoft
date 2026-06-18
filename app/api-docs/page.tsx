"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Copy, Check, ExternalLink, ChevronDown, ChevronRight, BookOpen, Key, Server, Lock, Code, Terminal, Globe } from "lucide-react";
import Link from "next/link";

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

const ENDPOINTS = [
  {
    method: "GET", path: "/api/v1/store", color: "bg-emerald-500",
    desc: "Obtiene la información de tu tienda.",
    scopes: ["store:read"],
    example: `curl -H "Authorization: Bearer jsk_live_xxx_yyyy" \\
  https://jandosoft.com/api/v1/store`,
    response: `{
  "store": {
    "name": "Mi Tienda",
    "slug": "mi-tienda",
    "desc": "Descripción...",
    "industry": "retail",
    "type": "products",
    "isPublic": true
  }
}`,
  },
  {
    method: "GET", path: "/api/v1/products", color: "bg-blue-500",
    desc: "Lista todos los productos de tu tienda.",
    scopes: ["products:read"],
    example: `curl -H "Authorization: Bearer jsk_live_xxx_yyyy" \\
  https://jandosoft.com/api/v1/products`,
    response: `{
  "products": [
    {
      "id": "1234",
      "name": "Producto Ejemplo",
      "price": 29.99,
      "stock": 10,
      "desc": "Descripción...",
      "images": ["https://..."],
      "createdAt": "2026-06-13T..."
    }
  ]
}`,
  },
  {
    method: "POST", path: "/api/v1/products", color: "bg-blue-600",
    desc: "Crea un nuevo producto en tu tienda.",
    scopes: ["products:write"],
    example: `curl -X POST \\
  -H "Authorization: Bearer jsk_live_xxx_yyyy" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Nuevo Producto","price":49.99,"stock":5,"desc":"..."}' \\
  https://jandosoft.com/api/v1/products`,
    response: `{
  "product": {
    "id": "1235",
    "name": "Nuevo Producto",
    "price": 49.99,
    "stock": 5,
    "desc": "...",
    "images": [],
    "createdAt": "2026-06-13T..."
  }
}`,
  },
  {
    method: "GET", path: "/api/v1/customers", color: "bg-purple-500",
    desc: "Lista todos los clientes CRM de tu tienda.",
    scopes: ["customers:read"],
    example: `curl -H "Authorization: Bearer jsk_live_xxx_yyyy" \\
  https://jandosoft.com/api/v1/customers`,
    response: `{
  "customers": [
    {
      "name": "Juan Pérez",
      "email": "juan@ejemplo.com",
      "phone": "+521234567890",
      "tags": ["VIP"],
      "notes": "...",
      "createdAt": "2026-06-13T..."
    }
  ],
  "total": 1
}`,
  },
  {
    method: "GET", path: "/api/v1/orders", color: "bg-amber-500",
    desc: "Lista todos los pedidos de tu tienda.",
    scopes: ["orders:read"],
    example: `curl -H "Authorization: Bearer jsk_live_xxx_yyyy" \\
  https://jandosoft.com/api/v1/orders`,
    response: `{
  "orders": [
    {
      "id": "ord_123",
      "customer": "Juan Pérez",
      "items": [...],
      "total": 99.99,
      "status": "Pendiente",
      "createdAt": "2026-06-13T..."
    }
  ]
}`,
  },
  {
    method: "GET", path: "/api/v1/analytics", color: "bg-rose-500",
    desc: "Obtiene métricas clave de tu tienda.",
    scopes: ["analytics:read"],
    example: `curl -H "Authorization: Bearer jsk_live_xxx_yyyy" \\
  https://jandosoft.com/api/v1/analytics`,
    response: `{
  "analytics": {
    "totalViews": 1520,
    "uniqueVisitors": 342,
    "viewsToday": 18,
    "totalProducts": 25,
    "totalOrders": 47
  }
}`,
  },
];

const SCOPES = [
  { id: "products:read", label: "Leer productos" },
  { id: "products:write", label: "Crear/editar productos" },
  { id: "customers:read", label: "Leer clientes" },
  { id: "customers:write", label: "Crear/editar clientes" },
  { id: "orders:read", label: "Leer pedidos" },
  { id: "orders:write", label: "Gestionar pedidos" },
  { id: "analytics:read", label: "Ver analytics" },
  { id: "store:read", label: "Ver info de tienda" },
  { id: "store:write", label: "Editar tienda" },
];

export default function ApiDocsPage() {
  const [copied, setCopied] = useState("");
  const [openSection, setOpenSection] = useState<string | null>("intro");

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-12 md:py-20 space-y-16 italic">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-red-100">
            <Code className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black italic text-zinc-950 uppercase tracking-tighter">
            API <span className="text-red-600">Pública</span>
          </h1>
          <p className="text-zinc-500 text-sm md:text-lg max-w-2xl mx-auto font-medium">
            Integra Jandosoft con tus propias aplicaciones, automatizaciones y sistemas externos.
            <span className="block mt-1 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Disponible en plan Enterprise</span>
          </p>
        </div>

        {/* Authentication */}
        <div className="bg-zinc-50 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-zinc-100 space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-zinc-900 rounded-xl"><Key className="w-5 h-5 text-white" /></div>
            <div>
              <h2 className="text-xl md:text-2xl font-black italic text-zinc-950 uppercase">Autenticación</h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">API Key via Bearer Token</p>
            </div>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-4 md:p-6 space-y-3">
            <p className="text-[10px] font-bold text-zinc-400 uppercase italic">Formato del header</p>
            <div className="flex items-center justify-between gap-4">
              <code className="text-emerald-400 text-xs md:text-sm font-mono break-all">Authorization: Bearer jsk_live_xxx_yyyy</code>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => copyToClipboard("Authorization: Bearer jsk_live_xxx_yyyy", "auth")} className="p-2 hover:bg-zinc-800 rounded-xl transition-all shrink-0">
                {copied === "auth" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
              </motion.button>
            </div>
          </div>
          <p className="text-xs text-zinc-500 font-medium italic">Todas las peticiones requieren autenticación vía API Key en el header <code className="text-red-600 font-bold">Authorization</code>.</p>
        </div>

        {/* Scopes */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl"><Lock className="w-5 h-5 text-amber-600" /></div>
            <div>
              <h2 className="text-xl md:text-2xl font-black italic text-zinc-950 uppercase">Permisos <span className="text-amber-600">(Scopes)</span></h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">Control de acceso por API key</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SCOPES.map((scope) => (
              <div key={scope.id} className="flex items-center gap-2 bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-xs font-black italic text-zinc-950">{scope.id}</p>
                  <p className="text-[8px] font-bold text-zinc-400 uppercase italic">{scope.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Endpoints */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl"><Server className="w-5 h-5 text-emerald-600" /></div>
            <div>
              <h2 className="text-xl md:text-2xl font-black italic text-zinc-950 uppercase">Endpoints</h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">Base URL: https://jandosoft.com</p>
            </div>
          </div>

          <div className="space-y-4">
            {ENDPOINTS.map((ep, i) => (
              <motion.div
                key={ep.path}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white border border-zinc-100 rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all"
              >
                <button
                  onClick={() => setOpenSection(openSection === ep.path ? null : ep.path)}
                  className="w-full flex items-center justify-between p-4 md:p-6 text-left"
                >
                  <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                    <span className={cn("px-2.5 py-1 rounded-lg text-[9px] md:text-[10px] font-black text-white uppercase shrink-0", ep.color)}>{ep.method}</span>
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-black italic text-zinc-950 truncate">{ep.path}</p>
                      <p className="text-[9px] md:text-[10px] text-zinc-400 font-medium italic truncate">{ep.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="hidden md:flex items-center gap-1.5">
                      {ep.scopes.map((s) => (
                        <span key={s} className="text-[7px] px-1.5 py-0.5 bg-zinc-100 text-zinc-500 rounded-md uppercase font-bold">{s}</span>
                      ))}
                    </div>
                    {openSection === ep.path ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
                  </div>
                </button>

                {openSection === ep.path && (
                  <div className="px-4 md:px-6 pb-4 md:pb-6 space-y-4 border-t border-zinc-100 pt-4">
                    <div className="bg-zinc-900 rounded-2xl p-4 md:p-6 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase italic"><Terminal className="w-3 h-3 inline mr-1" /> Ejemplo</span>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => copyToClipboard(ep.example, ep.path)} className="p-1.5 hover:bg-zinc-800 rounded-lg transition-all">
                          {copied === ep.path ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                        </motion.button>
                      </div>
                      <pre className="text-emerald-400 text-[10px] md:text-xs font-mono overflow-x-auto whitespace-pre-wrap">{ep.example}</pre>
                    </div>
                    <div className="bg-zinc-50 rounded-2xl p-4 md:p-6 space-y-2 border border-zinc-100">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase italic"><BookOpen className="w-3 h-3 inline mr-1" /> Respuesta</span>
                      </div>
                      <pre className="text-zinc-700 text-[10px] md:text-xs font-mono overflow-x-auto whitespace-pre-wrap">{ep.response}</pre>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* SDK / Code examples */}
        <div className="bg-zinc-50 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-zinc-100 space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl"><Globe className="w-5 h-5 text-blue-600" /></div>
            <div>
              <h2 className="text-xl md:text-2xl font-black italic text-zinc-950 uppercase">Ejemplos por <span className="text-blue-600">Lenguaje</span></h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">JavaScript, Python, cURL</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                lang: "JavaScript",
                icon: <Terminal className="w-4 h-4" />,
                code: `const res = await fetch(
  "https://jandosoft.com/api/v1/products",
  { headers: { Authorization: "Bearer jsk_live_xxx" } }
);
const data = await res.json();
console.log(data.products);`,
              },
              {
                lang: "Python",
                icon: <Terminal className="w-4 h-4" />,
                code: `import requests

headers = {
  "Authorization": "Bearer jsk_live_xxx"
}
res = requests.get(
  "https://jandosoft.com/api/v1/products",
  headers=headers
)
data = res.json()
print(data["products"])`,
              },
              {
                lang: "cURL",
                icon: <Terminal className="w-4 h-4" />,
                code: `curl -H "Authorization: Bearer jsk_live_xxx" \\
  https://jandosoft.com/api/v1/products`,
              },
            ].map((sdk) => (
              <div key={sdk.lang} className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-100 flex items-center gap-2">
                  <div className="w-6 h-6 bg-zinc-900 rounded-lg flex items-center justify-center text-white">{sdk.icon}</div>
                  <span className="text-xs font-black italic text-zinc-950">{sdk.lang}</span>
                </div>
                <pre className="p-4 text-[9px] md:text-[10px] font-mono text-zinc-700 overflow-x-auto">{sdk.code}</pre>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-6 pt-8 border-t border-zinc-100">
          <p className="text-xs text-zinc-400 font-medium italic">
            ¿Necesitas ayuda con la integración? Revisa la documentación o contacta a soporte.
          </p>
          <Link href="/">
            <motion.button whileTap={{ scale: 0.97 }} className="px-8 py-4 bg-zinc-950 text-white rounded-2xl font-black text-xs italic hover:bg-zinc-800 transition-all shadow-xl inline-flex items-center gap-2 uppercase tracking-wider">
              Volver a Jandosoft <ExternalLink className="w-3.5 h-3.5" />
            </motion.button>
          </Link>
        </div>
      </div>
    </div>
  );
}
