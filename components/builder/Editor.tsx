"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { 
  Plus, 
  Trash2, 
  Video, 
  Image as ImageIcon, 
  Type, 
  Save, 
  Layout, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause,
  X,
  Download,
  MousePointer2,
  Database as DbIcon,
  Globe,
  Zap,
  ShieldCheck,
  Smartphone,
  Tablet,
  Monitor,
  Code2,
  Terminal,
  Layers as LayersIcon,
  FileCode2,
  Server as ServerIcon,
  CreditCard,
  Grid,
  Menu,
  Box,
  Square,
  Move,
  ArrowUpRight,
  Maximize2,
  FileSearch,
  CheckSquare,
  Folder,
  HardDrive,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  Cloud,
  Activity,
  Cpu,
  BarChart3,
  TrendingUp,
  User,
  Copy,
  ChevronUp,
  ChevronDown,
  Info,
  Search,
  Settings2,
  Sliders,
  PlayCircle,
  Repeat,
  Volume2,
  VolumeX,
  ZapOff,
  Files,
  Scissors,
  Mic,
  FastForward,
  Clock,
  Music,
  Maximize,
  LayoutList,
  PanelTop,
  TableProperties,
  Command,
  Braces,
  GitGraph,
  Share2,
  CheckCircle2,
  Loader2,
  PenTool,
  ArrowRightToLine,
  ArrowLeftFromLine,
  GitBranch,
  TerminalSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

type ElementType = "text" | "image" | "video" | "button" | "navbar" | "footer" | "terminal" | "code-block" | "api-card" | "pricing" | "chart" | "form" | "server" | "avatar" | "logic-input" | "logic-output";

interface ResponsiveStyles {
  x: number;
  y: number;
  width: number | string;
  height: number | string;
  fontSize?: string;
  backgroundColor?: string;
  color?: string;
  borderRadius?: string;
  padding?: string;
  opacity?: number;
  zoom?: number;
  rotate?: number;
  zIndex?: number;
}

interface Element {
  id: string;
  name: string;
  type: ElementType;
  content: string;
  isVisible: boolean;
  isLocked: boolean;
  styles: {
    desktop: ResponsiveStyles;
    mobile?: Partial<ResponsiveStyles>;
  };
  mediaConfig?: {
     blur: number;
     grayscale: number;
     brightness: number;
     loop: boolean;
     muted: boolean;
     autoplay: boolean;
     volume: number;
     playbackRate: number;
     startTime: number;
     endTime: number;
  };
}

interface Page { id: string; name: string; elements: Element[]; }

