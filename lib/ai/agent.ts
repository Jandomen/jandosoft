const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "create_product",
      description: "Add a new product to the currently selected store",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Product name" },
          price: { type: "number", description: "Product price in dollars" },
          stock: { type: "number", description: "Initial stock quantity (default 0)" },
        },
        required: ["name", "price"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_product",
      description: "Remove a product from the currently selected store by name",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Exact name of the product to remove" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_store",
      description: "Create a new store for the user",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Store name" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_store",
      description: "Delete a store by its name",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Exact name of the store to delete" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_store",
      description: "Update a store's name, description, or industry",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Current exact name of the store to update" },
          newName: { type: "string", description: "New name for the store (optional)" },
          description: { type: "string", description: "New description (optional)" },
          industry: { type: "string", description: "New industry (optional)" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_appointment",
      description: "Create a new appointment. Only customerName, date and time are required — everything else has defaults. Use implied dates (ej. 'mañana' = tomorrow, 'próximo lunes' = next Monday) without asking.",
      parameters: {
        type: "object",
        properties: {
          customerName: { type: "string", description: "Customer name (required)" },
          customerEmail: { type: "string", description: "Customer email (opcional)" },
          customerPhone: { type: "string", description: "Customer phone (opcional)" },
          serviceName: { type: "string", description: "Service name (default: 'General')" },
          servicePrice: { type: "number", description: "Service price in dollars (default: 0)" },
          date: { type: "string", description: "Date in YYYY-MM-DD format" },
          time: { type: "string", description: "Time in HH:MM format" },
          duration: { type: "number", description: "Duration in minutes (default: 60)" },
          notes: { type: "string", description: "Optional notes" },
        },
        required: ["customerName", "date", "time"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_appointment",
      description: "Update an existing appointment's date, time, status, or notes",
      parameters: {
        type: "object",
        properties: {
          appointmentId: { type: "string", description: "Appointment ID" },
          date: { type: "string", description: "New date YYYY-MM-DD (optional)" },
          time: { type: "string", description: "New time HH:MM (optional)" },
          status: { type: "string", enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"], description: "New status (optional)" },
          notes: { type: "string", description: "New notes (optional)" },
        },
        required: ["appointmentId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cancel_appointment",
      description: "Cancel an appointment by setting its status to cancelled",
      parameters: {
        type: "object",
        properties: {
          appointmentId: { type: "string", description: "Appointment ID to cancel" },
        },
        required: ["appointmentId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_email",
      description: "Send an email to any recipient. If content is provided, it's used as-is. template is only used when no custom content is given.",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Recipient email address" },
          subject: { type: "string", description: "Email subject line" },
          content: { type: "string", description: "Custom HTML content. Si se envía content, NO incluir template." },
          template: { type: "string", enum: ["", "welcome", "verification", "password-reset", "invoice", "appointment-reminder", "payment-confirmation", "order-confirmation", "new-client", "payment-received", "campaign"], description: "Predefined template (solo usar si no hay content personalizado)" },
          templateParams: { type: "object", description: "Parameters for the template (e.g. userName, token, customerName, date, time, amount, etc.)", properties: {
            userName: { type: "string" },
            token: { type: "string" },
            customerName: { type: "string" },
            customerEmail: { type: "string" },
            customerPhone: { type: "string" },
            serviceName: { type: "string" },
            date: { type: "string" },
            time: { type: "string" },
            notes: { type: "string" },
            amount: { type: "number" },
            currency: { type: "string" },
            invoiceNumber: { type: "string" },
            storeName: { type: "string" },
            description: { type: "string" },
            items: { type: "array", items: { type: "string" } },
          } },
        },
        required: ["to", "subject"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_appointments",
      description: "List appointments with optional date or status filters",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "Filter by date YYYY-MM-DD (optional)" },
          status: { type: "string", enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"], description: "Filter by status (optional)" },
          limit: { type: "number", description: "Max results to return (default 20)" },
        },
      },
    },
  },
];

async function callLLM(messages: any[], tools?: any[]) {
  const options: any = {
    model: "openai/gpt-4o-mini",
    messages,
  };
  if (tools) options.tools = tools;

  if (OPENAI_KEY) {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: OPENAI_KEY });
    return await client.chat.completions.create({
      ...options,
      model: "gpt-4o-mini",
    });
  }

  if (OPENROUTER_KEY) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_KEY}`,
      },
      body: JSON.stringify(options),
    });
    return await res.json();
  }

  throw new Error("No API key configured");
}

async function executeTool(toolCall: any, store: any, userId: string) {
  const { name, arguments: rawArgs } = toolCall.function;
  const args = JSON.parse(rawArgs);

  if (name === "create_product") {
    const storeId = store?._id || store?.id;
    if (!storeId) return { error: "No store selected" };
    const { connectDB } = await import("@/lib/mongodb");
    const { Store } = await import("@/lib/models/Store");
    await connectDB();
    const s = await Store.findById(storeId);
    if (!s) return { error: "Store not found" };
    const maxId = Math.max(0, ...s.products.map((p: any) => p.id || 0));
    s.products.push({ id: maxId + 1, name: args.name, price: args.price, stock: args.stock ?? 0 });
    await s.save();
    return { success: true, message: `Producto "${args.name}" creado con éxito` };
  }

  if (name === "delete_product") {
    const storeId = store?._id || store?.id;
    if (!storeId) return { error: "No store selected" };
    const { connectDB } = await import("@/lib/mongodb");
    const { Store } = await import("@/lib/models/Store");
    await connectDB();
    const s = await Store.findById(storeId);
    if (!s) return { error: "Store not found" };
    const idx = s.products.findIndex((p: any) => p.name === args.name);
    if (idx === -1) return { error: `Producto "${args.name}" no encontrado` };
    s.products.splice(idx, 1);
    await s.save();
    return { success: true, message: `Producto "${args.name}" eliminado con éxito` };
  }

  if (name === "create_store") {
    const { connectDB } = await import("@/lib/mongodb");
    const { Store } = await import("@/lib/models/Store");
    const { User } = await import("@/lib/models/User");
    await connectDB();
    const user = await User.findById(userId);
    if (!user) return { error: "User not found" };
    const slug = args.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const store = await Store.create({
      ownerEmail: user.email,
      name: args.name,
      slug,
      type: "general",
      organizationId: user.organizationId,
      products: [],
      customers: [],
      orders: [],
      services: [],
    });
    return { success: true, message: `Tienda "${args.name}" creada con éxito`, storeId: store._id };
  }

  if (name === "delete_store") {
    const { connectDB } = await import("@/lib/mongodb");
    const { Store } = await import("@/lib/models/Store");
    const { User } = await import("@/lib/models/User");
    await connectDB();
    const user = await User.findById(userId);
    if (!user) return { error: "User not found" };
    const store = await Store.findOneAndDelete({ name: args.name, organizationId: user.organizationId });
    if (!store) return { error: `Tienda "${args.name}" no encontrada` };
    return { success: true, message: `Tienda "${args.name}" eliminada con éxito` };
  }

  if (name === "update_store") {
    const { connectDB } = await import("@/lib/mongodb");
    const { Store } = await import("@/lib/models/Store");
    const { User } = await import("@/lib/models/User");
    await connectDB();
    const user = await User.findById(userId);
    if (!user) return { error: "User not found" };
    const update: any = {};
    if (args.newName) update.name = args.newName;
    if (args.description) update.desc = args.description;
    if (args.industry) update.industry = args.industry;
    const store = await Store.findOneAndUpdate(
      { name: args.name, organizationId: user.organizationId },
      { $set: update },
      { new: true },
    );
    if (!store) return { error: `Tienda "${args.name}" no encontrada` };
    return { success: true, message: `Tienda "${args.name}" actualizada con éxito` };
  }

  if (name === "create_appointment") {
    const storeId = store?._id || store?.id;
    if (!storeId) return { error: "No store selected" };
    const { connectDB } = await import("@/lib/mongodb");
    const { Appointment } = await import("@/lib/models/Appointment");
    await connectDB();
    const appointment = await Appointment.create({
      storeId,
      customerInfo: {
        name: args.customerName,
        email: args.customerEmail || "",
        phone: args.customerPhone || "",
      },
      service: {
        id: 0,
        name: args.serviceName || "General",
        price: args.servicePrice || 0,
        duration: args.duration || 60,
      },
      date: args.date,
      time: args.time,
      duration: args.duration || 60,
      notes: args.notes || "",
      status: "pending",
      createdBy: "owner",
    });
    return { success: true, message: `Cita creada: ${args.customerName} el ${args.date} a las ${args.time}`, appointmentId: appointment._id };
  }

  if (name === "update_appointment") {
    const { connectDB } = await import("@/lib/mongodb");
    const { Appointment } = await import("@/lib/models/Appointment");
    await connectDB();
    const update: any = {};
    if (args.date) update.date = args.date;
    if (args.time) update.time = args.time;
    if (args.status) update.status = args.status;
    if (args.notes !== undefined) update.notes = args.notes;
    const updated = await Appointment.findByIdAndUpdate(args.appointmentId, { $set: update }, { new: true }).lean();
    if (!updated) return { error: `Cita con ID ${args.appointmentId} no encontrada` };
    return { success: true, message: `Cita actualizada correctamente` };
  }

  if (name === "cancel_appointment") {
    const { connectDB } = await import("@/lib/mongodb");
    const { Appointment } = await import("@/lib/models/Appointment");
    await connectDB();
    const updated = await Appointment.findByIdAndUpdate(args.appointmentId, { $set: { status: "cancelled" } }, { new: true }).lean();
    if (!updated) return { error: `Cita con ID ${args.appointmentId} no encontrada` };
    return { success: true, message: `Cita cancelada correctamente` };
  }

  if (name === "list_appointments") {
    const storeId = store?._id || store?.id;
    if (!storeId) return { error: "No store selected" };
    const { connectDB } = await import("@/lib/mongodb");
    const { Appointment } = await import("@/lib/models/Appointment");
    await connectDB();
    const filter: any = { storeId };
    if (args.date) filter.date = args.date;
    if (args.status) filter.status = args.status;
    const appointments = await Appointment.find(filter)
      .sort({ date: 1, time: 1 })
      .limit(args.limit || 20)
      .lean();
    return {
      success: true,
      appointments: appointments.map((a: any) => ({
        id: a._id,
        customer: a.customerInfo.name,
        service: a.service?.name,
        date: a.date,
        time: a.time,
        duration: a.duration,
        status: a.status,
        notes: a.notes,
      })),
      count: appointments.length,
    };
  }

  if (name === "send_email") {
    const { sendEmail } = await import("@/lib/email");
    const { connectDB } = await import("@/lib/mongodb");
    const { EmailLog } = await import("@/lib/models/EmailLog");
    const {
      welcomeEmailHtml,
      passwordResetEmailHtml,
      verificationEmailHtml,
      invoiceEmailHtml,
      appointmentReminderEmailHtml,
      paymentConfirmationEmailHtml,
      orderConfirmationEmailHtml,
      newClientNotificationEmailHtml,
      paymentReceivedNotificationEmailHtml,
      campaignEmailHtml,
    } = await import("@/lib/email-templates");

    const TEMPLATES: Record<string, (p: any) => string> = {
      welcome: (p) => welcomeEmailHtml(p.userName),
      "password-reset": (p) => passwordResetEmailHtml(p.token),
      verification: (p) => verificationEmailHtml(p.token, p.userName),
      invoice: (p) => invoiceEmailHtml(p),
      "appointment-reminder": (p) => appointmentReminderEmailHtml(p),
      "payment-confirmation": (p) => paymentConfirmationEmailHtml(p),
      "order-confirmation": (p) => orderConfirmationEmailHtml(p),
      "new-client": (p) => newClientNotificationEmailHtml(p),
      "payment-received": (p) => paymentReceivedNotificationEmailHtml(p),
      campaign: (p) => campaignEmailHtml(p),
    };

    let html: string;
    if (args.content) {
      html = args.content;
    } else if (args.template && TEMPLATES[args.template]) {
      html = TEMPLATES[args.template](args.templateParams || {});
    } else {
      return { error: "Debes proporcionar content o un template válido" };
    }

    const { User } = await import("@/lib/models/User");
    await connectDB();
    const user = await User.findById(userId);
    const result = await sendEmail({ to: args.to, subject: args.subject, html });
    await EmailLog.create({
      to: args.to,
      subject: args.subject,
      messageId: result.messageId,
      status: result.success ? "sent" : "failed",
      organizationId: user?.organizationId || "unknown",
      error: result.error,
    });

    if (!result.success) {
      return { error: `Error al enviar correo: ${result.error}` };
    }
    return { success: true, message: `Correo enviado a ${args.to}: "${args.subject}"` };
  }

  return { error: `Unknown tool: ${name}` };
}

export async function askBusinessAI({
  message,
  store,
  history,
}: {
  message: string;
  store: any;
  history?: any[];
}): Promise<string> {
  const storeExists = store && store.name;
  const sub = store?._subscription;

  const productsCount = store?.products?.length || 0;
  const customersCount = store?.customers?.length || 0;
  const ordersCount = store?.orders?.length || 0;
  const servicesCount = store?.services?.length || 0;
  const maxProducts = sub?.maxProducts || Infinity;
  const nearProductLimit = productsCount >= maxProducts * 0.8;
  const overProductLimit = productsCount >= maxProducts;

  const productsList = storeExists ? (store.products || []).map((p: any) =>
    `  - ${p.name} | $${p.price} | Stock: ${p.stock}`
  ).join("\n") : "";
  const customersList = storeExists ? (store.customers || []).map((c: any) =>
    `  - ${c.name} | ${c.email} | ${c.phone}`
  ).join("\n") : "";
  const ordersList = storeExists ? (store.orders || []).map((o: any) =>
    `  - ${o.product} | $${o.amount} | ${o.status}`
  ).join("\n") : "";
  const servicesList = storeExists ? (store.services || []).map((s: any) =>
    `  - ${s.name} | $${s.price} | ${s.desc}`
  ).join("\n") : "";

  const limitWarnings = [];
  if (overProductLimit) limitWarnings.push("⚠️ LÍMITE ALCANZADO: Has alcanzado el máximo de productos para tu plan.");
  else if (nearProductLimit) limitWarnings.push("⚠️ ADVERTENCIA: Estás usando más del 80% de tu límite de productos.");
  if (sub?.expiry && new Date(sub.expiry) < new Date()) limitWarnings.push("⚠️ TU SUSCRIPCIÓN ESTÁ VENCIDA. Renueva para seguir usando funciones premium.");

  const storeConfig = storeExists ? [
    `Nombre: ${store.name || "N/A"}`,
    `Tipo: ${store.type || "N/A"}`,
    `Industria: ${store.industry || "N/A"}`,
    `Descripción: ${store.desc || "Sin descripción"}`,
    `Slug: ${store.slug || "N/A"}`,
    `URL: ${store.slug ? "/s/" + store.slug : "N/A"}`,
    `Tienda pública: ${store.isPublic ? "Sí" : "No"}`,
    `IA pública: ${store.publicAI ? "Sí" : "No"}`,
    `Moneda: ${store.currency || "USD"}`,
    `Stripe: ${store.stripeAccountId ? "Conectado" : "No conectado"}`,
    ``,
    `SUSCRIPCIÓN: ${(sub?.plan || "free").toUpperCase()}`,
    `Límite de tiendas: ${sub?.maxStores || "—"}`,
    `Límite de productos por tienda: ${maxProducts}`,
    `Productos actuales: ${productsCount} / ${maxProducts}${overProductLimit ? " (COMPLETO)" : nearProductLimit ? " (cerca del límite)" : ""}`,
    ...(sub?.expiry ? [`Vencimiento: ${new Date(sub.expiry).toLocaleDateString()}`] : []),
    ...(limitWarnings.length ? [``, ...limitWarnings] : []),
    ``,
    `PRODUCTOS (${productsCount}):`,
    productsList || "  (ninguno)",
    ``,
    `CLIENTES (${customersCount}):`,
    customersList || "  (ninguno)",
    ``,
    `ÓRDENES (${ordersCount}):`,
    ordersList || "  (ninguna)",
    ``,
    `SERVICIOS (${servicesCount}):`,
    servicesList || "  (ninguno)",
  ].join("\n") : "No hay información de configuración disponible.";

  const now = new Date();
  const dateStr = now.toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

  const role = store?._generic
    ? "Eres el asistente oficial de Jandosoft, una plataforma para crear y gestionar tiendas en línea."
    : storeExists
    ? `Eres el asistente oficial de ${store.name}, un negocio en la plataforma Jandosoft.`
    : "Eres el asistente oficial de Jandosoft, una plataforma para crear y gestionar tiendas en línea.";

  const systemPrompt = `HOY ES: ${dateStr}. HORA ACTUAL: ${timeStr}.

${role}

CONFIGURACIÓN ACTUAL DE LA TIENDA:
${storeConfig}

Eres experto en Jandosoft y puedes dar sugerencias sobre cómo usar sus funciones: configuración de tienda, productos, pagos (Stripe, cripto), integraciones (Telegram, Discord, Slack, WhatsApp, Twilio, redes sociales), automatizaciones, base de conocimiento, campañas de marketing, analíticas, equipo, facturación, planes y builder visual.

El usuario está usando la interfaz de línea de comandos (CLI) de Jandosoft, no el panel web. Desde el CLI puede:
- Gestionar sus tiendas (crear, ver info, dashboard)
- Gestionar sus propios productos, clientes, órdenes y servicios
- Ver conversaciones
- Hablar contigo (el AI)

NO le digas que "acceda al panel de administración" o "inicie sesión en el sitio web" — todo lo que necesita lo puede hacer desde el CLI o pidiéndotelo directamente a ti. Tú puedes crear productos, eliminar productos y crear tiendas por él cuando te lo pida.

Además, existe una sección de productos de administración que se muestran en el home/slider de la plataforma (productos globales visibles para todos). Esos son diferentes de los productos de su tienda. Los productos de tienda son solo para su tienda específica.

Ayuda al usuario como un consultor empresarial usando la configuración actual de su tienda para dar consejos personalizados. Responde en español.

IMPORTANTE: Si ves alertas ⚠️ en la configuración, debes advertir al usuario visualmente con emojis y texto claro. Si el plan está vencido o los límites están cerca, recomienda upgradear el plan. Responde de forma clara y útil.`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];

  const data = await callLLM(messages);
  return data.choices?.[0]?.message?.content || "Error al obtener respuesta de la IA.";
}

export async function askBusinessAIWithTools({
  message,
  store,
  history,
  userId,
}: {
  message: string;
  store: any;
  history?: any[];
  userId: string;
}): Promise<{ response: string; actions: any[] }> {
  const storeExists = store && store.name;
  const sub = store?._subscription;

  const productsCount = store?.products?.length || 0;
  const customersCount = store?.customers?.length || 0;
  const ordersCount = store?.orders?.length || 0;
  const servicesCount = store?.services?.length || 0;
  const maxProducts = sub?.maxProducts || Infinity;
  const nearProductLimit = productsCount >= maxProducts * 0.8;
  const overProductLimit = productsCount >= maxProducts;

  const productsList = storeExists ? (store.products || []).map((p: any) =>
    `  - ${p.name} | $${p.price} | Stock: ${p.stock}`
  ).join("\n") : "";
  const customersList = storeExists ? (store.customers || []).map((c: any) =>
    `  - ${c.name} | ${c.email} | ${c.phone}`
  ).join("\n") : "";
  const ordersList = storeExists ? (store.orders || []).map((o: any) =>
    `  - ${o.product} | $${o.amount} | ${o.status}`
  ).join("\n") : "";
  const servicesList = storeExists ? (store.services || []).map((s: any) =>
    `  - ${s.name} | $${s.price} | ${s.desc}`
  ).join("\n") : "";

  const limitWarnings = [];
  if (overProductLimit) limitWarnings.push("⚠️ LÍMITE ALCANZADO: Has alcanzado el máximo de productos para tu plan.");
  else if (nearProductLimit) limitWarnings.push("⚠️ ADVERTENCIA: Estás usando más del 80% de tu límite de productos.");
  if (sub?.expiry && new Date(sub.expiry) < new Date()) limitWarnings.push("⚠️ TU SUSCRIPCIÓN ESTÁ VENCIDA. Renueva para seguir usando funciones premium.");

  const now = new Date();
  const dateStr = now.toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

  let appointmentsCount = 0;
  let appointmentsList = "";
  try {
    const storeId = store?._id || store?.id;
    if (storeId) {
      const { connectDB } = await import("@/lib/mongodb");
      const { Appointment: AppointmentModel } = await import("@/lib/models/Appointment");
      await connectDB();
      const appointments = await AppointmentModel.find({ storeId })
        .sort({ date: 1, time: 1 })
        .limit(50)
        .lean();
      appointmentsCount = appointments.length;
      appointmentsList = appointments.map((a: any) =>
        `  - ${a.customerInfo?.name || "Sin nombre"} | ${a.service?.name || "Sin servicio"} | ${a.date} ${a.time} | ${a.status}`
      ).join("\n");
    }
  } catch (e) {
    // appointments not available
  }

  const userStoresList = store?._stores?.length
    ? (store._stores || []).map((s: any) =>
        `  - ${s.name}${s.slug ? ` (${s.slug})` : ""} — ${s.productsCount} productos`
      ).join("\n")
    : null;

  const storeConfig = storeExists && !store._generic ? [
    `Nombre: ${store.name || "N/A"}`,
    `Tipo: ${store.type || "N/A"}`,
    `Industria: ${store.industry || "N/A"}`,
    `Descripción: ${store.desc || "Sin descripción"}`,
    `Slug: ${store.slug || "N/A"}`,
    `URL: ${store.slug ? "/s/" + store.slug : "N/A"}`,
    `Tienda pública: ${store.isPublic ? "Sí" : "No"}`,
    `IA pública: ${store.publicAI ? "Sí" : "No"}`,
    `Moneda: ${store.currency || "USD"}`,
    `Stripe: ${store.stripeAccountId ? "Conectado" : "No conectado"}`,
    ``,
    `SUSCRIPCIÓN: ${(sub?.plan || "free").toUpperCase()}`,
    `Límite de tiendas: ${sub?.maxStores || "—"}`,
    `Límite de productos por tienda: ${maxProducts}`,
    `Productos actuales: ${productsCount} / ${maxProducts}${overProductLimit ? " (COMPLETO)" : nearProductLimit ? " (cerca del límite)" : ""}`,
    ...(sub?.expiry ? [`Vencimiento: ${new Date(sub.expiry).toLocaleDateString()}`] : []),
    ...(limitWarnings.length ? [``, ...limitWarnings] : []),
    ``,
    `PRODUCTOS (${productsCount}):`,
    productsList || "  (ninguno)",
    ``,
    `CLIENTES (${customersCount}):`,
    customersList || "  (ninguno)",
    ``,
    `ÓRDENES (${ordersCount}):`,
    ordersList || "  (ninguna)",
    ``,
    `SERVICIOS (${servicesCount}):`,
    servicesList || "  (ninguno)",
    ``,
    `CITAS (${appointmentsCount}):`,
    appointmentsList || "  (ninguna)",
  ].join("\n") : (store?._generic ? [
    `SUSCRIPCIÓN: ${(sub?.plan || "free").toUpperCase()}`,
    `Límite de tiendas: ${sub?.maxStores || "—"}`,
    `Límite de productos por tienda: ${maxProducts}`,
    ...(sub?.expiry ? [`Vencimiento: ${new Date(sub.expiry).toLocaleDateString()}`] : []),
    ...(limitWarnings.length ? [``, ...limitWarnings] : []),
    ``,
    `MIS TIENDAS (${store?._stores?.length || 0}):`,
    userStoresList || "  (ninguna, puedes crear una con create_store)",
  ].join("\n") : "No hay información de configuración disponible.");

  const role = store?._generic
    ? "Eres el asistente oficial de Jandosoft, una plataforma para crear y gestionar tiendas en línea."
    : storeExists
    ? `Eres el asistente oficial de ${store.name}, un negocio en la plataforma Jandosoft.`
    : "Eres el asistente oficial de Jandosoft, una plataforma para crear y gestionar tiendas en línea.";

  const systemPrompt = `HOY ES: ${dateStr}. HORA ACTUAL: ${timeStr}.

${role}

CONFIGURACIÓN ACTUAL DE LA TIENDA:
${storeConfig}

Tienes acceso a herramientas para ejecutar acciones directamente: crear productos, eliminar productos, crear tiendas, eliminar tiendas, modificar tiendas, gestionar citas (crear, modificar, cancelar, listar), y ENVIAR CORREOS ELECTRÓNICOS con contenido personalizado o usando plantillas predefinidas (welcome, verification, password-reset, invoice, appointment-reminder, payment-confirmation, order-confirmation, new-client, payment-received, campaign).

IMPORTANTE — CREAR CITAS: Solo necesitas el nombre del cliente, fecha y hora. Todo lo demás (servicio, email, teléfono, duración, notas) tiene valores por defecto. Si el usuario dice "mañana", "próximo lunes", "en 2 horas", etc., interpreta la fecha/hora implícita y CREA la cita sin pedir más datos. No preguntes de más — usa sentido común.

IMPORTANTE — ENVIAR CORREOS: Si el usuario te pide contenido personalizado, usa el campo content con HTML propio. NO uses template si ya escribiste content personalizado. El campo template solo es para cuando NO hay contenido personalizado.

El usuario está usando la interfaz de línea de comandos (CLI) de Jandosoft. Cuando te pida hacer algo, USA LA HERRAMIENTA correspondiente para hacerlo realidad. NO te limites a sugerir — EJECUTA la acción directamente.

IMPORTANTE: Después de ejecutar una herramienta, informa al usuario del resultado concreto: qué se creó, eliminó o modificó. Si algo falla, dile exactamente qué pasó.

Responde en español.`;

  const messages: any[] = [
    { role: "system", content: systemPrompt },
    ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];

  const actions: any[] = [];
  let finalResponse = "";

  for (let turn = 0; turn < 5; turn++) {
    const data = await callLLM(messages, TOOLS);
    const choice = data.choices?.[0];
    if (!choice) return { response: "Error al obtener respuesta de la IA.", actions };

    const msg = choice.message;

    if (msg.tool_calls && msg.tool_calls.length > 0) {
      messages.push(msg);
      for (const tc of msg.tool_calls) {
        const result = await executeTool(tc, store, userId);
        actions.push({ tool: tc.function.name, args: JSON.parse(tc.function.arguments), result });
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }
    } else {
      finalResponse = msg.content || "";
      break;
    }
  }

  return { response: finalResponse || "Acción completada.", actions };
}
