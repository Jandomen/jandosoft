import type { ToolDefinition, ToolResult } from "./base";

export const TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "add_inventory_item",
      description: "Add a new item to inventory",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Item name" },
          quantity: { type: "number", description: "Initial quantity" },
          price: { type: "number", description: "Unit price" },
          category: { type: "string", description: "Category (e.g. materia prima, empaque, equipo)" },
          supplier: { type: "string", description: "Supplier name" },
          sku: { type: "string", description: "SKU code" },
          minStock: { type: "number", description: "Minimum stock alert level" },
        },
        required: ["name", "quantity"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_inventory_item",
      description: "Update an inventory item's quantity, price, or details",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Item name to update" },
          quantity: { type: "number", description: "New quantity" },
          price: { type: "number", description: "New unit price" },
          supplier: { type: "string", description: "New supplier" },
          minStock: { type: "number", description: "New minimum stock level" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_inventory_item",
      description: "Delete an inventory item by name",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Item name to delete" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_inventory",
      description: "List all inventory items, optionally filtered by category or low stock",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "Filter by category" },
          lowStock: { type: "boolean", description: "Show only items below minStock" },
          limit: { type: "number", description: "Max results (default 50)" },
        },
      },
    },
  },
];

export async function executeInventoryTool(name: string, args: any, store: any, _userId: string): Promise<ToolResult> {
  const storeId = store?._id || store?.id;
  if (!storeId) return { error: "No store selected" };

  const { connectDB } = await import("@/lib/mongodb");
  const { Store } = await import("@/lib/models/Store");
  await connectDB();
  const s = await Store.findById(storeId);
  if (!s) return { error: "Store not found" };

  if (name === "add_inventory_item") {
    const maxId = Math.max(0, ...s.inventoryItems.map((i: any) => i.id || 0));
    s.inventoryItems.push({
      id: maxId + 1,
      name: args.name,
      quantity: args.quantity,
      price: args.price || 0,
      category: args.category || "",
      supplier: args.supplier || "",
      sku: args.sku || "",
      minStock: args.minStock || 0,
    });
    await s.save();
    return { success: true, message: `"${args.name}" agregado al inventario con ${args.quantity} unidades` };
  }

  if (name === "update_inventory_item") {
    const item = s.inventoryItems.find((i: any) => i.name === args.name);
    if (!item) return { error: `"${args.name}" no encontrado en inventario` };
    if (args.quantity !== undefined) item.quantity = args.quantity;
    if (args.price !== undefined) item.price = args.price;
    if (args.supplier !== undefined) item.supplier = args.supplier;
    if (args.minStock !== undefined) item.minStock = args.minStock;
    await s.save();
    return { success: true, message: `"${args.name}" actualizado en inventario` };
  }

  if (name === "delete_inventory_item") {
    const idx = s.inventoryItems.findIndex((i: any) => i.name === args.name);
    if (idx === -1) return { error: `"${args.name}" no encontrado en inventario` };
    s.inventoryItems.splice(idx, 1);
    await s.save();
    return { success: true, message: `"${args.name}" eliminado del inventario` };
  }

  if (name === "list_inventory") {
    let items = s.inventoryItems || [];
    if (args.category) items = items.filter((i: any) => i.category === args.category);
    if (args.lowStock) items = items.filter((i: any) => i.minStock > 0 && i.quantity <= i.minStock);
    items = items.slice(0, args.limit || 50);
    return {
      success: true,
      inventory: items.map((i: any) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        category: i.category,
        supplier: i.supplier,
        sku: i.sku,
        minStock: i.minStock,
        lowStock: i.minStock > 0 && i.quantity <= i.minStock,
      })),
      count: items.length,
    };
  }

  return { error: `Unknown inventory tool: ${name}` };
}
