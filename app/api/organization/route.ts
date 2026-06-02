import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Organization } from "@/lib/models/Organization";
import { User } from "@/lib/models/User";
import { withAuth, requireRole } from "@/lib/api-middleware";

export const GET = withAuth(async (req, auth) => {
  await connectDB();
  const org = await Organization.findById(auth.organizationId).lean();
  if (!org) {
    return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ organization: org });
});

export const PATCH = withAuth(async (req, auth, body) => {
  if (auth.role !== "owner" && auth.role !== "admin") {
    return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
  }
  await connectDB();
  const { name } = body;
  if (!name) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }
  const org = await Organization.findByIdAndUpdate(
    auth.organizationId,
    { name },
    { new: true }
  ).lean();
  return NextResponse.json({ organization: org });
});
