import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { slugify } from "@/lib/utils";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    await connectDB();

    // Try to find by slug first
    let store = await Store.findOne({ slug }).lean();

    // If not found, try to find stores without slug that match the name
    if (!store) {
      store = await Store.findOne({
        name: { $regex: new RegExp("^" + slug.replace(/-/g, "[- ]") + "$", "i") }
      }).lean();

      // If found by name, auto-generate slug
      if (store && !store.slug) {
        const newSlug = slugify(store.name || "tienda");
        await Store.updateOne({ _id: store._id }, { $set: { slug: newSlug } }).catch(() => {});
        store.slug = newSlug;
      }
    }

    // If still not found, try finding by the un-slugified name
    if (!store) {
      const nameVariation = slug.replace(/-/g, " ");
      store = await Store.findOne({ name: { $regex: new RegExp(`^${nameVariation}$`, "i") } }).lean();
    }

    if (!store) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    }
    const { customers, orders, stripeAccountId, paymentsEnabled, platformFeePercent, ...publicData } = store as any;
    return NextResponse.json({ store: publicData });
  } catch (error) {
    console.error("GET public store error:", error);
    return NextResponse.json({ error: "Error fetching store" }, { status: 500 });
  }
}
