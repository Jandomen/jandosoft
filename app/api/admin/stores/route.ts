import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const stores = await Store.find({})
      .sort({ createdAt: -1 })
      .lean();

    const storesWithStats = (stores as any[]).map((s) => ({
      _id: s._id,
      ownerEmail: s.ownerEmail,
      name: s.name,
      type: s.type,
      typeLabel: s.typeLabel,
      industry: s.industry,
      createdAt: s.createdAt,
      productCount: (s.products || []).length,
      customerCount: (s.customers || []).length,
      orderCount: (s.orders || []).length,
    }));

    return Response.json({ stores: storesWithStats });
  } catch (error) {
    console.error("Admin stores error:", error);
    return Response.json({ error: "Error loading stores" }, { status: 500 });
  }
}
