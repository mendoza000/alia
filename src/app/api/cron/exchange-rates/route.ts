import { NextResponse } from "next/server";
import { refreshExchangeRates } from "@/lib/exchange-rates";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updated = await refreshExchangeRates();

  return NextResponse.json({ updated, timestamp: new Date().toISOString() });
}
