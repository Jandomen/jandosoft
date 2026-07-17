"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/maps/loader";
import { DARK_MAP_STYLES, isDarkMode } from "@/lib/maps/dark-mode";
import { Settings, MapPin, Navigation, Route, AlertTriangle } from "lucide-react";

interface MapPoint {
  lat: number;
  lng: number;
  label?: string;
  color?: string;
}

interface RouteInfo {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
}

interface Props {
  coordinates: { lat: number; lng: number };
  name?: string;
  className?: string;
  style?: React.CSSProperties;
  storeId?: string;
  points?: MapPoint[];
  route?: RouteInfo;
  showRouteButton?: boolean;
}

export function StoreMap({ coordinates, name, className = "", style, storeId, points, route, showRouteButton = true }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [dark, setDark] = useState(false);
  const [configError, setConfigError] = useState("");
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

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
        zoom: points && points.length > 1 ? 13 : 17,
        mapTypeId: "roadmap",
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        styles: dark ? DARK_MAP_STYLES : undefined,
      });

      const allPoints: MapPoint[] = [
        { lat: coordinates.lat, lng: coordinates.lng, label: name || "Ubicación", color: "#dc2626" },
        ...(points || []),
      ];

      const bounds = new google.maps.LatLngBounds();

      allPoints.forEach((point, i) => {
        const marker = new google.maps.Marker({
          position: { lat: point.lat, lng: point.lng },
          map,
          title: point.label || `Punto ${i + 1}`,
          icon: i === 0 ? undefined : {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${point.color || "#3b82f6"}"><circle cx="12" cy="12" r="8" stroke="white" stroke-width="2"/></svg>`
            )}`,
            scaledSize: new google.maps.Size(24, 24),
          },
        });
        bounds.extend({ lat: point.lat, lng: point.lng });
      });

      if (allPoints.length > 1) {
        map.fitBounds(bounds, 50);
      }

      if (showRoute && route) {
        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: "#dc2626",
            strokeWeight: 4,
            strokeOpacity: 0.8,
          },
        });

        directionsService.route(
          {
            origin: route.origin,
            destination: route.destination,
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === "OK" && result) {
              directionsRenderer.setDirections(result);
              const leg = result.routes[0]?.legs[0];
              if (leg) {
                setRouteInfo({
                  distance: leg.distance?.text || "",
                  duration: leg.duration?.text || "",
                });
              }
            }
          }
        );
      }
    } catch {
      setConfigError("Google Maps no disponible. La API key puede estar sin facturación o haber excedido la cuota.");
      setReady(false);
    }
  }, [ready, coordinates, name, dark, points, showRoute, route]);

  if (apiKeyMissing) {
    return (
      <div className={`bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl flex flex-col items-center justify-center ${className}`} style={{ minHeight: 200, ...style }}>
        <div className="text-center p-6 max-w-xs">
          <div className="w-14 h-14 bg-zinc-200 dark:bg-zinc-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-7 h-7 text-zinc-400" />
          </div>
          <h3 className="text-sm font-black italic text-zinc-700 dark:text-zinc-300 uppercase mb-2">Mapa desactivado</h3>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed mb-4">
            Para mostrar la ubicación en el mapa, rutas y puntos de interés, necesitas configurar una API Key de Google Maps.
          </p>
          <div className="flex flex-col gap-2">
            <button onClick={() => window.dispatchEvent(new CustomEvent("navigate-to-integrations"))}
              className="px-4 py-2.5 bg-red-600 text-white rounded-xl text-[10px] font-black italic hover:bg-red-700 transition-all shadow-lg shadow-red-100">
              Configurar API Key
            </button>
            <span className="text-[9px] text-zinc-300 dark:text-zinc-600">Integraciones → Google Maps</span>
          </div>
        </div>
      </div>
    );
  }

  if (configError) {
    return (
      <div className={`bg-amber-50 border border-amber-200 rounded-2xl flex flex-col items-center justify-center ${className}`} style={{ minHeight: 200, ...style }}>
        <div className="text-center p-4">
          <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
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

  return (
    <div className={`relative ${className}`} style={style}>
      <div ref={mapRef} className="w-full h-full rounded-2xl overflow-hidden" style={{ minHeight: 200 }} />
      {showRouteButton && route && (
        <div className="absolute bottom-3 left-3 right-3 flex gap-2">
          <button
            onClick={() => setShowRoute(!showRoute)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black italic transition-all shadow-lg ${
              showRoute
                ? "bg-red-600 text-white"
                : "bg-white/90 dark:bg-zinc-800/90 backdrop-blur text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"
            }`}
          >
            <Route className="w-3.5 h-3.5" />
            {showRoute ? "Ocultar ruta" : "Mostrar ruta"}
          </button>
          {showRoute && routeInfo && (
            <div className="flex items-center gap-3 px-3 bg-white/90 dark:bg-zinc-800/90 backdrop-blur rounded-xl text-[10px] font-bold text-zinc-500 shadow-lg">
              <span className="flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                {routeInfo.distance}
              </span>
              <span>{routeInfo.duration}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
