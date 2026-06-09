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

  const role = store?._generic
    ? "Eres el asistente oficial de Jandosoft, una plataforma para crear y gestionar tiendas en línea."
    : storeExists
    ? `Eres el asistente oficial de ${store.name}, un negocio en la plataforma Jandosoft.`
    : "Eres el asistente oficial de Jandosoft, una plataforma para crear y gestionar tiendas en línea.";

  const systemPrompt = `${role}

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

  const systemPrompt = `${role}

CONFIGURACIÓN ACTUAL DE LA TIENDA:
${storeConfig}

Tienes acceso a herramientas para ejecutar acciones directamente: crear productos, eliminar productos, crear tiendas, eliminar tiendas y modificar tiendas.

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
