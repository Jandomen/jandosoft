import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { Organization } from "@/lib/models/Organization";
import { getAuthFromCookies, getAuthFromHeaders } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(auth.userId).lean();
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const org = await Organization.findById(auth.organizationId).lean();

    return NextResponse.json({
      user: {
        email: user.email,
        name: user.name,
        phone: user.phone,
        subscription: user.subscription,
        subscriptionExpiry: user.subscriptionExpiry,
        isSuspended: user.isSuspended,
        organizationId: user.organizationId,
        role: user.role || "member",
      },
      organization: org ? {
        id: org._id,
        name: org.name,
        slug: org.slug,
        members: org.members,
      } : null,
    });
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
