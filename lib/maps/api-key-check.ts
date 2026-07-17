export interface MapApiKeyStatus {
  configured: boolean;
  provider: string;
  error?: string;
}

export async function checkMapApiKey(storeId?: string): Promise<MapApiKeyStatus> {
  if (!storeId || typeof window === "undefined") {
    return { configured: false, provider: "none", error: "Store ID no disponible" };
  }
  try {
    const res = await fetch(`/api/integrations/google-maps-key?storeId=${storeId}`);
    const data = await res.json();
    if (data.key) {
      return { configured: true, provider: "google_maps" };
    }
    return { configured: false, provider: "none", error: "No se encontró API Key de Google Maps configurada" };
  } catch {
    return { configured: false, provider: "none", error: "Error al verificar API Key" };
  }
}

export function getMapDeactivatedMessage(): { title: string; description: string; action: string } {
  return {
    title: "Mapa desactivado",
    description: "Para mostrar la ubicación, rutas y puntos de interés, necesitas configurar una API Key de Google Maps.",
    action: "Configurar en Integraciones",
  };
}
