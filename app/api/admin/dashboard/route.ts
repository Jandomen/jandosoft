import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { Store } from "@/lib/models/Store";
import { verifyAdminAuth } from "@/lib/admin-middleware";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authResult = await verifyAdminAuth(req);
  if ("error" in authResult) return authResult.error;

  try {
    await connectDB();

    const totalUsers = await User.countDocuments();
    const totalStores = await Store.countDocuments();

    const allStores = await Store.find({}, "products orders name createdAt").lean();
    let totalProducts = 0;
    let totalOrders = 0;
    let totalRevenue = 0;
    const recentStores: any[] = [];
    for (const s of allStores as any[]) {
      totalProducts += (s.products || []).length;
      totalOrders += (s.orders || []).length;
      for (const o of (s.orders || [])) {
        totalRevenue += o.amount || 0;
      }
      if (s.createdAt) recentStores.push({ name: s.name, createdAt: s.createdAt });
    }

    const recentUsers = await User.find({}, "email name createdAt subscription")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: firstOfMonth } });

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const activeUsersToday = await User.countDocuments({ createdAt: { $gte: todayStart } });

    const activity = [
      ...recentUsers.map((u: any) => ({
        action: `Nuevo usuario registrado`,
        time: u.createdAt,
        detail: u.email,
      })),
      ...recentStores.map((s: any) => ({
        action: `Empresa creada: ${s.name}`,
        time: s.createdAt,
        detail: s.name,
      })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);

    return Response.json({
      stats: {
        totalUsers,
        totalStores,
        totalProducts,
        totalOrders,
        totalRevenue,
        newUsersThisMonth,
        activeUsersToday,
      },
      activity: activity.map((a) => ({
        action: a.action,
        time: formatRelativeTime(a.time),
        detail: a.detail,
        createdAt: a.time,
      })),
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return Response.json({ error: "Error loading dashboard" }, { status: 500 });
  }
}

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}
