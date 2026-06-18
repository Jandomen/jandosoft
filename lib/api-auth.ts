import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ApiKey } from "@/lib/models/ApiKey";
import { Store } from "@/lib/models/Store";

export interface ApiAuthResult {
  authorized: boolean;
  storeId?: string;
  organizationId?: string;
  scopes?: string[];
  error?: string;
  status?: number;
}

export async function authenticateApiKey(req: Request): Promise<ApiAuthResult> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { authorized: false, error: "Missing or invalid Authorization header. Use: Bearer jsk_xxx_xxx", status: 401 };
  }

  const key = authHeader.slice(7).trim();
  if (!key.startsWith("jsk_")) {
    return { authorized: false, error: "Invalid API key format", status: 401 };
  }

  try {
    await connectDB();
    const doc = await ApiKey.findOne({ key, status: "active" });
    if (!doc) {
      return { authorized: false, error: "API key not found or revoked", status: 401 };
    }

    doc.lastUsed = new Date();
    await doc.save();

    const store = await Store.findById(doc.storeId).lean();
    if (!store) {
      return { authorized: false, error: "Store not found", status: 404 };
    }

    return {
      authorized: true,
      storeId: doc.storeId.toString(),
      organizationId: doc.organizationId.toString(),
      scopes: doc.scopes,
    };
  } catch {
    return { authorized: false, error: "Internal server error", status: 500 };
  }
}
