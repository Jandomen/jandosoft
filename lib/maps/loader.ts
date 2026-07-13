let loading: Promise<void> | null = null;

function scriptAlreadyLoaded(): boolean {
  if (typeof window === "undefined") return false;
  return !!document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
}

// Always fetch fresh from DB — no caching, so user can configure key without reload
async function resolveKey(storeId?: string): Promise<string | null> {
  if (!storeId || typeof window === "undefined") return null;
  try {
    const res = await fetch(`/api/integrations/google-maps-key?storeId=${storeId}`);
    const data = await res.json();
    return data.key || null;
  } catch {
    return null;
  }
}

export async function loadGoogleMaps(storeId?: string): Promise<{ success: boolean; error?: string }> {
  // If script already in DOM, consider it loaded
  if (scriptAlreadyLoaded()) return { success: true };

  // If a load is in progress, wait for it
  if (loading) { await loading; return { success: true }; }

  const key = await resolveKey(storeId);
  if (!key) {
    return { success: false, error: "Google Maps no configurado. Ve a Integraciones > Google Maps y agrega tu API Key." };
  }

  // Double-check after async resolveKey in case another call finished in between
  if (scriptAlreadyLoaded()) return { success: true };
  if (loading) { await loading; return { success: true }; }

  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&loading=async`;
    script.async = true;
    script.onload = () => { resolve(); };
    script.onerror = () => { loading = null; reject(new Error("Failed to load Google Maps")); };
    document.head.appendChild(script);
  });

  try {
    await loading;
    // Verify Map constructor is actually available (fails if key is billing-restricted)
    if (typeof google === "undefined" || typeof google.maps?.Map !== "function") {
      loading = null;
      return { success: false, error: "Google Maps no disponible. Verifica que tu API Key tenga facturación activa." };
    }
    return { success: true };
  } catch {
    loading = null;
    return { success: false, error: "Error al cargar Google Maps. Verifica tu API Key." };
  }
}
