import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Organization } from "@/lib/models/Organization";
import { User } from "@/lib/models/User";
import { withAuth } from "@/lib/api-middleware";

export const GET = withAuth(async (req, auth) => {
  await connectDB();
  const org = await Organization.findById(auth.organizationId).lean();
  if (!org) {
    return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ members: org.members || [] });
});

export const POST = withAuth(async (req, auth, body) => {
  if (auth.role !== "owner" && auth.role !== "admin") {
    return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
  }
  await connectDB();
  const { email, role } = body;
  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  const targetUser = await User.findOne({ email });
  if (!targetUser) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const org = await Organization.findById(auth.organizationId);
  if (!org) {
    return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });
  }

  const alreadyMember = org.members?.find((m: any) => m.email === email);
  if (alreadyMember) {
    return NextResponse.json({ error: "El usuario ya es miembro" }, { status: 400 });
  }

  org.members.push({
    userId: targetUser._id,
    email: targetUser.email,
    name: targetUser.name,
    role: role || "member",
    joinedAt: new Date(),
  });
  await org.save();

  targetUser.organizationId = org._id;
  targetUser.role = role || "member";
  await targetUser.save();

  return NextResponse.json({ success: true, members: org.members });
});
