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

export function toUsd(
  amount: number,
  currency: string,
  rates: Map<string, number>,
): number {
  const rate = rates.get(currency.toUpperCase());
  if (!rate) return 0;
  return amount / rate;
}
