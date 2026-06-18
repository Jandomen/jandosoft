import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { EmailLog } from "@/lib/models/EmailLog";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body;

    if (!type || !data?.email_id) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    await connectDB();

    const update: any = {};
    if (type === "email.opened") {
      update.status = "opened";
      update.openedAt = new Date();
    } else if (type === "email.clicked") {
      update.status = "clicked";
    } else if (type === "email.delivered") {
      update.status = "sent";
    } else if (type === "email.bounced" || type === "email.complained") {
      update.status = "failed";
    }

    await EmailLog.findOneAndUpdate(
      { messageId: data.email_id },
      { $set: update }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Email Webhook] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
