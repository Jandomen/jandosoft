"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/maps/loader";
import { Settings } from "lucide-react";

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

  useEffect(() => {
    loadGoogleMaps(storeId).then(r => {
      if (r.success) setReady(true);
      else setConfigError(r.error || "Error");
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
