/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ActionPlugin } from "../core/plugin-interfaces";
import type { ExecutionContext, WorkflowAction } from "../core/types";

export const ALL_ACTIONS: ActionPlugin[] = [
  {
    id: "create_customer",
    name: "Crear Cliente",
    description: "Crea un nuevo cliente en la tienda",
    icon: "UserPlus",
    requiredFields: ["name"],
    configSchema: {
      name: { type: "string", description: "Nombre del cliente" },
      email: { type: "string", description: "Email" },
      phone: { type: "string", description: "Teléfono" },
    },
    async execute(action, context) {
      const { name, email, phone, ...extra } = action.config;
      const customer = {
        id: Date.now(),
        name: name || "Cliente",
        email: email || "",
        phone: phone || "",
        ...extra,
      };
      if (!context.store.customers) context.store.customers = [];
      context.store.customers.push(customer);
      await context.store.save();
      return { success: true, result: customer };
    },
  },
  {
    id: "create_order",
    name: "Crear Pedido",
    description: "Crea un nuevo pedido",
    icon: "ShoppingCart",
    requiredFields: ["product"],
    configSchema: {
      product: { type: "string" },
      amount: { type: "number" },
      status: { type: "string" },
    },
    async execute(action, context) {
      const order = {
        id: Date.now(),
        product: action.config.product || "Producto",
        amount: action.config.amount || 0,
        status: action.config.status || "pending",
        createdAt: new Date().toISOString(),
      };
      if (!context.store.orders) context.store.orders = [];
      context.store.orders.push(order);
      await context.store.save();
      return { success: true, result: order };
    },
  },
  {
    id: "create_appointment",
    name: "Crear Cita",
    description: "Agenda una nueva cita",
    icon: "CalendarPlus",
    requiredFields: ["customerName", "date"],
    configSchema: {
      customerName: { type: "string" },
      date: { type: "string" },
      time: { type: "string" },
      serviceName: { type: "string" },
    },
    async execute(action, context) {
      const appointment = {
        id: Date.now(),
        customerName: action.config.customerName || "Cliente",
        customerEmail: action.config.customerEmail || "",
        date: action.config.date || new Date().toISOString().split("T")[0],
        time: action.config.time || "10:00",
        serviceName: action.config.serviceName || "Servicio",
        status: "scheduled",
        createdAt: new Date().toISOString(),
      };
      if (!context.store.appointments) context.store.appointments = [];
      context.store.appointments.push(appointment);
      await context.store.save();
      return { success: true, result: appointment };
    },
  },
  {
    id: "create_invoice",
    name: "Crear Factura",
    description: "Genera una nueva factura",
    icon: "FileText",
    requiredFields: ["customerEmail", "amount"],
    configSchema: {
      customerEmail: { type: "string" },
      customerName: { type: "string" },
      amount: { type: "number" },
      description: { type: "string" },
    },
    async execute(action, context) {
      const invoice = {
        id: `INV-${Date.now()}`,
        customerEmail: action.config.customerEmail || "",
        customerName: action.config.customerName || "",
        amount: action.config.amount || 0,
        description: action.config.description || "Factura automatizada",
        status: "pending",
        createdAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      };
      if (!context.store.invoices) context.store.invoices = [];
      context.store.invoices.push(invoice);
      await context.store.save();
      return { success: true, result: invoice };
    },
  },
  {
    id: "send_email",
    name: "Enviar Email",
    description: "Envía un correo electrónico",
    icon: "Mail",
    requiredFields: ["to", "subject"],
    configSchema: {
      to: { type: "string" },
      subject: { type: "string" },
      body: { type: "string" },
    },
    async execute(action, context) {
      const { to, subject, body } = action.config;
      if (!to || !subject) {
        return { success: false, error: "Email 'to' and 'subject' are required" };
      }
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/email/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to,
            subject: interpolate(subject, context),
            content: interpolate(body || "", context),
          }),
        });
        const data = await res.json();
        return { success: res.ok, result: data };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  },
  {
    id: "send_whatsapp",
    name: "Enviar WhatsApp",
    description: "Envía un mensaje de WhatsApp",
    icon: "MessageCircle",
    requiredFields: ["to", "message"],
    configSchema: {
      to: { type: "string" },
      message: { type: "string" },
    },
    async execute(action, context) {
      const { to, message } = action.config;
      if (!to || !message) {
        return { success: false, error: "WhatsApp 'to' and 'message' are required" };
      }
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/messaging/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform: "whatsapp",
            to,
            message: interpolate(message, context),
          }),
        });
        const data = await res.json();
        return { success: res.ok, result: data };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  },
  {
    id: "send_sms",
    name: "Enviar SMS",
    description: "Envía un mensaje SMS",
    icon: "MessageSquare",
    requiredFields: ["to", "message"],
    configSchema: {
      to: { type: "string" },
      message: { type: "string" },
    },
    async execute(action, context) {
      const { to, message } = action.config;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/messaging/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform: "sms", to, message: interpolate(message, context) }),
        });
        const data = await res.json();
        return { success: res.ok, result: data };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  },
  {
    id: "send_push",
    name: "Enviar Push",
    description: "Envía una notificación push",
    icon: "Bell",
    requiredFields: ["title", "message"],
    configSchema: {
      title: { type: "string" },
      message: { type: "string" },
      userId: { type: "string" },
    },
    async execute(action, context) {
      const { title, message, userId } = action.config;
      try {
        await fetch(`${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/notifications`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "workflow",
            title: interpolate(title || "", context),
            message: interpolate(message || "", context),
            userId: userId || context.event.payload.customerEmail || context.store.ownerEmail,
            storeId: context.store._id.toString(),
          }),
        });
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  },
  {
    id: "create_task",
    name: "Crear Tarea",
    description: "Crea una tarea interna",
    icon: "ClipboardList",
    requiredFields: ["title"],
    configSchema: {
      title: { type: "string" },
      description: { type: "string" },
      assignee: { type: "string" },
      dueDate: { type: "string" },
    },
    async execute(action, context) {
      const task = {
        id: `TASK-${Date.now()}`,
        title: interpolate(action.config.title || "", context),
        description: interpolate(action.config.description || "", context),
        assignee: action.config.assignee || "",
        dueDate: action.config.dueDate || "",
        status: "pending",
        storeId: context.store._id.toString(),
        createdAt: new Date().toISOString(),
      };
      if (!context.store.tasks) context.store.tasks = [];
      context.store.tasks.push(task);
      await context.store.save();
      return { success: true, result: task };
    },
  },
  {
    id: "wait",
    name: "Esperar",
    description: "Espera X tiempo antes de continuar con la siguiente acción (segundos)",
    icon: "Clock",
    requiredFields: ["seconds"],
    configSchema: {
      seconds: { type: "number", description: "Segundos a esperar", default: 60 },
    },
    async execute(action) {
      const seconds = action.config.seconds || 60;
      await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
      return { success: true, result: { waited: seconds } };
    },
  },
  {
    id: "execute_ai",
    name: "Ejecutar IA",
    description: "Ejecuta un prompt de IA y guarda el resultado en una variable",
    icon: "Brain",
    requiredFields: ["prompt"],
    configSchema: {
      prompt: { type: "string" },
      model: { type: "string" },
      saveToVar: { type: "string", description: "Nombre de variable donde guardar el resultado" },
    },
    async execute(action, context) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/ai/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: interpolate(action.config.prompt || "", context) }],
            model: action.config.model || "gpt-4o-mini",
            storeContext: JSON.stringify(context.event.payload),
          }),
        });
        const data = await res.json();
        const response = data.response || data.choices?.[0]?.message?.content || "";
        if (action.config.saveToVar) {
          context.vars[action.config.saveToVar] = response;
        }
        return { success: true, result: response };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  },
  {
    id: "execute_webhook",
    name: "Ejecutar Webhook",
    description: "Envía un webhook a una URL externa",
    icon: "Webhook",
    requiredFields: ["url"],
    configSchema: {
      url: { type: "string" },
      method: { type: "string", enum: ["GET", "POST", "PUT"], default: "POST" },
      headers: { type: "object" },
    },
    async execute(action, context) {
      try {
        const res = await fetch(action.config.url, {
          method: action.config.method || "POST",
          headers: { "Content-Type": "application/json", ...(action.config.headers || {}) },
          body: JSON.stringify({
            event: context.event,
            workflow: { id: context.workflow.id, name: context.workflow.name },
            payload: context.event.payload,
          }),
        });
        return { success: res.ok, result: { status: res.status } };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  },
  {
    id: "http_request",
    name: "HTTP Request",
    description: "Realiza una petición HTTP personalizada",
    icon: "Globe",
    requiredFields: ["url"],
    configSchema: {
      url: { type: "string" },
      method: { type: "string", enum: ["GET", "POST", "PUT", "PATCH", "DELETE"], default: "GET" },
      headers: { type: "object" },
      body: { type: "object" },
    },
    async execute(action, context) {
      try {
        const options: any = {
          method: action.config.method || "GET",
          headers: { ...(action.config.headers || {}) },
        };
        if (action.config.body && !["GET", "HEAD"].includes(options.method)) {
          options.body = JSON.stringify(action.config.body);
          if (!options.headers["Content-Type"]) {
            options.headers["Content-Type"] = "application/json";
          }
        }
        const res = await fetch(action.config.url, options);
        let body: any;
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          body = await res.json();
        } else {
          body = await res.text();
        }
        return { success: res.ok, result: { status: res.status, body } };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  },
  {
    id: "update_record",
    name: "Actualizar Registro",
    description: "Actualiza un registro existente en la tienda",
    icon: "Pencil",
    requiredFields: ["collection", "id"],
    configSchema: {
      collection: {
        type: "string",
        enum: ["products", "customers", "orders", "services"],
        description: "Colección (products, customers, orders, services)",
      },
      id: { type: "number", description: "ID del registro" },
      data: { type: "object", description: "Datos a actualizar" },
    },
    async execute(action, context) {
      const { collection, id, data } = action.config;
      if (!context.store[collection]) {
        return { success: false, error: `Collection '${collection}' not found` };
      }
      const idx = context.store[collection].findIndex((item: any) => item.id === id || item._id === id);
      if (idx === -1) {
        return { success: false, error: `Record with id ${id} not found in ${collection}` };
      }
      context.store[collection][idx] = { ...context.store[collection][idx], ...data };
      await context.store.save();
      return { success: true, result: context.store[collection][idx] };
    },
  },
  {
    id: "delete_record",
    name: "Eliminar Registro",
    description: "Elimina un registro de la tienda",
    icon: "Trash2",
    requiredFields: ["collection", "id"],
    configSchema: {
      collection: { type: "string", enum: ["products", "customers", "orders", "services"] },
      id: { type: "number" },
    },
    async execute(action, context) {
      const { collection, id } = action.config;
      if (!context.store[collection]) {
        return { success: false, error: `Collection '${collection}' not found` };
      }
      const idx = context.store[collection].findIndex((item: any) => item.id === id || item._id === id);
      if (idx === -1) {
        return { success: false, error: `Record with id ${id} not found in ${collection}` };
      }
      const removed = context.store[collection].splice(idx, 1)[0];
      await context.store.save();
      return { success: true, result: removed };
    },
  },
];

function interpolate(template: string, context: ExecutionContext): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmed = key.trim();
    if (trimmed.startsWith("payload.")) {
      const path = trimmed.slice(8).split(".");
      let val: any = context.event.payload;
      for (const p of path) {
        val = val?.[p];
      }
      return val !== undefined ? String(val) : match;
    }
    if (trimmed.startsWith("var.")) {
      const path = trimmed.slice(4).split(".");
      let val: any = context.vars;
      for (const p of path) {
        val = val?.[p];
      }
      return val !== undefined ? String(val) : match;
    }
    if (trimmed === "store.name") return context.store.name || match;
    if (trimmed === "store.email") return context.store.ownerEmail || match;
    return match;
  });
}
