import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Organization } from "@/lib/models/Organization";
import { User } from "@/lib/models/User";
import { withAuth } from "@/lib/api-middleware";

export const DELETE = withAuth(async (req, auth) => {
  if (auth.role !== "owner" && auth.role !== "admin") {
    return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
  }

  const url = new URL(req.url);
  const memberId = url.pathname.split("/").pop();

  await connectDB();
  const org = await Organization.findById(auth.organizationId);
  if (!org) {
    return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });
  }

  const memberIdx = org.members?.findIndex((m: any) => m._id?.toString() === memberId || m.email === memberId);
  if (memberIdx === -1) {
    return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
  }

  const member = org.members[memberIdx];
  if (member.role === "owner") {
    return NextResponse.json({ error: "No puedes eliminar al propietario" }, { status: 400 });
  }

  org.members.splice(memberIdx, 1);
  await org.save();

  await User.updateOne(
    { email: member.email },
    { $unset: { organizationId: "", role: "" } }
  );

  return NextResponse.json({ success: true, members: org.members });
});

export const PATCH = withAuth(async (req, auth, body) => {
  if (auth.role !== "owner" && auth.role !== "admin") {
    return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
  }

  const url = new URL(req.url);
  const memberId = url.pathname.split("/").pop();
  const { role } = body;

  if (!role || !["admin", "member"].includes(role)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }

  await connectDB();
  const org = await Organization.findById(auth.organizationId);
  if (!org) {
    return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });
  }

  const member = org.members?.find((m: any) => m._id?.toString() === memberId || m.email === memberId);
  if (!member) {
    return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
  }
  if (member.role === "owner") {
    return NextResponse.json({ error: "No puedes cambiar el rol del propietario" }, { status: 400 });
  }

  member.role = role;
  await org.save();

  await User.updateOne({ email: member.email }, { role });

  return NextResponse.json({ success: true, members: org.members });
});
