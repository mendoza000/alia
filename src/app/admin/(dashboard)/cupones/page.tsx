import { getAllCoupons } from "@/lib/admin/coupon-queries";
import { CouponTable } from "@/components/admin/coupon-table";
import { CouponSheet } from "@/components/admin/coupon-sheet";
import { PageHeader } from "@/components/admin/page-header";

export default async function CuponesPage() {
    const coupons = await getAllCoupons();

    return (
        <div className="space-y-6">
            <PageHeader
                title="Cupones"
                description="Gestiona los cupones de descuento"
                actions={<CouponSheet />}
            />

            <CouponTable coupons={coupons} />
        </div>
    );
}
