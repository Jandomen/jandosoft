/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";
import { executeWorkflowsForEvent, createTriggerEvent } from "@/lib/workflow";

export async function POST(req: NextRequest) {
  try {
    const { storeId, trigger, payload } = await req.json();
    if (!storeId || !trigger) {
      return NextResponse.json({ error: "storeId and trigger required" }, { status: 400 });
    }

    await connectDB();
    const store = await Store.findById(storeId);
    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const event = createTriggerEvent(trigger, storeId, payload || {});
    const results = await executeWorkflowsForEvent(event, store);

    return NextResponse.json({
      executed: results.length,
      results: results.map((r) => ({
        workflowId: r.workflowId,
        workflowName: r.workflowName,
        success: r.success,
        steps: r.steps.length,
        error: r.error,
      })),
    });
  } catch (error: any) {
    console.error("[Workflow Trigger] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
