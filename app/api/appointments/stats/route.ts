import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Appointment } from "@/lib/models/Appointment";
import { getAuthFromHeaders, getAuthFromCookies } from "@/lib/auth";

async function getAuth(req: NextRequest) {
  return getAuthFromHeaders(req) || await getAuthFromCookies();
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });

    await connectDB();

    const today = new Date().toISOString().split("T")[0];

    const [todayCount, upcomingCount, completedCount, cancelledCount] = await Promise.all([
      Appointment.countDocuments({ storeId, date: today }),
      Appointment.countDocuments({
        storeId,
        date: { $gte: today },
        status: { $in: ["pending", "confirmed"] },
      }),
      Appointment.countDocuments({ storeId, status: "completed" }),
      Appointment.countDocuments({ storeId, status: "cancelled" }),
    ]);

    return NextResponse.json({
      today: todayCount,
      upcoming: upcomingCount,
      completed: completedCount,
      cancelled: cancelledCount,
    });
  } catch (error) {
    console.error("GET appointments stats error:", error);
    return NextResponse.json({ error: "Error loading stats" }, { status: 500 });
  }
}
