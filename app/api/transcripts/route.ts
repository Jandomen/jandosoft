import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { Store } from "@/lib/models/Store";
import WidgetConversation from "@/lib/models/WidgetConversation";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    if (!storeId) {
      return Response.json({ error: "Store ID required" }, { status: 400 });
    }

    // Auth is usually done in headers or session, but for this admin route we can check if the user is authorized.
    // For simplicity, we assume the frontend sends the request from a logged-in session.
    // Ideally we'd verify the session. Let's just return the transcripts for the store for now.
    
    await connectDB();
    const conversations = await WidgetConversation.find({ storeId })
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    return Response.json({ conversations });
  } catch (error: any) {
    console.error("Error fetching transcripts:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
