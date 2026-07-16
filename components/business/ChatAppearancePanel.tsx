"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { WIDGET_THEMES, applyTheme } from "@/lib/widget-themes";
import { Bot, Send, User, Palette, Sliders, Eye, Sparkles, Monitor, Smartphone, ChevronDown } from "lucide-react";

interface ChatAppearancePanelProps {
  config: Record<string, any>;
  onChange: (config: any) => void;
}

const SHADOW_PRESETS = [
  { label: "Ninguna", value: "none" },
  { label: "Sutil", value: "0 2px 8px rgba(0,0,0,0.06)" },
  { label: "Normal", value: "0 8px 40px rgba(0,0,0,0.12)" },
  { label: "Fuerte", value: "0 12px 48px rgba(0,0,0,0.2)" },
  { label: "Neón", value: "0 0 20px rgba(var(--glow), 0.3)" },
];

const FONTS = [
  { label: "Sistema", value: "" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Poppins", value: "Poppins, sans-serif" },
  { label: "DM Sans", value: "'DM Sans', sans-serif" },
  { label: "Space Grotesk", value: "'Space Grotesk', sans-serif" },
  { label: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
];

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-8 h-8 rounded-lg border-2 border-zinc-200 cursor-pointer shrink-0" />
      <div className="min-w-0">
        <p className="text-[9px] font-black text-zinc-400 uppercase italic">{label}</p>
        <p className="text-[10px] font-mono font-bold text-zinc-600 truncate">{value}</p>
      </div>
    </div>
  );
}

function RangeSlider({ label, value, min, max, unit, onChange }: { label: string; value: number; min: number; max: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[9px] font-black text-zinc-400 uppercase italic">{label}</p>
        <span className="text-[10px] font-black text-zinc-600">{value}{unit || ""}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(parseInt(e.target.value))} className="w-full accent-current" />
    </div>
  );
}

