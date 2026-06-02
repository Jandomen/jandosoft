"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

function extractText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join(" ");
  if (React.isValidElement(node)) {
    const p = node.props as any;
    if (p?.children) return extractText(p.children);
    if (p?.href) return p.href;
  }
  return "";
}

function detectEntityIcon(headers: string[]): string {
  const joined = headers.join(" ").toLowerCase();
  if (joined.includes("cliente") || joined.includes("customer")) return "👤";
  if (joined.includes("producto") || joined.includes("product") || joined.includes("precio")) return "📦";
  if (joined.includes("pedido") || joined.includes("order") || joined.includes("orden")) return "📋";
  if (joined.includes("venta") || joined.includes("sale") || joined.includes("invoice")) return "💰";
  if (joined.includes("usuario") || joined.includes("user") || joined.includes("email")) return "👥";
  if (joined.includes("proveedor") || joined.includes("supplier")) return "🏢";
  if (joined.includes("tarea") || joined.includes("task")) return "✅";
  return "📌";
}

function detectCardTitle(headers: string[]): string {
  const firstHeader = headers[0]?.toLowerCase() || "";
  const entityMap: Record<string, string> = {
    cliente: "Cliente",
    customer: "Customer",
    producto: "Producto",
    product: "Product",
    pedido: "Pedido",
    order: "Order",
    venta: "Venta",
    sale: "Sale",
    usuario: "Usuario",
    user: "User",
    nombre: "Registro",
    name: "Record",
  };
  for (const [key, label] of Object.entries(entityMap)) {
    if (firstHeader.includes(key)) return label;
  }
  return "Detalle";
}

function detectCardColor(headers: string[]): string {
  const joined = headers.join(" ").toLowerCase();
  if (joined.includes("cliente") || joined.includes("customer")) return "from-blue-50 to-white border-blue-100/50";
  if (joined.includes("producto") || joined.includes("product")) return "from-amber-50 to-white border-amber-100/50";
  if (joined.includes("pedido") || joined.includes("order")) return "from-violet-50 to-white border-violet-100/50";
  if (joined.includes("venta") || joined.includes("sale") || joined.includes("invoice")) return "from-emerald-50 to-white border-emerald-100/50";
  if (joined.includes("usuario") || joined.includes("user")) return "from-cyan-50 to-white border-cyan-100/50";
  return "from-zinc-50 to-white border-zinc-100";
}

function detectBadgeColor(headers: string[]): string {
  const joined = headers.join(" ").toLowerCase();
  if (joined.includes("cliente") || joined.includes("customer")) return "bg-blue-500 text-white";
  if (joined.includes("producto") || joined.includes("product")) return "bg-amber-500 text-white";
  if (joined.includes("pedido") || joined.includes("order")) return "bg-violet-500 text-white";
  if (joined.includes("venta") || joined.includes("sale") || joined.includes("invoice")) return "bg-emerald-500 text-white";
  if (joined.includes("usuario") || joined.includes("user")) return "bg-cyan-500 text-white";
  return "bg-zinc-500 text-white";
}

