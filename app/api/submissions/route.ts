import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db, submissions } from "@/lib/db";
import { ReceiptSchema } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db().select().from(submissions).orderBy(desc(submissions.createdAt)).limit(10);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ReceiptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
    }
    const { merchant, date, total, currency } = parsed.data;
    const [row] = await db()
      .insert(submissions)
      .values({ merchant, date, total: total.toString(), currency })
      .returning();
    return NextResponse.json(row);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
