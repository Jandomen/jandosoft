import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { verifyAdminAuth } from "@/lib/admin-middleware";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authResult = await verifyAdminAuth(req);
  if ("error" in authResult) return authResult.error;

  try {
    await connectDB();

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

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

    const [total, stores] = await Promise.all([
      Store.countDocuments(query),
      Store.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const storesWithStats = (stores as any[]).map((s) => {
      const stripeIntegration = (s.paymentIntegrations || []).find((i: any) => i.provider === "stripe");
      const isStripeConnected = !!(s.stripeAccountId);
      const isStripeChargesEnabled = stripeIntegration?.credentials?.charges_enabled === true;
      
      return {
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
        stripeConnectStatus: isStripeConnected ? (isStripeChargesEnabled ? "active" : "pending") : "none",
        stripeAccountEmail: s.stripeConnectEmail || "",
        platformFeePercent: s.platformFeePercent ?? 5,
      };
    });

    return Response.json({
      stores: storesWithStats,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Admin stores error:", error);
    return Response.json({ error: "Error loading stores" }, { status: 500 });
  }
}
