import countryToCurrency from "country-to-currency";

export const SUPPORTED_CURRENCIES: string[] = [
  ...new Set(Object.values(countryToCurrency)),
].sort();

export function getCurrencyLabel(code: string): string {
  try {
    return new Intl.DisplayNames(["es"], { type: "currency" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function suggestCurrencyFromCountry(country: string | null): string {
  if (!country) return "USD";
  return (countryToCurrency as Record<string, string>)[country] ?? "USD";
}

export function formatCurrencyAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(amount);
}