function WidgetPreview({ config }: { config: Record<string, any> }) {
  const primaryColor = config.primaryColor || "#dc2626";
  const headerBg = config.headerBgColor || primaryColor;
  const headerText = config.headerTextColor || "#ffffff";
  const botBg = config.botBubbleColor || "#f4f4f5";
  const userBg = config.userBubbleColor || primaryColor;
  const chatBg = config.chatBgColor || "#f9fafb";
  const inputBg = config.inputBgColor || "#ffffff";
  const inputBorder = config.inputBorderColor || "#e4e4e7";
  const botText = config.botTextColor || "#18181b";
  const userText = config.userTextColor || "#ffffff";
  const border = config.borderColor || "#e4e4e7";
  const radius = config.borderRadius ?? 16;
  const inputRadius = config.inputRadius ?? 12;
  const bubbleRadius = config.bubbleRadius ?? 16;
  const shadow = config.shadow || "0 8px 40px rgba(0,0,0,0.12)";
  const font = config.fontFamily || "";

  return (
    <div className="flex items-center justify-center p-4">
      <div className="w-[280px] bg-white rounded-3xl overflow-hidden flex flex-col" style={{ border: `1px solid ${border}`, borderRadius: `${radius}px`, boxShadow: shadow, fontFamily: font, height: "400px" }}>
        {/* Header */}
        <div className="px-4 py-3 flex items-center gap-2.5 shrink-0" style={{ backgroundColor: headerBg, color: headerText, borderBottom: `1px solid ${border}` }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}25` }}>
            {config.logo ? <img src={config.logo} alt="" className="w-4 h-4 object-contain" /> : <Sparkles className="w-4 h-4" />}
          </div>
          <p className="font-bold text-xs">{config.widgetHeader || "Asistente IA"}</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden px-3 pt-4 space-y-3" style={{ backgroundColor: chatBg }}>
          {/* Bot message */}
          <div className="flex items-start gap-1.5">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
              <Bot className="w-3 h-3" />
            </div>
            <div className="px-3 py-2 text-[10px] font-medium leading-relaxed max-w-[80%]" style={{ backgroundColor: botBg, color: botText, borderRadius: `${bubbleRadius}px ${bubbleRadius}px ${bubbleRadius}px 4px`, border: `1px solid ${border}` }}>
              {config.widgetWelcome || "¡Hola! Soy el asistente virtual. ¿En qué puedo ayudarte?"}
            </div>
          </div>

          {/* User message */}
          <div className="flex items-start gap-1.5 flex-row-reverse">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-zinc-200">
              <User className="w-3 h-3 text-zinc-600" />
            </div>
            <div className="px-3 py-2 text-[10px] font-medium leading-relaxed max-w-[80%]" style={{ backgroundColor: userBg, color: userText, borderRadius: `${bubbleRadius}px ${bubbleRadius}px 4px ${bubbleRadius}px` }}>
              Quiero información sobre sus servicios
            </div>
          </div>

          {/* Bot response */}
          <div className="flex items-start gap-1.5">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
              <Bot className="w-3 h-3" />
            </div>
            <div className="px-3 py-2 text-[10px] font-medium leading-relaxed max-w-[80%]" style={{ backgroundColor: botBg, color: botText, borderRadius: `${bubbleRadius}px ${bubbleRadius}px ${bubbleRadius}px 4px`, border: `1px solid ${border}` }}>
              ¡Claro! Tenemos varios servicios disponibles. ¿Te gustaría ver nuestro catálogo?
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="px-3 py-2.5 shrink-0" style={{ backgroundColor: inputBg, borderTop: `1px solid ${border}` }}>
          <div className="flex gap-1.5">
            <input type="text" readOnly placeholder={config.widgetPlaceholder || "Escribe tu pregunta..."} className="flex-1 px-3 py-1.5 text-[10px] font-medium outline-none" style={{ backgroundColor: chatBg, border: `1px solid ${inputBorder}`, borderRadius: `${inputRadius}px`, color: botText }} />
            <button className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: primaryColor, color: "#ffffff" }}>
              <Send className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatAppearancePanel({ config, onChange }: ChatAppearancePanelProps) {
  const [activeSection, setActiveSection] = useState<"themes" | "colors" | "layout" | "typography">("themes");

  const update = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  const handleThemeSelect = (themeName: string) => {
    const updated = applyTheme(config, themeName);
    onChange(updated);
  };

  const sections = [
    { id: "themes" as const, label: "Temas", icon: Palette },
    { id: "colors" as const, label: "Colores", icon: Eye },
    { id: "layout" as const, label: "Diseño", icon: Sliders },
    { id: "typography" as const, label: "Tipografía", icon: Monitor },
  ];

  return (
    <div className="space-y-4">
      {/* Theme Presets */}
      <div>
        <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest mb-3 block">Temas prediseñados</label>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {WIDGET_THEMES.map(theme => (
            <button
              key={theme.name}
              onClick={() => handleThemeSelect(theme.name)}
              className={cn(
                "flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all hover:scale-105",
                config.theme === theme.name ? "border-red-500 bg-red-50 shadow-md" : "border-zinc-100 bg-white hover:border-zinc-200"
              )}
            >
              <span className="text-lg">{theme.preview}</span>
              <span className="text-[8px] font-black text-zinc-600 uppercase italic">{theme.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 bg-zinc-100 rounded-xl p-1">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={cn("flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[9px] font-black uppercase italic transition-all", activeSection === s.id ? "bg-white text-red-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}
          >
            <s.icon className="w-3 h-3" /> {s.label}
          </button>
        ))}
      </div>

      {/* Colors Section */}
      {activeSection === "colors" && (
        <div className="space-y-4">
          <div>
            <p className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 mb-2 tracking-widest">Encabezado</p>
            <div className="grid grid-cols-2 gap-3">
              <ColorPicker label="Fondo" value={config.headerBgColor || config.primaryColor || "#dc2626"} onChange={v => update("headerBgColor", v)} />
              <ColorPicker label="Texto" value={config.headerTextColor || "#ffffff"} onChange={v => update("headerTextColor", v)} />
            </div>
          </div>
          <div>
            <p className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 mb-2 tracking-widest">Mensajes del agente</p>
            <div className="grid grid-cols-2 gap-3">
              <ColorPicker label="Fondo burbuja" value={config.botBubbleColor || "#f4f4f5"} onChange={v => update("botBubbleColor", v)} />
              <ColorPicker label="Texto" value={config.botTextColor || "#18181b"} onChange={v => update("botTextColor", v)} />
            </div>
          </div>
          <div>
            <p className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 mb-2 tracking-widest">Mensajes del usuario</p>
            <div className="grid grid-cols-2 gap-3">
              <ColorPicker label="Fondo burbuja" value={config.userBubbleColor || config.primaryColor || "#dc2626"} onChange={v => update("userBubbleColor", v)} />
              <ColorPicker label="Texto" value={config.userTextColor || "#ffffff"} onChange={v => update("userTextColor", v)} />
            </div>
          </div>
          <div>
            <p className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 mb-2 tracking-widest">Chat</p>
            <div className="grid grid-cols-2 gap-3">
              <ColorPicker label="Fondo chat" value={config.chatBgColor || "#f9fafb"} onChange={v => update("chatBgColor", v)} />
              <ColorPicker label="Borde" value={config.borderColor || "#e4e4e7"} onChange={v => update("borderColor", v)} />
            </div>
          </div>
          <div>
            <p className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 mb-2 tracking-widest">Campo de texto</p>
            <div className="grid grid-cols-2 gap-3">
              <ColorPicker label="Fondo" value={config.inputBgColor || "#ffffff"} onChange={v => update("inputBgColor", v)} />
              <ColorPicker label="Borde" value={config.inputBorderColor || "#e4e4e7"} onChange={v => update("inputBorderColor", v)} />
              <ColorPicker label="Focus" value={config.inputFocusColor || "#dc2626"} onChange={v => update("inputFocusColor", v)} />
              <ColorPicker label="Texto" value={config.inputTextColor || "#18181b"} onChange={v => update("inputTextColor", v)} />
            </div>
          </div>
          <div>
            <p className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 mb-2 tracking-widest">Marcas</p>
            <div className="grid grid-cols-2 gap-3">
              <ColorPicker label="Primario" value={config.primaryColor || "#dc2626"} onChange={v => update("primaryColor", v)} />
              <ColorPicker label="Secundario" value={config.secondaryColor || "#f5f5f5"} onChange={v => update("secondaryColor", v)} />
            </div>
          </div>
        </div>
      )}

      {/* Layout Section */}
      {activeSection === "layout" && (
        <div className="space-y-4">
          <RangeSlider label="Radio esquinas" value={config.borderRadius ?? 16} min={0} max={32} unit="px" onChange={v => update("borderRadius", v)} />
          <RangeSlider label="Radio burbujas" value={config.bubbleRadius ?? 16} min={0} max={32} unit="px" onChange={v => update("bubbleRadius", v)} />
          <RangeSlider label="Radio input" value={config.inputRadius ?? 12} min={0} max={24} unit="px" onChange={v => update("inputRadius", v)} />
          <RangeSlider label="Tamaño botón" value={config.buttonSize || 56} min={40} max={80} unit="px" onChange={v => update("buttonSize", v)} />
          <RangeSlider label="Ancho chat" value={config.chatWidth || 380} min={300} max={500} unit="px" onChange={v => update("chatWidth", v)} />
          <RangeSlider label="Alto chat" value={config.chatHeight || 540} min={400} max={700} unit="px" onChange={v => update("chatHeight", v)} />

          <div>
            <p className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 mb-2 tracking-widest">Posición del botón</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "bottom-right", label: "↓ Derecha" },
                { value: "bottom-left", label: "↓ Izquierda" },
              ].map(pos => (
                <button
                  key={pos.value}
                  onClick={() => update("buttonPosition", pos.value)}
                  className={cn("px-3 py-2 rounded-xl text-[9px] font-black uppercase italic border-2 transition-all", config.buttonPosition === pos.value ? "border-red-500 bg-red-50 text-red-600" : "border-zinc-100 text-zinc-500 hover:border-zinc-200")}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 mb-2 tracking-widest">Estilo botón</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "circle", label: "● Circular" },
                { value: "square", label: "■ Cuadrado" },
                { value: "pill", label: "▬ Pill" },
              ].map(style => (
                <button
                  key={style.value}
                  onClick={() => update("buttonStyle", style.value)}
                  className={cn("px-3 py-2 rounded-xl text-[9px] font-black uppercase italic border-2 transition-all", config.buttonStyle === style.value ? "border-red-500 bg-red-50 text-red-600" : "border-zinc-100 text-zinc-500 hover:border-zinc-200")}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 mb-2 tracking-widest">Animación</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "slide", label: "Deslizar" },
                { value: "fade", label: "Fundir" },
                { value: "scale", label: "Escalar" },
              ].map(anim => (
                <button
                  key={anim.value}
                  onClick={() => update("animationType", anim.value)}
                  className={cn("px-3 py-2 rounded-xl text-[9px] font-black uppercase italic border-2 transition-all", config.animationType === anim.value ? "border-red-500 bg-red-50 text-red-600" : "border-zinc-100 text-zinc-500 hover:border-zinc-200")}
                >
                  {anim.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 mb-2 tracking-widest">Sombra</p>
            <select
              value={config.shadow || "0 8px 40px rgba(0,0,0,0.12)"}
              onChange={e => update("shadow", e.target.value)}
              className="w-full bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 outline-none font-medium text-xs"
            >
              {SHADOW_PRESETS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Typography Section */}
      {activeSection === "typography" && (
        <div className="space-y-4">
          <div>
            <p className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 mb-2 tracking-widest">Tipografía</p>
            <div className="grid grid-cols-2 gap-2">
              {FONTS.map(f => (
                <button
                  key={f.value}
                  onClick={() => update("fontFamily", f.value)}
                  className={cn("px-3 py-2.5 rounded-xl text-[10px] font-bold border-2 transition-all text-left", config.fontFamily === f.value ? "border-red-500 bg-red-50 text-red-600" : "border-zinc-100 text-zinc-600 hover:border-zinc-200")}
                  style={{ fontFamily: f.value || "inherit" }}
                >
                  {f.label}
                  <span className="block text-[8px] text-zinc-400 font-medium mt-0.5">Aa Bb Cc</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Live Preview */}
      <div>
        <label className="text-[9px] font-black text-zinc-400 uppercase italic ml-1 tracking-widest mb-2 block">Vista previa en tiempo real</label>
        <div className="bg-zinc-100 rounded-2xl overflow-hidden border border-zinc-200">
          <WidgetPreview config={config} />
        </div>
      </div>
    </div>
  );
}
