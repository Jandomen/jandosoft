import { NextRequest, NextResponse } from "next/server";
import { getPublicStore } from "@/lib/store-utils";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const store = await getPublicStore(slug);
    if (!store) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ store });
  } catch (error) {
    console.error("GET public store error:", error);
    return NextResponse.json({ error: "Error fetching store" }, { status: 500 });
  }
}
