import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { User } from "@/lib/models/User";
import { getAuthFromCookies, getAuthFromHeaders } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { getPlanConfig, getPlanLimitsFromConfig } from "@/lib/plan-config";

async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "empresa";
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

  const config = await getPlanConfig();
  const limits = getPlanLimitsFromConfig(config, user.subscription);
  const expiry = user.subscriptionExpiry ? new Date(user.subscriptionExpiry) : null;
  if (expiry && expiry < new Date()) return "Plan vencido. Renueva para crear más empresas.";

  const storeCount = await Store.countDocuments({ organizationId });
  if (storeCount >= limits.maxStores) {
    return `Límite de ${limits.maxStores} empresas alcanzado en tu plan actual. Actualiza tu plan para crear más.`;
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

    let stores = await Store.find(filter).sort({ createdAt: -1 }).lean();

    // Auto-generate slugs for stores that don't have one
    const bulkUpdates: any[] = [];
    stores = stores.map((s: any) => {
      if (!s.slug) {
        const newSlug = slugify(s.name || "empresa");
        if (newSlug) {
          bulkUpdates.push({
            updateOne: { filter: { _id: s._id }, update: { $set: { slug: newSlug } } }
          });
          return { ...s, slug: newSlug };
        }
      }
      return s;
    });
    if (bulkUpdates.length > 0) {
      await Store.bulkWrite(bulkUpdates).catch(() => {});
    }

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
    const user = await User.findOne({ email: auth.email }).lean();
    if (user?.isSuspended) {
      return NextResponse.json({ error: "Cuenta suspendida. No puedes crear empresas." }, { status: 403 });
    }
    const limitError = await checkPlanLimit(auth.organizationId, auth.email);
    if (limitError) {
      return NextResponse.json({ error: limitError }, { status: 403 });
    }

    const body = await req.json();
    const slug = await generateUniqueSlug(body.name || "empresa");
    const store = await Store.create({
      ...body,
      slug,
      isPublic: true,
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
