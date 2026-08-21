import type { PayoutType } from "@/generated/prisma/enums";
import type { PayoutSettings } from "@/lib/admin/payout-settings-queries";

export const PAYOUT_TYPES: PayoutType[] = ["RECURRING", "NEW", "LOYAL", "LOYAL_NEW"];

export const PAYOUT_TYPE_LABELS: Record<PayoutType, string> = {
  RECURRING: "Comisión recurrente",
  NEW: "Comisión nuevo",
  LOYAL: "Comisión leal",
  LOYAL_NEW: "Comisión leal nuevo",
};

export function getPayoutTypeRate(
  settings: PayoutSettings,
  payoutType: PayoutType,
): number {
  switch (payoutType) {
    case "RECURRING":
      return settings.recurringClientRatePercent;
    case "NEW":
      return settings.newClientRatePercent;
    case "LOYAL":
      return settings.loyalRatePercent;
    case "LOYAL_NEW":
      return settings.loyalNewRatePercent;
  }
}