export default function Editor({ isPremium, onTogglePremium }: { isPremium: boolean; onTogglePremium: () => void; }) {
  const { showToast, ToastComponent } = useToast();
  const [pages, setPages] = useState<Page[]>([{ id: "1", name: "Página 1", elements: [] }]);
  const [activePageId, setActivePageId] = useState("1");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, id: string } | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"blocks" | "layers" | "props" | "mixing">("blocks");
  const [isProVideoEditorOpen, setIsProVideoEditorOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  const [deployProgress, setDeployProgress] = useState(0);

  // TIMELINE STATE
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [totalDuration, setTotalDuration] = useState(60);

  const activePage = pages.find(p => p.id === activePageId)!;
  const selectedElement = activePage.elements.find(e => e.id === selectedElementId);

  const canvasScale = useMemo(() => {
    if (viewMode === "mobile") return 0.8;
    return 0.95;
  }, [viewMode]);

  const resolveStyle = useCallback((element: Element, mode: "desktop" | "mobile") => {
    const d = element.styles.desktop;
    const m = element.styles.mobile || {};
    if (mode === "mobile") return { ...d, ...m };
    return d;
  }, []);

  const addElement = (type: ElementType) => {
    let content = "Nuevo Item";
    const baseStyleByElement: Record<string, Partial<ResponsiveStyles>> = {
        navbar: { x: 0, y: 0, width: "100%", height: 80, backgroundColor: "#ffffff", borderRadius: "0px", zIndex: 100 },
        footer: { x: 0, y: 800, width: "100%", height: 120, backgroundColor: "#09090b", color: "#ffffff", borderRadius: "0px" },
        logic_input: { width: 250, height: 80 },
        logic_output: { width: 250, height: 80 },
    };

    const baseStyle: ResponsiveStyles = { 
        x: 150, y: 150, width: 300, height: 180, opacity: 1, zIndex: activePage.elements.length + 1,
        ...(baseStyleByElement[type] || {})
    };
    
    const newElement: Element = {
      id: Math.random().toString(36).substr(2, 9),
      name: `${type.toUpperCase()} ${activePage.elements.length + 1}`,
      type,
      content,
      isVisible: true,
      isLocked: false,
      styles: {
        desktop: baseStyle,
        mobile: { ...baseStyle, width: typeof baseStyle.width === 'number' ? baseStyle.width * 0.9 : "100%", x: 20 }
      },
      mediaConfig: { blur: 0, grayscale: 0, brightness: 100, loop: true, muted: true, autoplay: true, volume: 1, playbackRate: 1, startTime: 0, endTime: 10 }
    };

    if (type === "video") newElement.content = "https://cdn.pixabay.com/video/2018/07/20/17435-280425028_tiny.mp4";
    if (type === "image") newElement.content = "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800";
    if (type === "logic-input") newElement.content = "dato_entrada";
    if (type === "logic-output") newElement.content = "Hola Mundo!";

    setPages(pages.map(p => p.id === activePageId ? { ...p, elements: [...p.elements, newElement] } : p));
    setSelectedElementId(newElement.id);
    showToast(`${type.toUpperCase()} desplegado exitosamente.`, "success");
  };

  const updateElementPosition = (id: string, x: number, y: number) => {
    setPages(pages.map(p => p.id === activePageId ? {
      ...p,
      elements: p.elements.map(el => el.id === id ? {
        ...el,
        styles: { ...el.styles, [viewMode]: { ...(el.styles[viewMode] || el.styles.desktop), x, y } }
      } : el)
    } : p));
  };

  const updateSelectedElementStyle = (newStyles: Partial<ResponsiveStyles>) => {
    if (!selectedElementId) return;
    setPages(pList => pList.map(p => p.id === activePageId ? {
      ...p,
      elements: p.elements.map(e => e.id === selectedElementId ? {
        ...e,
        styles: { ...e.styles, [viewMode]: { ...(e.styles[viewMode] || e.styles.desktop), ...newStyles } }
      } : e)
    } : p));
  };

  const updateMediaConfig = (newConfig: Partial<NonNullable<Element["mediaConfig"]>>) => {
     if (!selectedElementId) return;
     setPages(pList => pList.map(p => p.id === activePageId ? {
        ...p,
        elements: p.elements.map(e => e.id === selectedElementId ? { ...e, mediaConfig: { ...e.mediaConfig!, ...newConfig } } : e)
     } : p));
  };

  const duplicateElement = (id: string) => {
    const el = activePage.elements.find(e => e.id === id);
    if (!el) return;
    const newEl = JSON.parse(JSON.stringify(el));
    newEl.id = Math.random().toString(36).substr(2, 9);
    newEl.name += " COPIA";
    newEl.styles.desktop.x += 20;
    newEl.styles.desktop.y += 20;
    setPages(pages.map(p => p.id === activePageId ? { ...p, elements: [...p.elements, newEl] } : p));
    setSelectedElementId(newEl.id);
  };

  const startDeployment = async () => {
     setIsDeploying(true);
     setDeployLogs([]);
     setDeployProgress(0);
     const steps = [
        { log: "[BOOT] Cloud worker ready.", delay: 800 },
        { log: "[BUILD] Bundling assets...", delay: 1000 },
        { log: "[UPLOAD] Subiendo a Jandosoft West Edge...", delay: 1200 },
        { log: "[SSL] SSL Activated.", delay: 500 },
        { log: "[SUCCESS] Application live!", delay: 300 }
     ];
     for (let i = 0; i < steps.length; i++) {
        await new Promise(r => setTimeout(r, steps[i].delay));
        setDeployLogs(prev => [...prev, steps[i].log]);
        setDeployProgress(((i + 1) / steps.length) * 100);
     }
  };

  useEffect(() => {
    let interval: any;
    if (isPlaying) interval = setInterval(() => setCurrentTime(prev => (prev + 0.1) % totalDuration), 100);
    return () => clearInterval(interval);
  }, [isPlaying, totalDuration]);

  useEffect(() => {
    const hideMenu = () => setContextMenu(null);
    window.addEventListener('click', hideMenu);
    return () => window.removeEventListener('click', hideMenu);
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-[#fbfbfb] relative overflow-hidden font-sans no-scrollbar">
      {/* Header IDE */}
      <div className="h-16 md:h-20 bg-white border-b border-zinc-100 flex items-center justify-between max-[400px]:px-3 px-4 md:px-8 z-50">
        <div className="flex items-center gap-2 md:gap-6 min-w-0">
           <div className="p-2 md:p-3 bg-zinc-950 rounded-xl md:rounded-2xl text-white shadow-xl shadow-zinc-950/20 shrink-0"><ShieldCheck className="w-4 h-4 md:w-6 md:h-6" /></div>
           <div className="min-w-0">
              <h2 className="text-xs md:text-lg font-black italic uppercase tracking-tighter leading-none truncate">Jandosoft <span className="text-red-600 font-extrabold italic">IDE</span></h2>
              <p className="hidden md:block text-[10px] font-black text-zinc-300 uppercase tracking-widest mt-1.5 italic">Logic & Media Engine v6.3</p>
           </div>
           <div className="hidden md:flex items-center gap-1 bg-zinc-50 border border-zinc-100 p-1 rounded-2xl ml-6">
              <DeviceBtn active={viewMode === 'desktop'} onClick={() => setViewMode('desktop')} icon={<Monitor className="w-4 h-4" />} />
              <DeviceBtn active={viewMode === 'mobile'} onClick={() => setViewMode('mobile')} icon={<Smartphone className="w-4 h-4" />} />
           </div>
        </div>

        <div className="flex items-center gap-1 md:gap-4">
           {isProVideoEditorOpen && (
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setIsProVideoEditorOpen(false)} className="hidden md:flex px-6 py-3 bg-zinc-50 text-zinc-600 rounded-2xl text-[10px] font-black italic border border-zinc-100 uppercase">Cerrar Video Editor</motion.button>
           )}
           <div className="flex md:hidden items-center gap-1 bg-zinc-50 border border-zinc-100 p-1 rounded-xl">
              <DeviceBtn active={viewMode === 'desktop'} onClick={() => setViewMode('desktop')} icon={<Monitor className="w-3.5 h-3.5" />} />
              <DeviceBtn active={viewMode === 'mobile'} onClick={() => setViewMode('mobile')} icon={<Smartphone className="w-3.5 h-3.5" />} />
           </div>
           <motion.button whileTap={{ scale: 0.95 }} onClick={() => setIsPreview(!isPreview)} className={cn("flex items-center gap-1 md:gap-3 max-[400px]:px-3 px-4 md:px-8 py-2 md:py-3 rounded-2xl text-[9px] md:text-[11px] font-black transition-all italic uppercase shadow-md shadow-zinc-950/5", isPreview ? "bg-red-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-950 hover:text-white")}>
              {isPreview ? <Maximize className="w-3 h-3 md:w-4 md:h-4" /> : <Play className="w-3 h-3 md:w-4 md:h-4" />} <span className="hidden md:inline">{isPreview ? "DISEÑO" : "VISTA PREVIA"}</span>
           </motion.button>
           <motion.button whileTap={{ scale: 0.95 }} onClick={startDeployment} className="flex items-center gap-1 md:gap-3 max-[400px]:px-3 px-4 md:px-8 py-2 md:py-3 bg-zinc-950 text-white rounded-2xl text-[9px] md:text-[11px] font-black shadow-2xl">
              <Cloud className="w-3 h-3 md:w-4 md:h-4" /> <span className="hidden md:inline">DESPLEGAR</span>
           </motion.button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {!isPreview && (
          <aside className="w-full md:w-80 bg-white border-r border-zinc-100 max-[400px]:p-4 p-4 md:p-8 flex flex-col gap-8 z-40 overflow-y-auto no-scrollbar">
            <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-100 p-1 rounded-2xl shadow-inner">
               <TabBtn active={sidebarTab === 'blocks'} onClick={() => setSidebarTab('blocks')} icon={<Grid className="w-4 h-4" />} />
               <TabBtn active={sidebarTab === 'layers'} onClick={() => setSidebarTab('layers')} icon={<LayersIcon className="w-4 h-4" />} />
               <TabBtn active={sidebarTab === 'props'} onClick={() => setSidebarTab('props')} icon={<Sliders className="w-4 h-4" />} />
            </div>

            {sidebarTab === 'blocks' && (
               <div className="space-y-10 animate-in slide-in-from-left-4 duration-500">
                  <Category label="BASIC COMPONENTS">
                      <ToolButton icon={<Type />} label="Texto" onClick={() => addElement("text")} />
                      <ToolButton icon={<ImageIcon />} label="Imagen" onClick={() => addElement("image")} />
                      <ToolButton icon={<Video />} label="Video" onClick={() => addElement("video")} />
                      <ToolButton icon={<Code2 />} label="Botón" onClick={() => addElement("button")} />
                  </Category>
                  <Category label="PROG. LOGIC (PSeInt)">
                      <ToolButton icon={<ArrowRightToLine className="text-amber-500" />} label="Leer Datos" onClick={() => addElement("logic-input")} />
                      <ToolButton icon={<ArrowLeftFromLine className="text-blue-500" />} label="Escribir" onClick={() => addElement("logic-output")} />
                      <ToolButton icon={<TerminalSquare />} label="Terminal" onClick={() => addElement("terminal")} />
                  </Category>
                  <Category label="WEB UI BLOCKS">
                      <ToolButton icon={<PanelTop />} label="Navbar" onClick={() => addElement("navbar")} />
                      <ToolButton icon={<LayoutList />} label="Footer" onClick={() => addElement("footer")} />
                      <ToolButton icon={<CreditCard />} label="Pricing" onClick={() => addElement("pricing")} />
                  </Category>
               </div>
            )}

            {sidebarTab === 'props' && selectedElement && (
               <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                  <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 space-y-4">
                     <h4 className="text-[10px] font-black uppercase text-red-600 italic tracking-widest">PROPS: {selectedElement.type}</h4>
                     <p className="text-[10px] font-black text-zinc-400">ID: {selectedElement.id}</p>
                  </div>

                  {/* MULTIMEDIA SOURCE EDITOR */}
                  {(selectedElement.type === "video" || selectedElement.type === "image") && (
                     <div className="bg-zinc-950 p-6 rounded-3xl space-y-6 text-white shadow-2xl">
                        <div className="flex items-center gap-3 text-red-600"><Globe className="w-4 h-4" /><h4 className="text-[10px] font-black uppercase italic tracking-widest">SOURCE SETTINGS</h4></div>
                        <div className="space-y-3">
                           <label className="text-[9px] font-black uppercase italic text-zinc-500">URL de Multimedia</label>
                           <textarea 
                              value={selectedElement.content} 
                              onChange={(e) => setPages(pages.map(p => ({ ...p, elements: p.elements.map(el => el.id === selectedElementId ? { ...el, content: e.target.value } : el) })))} 
                              className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-[11px] font-mono text-emerald-400 outline-none focus:ring-2 focus:ring-red-600/30 min-h-[100px]" 
                              placeholder="Pega tu link aqui..."
                           />
                        </div>
                        {selectedElement.type === "video" && <button onClick={() => setIsProVideoEditorOpen(true)} className="w-full py-3 bg-red-600/10 text-red-600 border border-red-600/20 rounded-2xl text-[10px] font-black uppercase italic">Abrir Video Editor Pro</button>}
                     </div>
                  )}

                  <div className="space-y-4">
                     <h3 className="text-[10px] font-black text-zinc-400 uppercase italic tracking-widest">DIMENSIONES</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <PropInput label="Width" value={resolveStyle(selectedElement, viewMode).width} onChange={(v: any) => updateSelectedElementStyle({ width: isNaN(v) ? v : Number(v) })} />
                        <PropInput label="Height" value={resolveStyle(selectedElement, viewMode).height} onChange={(v: any) => updateSelectedElementStyle({ height: isNaN(v) ? v : Number(v) })} />
                     </div>
                  </div>

                  {/* CONTENT TEXT EDITOR */}
                  {(selectedElement.type !== "video" && selectedElement.type !== "image") && (
                     <div className="space-y-4 pt-4 border-t border-zinc-100">
                        <label className="text-[10px] font-black text-zinc-400 uppercase italic tracking-widest">DATA CONTENT</label>
                        <textarea value={selectedElement.content} onChange={(e) => setPages(pages.map(p => p.id === activePageId ? { ...p, elements: p.elements.map(el => el.id === selectedElementId ? { ...el, content: e.target.value } : el) } : p))} className="w-full bg-white border border-zinc-100 rounded-2xl p-4 text-xs font-black outline-none italic min-h-[100px]" />
                     </div>
                  )}
               </div>
            )}
          </aside>
        )}

        <main className="flex-1 bg-zinc-50 relative overflow-hidden flex flex-col no-scrollbar">
          <div className="flex-1 relative overflow-auto max-[400px]:p-4 p-6 md:p-24 flex items-center justify-center no-scrollbar">
             <motion.div id="canvas" animate={{ width: viewMode === 'desktop' ? 1200 : 340, scale: canvasScale }} className="bg-white shadow-4xl relative min-h-[1000px] border border-zinc-200 overflow-hidden" onClick={() => setSelectedElementId(null)}>
                {activePage.elements.map((el) => el.isVisible && (
                   <DraggableElement 
                     key={el.id} 
                     element={el} 
                     resolvedStyle={resolveStyle(el, viewMode)} 
                     onSelect={() => !isPreview && setSelectedElementId(el.id)} 
                     onPositionChange={(x: number, y: number) => updateElementPosition(el.id, x, y)} 
                     onContextMenu={(e: any) => { if (isPreview) return; e.preventDefault(); setSelectedElementId(el.id); setContextMenu({ x: e.clientX, y: e.clientY, id: el.id }); }} 
                     isSelected={selectedElementId === el.id} 
                     isPreview={isPreview} 
                     currentTime={currentTime}
                   />
                ))}
                {!isPreview && <div className="absolute inset-0 pointer-events-none opacity-30" style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }} />}
             </motion.div>
          </div>

          <AnimatePresence>
             {isProVideoEditorOpen && (
                <motion.div initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }} className="h-44 bg-zinc-950/95 backdrop-blur-3xl border-t border-white/5 flex flex-col z-[100] px-12 py-6 relative">
                   <div className="flex items-center gap-8 mb-4">
                      <button onClick={() => setIsPlaying(!isPlaying)} className="p-4 bg-red-600 text-white rounded-full"><Pause className="w-6 h-6" /></button>
                      <div className="flex-1 space-y-3">
                         <div className="text-[10px] font-black text-zinc-500 uppercase italic">Timeline Hub - {currentTime.toFixed(1)}s</div>
                         <div className="h-2 bg-zinc-800 rounded-full overflow-hidden relative"><motion.div animate={{ width: `${(currentTime/totalDuration)*100}%` }} className="absolute h-full bg-red-600" /></div>
                      </div>
                   </div>
                </motion.div>
             )}
          </AnimatePresence>
        </main>
      </div>

      {/* CONTEXT MENU */}
      <AnimatePresence>
         {contextMenu && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ left: contextMenu.x, top: contextMenu.y }} className="fixed z-[300] bg-white border border-zinc-100 rounded-[2rem] shadow-4xl p-2 min-w-[220px]">
               <ContextItem icon={<PenTool className="w-4 h-4 text-zinc-950" />} label={`Editar ${activePage.elements.find(e => e.id === contextMenu.id)?.type.toUpperCase()}`} onClick={() => { setSidebarTab('props'); setContextMenu(null); }} />
               <ContextItem icon={<Copy className="w-4 h-4 text-emerald-500" />} label="Duplicate" onClick={() => duplicateElement(contextMenu.id)} />
               <ContextItem icon={<Trash2 className="w-4 h-4 text-rose-500" />} label="Eliminar" onClick={() => { setPages(pages.map(p => ({ ...p, elements: p.elements.filter(e => e.id !== contextMenu.id) }))); setContextMenu(null); }} />
            </motion.div>
         )}
      </AnimatePresence>

      <AnimatePresence>
         {isDeploying && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[600] bg-zinc-950 flex flex-col p-12">
                <div className="flex justify-between items-center mb-8">
                   <div className="flex gap-4 items-center"><div className="p-4 bg-red-600 rounded-3xl animate-bounce"><CheckCircle2 className="w-8 h-8 text-white" /></div><h2 className="text-xl font-black italic text-white uppercase tracking-tighter">Desplegando Aplicación...</h2></div>
                   {deployProgress === 100 && <button onClick={() => setIsDeploying(false)} className="px-8 py-3 bg-white text-zinc-950 rounded-2xl text-[10px] font-black uppercase italic">Finalizar</button>}
                </div>
                <div className="flex-1 bg-zinc-900/50 rounded-[3rem] p-12 font-mono text-emerald-400 no-scrollbar overflow-y-auto flex flex-col gap-4 border border-white/5 shadow-2xl">
                    {deployLogs.map((log, i) => <motion.p initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={i}>{log}</motion.p>)}
                    {deployProgress < 100 && <div className="flex items-center gap-3"><Loader2 className="w-4 h-4 animate-spin text-zinc-500" /><span className="animate-pulse">Active build...</span></div>}
                </div>
                <div className="mt-12 h-2 bg-zinc-900 rounded-full overflow-hidden"><motion.div animate={{ width: `${deployProgress}%` }} className="h-full bg-red-600" /></div>
            </motion.div>
         )}
      </AnimatePresence>

      {ToastComponent}
    </div>
  );
}

