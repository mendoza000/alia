import { NextResponse } from "next/server";
import { reconcileStripeSettlements } from "@/lib/admin/stripe-settlement";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await reconcileStripeSettlements();

  return NextResponse.json({ ...result, timestamp: new Date().toISOString() });
}
