import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/db";
import { documents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const [doc] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id));

    if (!doc || !doc.storagePath) {
      return new NextResponse("File not found", { status: 404 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.storagePath, 60);

    if (error || !data?.signedUrl) {
      return new NextResponse("Could not generate download link", { status: 500 });
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    return new NextResponse("Internal server error", { status: 500 });
  }
}