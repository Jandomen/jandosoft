"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/maps/loader";
import { Settings, MapPin } from "lucide-react";

interface Props {
  value: string;
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
  className?: string;
  storeId?: string;
}

export function AddressAutocomplete({ value, onChange, placeholder = "Dirección del negocio", className = "", storeId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [configError, setConfigError] = useState("");
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  useEffect(() => {
    loadGoogleMaps(storeId).then(r => {
      if (r.success) {
        setReady(true);
        setApiKeyMissing(false);
      } else {
        setConfigError(r.error || "Error");
        if (r.error?.includes("no configurado") || r.error?.includes("API Key")) {
          setApiKeyMissing(true);
        }
      }
    });
  }, [storeId]);

  useEffect(() => {
    if (!ready || !inputRef.current || !window.google?.maps?.places) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      componentRestrictions: { country: "mx" },
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry?.location) return;
      const address = place.formatted_address || inputRef.current?.value || "";
      const coordinates = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      onChange(address, coordinates);
    });

    return () => google.maps.event.clearInstanceListeners(autocomplete);
  }, [ready, onChange]);

  if (apiKeyMissing) {
    return (
      <div className={`flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl ${className}`}>
        <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-700 rounded-lg flex items-center justify-center shrink-0">
          <MapPin className="w-4 h-4 text-zinc-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-zinc-500 uppercase italic">Autocompletado desactivado</p>
          <p className="text-[10px] text-zinc-400">Configura Google Maps en Integraciones para autocompletado de direcciones</p>
        </div>
        <button onClick={() => window.dispatchEvent(new CustomEvent("navigate-to-integrations"))}
          className="text-[10px] font-black italic text-red-600 hover:text-red-700 shrink-0">
          Configurar
        </button>
      </div>
    );
  }

  if (configError) {
    return (
      <div className={`flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs ${className}`}>
        <Settings className="w-4 h-4 shrink-0 text-amber-500" />
        <span className="text-amber-700 font-medium flex-1">{configError}</span>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => { setConfigError(""); loadGoogleMaps(storeId).then(r => { if (r.success) setReady(true); else setConfigError(r.error || "Error"); }); }}
            className="text-amber-800 font-black italic underline hover:no-underline">
            Reintentar
          </button>
          <button onClick={() => window.dispatchEvent(new CustomEvent("navigate-to-integrations"))}
            className="text-amber-800 font-black italic underline hover:no-underline">
            Configurar
          </button>
        </div>
      </div>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={ready ? placeholder : "Cargando Google Maps..."}
      className={className}
    />
  );
}
