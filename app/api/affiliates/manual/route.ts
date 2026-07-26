import { NextResponse } from "next/server";
import { generateAffiliateManualPDF } from "@/lib/pdf-utils";

export const runtime = "nodejs";

export async function GET() {
  try {
    const pdf = await generateAffiliateManualPDF();
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="Manual-Afiliados-JANDOSOFT.pdf"',
      },
    });
  } catch (error) {
    console.error("Error generating affiliate manual:", error);
    return NextResponse.json({ error: "Error generating manual" }, { status: 500 });
  }
}
