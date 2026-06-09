import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookies, getAuthFromHeaders } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";

export async function GET(req: NextRequest) {
  const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  await connectDB();

  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const users = await User.find({
    $and: [
      { _id: { $ne: auth.userId } },
      {
        $or: [
          { email: regex },
          { name: regex },
        ],
      },
    ],
  })
    .select("email name phone")
    .limit(20)
    .lean();

  return NextResponse.json({ users });
}
