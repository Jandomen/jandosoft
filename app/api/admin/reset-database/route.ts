import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthFromHeaders, getAuthFromCookies } from "@/lib/auth";
import { User } from "@/lib/models/User";
import { Store } from "@/lib/models/Store";
import { Customer } from "@/lib/models/Customer";
import { Appointment } from "@/lib/models/Appointment";
import { Payment } from "@/lib/models/Payment";
import { Invoice } from "@/lib/models/Invoice";
import { Notification } from "@/lib/models/Notification";
import Conversation from "@/lib/models/Conversation";
import Message from "@/lib/models/Message";
import { Integration } from "@/lib/models/Integration";
import { ApiKey } from "@/lib/models/ApiKey";
import { EmailSettings } from "@/lib/models/EmailSettings";
import { EmailLog } from "@/lib/models/EmailLog";
import { Communication } from "@/lib/models/Communication";
import Contact from "@/lib/models/Contact";
import { WidgetConfig } from "@/lib/models/WidgetConfig";
import { PageView } from "@/lib/models/PageView";
import { Restaurant } from "@/lib/models/Restaurant";
import { SMSLog } from "@/lib/models/SMSLog";
import { ScheduledTask } from "@/lib/models/ScheduledTask";
import ConversationMemory from "@/lib/models/ConversationMemory";
import ConversationSummary from "@/lib/models/ConversationSummary";
import { NowPaymentsPayment } from "@/lib/models/NowPaymentsPayment";
import ChatUsage from "@/lib/models/ChatUsage";

export const dynamic = "force-dynamic";

const COLLECTIONS_TO_CLEAR = [
  { model: Store, name: "stores" },
  { model: Customer, name: "customers" },
  { model: Appointment, name: "appointments" },
  { model: Payment, name: "payments" },
  { model: Invoice, name: "invoices" },
  { model: Notification, name: "notifications" },
  { model: Conversation, name: "conversations" },
  { model: Message, name: "messages" },
  { model: Integration, name: "integrations" },
  { model: ApiKey, name: "apikeys" },
  { model: EmailSettings, name: "emailsettings" },
  { model: EmailLog, name: "emaillogs" },
  { model: Communication, name: "communications" },
  { model: Contact, name: "contacts" },
  { model: WidgetConfig, name: "widgetconfigs" },
  { model: PageView, name: "pageviews" },
  { model: Restaurant, name: "restaurants" },
  { model: SMSLog, name: "smslogs" },
  { model: ScheduledTask, name: "scheduledtasks" },
  { model: ConversationMemory, name: "conversationmemories" },
  { model: ConversationSummary, name: "conversationsummaries" },
  { model: NowPaymentsPayment, name: "nowpaymentspayments" },
  { model: ChatUsage, name: "chatusages" },
];

export async function POST(req: NextRequest) {
  const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await connectDB();

  const admin = await User.findById(auth.userId).select("isSuperAdmin").lean() as any;
  if (!admin?.isSuperAdmin) {
    return NextResponse.json({ error: "Solo el administrador puede realizar esta acción" }, { status: 403 });
  }

  const { confirmation } = await req.json();
  if (confirmation !== "ELIMINAR") {
    return NextResponse.json({ error: "Confirmación incorrecta" }, { status: 400 });
  }

  const results: Record<string, number> = {};

  for (const col of COLLECTIONS_TO_CLEAR) {
    try {
      const count = await col.model.countDocuments();
      await col.model.deleteMany({});
      results[col.name] = count;
    } catch {
      results[col.name] = -1;
    }
  }

  // Reset admin user subscription and plan
  await User.updateOne(
    { _id: auth.userId },
    {
      $set: {
        subscription: null,
        subscriptionStatus: null,
        subscriptionExpiry: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      },
      $unset: {
        originalPlan: "",
        originalPlanName: "",
        originalPlanPrice: "",
      },
    }
  );

  const totalDeleted = Object.values(results).filter(v => v > 0).reduce((a, b) => a + b, 0);

  return NextResponse.json({
    success: true,
    message: `${totalDeleted} documentos eliminados`,
    results,
  });
}