function Category({ label, children }: any) {
    return <div className="space-y-4 text-center"><h3 className="text-[9px] font-black text-zinc-300 uppercase italic tracking-widest">{label}</h3><div className="grid grid-cols-2 gap-3">{children}</div></div>;
}

function DraggableElement({ element, resolvedStyle, onSelect, onPositionChange, isSelected, isPreview, onContextMenu, currentTime }: any) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const mediaRef = useRef<any>(null);

  useEffect(() => {
    if (mediaRef.current && element.type === 'video') {
       const start = element.mediaConfig?.startTime || 0;
       const end = element.mediaConfig?.endTime || 999;
       const rel = (currentTime % (end - start)) + start;
       if (Math.abs(mediaRef.current.currentTime - rel) > 0.3) mediaRef.current.currentTime = rel;
       mediaRef.current.playbackRate = element.mediaConfig?.playbackRate || 1;
    }
  }, [currentTime, element.type, element.mediaConfig]);

  const styleObj = {
    left: resolvedStyle.x, top: resolvedStyle.y, width: resolvedStyle.width, height: resolvedStyle.height,
    zIndex: isSelected ? 300 : (resolvedStyle.zIndex || 1), position: 'absolute' as const,
    opacity: resolvedStyle.opacity ?? 1, borderRadius: resolvedStyle.borderRadius || '1.5rem',
    backgroundColor: resolvedStyle.backgroundColor, color: resolvedStyle.color
  };

  return (
    <div onMouseDown={(e: any) => { if(!isPreview){ onSelect(); setIsDragging(true); setDragOffset({ x: e.clientX - resolvedStyle.x, y: e.clientY - resolvedStyle.y }); e.stopPropagation(); } }} onContextMenu={onContextMenu} style={styleObj} className={cn("overflow-hidden group", isSelected && !isPreview && "ring-[8px] ring-zinc-950/10 border-2 border-zinc-950")}>
        {element.type === "navbar" && <div className="w-full h-full px-12 flex items-center justify-between border-b border-zinc-100 bg-white shadow-sm"><span className="font-black italic text-sm">{element.content}</span><div className="bg-zinc-950 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase italic">Launch</div></div>}
        {element.type === "video" && <video ref={mediaRef} src={element.content} className="w-full h-full object-cover" muted autoPlay playsInline />}
        {element.type === "image" && <img src={element.content} className="w-full h-full object-cover" draggable={false} />}
        {element.type === "text" && <p className="w-full h-full text-center flex items-center justify-center font-black italic px-8">{element.content}</p>}
        {element.type === "terminal" && <div className="w-full h-full bg-[#0d0d0d] p-6 font-mono text-[10px] text-emerald-400">$ {element.content}<div className="mt-4 w-2 h-4 bg-emerald-500 animate-pulse" /></div>}
        
        {element.type === "logic-input" && (
            <div className="w-full h-full bg-amber-500/10 border-2 border-amber-500 flex items-center gap-4 px-6 text-amber-600 font-black italic shadow-2xl group hover:bg-amber-500 hover:text-white transition-all skew-x-[-15deg]">
                <ArrowRightToLine className="w-6 h-6 skew-x-[15deg]" />
                <span className="skew-x-[15deg] uppercase tracking-tighter">LEER: {element.content}</span>
            </div>
        )}

        {element.type === "logic-output" && (
            <div className="w-full h-full bg-blue-500/10 border-2 border-blue-500 flex items-center gap-4 px-6 text-blue-600 font-black italic shadow-2xl group hover:bg-blue-500 hover:text-white transition-all">
                <ArrowLeftFromLine className="w-6 h-6" />
                <span className="uppercase tracking-tighter">MOSTRAR: {element.content}</span>
            </div>
        )}

        {element.type === "button" && <button className="w-full h-full shadow-lg font-black italic uppercase transition-all" style={{ backgroundColor: resolvedStyle.backgroundColor || "#000", color: resolvedStyle.color || "#fff", borderRadius: resolvedStyle.borderRadius || "1.5rem" }}>{element.content}</button>}
    </div>
  );
}

