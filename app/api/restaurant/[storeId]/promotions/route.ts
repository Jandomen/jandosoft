import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { Restaurant } from "@/lib/models/Restaurant";
import { getAuthFromHeaders, getAuthFromCookies } from "@/lib/auth";

async function getAuth(req: NextRequest) {
  return getAuthFromHeaders(req) || (await getAuthFromCookies());
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const auth = await getAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { storeId } = await params;

    await connectDB();

    const store = await Store.findOne({
      _id: storeId,
      organizationId: auth.organizationId,
    }).lean();
    if (!store) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    }

    const restaurant = await Restaurant.findOne({ storeId }).lean() as any;
    if (!restaurant) {
      return NextResponse.json({ promotions: [] });
    }

    return NextResponse.json({ promotions: restaurant.promotions || [] });
  } catch (error) {
    console.error("GET /api/restaurant/[storeId]/promotions error:", error);
    return NextResponse.json({ error: "Error al obtener promociones" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const auth = await getAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { storeId } = await params;
    const body = await req.json();

    if (!body.code || !body.type || !body.validFrom || !body.validUntil) {
      return NextResponse.json(
        { error: "code, type, validFrom y validUntil son requeridos" },
        { status: 400 }
      );
    }

    await connectDB();

    const store = await Store.findOne({
      _id: storeId,
      organizationId: auth.organizationId,
    }).lean();
    if (!store) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    }

    let restaurant = await Restaurant.findOne({ storeId }) as any;
    if (!restaurant) {
      restaurant = await Restaurant.create({ storeId });
    }

    const promotionId = Date.now();
    const promotion: any = {
      id: promotionId,
      code: body.code.toUpperCase(),
      description: body.description || "",
      type: body.type,
      value: body.value || 0,
      minOrder: body.minOrder || 0,
      maxUses: body.maxUses || 100,
      usedCount: 0,
      validFrom: body.validFrom,
      validUntil: body.validUntil,
      active: body.active !== false,
      applicableItems: body.applicableItems || [],
    };

    restaurant.promotions.push(promotion);
    await restaurant.save();

    return NextResponse.json({ promotion }, { status: 201 });
  } catch (error) {
    console.error("POST /api/restaurant/[storeId]/promotions error:", error);
    return NextResponse.json({ error: "Error al crear promoción" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const auth = await getAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { storeId } = await params;
    const body = await req.json();

    if (!body.id) {
      return NextResponse.json({ error: "id es requerido" }, { status: 400 });
    }

    await connectDB();

    const store = await Store.findOne({
      _id: storeId,
      organizationId: auth.organizationId,
    }).lean();
    if (!store) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    }

    const restaurant = await Restaurant.findOne({ storeId }) as any;
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });
    }

    const index = restaurant.promotions.findIndex((p: any) => p.id === body.id);
    if (index === -1) {
      return NextResponse.json({ error: "Promoción no encontrada" }, { status: 404 });
    }

    const updated = { ...restaurant.promotions[index].toObject(), ...body };
    if (updated.code) updated.code = updated.code.toUpperCase();
    restaurant.promotions[index] = updated;
    await restaurant.save();

    return NextResponse.json({ promotion: restaurant.promotions[index] });
  } catch (error) {
    console.error("PUT /api/restaurant/[storeId]/promotions error:", error);
    return NextResponse.json({ error: "Error al actualizar promoción" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const auth = await getAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { storeId } = await params;
    const body = await req.json();

    if (!body.id) {
      return NextResponse.json({ error: "id es requerido" }, { status: 400 });
    }

    await connectDB();

    const store = await Store.findOne({
      _id: storeId,
      organizationId: auth.organizationId,
    }).lean();
    if (!store) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    }

    const restaurant = await Restaurant.findOne({ storeId }) as any;
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });
    }

    const index = restaurant.promotions.findIndex((p: any) => p.id === body.id);
    if (index === -1) {
      return NextResponse.json({ error: "Promoción no encontrada" }, { status: 404 });
    }

    restaurant.promotions.splice(index, 1);
    await restaurant.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/restaurant/[storeId]/promotions error:", error);
    return NextResponse.json({ error: "Error al eliminar promoción" }, { status: 500 });
  }
}
