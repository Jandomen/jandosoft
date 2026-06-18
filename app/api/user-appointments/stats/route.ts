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
    const ownerEmail = searchParams.get("ownerEmail");
    if (!ownerEmail) return NextResponse.json({ error: "ownerEmail required" }, { status: 400 });

    await connectDB();

    const today = new Date().toISOString().split("T")[0];

    const [todayCount, upcomingCount, completedCount, cancelledCount] = await Promise.all([
      Appointment.countDocuments({ ownerEmail, date: today }),
      Appointment.countDocuments({
        ownerEmail,
        date: { $gte: today },
        status: { $in: ["pending", "confirmed"] },
      }),
      Appointment.countDocuments({ ownerEmail, status: "completed" }),
      Appointment.countDocuments({ ownerEmail, status: "cancelled" }),
    ]);

    return NextResponse.json({
      today: todayCount,
      upcoming: upcomingCount,
      completed: completedCount,
      cancelled: cancelledCount,
    });
  } catch (error) {
    console.error("GET user-appointments stats error:", error);
    return NextResponse.json({ error: "Error loading stats" }, { status: 500 });
  }
}
