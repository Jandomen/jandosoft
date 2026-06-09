import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookies, getAuthFromHeaders } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Contact from "@/lib/models/Contact";
import { User } from "@/lib/models/User";

export async function GET(req: NextRequest) {
  const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await connectDB();
  const contacts = await Contact.find({ userId: auth.userId })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ contacts });
}

export async function POST(req: NextRequest) {
  const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { contactEmail } = await req.json();
  if (!contactEmail?.trim()) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  await connectDB();

  const targetUser = await User.findOne({ email: contactEmail.trim() });
  if (!targetUser) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  if (targetUser._id.toString() === auth.userId.toString()) {
    return NextResponse.json({ error: "No puedes agregarte a ti mismo" }, { status: 400 });
  }

  const existing = await Contact.findOne({
    userId: auth.userId,
    contactUserId: targetUser._id,
  });

  if (existing) {
    return NextResponse.json({ contact: existing, created: false });
  }

  const contact = await Contact.create({
    userId: auth.userId,
    contactUserId: targetUser._id,
    contactEmail: targetUser.email,
    contactName: targetUser.name || targetUser.email.split("@")[0],
  });

  return NextResponse.json({ contact, created: true });
}

export async function DELETE(req: NextRequest) {
  const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const contactId = searchParams.get("id");
  if (!contactId) {
    return NextResponse.json({ error: "ID de contacto requerido" }, { status: 400 });
  }

  await connectDB();
  await Contact.deleteOne({ _id: contactId, userId: auth.userId });

  return NextResponse.json({ deleted: true });
}
