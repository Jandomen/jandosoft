import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Invoice } from "@/lib/models/Invoice";
import { getAuthFromCookies, getAuthFromHeaders } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getAuth(req: NextRequest) {
  return getAuthFromHeaders(req) || await getAuthFromCookies();
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    await connectDB();
    let filter: any = {};

    if (auth) {
      filter.organizationId = auth.organizationId;
    }
    if (email && !auth) {
      filter.userEmail = email;
    }

    const invoices = await Invoice.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("GET invoices error:", error);
    return NextResponse.json({ error: "Error loading invoices" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    await connectDB();
    const body = await req.json();

    const last = await Invoice.findOne().sort({ createdAt: -1 }).lean();
    let nextNum = 1;
    if (last) {
      const parts = (last as any).invoiceNumber.split("-");
      nextNum = parseInt(parts[parts.length - 1] || "0") + 1;
    }
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(nextNum).padStart(4, "0")}`;

    const invoice = await Invoice.create({
      ...body,
      invoiceNumber,
      organizationId: auth?.organizationId || null,
    });
    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("POST invoice error:", error);
    return NextResponse.json({ error: "Error creating invoice" }, { status: 500 });
  }
}
