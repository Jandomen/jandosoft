import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { Customer } from "@/lib/models/Customer";
import { ScheduledTask } from "@/lib/models/ScheduledTask";
import { Appointment } from "@/lib/models/Appointment";
import { getAvailableSlots } from "@/lib/appointment-utils";
import type { SchedulerModule } from "../registry";

// OSM search — mapea categoría a tags OSM reales (no solo name~keyword)
async function osmSearch(location: string, keyword: string, radius: number, limit: number) {
  const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`, {
    headers: { "User-Agent": "Jandosoft-Prospecting/1.0" },
  });
  if (!geoRes.ok) return null;
  const geo = await geoRes.json();
  if (!geo?.length) return null;
  const lat = parseFloat(geo[0].lat);
  const lon = parseFloat(geo[0].lon);
  const r = Math.min(radius, 5000);

  // Mapea keyword de categoría a tag OSM
  const kw = keyword.toLowerCase();
  let tagFilter = `["name"~"${keyword}",i]`;
  if (["restaurant", "restaurante"].includes(kw)) tagFilter = `["amenity"="restaurant"]`;
  else if (["store", "tienda", "shop"].includes(kw)) tagFilter = `["shop"]`;
  else if (["doctor", "clinica", "clinic"].includes(kw)) tagFilter = `["amenity"~"^(doctors|clinic|hospital)$"]`;
  else if (kw.includes("beauty") || kw.includes("belleza") || kw.includes("salon")) tagFilter = `["shop"~"beauty|hairdresser"]`;
  else if (kw === "gym" || kw.includes("gimnasio")) tagFilter = `["leisure"="fitness_centre"]`;
  else if (kw.includes("school") || kw.includes("escuela")) tagFilter = `["amenity"~"school|college"]`;
  else if (kw.includes("lawyer") || kw.includes("abogado")) tagFilter = `["office"="lawyer"]`;
  else if (kw.includes("barber") || kw.includes("barberia")) tagFilter = `["shop"~"hairdresser|barber"]`;
  else if (kw) tagFilter = `["name"~"${keyword}",i]`;

  const q = `[out:json][timeout:15];node(around:${r},${lat},${lon})${tagFilter};out ${limit};`;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "Jandosoft-Prospecting/1.0" },
    body: `data=${encodeURIComponent(q)}`,
  });
  if (!res.ok) return null;
  const data = await res.json();
  const elements = (data.elements || []).filter((e: any) => e.tags?.name).slice(0, limit);
  if (!elements.length && tagFilter !== `["name"~"${keyword}",i]`) {
    // Fallback: si tag específico dio 0, intenta name~keyword
    const q2 = `[out:json][timeout:15];node(around:${r},${lat},${lon})["name"~"${keyword}",i];out ${limit};`;
    const r2 = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "Jandosoft-Prospecting/1.0" },
      body: `data=${encodeURIComponent(q2)}`,
    });
    if (r2.ok) {
      const d2 = await r2.json();
      const e2 = (d2.elements || []).filter((e: any) => e.tags?.name).slice(0, limit);
      if (e2.length) return e2.map((el: any) => ({
        name: el.tags.name,
        address: [el.tags["addr:street"], el.tags["addr:city"]].filter(Boolean).join(", ") || location,
        phone: el.tags.phone || el.tags["contact:phone"] || "",
        website: el.tags.website || el.tags["contact:website"] || "",
        rating: 0, ratingCount: 0, types: [keyword],
        coordinates: { lat: el.lat, lng: el.lon },
      }));
    }
  }
  return elements.map((el: any) => ({
    name: el.tags.name,
    address: [el.tags["addr:street"], el.tags["addr:city"]].filter(Boolean).join(", ") || `${el.lat.toFixed(5)}, ${el.lon.toFixed(5)}`,
    phone: el.tags.phone || el.tags["contact:phone"] || "",
    website: el.tags.website || el.tags["contact:website"] || "",
    rating: 0, ratingCount: 0, types: [el.tags.amenity || el.tags.shop || keyword],
    coordinates: { lat: el.lat, lng: el.lon },
  }));
}

async function googleSearch(location: string, keyword: string, radius: number, limit: number, key: string) {
  const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${key}`);
  if (!geoRes.ok) return null;
  const geo = await geoRes.json();
  if (geo.status !== "OK" || !geo.results?.length) return null;
  const { lat, lng } = geo.results[0].geometry.location;
  const search = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${Math.min(radius, 5000)}&keyword=${encodeURIComponent(keyword)}&key=${key}`);
  if (!search.ok) return null;
  const s = await search.json();
  if (!s.results?.length) return [];
  const places = s.results.slice(0, limit);
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
        types: r.types || [],
        coordinates: { lat: p.geometry.location.lat, lng: p.geometry.location.lng },
      });
    } catch {}
  }
  return leads;
}

const mod: SchedulerModule = {
  name: "prospecting",
  taskTypes: ["prospecting", "prospect_outreach", "prospect_followup", "prospect_noshow"],

  async execute(task) {
    await connectDB();
    const type = task.type;

    // ── 1. prospecting: discover leads → Customer + schedule outreach ──
    if (type === "prospecting") {
      const { storeId, location, category, customKeyword, radius, maxResults } = task.payload || {};
      // If task.payload has storeId directly or task.storeId
      const sid = storeId || task.storeId;
      if (!sid) return { success: false, error: "storeId missing" };

      const store = await Store.findById(sid).lean() as any;
      if (!store) return { success: false, error: "Store not found" };

      const cfg = store.prospectingConfig || {};
      const loc = location || cfg.location;
      const cat = customKeyword || category || cfg.category || "store";
      const rad = radius || cfg.radius || 2000;
      const lim = Math.min(maxResults || cfg.maxResults || 10, 20);

      if (!loc) return { success: false, error: "prospecting location not configured" };

      // Check intervalHours to avoid over-prospecting if triggered via cron loop
      // For direct task, always run

      let leads: any[] | null = null;
      let source = "osm";

      // Try Google if store has credential
      const gCred = (store.paymentIntegrations || []).find((p: any) => p.provider === "google_maps" && p.enabled);
      const gKey = gCred?.credentials?.apiKey || process.env.GOOGLE_MAPS_API_KEY;
      if (gKey) {
        try {
          leads = await googleSearch(loc, cat, rad, lim, gKey);
          if (leads?.length) source = "google";
        } catch {}
      }
      if (!leads) {
        leads = await osmSearch(loc, cat, rad, lim);
        source = "osm";
      }
      if (!leads?.length) return { success: true, message: "No leads found" };

      let created = 0;
      let skipped = 0;
      for (const l of leads) {
        if (!l.name) continue;
        // Dedupe by phone or name+address
        const exists = await Customer.findOne({
          storeId: sid,
          $or: [
            ...(l.phone ? [{ phone: l.phone }] : []),
            { name: l.name, address: l.address },
          ],
        }).lean();
        if (exists) { skipped++; continue; }

        const customer = await Customer.create({
          storeId: sid,
          name: l.name,
          phone: l.phone || "",
          email: "",
          address: l.address || "",
          coordinates: l.coordinates || null,
          category: cat,
          status: "lead",
          source: "ai",
          tags: ["prospecting", source, cat],
          notes: `Auto-prospectado ${new Date().toISOString()} via ${source} | ${l.website || ""} | rating ${l.rating}`,
        });
        created++;

        // Schedule outreach if autoOutreach enabled
        const outreachChannel = cfg.outreachChannel || "email";
        const shouldOutreach = cfg.autoOutreach !== false;
        if (shouldOutreach) {
          // For now, only email can be sent without phone; whatsapp/sms needs phone
          if (outreachChannel === "email" && !l.phone) {
            // Still schedule email outreach if we have no phone — will use template that asks for contact
          }
          if ((outreachChannel === "whatsapp" || outreachChannel === "sms") && !l.phone) {
            // Skip outreach if no phone for those channels
            continue;
          }
          await ScheduledTask.create({
            type: "prospect_outreach",
            payload: { customerId: customer._id, storeId: sid, channel: outreachChannel, attempt: 1 },
            runAt: new Date(Date.now() + 2 * 60 * 1000), // 2 min delay to avoid burst
            status: "pending",
            storeId: sid,
          });
        }
      }

      // Update lastRunAt and schedule next run
      await Store.updateOne({ _id: sid }, { $set: { "prospectingConfig.lastRunAt": new Date().toISOString() } });
      const intervalHours = cfg.intervalHours || 24;
      const nextRun = new Date(Date.now() + intervalHours * 60 * 60 * 1000);
      await ScheduledTask.create({
        type: "prospecting",
        payload: { storeId: sid, location: loc, category: cat, customKeyword: cfg.customKeyword || "", radius: rad, maxResults: lim },
        runAt: nextRun,
        status: "pending",
        storeId: sid,
        organizationId: store.organizationId,
      });

      return { success: true, message: `Prospecting ${source}: ${created} nuevos, ${skipped} duplicados de ${leads.length} | next ${nextRun.toISOString()}` };
    }

    // ── 2. prospect_outreach: send first contact ──
    if (type === "prospect_outreach") {
      const { customerId, storeId, channel = "email", attempt } = task.payload || {};
      const sid = storeId || task.storeId;
      const customer = await Customer.findById(customerId).lean() as any;
      if (!customer) return { success: false, error: "Customer not found" };
      const store = await Store.findById(sid).lean() as any;
      if (!store) return { success: false, error: "Store not found" };

      const storeName = store.name || "Jandosoft";
      const serviceName = store.services?.[0]?.name || "nuestro servicio";

      // Build outreach message (IA could generate, here template)
      const bookingLink = `https://${process.env.VERCEL_URL || "jandosoft.vercel.app"}/s/${store.slug}/reservar`;
      const msg = `Hola ${customer.name}, soy ${storeName}. Vi que te puede interesar ${serviceName}. ¿Te agendo 15 min para mostrarte cómo te ayudamos? Reserva directo: ${bookingLink}`;

      try {
        if (channel === "email") {
          const email = customer.email;
          if (!email) {
            // No email → skip to followup via alternative? mark contacted anyway
            await Customer.updateOne({ _id: customerId }, { $set: { status: "prospect", notes: (customer.notes || "") + `\n[Outreach ${new Date().toISOString()}] Sin email, mensaje preparado: ${msg}` } });
            // Schedule followup to try to enrich email via website
            await ScheduledTask.create({
              type: "prospect_followup",
              payload: { customerId, storeId: sid, attempt: (attempt || 1) + 1 },
              runAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
              status: "pending",
              storeId: sid,
            });
            return { success: true, message: "No email, queued followup" };
          }
          const { sendEmail } = await import("@/lib/email");
          await sendEmail({
            to: email,
            subject: `${storeName} — ¿15 min para impulsar tu negocio?`,
            html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px"><p>${msg}</p><p><a href="${bookingLink}" style="background:#dc2626;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;display:inline-block;margin-top:12px">Reservar cita</a></p><p style="color:#999;font-size:11px;margin-top:20px">${storeName} — Jandosoft</p></div>`,
          });
        } else if (channel === "whatsapp" || channel === "sms") {
          // Use whatsapp/sms via Communication log (actual send via Twilio/WhatsApp Business if configured elsewhere)
          const phone = customer.phone;
          if (!phone) return { success: false, error: "No phone" };
          const { Communication } = await import("@/lib/models/Communication");
          await Communication.create({ storeId: sid, customerId, channel, direction: "outbound", content: msg, status: "sent" } as any);
        }

        await Customer.updateOne({ _id: customerId }, { $set: { status: "prospect" } });

        // Schedule followup in 24h if no appointment
        await ScheduledTask.create({
          type: "prospect_followup",
          payload: { customerId, storeId: sid, attempt: (attempt || 1) + 1 },
          runAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: "pending",
          storeId: sid,
        });

        // Also optimistically check if we can auto-book: if store has default service, find next slot
        try {
          const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
          const dateStr = tomorrow.toISOString().split("T")[0];
          const slots = await getAvailableSlots(String(sid), dateStr, 30);
          const free = slots.find((s) => s.available);
          if (free) {
            // Do not auto-book without confirmation; just note next slot
            await Customer.updateOne({ _id: customerId }, { $set: { notes: (customer.notes || "") + `\n[Next slot ${dateStr} ${free.time}]` } });
          }
        } catch {}

        return { success: true, message: `Outreach ${channel} sent to ${customer.name}` };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    // ── 3. prospect_followup: 24h/48h followups, max 3 attempts ──
    if (type === "prospect_followup") {
      const { customerId, storeId, attempt = 2 } = task.payload || {};
      const sid = storeId || task.storeId;
      const customer = await Customer.findById(customerId).lean() as any;
      if (!customer) return { success: false, error: "Customer not found" };
      if (customer.status === "customer" || customer.status === "churned") return { success: true, message: "Already converted" };
      if (attempt > 3) return { success: true, message: "Max followups reached" };

      // Check if appointment already exists for this customer
      const existing = await Appointment.findOne({ customerId, storeId: sid, status: { $in: ["pending", "confirmed", "in_progress"] } }).lean();
      if (existing) {
        await Customer.updateOne({ _id: customerId }, { $set: { status: "prospect" } });
        return { success: true, message: "Already has appointment" };
      }

      const store = await Store.findById(sid).lean() as any;
      const storeName = store?.name || "Jandosoft";
      const bookingLink = `https://${process.env.VERCEL_URL || "jandosoft.vercel.app"}/s/${store?.slug || ""}/reservar`;
      const msg = `Hola ${customer.name}, te escribo de ${storeName} — ¿seguimos con esos 15 min? Queda un hueco mañana: ${bookingLink}`;

      try {
        // Try email if exists else log
        if (customer.email) {
          const { sendEmail } = await import("@/lib/email");
          await sendEmail({ to: customer.email, subject: `Re: ${storeName} — tu cita`, html: `<p>${msg}</p>` });
        } else if (customer.phone) {
          const { Communication } = await import("@/lib/models/Communication");
          await Communication.create({ storeId: sid, customerId, channel: "whatsapp", direction: "outbound", content: msg, status: "sent" } as any);
        }
        if (attempt < 3) {
          await ScheduledTask.create({
            type: "prospect_followup",
            payload: { customerId, storeId: sid, attempt: attempt + 1 },
            runAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
            status: "pending",
            storeId: sid,
          });
        }
        return { success: true, message: `Followup ${attempt} sent` };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    // ── 4. prospect_noshow: rescue no_show ──
    if (type === "prospect_noshow") {
      const { appointmentId, storeId } = task.payload || {};
      const apt = await Appointment.findById(appointmentId).lean() as any;
      if (!apt) return { success: false, error: "Appointment not found" };
      if (apt.settingStage !== "no_show") return { success: true, message: "Not no_show" };
      const store = await Store.findById(storeId || apt.storeId).lean() as any;
      const customer = await Customer.findById(apt.customerId).lean() as any;
      if (!customer) return { success: false, error: "Customer not found" };
      const bookingLink = `https://${process.env.VERCEL_URL || "jandosoft.vercel.app"}/s/${store?.slug || ""}/reservar`;
      const msg = `Hola ${customer.name}, vimos que no pudiste asistir. ¿Reagendamos? ${bookingLink}`;
      if (customer.email) {
        const { sendEmail } = await import("@/lib/email");
        await sendEmail({ to: customer.email, subject: "¿Reagendamos?", html: `<p>${msg}</p>` });
      }
      return { success: true, message: "No-show rescue sent" };
    }

    return { success: false, error: `Unknown prospecting task ${type}` };
  },
};

export default mod;
