import type { ToolDefinition, ToolResult } from "./base";

export const TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "create_document",
      description: "Add a new document to the store",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Document name" },
          type: { type: "string", description: "Document type (e.g. contrato, factura, identificacion)" },
          description: { type: "string", description: "Document description" },
          tags: { type: "string", description: "Comma-separated tags" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_document",
      description: "Delete a document by name",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Document name to delete" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_documents",
      description: "List all documents for the store",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", description: "Filter by document type" },
          limit: { type: "number", description: "Max results (default 50)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_casefile",
      description: "Create a new case file (expediente)",
      parameters: {
        type: "object",
        properties: {
          caseNumber: { type: "string", description: "Case number" },
          clientName: { type: "string", description: "Client name" },
          type: { type: "string", description: "Case type (e.g. civil, penal, laboral, familiar)" },
          description: { type: "string", description: "Case description" },
          court: { type: "string", description: "Court name" },
        },
        required: ["caseNumber", "clientName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_casefile",
      description: "Update a case file's status or details",
      parameters: {
        type: "object",
        properties: {
          caseNumber: { type: "string", description: "Case number to update" },
          status: { type: "string", description: "New status (active, closed, archived)" },
          description: { type: "string", description: "New description" },
          outcome: { type: "string", description: "Case outcome" },
        },
        required: ["caseNumber"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_casefile",
      description: "Delete a case file by case number",
      parameters: {
        type: "object",
        properties: {
          caseNumber: { type: "string", description: "Case number to delete" },
        },
        required: ["caseNumber"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_casefiles",
      description: "List all case files for the store",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by status" },
          limit: { type: "number", description: "Max results (default 50)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_hearing",
      description: "Schedule a new hearing (audiencia)",
      parameters: {
        type: "object",
        properties: {
          caseNumber: { type: "string", description: "Associated case number" },
          date: { type: "string", description: "Hearing date (YYYY-MM-DD)" },
          time: { type: "string", description: "Hearing time (HH:MM)" },
          court: { type: "string", description: "Court name" },
          hearingType: { type: "string", description: "Type (e.g. preliminary, trial, sentencing)" },
          notes: { type: "string", description: "Additional notes" },
        },
        required: ["caseNumber", "date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_hearing",
      description: "Update a hearing's date, time, notes, or outcome",
      parameters: {
        type: "object",
        properties: {
          hearingId: { type: "string", description: "Hearing ID to update" },
          date: { type: "string", description: "New date (YYYY-MM-DD)" },
          time: { type: "string", description: "New time (HH:MM)" },
          notes: { type: "string", description: "New notes" },
          outcome: { type: "string", description: "Hearing outcome" },
        },
        required: ["hearingId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_hearing",
      description: "Delete a hearing by ID",
      parameters: {
        type: "object",
        properties: {
          hearingId: { type: "string", description: "Hearing ID to delete" },
        },
        required: ["hearingId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_hearings",
      description: "List all hearings for the store",
      parameters: {
        type: "object",
        properties: {
          caseNumber: { type: "string", description: "Filter by case number" },
          date: { type: "string", description: "Filter by date (YYYY-MM-DD)" },
          limit: { type: "number", description: "Max results (default 50)" },
        },
      },
    },
  },
];

export async function executeLegalTool(name: string, args: any, store: any, _userId: string): Promise<ToolResult> {
  const storeId = store?._id || store?.id;
  if (!storeId) return { error: "No store selected" };

  const { connectDB } = await import("@/lib/mongodb");
  const { Store } = await import("@/lib/models/Store");
  await connectDB();
  const s = await Store.findById(storeId);
  if (!s) return { error: "Store not found" };

  if (name === "create_document") {
    const maxId = Math.max(0, ...s.documents.map((d: any) => d.id || 0));
    s.documents.push({
      id: maxId + 1,
      name: args.name,
      type: args.type || "",
      desc: args.description || "",
      tags: args.tags ? args.tags.split(",").map((t: string) => t.trim()) : [],
      uploadDate: new Date().toISOString(),
    });
    await s.save();
    return { success: true, message: `Documento "${args.name}" creado con éxito` };
  }

  if (name === "delete_document") {
    const idx = s.documents.findIndex((d: any) => d.name === args.name);
    if (idx === -1) return { error: `Documento "${args.name}" no encontrado` };
    s.documents.splice(idx, 1);
    await s.save();
    return { success: true, message: `Documento "${args.name}" eliminado con éxito` };
  }

  if (name === "list_documents") {
    let docs = s.documents || [];
    if (args.type) docs = docs.filter((d: any) => d.type === args.type);
    docs = docs.slice(0, args.limit || 50);
    return {
      success: true,
      documents: docs.map((d: any) => ({ id: d.id, name: d.name, type: d.type, description: d.desc, tags: d.tags })),
      count: docs.length,
    };
  }

  if (name === "create_casefile") {
    const maxId = Math.max(0, ...s.caseFiles.map((c: any) => c.id || 0));
    s.caseFiles.push({
      id: maxId + 1,
      caseNumber: args.caseNumber,
      clientName: args.clientName,
      type: args.type || "",
      description: args.description || "",
      court: args.court || "",
      status: "active",
      filingDate: new Date().toISOString().split("T")[0],
    });
    await s.save();
    return { success: true, message: `Expediente ${args.caseNumber} creado para ${args.clientName}` };
  }

  if (name === "update_casefile") {
    const cf = s.caseFiles.find((c: any) => c.caseNumber === args.caseNumber);
    if (!cf) return { error: `Expediente ${args.caseNumber} no encontrado` };
    if (args.status) cf.status = args.status;
    if (args.description !== undefined) cf.description = args.description;
    if (args.outcome) cf.outcome = args.outcome;
    await s.save();
    return { success: true, message: `Expediente ${args.caseNumber} actualizado` };
  }

  if (name === "delete_casefile") {
    const idx = s.caseFiles.findIndex((c: any) => c.caseNumber === args.caseNumber);
    if (idx === -1) return { error: `Expediente ${args.caseNumber} no encontrado` };
    s.caseFiles.splice(idx, 1);
    await s.save();
    return { success: true, message: `Expediente ${args.caseNumber} eliminado` };
  }

  if (name === "list_casefiles") {
    let cfs = s.caseFiles || [];
    if (args.status) cfs = cfs.filter((c: any) => c.status === args.status);
    cfs = cfs.slice(0, args.limit || 50);
    return {
      success: true,
      caseFiles: cfs.map((c: any) => ({
        id: c.id,
        caseNumber: c.caseNumber,
        clientName: c.clientName,
        type: c.type,
        status: c.status,
        description: c.description,
        court: c.court,
        filingDate: c.filingDate,
      })),
      count: cfs.length,
    };
  }

  if (name === "create_hearing") {
    const maxId = Math.max(0, ...s.hearings.map((h: any) => h.id || 0));
    s.hearings.push({
      id: maxId + 1,
      caseNumber: args.caseNumber,
      date: args.date,
      time: args.time || "",
      court: args.court || "",
      hearingType: args.hearingType || "",
      notes: args.notes || "",
      outcome: "",
    });
    await s.save();
    return { success: true, message: `Audiencia creada para el expediente ${args.caseNumber} el ${args.date}` };
  }

  if (name === "update_hearing") {
    const h = s.hearings.find((h: any) => String(h.id) === String(args.hearingId));
    if (!h) return { error: `Audiencia con ID ${args.hearingId} no encontrada` };
    if (args.date) h.date = args.date;
    if (args.time) h.time = args.time;
    if (args.notes !== undefined) h.notes = args.notes;
    if (args.outcome) h.outcome = args.outcome;
    await s.save();
    return { success: true, message: `Audiencia actualizada` };
  }

  if (name === "delete_hearing") {
    const idx = s.hearings.findIndex((h: any) => String(h.id) === String(args.hearingId));
    if (idx === -1) return { error: `Audiencia con ID ${args.hearingId} no encontrada` };
    s.hearings.splice(idx, 1);
    await s.save();
    return { success: true, message: `Audiencia eliminada` };
  }

  if (name === "list_hearings") {
    let hearings = s.hearings || [];
    if (args.caseNumber) hearings = hearings.filter((h: any) => h.caseNumber === args.caseNumber);
    if (args.date) hearings = hearings.filter((h: any) => h.date === args.date);
    hearings = hearings.slice(0, args.limit || 50);
    return {
      success: true,
      hearings: hearings.map((h: any) => ({
        id: h.id,
        caseNumber: h.caseNumber,
        date: h.date,
        time: h.time,
        court: h.court,
        hearingType: h.hearingType,
        notes: h.notes,
        outcome: h.outcome,
      })),
      count: hearings.length,
    };
  }

  return { error: `Unknown legal tool: ${name}` };
}
