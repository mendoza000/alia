import { prisma } from "@/lib/db";

const RATES_ENDPOINT = "https://open.er-api.com/v6/latest/USD";

type OpenErApiResponse = {
  result: "success" | "error";
  rates: Record<string, number>;
};

export async function fetchLatestUsdRates(): Promise<Record<string, number>> {
  const response = await fetch(RATES_ENDPOINT);
  if (!response.ok) {
    throw new Error(`Exchange rate request failed with status ${response.status}`);
  }

  const data = (await response.json()) as OpenErApiResponse;
  if (data.result !== "success") {
    throw new Error("Exchange rate provider returned an error result");
  }

  return data.rates;
}

export async function refreshExchangeRates(): Promise<number> {
  const rates = await fetchLatestUsdRates();

  await Promise.all(
    Object.entries(rates).map(([currency, rateToUsd]) =>
      prisma.exchangeRate.upsert({
        where: { currency },
        create: { currency, rateToUsd },
        update: { rateToUsd },
      }),
    ),
  );

  return Object.keys(rates).length;
}

export async function getUsdRateMap(): Promise<Map<string, number>> {
  const rows = await prisma.exchangeRate.findMany();
  const map = new Map(rows.map((row) => [row.currency, row.rateToUsd]));
  map.set("USD", 1);
  return map;
}

/**
 * Fetches the exchange rate straight from the provider instead of the
 * daily-cached table, so the rate frozen on a payment at approval time
 * is as fresh as possible. Falls back to the cached table if the
 * provider is unreachable, so a transient API outage never blocks a
 * payment approval.
 */
export async function getLiveUsdRateMap(): Promise<Map<string, number>> {
  try {
    const rates = await fetchLatestUsdRates();
    const map = new Map(Object.entries(rates));
    map.set("USD", 1);
    return map;
  } catch {
    return getUsdRateMap();
  }
}

export function toUsd(
  amount: number,
  currency: string,
  rates: Map<string, number>,
): number {
  const rate = rates.get(currency.toUpperCase());
  if (!rate) return 0;
  return amount / rate;
}

/**
 * Converts a payment's amount to USD using the exchange rate frozen at
 * the moment it was approved (`exchangeRateToUsd`). Falls back to the
 * live rate map only for payments approved before that field existed.
 */
export function paymentToUsd(
  amount: number,
  currency: string,
  exchangeRateToUsd: number | null,
  liveRates: Map<string, number>,
): number {
  const rate = exchangeRateToUsd ?? liveRates.get(currency.toUpperCase());
  if (!rate) return 0;
  return amount / rate;
}
