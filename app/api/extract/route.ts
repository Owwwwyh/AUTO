import { NextResponse } from "next/server";
import { extractReceipt } from "@/lib/ai";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("image");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image uploaded under field 'image'" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 400 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const receipt = await extractReceipt(bytes, file.type);
    return NextResponse.json(receipt);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
