import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

// ── helpers ──

async function getCredential(storeId: string | undefined, platform: string, field: string): Promise<string | null> {
  if (!storeId) return null;
  await connectDB();
  const ids: any[] = [storeId];
  if (mongoose.Types.ObjectId.isValid(storeId)) ids.push(new mongoose.Types.ObjectId(storeId));
  const { Integration } = await import("@/lib/models/Integration");
  const row = await Integration.findOne({ storeId: { $in: ids }, platform, [`credentials.${field}`]: { $exists: true, $ne: "" } }).lean();
  return row?.credentials?.[field] || null;
}

async function osmSearch(location: string, keyword: string, radius: number, limit: number) {
  const geo = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
    { headers: { "User-Agent": "Jandosoft/1.0" } }
  );
  if (!geo.ok) return null;
  const geoData = await geo.json();
  if (!geoData?.length) return null;
  const { lat, lon } = geoData[0];
  const r = Math.min(radius, 5000);

  const tag = `[~"^(amenity|shop|office|leisure|healthcare)$"~"."]["name"~"${keyword}",i]`;
  const q = `[out:json][timeout:15];node(around:${r},${lat},${lon})${tag};out ${limit};`;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "Jandosoft/1.0" },
    body: `data=${encodeURIComponent(q)}`,
  });
  if (!res.ok) return { leads: [], total: 0 };
  const data = await res.json();

  const seen = new Set<string>();
  const leads = (data.elements || []).filter((e: any) => e.type === "node" && e.tags?.name).map((el: any) => {
    const t = el.tags || {};
    const name = t.name?.trim();
    if (!name || seen.has(name.toLowerCase())) return null;
    seen.add(name.toLowerCase());
    return {
      name,
      address: [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(" ") || `${el.lat.toFixed(5)}, ${el.lon.toFixed(5)}`,
      phone: t.phone || t["contact:phone"] || "",
      website: t.website || t["contact:website"] || "",
      rating: 0, ratingCount: 0,
      types: [t.amenity || t.shop || t.office || t.leisure || t.healthcare || keyword].filter(Boolean),
      coordinates: { lat: el.lat, lng: el.lon },
    };
  }).filter(Boolean);

  return { leads: leads.slice(0, limit), total: leads.length };
}

async function googleSearch(location: string, keyword: string, radius: number, limit: number, key: string) {
  const geo = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${key}`);
  if (!geo.ok) return null;
  const geoData = await geo.json();
  if (geoData.status !== "OK" || !geoData.results?.length) return null;
  const { lat, lng } = geoData.results[0].geometry.location;

  const search = await fetch(
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${Math.min(radius, 5000)}&keyword=${encodeURIComponent(keyword)}&key=${key}`
  );
  if (!search.ok) return null;
  const searchData = await search.json();
  if (searchData.status === "OVER_QUERY_LIMIT" || searchData.status === "REQUEST_DENIED" || searchData.status === "INVALID_REQUEST") return null;
  if (!searchData.results?.length) return [];

  const places = searchData.results.slice(0, limit);
  const leads = [];
  for (const p of places) {
    try {
      const d = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${p.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types,geometry&key=${key}`);
      if (!d.ok) continue;
      const dd = await d.json();
      if (dd.status !== "OK") continue;
      const r = dd.result || {};
      leads.push({
        name: p.name || "",
        address: r.formatted_address || p.vicinity || "",
        phone: r.formatted_phone_number || "",
        website: r.website || "",
        rating: r.rating || 0,
        ratingCount: r.user_ratings_total || 0,
        types: (r.types || []).filter((t: string) => !t.startsWith("_")),
        coordinates: { lat: p.geometry?.location?.lat || lat, lng: p.geometry?.location?.lng || lng },
      });
    } catch {}
  }
  return leads;
}

async function mapboxSearch(location: string, keyword: string, limit: number, token: string) {
  const geo = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${token}&limit=1`);
  if (!geo.ok) return null;
  const geoData = await geo.json();
  if (!geoData.features?.length) return null;
  const [lng, lat] = geoData.features[0].center;

  const search = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(keyword)}.json?proximity=${lng},${lat}&access_token=${token}&types=poi&limit=${limit}`
  );
  if (!search.ok) return null;
  const data = await search.json();
  if (!data.features?.length) return [];

  return data.features.map((f: any) => ({
    name: f.text || "",
    address: f.place_name || "",
    phone: f.properties?.phone || "",
    website: f.properties?.website || "",
    rating: f.properties?.rating || 0,
    ratingCount: f.properties?.reviews || 0,
    types: [f.properties?.category || f.properties?.maki || keyword].filter(Boolean),
    coordinates: { lat: f.center[1], lng: f.center[0] },
  }));
}

// ── route ──

export async function POST(req: NextRequest) {
  try {
    const { location, category = "store", radius = 1000, maxResults = 10, storeId, customKeyword } = await req.json();
    const keyword = customKeyword || category;
    const limit = Math.min(maxResults, 50);

    // 1) Google Maps (if configured)
    const gkey = await getCredential(storeId, "google_maps", "apiKey");
    if (gkey) {
      try {
        const leads = await googleSearch(location, keyword, radius, limit, gkey);
        if (leads) return NextResponse.json({ leads, total: leads.length, source: "google" });
      } catch {}
    }

    // 2) Mapbox (if configured)
    const mtoken = await getCredential(storeId, "mapbox", "accessToken");
    if (mtoken) {
      try {
        const leads = await mapboxSearch(location, keyword, limit, mtoken);
        if (leads) return NextResponse.json({ leads, total: leads.length, source: "mapbox" });
      } catch {}
    }

    // 3) OSM (always works, no key)
    const result = await osmSearch(location, keyword, radius, limit);
    if (!result) return NextResponse.json({ error: "No se pudo encontrar la ubicación" }, { status: 400 });

    return NextResponse.json({ ...result, source: "osm" });
  } catch (error: any) {
    console.error("leads/search error:", error);
    return NextResponse.json({ error: "Error buscando leads" }, { status: 500 });
  }
}
