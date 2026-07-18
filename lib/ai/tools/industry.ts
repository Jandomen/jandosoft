/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ToolDefinition, ToolResult } from "./base";

export const TOOLS: ToolDefinition[] = [
  // ── Gallery ──
  {
    type: "function",
    function: {
      name: "create_gallery_item",
      description: "Add a new image to the gallery",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Image title" },
          imageUrl: { type: "string", description: "Image URL" },
          desc: { type: "string", description: "Description" },
          category: { type: "string", description: "Category" },
          featured: { type: "boolean", description: "Mark as featured" },
        },
        required: ["title", "imageUrl"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_gallery_item",
      description: "Update an existing gallery item",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number", description: "Gallery item ID" },
          title: { type: "string" },
          imageUrl: { type: "string" },
          desc: { type: "string" },
          category: { type: "string" },
          featured: { type: "boolean" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_gallery_item",
      description: "Delete a gallery item by ID",
      parameters: {
        type: "object",
        properties: { id: { type: "number" } },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_gallery_items",
      description: "List all gallery items",
      parameters: { type: "object", properties: {} },
    },
  },
  // ── Testimonials ──
  {
    type: "function",
    function: {
      name: "create_testimonial",
      description: "Add a new testimonial",
      parameters: {
        type: "object",
        properties: {
          clientName: { type: "string" },
          text: { type: "string" },
          rating: { type: "number", description: "1-5" },
          company: { type: "string" },
          position: { type: "string" },
          approved: { type: "boolean" },
          featured: { type: "boolean" },
        },
        required: ["clientName", "text"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_testimonial",
      description: "Update an existing testimonial",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number" },
          clientName: { type: "string" },
          text: { type: "string" },
          rating: { type: "number" },
          company: { type: "string" },
          position: { type: "string" },
          approved: { type: "boolean" },
          featured: { type: "boolean" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_testimonial",
      description: "Delete a testimonial by ID",
      parameters: {
        type: "object",
        properties: { id: { type: "number" } },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_testimonials",
      description: "List all testimonials",
      parameters: { type: "object", properties: {} },
    },
  },
  // ── Menu Items ──
  {
    type: "function",
    function: {
      name: "create_menu_item",
      description: "Add a new item to the menu",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          desc: { type: "string" },
          price: { type: "number" },
          category: { type: "string", description: "ej: entradas, platos_fuertes, postres, bebidas" },
          imageUrl: { type: "string" },
          ingredients: { type: "string" },
          calories: { type: "number" },
          dietaryInfo: { type: "string" },
          featured: { type: "boolean" },
          preparationTime: { type: "number", description: "Minutes" },
        },
        required: ["name", "price"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_menu_item",
      description: "Update an existing menu item",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number" },
          name: { type: "string" },
          desc: { type: "string" },
          price: { type: "number" },
          category: { type: "string" },
          imageUrl: { type: "string" },
          ingredients: { type: "string" },
          calories: { type: "number" },
          dietaryInfo: { type: "string" },
          featured: { type: "boolean" },
          preparationTime: { type: "number" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_menu_item",
      description: "Delete a menu item by ID",
      parameters: {
        type: "object",
        properties: { id: { type: "number" } },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_menu_items",
      description: "List all menu items",
      parameters: { type: "object", properties: {} },
    },
  },
  // ── Recipes ──
  {
    type: "function",
    function: {
      name: "create_recipe",
      description: "Add a new recipe",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          ingredients: { type: "string" },
          instructions: { type: "string" },
          prepTime: { type: "number", description: "Minutes" },
          cookTime: { type: "number", description: "Minutes" },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
          servings: { type: "number" },
          calories: { type: "number" },
          imageUrl: { type: "string" },
          tags: { type: "string" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_recipe",
      description: "Update an existing recipe",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number" },
          name: { type: "string" },
          ingredients: { type: "string" },
          instructions: { type: "string" },
          prepTime: { type: "number" },
          cookTime: { type: "number" },
          difficulty: { type: "string" },
          servings: { type: "number" },
          calories: { type: "number" },
          imageUrl: { type: "string" },
          tags: { type: "string" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_recipe",
      description: "Delete a recipe by ID",
      parameters: {
        type: "object",
        properties: { id: { type: "number" } },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_recipes",
      description: "List all recipes",
      parameters: { type: "object", properties: {} },
    },
  },
  // ── Barbers ──
  {
    type: "function",
    function: {
      name: "create_barber",
      description: "Add a new barber/stylist",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          phone: { type: "string" },
          email: { type: "string" },
          specialties: { type: "string", description: "Comma separated" },
          bio: { type: "string" },
          active: { type: "boolean" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_barber",
      description: "Update an existing barber",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number" },
          name: { type: "string" },
          phone: { type: "string" },
          email: { type: "string" },
          specialties: { type: "string" },
          bio: { type: "string" },
          active: { type: "boolean" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_barber",
      description: "Delete a barber by ID",
      parameters: {
        type: "object",
        properties: { id: { type: "number" } },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_barbers",
      description: "List all barbers",
      parameters: { type: "object", properties: {} },
    },
  },
  // ── Barber Queue ──
  {
    type: "function",
    function: {
      name: "add_queue_entry",
      description: "Add a customer to the barber queue",
      parameters: {
        type: "object",
        properties: {
          customerName: { type: "string" },
          customerPhone: { type: "string" },
          serviceRequested: { type: "string" },
          barberId: { type: "number" },
          notes: { type: "string" },
        },
        required: ["customerName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_queue_entry",
      description: "Update a queue entry (e.g., change status, assign barber)",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          customerName: { type: "string" },
          barberId: { type: "number" },
          status: { type: "string", enum: ["waiting", "in_progress", "completed", "cancelled"] },
          notes: { type: "string" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_queue_entry",
      description: "Remove a customer from the queue",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_queue",
      description: "List the barber queue",
      parameters: { type: "object", properties: {} },
    },
  },
  // ── Promotions ──
  {
    type: "function",
    function: {
      name: "create_promotion",
      description: "Create a new promotion/discount",
      parameters: {
        type: "object",
        properties: {
          code: { type: "string", description: "Promo code" },
          description: { type: "string" },
          type: { type: "string", enum: ["percentage", "fixed", "bogo", "free_item"] },
          value: { type: "number" },
          minOrder: { type: "number" },
          maxUses: { type: "number" },
          validFrom: { type: "string", description: "Start date ISO" },
          validUntil: { type: "string", description: "End date ISO" },
          active: { type: "boolean" },
        },
        required: ["code", "type", "value", "validFrom", "validUntil"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_promotion",
      description: "Update an existing promotion",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number" },
          code: { type: "string" },
          description: { type: "string" },
          type: { type: "string" },
          value: { type: "number" },
          minOrder: { type: "number" },
          maxUses: { type: "number" },
          validFrom: { type: "string" },
          validUntil: { type: "string" },
          active: { type: "boolean" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_promotion",
      description: "Delete a promotion by ID",
      parameters: {
        type: "object",
        properties: { id: { type: "number" } },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_promotions",
      description: "List all promotions",
      parameters: { type: "object", properties: {} },
    },
  },
  // ── Reservations ──
  {
    type: "function",
    function: {
      name: "create_reservation",
      description: "Create a new reservation",
      parameters: {
        type: "object",
        properties: {
          customerName: { type: "string" },
          customerPhone: { type: "string" },
          customerEmail: { type: "string" },
          date: { type: "string", description: "Date ISO" },
          time: { type: "string", description: "Time HH:MM" },
          partySize: { type: "number" },
          tableNumber: { type: "number" },
          notes: { type: "string" },
        },
        required: ["customerName", "customerPhone", "date", "time", "partySize"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_reservation",
      description: "Update a reservation (e.g., change status, table)",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number" },
          customerName: { type: "string" },
          customerPhone: { type: "string" },
          date: { type: "string" },
          time: { type: "string" },
          partySize: { type: "number" },
          tableNumber: { type: "number" },
          status: { type: "string", enum: ["pending", "confirmed", "seated", "completed", "cancelled", "no_show"] },
          notes: { type: "string" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_reservation",
      description: "Delete/cancel a reservation",
      parameters: {
        type: "object",
        properties: { id: { type: "number" } },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_reservations",
      description: "List all reservations",
      parameters: { type: "object", properties: {} },
    },
  },
  // ── Loyalty / Points ──
  {
    type: "function",
    function: {
      name: "list_loyalty_members",
      description: "List loyalty program members with points balance",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "add_loyalty_points",
      description: "Add points to a loyalty member",
      parameters: {
        type: "object",
        properties: {
          customerId: { type: "string" },
          customerName: { type: "string" },
          points: { type: "number" },
          description: { type: "string" },
        },
        required: ["customerId", "points"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "redeem_loyalty_points",
      description: "Redeem points for a loyalty member",
      parameters: {
        type: "object",
        properties: {
          customerId: { type: "string" },
          points: { type: "number" },
          description: { type: "string" },
        },
        required: ["customerId", "points"],
      },
    },
  },
  // ── Reviews ──
  {
    type: "function",
    function: {
      name: "list_reviews",
      description: "List all customer reviews",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "reply_to_review",
      description: "Reply to a customer review",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number", description: "Review ID" },
          reply: { type: "string" },
        },
        required: ["id", "reply"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_review",
      description: "Delete a review",
      parameters: {
        type: "object",
        properties: { id: { type: "number" } },
        required: ["id"],
      },
    },
  },
];

export async function executeIndustryTool(name: string, args: any, store: any, userId: string): Promise<ToolResult> {
  const storeId = store?._id || store?.id;
  if (!storeId) return { error: "No store selected" };

  const { connectDB } = await import("@/lib/mongodb");
  const { Store } = await import("@/lib/models/Store");
  await connectDB();
  const s = await Store.findById(storeId);
  if (!s) return { error: "Store not found" };

  // ── Gallery ──
  const gallery = s.galleryItems || [];
  if (name === "create_gallery_item") {
    const maxId = gallery.length > 0 ? Math.max(...gallery.map((i: any) => i.id || 0)) : 0;
    s.galleryItems = [...gallery, { id: maxId + 1, title: args.title, imageUrl: args.imageUrl || "", desc: args.desc || "", altText: args.title || "", category: args.category || "", featured: args.featured || false, date: new Date().toISOString().split("T")[0] }];
    await s.save();
    return { success: true, message: `Imagen "${args.title}" agregada a la galería` };
  }
  if (name === "update_gallery_item") {
    const idx = gallery.findIndex((i: any) => i.id === args.id);
    if (idx === -1) return { error: `Imagen con ID ${args.id} no encontrada` };
    if (args.title !== undefined) gallery[idx].title = args.title;
    if (args.imageUrl !== undefined) gallery[idx].imageUrl = args.imageUrl;
    if (args.desc !== undefined) gallery[idx].desc = args.desc;
    if (args.category !== undefined) gallery[idx].category = args.category;
    if (args.featured !== undefined) gallery[idx].featured = args.featured;
    s.galleryItems = gallery;
    await s.save();
    return { success: true, message: `Imagen "${gallery[idx].title}" actualizada` };
  }
  if (name === "delete_gallery_item") {
    const item = gallery.find((i: any) => i.id === args.id);
    if (!item) return { error: `Imagen con ID ${args.id} no encontrada` };
    s.galleryItems = gallery.filter((i: any) => i.id !== args.id);
    await s.save();
    return { success: true, message: `Imagen "${item.title}" eliminada` };
  }
  if (name === "list_gallery_items") {
    const filtered = args.category ? gallery.filter((i: any) => i.category === args.category) : gallery;
    return { success: true, galleryItems: filtered, count: filtered.length };
  }

  // ── Testimonials ──
  const testimonials = s.testimonials || [];
  if (name === "create_testimonial") {
    const maxId = testimonials.length > 0 ? Math.max(...testimonials.map((t: any) => t.id || 0)) : 0;
    s.testimonials = [...testimonials, { id: maxId + 1, clientName: args.clientName, text: args.text, rating: args.rating || 5, date: new Date().toISOString().split("T")[0], company: args.company || "", position: args.position || "", avatar: "", approved: args.approved !== false, featured: args.featured || false }];
    await s.save();
    return { success: true, message: `Testimonio de "${args.clientName}" agregado` };
  }
  if (name === "update_testimonial") {
    const idx = testimonials.findIndex((t: any) => t.id === args.id);
    if (idx === -1) return { error: `Testimonio con ID ${args.id} no encontrado` };
    if (args.clientName !== undefined) testimonials[idx].clientName = args.clientName;
    if (args.text !== undefined) testimonials[idx].text = args.text;
    if (args.rating !== undefined) testimonials[idx].rating = args.rating;
    if (args.company !== undefined) testimonials[idx].company = args.company;
    if (args.position !== undefined) testimonials[idx].position = args.position;
    if (args.approved !== undefined) testimonials[idx].approved = args.approved;
    if (args.featured !== undefined) testimonials[idx].featured = args.featured;
    s.testimonials = testimonials;
    await s.save();
    return { success: true, message: `Testimonio de "${testimonials[idx].clientName}" actualizado` };
  }
  if (name === "delete_testimonial") {
    const t = testimonials.find((x: any) => x.id === args.id);
    if (!t) return { error: `Testimonio con ID ${args.id} no encontrado` };
    s.testimonials = testimonials.filter((x: any) => x.id !== args.id);
    await s.save();
    return { success: true, message: `Testimonio de "${t.clientName}" eliminado` };
  }
  if (name === "list_testimonials") {
    return { success: true, testimonials, count: testimonials.length };
  }

  // ── Menu Items ──
  const menuItems = s.menuItems || [];
  if (name === "create_menu_item") {
    const maxId = menuItems.length > 0 ? Math.max(...menuItems.map((m: any) => m.id || 0)) : 0;
    s.menuItems = [...menuItems, { id: maxId + 1, name: args.name, desc: args.desc || "", price: args.price, category: args.category || "General", imageUrl: args.imageUrl || "", ingredients: args.ingredients || "", calories: args.calories || 0, dietaryInfo: args.dietaryInfo || "", featured: args.featured || false, preparationTime: args.preparationTime || 0 }];
    await s.save();
    return { success: true, message: `Item "${args.name}" agregado al menú` };
  }
  if (name === "update_menu_item") {
    const idx = menuItems.findIndex((m: any) => m.id === args.id);
    if (idx === -1) return { error: `Item con ID ${args.id} no encontrado` };
    if (args.name !== undefined) menuItems[idx].name = args.name;
    if (args.desc !== undefined) menuItems[idx].desc = args.desc;
    if (args.price !== undefined) menuItems[idx].price = args.price;
    if (args.category !== undefined) menuItems[idx].category = args.category;
    if (args.imageUrl !== undefined) menuItems[idx].imageUrl = args.imageUrl;
    if (args.ingredients !== undefined) menuItems[idx].ingredients = args.ingredients;
    if (args.calories !== undefined) menuItems[idx].calories = args.calories;
    if (args.dietaryInfo !== undefined) menuItems[idx].dietaryInfo = args.dietaryInfo;
    if (args.featured !== undefined) menuItems[idx].featured = args.featured;
    if (args.preparationTime !== undefined) menuItems[idx].preparationTime = args.preparationTime;
    s.menuItems = menuItems;
    await s.save();
    return { success: true, message: `Item "${menuItems[idx].name}" actualizado` };
  }
  if (name === "delete_menu_item") {
    const m = menuItems.find((x: any) => x.id === args.id);
    if (!m) return { error: `Item con ID ${args.id} no encontrado` };
    s.menuItems = menuItems.filter((x: any) => x.id !== args.id);
    await s.save();
    return { success: true, message: `Item "${m.name}" eliminado del menú` };
  }
  if (name === "list_menu_items") {
    return { success: true, menuItems, count: menuItems.length };
  }

  // ── Recipes ──
  const recipes = s.recipes || [];
  if (name === "create_recipe") {
    const maxId = recipes.length > 0 ? Math.max(...recipes.map((r: any) => r.id || 0)) : 0;
    s.recipes = [...recipes, { id: maxId + 1, name: args.name, ingredients: args.ingredients || "", instructions: args.instructions || "", prepTime: args.prepTime || 0, cookTime: args.cookTime || 0, difficulty: args.difficulty || "easy", servings: args.servings || 0, calories: args.calories || 0, imageUrl: args.imageUrl || "", tags: args.tags || "" }];
    await s.save();
    return { success: true, message: `Receta "${args.name}" agregada` };
  }
  if (name === "update_recipe") {
    const idx = recipes.findIndex((r: any) => r.id === args.id);
    if (idx === -1) return { error: `Receta con ID ${args.id} no encontrada` };
    if (args.name !== undefined) recipes[idx].name = args.name;
    if (args.ingredients !== undefined) recipes[idx].ingredients = args.ingredients;
    if (args.instructions !== undefined) recipes[idx].instructions = args.instructions;
    if (args.prepTime !== undefined) recipes[idx].prepTime = args.prepTime;
    if (args.cookTime !== undefined) recipes[idx].cookTime = args.cookTime;
    if (args.difficulty !== undefined) recipes[idx].difficulty = args.difficulty;
    if (args.servings !== undefined) recipes[idx].servings = args.servings;
    if (args.calories !== undefined) recipes[idx].calories = args.calories;
    if (args.imageUrl !== undefined) recipes[idx].imageUrl = args.imageUrl;
    if (args.tags !== undefined) recipes[idx].tags = args.tags;
    s.recipes = recipes;
    await s.save();
    return { success: true, message: `Receta "${recipes[idx].name}" actualizada` };
  }
  if (name === "delete_recipe") {
    const r = recipes.find((x: any) => x.id === args.id);
    if (!r) return { error: `Receta con ID ${args.id} no encontrada` };
    s.recipes = recipes.filter((x: any) => x.id !== args.id);
    await s.save();
    return { success: true, message: `Receta "${r.name}" eliminada` };
  }
  if (name === "list_recipes") {
    return { success: true, recipes, count: recipes.length };
  }

  // ── Barbers ──
  const barbers = s.barbers || [];
  if (name === "create_barber") {
    const maxId = barbers.length > 0 ? Math.max(...barbers.map((b: any) => b.id || 0)) : 0;
    s.barbers = [...barbers, { id: maxId + 1, name: args.name, phone: args.phone || "", email: args.email || "", photo: "", specialties: (args.specialties || "").split(",").map((s: string) => s.trim()), bio: args.bio || "", schedule: {}, active: args.active !== false, joinedAt: new Date().toISOString() }];
    await s.save();
    return { success: true, message: `Barbero "${args.name}" agregado` };
  }
  if (name === "update_barber") {
    const idx = barbers.findIndex((b: any) => b.id === args.id);
    if (idx === -1) return { error: `Barbero con ID ${args.id} no encontrado` };
    if (args.name !== undefined) barbers[idx].name = args.name;
    if (args.phone !== undefined) barbers[idx].phone = args.phone;
    if (args.email !== undefined) barbers[idx].email = args.email;
    if (args.specialties !== undefined) barbers[idx].specialties = args.specialties.split(",").map((s: string) => s.trim());
    if (args.bio !== undefined) barbers[idx].bio = args.bio;
    if (args.active !== undefined) barbers[idx].active = args.active;
    s.barbers = barbers;
    await s.save();
    return { success: true, message: `Barbero "${barbers[idx].name}" actualizado` };
  }
  if (name === "delete_barber") {
    const b = barbers.find((x: any) => x.id === args.id);
    if (!b) return { error: `Barbero con ID ${args.id} no encontrado` };
    s.barbers = barbers.filter((x: any) => x.id !== args.id);
    await s.save();
    return { success: true, message: `Barbero "${b.name}" eliminado` };
  }
  if (name === "list_barbers") {
    return { success: true, barbers, count: barbers.length };
  }

  // ── Barber Queue ──
  const queue = s.barberQueue || [];
  if (name === "add_queue_entry") {
    const now = new Date().toISOString();
    const entry = { id: `Q-${Date.now()}`, customerName: args.customerName, customerPhone: args.customerPhone || "", serviceRequested: args.serviceRequested || "", barberId: args.barberId || null, position: queue.length + 1, status: "waiting", checkInTime: now, notes: args.notes || "" };
    s.barberQueue = [...queue, entry];
    await s.save();
    return { success: true, message: `${args.customerName} agregado a la cola`, queueEntry: entry };
  }
  if (name === "update_queue_entry") {
    const idx = queue.findIndex((q: any) => q.id === args.id);
    if (idx === -1) return { error: `Entrada ${args.id} no encontrada` };
    if (args.customerName !== undefined) queue[idx].customerName = args.customerName;
    if (args.barberId !== undefined) queue[idx].barberId = args.barberId;
    if (args.status !== undefined) {
      queue[idx].status = args.status;
      if (args.status === "in_progress") queue[idx].startedAt = new Date().toISOString();
      if (args.status === "completed") queue[idx].completedAt = new Date().toISOString();
    }
    if (args.notes !== undefined) queue[idx].notes = args.notes;
    s.barberQueue = queue;
    await s.save();
    return { success: true, message: `Entrada de cola actualizada` };
  }
  if (name === "delete_queue_entry") {
    const q = queue.find((x: any) => x.id === args.id);
    if (!q) return { error: `Entrada ${args.id} no encontrada` };
    s.barberQueue = queue.filter((x: any) => x.id !== args.id);
    await s.save();
    return { success: true, message: `${q.customerName} eliminado de la cola` };
  }
  if (name === "list_queue") {
    return { success: true, queue, count: queue.length };
  }

  // ── Promotions (via Restaurant model) ──
  try {
    const { Restaurant } = await import("@/lib/models/Restaurant");
    let rest = await Restaurant.findOne({ storeId });
    if (!rest) {
      rest = await Restaurant.create({ storeId, name: s.name, promotions: [], reservations: [], reviews: [], loyaltyMembers: [], pointsTransactions: [], loyaltySettings: { pointsPerDollar: 1, rewardsThreshold: 100 } });
    }

    const promotions = rest.promotions || [];
    if (name === "create_promotion") {
      const maxId = promotions.length > 0 ? Math.max(...promotions.map((p: any) => p.id || 0)) : 0;
      rest.promotions = [...promotions, { id: maxId + 1, code: args.code.toUpperCase(), description: args.description || "", type: args.type, value: args.value, minOrder: args.minOrder || 0, maxUses: args.maxUses || 100, usedCount: 0, validFrom: args.validFrom, validUntil: args.validUntil, active: args.active !== false, applicableItems: [] }];
      await rest.save();
      return { success: true, message: `Promoción "${args.code}" creada` };
    }
    if (name === "update_promotion") {
      const idx = promotions.findIndex((p: any) => p.id === args.id);
      if (idx === -1) return { error: `Promoción con ID ${args.id} no encontrada` };
      if (args.code !== undefined) promotions[idx].code = args.code.toUpperCase();
      if (args.description !== undefined) promotions[idx].description = args.description;
      if (args.type !== undefined) promotions[idx].type = args.type;
      if (args.value !== undefined) promotions[idx].value = args.value;
      if (args.minOrder !== undefined) promotions[idx].minOrder = args.minOrder;
      if (args.maxUses !== undefined) promotions[idx].maxUses = args.maxUses;
      if (args.validFrom !== undefined) promotions[idx].validFrom = args.validFrom;
      if (args.validUntil !== undefined) promotions[idx].validUntil = args.validUntil;
      if (args.active !== undefined) promotions[idx].active = args.active;
      rest.promotions = promotions;
      await rest.save();
      return { success: true, message: `Promoción "${promotions[idx].code}" actualizada` };
    }
    if (name === "delete_promotion") {
      const p = promotions.find((x: any) => x.id === args.id);
      if (!p) return { error: `Promoción con ID ${args.id} no encontrada` };
      rest.promotions = promotions.filter((x: any) => x.id !== args.id);
      await rest.save();
      return { success: true, message: `Promoción "${p.code}" eliminada` };
    }
    if (name === "list_promotions") {
      return { success: true, promotions, count: promotions.length };
    }

    // ── Reservations ──
    const reservations = rest.reservations || [];
    if (name === "create_reservation") {
      const maxId = reservations.length > 0 ? Math.max(...reservations.map((r: any) => r.id || 0)) : 0;
      rest.reservations = [...reservations, { id: maxId + 1, customerName: args.customerName, customerEmail: args.customerEmail || "", customerPhone: args.customerPhone, date: args.date, time: args.time, partySize: args.partySize, tableNumber: args.tableNumber || null, status: "pending", notes: args.notes || "" }];
      await rest.save();
      return { success: true, message: `Reservación para ${args.customerName} el ${args.date} a las ${args.time} creada` };
    }
    if (name === "update_reservation") {
      const idx = reservations.findIndex((r: any) => r.id === args.id);
      if (idx === -1) return { error: `Reservación con ID ${args.id} no encontrada` };
      if (args.customerName !== undefined) reservations[idx].customerName = args.customerName;
      if (args.customerPhone !== undefined) reservations[idx].customerPhone = args.customerPhone;
      if (args.date !== undefined) reservations[idx].date = args.date;
      if (args.time !== undefined) reservations[idx].time = args.time;
      if (args.partySize !== undefined) reservations[idx].partySize = args.partySize;
      if (args.tableNumber !== undefined) reservations[idx].tableNumber = args.tableNumber;
      if (args.status !== undefined) reservations[idx].status = args.status;
      if (args.notes !== undefined) reservations[idx].notes = args.notes;
      rest.reservations = reservations;
      await rest.save();
      return { success: true, message: `Reservación actualizada` };
    }
    if (name === "delete_reservation") {
      const r = reservations.find((x: any) => x.id === args.id);
      if (!r) return { error: `Reservación con ID ${args.id} no encontrada` };
      rest.reservations = reservations.filter((x: any) => x.id !== args.id);
      await rest.save();
      return { success: true, message: `Reservación de "${r.customerName}" eliminada` };
    }
    if (name === "list_reservations") {
      return { success: true, reservations, count: reservations.length };
    }

    // ── Loyalty ──
    const loyaltyMembers = rest.loyaltyMembers || [];
    if (name === "list_loyalty_members") {
      return { success: true, loyaltyMembers, count: loyaltyMembers.length };
    }
    if (name === "add_loyalty_points") {
      let member = loyaltyMembers.find((m: any) => m.customerId === args.customerId);
      if (!member) {
        member = { customerId: args.customerId, customerName: args.customerName || "", customerEmail: "", totalPoints: 0, totalVisits: 0, totalSpent: 0, tier: "bronze" };
        rest.loyaltyMembers.push(member);
      }
      member.totalPoints += args.points;
      if (!rest.pointsTransactions) rest.pointsTransactions = [];
      rest.pointsTransactions.push({ id: Date.now(), customerId: args.customerId, customerName: args.customerName || member.customerName, points: args.points, type: "earned", description: args.description || "", createdAt: new Date() });
      await rest.save();
      return { success: true, message: `${args.points} puntos agregados a ${member.customerName}` };
    }
    if (name === "redeem_loyalty_points") {
      const member = loyaltyMembers.find((m: any) => m.customerId === args.customerId);
      if (!member) return { error: `Miembro no encontrado` };
      if (member.totalPoints < args.points) return { error: `Puntos insuficientes. Tiene ${member.totalPoints}, necesita ${args.points}` };
      member.totalPoints -= args.points;
      if (!rest.pointsTransactions) rest.pointsTransactions = [];
      rest.pointsTransactions.push({ id: Date.now(), customerId: args.customerId, customerName: member.customerName, points: args.points, type: "redeemed", description: args.description || "Canje", createdAt: new Date() });
      await rest.save();
      return { success: true, message: `${args.points} puntos canjeados por ${member.customerName}` };
    }

    // ── Reviews ──
    const reviews = rest.reviews || [];
    if (name === "list_reviews") {
      return { success: true, reviews, count: reviews.length };
    }
    if (name === "reply_to_review") {
      const idx = reviews.findIndex((r: any) => r.id === args.id || r._id?.toString() === String(args.id));
      if (idx === -1) return { error: `Reseña con ID ${args.id} no encontrada` };
      reviews[idx].reply = args.reply;
      rest.reviews = reviews;
      await rest.save();
      return { success: true, message: `Respuesta agregada a la reseña` };
    }
    if (name === "delete_review") {
      const r = reviews.find((x: any) => x.id === args.id || x._id?.toString() === String(args.id));
      if (!r) return { error: `Reseña con ID ${args.id} no encontrada` };
      rest.reviews = reviews.filter((x: any) => x.id !== args.id && x._id?.toString() !== String(args.id));
      await rest.save();
      return { success: true, message: `Reseña eliminada` };
    }
  } catch (error: any) {
    if (error.message?.includes("Restaurant")) {
      return { error: "Módulo de restaurante no disponible. Asegúrate de que el modelo Restaurant esté creado." };
    }
    throw error;
  }

  return { error: `Unknown industry tool: ${name}` };
}
