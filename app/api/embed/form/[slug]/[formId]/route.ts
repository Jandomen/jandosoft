import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Store } from "@/lib/models/Store";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string; formId: string }> }) {
  try {
    const { slug, formId } = await params;
    await connectDB();

    const store = await Store.findOne({ slug }).lean();
    if (!store) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    }

    const smartForms = (store as any)?.smartForms || [];
    const formIndex = smartForms.findIndex((f: any) => String(f.id) === formId);
    if (formIndex === -1) {
      return NextResponse.json({ error: "Formulario no encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const submission = {
      id: Date.now(),
      data: body.data || {},
      submittedAt: new Date().toISOString(),
    };

    await Store.updateOne(
      { slug },
      { $push: { [`smartForms.${formIndex}.submissions`]: submission } }
    );

    return NextResponse.json({ success: true, submission });
  } catch (error) {
    console.error("Form submit error:", error);
    return NextResponse.json({ error: "Error al enviar formulario" }, { status: 500 });
  }
}
