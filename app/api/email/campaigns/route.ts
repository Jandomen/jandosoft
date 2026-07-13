import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/lib/models/Customer";
import { Store } from "@/lib/models/Store";
import { EmailLog } from "@/lib/models/EmailLog";
import { sendCampaignEmail } from "@/lib/email-service";
import { checkDailyLimitReached, DAILY_EMAIL_LIMIT } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limiter";
import { withAuth } from "@/lib/api-middleware";

export const POST = withAuth(async (req: NextRequest, auth, body) => {
  const { customerIds, subject, content, audience, storeId: bodyStoreId } = body;

  if ((!customerIds || !customerIds.length) && !audience) {
    return NextResponse.json({ error: "Faltan campos requeridos: customerIds o audience" }, { status: 400 });
  }
  if (!subject || !content) {
    return NextResponse.json({ error: "Faltan campos requeridos: subject, content" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rateCheck = checkRateLimit(`campaign:${auth.organizationId}:${ip}`, 5, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: `Demasiadas campañas. Espera ${Math.ceil(rateCheck.resetIn / 1000)}s.` }, { status: 429 });
  }

  await connectDB();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sentToday = await EmailLog.countDocuments({
    organizationId: auth.organizationId,
    createdAt: { $gte: today },
    template: "campaign",
  });

  if (checkDailyLimitReached(sentToday)) {
    return NextResponse.json({
      error: `Límite diario alcanzado (${DAILY_EMAIL_LIMIT}/día). Espera a mañana o configura un servicio SMTP con mayor capacidad.`,
    }, { status: 429 });
  }

  const store = await Store.findOne({ organizationId: auth.organizationId }).lean();
  if (!store) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
  }

  let customerFilter: any = { storeId: store._id, email: { $exists: true, $ne: "" } };
  if (customerIds && customerIds.length > 0) {
    customerFilter._id = { $in: customerIds };
  } else if (audience) {
    const now = new Date();
    if (audience === "active") customerFilter.lastPurchaseAt = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
    else if (audience === "new") customerFilter.createdAt = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
    else if (audience === "vip") customerFilter.totalSpent = { $gte: 500 };
  }

  const customers = await Customer.find(customerFilter).lean();
  if (!customers.length) {
    return NextResponse.json({ error: "No se encontraron clientes" }, { status: 404 });
  }

  const remaining = DAILY_EMAIL_LIMIT - sentToday;
  const batchSize = Math.min(customers.length, remaining);
  const batch = customers.slice(0, batchSize);

  const results = await Promise.allSettled(
    batch.map((customer) =>
      sendCampaignEmail({
        to: customer.email,
        subject,
        content,
        storeName: store.name,
        storeId: store._id.toString(),
        organizationId: auth.organizationId,
      })
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled" && r.value.success).length;
  const failed = results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.success)).length;

  return NextResponse.json({
    success: true,
    stats: { total: batchSize, sent, failed },
    dailyLimit: { max: DAILY_EMAIL_LIMIT, used: sentToday + sent, remaining: DAILY_EMAIL_LIMIT - (sentToday + sent) },
  });
});
