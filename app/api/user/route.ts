import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { Store } from "@/lib/models/Store";
import bcrypt from "bcryptjs";
import { getAuthFromCookies, getAuthFromHeaders } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
    if (auth) {
      await connectDB();
      const user = await User.findById(auth.userId);
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
      const now = new Date();
      if (user.suspendedUntil && user.suspendedUntil < now) {
        user.isSuspended = false;
        user.suspendedUntil = null;
        await user.save();
      }
      return NextResponse.json({
        user: {
          email: user.email,
          name: user.name,
          subscription: user.subscription,
          subscriptionExpiry: user.subscriptionExpiry,
        isSuspended: user.isSuspended,
          emailVerified: user.emailVerified ?? false,
          organizationId: user.organizationId,
          role: user.role,
        }
      });
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

    await connectDB();
    const user = await User.findOne({ email }).lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({
      user: {
        email: user.email,
        name: user.name,
        subscription: user.subscription,
        subscriptionExpiry: user.subscriptionExpiry,
        isSuspended: user.isSuspended,
        emailVerified: user.emailVerified ?? false,
        organizationId: user.organizationId,
        role: user.role,
      }
    });
  } catch (error) {
    console.error("GET user error:", error);
    return NextResponse.json({ error: "Error fetching user" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    await connectDB();
    const user = await User.findByIdAndUpdate(
      auth.userId,
      { $set: body },
      { new: true }
    ).lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        subscription: user.subscription,
        subscriptionExpiry: user.subscriptionExpiry,
        isSuspended: user.isSuspended,
        organizationId: user.organizationId,
        role: user.role,
      }
    });
  } catch (error) {
    console.error("PATCH user error:", error);
    return NextResponse.json({ error: "Error updating user" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { password } = await req.json();

    await connectDB();
    const user = await User.findById(auth.userId);
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    if (!password || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 403 });
    }

    const orgId = user.organizationId;

    await User.findByIdAndDelete(auth.userId);

    if (orgId) {
      await Store.deleteMany({ organizationId: orgId });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE user error:", error);
    return NextResponse.json({ error: "Error al eliminar la cuenta" }, { status: 500 });
  }
}
