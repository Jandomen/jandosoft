"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/maps/loader";
import { DARK_MAP_STYLES, isDarkMode } from "@/lib/maps/dark-mode";
import { Settings } from "lucide-react";

interface Props {
  coordinates: { lat: number; lng: number };
  name?: string;
  className?: string;
  style?: React.CSSProperties;
  storeId?: string;
}

export function StoreMap({ coordinates, name, className = "", style, storeId }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [dark, setDark] = useState(false);
  const [configError, setConfigError] = useState("");

  useEffect(() => {
    loadGoogleMaps(storeId).then(r => {
      if (r.success) setReady(true);
      else setConfigError(r.error || "Error");
    });
  }, [storeId]);

  useEffect(() => {
    setDark(isDarkMode());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    try {
      const map = new google.maps.Map(mapRef.current, {
        center: coordinates,
        zoom: 17,
        mapTypeId: "roadmap",
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        styles: dark ? DARK_MAP_STYLES : undefined,
      });
      new google.maps.Marker({
        position: coordinates,
        map,
        title: name || "Ubicación",
      });
    } catch {
      setConfigError("Google Maps no disponible. La API key puede estar sin facturación o haber excedido la cuota.");
      setReady(false);
    }
  }, [ready, coordinates, name, dark]);

  if (configError) {
    return (
      <div className={`bg-amber-50 border border-amber-200 rounded-2xl flex flex-col items-center justify-center ${className}`} style={{ minHeight: 200, ...style }}>
        <div className="text-center p-4">
          <Settings className="w-6 h-6 text-amber-500 mx-auto mb-2" />
          <p className="text-xs text-amber-700 font-medium mb-3">{configError}</p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => { setConfigError(""); loadGoogleMaps(storeId).then(r => { if (r.success) setReady(true); else setConfigError(r.error || "Error"); }); }}
              className="px-4 py-2 bg-amber-600 text-white rounded-xl text-[10px] font-black italic hover:bg-amber-700 transition-all">
              Reintentar
            </button>
            <button onClick={() => window.dispatchEvent(new CustomEvent("navigate-to-integrations"))}
              className="px-4 py-2 bg-amber-600 text-white rounded-xl text-[10px] font-black italic hover:bg-amber-700 transition-all">
              Configurar API Key
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className={`bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center ${className}`} style={{ minHeight: 200, ...style }}>
        <span className="text-xs text-zinc-400 font-medium">Cargando mapa...</span>
      </div>
    );
  }

  return <div ref={mapRef} className={`rounded-2xl overflow-hidden ${className}`} style={{ minHeight: 200, ...style }} />;
}
