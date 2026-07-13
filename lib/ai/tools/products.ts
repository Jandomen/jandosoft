import type { ToolDefinition, ToolResult } from "./base";

export const TOOLS: ToolDefinition[] = [
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
      description: "Delete a product by name",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Product name to delete" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_service",
      description: "Add a new service to the store",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Service name" },
          price: { type: "number", description: "Service price" },
          desc: { type: "string", description: "Description" },
          duration: { type: "number", description: "Duration in minutes (default 60)" },
        },
        required: ["name", "price"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_service",
      description: "Update a service's name, price, description, or duration",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Current service name" },
          newName: { type: "string", description: "New name" },
          price: { type: "number", description: "New price" },
          desc: { type: "string", description: "New description" },
          duration: { type: "number", description: "New duration in minutes" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_service",
      description: "Delete a service by name",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Service name to delete" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_services",
      description: "List all services for the current store",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max results (default 50)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_order",
      description: "Create a new order for the store",
      parameters: {
        type: "object",
        properties: {
          product: { type: "string", description: "Product name" },
          amount: { type: "number", description: "Order amount" },
          status: { type: "string", description: "Order status (default Pendiente)" },
        },
        required: ["product", "amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_order_status",
      description: "Update the status of an order",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "number", description: "Order ID" },
          status: { type: "string", description: "New status" },
        },
        required: ["orderId", "status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_orders",
      description: "List all orders for the store",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by status" },
          product: { type: "string", description: "Filter by product name" },
          limit: { type: "number", description: "Max results (default 50)" },
        },
      },
    },
  },
];

export async function executeProductTool(name: string, args: any, store: any, _userId: string): Promise<ToolResult> {
  const storeId = store?._id || store?.id;
  if (!storeId) return { error: "No store selected" };

  const { connectDB } = await import("@/lib/mongodb");
  const { Store } = await import("@/lib/models/Store");
  await connectDB();
  const s = await Store.findById(storeId);
  if (!s) return { error: "Store not found" };

  if (name === "create_product") {
    const maxId = Math.max(0, ...s.products.map((p: any) => p.id || 0));
    s.products.push({ id: maxId + 1, name: args.name, price: args.price, stock: args.stock ?? 0 });
    await s.save();
    return { success: true, message: `Producto "${args.name}" creado con éxito` };
  }

  if (name === "delete_product") {
    const idx = s.products.findIndex((p: any) => p.name === args.name);
    if (idx === -1) return { error: `Producto "${args.name}" no encontrado` };
    s.products.splice(idx, 1);
    await s.save();
    return { success: true, message: `Producto "${args.name}" eliminado con éxito` };
  }

  if (name === "create_service") {
    const maxId = Math.max(0, ...s.services.map((sv: any) => sv.id || 0));
    s.services.push({ id: maxId + 1, name: args.name, desc: args.desc || "", price: args.price, duration: args.duration || 60 });
    await s.save();
    return { success: true, message: `Servicio "${args.name}" creado con éxito` };
  }

  if (name === "update_service") {
    const service = s.services.find((sv: any) => sv.name === args.name);
    if (!service) return { error: `Servicio "${args.name}" no encontrado` };
    if (args.newName) service.name = args.newName;
    if (args.price) service.price = args.price;
    if (args.desc !== undefined) service.desc = args.desc;
    if (args.duration) service.duration = args.duration;
    await s.save();
    return { success: true, message: `Servicio "${args.name}" actualizado con éxito` };
  }

  if (name === "delete_service") {
    const idx = s.services.findIndex((sv: any) => sv.name === args.name);
    if (idx === -1) return { error: `Servicio "${args.name}" no encontrado` };
    s.services.splice(idx, 1);
    await s.save();
    return { success: true, message: `Servicio "${args.name}" eliminado con éxito` };
  }

  if (name === "list_services") {
    const services = (s.services || []).slice(0, args.limit || 50);
    return {
      success: true,
      services: services.map((sv: any) => ({ id: sv.id, name: sv.name, desc: sv.desc, price: sv.price, duration: sv.duration })),
      count: services.length,
    };
  }

  if (name === "create_order") {
    const maxId = Math.max(0, ...s.orders.map((o: any) => o.id || 0));
    s.orders.push({ id: maxId + 1, product: args.product, amount: args.amount, status: args.status || "Pendiente" });
    await s.save();
    return { success: true, message: `Orden creada: ${args.product} por $${args.amount}` };
  }

  if (name === "update_order_status") {
    const order = s.orders.find((o: any) => o.id === args.orderId);
    if (!order) return { error: `Orden con ID ${args.orderId} no encontrada` };
    order.status = args.status;
    await s.save();
    return { success: true, message: `Orden #${args.orderId} actualizada a "${args.status}"` };
  }

  if (name === "list_orders") {
    let orders = s.orders || [];
    if (args.status) orders = orders.filter((o: any) => o.status === args.status);
    if (args.product) orders = orders.filter((o: any) => o.product === args.product);
    orders = orders.slice(0, args.limit || 50);
    return {
      success: true,
      orders: orders.map((o: any) => ({ id: o.id, product: o.product, amount: o.amount, status: o.status })),
      count: orders.length,
    };
  }

  return { error: `Unknown product tool: ${name}` };
}