function TabBtn({ active, onClick, icon }: any) { return <button onClick={onClick} className={cn("p-4 rounded-xl flex items-center justify-center transition-all", active ? "bg-white text-zinc-950 shadow-xl scale-110" : "text-zinc-400 hover:text-zinc-600")}>{icon}</button>; }
function ToolButton({ icon, label, onClick }: any) { return <button onClick={onClick} className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-zinc-100 rounded-3xl hover:border-zinc-950 transition-all group shadow-sm"><div className="text-zinc-400 group-hover:text-zinc-950 transition-colors text-xl">{icon}</div><span className="text-[8px] font-black text-zinc-300 group-hover:text-zinc-950 uppercase italic tracking-tighter">{label}</span></button>; }
function DeviceBtn({ active, onClick, icon }: any) { return <button onClick={onClick} className={cn("p-2.5 rounded-xl transition-all", active ? "bg-white text-zinc-950 shadow-md scale-110" : "text-zinc-400")}>{icon}</button>; }
function ContextItem({ icon, label, onClick, color = "text-zinc-600" }: any) { return <button onClick={onClick} className={cn("w-full px-5 py-4 rounded-2xl hover:bg-zinc-50 flex items-center gap-3 text-[10px] font-black uppercase italic transition-all text-left", color)}>{icon} {label}</button>; }
function PropInput({ label, value, onChange }: any) { return <div className="space-y-1"><label className="text-[9px] font-black text-zinc-300 uppercase italic ml-1">{label}</label><input type="text" value={value === undefined ? "" : value} onChange={(e) => onChange(e.target.value)} className="w-full h-10 bg-zinc-50 border border-zinc-100 rounded-xl px-4 text-[11px] font-black italic outline-none focus:ring-4 focus:ring-red-600/10" /></div>; }
function PropSlider({ label, value, min = 0, max = 100, step = 1, onChange, dark }: any) { return <div className="space-y-3"><div className="flex justify-between items-center"><label className={cn("text-[9px] font-black uppercase italic", dark ? "text-zinc-500" : "text-zinc-300")}>{label}</label><span className="text-[10px] font-black italic text-red-600">{value}</span></div><input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full h-1 accent-red-600" /></div>; }
