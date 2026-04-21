import { getAllCoupons } from "@/lib/admin/coupon-queries";
import { CouponTable } from "@/components/admin/coupon-table";
import { CouponSheet } from "@/components/admin/coupon-sheet";

export default async function CuponesPage() {
  const coupons = await getAllCoupons();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Cupones</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los cupones de descuento
          </p>
        </div>
        <CouponSheet />
      </div>

      <CouponTable coupons={coupons} />
    </div>
  );
}
