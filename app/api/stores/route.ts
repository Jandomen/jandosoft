import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { User } from "@/lib/models/User";
import { getAuthFromCookies, getAuthFromHeaders } from "@/lib/auth";

const PLAN_LIMITS: Record<string, { maxStores: number; maxProductsPerStore: number }> = {
  free: { maxStores: 3, maxProductsPerStore: 20 },
  basic: { maxStores: 10, maxProductsPerStore: 100 },
  enterprise: { maxStores: 999, maxProductsPerStore: 9999 },
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "tienda";
  let slug = base;
  let counter = 1;
  while (await Store.findOne({ slug }).lean()) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}

async function getAuth(req: NextRequest) {
  return getAuthFromHeaders(req) || await getAuthFromCookies();
}

async function checkPlanLimit(organizationId: string, userEmail: string): Promise<string | null> {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) return "Usuario no encontrado";

  const sub = user.subscription || "free";
  const limits = PLAN_LIMITS[sub] || PLAN_LIMITS.free;
  const expiry = user.subscriptionExpiry ? new Date(user.subscriptionExpiry) : null;
  if (expiry && expiry < new Date()) return "Plan vencido. Renueva para crear más tiendas.";

  const storeCount = await Store.countDocuments({ organizationId });
  if (storeCount >= limits.maxStores) {
    return `Límite de ${limits.maxStores} tiendas alcanzado en tu plan actual. Actualiza tu plan para crear más.`;
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const orgId = searchParams.get("organizationId");

    await connectDB();
    let filter: any = {};

    if (auth) {
      filter.organizationId = auth.organizationId;
    } else if (orgId) {
      filter.organizationId = orgId;
    } else if (email) {
      filter.ownerEmail = email;
    }

    const stores = await Store.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ stores });
  } catch (error) {
    console.error("GET stores error:", error);
    return NextResponse.json({ error: "Error fetching stores" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await connectDB();
    const limitError = await checkPlanLimit(auth.organizationId, auth.email);
    if (limitError) {
      return NextResponse.json({ error: limitError }, { status: 403 });
    }

    const body = await req.json();
    const slug = await generateUniqueSlug(body.name || "tienda");
    const store = await Store.create({
      ...body,
      slug,
      isPublic: false,
      publicAI: false,
      organizationId: auth.organizationId,
      ownerEmail: auth.email,
    });
    return NextResponse.json({ store }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json({ error: "El slug ya está en uso. Intenta de nuevo." }, { status: 409 });
    }
    console.error("POST store error:", error);
    return NextResponse.json({ error: "Error creating store" }, { status: 500 });
  }
}
