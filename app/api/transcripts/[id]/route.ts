import { connectDB } from "@/lib/mongodb";
import WidgetMessage from "@/lib/models/WidgetMessage";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    
    const messages = await WidgetMessage.find({ conversationId: id })
      .sort({ createdAt: 1 })
      .lean();

    return Response.json({ messages });
  } catch (error: any) {
    console.error("Error fetching transcript messages:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