function TableCards({ children }: { children?: React.ReactNode }) {
  const headers: string[] = [];
  const rows: string[][] = [];

  const childArr = React.Children.toArray(children);
  for (const child of childArr) {
    if (!React.isValidElement(child)) continue;
    const el = child as React.ReactElement<{ children?: React.ReactNode }>;
    const tag = typeof el.type === "string" ? el.type : "";

    if (tag === "thead" || tag === "tbody") {
      const trArr = React.Children.toArray(el.props.children);
      for (const tr of trArr) {
        if (!React.isValidElement(tr)) continue;
        const trEl = tr as React.ReactElement<{ children?: React.ReactNode }>;
        const cells: string[] = [];
        const tdArr = React.Children.toArray(trEl.props.children);
        for (const td of tdArr) {
          if (React.isValidElement(td)) {
            const tdEl = td as React.ReactElement<{ children?: React.ReactNode }>;
            cells.push(extractText(tdEl.props.children));
          }
        }

        if (tag === "thead") {
          headers.push(...cells);
        } else if (cells.length > 0) {
          rows.push(cells);
        }
      }
    }

    if (tag === "tr") {
      const cells: string[] = [];
      const tdArr = React.Children.toArray(el.props.children);
      for (const td of tdArr) {
        if (React.isValidElement(td)) {
          const tdEl = td as React.ReactElement<{ children?: React.ReactNode }>;
          cells.push(extractText(tdEl.props.children));
        }
      }
      if (cells.length > 0) rows.push(cells);
    }
  }

  if (rows.length === 0) return null;

  const entityIcon = detectEntityIcon(headers);
  const cardTitle = detectCardTitle(headers);
  const cardColor = detectCardColor(headers);
  const badgeColor = detectBadgeColor(headers);
  const hasHeaders = headers.length > 0;

  return (
    <div className="grid gap-2.5 my-4">
      {rows.map((row, i) => (
        <div
          key={i}
          className={cn(
            "rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md",
            "bg-gradient-to-br", cardColor
          )}
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-inherit/50">
            <div className="flex items-center gap-2">
              <span className="text-base">{entityIcon}</span>
              <span className="text-[10px] font-black italic text-zinc-500 uppercase tracking-wider">
                {cardTitle} {hasHeaders ? `#${i + 1}` : ""}
              </span>
            </div>
            <span className={cn("text-[8px] font-black italic uppercase tracking-widest px-2 py-0.5 rounded-full", badgeColor)}>
              {cardTitle}
            </span>
          </div>
          <div className="px-4 py-3 space-y-1.5">
            {hasHeaders
              ? row.map((cell, j) => (
                  <div
                    key={j}
                    className="flex items-baseline gap-2 text-[13px] leading-relaxed"
                  >
                    <span className="font-bold text-zinc-400 uppercase text-[10px] tracking-wider shrink-0 min-w-[70px]">
                      {headers[j] || `#${j + 1}`}:
                    </span>
                    <span className="text-zinc-800 font-medium break-words min-w-0">
                      {cell}
                    </span>
                  </div>
                ))
              : row.map((cell, j) => (
                  <div
                    key={j}
                    className="text-[13px] text-zinc-800 font-medium leading-relaxed"
                  >
                    {cell}
                  </div>
                ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CodeBlock({ children, className, ...props }: any) {
  const isInline = !className;
  if (isInline) {
    return (
      <code
        className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded-md text-[12px] font-mono border border-red-100"
        {...props}
      >
        {children}
      </code>
    );
  }
  return (
    <pre className="overflow-x-auto rounded-xl bg-zinc-950 p-4 text-[13px] leading-relaxed border border-zinc-800 shadow-lg">
      <code className="text-zinc-100 font-mono" {...props}>
        {children}
      </code>
    </pre>
  );
}

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose-custom max-w-full overflow-wrap-anywhere text-[13px] md:text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: TableCards,
          thead: ({ children }) => <>{children}</>,
          tbody: ({ children }) => <>{children}</>,
          tr: ({ children }) => <>{children}</>,
          th: ({ children }) => <>{children}</>,
          td: ({ children }) => <>{children}</>,
          h1: ({ children, ...props }) => (
            <h1 className="text-base md:text-lg font-black italic text-zinc-950 mt-5 mb-2 tracking-tight" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-sm md:text-base font-black italic text-zinc-950 mt-4 mb-2 tracking-tight flex items-center gap-2" {...props}>
              <span className="w-1 h-4 bg-red-500 rounded-full inline-block" />
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-[13px] md:text-sm font-black italic text-zinc-950 mt-3 mb-1.5 tracking-tight" {...props}>
              {children}
            </h3>
          ),
          p: ({ children, ...props }) => (
            <p className="my-2 text-[13px] md:text-sm leading-relaxed text-zinc-700" {...props}>
              {children}
            </p>
          ),
          ul: ({ children, ...props }) => (
            <ul className="my-2 space-y-1 pl-4" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="my-2 space-y-1 pl-4 list-decimal" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="text-[13px] md:text-sm leading-relaxed text-zinc-700 marker:text-red-400" {...props}>
              {children}
            </li>
          ),
          strong: ({ children, ...props }) => (
            <strong className="font-black italic text-zinc-950" {...props}>
              {children}
            </strong>
          ),
          em: ({ children, ...props }) => (
            <em className="italic text-zinc-600" {...props}>
              {children}
            </em>
          ),
          code: CodeBlock,
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="my-3 pl-4 border-l-[3px] border-red-300 text-zinc-600 text-[13px] md:text-sm italic leading-relaxed"
              {...props}
            >
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-4 border-t border-zinc-100" />,
          a: ({ children, href, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600 underline font-medium hover:text-red-700 transition-colors"
              {...props}
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
