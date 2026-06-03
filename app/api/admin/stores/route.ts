import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";

    let query: any = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { ownerEmail: { $regex: search, $options: "i" } },
          { slug: { $regex: search, $options: "i" } },
        ],
      };
    }

    const stores = await Store.find(query)
      .sort({ createdAt: -1 })
      .lean();

    const storesWithStats = (stores as any[]).map((s) => ({
      _id: s._id,
      ownerEmail: s.ownerEmail,
      name: s.name,
      slug: s.slug,
      type: s.type,
      typeLabel: s.typeLabel,
      industry: s.industry,
      createdAt: s.createdAt,
      isSuspended: s.isSuspended || false,
      suspensionReason: s.suspensionReason || "",
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
