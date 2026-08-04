import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Plan from "@/lib/models/Plan";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const plans = await Plan.find().sort({ price: 1 });
  return NextResponse.json(plans);
}
