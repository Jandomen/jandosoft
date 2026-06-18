import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ApiKey, generateApiKey, VALID_SCOPES } from "@/lib/models/ApiKey";
import { Store } from "@/lib/models/Store";
import { getAuthFromCookies, getAuthFromHeaders } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const store = await Store.findById(storeId).lean();
  if (!store || store.ownerEmail !== auth.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const keys = await ApiKey.find({ storeId, status: "active" })
    .select("name prefix scopes lastUsed createdAt status")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ keys });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, scopes } = body;
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  await connectDB();
  const store = await Store.findById(storeId).lean();
  if (!store || store.ownerEmail !== auth.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allowedScopes = Array.isArray(scopes)
    ? scopes.filter((s: string) => VALID_SCOPES.includes(s as any))
    : [...VALID_SCOPES];

  const { key, prefix } = generateApiKey(name);
  const doc = await ApiKey.create({
    storeId,
    organizationId: store.organizationId,
    name: name.trim(),
    key,
    prefix,
    scopes: allowedScopes,
  });

  return NextResponse.json({
    key: {
      id: doc._id,
      name: doc.name,
      prefix: doc.prefix,
      key: doc.key,
      scopes: doc.scopes,
      createdAt: doc.createdAt,
    },
    warning: "Save this key now. It won't be shown again.",
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { keyId } = await req.json();
  if (!keyId) return NextResponse.json({ error: "keyId required" }, { status: 400 });

  await connectDB();
  const store = await Store.findById(storeId).lean();
  if (!store || store.ownerEmail !== auth.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await ApiKey.findByIdAndUpdate(keyId, { status: "revoked" });
  return NextResponse.json({ success: true });
}
