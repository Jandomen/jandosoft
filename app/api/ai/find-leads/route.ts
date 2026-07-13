import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

const CATEGORY_KEYWORDS: Record<string, string> = {
  restaurant: "restaurante",
  store: "tienda",
  doctor: "consultorio médico",
  school: "escuela",
  beauty_salon: "salón de belleza",
  gym: "gimnasio",
  lawyer: "abogado",
  auto_repair: "taller mecánico",
  real_estate_agency: "bienes raíces",
  accounting: "contador",
};

export async function POST(req: NextRequest) {
  try {
    const { location, category = "store", radius = 1000, maxResults = 10, storeId } = await req.json();

    let key: string | null = null;
    if (storeId) {
      await connectDB();
      const storeIds: any[] = [storeId];
      if (mongoose.Types.ObjectId.isValid(storeId)) {
        storeIds.push(new mongoose.Types.ObjectId(storeId));
      }
      const { Integration } = await import("@/lib/models/Integration");
      const integration = await Integration.findOne({
        storeId: { $in: storeIds },
        platform: "google_maps",
        "credentials.apiKey": { $exists: true, $ne: "" },
      }).lean();
      key = integration?.credentials?.apiKey || null;
    }

    if (!key) {
      return NextResponse.json({ error: "Google Maps API key not configured" }, { status: 500 });
    }

    // Geocode the location string to coordinates
    const geoRes = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${key}`
    );
    const geoData = await geoRes.json();
    if (!geoData.results?.length) {
      return NextResponse.json({ error: "No se pudo encontrar la ubicación" }, { status: 400 });
    }

    const { lat, lng } = geoData.results[0].geometry.location;

    // Nearby search
    const keyword = CATEGORY_KEYWORDS[category] || category;
    const searchRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(keyword)}&key=${key}`
    );
    const searchData = await searchRes.json();

    if (!searchData.results?.length) {
      return NextResponse.json({ leads: [] });
    }

    const places = searchData.results.slice(0, maxResults);

    // Get details (phone, website) for each place
    const leads = [];
    for (const place of places) {
      const detailRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types,geometry&key=${key}`
      );
      const detailData = await detailRes.json();
      const d = detailData.result || {};

      leads.push({
        name: place.name || "",
        address: d.formatted_address || place.vicinity || "",
        phone: d.formatted_phone_number || "",
        website: d.website || "",
        rating: d.rating || 0,
        ratingCount: d.user_ratings_total || 0,
        types: (d.types || []).filter((t: string) => !t.startsWith("_")),
        coordinates: {
          lat: place.geometry?.location?.lat || 0,
          lng: place.geometry?.location?.lng || 0,
        },
      });
    }

    return NextResponse.json({ leads, total: searchData.results.length });
  } catch (error: any) {
    console.error("find-leads error:", error);
    return NextResponse.json({ error: "Error buscando leads" }, { status: 500 });
  }
}
