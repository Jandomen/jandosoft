import type { ToolDefinition, ToolResult } from "./base";

export const TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "create_kb_entry",
      description: "Add a new entry to the store's knowledge base",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Entry title" },
          content: { type: "string", description: "Entry content" },
          category: { type: "string", description: "Category (default general)" },
          question: { type: "string", description: "Optional related question" },
        },
        required: ["title", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_kb_entry",
      description: "Update a knowledge base entry by ID",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number", description: "Entry ID" },
          title: { type: "string", description: "New title" },
          content: { type: "string", description: "New content" },
          category: { type: "string", description: "New category" },
          question: { type: "string", description: "New question" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_kb_entry",
      description: "Delete a knowledge base entry by ID",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number", description: "Entry ID to delete" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_kb_entries",
      description: "List knowledge base entries, optionally filtered by category",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "Filter by category" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_automation",
      description: "Create a new automation rule for the store",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Automation name" },
          trigger: { type: "string", description: "Trigger event" },
          actionType: { type: "string", description: "Action type" },
          actionConfig: { type: "object", description: "Action configuration" },
          triggerConfig: { type: "object", description: "Trigger configuration" },
        },
        required: ["name", "trigger", "actionType"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_automation",
      description: "Update an existing automation by ID",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number", description: "Automation ID" },
          name: { type: "string", description: "New name" },
          trigger: { type: "string", description: "New trigger" },
          actionType: { type: "string", description: "New action type" },
          actionConfig: { type: "object", description: "New action config" },
          triggerConfig: { type: "object", description: "New trigger config" },
          enabled: { type: "boolean", description: "Enable/disable" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_automation",
      description: "Delete an automation by ID",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number", description: "Automation ID to delete" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_automations",
      description: "List all automations for the store",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "toggle_automation",
      description: "Enable or disable an automation",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number", description: "Automation ID" },
          enabled: { type: "boolean", description: "True to enable, false to disable" },
        },
        required: ["id", "enabled"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_campaign",
      description: "Create a new marketing campaign (draft or scheduled)",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Campaign name" },
          type: { type: "string", description: "Campaign type (email, sms, etc.)" },
          audience: { type: "string", description: "Target audience" },
          subject: { type: "string", description: "Email subject" },
          body: { type: "string", description: "Campaign body/content" },
          scheduledAt: { type: "string", description: "Schedule date ISO string" },
        },
        required: ["name", "type", "subject", "body"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_campaign",
      description: "Update an existing campaign",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number", description: "Campaign ID" },
          name: { type: "string", description: "New name" },
          type: { type: "string", description: "New type" },
          audience: { type: "string", description: "New audience" },
          subject: { type: "string", description: "New subject" },
          body: { type: "string", description: "New body" },
          scheduledAt: { type: "string", description: "New schedule date" },
          status: { type: "string", description: "New status" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_campaign",
      description: "Delete a campaign by ID",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number", description: "Campaign ID to delete" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_campaigns",
      description: "List all campaigns for the store",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "send_campaign",
      description: "Mark a campaign as sending",
      parameters: {
        type: "object",
        properties: {
          campaignId: { type: "number", description: "Campaign ID" },
        },
        required: ["campaignId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_smart_form",
      description: "Create a new smart form",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Form name" },
          description: { type: "string", description: "Form description" },
          fields: { type: "array", description: "Form fields array", items: { type: "object" } },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_smart_form",
      description: "Update a smart form by ID",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number", description: "Form ID" },
          name: { type: "string", description: "New name" },
          description: { type: "string", description: "New description" },
          fields: { type: "array", description: "New fields", items: { type: "object" } },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_smart_form",
      description: "Delete a smart form by ID",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number", description: "Form ID to delete" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_smart_forms",
      description: "List all smart forms for the store",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_form_submissions",
      description: "List submissions for a specific smart form",
      parameters: {
        type: "object",
        properties: {
          formId: { type: "number", description: "Form ID" },
        },
        required: ["formId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "schedule_task",
      description: "Schedule an automated task for a specific date/time",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", description: "Task type (reminder, campaign, notification, etc.)" },
          payload: { type: "object", description: "Task payload data" },
          runAt: { type: "string", description: "ISO date string for when to run the task" },
        },
        required: ["type", "runAt"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_workflow",
      description: "Create a new workflow with trigger, conditions, and actions",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Workflow name" },
          trigger: {
            type: "object",
            properties: {
              type: { type: "string", description: "Trigger type: new_customer, new_order, new_appointment, payment_received, payment_failed, low_stock, customer_birthday, customer_inactive, webhook_received" },
              config: { type: "object", description: "Trigger configuration" },
            },
            required: ["type"],
          },
          steps: {
            type: "array",
            description: "Workflow steps (each has conditions and actions)",
            items: {
              type: "object",
              properties: {
                conditions: { type: "array", description: "List of conditions (all must pass)" },
                actions: { type: "array", description: "List of actions to execute" },
              },
            },
          },
        },
        required: ["name", "trigger", "steps"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_workflow",
      description: "Update an existing workflow",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number", description: "Workflow ID" },
          name: { type: "string" },
          enabled: { type: "boolean" },
          trigger: { type: "object" },
          steps: { type: "array" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_workflow",
      description: "Delete a workflow by ID",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number", description: "Workflow ID" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_workflows",
      description: "List all workflows for the store",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "toggle_workflow",
      description: "Enable or disable a workflow",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number", description: "Workflow ID" },
          enabled: { type: "boolean", description: "True to enable, false to disable" },
        },
        required: ["id", "enabled"],
      },
    },
  },
];

export async function executeMarketingTool(name: string, args: any, store: any, userId: string): Promise<ToolResult> {
  const storeId = store?._id || store?.id;
  if (!storeId) return { error: "No store selected" };

  const { connectDB } = await import("@/lib/mongodb");
  const { Store } = await import("@/lib/models/Store");
  await connectDB();
  const s = await Store.findById(storeId);
  if (!s) return { error: "Store not found" };

  const kb = s.knowledgebase || [];
  const automations = s.automations || [];
  const campaigns = s.campaigns || [];
  const forms = s.smartForms || [];

  if (name === "create_kb_entry") {
    const maxId = kb.length > 0 ? Math.max(...kb.map((k: any) => k.id || 0)) : 0;
    s.knowledgebase = [...kb, { id: maxId + 1, title: args.title, content: args.content, category: args.category || "general", question: args.question || "", createdAt: new Date().toISOString() }];
    await s.save();
    return { success: true, message: `Entrada "${args.title}" agregada a la base de conocimiento` };
  }

  if (name === "update_kb_entry") {
    const idx = kb.findIndex((k: any) => k.id === args.id);
    if (idx === -1) return { error: `Entrada con ID ${args.id} no encontrada` };
    if (args.title !== undefined) kb[idx].title = args.title;
    if (args.content !== undefined) kb[idx].content = args.content;
    if (args.category !== undefined) kb[idx].category = args.category;
    if (args.question !== undefined) kb[idx].question = args.question;
    s.knowledgebase = kb;
    await s.save();
    return { success: true, message: `Entrada "${kb[idx].title}" actualizada` };
  }

  if (name === "delete_kb_entry") {
    const entry = kb.find((k: any) => k.id === args.id);
    if (!entry) return { error: `Entrada con ID ${args.id} no encontrada` };
    s.knowledgebase = kb.filter((k: any) => k.id !== args.id);
    await s.save();
    return { success: true, message: `Entrada "${entry.title}" eliminada de la base de conocimiento` };
  }

  if (name === "list_kb_entries") {
    const filtered = args.category ? kb.filter((k: any) => k.category === args.category) : kb;
    return { success: true, entries: filtered, count: filtered.length };
  }

  if (name === "create_automation") {
    const maxId = automations.length > 0 ? Math.max(...automations.map((a: any) => a.id || 0)) : 0;
    s.automations = [...automations, { id: maxId + 1, name: args.name, trigger: args.trigger, actionType: args.actionType, actionConfig: args.actionConfig || {}, triggerConfig: args.triggerConfig || {}, enabled: true, createdAt: new Date().toISOString() }];
    await s.save();
    return { success: true, message: `Automatización "${args.name}" creada` };
  }

  if (name === "update_automation") {
    const idx = automations.findIndex((a: any) => a.id === args.id);
    if (idx === -1) return { error: `Automatización con ID ${args.id} no encontrada` };
    if (args.name !== undefined) automations[idx].name = args.name;
    if (args.trigger !== undefined) automations[idx].trigger = args.trigger;
    if (args.actionType !== undefined) automations[idx].actionType = args.actionType;
    if (args.actionConfig !== undefined) automations[idx].actionConfig = args.actionConfig;
    if (args.triggerConfig !== undefined) automations[idx].triggerConfig = args.triggerConfig;
    if (args.enabled !== undefined) automations[idx].enabled = args.enabled;
    s.automations = automations;
    await s.save();
    return { success: true, message: `Automatización "${automations[idx].name}" actualizada` };
  }

  if (name === "delete_automation") {
    const auto = automations.find((a: any) => a.id === args.id);
    if (!auto) return { error: `Automatización con ID ${args.id} no encontrada` };
    s.automations = automations.filter((a: any) => a.id !== args.id);
    await s.save();
    return { success: true, message: `Automatización "${auto.name}" eliminada` };
  }

  if (name === "list_automations") {
    return { success: true, automations, count: automations.length };
  }

  if (name === "toggle_automation") {
    const idx = automations.findIndex((a: any) => a.id === args.id);
    if (idx === -1) return { error: `Automatización con ID ${args.id} no encontrada` };
    automations[idx].enabled = args.enabled;
    s.automations = automations;
    await s.save();
    return { success: true, message: `Automatización "${automations[idx].name}" ${args.enabled ? "activada" : "desactivada"}` };
  }

  if (name === "create_campaign") {
    const maxId = campaigns.length > 0 ? Math.max(...campaigns.map((c: any) => c.id || 0)) : 0;
    s.campaigns = [...campaigns, { id: maxId + 1, name: args.name, type: args.type, status: args.scheduledAt ? "scheduled" : "draft", audience: args.audience, subject: args.subject, body: args.body, scheduledAt: args.scheduledAt || null, sentAt: null, stats: { sent: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 }, createdAt: new Date().toISOString() }];
    await s.save();
    return { success: true, message: `Campaña "${args.name}" creada (${args.scheduledAt ? "programada" : "borrador"})` };
  }

  if (name === "update_campaign") {
    const idx = campaigns.findIndex((c: any) => c.id === args.id);
    if (idx === -1) return { error: `Campaña con ID ${args.id} no encontrada` };
    if (args.name !== undefined) campaigns[idx].name = args.name;
    if (args.type !== undefined) campaigns[idx].type = args.type;
    if (args.audience !== undefined) campaigns[idx].audience = args.audience;
    if (args.subject !== undefined) campaigns[idx].subject = args.subject;
    if (args.body !== undefined) campaigns[idx].body = args.body;
    if (args.scheduledAt !== undefined) campaigns[idx].scheduledAt = args.scheduledAt;
    if (args.status !== undefined) campaigns[idx].status = args.status;
    s.campaigns = campaigns;
    await s.save();
    return { success: true, message: `Campaña "${campaigns[idx].name}" actualizada` };
  }

  if (name === "delete_campaign") {
    const camp = campaigns.find((c: any) => c.id === args.id);
    if (!camp) return { error: `Campaña con ID ${args.id} no encontrada` };
    s.campaigns = campaigns.filter((c: any) => c.id !== args.id);
    await s.save();
    return { success: true, message: `Campaña "${camp.name}" eliminada` };
  }

  if (name === "list_campaigns") {
    return { success: true, campaigns, count: campaigns.length };
  }

  if (name === "send_campaign") {
    const idx = campaigns.findIndex((c: any) => c.id === args.campaignId);
    if (idx === -1) return { error: `Campaña con ID ${args.campaignId} no encontrada` };
    campaigns[idx].status = "sending";
    s.campaigns = campaigns;
    await s.save();
    return { success: true, message: `Campaña "${campaigns[idx].name}" marcada como enviando` };
  }

  if (name === "create_smart_form") {
    const maxId = forms.length > 0 ? Math.max(...forms.map((f: any) => f.id || 0)) : 0;
    s.smartForms = [...forms, { id: maxId + 1, name: args.name, description: args.description || "", fields: args.fields || [], submissions: [], createdAt: new Date().toISOString() }];
    await s.save();
    return { success: true, message: `Formulario "${args.name}" creado` };
  }

  if (name === "update_smart_form") {
    const idx = forms.findIndex((f: any) => f.id === args.id);
    if (idx === -1) return { error: `Formulario con ID ${args.id} no encontrado` };
    if (args.name !== undefined) forms[idx].name = args.name;
    if (args.description !== undefined) forms[idx].description = args.description;
    if (args.fields !== undefined) forms[idx].fields = args.fields;
    s.smartForms = forms;
    await s.save();
    return { success: true, message: `Formulario "${forms[idx].name}" actualizado` };
  }

  if (name === "delete_smart_form") {
    const form = forms.find((f: any) => f.id === args.id);
    if (!form) return { error: `Formulario con ID ${args.id} no encontrado` };
    s.smartForms = forms.filter((f: any) => f.id !== args.id);
    await s.save();
    return { success: true, message: `Formulario "${form.name}" eliminado` };
  }

  if (name === "list_smart_forms") {
    return { success: true, smartForms: forms, count: forms.length };
  }

  if (name === "list_form_submissions") {
    const form = forms.find((f: any) => f.id === args.formId);
    if (!form) return { error: `Formulario con ID ${args.formId} no encontrado` };
    return { success: true, submissions: form.submissions || [], count: form.submissions?.length || 0, fields: form.fields };
  }

  if (name === "schedule_task") {
    const { ScheduledTask } = await import("@/lib/models/ScheduledTask");
    const task = await ScheduledTask.create({
      type: args.type, payload: args.payload,
      runAt: new Date(args.runAt), status: "pending",
      storeId, userId,
    });
    return { success: true, message: `Tarea programada: ${args.type} para el ${new Date(args.runAt).toLocaleString("es-MX")}`, taskId: task._id };
  }

  // ── Workflow tools ──
  const workflows = s.workflows || [];

  if (name === "create_workflow") {
    const maxId = workflows.length > 0 ? Math.max(...workflows.map((w: any) => w.id || 0)) : 0;
    const now = new Date().toISOString();
    s.workflows = [...workflows, {
      id: maxId + 1,
      name: args.name,
      description: args.description || "",
      enabled: true,
      trigger: args.trigger || { type: "new_customer", config: {} },
      steps: args.steps || [],
      createdAt: now,
      updatedAt: now,
      runCount: 0,
    }];
    await s.save();
    return { success: true, message: `Workflow "${args.name}" creado` };
  }

  if (name === "update_workflow") {
    const idx = workflows.findIndex((w: any) => w.id === args.id);
    if (idx === -1) return { error: `Workflow con ID ${args.id} no encontrado` };
    if (args.name !== undefined) workflows[idx].name = args.name;
    if (args.enabled !== undefined) workflows[idx].enabled = args.enabled;
    if (args.trigger !== undefined) workflows[idx].trigger = args.trigger;
    if (args.steps !== undefined) workflows[idx].steps = args.steps;
    workflows[idx].updatedAt = new Date().toISOString();
    s.workflows = workflows;
    await s.save();
    return { success: true, message: `Workflow "${workflows[idx].name}" actualizado` };
  }

  if (name === "delete_workflow") {
    const wf = workflows.find((w: any) => w.id === args.id);
    if (!wf) return { error: `Workflow con ID ${args.id} no encontrado` };
    s.workflows = workflows.filter((w: any) => w.id !== args.id);
    await s.save();
    return { success: true, message: `Workflow "${wf.name}" eliminado` };
  }

  if (name === "list_workflows") {
    return { success: true, workflows, count: workflows.length };
  }

  if (name === "toggle_workflow") {
    const idx = workflows.findIndex((w: any) => w.id === args.id);
    if (idx === -1) return { error: `Workflow con ID ${args.id} no encontrado` };
    workflows[idx].enabled = args.enabled;
    workflows[idx].updatedAt = new Date().toISOString();
    s.workflows = workflows;
    await s.save();
    return { success: true, message: `Workflow "${workflows[idx].name}" ${args.enabled ? "activado" : "desactivado"}` };
  }

  return { error: `Unknown marketing tool: ${name}` };
}
