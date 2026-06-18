"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Users, MessageSquare } from "lucide-react";
import CustomersPanel from "./CustomersPanel";
import CommunicationsPanel from "./CommunicationsPanel";

export default function CrmPanel({ storeId }: { storeId: string }) {
  const [crmTab, setCrmTab] = useState<"customers" | "comms">("customers");

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 md:mb-6 border-b border-zinc-100 pb-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setCrmTab("customers")}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] md:text-xs font-black italic transition-all",
            crmTab === "customers" ? "bg-red-600 text-white shadow-md" : "text-zinc-500 hover:bg-zinc-100"
          )}
        >
          <Users className="w-3.5 h-3.5" /> Clientes
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setCrmTab("comms")}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] md:text-xs font-black italic transition-all",
            crmTab === "comms" ? "bg-red-600 text-white shadow-md" : "text-zinc-500 hover:bg-zinc-100"
          )}
        >
          <MessageSquare className="w-3.5 h-3.5" /> Comunicaciones
        </motion.button>
      </div>
      {crmTab === "customers" ? <CustomersPanel storeId={storeId} /> : <CommunicationsPanel storeId={storeId} />}
    </div>
  );
}
