import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { slugify } from "@/lib/utils";

export async function getPublicStore(slug: string) {
  try {
    await connectDB();
    let store = await Store.findOne({ slug }).lean();
    if (!store) {
      store = await Store.findOne({
        name: { $regex: new RegExp("^" + slug.replace(/-/g, "[- ]") + "$", "i") }
      }).lean();
      if (store && !store.slug) {
        const newSlug = slugify(store.name || "empresa");
        await Store.updateOne({ _id: store._id }, { $set: { slug: newSlug } }).catch(() => {});
        (store as any).slug = newSlug;
      }
    }
    if (!store) {
      const nameVariation = slug.replace(/-/g, " ");
      store = await Store.findOne({ name: { $regex: new RegExp("^" + nameVariation + "$", "i") } }).lean();
    }
    if (!store) {
      store = await Store.findOne({ slugHistory: slug }).lean();
    }
    if (!store) return null;

    // Fetch active WhatsApp number for this store
    let whatsappPhone = "";
    try {
      const { WhatsAppAccount } = await import("@/lib/models/WhatsAppAccount");
      const waAccount = await WhatsAppAccount.findOne({ storeId: store._id, status: "active" })
        .select("phoneNumber")
        .lean();
      if (waAccount?.phoneNumber) whatsappPhone = waAccount.phoneNumber.replace(/[^0-9+]/g, "");
    } catch {}

    const { customers, orders, platformFeePercent, ...publicData } = store as any;
    const result = JSON.parse(JSON.stringify(publicData));
    if (whatsappPhone) result.whatsappPhone = whatsappPhone;
    return result;
  } catch {
    return null;
  }
}
