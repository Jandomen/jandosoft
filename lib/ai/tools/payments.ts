import type { ToolDefinition, ToolResult } from "./base";

export const TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "create_checkout",
      description: "Generate a Stripe checkout link for payment. Requires customer email.",
      parameters: {
        type: "object",
        properties: {
          customerEmail: { type: "string", description: "Customer email for the receipt" },
          customerName: { type: "string", description: "Customer name" },
          amount: { type: "number", description: "Total amount in dollars" },
          description: { type: "string", description: "Description of the purchase" },
          items: { type: "array", description: "Array of {name, price, quantity} objects", items: { type: "object" } },
          currency: { type: "string", description: "Currency code (default usd)" },
        },
        required: ["customerEmail"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_payments",
      description: "List payments received by the store",
      parameters: {
        type: "object",
        properties: {
          startDate: { type: "string", description: "Start date (YYYY-MM-DD)" },
          endDate: { type: "string", description: "End date (YYYY-MM-DD)" },
          limit: { type: "number", description: "Max results (default 20)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_my_subscription",
      description: "Check the current user's subscription details",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "create_subscription_checkout",
      description: "Generate a Stripe checkout link for a subscription plan",
      parameters: {
        type: "object",
        properties: {
          planId: { type: "string", enum: ["starter", "business", "enterprise"], description: "Plan ID" },
        },
        required: ["planId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cancel_subscription",
      description: "Cancel the current subscription (cancels at period end, no refunds)",
      parameters: {
        type: "object",
        properties: {
          confirm: { type: "boolean", description: "Must be true to confirm cancellation" },
        },
        required: ["confirm"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_invoice",
      description: "Create a new invoice for a customer",
      parameters: {
        type: "object",
        properties: {
          customerEmail: { type: "string", description: "Customer email" },
          customerName: { type: "string", description: "Customer name" },
          amount: { type: "number", description: "Invoice amount" },
          currency: { type: "string", description: "Currency (default USD)" },
          items: { type: "array", description: "Line items", items: { type: "object" } },
          status: { type: "string", description: "Status (default pending)" },
        },
        required: ["customerEmail", "amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_invoices",
      description: "List all invoices",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by status" },
          limit: { type: "number", description: "Max results (default 20)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_invoice_status",
      description: "Update the status of an invoice",
      parameters: {
        type: "object",
        properties: {
          invoiceId: { type: "string", description: "Invoice ID" },
          status: { type: "string", description: "New status" },
        },
        required: ["invoiceId", "status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_invoice",
      description: "Delete an invoice by ID",
      parameters: {
        type: "object",
        properties: {
          invoiceId: { type: "string", description: "Invoice ID to delete" },
        },
        required: ["invoiceId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_invoice_email",
      description: "Send an invoice via email",
      parameters: {
        type: "object",
        properties: {
          invoiceId: { type: "string", description: "Invoice ID" },
        },
        required: ["invoiceId"],
      },
    },
  },
];

export async function executePaymentTool(name: string, args: any, store: any, userId: string): Promise<ToolResult> {
  const { connectDB } = await import("@/lib/mongodb");

  if (name === "create_checkout") {
    const storeId = store?._id || store?.id;
    if (!storeId) return { error: "No store selected" };
    const { Store } = await import("@/lib/models/Store");
    await connectDB();
    const s = await Store.findById(storeId);
    if (!s) return { error: "Store not found" };
    if (!s.stripeAccountId || !s.paymentsEnabled) {
      return { error: "Esta empresa no tiene Stripe conectado o los pagos no están habilitados. Conecta Stripe desde el panel." };
    }
    const { stripe } = await import("@/lib/stripe");
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
    const currency = (args.currency || "usd").toLowerCase();

    let totalAmount = args.amount;
    let description = args.description || "";
    if (args.items && Array.isArray(args.items) && args.items.length > 0) {
      totalAmount = args.items.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);
      description = args.items.map((i: any) => `${i.quantity}x ${i.name}`).join(", ");
    }
    if (!totalAmount) return { error: "Debes proporcionar un amount o items" };

    const amountInCents = Math.round(totalAmount * 100);
    const feePercent = s.platformFeePercent ?? 5;
    const applicationFee = Math.round(amountInCents * (feePercent / 100));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency,
          product_data: { name: description?.substring(0, 150) || "Pago Jandosoft" },
          unit_amount: amountInCents,
        },
        quantity: 1,
      }],
      customer_email: args.customerEmail,
      success_url: `${baseUrl}/?stripe_success={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?stripe_cancel=1`,
      payment_intent_data: {
        transfer_data: { destination: s.stripeAccountId },
        application_fee_amount: applicationFee,
        metadata: {
          storeId: s._id.toString(), storeName: s.name, ownerEmail: s.ownerEmail,
          customerEmail: args.customerEmail, customerName: args.customerName || "",
        },
      },
      metadata: {
        customerEmail: args.customerEmail, customerName: args.customerName || "", storeId: s._id.toString(),
      },
    });

    return { success: true, message: `Link de pago generado: ${session.url}`, checkoutUrl: session.url };
  }

  if (name === "list_payments") {
    const storeId = store?._id || store?.id;
    if (!storeId) return { error: "No store selected" };
    const { Payment } = await import("@/lib/models/Payment");
    await connectDB();
    const filter: any = { storeId };
    if (args.startDate || args.endDate) {
      filter.createdAt = {};
      if (args.startDate) filter.createdAt.$gte = new Date(args.startDate);
      if (args.endDate) filter.createdAt.$lte = new Date(args.endDate + "T23:59:59Z");
    }
    const payments = await Payment.find(filter).sort({ createdAt: -1 }).limit(args.limit || 20).lean();
    return {
      success: true,
      payments: payments.map((p: any) => ({
        id: p._id, customerName: p.customerName, customerEmail: p.customerEmail,
        amount: p.amount, currency: p.currency, platformFee: p.platformFee,
        netAmount: p.netAmount, status: p.status, date: p.createdAt,
      })),
      total: payments.length,
    };
  }

  if (name === "check_my_subscription") {
    const { User } = await import("@/lib/models/User");
    await connectDB();
    const user = await User.findById(userId).lean();
    if (!user) return { error: "Usuario no encontrado" };
    return {
      success: true,
      subscription: {
        plan: user.subscription || "free", status: user.subscriptionStatus || "active",
        expiry: user.subscriptionExpiry, stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
      },
    };
  }

  if (name === "create_subscription_checkout") {
    const { User } = await import("@/lib/models/User");
    const { getPlanConfig } = await import("@/lib/plan-config");
    await connectDB();
    const user = await User.findById(userId).lean();
    if (!user) return { error: "Usuario no encontrado" };
    const config = await getPlanConfig();
    const plan = config.plans.find((p: any) => p.id === args.planId);
    if (!plan) return { error: `Plan "${args.planId}" no encontrado` };
    if (!plan.stripePriceId) return { error: `El plan ${plan.name} no tiene un precio configurado en Stripe.` };
    const { stripe } = await import("@/lib/stripe");
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email, name: user.name, metadata: { userId },
      });
      stripeCustomerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      customer: stripeCustomerId,
      success_url: `${baseUrl}/?stripe_success={CHECKOUT_SESSION_ID}&plan=${args.planId}`,
      cancel_url: `${baseUrl}/?stripe_cancel=1`,
      metadata: { customerEmail: user.email, planId: args.planId, planName: plan.name },
      subscription_data: { metadata: { customerEmail: user.email, planId: args.planId } },
    });

    return {
      success: true,
      message: `Link de pago para ${plan.name} ($${plan.price}/mes) generado: ${session.url}`,
      checkoutUrl: session.url, plan: plan.name, price: plan.price,
    };
  }

  if (name === "cancel_subscription") {
    if (!args.confirm) {
      return { error: "Debes confirmar la cancelación. ¿Estás seguro de que deseas cancelar tu suscripción? No hay reembolsos." };
    }
    const { User } = await import("@/lib/models/User");
    const { stripe } = await import("@/lib/stripe");
    await connectDB();
    const user = await User.findById(userId).lean();
    if (!user) return { error: "Usuario no encontrado" };
    if (!user.stripeSubscriptionId) return { error: "No tienes una suscripción activa para cancelar." };
    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
      metadata: { canceledBy: "user", canceledAt: new Date().toISOString() },
    }) as any;
    const periodEnd = new Date(subscription.current_period_end * 1000);
    return {
      success: true,
      message: `Tu suscripción se cancelará al final del periodo actual (${periodEnd.toLocaleDateString()}). No hay reembolsos. Seguirás teniendo acceso hasta esa fecha.`,
      cancelsAt: periodEnd.toISOString(),
    };
  }

  if (["create_invoice", "list_invoices", "update_invoice_status", "delete_invoice", "send_invoice_email"].includes(name)) {
    const { Invoice } = await import("@/lib/models/Invoice");
    await connectDB();

    if (name === "create_invoice") {
      const invoice = await Invoice.create({
        userEmail: args.customerEmail, userName: args.customerName || "",
        amount: args.amount, currency: args.currency || "USD",
        items: args.items || [], status: args.status || "pending",
        organizationId: store?.organizationId || undefined,
      });
      return { success: true, message: `Factura creada por $${args.amount} para ${args.customerEmail}`, invoiceId: invoice._id };
    }

    if (name === "list_invoices") {
      const filter: any = {};
      if (args.status) filter.status = args.status;
      const invoices = await Invoice.find(filter).sort({ createdAt: -1 }).limit(args.limit || 20).lean();
      return { success: true, invoices, count: invoices.length };
    }

    if (name === "update_invoice_status") {
      const invoice = await Invoice.findByIdAndUpdate(args.invoiceId, { $set: { status: args.status } }, { new: true }).lean();
      if (!invoice) return { error: `Factura ${args.invoiceId} no encontrada` };
      return { success: true, message: `Factura actualizada a "${args.status}"` };
    }

    if (name === "delete_invoice") {
      const invoice = await Invoice.findByIdAndDelete(args.invoiceId).lean();
      if (!invoice) return { error: `Factura ${args.invoiceId} no encontrada` };
      return { success: true, message: `Factura ${args.invoiceId} eliminada` };
    }

    if (name === "send_invoice_email") {
      const invoice = await Invoice.findById(args.invoiceId).lean();
      if (!invoice) return { error: `Factura ${args.invoiceId} no encontrada` };
      const { sendEmail } = await import("@/lib/email");
      await sendEmail({
        to: invoice.userEmail,
        subject: `Factura #${invoice.invoiceNumber || invoice._id}`,
        html: `<p>Hola ${invoice.userName},</p><p>Tu factura por $${invoice.amount} está disponible.</p><p>Estado: ${invoice.status}</p>`,
      });
      return { success: true, message: `Factura enviada por email a ${invoice.userEmail}` };
    }
  }

  return { error: `Unknown payment tool: ${name}` };
}
