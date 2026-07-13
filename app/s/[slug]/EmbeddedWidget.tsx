"use client";

import { useEffect } from "react";
import { StorePublicAI } from "./StorePublicAI";
import { Minus, X } from "lucide-react";

export function EmbeddedWidget({ store }: { store: any }) {
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "jandosoft_restore") {
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const handleMinimize = () => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: "jandosoft_minimize" }, "*");
    }
  };

  const handleClose = () => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: "jandosoft_close" }, "*");
    }
  };

  const primaryColor = store.agentConfig?.primaryColor || "#dc2626";

  return (
    <div className="flex flex-col h-dvh bg-white dark:bg-zinc-900">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 shrink-0 bg-white dark:bg-zinc-900">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
            <span className="text-xs font-black">{store.name?.charAt(0)?.toUpperCase() || "J"}</span>
          </div>
          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">{store.name}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={handleMinimize} className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:text-zinc-300 dark:hover:bg-zinc-800 transition-all" title="Minimizar">
            <Minus className="w-4 h-4" />
          </button>
          <button onClick={handleClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-all" title="Cerrar">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col">
        <StorePublicAI
          storeId={store._id}
          storeName={store.name}
          industry={store.industry}
          products={store.products}
          services={store.services}
          knowledgebase={store.knowledgebase}
          agentConfig={store.agentConfig}
          autoStart
          noHeader
        />
      </div>
    </div>
  );
}
