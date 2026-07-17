import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const barcode = searchParams.get("barcode");
  const productId = searchParams.get("id");

  if (!barcode && !productId) {
    return NextResponse.json({ error: "Se requiere barcode o id" }, { status: 400 });
  }

  try {
    await connectDB();
    const store = await Store.findOne({ slug }).lean() as any;
    if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

    let product = null;

    if (barcode) {
      product = store.products?.find((p: any) => p.barcode === barcode);
    } else if (productId) {
      product = store.products?.find((p: any) => p.id === parseInt(productId));
    }

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const currency = store.currency || "USD";
    const symbol = currency === "MXN" ? "$" : currency === "COP" ? "$" : currency === "ARS" ? "$" : "$";

    return NextResponse.json({
      product: {
        ...product,
        storeSlug: store.slug,
        storeName: store.name,
        currency,
        symbol,
      },
    });
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
