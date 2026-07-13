"use client";

import { StorePublicAI } from "../StorePublicAI";

export function ChatEmbed({ store, isEmbed }: { store: any; isEmbed?: boolean }) {
  return (
    <div className={`bg-white dark:bg-zinc-900 ${isEmbed ? "h-full w-full" : "w-full max-w-[340px] h-[520px] max-[640px]:h-[100dvh] max-[640px]:max-w-full rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden"}`}>
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
        fillHeight
      />
    </div>
  );
}
