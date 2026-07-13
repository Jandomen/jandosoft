import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Organization } from "@/lib/models/Organization";
import { withAuth } from "@/lib/api-middleware";

export const GET = withAuth(async (req, auth) => {
  await connectDB();
  const org = await Organization.findById(auth.organizationId)
    .select("taxId businessName address invoiceSeries verifactuEnabled")
    .lean();
  if (!org) {
    return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ taxInfo: org });
});

export const PUT = withAuth(async (req, auth, body) => {
  if (auth.role !== "owner" && auth.role !== "admin") {
    return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
  }
  await connectDB();
  const allowed = ["taxId", "businessName", "address", "invoiceSeries", "verifactuEnabled"];
  const update: Record<string, any> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key];
  }
  const org = await Organization.findByIdAndUpdate(
    auth.organizationId,
    { $set: update },
    { new: true }
  ).select("taxId businessName address invoiceSeries verifactuEnabled").lean();
  return NextResponse.json({ taxInfo: org });
});
