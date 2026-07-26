import { NextResponse } from "next/server";
import { generateAffiliateManualPDF } from "@/lib/pdf-utils";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

function loadBase64(filename: string): string | null {
  try {
    const filePath = path.join(process.cwd(), "public", "images", "affiliate-manual", filename);
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath).toString("base64");
  } catch (e) {
    console.error(`[Manual] Error loading ${filename}:`, e);
    return null;
  }
}

export async function GET() {
  try {
    const images = {
      img1: loadBase64("step1-register.jpg"),
      img2: loadBase64("step2-verify.jpg"),
      img3: loadBase64("step3-link.jpg"),
    };
    console.log(`[Manual] Images loaded: img1=${!!images.img1}, img2=${!!images.img2}, img3=${!!images.img3}`);

    const pdf = await generateAffiliateManualPDF(images);
    console.log(`[Manual] PDF generated: ${pdf.length} bytes`);
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
