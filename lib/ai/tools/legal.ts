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

  if (name === "create_document") {
    const doc = {
      name: args.name,
      type: args.type || "",
      desc: args.description || "",
      tags: args.tags ? args.tags.split(",").map((t: string) => t.trim()) : [],
      uploadDate: new Date().toISOString(),
    };
    const updated = await Store.findOneAndUpdate(
      { _id: storeId },
      { $push: { documents: doc } },
      { new: true, runValidators: true }
    );
    if (!updated) return { error: "Store not found" };
    const newDoc = updated.documents?.[updated.documents.length - 1];
    return { success: true, message: `Documento "${args.name}" creado con éxito`, id: newDoc?.id || newDoc?._id };
  }

  if (name === "delete_document") {
    const result = await Store.updateOne(
      { _id: storeId },
      { $pull: { documents: { name: args.name } as any } }
    );
    if (result.matchedCount === 0) return { error: "Store not found" };
    if (result.modifiedCount === 0) return { error: `Documento "${args.name}" no encontrado` };
    return { success: true, message: `Documento "${args.name}" eliminado con éxito` };
  }

  if (name === "list_documents") {
    const s = await Store.findById(storeId).lean();
    if (!s) return { error: "Store not found" };
    let docs = (s as any).documents || [];
    if (args.type) docs = docs.filter((d: any) => d.type === args.type);
    docs = docs.slice(0, args.limit || 50);
    return {
      success: true,
      documents: docs.map((d: any) => ({ id: d.id, name: d.name, type: d.type, description: d.desc, tags: d.tags })),
      count: docs.length,
    };
  }

  if (name === "create_casefile") {
    const cf = {
      caseNumber: args.caseNumber,
      clientName: args.clientName,
      type: args.type || "",
      description: args.description || "",
      court: args.court || "",
      status: "active",
      filingDate: new Date().toISOString().split("T")[0],
    };
    const updated = await Store.findOneAndUpdate(
      { _id: storeId },
      { $push: { caseFiles: cf } },
      { new: true, runValidators: true }
    );
    if (!updated) return { error: "Store not found" };
    return { success: true, message: `Expediente ${args.caseNumber} creado para ${args.clientName}` };
  }

  if (name === "update_casefile") {
    const updateFields: Record<string, any> = {};
    if (args.status) updateFields["caseFiles.$.status"] = args.status;
    if (args.description !== undefined) updateFields["caseFiles.$.description"] = args.description;
    if (args.outcome) updateFields["caseFiles.$.outcome"] = args.outcome;
    if (Object.keys(updateFields).length === 0) return { error: "No fields to update" };
    const result = await Store.updateOne(
      { _id: storeId, "caseFiles.caseNumber": args.caseNumber },
      { $set: updateFields }
    );
    if (result.matchedCount === 0) return { error: `Expediente ${args.caseNumber} no encontrado` };
    return { success: true, message: `Expediente ${args.caseNumber} actualizado` };
  }

  if (name === "delete_casefile") {
    const result = await Store.updateOne(
      { _id: storeId },
      { $pull: { caseFiles: { caseNumber: args.caseNumber } as any } }
    );
    if (result.matchedCount === 0) return { error: "Store not found" };
    if (result.modifiedCount === 0) return { error: `Expediente ${args.caseNumber} no encontrado` };
    return { success: true, message: `Expediente ${args.caseNumber} eliminado` };
  }

  if (name === "list_casefiles") {
    const s = await Store.findById(storeId).lean();
    if (!s) return { error: "Store not found" };
    let cfs = (s as any).caseFiles || [];
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
    const hearing = {
      caseNumber: args.caseNumber,
      date: args.date,
      time: args.time || "",
      court: args.court || "",
      hearingType: args.hearingType || "",
      notes: args.notes || "",
      outcome: "",
    };
    const updated = await Store.findOneAndUpdate(
      { _id: storeId },
      { $push: { hearings: hearing } },
      { new: true, runValidators: true }
    );
    if (!updated) return { error: "Store not found" };
    return { success: true, message: `Audiencia creada para el expediente ${args.caseNumber} el ${args.date}` };
  }

  if (name === "update_hearing") {
    const updateFields: Record<string, any> = {};
    if (args.date) updateFields["hearings.$.date"] = args.date;
    if (args.time) updateFields["hearings.$.time"] = args.time;
    if (args.notes !== undefined) updateFields["hearings.$.notes"] = args.notes;
    if (args.outcome) updateFields["hearings.$.outcome"] = args.outcome;
    if (Object.keys(updateFields).length === 0) return { error: "No fields to update" };
    const result = await Store.updateOne(
      { _id: storeId, "hearings.id": Number(args.hearingId) },
      { $set: updateFields }
    );
    if (result.matchedCount === 0) return { error: `Audiencia con ID ${args.hearingId} no encontrada` };
    return { success: true, message: `Audiencia actualizada` };
  }

  if (name === "delete_hearing") {
    const result = await Store.updateOne(
      { _id: storeId },
      { $pull: { hearings: { id: Number(args.hearingId) } as any } }
    );
    if (result.matchedCount === 0) return { error: "Store not found" };
    if (result.modifiedCount === 0) return { error: `Audiencia con ID ${args.hearingId} no encontrada` };
    return { success: true, message: `Audiencia eliminada` };
  }

  if (name === "list_hearings") {
    const s = await Store.findById(storeId).lean();
    if (!s) return { error: "Store not found" };
    let hearings = (s as any).hearings || [];
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
