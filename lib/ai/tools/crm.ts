import type { ToolDefinition, ToolResult } from "./base";

const CATEGORY_KEYWORDS: Record<string, string> = {
  restaurant: "restaurante",
  store: "tienda",
  doctor: "consultorio médico",
  school: "escuela",
  beauty_salon: "salón de belleza",
  gym: "gimnasio",
  lawyer: "abogado",
  auto_repair: "taller mecánico",
  real_estate_agency: "bienes raíces",
  accounting: "contador",
};

export const TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "create_customer",
      description: "Register a new customer for the store",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Customer name" },
          email: { type: "string", description: "Customer email" },
          phone: { type: "string", description: "Customer phone" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_customer",
      description: "Update a customer's information by name",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Current customer name" },
          newName: { type: "string", description: "New name" },
          email: { type: "string", description: "New email" },
          phone: { type: "string", description: "New phone" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_customers",
      description: "List all customers for the store",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string", description: "Search by name, email, or phone" },
          limit: { type: "number", description: "Max results (default 50)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "invite_team_member",
      description: "Invite a user to the organization team",
      parameters: {
        type: "object",
        properties: {
          email: { type: "string", description: "Email of the user to invite" },
          role: { type: "string", enum: ["admin", "editor", "viewer"], description: "Role to assign" },
        },
        required: ["email", "role"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "remove_team_member",
      description: "Remove a team member from the organization",
      parameters: {
        type: "object",
        properties: {
          memberId: { type: "string", description: "Member ID to remove" },
        },
        required: ["memberId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "change_team_member_role",
      description: "Change a team member's role",
      parameters: {
        type: "object",
        properties: {
          memberId: { type: "string", description: "Member ID" },
          role: { type: "string", enum: ["admin", "editor", "viewer"], description: "New role" },
        },
        required: ["memberId", "role"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_team_members",
      description: "List all team members in the organization",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_leads",
      description: "Search for real businesses/leads in Google Maps by category and location. Returns real names, phones, and addresses.",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string", description: "Location to search near (e.g. 'Col. Centro, CDMX, México')" },
          category: { type: "string", enum: Object.keys(CATEGORY_KEYWORDS), description: "Type of business to search for" },
          radius: { type: "number", description: "Search radius in meters (default 1000)" },
          maxResults: { type: "number", description: "Max results to return (default 10, max 20)" },
        },
        required: ["location"],
      },
    },
  },
] as ToolDefinition[];

export async function executeCRMTool(name: string, args: any, store: any, userId: string): Promise<ToolResult> {
  const { connectDB } = await import("@/lib/mongodb");

  if (["invite_team_member", "remove_team_member", "change_team_member_role", "list_team_members"].includes(name)) {
    const { Organization } = await import("@/lib/models/Organization");
    const { User } = await import("@/lib/models/User");
    await connectDB();
    const orgId = store?.organizationId;
    if (!orgId) return { error: "No organization found" };
    const org = await Organization.findById(orgId);
    if (!org) return { error: "Organization not found" };

    if (name === "invite_team_member") {
      if (org.members?.some((m: any) => m.email === args.email)) return { error: `${args.email} ya es miembro` };
      const userToInvite = await User.findOne({ email: args.email });
      if (!userToInvite) return { error: `No existe un usuario con email ${args.email}` };
      org.members.push({ userId: userToInvite._id, email: args.email, name: userToInvite.name || args.email, role: args.role, joinedAt: new Date() });
      await org.save();
      userToInvite.organizationId = orgId;
      userToInvite.role = args.role;
      await userToInvite.save();
      return { success: true, message: `${args.email} invitado como ${args.role}` };
    }

    if (name === "remove_team_member") {
      const member = org.members?.find((m: any) => String(m._id) === args.memberId);
      if (!member) return { error: `Miembro ${args.memberId} no encontrado` };
      if (member.role === "owner") return { error: "No puedes eliminar al propietario" };
      org.members = org.members.filter((m: any) => String(m._id) !== args.memberId);
      await org.save();
      const userToRemove = await User.findOne({ email: member.email });
      if (userToRemove) {
        userToRemove.organizationId = undefined;
        userToRemove.role = undefined;
        await userToRemove.save();
      }
      return { success: true, message: `Miembro ${member.email} eliminado del equipo` };
    }

    if (name === "change_team_member_role") {
      const member = org.members?.find((m: any) => String(m._id) === args.memberId);
      if (!member) return { error: `Miembro ${args.memberId} no encontrado` };
      if (member.role === "owner") return { error: "No puedes cambiar el rol del propietario" };
      member.role = args.role;
      await org.save();
      const userToChange = await User.findOne({ email: member.email });
      if (userToChange) { userToChange.role = args.role; await userToChange.save(); }
      return { success: true, message: `Rol de ${member.email} cambiado a ${args.role}` };
    }

    if (name === "list_team_members") {
      return { success: true, members: org.members || [], count: org.members?.length || 0 };
    }
  }

  if (["create_customer", "update_customer", "list_customers"].includes(name)) {
    const storeId = store?._id || store?.id;
    if (!storeId) return { error: "No store selected" };
    const { Store } = await import("@/lib/models/Store");
    await connectDB();
    const s = await Store.findById(storeId);
    if (!s) return { error: "Store not found" };

    if (name === "create_customer") {
      const maxId = Math.max(0, ...s.customers.map((c: any) => c.id || 0));
      s.customers.push({ id: maxId + 1, name: args.name, email: args.email || "", phone: args.phone || "" });
      await s.save();
      try { const { notifyOwner } = await import("@/lib/notify"); await notifyOwner(String((store as any).ownerId || (store as any).userId), String(storeId), "customer", "Nuevo cliente registrado", `${args.name} - ${args.email || ""}`); } catch {}
      return { success: true, message: `Cliente "${args.name}" agregado con éxito` };
    }

    if (name === "update_customer") {
      const customer = s.customers.find((c: any) => c.name === args.name);
      if (!customer) return { error: `Cliente "${args.name}" no encontrado` };
      if (args.newName) customer.name = args.newName;
      if (args.email) customer.email = args.email;
      if (args.phone) customer.phone = args.phone;
      await s.save();
      return { success: true, message: `Cliente "${args.name}" actualizado con éxito` };
    }

    if (name === "list_customers") {
      let customers = s.customers || [];
      if (args.search) {
        const q = args.search.toLowerCase();
        customers = customers.filter((c: any) =>
          c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q)
        );
      }
      customers = customers.slice(0, args.limit || 50);
      return {
        success: true,
        customers: customers.map((c: any) => ({ id: c.id, name: c.name, email: c.email, phone: c.phone })),
        count: customers.length,
      };
    }
  }

  if (name === "find_leads") {
    try {
      const storeId = store?._id || store?.id;
      const res = await fetch(`${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/leads/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: args.location,
          category: args.category || "store",
          radius: args.radius || 1000,
          maxResults: Math.min(args.maxResults || 10, 20),
          storeId: storeId ? String(storeId) : undefined,
          customKeyword: args.customKeyword || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) return { error: data.error };
      return {
        success: true,
        message: `Se encontraron ${data.leads?.length || 0} leads en ${args.location}`,
        leads: data.leads || [],
        total: data.total || 0,
      };
    } catch (err: any) {
      return { error: `Error buscando leads: ${err.message}` };
    }
  }

  return { error: `Unknown CRM tool: ${name}` };
}
